import * as cheerio from "cheerio";
import type { Check, AuditContext, CheckResult } from "../types.js";

export const formCheck: Check = {
  id: "contact-form",
  name: "Contact Form Present",
  category: "conversion",
  weight: 7,

  run(ctx: AuditContext): CheckResult {
    const $ = cheerio.load(ctx.html);

    const forms = $("form");
    if (forms.length === 0) {
      // Check for common embedded form patterns
      const hasEmbed =
        ctx.html.includes("typeform") ||
        ctx.html.includes("jotform") ||
        ctx.html.includes("google.com/forms") ||
        ctx.html.includes("hubspot") ||
        ctx.html.includes("calendly");

      if (hasEmbed) {
        return {
          id: this.id, name: this.name, category: this.category, weight: this.weight,
          status: "pass",
          message: "Embedded form or scheduling widget detected",
        };
      }

      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "fail",
        message: "No contact form found on the page",
        details: "Not every visitor will call. A simple contact form captures leads who prefer not to pick up the phone.",
        recommendation: "Add a contact form with 3-5 fields: Name, Phone, Email, Service Needed, and a Message field. Place it on the homepage and on every service page.",
        impact: "30-40% of leads prefer forms over phone calls. Without a form, you're invisible to visitors who don't want to call — and that's nearly half your potential leads.",
      };
    }

    // Check form quality
    const formInputs = forms.first().find("input, textarea, select");
    const inputCount = formInputs.length;

    const hasEmailOrPhone =
      formInputs.filter(
        '[name*="email"], [name*="phone"], [type="email"], [type="tel"], [placeholder*="email" i], [placeholder*="phone" i]',
      ).length > 0;

    if (inputCount > 8) {
      return {
        id: this.id, name: this.name, category: this.category, weight: this.weight,
        status: "warn",
        message: `Contact form found but has ${inputCount} fields — that's too many`,
        details: "Forms with more than 5-6 fields see a significant drop in completion rates. Keep it to: name, phone/email, and message.",
        recommendation: `Cut your form down to 3-5 fields. Remove anything that isn't essential for the initial contact. You can qualify leads after they submit.`,
        impact: "Every field you add drops form completion by 5-10%. A ${inputCount}-field form is losing you 30-50% of visitors who start filling it out.",
      };
    }

    if (!hasEmailOrPhone) {
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
      message: `Contact form found with ${inputCount} fields`,
    };
  },
};
