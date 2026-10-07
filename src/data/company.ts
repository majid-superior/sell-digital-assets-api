import { companyRepository } from "../database/repositories/company.repository.js";
import type { CompanyEntity } from "../database/types.js";
import { COLOR_HEX_MAP, TOKENS } from "../theme/index.js";

export { COLOR_HEX_MAP, TOKENS };

export interface CompanyTheme {
  tokens: typeof TOKENS;
  palette: typeof COLOR_HEX_MAP;
}

export interface CompanyLogo {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface CompanyFavicon {
  url: string;
  type: string;
}

export interface CompanyContact {
  email: string;
  phone: string;
  supportUrl: string;
}

export interface CompanyAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  formatted: string;
}

export interface CompanyLinks {
  website: string;
}

export interface CompanyCopyright {
  year: number;
  holder: string;
  text: string;
}

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

export const TOP_CURRENCIES: CurrencyInfo[] = [
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "USD", name: "United States Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "AED", name: "United Arab Emirates Dirham", symbol: "AED" },
];

export const defaultCurrency: CurrencyInfo = {
  code: "PKR",
  name: "Pakistani Rupee",
  symbol: "₨",
};

export interface CompanyInfo {
  name: string;
  shortName: string;
  title: string;
  tagline: string;
  description: string;
  logo: CompanyLogo;
  favicon: CompanyFavicon;
  contact: CompanyContact;
  address: CompanyAddress;
  links: CompanyLinks;
  copyright: CompanyCopyright;
  defaultCurrency?: string | undefined;
  currency?: CurrencyInfo | undefined;
  platformFeePercent?: number | undefined;
  payoutMinimum?: number | undefined;
  raw?: CompanyEntity | undefined;
  theme: CompanyTheme;
}

export const defaultCompany: CompanyInfo = {
  name: "Sell Digital Assets",
  shortName: "Sell Digital Assets",
  title: "Sell Digital Assets",
  tagline: "System Status & Observability Dashboard",
  description:
    "Enterprise-grade digital assets marketplace and license distribution REST API platform.",
  logo: {
    url: "/logo.png",
    alt: "Sell Digital Assets Logo",
    width: 48,
    height: 48,
  },
  favicon: {
    url: "/favicon.ico",
    type: "image/x-icon",
  },
  contact: {
    email: "support@selldigitalassets.com",
    phone: "+00 (012) 345-6789",
    supportUrl: "https://selldigitalassets.com/support",
  },
  address: {
    street: "Ring Road",
    city: "Lahore",
    state: "Punjab",
    postalCode: "000000",
    country: "Pakistan",
    formatted: "Ring Road, Lahore, Punjab 000000, Pakistan",
  },
  links: {
    website: "https://selldigitalassets.com",
  },
  copyright: {
    year: new Date().getFullYear(),
    holder: "Sell Digital Assets Inc.",
    text: "Sell Digital Assets • Digital Assets Marketplace",
  },
  defaultCurrency: defaultCurrency.code,
  currency: defaultCurrency,
  platformFeePercent: 5.0,
  payoutMinimum: 25000.0,
  theme: {
    tokens: TOKENS,
    palette: COLOR_HEX_MAP,
  },
};

export const defaultCompanyEntity: CompanyEntity = {
  id: 1,
  company_name: defaultCompany.shortName,
  legal_name: defaultCompany.copyright.holder,
  tagline: defaultCompany.tagline,
  description: defaultCompany.description,
  logo_url: defaultCompany.logo.url,
  logo_dark_url: "/logo-dark.png",
  favicon_url: defaultCompany.favicon.url,
  cover_banner_url: "/banner.png",
  support_email: defaultCompany.contact.email,
  contact_email: defaultCompany.contact.email,
  support_phone: defaultCompany.contact.phone,
  support_url: defaultCompany.contact.supportUrl,
  address_line1: defaultCompany.address.street,
  city: defaultCompany.address.city,
  state: defaultCompany.address.state,
  postal_code: defaultCompany.address.postalCode,
  country: defaultCompany.address.country,
  default_currency: defaultCompany.defaultCurrency ?? "PKR",
  currency: defaultCurrency,
  platform_fee_percent: defaultCompany.platformFeePercent ?? 5.0,
  payout_minimum: defaultCompany.payoutMinimum ?? 25000.0,
  social_links: {},
  metadata: {
    links: defaultCompany.links,
    copyright: defaultCompany.copyright,
  },
};

