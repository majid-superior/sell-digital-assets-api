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
  platformFeePercent?: number | undefined;
  payoutMinimum?: number | undefined;
  raw?: CompanyEntity | undefined;
  theme: CompanyTheme;
}

export const defaultCompany: CompanyInfo = {
  name: "Sell Digital Assets API",
  shortName: "Sell Digital Assets",
  title: "Sell Digital Assets API",
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
  defaultCurrency: "USD",
  platformFeePercent: 5.0,
  payoutMinimum: 50.0,
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
  default_currency: defaultCompany.defaultCurrency ?? "USD",
  platform_fee_percent: defaultCompany.platformFeePercent ?? 5.0,
  payout_minimum: defaultCompany.payoutMinimum ?? 50.0,
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

  const addressStreet =
    entity.address_line1 || (metadata.address as any)?.street || "Ring Road";
  const addressCity =
    entity.city || (metadata.address as any)?.city || "Lahore";
  const addressState =
    entity.state || (metadata.address as any)?.state || "Punjab";
  const addressPostal =
    entity.postal_code || (metadata.address as any)?.postalCode || "000000";
  const addressCountry =
    entity.country || (metadata.address as any)?.country || "Pakistan";
  const formattedAddress = `${addressStreet}, ${addressCity}, ${addressState} ${addressPostal}, ${addressCountry}`;

  const currentYear = new Date().getFullYear();

  return {
    name: entity.company_name || "Sell Digital Assets API",
    shortName: entity.company_name || "Sell Digital Assets",
    title: entity.company_name || "Sell Digital Assets API",
    tagline: entity.tagline || "System Status & Observability Dashboard",
    description:
      entity.description ||
      "Enterprise-grade digital assets marketplace and license distribution REST API platform.",
    logo: {
      url: entity.logo_url || "/logo.png",
      alt: `${entity.company_name || "Sell Digital Assets"} Logo`,
      width: 48,
      height: 48,
    },
    favicon: {
      url: entity.favicon_url || "/favicon.ico",
      type: "image/x-icon",
    },
    contact: {
      email: entity.support_email || "support@selldigitalassets.com",
      phone: entity.support_phone || "+00 (012) 345-6789",
      supportUrl: entity.support_url || "https://selldigitalassets.com/support",
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
      website:
        (metadata.links as any)?.website || "https://selldigitalassets.com",
    },
    copyright: {
      year: (metadata.copyright as any)?.year || currentYear,
      holder: entity.legal_name || "Sell Digital Assets Inc.",
      text:
        (metadata.copyright as any)?.text ||
        `${entity.company_name || "Sell Digital Assets"} • Digital Assets Marketplace`,
    },
    defaultCurrency:
      entity.default_currency || defaultCompany.defaultCurrency || "USD",
    platformFeePercent:
      entity.platform_fee_percent !== undefined
        ? Number(entity.platform_fee_percent)
        : (defaultCompany.platformFeePercent ?? 5.0),
    payoutMinimum:
      entity.payout_minimum !== undefined
        ? Number(entity.payout_minimum)
        : (defaultCompany.payoutMinimum ?? 50.0),
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
