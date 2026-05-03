/**
 * Check registry — all checks available to Beacon
 */

import type { Check } from "../types.js";

// Conversion checks
import { ctaCheck } from "./cta.js";
import { phoneCheck, clickToCallCheck } from "./phone.js";
import { formCheck } from "./form.js";
import { stickyCtaCheck } from "./sticky-cta.js";
import { headlineCheck } from "./headline.js";
import { offersCheck } from "./offers.js";
import { navigationCheck } from "./navigation.js";

// SEO checks
import { metaTitleCheck, metaDescriptionCheck, h1Check } from "./meta.js";
import { localBusinessSchemaCheck, serviceSchemaCheck } from "./schema.js";
import { internalLinksCheck } from "./links.js";
import { serviceAreaCheck } from "./service-area.js";

// Trust checks
import { reviewsCheck, trustSignalsCheck, addressCheck, socialLinksCheck } from "./trust.js";
import { googleReviewsCheck } from "./google-reviews.js";
import { trustStackCheck } from "./trust-stack.js";
import { footerCheck } from "./footer.js";

// Technical checks
import { sslCheck, pageSpeedCheck, viewportCheck, imageAltCheck, privacyPolicyCheck } from "./technical.js";

/**
 * All registered checks, ordered by category and weight (highest first)
 */
export const allChecks: Check[] = [
  // 🎯 Conversion (8 checks)
  ctaCheck,           // weight 9
  headlineCheck,      // weight 8
  phoneCheck,         // weight 8
  stickyCtaCheck,     // weight 7
  formCheck,          // weight 7
  offersCheck,        // weight 6
  navigationCheck,    // weight 5

  // 🔍 SEO (7 checks)
  localBusinessSchemaCheck,  // weight 7
  metaTitleCheck,            // weight 6
  serviceAreaCheck,          // weight 6
  metaDescriptionCheck,      // weight 5
  h1Check,                   // weight 5
  serviceSchemaCheck,        // weight 4
  imageAltCheck,             // weight 4
  internalLinksCheck,        // weight 4

  // 🤝 Trust (7 checks)
  reviewsCheck,        // weight 7
  trustStackCheck,     // weight 7
  googleReviewsCheck,  // weight 6
  trustSignalsCheck,   // weight 6
  addressCheck,        // weight 5
  footerCheck,         // weight 5
  socialLinksCheck,    // weight 3
  privacyPolicyCheck,  // weight 3

  // ⚙️ Technical (2 checks)
  sslCheck,       // weight 8
  pageSpeedCheck, // weight 6

  // 📱 Mobile (2 checks)
  clickToCallCheck,  // weight 7
  viewportCheck,     // weight 6
];
