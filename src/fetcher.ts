/**
 * URL fetcher — downloads a page and builds the AuditContext
 */

import type { AuditContext } from "./types.js";

const DEFAULT_TIMEOUT = 30_000;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

export async function fetchPage(inputUrl: string): Promise<AuditContext> {
  // Normalize URL
  let url = inputUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

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
  } finally {
    clearTimeout(timeout);
  }
}
