/**
 * URL fetcher — downloads a page and builds the AuditContext.
 *
 * Hardened so that a *failed* read can never masquerade as a real low score.
 * A blocked fetch, an error page, a bot-challenge interstitial, or a
 * client-side-rendered shell now THROWS with a clear message. The callers
 * (CLI, server.js, api/audit.js) already catch and surface errors, so the
 * user sees an honest "couldn't read this site" instead of a fake F.
 */

import type { AuditContext } from "./types.js";

const DEFAULT_TIMEOUT = 30_000;
const MAX_ATTEMPTS = 2; // one retry for transient blocks/timeouts

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

/** Minimum visible (tag-stripped) text length for a real homepage. */
const MIN_VISIBLE_TEXT = 500;

/** Markers that indicate a bot-challenge / interstitial rather than the real site. */
const CHALLENGE_MARKERS = [
  "just a moment",
  "cf-browser-verification",
  "cf-challenge",
  "checking your browser",
  "attention required",
  "ddos protection by",
  "please enable javascript and cookies",
  "captcha-delivery",
  "px-captcha",
  "incapsula incident",
  "request unsuccessful",
  "access denied",
];

/** Markers that indicate a client-side-rendered app shell (no server HTML to read). */
const SPA_SHELL_MARKERS = [
  "__next_data__",
  'id="__next"',
  'id="root"',
  "data-reactroot",
  "ng-version",
  "__nuxt__",
  "data-server-rendered",
];

function visibleTextLength(html: string): number {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length;
}

function looksLikeChallenge(html: string): boolean {
  const lower = html.toLowerCase();
  return CHALLENGE_MARKERS.some((m) => lower.includes(m));
}

function looksLikeSpaShell(html: string, visibleLen: number): boolean {
  if (visibleLen >= MIN_VISIBLE_TEXT) return false; // it has real content; not a bare shell
  const lower = html.toLowerCase();
  return SPA_SHELL_MARKERS.some((m) => lower.includes(m));
}

export async function fetchPage(inputUrl: string): Promise<AuditContext> {
  // Normalize URL
  let url = inputUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  let lastErr: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
        signal: controller.signal,
      });

      const ttfb = Date.now() - startTime;
      const html = await response.text();
      const loadTime = Date.now() - startTime;

      // --- READ-INTEGRITY GATES -------------------------------------------
      // A failed read must never be scored as a real (low) website.

      // 1. HTTP error status — we did not get the real page.
      if (response.status >= 400) {
        throw new Error(
          `Site returned HTTP ${response.status}. Beacon could not read the real page ` +
            `(often bot protection or the site being down). Verify the site manually before scoring.`,
        );
      }

      // 2. Empty / near-empty body.
      const visibleLen = visibleTextLength(html);
      if (html.trim().length === 0) {
        throw new Error(
          "Site returned an empty response. Beacon could not read the page — verify manually before scoring.",
        );
      }

      // 3. Bot-challenge / interstitial page (Cloudflare, captcha, WAF block).
      if (looksLikeChallenge(html) && visibleLen < MIN_VISIBLE_TEXT) {
        throw new Error(
          "Site is behind bot protection (challenge/interstitial page detected). " +
            "Beacon was served a block page, not the real site. Score would be meaningless — verify manually.",
        );
      }

      // 4. Client-side-rendered shell — no server HTML for Cheerio to read.
      if (looksLikeSpaShell(html, visibleLen)) {
        throw new Error(
          "Site renders its content with JavaScript (client-side app shell). " +
            "Beacon reads raw HTML only, so it cannot see this page's real content and would understate it. " +
            "Flag this site for manual review rather than scoring it.",
        );
      }

      // 5. Suspiciously thin content with no SPA markers — still not a real read.
      if (visibleLen < MIN_VISIBLE_TEXT) {
        throw new Error(
          `Site returned only ${visibleLen} characters of visible text — too little to be a real homepage. ` +
            "Likely a partial load, redirect interstitial, or block. Verify manually before scoring.",
        );
      }
      // --------------------------------------------------------------------

      // Flatten headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      const finalUrl = response.url;

      return {
        url,
        finalUrl,
        html,
        statusCode: response.status,
        headers,
        ttfb,
        loadTime,
        isHttps: finalUrl.startsWith("https://"),
      };
    } catch (err) {
      lastErr = err;
      // Read-integrity errors are deterministic — don't waste a retry on them.
      const msg = err instanceof Error ? err.message : "";
      const isIntegrityError =
        msg.startsWith("Site returned") ||
        msg.startsWith("Site is behind") ||
        msg.startsWith("Site renders");
      if (isIntegrityError || attempt === MAX_ATTEMPTS) {
        throw err;
      }
      // otherwise: transient (network/abort) — loop and retry once
    } finally {
      clearTimeout(timeout);
    }
  }

  // Should be unreachable, but satisfies the type checker.
  throw lastErr instanceof Error
    ? lastErr
    : new Error("Fetch failed for an unknown reason.");
}
