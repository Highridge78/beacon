/**
 * Shared utility for extracting content from JS-rendered pages.
 *
 * Many modern sites (React, Vue, Next.js, iHouseWeb, etc.) store their
 * page content inside <script> state blobs like __PRELOADED_STATE__ or
 * __NEXT_DATA__. Since Beacon fetches raw HTML (no headless browser),
 * this module extracts and decodes that embedded content so checks can
 * find signals that are invisible in the DOM.
 */

const STATE_PATTERNS = [
  /__PRELOADED_STATE__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/,
  /__NEXT_DATA__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/,
  /window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});\s*<\/script>/,
];

/**
 * Extract all decoded HTML widget values from embedded state blobs.
 * Returns an array of decoded HTML strings from JSON "html" fields.
 */
export function extractEmbeddedHtmlWidgets(html: string): string[] {
  const widgets: string[] = [];

  for (const pattern of STATE_PATTERNS) {
    const match = html.match(pattern);
    if (!match) continue;

    const stateStr = match[1];
    const htmlValues = stateStr.matchAll(/"html"\s*:\s*"((?:[^"\\]|\\.)*)"/g);
    for (const m of htmlValues) {
      const decoded = m[1]
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
        .replace(/\\u003c/gi, "<")
        .replace(/\\u003e/gi, ">")
        .replace(/\\u0026/gi, "&")
        .replace(/\\u002F/gi, "/");
      widgets.push(decoded);
    }

    if (widgets.length > 0) return widgets;
  }

  return widgets;
}

/**
 * Get the full raw state string from the first matched embedded state blob.
 */
export function extractRawStateBlob(html: string): string | null {
  for (const pattern of STATE_PATTERNS) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Check whether the page appears to be JS-rendered (has state blobs
 * and very little visible DOM content).
 */
export function isJsRenderedPage(html: string): boolean {
  return STATE_PATTERNS.some((p) => p.test(html));
}

/**
 * Extract navigation links from embedded state data.
 * Returns array of {name, href, subLinks} objects.
 */
export function extractEmbeddedNavigation(html: string): Array<{ name: string; href: string | null; subLinks: Array<{ name: string; href: string }> }> {
  const rawState = extractRawStateBlob(html);
  if (!rawState) return [];

  const navLinks: Array<{ name: string; href: string | null; subLinks: Array<{ name: string; href: string }> }> = [];

  // Look for navigation JSON structures: "links":[{"name":"...","href":"...","subLinks":[...]}]
  const navMatch = rawState.match(/"navigation"\s*:\s*\{\s*"links"\s*:\s*(\[[\s\S]*?\])\s*\}/);
  if (navMatch) {
    try {
      const links = JSON.parse(navMatch[1]);
      for (const link of links) {
        navLinks.push({
          name: link.name || "",
          href: link.href || null,
          subLinks: (link.subLinks || []).map((s: any) => ({ name: s.name || "", href: s.href || "" })),
        });
      }
    } catch {
      // JSON parse failed — try regex fallback
    }
  }

  // Regex fallback for navigation items
  if (navLinks.length === 0) {
    const linkMatches = rawState.matchAll(/"name"\s*:\s*"([^"]+)"\s*,\s*"href"\s*:\s*("[^"]*"|null)/g);
    for (const m of linkMatches) {
      const name = m[1];
      const href = m[2] === "null" ? null : m[2].replace(/"/g, "");
      // Skip non-nav items (settings, fields, etc.)
      if (name.length < 40 && !name.includes("\\") && /^[A-Za-z\s&'-]+$/.test(name)) {
        navLinks.push({ name, href, subLinks: [] });
      }
    }
  }

  return navLinks;
}

/**
 * Extract social media links from embedded state data.
 * Returns array of {platform, url} objects.
 */
export function extractEmbeddedSocialLinks(html: string): Array<{ platform: string; url: string }> {
  const rawState = extractRawStateBlob(html);
  if (!rawState) return [];

  const socials: Array<{ platform: string; url: string }> = [];
  const seen = new Set<string>();

  // Pattern: "socialIconInformation":{"Facebook":{"enabled":"Y","target":"Facebook","url":"..."}, ...}
  const socialMatch = rawState.match(/"socialIconInformation"\s*:\s*\{([\s\S]*?)\}\s*\}/);
  if (socialMatch) {
    const block = socialMatch[1];
    const entries = block.matchAll(/"(\w+)"\s*:\s*\{\s*"enabled"\s*:\s*"([YN])"\s*,\s*"target"\s*:\s*"[^"]*"\s*,\s*"url"\s*:\s*"([^"]*)"/g);
    for (const m of entries) {
      const platform = m[1].toLowerCase();
      const enabled = m[2];
      const url = m[3].replace(/\\\//g, "/");
      if (enabled === "Y" && url && !seen.has(platform)) {
        socials.push({ platform, url });
        seen.add(platform);
      }
    }
  }

  // Also look for social links array pattern
  const socialArrayMatch = rawState.match(/"socialLinks"\s*:\s*(\[[\s\S]*?\])/);
  if (socialArrayMatch) {
    try {
      const links = JSON.parse(socialArrayMatch[1].replace(/\\\//g, "/"));
      for (const link of links) {
        const platform = (link.type || link.name || "").toLowerCase();
        if (platform && link.url && !seen.has(platform)) {
          socials.push({ platform, url: link.url });
          seen.add(platform);
        }
      }
    } catch { /* ignore */ }
  }

  return socials;
}
