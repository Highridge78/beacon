import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

/**
 * Contact Form Present
 *
 * Broadened from type="email"/type="tel" only to also detect:
 * - name/id/placeholder/aria-label/autocomplete containing "email"/"phone"
 * - associated <label> text containing "email"/"phone"
 * - embedded third-party forms (HubSpot, Jotform, Typeform, Google Forms, etc.)
 * - mailto: links as a weak contact path
 *
 * React forms commonly use type="text" with name="email" or placeholder="Email",
 * so the old type-only check produced false WARN on valid forms.
 */

const EMAIL_HINT = /e-?mail/i;
const PHONE_HINT = /(phone|tel(?:ephone)?|mobile|cell)/i;

/**
 * Check whether a single input/textarea element looks like it captures
 * an email or phone, by inspecting multiple attributes + associated label.
 */
function fieldCapturesContact(
  $: cheerio.CheerioAPI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $field: cheerio.Cheerio<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $form: cheerio.Cheerio<any>,
): boolean {
  // Fast path: explicit type
  const type = $field.attr("type") || "";
  if (type === "email" || type === "tel") return true;

  // Gather all hint-bearing attributes
  const id = $field.attr("id") || "";
  const labelText = id ? $form.find(`label[for="${id}"]`).text() : "";
  // Also check labels that wrap the input (no `for` attribute)
  const wrappingLabel = $field.closest("label").text();

  const blob = [
    $field.attr("name"),
    id,
    $field.attr("placeholder"),
    $field.attr("aria-label"),
    $field.attr("autocomplete"),
    labelText,
    wrappingLabel,
  ]
    .filter(Boolean)
    .join(" ");

  return EMAIL_HINT.test(blob) || PHONE_HINT.test(blob);
}

function inspectForms($: cheerio.CheerioAPI, html: string): {
  present: boolean;
  capturesContact: boolean;
  inputCount: number;
} {
  const forms = $("form");

  // Detect embedded third-party forms/widgets
  const embedded = $(
    [
      'iframe[src*="hubspot"]',
      'iframe[src*="jotform"]',
      'iframe[src*="typeform"]',
      'iframe[src*="docs.google.com/forms"]',
      'iframe[src*="formstack"]',
      'iframe[src*="wufoo"]',
      'iframe[src*="calendly"]',
      'div[class*="hs-form"]',
      'div[data-form]',
    ].join(", "),
  );

  // Also detect via raw HTML includes (some embeds inject via script)
  const hasRawEmbed =
    html.includes("typeform") ||
    html.includes("jotform") ||
    html.includes("google.com/forms") ||
    html.includes("hubspot") ||
    html.includes("calendly");

  const mailto = $('a[href^="mailto:"]');

  // ── Native forms ──
  if (forms.length > 0) {
    let capturesContact = false;
    let totalInputs = 0;

    forms.each((_, form) => {
      const $form = $(form);
      const formInputs = $form.find("input, textarea, select").filter((_, f) => {
        // Exclude hidden honeypot fields
        const $f = $(f);
        const type = ($f.attr("type") || "").toLowerCase();
        return type !== "hidden" && !$f.attr("aria-hidden");
      });

      totalInputs = Math.max(totalInputs, formInputs.length);

      if (capturesContact) return;

      formInputs.each((_, f) => {
        if (capturesContact) return;
        const $f = $(f);
        if (fieldCapturesContact($, $f, $form)) {
          capturesContact = true;
        }
      });
    });

    return { present: true, capturesContact, inputCount: totalInputs };
  }

  // ── No native form, but embedded third-party form ──
  if (embedded.length > 0 || hasRawEmbed) {
    return { present: true, capturesContact: true, inputCount: 0 };
  }

  // ── Last resort: mailto link is a (weak) contact path ──
  if (mailto.length > 0) {
    return { present: true, capturesContact: true, inputCount: 0 };
  }

  return { present: false, capturesContact: false, inputCount: 0 };
}

export const formCheck: Check = {
  id: "contact-form",
  name: "Contact Form Present",
  category: "conversion",
  weight: 7,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);
    const { present, capturesContact, inputCount } = inspectForms($, ctx.html);

    if (!present) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "fail",
        message: "No contact form found on the page",
        details: "Not every visitor will call. A simple contact form captures leads who prefer not to pick up the phone.",
        recommendation: "Add a contact form with 3-5 fields: Name, Phone, Email, Service Needed, and a Message field. Place it on the homepage and on every service page.",
        impact: "30-40% of leads prefer forms over phone calls. Without a form, you're invisible to visitors who don't want to call — and that's nearly half your potential leads.",
      };
    }

    if (inputCount > 8) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Contact form found but has ${inputCount} fields — that's too many`,
        details: "Forms with more than 5-6 fields see a significant drop in completion rates. Keep it to: name, phone/email, and message.",
        recommendation: `Cut your form down to 3-5 fields. Remove anything that isn't essential for the initial contact. You can qualify leads after they submit.`,
        impact: `Every field you add drops form completion by 5-10%. A ${inputCount}-field form is losing you 30-50% of visitors who start filling it out.`,
      };
    }

    if (!capturesContact) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: "Form found but may be missing email or phone field",
        details: "Make sure your form collects at least a phone number or email so you can follow up.",
        recommendation: "Add a phone number field (or at least an email field) to your contact form. Without contact info, you can't follow up.",
        impact: "A form that doesn't collect a phone number or email is a dead end. You're collecting lead intent but losing the ability to close.",
      };
    }

    return {
      id: this.id, name: this.name, category: this.category, weight: this.weight,
      status: "pass",
      message: `Contact form found with ${inputCount} field${inputCount !== 1 ? "s" : ""}`,
    };
  },
};
