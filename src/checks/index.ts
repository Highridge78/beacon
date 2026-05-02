/**
 * Check registry — all audit checks registered here
 */

import type { Check } from "../types.js";
import { phoneCheck, clickToCallCheck } from "./phone.js";
import { ctaCheck } from "./cta.js";
import { formCheck } from "./form.js";
import { localBusinessSchemaCheck, serviceSchemaCheck } from "./schema.js";
import { metaTitleCheck, metaDescriptionCheck, h1Check } from "./meta.js";
import {
  sslCheck,
  mobileViewportCheck,
  pageSpeedCheck,
  imageAltCheck,
  privacyPolicyCheck,
} from "./technical.js";
import {
  reviewsCheck,
  trustSignalsCheck,
  addressCheck,
  socialLinksCheck,
} from "./trust.js";
import { internalLinksCheck } from "./links.js";

/**
 * All checks in execution order.
 * Conversion and trust checks are weighted higher because
 * they directly impact whether a local business gets leads.
 */
export const allChecks: Check[] = [
  // Conversion (what generates leads)
  phoneCheck,           // weight: 8
  clickToCallCheck,     // weight: 7
  ctaCheck,             // weight: 9
  formCheck,            // weight: 7

  // SEO (what drives traffic)
  metaTitleCheck,       // weight: 6
  metaDescriptionCheck, // weight: 5
  h1Check,              // weight: 5
  localBusinessSchemaCheck, // weight: 7
  serviceSchemaCheck,   // weight: 4
  imageAltCheck,        // weight: 4
  internalLinksCheck,   // weight: 4

  // Trust (what builds confidence)
  reviewsCheck,         // weight: 7
  trustSignalsCheck,    // weight: 6
  addressCheck,         // weight: 5
  socialLinksCheck,     // weight: 3
  privacyPolicyCheck,   // weight: 4

  // Technical (foundation)
  sslCheck,             // weight: 8
  mobileViewportCheck,  // weight: 8
  pageSpeedCheck,       // weight: 6
];
