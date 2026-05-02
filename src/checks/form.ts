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
      // Check for common embedded form patterns (Typeform, Jotform, etc.)
      const hasEmbed =
        ctx.html.includes("typeform") ||
        ctx.html.includes("jotform") ||
        ctx.html.includes("google.com/forms") ||
        ctx.html.includes("hubspot") ||
        ctx.html.includes("calendly");

      if (hasEmbed) {
        return {
          id: this.id,
          name: this.name,
          category: this.category,
          weight: this.weight,
          status: "pass",
          message: "Embedded form or scheduling widget detected",
        };
      }

      return {
        id: this.id,
        name: this.name,
        category: this.category,
        weight: this.weight,
        status: "fail",
        message: "No contact form found on the page",
        details:
          "Not every visitor will call. A simple contact form (name, email/phone, message) captures leads who prefer not to pick up the phone.",
      };
    }

    // Check form quality
    const formInputs = forms.first().find("input, textarea, select");
    const inputCount = formInputs.length;

    // Check for essential fields
    const hasNameField = formInputs.filter('[name*="name"], [placeholder*="name" i], [type="text"]').length > 0;
    const hasEmailOrPhone =
      formInputs.filter(
        '[name*="email"], [name*="phone"], [type="email"], [type="tel"], [placeholder*="email" i], [placeholder*="phone" i]',
      ).length > 0;

    if (inputCount > 8) {
      return {
        id: this.id,
        name: this.name,
        category: this.category,
        weight: this.weight,
        status: "warn",
        message: `Contact form found but has ${inputCount} fields — that's too many`,
        details:
          "Forms with more than 5-6 fields see a significant drop in completion rates. Keep it to: name, phone/email, and message. Every extra field loses you leads.",
      };
    }

    if (!hasEmailOrPhone) {
      return {
        id: this.id,
        name: this.name,
        category: this.category,
        weight: this.weight,
        status: "warn",
        message: "Form found but may be missing email or phone field",
        details: "Make sure your form collects at least a phone number or email so you can follow up.",
      };
    }

    return {
      id: this.id,
      name: this.name,
      category: this.category,
      weight: this.weight,
      status: "pass",
      message: `Contact form found with ${inputCount} fields`,
    };
  },
};
