/**
 * Business type detection — analyzes page content to determine
 * what kind of business the site represents, so recommendations
 * can be contextually relevant.
 *
 * This is what makes Beacon feel like it was written specifically
 * for each prospect's industry.
 */

import * as cheerio from "cheerio";

export type BusinessType =
  | "real-estate"
  | "restaurant"
  | "medical"
  | "dental"
  | "legal"
  | "auto"
  | "beauty"
  | "fitness"
  | "contractor"
  | "professional"
  | "retail"
  | "general";

interface TypeSignal {
  type: BusinessType;
  weight: number;
  pattern: RegExp;
}

/**
 * Keyword patterns weighted by specificity.
 * Higher weight = stronger signal for that business type.
 */
const TYPE_SIGNALS: TypeSignal[] = [
  // Real estate — strong signals
  { type: "real-estate", weight: 5, pattern: /\brealt(y|or)\b/i },
  { type: "real-estate", weight: 5, pattern: /\bMLS\b/ },
  { type: "real-estate", weight: 4, pattern: /\blisting(s)?\b/i },
  { type: "real-estate", weight: 4, pattern: /\bproperty\s+(search|listing|management)\b/i },
  { type: "real-estate", weight: 3, pattern: /\bbuy(ing)?\s+(a\s+)?home\b/i },
  { type: "real-estate", weight: 3, pattern: /\bsell(ing)?\s+(your\s+)?home\b/i },
  { type: "real-estate", weight: 4, pattern: /\bhome\s+value\b/i },
  { type: "real-estate", weight: 3, pattern: /\bopen\s+house\b/i },
  { type: "real-estate", weight: 3, pattern: /\bshowing(s)?\b/i },
  { type: "real-estate", weight: 4, pattern: /\bbroker(age)?\b/i },
  { type: "real-estate", weight: 3, pattern: /\bbuyer(s)?\s*(and|&|or)\s*seller(s)?\b/i },
  { type: "real-estate", weight: 3, pattern: /\bclosing\s+(cost|process)\b/i },
  { type: "real-estate", weight: 2, pattern: /\bbed(room)?s?\b.*\bbath(room)?s?\b/i },
  { type: "real-estate", weight: 3, pattern: /\bsq\s*\.?\s*ft\b/i },
  { type: "real-estate", weight: 3, pattern: /\bmarket\s+(analysis|report|update|value)\b/i },
  { type: "real-estate", weight: 2, pattern: /\bfirst.time\s+(home\s*)?buyer/i },
  { type: "real-estate", weight: 3, pattern: /\bmortgage\b/i },
  { type: "real-estate", weight: 2, pattern: /\bpre.approv(ed|al)\b/i },
  { type: "real-estate", weight: 3, pattern: /\bagent\b.*\breal\s*estate\b/i },

  // Restaurant
  { type: "restaurant", weight: 5, pattern: /\bmenu\b.*\b(appetizer|entree|dessert|drink)\b/i },
  { type: "restaurant", weight: 4, pattern: /\breservation(s)?\b/i },
  { type: "restaurant", weight: 3, pattern: /\bdine\s+(in|with)\b/i },
  { type: "restaurant", weight: 3, pattern: /\btakeout\b|\btake.out\b|\bdelivery\b/i },
  { type: "restaurant", weight: 3, pattern: /\bcatering\b/i },
  { type: "restaurant", weight: 2, pattern: /\bappetizer|entree|dessert\b/i },

  // Medical
  { type: "medical", weight: 5, pattern: /\bpatient\s+(portal|form|registration)\b/i },
  { type: "medical", weight: 5, pattern: /\bschedule\s+(an\s+)?appointment\b.*\b(clinic|practice|doctor|physician|provider)\b/i },
  { type: "medical", weight: 3, pattern: /\bphysician|doctor|\bmd\b/i },
  { type: "medical", weight: 4, pattern: /\bhealth\s*(care)?\s*(provider|center|clinic)\b/i },
  { type: "medical", weight: 4, pattern: /\bmedical\s+(practice|center|clinic|care|group)\b/i },
  { type: "medical", weight: 3, pattern: /\bprimary\s+care\b|\bfamily\s+medicine\b/i },

  // Dental
  { type: "dental", weight: 5, pattern: /\bdentist(ry)?\b/i },
  { type: "dental", weight: 4, pattern: /\bdental\b/i },
  { type: "dental", weight: 3, pattern: /\bteeth\s+(whitening|cleaning)\b/i },
  { type: "dental", weight: 3, pattern: /\borthodont/i },

  // Legal
  { type: "legal", weight: 5, pattern: /\battorney(s)?\b/i },
  { type: "legal", weight: 5, pattern: /\blaw\s+(firm|office|group|practice)\b/i },
  { type: "legal", weight: 4, pattern: /\blawyer(s)?\b/i },
  { type: "legal", weight: 3, pattern: /\bfree\s+consultation\b.*\blegal\b/i },
  { type: "legal", weight: 3, pattern: /\bpersonal\s+injury\b/i },
  { type: "legal", weight: 3, pattern: /\bdivorce|custody|estate\s+planning\b/i },

  // Auto
  { type: "auto", weight: 5, pattern: /\bauto\s*(motive)?\s*(repair|body|shop|service)\b/i },
  { type: "auto", weight: 4, pattern: /\boil\s+change\b|\bbrake\s+(repair|service)\b/i },
  { type: "auto", weight: 3, pattern: /\btire(s)?\s+(rotation|service|shop)\b/i },
  { type: "auto", weight: 3, pattern: /\btransmission\b|\bengine\s+repair\b/i },
  { type: "auto", weight: 4, pattern: /\bdealer(ship)?\b/i },

  // Beauty
  { type: "beauty", weight: 5, pattern: /\bsalon\b|\bspa\b|\bbeauty\b/i },
  { type: "beauty", weight: 4, pattern: /\bhair(cut|style|color)\b/i },
  { type: "beauty", weight: 3, pattern: /\bmanicure|pedicure|facial|massage\b/i },
  { type: "beauty", weight: 3, pattern: /\bbarber(shop)?\b/i },

  // Fitness
  { type: "fitness", weight: 5, pattern: /\bgym\b|\bfitness\s+(center|studio)\b/i },
  { type: "fitness", weight: 4, pattern: /\bpersonal\s+train(er|ing)\b/i },
  { type: "fitness", weight: 3, pattern: /\byoga|pilates|crossfit\b/i },
  { type: "fitness", weight: 3, pattern: /\bmembership\s+(plan|option)\b/i },

  // Contractor / home services (default local business)
  { type: "contractor", weight: 4, pattern: /\broof(ing|er)?\b/i },
  { type: "contractor", weight: 4, pattern: /\bplumb(ing|er)\b/i },
  { type: "contractor", weight: 4, pattern: /\belectric(al|ian)\b/i },
  { type: "contractor", weight: 4, pattern: /\bhvac\b|\bheating\s*(and|&)\s*cooling\b/i },
  { type: "contractor", weight: 3, pattern: /\bcontractor\b/i },
  { type: "contractor", weight: 3, pattern: /\bremodel(ing)?\b/i },
  { type: "contractor", weight: 3, pattern: /\bfloor(ing)?\b/i },
  { type: "contractor", weight: 3, pattern: /\bpainting\b|\bpaint(er)?\b/i },
  { type: "contractor", weight: 3, pattern: /\blandscap(ing|er)\b/i },
  { type: "contractor", weight: 3, pattern: /\bpest\s+control\b/i },
  { type: "contractor", weight: 3, pattern: /\bfree\s+estimate\b/i },
  { type: "contractor", weight: 2, pattern: /\blicensed\s*(and|&)\s*insured\b/i },
  { type: "contractor", weight: 3, pattern: /\bsame.day\s+service\b/i },
  { type: "contractor", weight: 3, pattern: /\bsiding\b|\bgutter\b|\bconcrete\b/i },

  // Web design / digital agency
  { type: "professional", weight: 5, pattern: /\bweb\s*(site)?\s*design\b/i },
  { type: "professional", weight: 4, pattern: /\blead\s*(generation|-gen)\b/i },
  { type: "professional", weight: 4, pattern: /\bdigital\s*(marketing|agency)\b/i },
  { type: "professional", weight: 3, pattern: /\bseo\b.*\bwebsite\b/i },

  // Professional services
  { type: "professional", weight: 4, pattern: /\baccounting\b|\baccountant\b|\bcpa\b/i },
  { type: "professional", weight: 4, pattern: /\bfinancial\s+(advisor|planning|consultant)\b/i },
  { type: "professional", weight: 3, pattern: /\bconsulting\b|\bconsultant\b/i },
  { type: "professional", weight: 3, pattern: /\binsurance\s+(agent|agency|broker)\b/i },

  // Retail
  { type: "retail", weight: 4, pattern: /\badd\s+to\s+cart\b|\bshop\s+now\b/i },
  { type: "retail", weight: 3, pattern: /\bproduct(s)?\b.*\bprice\b/i },
  { type: "retail", weight: 3, pattern: /\bfree\s+shipping\b/i },
];