export function mapEntityToCompanyInfo(entity: CompanyEntity): CompanyInfo {
  const metadata = (
    entity.metadata &&
    typeof entity.metadata === "object" &&
    !Array.isArray(entity.metadata)
      ? entity.metadata
      : {}
  ) as Record<string, any>;

  const addressStreet = entity.address_line1 ?? "";
  const addressCity = entity.city ?? "";
  const addressState = entity.state ?? "";
  const addressPostal = entity.postal_code ?? "";
  const addressCountry = entity.country ?? "";
  const formattedAddress = [
    addressStreet,
    addressCity,
    addressState,
    addressPostal,
    addressCountry,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    name: entity.company_name,
    shortName: entity.company_name,
    title: entity.company_name,
    tagline: entity.tagline ?? "",
    description: entity.description ?? "",
    logo: {
      url: entity.logo_url ?? "",
      alt: `${entity.company_name} Logo`,
      width: 48,
      height: 48,
    },
    favicon: {
      url: entity.favicon_url ?? "",
      type: "image/x-icon",
    },
    contact: {
      email: entity.support_email,
      phone: entity.support_phone ?? "",
      supportUrl: entity.support_url ?? "",
    },
    address: {
      street: addressStreet,
      city: addressCity,
      state: addressState,
      postalCode: addressPostal,
      country: addressCountry,
      formatted: formattedAddress,
    },
    links: {
      website: (metadata.links as any)?.website ?? "",
    },
    copyright: {
      year: (metadata.copyright as any)?.year ?? new Date().getFullYear(),
      holder: entity.legal_name,
      text: (metadata.copyright as any)?.text ?? "",
    },
    defaultCurrency: entity.default_currency,
    currency:
      entity.currency && typeof entity.currency === "object"
        ? (entity.currency as CurrencyInfo)
        : (TOP_CURRENCIES.find((c) => c.code === entity.default_currency) ?? defaultCurrency),
    platformFeePercent:
      entity.platform_fee_percent !== undefined
        ? Number(entity.platform_fee_percent)
        : undefined,
    payoutMinimum:
      entity.payout_minimum !== undefined
        ? Number(entity.payout_minimum)
        : undefined,
    raw: entity,
    theme: {
      tokens: TOKENS,
      palette: COLOR_HEX_MAP,
    },
  };
}

let cachedCompany: CompanyInfo = defaultCompany;
let lastFetched = 0;
const CACHE_TTL_MS = 60000; // 1 minute in-memory cache

export async function getCompanyInfo(
  forceRefresh = false,
): Promise<CompanyInfo> {
  const now = Date.now();
  if (!forceRefresh && lastFetched > 0 && now - lastFetched < CACHE_TTL_MS) {
    return cachedCompany;
  }

  try {
    const entity = await companyRepository.getCompany();
    if (entity) {
      cachedCompany = mapEntityToCompanyInfo(entity);
      lastFetched = now;
    }
  } catch (_err) {
    // Graceful fallback to default/cached data if database connection is pending
  }

  return cachedCompany;
}

export function refreshCompanyCache(entity: CompanyEntity): void {
  cachedCompany = mapEntityToCompanyInfo(entity);
  lastFetched = Date.now();
}

// Live Proxy allowing synchronous access to database-backed company details
export const company: CompanyInfo = new Proxy(defaultCompany, {
  get(_target, prop: keyof CompanyInfo) {
    return cachedCompany[prop];
  },
});

export default company;
