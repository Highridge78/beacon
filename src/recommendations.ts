/**
 * Contextual recommendation engine — provides business-type-aware
 * recommendation text for every check.
 *
 * Instead of "Get Your Free Estimate" for a real estate agent,
 * Beacon now says "Schedule a Showing" or "Get Your Home Value."
 *
 * This is what makes a Beacon report feel custom-written for each prospect.
 */

import type { BusinessType } from "./business-type.js";
import type { CheckResult } from "./types.js";

/**
 * Business context — the language palette for each industry.
 * Checks interpolate from these when generating recommendations.
 */
export interface BusinessContext {
  /** Display label for the industry */
  label: string;
  /** Primary CTA examples */
  ctaExamples: string[];
  /** What the form should collect */
  formFields: string[];
  /** Navigation items that make sense */
  navItems: string[];
  /** Trust language specific to this industry */
  trustPhrases: string[];
  /** Offer/value prop examples */
  offerExamples: string[];
  /** What "service" means in this context */
  serviceNoun: string;
  /** What customers are looking for */
  customerGoal: string;
  /** Phone/contact language */
  contactPhrase: string;
  /** What a "lead" looks like */
  leadType: string;
  /** Example headline */
  headlineExample: string;
  /** Navigation service examples */
  navServiceExamples: string;
  /** What "licensed/insured" translates to */
  credentialLanguage: string;
}