/**
 * Detect the business type from page HTML content.
 * Returns the best-matching type with a confidence score.
 */
export function detectBusinessType(html: string): { type: BusinessType; confidence: number } {
  const $ = cheerio.load(html);
  const bodyText = $("body").text();
  const title = $("title").text();
  const metaDesc = $('meta[name="description"]').attr("content") || "";
  const h1 = $("h1").first().text();

  // Combine key text sources, giving more weight to title/h1/meta
  const keyText = `${title} ${title} ${h1} ${h1} ${metaDesc} ${metaDesc}`;
  const fullText = `${keyText} ${bodyText}`;

  const scores: Record<BusinessType, number> = {
    "real-estate": 0,
    "restaurant": 0,
    "medical": 0,
    "dental": 0,
    "legal": 0,
    "auto": 0,
    "beauty": 0,
    "fitness": 0,
    "contractor": 0,
    "professional": 0,
    "retail": 0,
    "general": 0,
  };

  for (const signal of TYPE_SIGNALS) {
    // Check key text (title, h1, meta) — double weight
    const keyMatches = (keyText.match(signal.pattern) || []).length;
    // Check full body text
    const fullMatches = (fullText.match(new RegExp(signal.pattern, "gi")) || []).length;

    scores[signal.type] += keyMatches * signal.weight * 2;
    scores[signal.type] += fullMatches * signal.weight;
  }

  // Find the winner
  const entries = Object.entries(scores) as [BusinessType, number][];
  entries.sort((a, b) => b[1] - a[1]);

  const topScore = entries[0][1];
  const topType = entries[0][0];
  const secondScore = entries[1]?.[1] || 0;

  // Confidence: how much the top type dominates
  // If no signals at all, return "general"
  if (topScore === 0) {
    return { type: "general", confidence: 0 };
  }

  // Confidence based on absolute score and margin over second place
  const margin = topScore - secondScore;
  const confidence = Math.min(1, (topScore / 50) * (margin > 5 ? 1 : margin / 10 + 0.5));

  return { type: topType, confidence: Math.round(confidence * 100) / 100 };
}
