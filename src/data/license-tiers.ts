/**
 * Default License Pricing Tiers Configuration
 * Sourced during database initialization and reset migrations.
 */

export interface LicenseTierConfig {
  tier_type: "personal" | "commercial" | "extended";
  name: string;
  default_price: number;
  description: string;
  license_terms_summary: string;
  max_activations: number;
  display_order: number;
  is_active: boolean;
}

export const defaultLicenseTiers: LicenseTierConfig[] = [
  {
    tier_type: "personal",
    name: "Personal License",
    default_price: 0,
    description: "For individual use in personal, non-commercial projects.",
    license_terms_summary: "Single personal project",
    max_activations: 1,
    display_order: 1,
    is_active: true,
  },
  {
    tier_type: "commercial",
    name: "Commercial License",
    default_price: 0,
    description:
      "Standard commercial licensing for client deliverables and commercial work.",
    license_terms_summary: "Up to 5 commercial projects",
    max_activations: 5,
    display_order: 2,
    is_active: true,
  },
  {
    tier_type: "extended",
    name: "Extended License",
    default_price: 0,
    description:
      "Full enterprise and resale rights for SaaS, templates, and unlimited distributions.",
    license_terms_summary: "Unlimited projects and resale rights",
    max_activations: 25,
    display_order: 3,
    is_active: true,
  },
];

export const DEFAULT_LICENSE_TIERS = defaultLicenseTiers;

export const defaultLicenseTierMap = new Map<string, LicenseTierConfig>(
  defaultLicenseTiers.map((tier) => [tier.tier_type, tier]),
);