const BUSINESS_CONTEXTS: Record<BusinessType, BusinessContext> = {
  "real-estate": {
    label: "Real Estate",
    ctaExamples: ["Schedule a Showing", "Get Your Home Value", "Browse Available Properties", "Request a Free Consultation"],
    formFields: ["Name", "Phone", "Email", "Are you buying or selling?", "Message"],
    navItems: ["Listings", "Buy", "Sell", "About", "Contact"],
    trustPhrases: ["local market expertise", "years of real estate experience", "homes sold", "client success stories", "neighborhood knowledge"],
    offerExamples: ["Free Home Valuation", "Free Buyer Consultation", "Complimentary Market Analysis", "No-Obligation Listing Presentation"],
    serviceNoun: "real estate services",
    customerGoal: "buy or sell a home",
    contactPhrase: "buyer and seller inquiries",
    leadType: "buyer or seller leads",
    headlineExample: "Your Trusted [City] Real Estate Agent — Helping You Buy & Sell with Confidence.",
    navServiceExamples: "\"Listings\", \"Buy\", \"Sell\", \"Home Valuation\", \"Neighborhoods\"",
    credentialLanguage: "local market expertise, transaction history, and client testimonials",
  },
  "restaurant": {
    label: "Restaurant",
    ctaExamples: ["View Our Menu", "Make a Reservation", "Order Online", "Book a Table"],
    formFields: ["Name", "Phone", "Email", "Party size", "Date/Time", "Special requests"],
    navItems: ["Menu", "Reservations", "Order Online", "About", "Contact"],
    trustPhrases: ["locally sourced", "award-winning", "chef-driven", "years serving the community"],
    offerExamples: ["Happy Hour Specials", "Group Dining Packages", "Loyalty Program", "First-Time Diner Offer"],
    serviceNoun: "dining experience",
    customerGoal: "make a reservation or order food",
    contactPhrase: "reservations and event inquiries",
    leadType: "reservation and order leads",
    headlineExample: "Award-Winning [Cuisine] in [City] — Reserve Your Table Today.",
    navServiceExamples: "\"Menu\", \"Reservations\", \"Catering\", \"Private Events\", \"Gift Cards\"",
    credentialLanguage: "awards, press mentions, chef credentials, and community involvement",
  },
  "medical": {
    label: "Medical Practice",
    ctaExamples: ["Schedule an Appointment", "Request a Consultation", "Call Our Office", "New Patient Registration"],
    formFields: ["Name", "Phone", "Email", "Insurance provider", "Reason for visit", "Preferred date"],
    navItems: ["Services", "Our Providers", "Patient Resources", "Insurance", "Contact"],
    trustPhrases: ["board-certified", "years of clinical experience", "compassionate care", "patient-centered approach"],
    offerExamples: ["Free Initial Consultation", "Accepting New Patients", "Same-Day Appointments Available", "Telehealth Available"],
    serviceNoun: "healthcare services",
    customerGoal: "schedule a medical appointment",
    contactPhrase: "patient inquiries and appointment requests",
    leadType: "new patient inquiries",
    headlineExample: "Compassionate Healthcare in [City] — Board-Certified Providers, Now Accepting New Patients.",
    navServiceExamples: "\"Services\", \"Our Providers\", \"New Patients\", \"Telehealth\", \"Insurance\"",
    credentialLanguage: "board certifications, clinical specialties, and patient outcomes",
  },
  "dental": {
    label: "Dental Practice",
    ctaExamples: ["Book Your Appointment", "Schedule a Cleaning", "Request a Consultation", "New Patient Special"],
    formFields: ["Name", "Phone", "Email", "Insurance provider", "Service needed", "Preferred date"],
    navItems: ["Services", "Our Dentists", "New Patients", "Insurance", "Contact"],
    trustPhrases: ["gentle dentistry", "family-friendly", "state-of-the-art technology", "years of dental experience"],
    offerExamples: ["New Patient Special", "Free Whitening Consultation", "Financing Available", "Emergency Appointments"],
    serviceNoun: "dental care",
    customerGoal: "book a dental appointment",
    contactPhrase: "patient scheduling and dental inquiries",
    leadType: "new patient appointments",
    headlineExample: "Gentle Family Dentistry in [City] — New Patients Welcome, Financing Available.",
    navServiceExamples: "\"Services\", \"Cosmetic Dentistry\", \"New Patients\", \"Emergency Care\", \"Insurance\"",
    credentialLanguage: "dental credentials, certifications, continuing education, and patient reviews",
  },
  "legal": {
    label: "Law Firm",
    ctaExamples: ["Free Case Evaluation", "Schedule a Consultation", "Call for Legal Help", "Get Legal Advice Now"],
    formFields: ["Name", "Phone", "Email", "Case type", "Brief description", "Preferred contact method"],
    navItems: ["Practice Areas", "Our Attorneys", "Case Results", "Reviews", "Contact"],
    trustPhrases: ["experienced attorneys", "proven track record", "millions recovered", "aggressive representation"],
    offerExamples: ["Free Case Evaluation", "No Fee Unless We Win", "Free Initial Consultation", "24/7 Availability"],
    serviceNoun: "legal services",
    customerGoal: "get legal representation",
    contactPhrase: "case inquiries and legal consultations",
    leadType: "potential client consultations",
    headlineExample: "Experienced [Practice Area] Attorneys in [City] — Free Consultation, No Fee Unless We Win.",
    navServiceExamples: "\"Practice Areas\", \"Our Attorneys\", \"Case Results\", \"Testimonials\", \"Free Consultation\"",
    credentialLanguage: "bar admissions, case results, peer ratings, and client testimonials",
  },
  "auto": {
    label: "Auto Service",
    ctaExamples: ["Schedule Service", "Get a Free Quote", "Book an Appointment", "Call for Same-Day Service"],
    formFields: ["Name", "Phone", "Email", "Vehicle year/make/model", "Service needed", "Preferred date"],
    navItems: ["Services", "Specials", "About", "Reviews", "Contact"],
    trustPhrases: ["ASE-certified", "trusted mechanics", "honest pricing", "years of auto service experience"],
    offerExamples: ["Free Diagnostic", "First-Time Customer Discount", "Seasonal Specials", "Price Match Guarantee"],
    serviceNoun: "auto services",
    customerGoal: "get their vehicle serviced",
    contactPhrase: "service appointments and repair inquiries",
    leadType: "service appointment requests",
    headlineExample: "Trusted Auto Repair in [City] — ASE-Certified, Honest Pricing, Same-Day Service.",
    navServiceExamples: "\"Oil Change\", \"Brake Service\", \"Tire Service\", \"Engine Repair\", \"Diagnostics\"",
    credentialLanguage: "ASE certifications, manufacturer training, and warranty credentials",
  },
  "beauty": {
    label: "Salon / Spa",
    ctaExamples: ["Book an Appointment", "Schedule Your Visit", "View Services & Pricing", "Book Online"],
    formFields: ["Name", "Phone", "Email", "Service interested in", "Preferred stylist", "Preferred date/time"],
    navItems: ["Services", "Our Team", "Gallery", "Book Online", "Contact"],
    trustPhrases: ["skilled stylists", "luxury experience", "client-focused", "years in the beauty industry"],
    offerExamples: ["New Client Special", "Referral Discount", "Seasonal Packages", "Loyalty Rewards"],
    serviceNoun: "beauty services",
    customerGoal: "book a beauty appointment",
    contactPhrase: "appointment bookings and service inquiries",
    leadType: "appointment bookings",
    headlineExample: "Premier Hair & Beauty in [City] — Book Your Transformation Today.",
    navServiceExamples: "\"Hair\", \"Color\", \"Skincare\", \"Nails\", \"Packages\", \"Book Online\"",
    credentialLanguage: "stylist certifications, years of experience, and before/after portfolio",
  },
  "fitness": {
    label: "Fitness / Gym",
    ctaExamples: ["Start Your Free Trial", "Join Now", "Book a Class", "Get a Free Consultation"],
    formFields: ["Name", "Phone", "Email", "Fitness goals", "Experience level", "Preferred schedule"],
    navItems: ["Classes", "Memberships", "Trainers", "Schedule", "Contact"],
    trustPhrases: ["certified trainers", "proven results", "supportive community", "state-of-the-art equipment"],
    offerExamples: ["Free Trial Week", "No Sign-Up Fee", "First Session Free", "Referral Bonus"],
    serviceNoun: "fitness programs",
    customerGoal: "find a gym or training program",
    contactPhrase: "membership inquiries and class bookings",
    leadType: "membership and trial sign-ups",
    headlineExample: "Transform Your Fitness in [City] — Certified Trainers, Free Trial Week.",
    navServiceExamples: "\"Classes\", \"Personal Training\", \"Memberships\", \"Schedule\", \"Free Trial\"",
    credentialLanguage: "trainer certifications, client transformations, and facility features",
  },
  "contractor": {
    label: "Contractor / Home Services",
    ctaExamples: ["Get Your Free Estimate", "Call Now for Same-Day Service", "Book Your Free Consultation", "Request a Quote"],
    formFields: ["Name", "Phone", "Email", "Service needed", "Message"],
    navItems: ["Services", "About", "Reviews", "Gallery", "Contact"],
    trustPhrases: ["licensed & insured", "years of experience", "satisfaction guaranteed", "locally owned"],
    offerExamples: ["Free Estimate", "100% Satisfaction Guarantee", "Financing Available", "Seasonal Discount"],
    serviceNoun: "services",
    customerGoal: "hire a reliable contractor",
    contactPhrase: "service requests and estimates",
    leadType: "service leads",
    headlineExample: "Expert [Service] in [City] — Licensed, Insured, Guaranteed.",
    navServiceExamples: "\"Roof Repair\", \"New Installation\", \"Storm Damage\", \"Gutters\", \"Free Estimate\"",
    credentialLanguage: "licensing, insurance, bonding, and industry certifications",
  },
  "professional": {
    label: "Professional Services",
    ctaExamples: ["Schedule a Consultation", "Get Started Today", "Request a Free Assessment", "Contact Our Team"],
    formFields: ["Name", "Phone", "Email", "Service interested in", "Company (optional)", "Message"],
    navItems: ["Services", "About", "Team", "Resources", "Contact"],
    trustPhrases: ["certified professionals", "proven track record", "trusted advisors", "client-focused approach"],
    offerExamples: ["Free Initial Consultation", "Complimentary Assessment", "Custom Solutions", "Flexible Engagement Models"],
    serviceNoun: "professional services",
    customerGoal: "find a trusted advisor or firm",
    contactPhrase: "client inquiries and consultations",
    leadType: "consultation requests",
    headlineExample: "Trusted [Service] in [City] — Expert Guidance, Proven Results.",
    navServiceExamples: "\"Services\", \"Industries\", \"Case Studies\", \"Resources\", \"Contact\"",
    credentialLanguage: "professional certifications, industry experience, and client outcomes",
  },
  "retail": {
    label: "Retail / E-commerce",
    ctaExamples: ["Shop Now", "Browse Collection", "View Products", "Get Free Shipping"],
    formFields: ["Name", "Email", "Phone (optional)", "Question about products"],
    navItems: ["Shop", "Collections", "Sale", "About", "Contact"],
    trustPhrases: ["trusted by thousands", "quality guaranteed", "fast shipping", "easy returns"],
    offerExamples: ["Free Shipping Over $X", "First Order Discount", "Loyalty Rewards", "Satisfaction Guarantee"],
    serviceNoun: "products",
    customerGoal: "find and purchase products",
    contactPhrase: "product questions and order support",
    leadType: "purchase conversions",
    headlineExample: "Premium [Products] — Free Shipping, Easy Returns, Satisfaction Guaranteed.",
    navServiceExamples: "\"Shop All\", \"New Arrivals\", \"Best Sellers\", \"Sale\", \"Gift Cards\"",
    credentialLanguage: "product quality, return policy, shipping reliability, and customer reviews",
  },
  "general": {
    label: "Local Business",
    ctaExamples: ["Contact Us", "Get Started", "Learn More", "Request Information"],
    formFields: ["Name", "Phone", "Email", "How can we help?", "Message"],
    navItems: ["Services", "About", "Reviews", "Contact"],
    trustPhrases: ["trusted local business", "years of experience", "customer satisfaction", "community commitment"],
    offerExamples: ["Free Consultation", "Special Offer", "Satisfaction Guarantee", "Referral Program"],
    serviceNoun: "services",
    customerGoal: "find a reliable local business",
    contactPhrase: "general inquiries",
    leadType: "leads",
    headlineExample: "Trusted [Service] in [City] — Quality Work, Guaranteed Results.",
    navServiceExamples: "specific service names instead of a generic \"Services\" link",
    credentialLanguage: "years of experience, certifications, and customer testimonials",
  },
};

/**
 * Get the business context for a given type.
 */
export function getBusinessContext(type: BusinessType): BusinessContext {
  return BUSINESS_CONTEXTS[type] || BUSINESS_CONTEXTS["general"];
}

/**
 * Override map: checkId → status → function that returns { recommendation, impact, details }
 * Only non-pass statuses get overrides (pass results don't show recommendations).
 */
type RecommendationOverride = (ctx: BusinessContext) => {
  recommendation?: string;
  impact?: string;
  details?: string;
};

type StatusOverrides = Partial<Record<"fail" | "warn", RecommendationOverride>>;

const OVERRIDES: Record<string, StatusOverrides> = {
  "cta-above-fold": {
    fail: (ctx) => ({
      recommendation: `Add a CTA button to your hero section immediately. Use action language: "${ctx.ctaExamples[0]}", "${ctx.ctaExamples[1]}", or "${ctx.ctaExamples[2]}".`,
      impact: "This is the single highest-impact fix. A page without a CTA is a dead end — visitors literally cannot take the next step, even if they want to.",
      details: `Every ${ctx.label.toLowerCase()} website needs a clear CTA button — "${ctx.ctaExamples[0]}", "${ctx.ctaExamples[1]}". Without one, visitors leave without converting.`,
    }),
    warn: (ctx) => ({
      recommendation: `Add a large, high-contrast CTA button ("${ctx.ctaExamples[0]}" or "${ctx.ctaExamples[1]}") to your hero section, above the fold. Make it the most visually prominent element.`,
      impact: "Visitors who can't find a next step within 5 seconds leave. Moving a CTA above the fold typically increases conversions 20-30%.",
    }),
  },

  "phone-number": {
    fail: (ctx) => ({
      recommendation: `Add your phone number to the header/navigation area with a click-to-call link. Make it prominent for ${ctx.contactPhrase}.`,
      impact: `60% of local searches result in a phone call. No visible phone number means you're losing the majority of your highest-intent ${ctx.leadType}.`,
    }),
    warn: (ctx) => ({
      recommendation: `Move the phone number to your header/navigation bar so it's visible for ${ctx.contactPhrase}. On mobile, use a sticky "Call Now" button that's always visible.`,
      impact: "Phone numbers buried in the footer get 30-40% fewer calls than those in the header. Every scroll between the visitor and your number costs you leads.",
    }),
  },

  "contact-form": {
    fail: (ctx) => ({
      recommendation: `Add a contact form with ${ctx.formFields.length} fields: ${ctx.formFields.join(", ")}. Place it prominently on the homepage.`,
      impact: `30-40% of ${ctx.leadType} prefer forms over phone calls. Without a form, you're invisible to visitors who don't want to call — and that's nearly half your potential leads.`,
      details: "Not every visitor will call. A simple contact form captures leads who prefer not to pick up the phone.",
    }),
    warn: (ctx) => ({
      recommendation: `Simplify your form to ${ctx.formFields.length} essential fields: ${ctx.formFields.join(", ")}. Remove anything that isn't essential for the initial contact.`,
    }),
  },

  "headline-clarity": {
    fail: (ctx) => ({
      recommendation: `Add a clear H1 headline that communicates what you do and why visitors should care. Example: "${ctx.headlineExample}"`,
      impact: "Without a clear headline, visitors bounce within 3 seconds. You're losing the majority of your traffic before they even scroll.",
    }),
    warn: (ctx) => ({
      recommendation: `Strengthen your headline by adding specificity. Strong example: "${ctx.headlineExample}"`,
      impact: "A stronger headline can increase time-on-page by 20-30%, giving visitors more reason to engage and convert.",
    }),
  },

  "sticky-header-cta": {
    fail: (ctx) => ({
      recommendation: `Make your header sticky (CSS \`position: sticky\`) and add a "${ctx.ctaExamples[0]}" button or phone number to it.`,
    }),
    warn: (ctx) => ({
      recommendation: `Add a CTA button ("${ctx.ctaExamples[0]}" or "${ctx.ctaExamples[1]}") or a clickable phone number to your sticky header.`,
    }),
  },

  "offer-presence": {
    fail: (ctx) => ({
      recommendation: `Add these value signals prominently: (1) "${ctx.offerExamples[0]}" in the hero, (2) "${ctx.offerExamples[1]}" near testimonials, (3) "${ctx.offerExamples[2]}" near your services.`,
      details: `Without a clear offer, visitors browse and leave. "${ctx.offerExamples[0]}" is the minimum. Stack multiple offers to create urgency.`,
    }),
    warn: (ctx) => ({
      recommendation: `Add at least 2 more value signals: "${ctx.offerExamples[1]}", "${ctx.offerExamples[2]}", or "${ctx.offerExamples[3]}".`,
      details: `Stack multiple offers to reduce hesitation. The winning formula for ${ctx.label.toLowerCase()}: ${ctx.offerExamples.slice(0, 3).join(" + ")}.`,
    }),
  },

  "navigation-clarity": {
    fail: (ctx) => ({
      recommendation: `Replace generic nav items with clear labels. Your nav should include: ${ctx.navItems.join(", ")}. Add ${ctx.navServiceExamples} to make it immediately obvious what you offer.`,
      details: `"Home | About | Contact" tells visitors nothing about what you do. Your nav should immediately communicate your ${ctx.serviceNoun}.`,
    }),
    warn: (ctx) => ({
      recommendation: `Add specific pages to the nav: ${ctx.navServiceExamples}. Don't hide everything behind a generic "Services" link.`,
      details: `Don't make visitors click "Services" to find out what you offer. List specific ${ctx.serviceNoun} in the nav or use a dropdown.`,
    }),
  },

  "reviews-testimonials": {
    fail: (ctx) => ({
      recommendation: `Add 3-5 client testimonials with: full name, ${ctx.serviceNoun} received, and star rating. Better yet, embed your Google Reviews directly. Place them mid-page where visitors are evaluating whether to ${ctx.customerGoal}.`,
      impact: `Testimonials are the #1 trust builder. Sites without reviews see 35-50% lower contact rates because visitors can't verify your quality.`,
    }),
  },

  "trust-signals": {
    fail: (ctx) => ({
      recommendation: `Add a prominent trust bar: "${ctx.trustPhrases[0]}" | "${ctx.trustPhrases[1]}" | "${ctx.trustPhrases[2]}" | "${ctx.trustPhrases[3]}". This is a 30-minute fix with major impact.`,
      details: `Visitors looking to ${ctx.customerGoal} need reassurance. Add: ${ctx.trustPhrases.slice(0, 4).join(", ")}.`,
    }),
    warn: (ctx) => ({
      recommendation: `Create a trust bar near the top of your page showing: "${ctx.trustPhrases.slice(0, 4).join('" | "')}" Use icons for visual impact.`,
      details: `Add more trust builders specific to ${ctx.label.toLowerCase()}: ${ctx.trustPhrases.slice(0, 4).join(", ")}.`,
    }),
  },

  "trust-stacking": {
    fail: (ctx) => ({
      recommendation: `Start with these 4: (1) "${ctx.trustPhrases[0]}", (2) "${ctx.trustPhrases[1]}", (3) Real client testimonials, (4) "${ctx.trustPhrases[3]}". Place them prominently on the homepage.`,
      details: `This site gives visitors no evidence that this is an established, credible ${ctx.label.toLowerCase()} business. This is the #1 conversion killer.`,
    }),
    warn: (ctx) => ({
      recommendation: `Build your trust stack with signals that matter for ${ctx.label.toLowerCase()}: ${ctx.credentialLanguage}.`,
      details: `The highest-converting ${ctx.label.toLowerCase()} sites stack 5+ trust signals: ${ctx.trustPhrases.join(", ")}, and client testimonials.`,
    }),
  },

  "footer-completeness": {
    fail: (ctx) => ({
      recommendation: `Build a complete footer: business name, phone (clickable), address/service area, hours, email, links to ${ctx.navItems.slice(0, 3).join(", ")}, and social icons.`,
    }),
    warn: (ctx) => ({
      recommendation: `Complete your footer by adding the missing items. For a ${ctx.label.toLowerCase()} business, ensure it includes: phone, address, hours, and links to ${ctx.navItems.join(", ")}.`,
    }),
  },

  "google-reviews": {
    fail: (ctx) => ({
      recommendation: `Create a Google Business Profile (if you don't have one), collect 10+ reviews from past clients, then embed them on your homepage with a widget.`,
      impact: `Businesses with visible Google Reviews see 35-50% higher contact rates. For ${ctx.label.toLowerCase()}, reviews are often the deciding factor.`,
    }),
  },

  "schema-local-business": {
    fail: (ctx) => ({
      recommendation: `Add LocalBusiness schema markup (JSON-LD) with your business name, address, phone, hours, and service area. This is how Google understands your ${ctx.label.toLowerCase()} business.`,
    }),
  },

  "service-area-clarity": {
    fail: (ctx) => ({
      recommendation: `Add your primary city to the H1, meta title, and footer. Create a dedicated "Areas We Serve" page listing every area you cover. This is critical for people searching for ${ctx.serviceNoun} in their area.`,
    }),
    warn: (ctx) => ({
      recommendation: `Add an "Areas Served" section listing every city/neighborhood you work in. Mention your primary area in the H1, meta title, and meta description.`,
    }),
  },

  "social-links": {
    fail: (ctx) => ({
      recommendation: `Create and link to your Facebook Business Page and Google Business Profile. These are free, take 15 minutes each, and immediately boost your online presence for ${ctx.contactPhrase}.`,
    }),
    warn: (ctx) => ({
      recommendation: `Add links to at least Facebook and Google Business Profile. Place social icons in the footer.`,
    }),
  },

  "meta-title": {
    fail: (ctx) => ({
      recommendation: `Add a meta title that includes your ${ctx.serviceNoun}, primary city, and a benefit. Keep it under 60 characters.`,
    }),
    warn: (ctx) => ({
      recommendation: `Optimize your meta title to include your location and primary ${ctx.serviceNoun}. Keep it under 60 characters for full display in search results.`,
    }),
  },

  "internal-links": {
    fail: (ctx) => ({
      recommendation: `Create internal links to every important page: ${ctx.navItems.join(", ")}, reviews, service areas. Use descriptive anchor text like "${ctx.navItems[0].toLowerCase()} page" instead of "click here".`,
    }),
    warn: (ctx) => ({
      recommendation: `Add links to every key page from your homepage: ${ctx.navItems.join(", ")}. Each page should link back to related content. Aim for 15+ internal links on the homepage.`,
    }),
  },
};

/**
 * Apply business-type-aware recommendations to check results.
 * This is a post-processing step that replaces generic contractor language
 * with industry-specific language.
 */
export function applyContextualRecommendations(
  checks: CheckResult[],
  businessType: BusinessType,
): CheckResult[] {
  const ctx = getBusinessContext(businessType);

  return checks.map((check) => {
    // Only override non-pass results
    if (check.status === "pass" || check.status === "skip") {
      return check;
    }

    const overrides = OVERRIDES[check.id];
    if (!overrides) return check;

    const statusOverride = overrides[check.status as "fail" | "warn"];
    if (!statusOverride) return check;

    const override = statusOverride(ctx);

    return {
      ...check,
      recommendation: override.recommendation ?? check.recommendation,
      impact: override.impact ?? check.impact,
      details: override.details ?? check.details,
    };
  });
}
