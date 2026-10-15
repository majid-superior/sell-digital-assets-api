import { organizationsRepository } from "../database/repositories/organizations.repository.js";
import { themeService } from "../modules/theme/theme.service.js";
import type { OrganizationEntity } from "../database/types.js";
import { COLOR_HEX_MAP, TOKENS } from "../theme/index.js";

export { COLOR_HEX_MAP, TOKENS };

export interface OrganizationTheme {
  tokens: typeof TOKENS;
  palette: typeof COLOR_HEX_MAP;
}

export interface OrganizationLogo {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface OrganizationFavicon {
  url: string;
  type: string;
}

export interface OrganizationContact {
  email: string;
  phone: string;
  supportUrl: string;
}

export interface OrganizationAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  formatted: string;
}

export interface OrganizationLinks {
  website: string;
}

export interface OrganizationCopyright {
  year: number;
  holder: string;
  text: string;
}

import {
  type CurrencyInfo,
  TOP_CURRENCIES,
  defaultCurrency,
} from "./currencies.js";
import { defaultTheme } from "./themes.js";

export type { CurrencyInfo };
export { TOP_CURRENCIES, defaultCurrency };

export interface SystemSettings {
  sessionIdleTimeoutMinutes: number;
  accessTokenTtlMinutes: number;
  refreshTokenTtlDays: number;
  rememberMeTtlDays: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  passwordMinLength: number;
  requireSpecialChar: boolean;
  allowUserRegistration: boolean;
  requireEmailVerification: boolean;
  maintenanceMode: boolean;
}

export const defaultSystemSettings: SystemSettings = {
  sessionIdleTimeoutMinutes: 30,
  accessTokenTtlMinutes: 15,
  refreshTokenTtlDays: 7,
  rememberMeTtlDays: 30,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  passwordMinLength: 4,
  requireSpecialChar: true,
  allowUserRegistration: true,
  requireEmailVerification: false,
  maintenanceMode: false,
};

export interface OrganizationInfo {
  name: string;
  shortName: string;
  title: string;
  tagline: string;
  description: string;
  logo: OrganizationLogo;
  favicon: OrganizationFavicon;
  contact: OrganizationContact;
  address: OrganizationAddress;
  links: OrganizationLinks;
  copyright: OrganizationCopyright;
  defaultCurrency?: string | undefined;
  currency?: CurrencyInfo | undefined;
  platformFeePercent?: number | undefined;
  payoutMinimum?: number | undefined;
  raw?: OrganizationEntity | undefined;
  theme: OrganizationTheme;
  systemSettings: SystemSettings;
}

export const defaultOrganization: OrganizationInfo = {
  name: "AssetDrop",
  shortName: "AssetDrop",
  title: "AssetDrop",
  tagline: "System Status & Observability Dashboard",
  description:
    "Enterprise-grade digital assets marketplace and license distribution REST API platform.",
  logo: {
    url: "/logo.png",
    alt: "AssetDrop Logo",
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
    holder: "AssetDrop Inc.",
    text: "AssetDrop • Digital Assets Marketplace",
  },
  defaultCurrency: defaultCurrency.code,
  currency: defaultCurrency,
  platformFeePercent: 5.0,
  payoutMinimum: 25000.0,
  theme: {
    tokens: TOKENS,
    palette: COLOR_HEX_MAP,
  },
  systemSettings: defaultSystemSettings,
};

export const defaultOrganizationEntity: OrganizationEntity = {
  id: 1,
  organization_name: defaultOrganization.shortName,
  legal_name: defaultOrganization.copyright.holder,
  tagline: defaultOrganization.tagline,
  description: defaultOrganization.description,
  logo_url: defaultOrganization.logo.url,
  logo_dark_url: "/logo-dark.png",
  favicon_url: defaultOrganization.favicon.url,
  cover_banner_url: "/banner.png",
  support_email: defaultOrganization.contact.email,
  contact_email: defaultOrganization.contact.email,
  support_phone: defaultOrganization.contact.phone,
  support_url: defaultOrganization.contact.supportUrl,
  address_line1: defaultOrganization.address.street,
  city: defaultOrganization.address.city,
  state: defaultOrganization.address.state,
  postal_code: defaultOrganization.address.postalCode,
  country: defaultOrganization.address.country,
  default_currency: defaultOrganization.defaultCurrency ?? "PKR",
  currency: defaultCurrency,
  platform_fee_percent: defaultOrganization.platformFeePercent ?? 5.0,
  payout_minimum: defaultOrganization.payoutMinimum ?? 25000.0,
  social_links: {},
  metadata: {
    links: defaultOrganization.links,
    copyright: defaultOrganization.copyright,
  },
  system_settings: defaultSystemSettings as unknown as Record<string, unknown>,
};

export function mapEntityToOrganizationInfo(
  entity: OrganizationEntity,
): OrganizationInfo {
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
    name: entity.organization_name,
    shortName: entity.organization_name,
    title: entity.organization_name,
    tagline: entity.tagline ?? "",
    description: entity.description ?? "",
    logo: {
      url: entity.logo_url ?? "",
      alt: `${entity.organization_name} Logo`,
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
        : (TOP_CURRENCIES.find((c) => c.code === entity.default_currency) ??
          defaultCurrency),
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
    systemSettings: (() => {
      const rawSystem =
        entity.system_settings &&
        typeof entity.system_settings === "object" &&
        !Array.isArray(entity.system_settings)
          ? entity.system_settings
          : metadata.system_settings &&
              typeof metadata.system_settings === "object" &&
              !Array.isArray(metadata.system_settings)
            ? metadata.system_settings
            : {};

      return {
        sessionIdleTimeoutMinutes:
          Number((rawSystem as any).sessionIdleTimeoutMinutes) ||
          defaultSystemSettings.sessionIdleTimeoutMinutes,
        accessTokenTtlMinutes:
          Number((rawSystem as any).accessTokenTtlMinutes) ||
          defaultSystemSettings.accessTokenTtlMinutes,
        refreshTokenTtlDays:
          Number((rawSystem as any).refreshTokenTtlDays) ||
          defaultSystemSettings.refreshTokenTtlDays,
        rememberMeTtlDays:
          Number((rawSystem as any).rememberMeTtlDays) ||
          defaultSystemSettings.rememberMeTtlDays,
        maxLoginAttempts:
          Number((rawSystem as any).maxLoginAttempts) ||
          defaultSystemSettings.maxLoginAttempts,
        lockoutDurationMinutes:
          Number((rawSystem as any).lockoutDurationMinutes) ||
          defaultSystemSettings.lockoutDurationMinutes,
        passwordMinLength:
          Number((rawSystem as any).passwordMinLength) ||
          defaultSystemSettings.passwordMinLength,
        requireSpecialChar: Boolean(
          (rawSystem as any).requireSpecialChar ??
          defaultSystemSettings.requireSpecialChar,
        ),
        allowUserRegistration: Boolean(
          (rawSystem as any).allowUserRegistration ??
          defaultSystemSettings.allowUserRegistration,
        ),
        requireEmailVerification: Boolean(
          (rawSystem as any).requireEmailVerification ??
          defaultSystemSettings.requireEmailVerification,
        ),
        maintenanceMode: Boolean(
          (rawSystem as any).maintenanceMode ??
          defaultSystemSettings.maintenanceMode,
        ),
      };
    })(),
  };
}

let cachedOrganization: OrganizationInfo = defaultOrganization;
let lastFetched = 0;
const CACHE_TTL_MS = 60000; // 1 minute in-memory cache

export function getSystemSettings(): SystemSettings {
  return cachedOrganization?.systemSettings || defaultSystemSettings;
}

export async function getOrganizationInfo(
  forceRefresh = false,
): Promise<OrganizationInfo> {
  const now = Date.now();
  if (!forceRefresh && lastFetched > 0 && now - lastFetched < CACHE_TTL_MS) {
    return cachedOrganization;
  }

  try {
    const [entity, activeTheme] = await Promise.all([
      organizationsRepository.getOrganization(),
      themeService.getActiveTheme(forceRefresh),
    ]);
    if (entity) {
      cachedOrganization = mapEntityToOrganizationInfo(entity);
      if (activeTheme?.color_hex_map) {
        cachedOrganization.theme.palette = activeTheme.color_hex_map as any;
      }
      lastFetched = now;
    }
  } catch (_err) {
    // Graceful fallback to default/cached data if database connection is pending
  }

  return cachedOrganization;
}

export function refreshOrganizationCache(entity: OrganizationEntity): void {
  cachedOrganization = mapEntityToOrganizationInfo(entity);
  lastFetched = Date.now();
}

// Live Proxy allowing synchronous access to database-backed organization details
export const organization: OrganizationInfo = new Proxy(defaultOrganization, {
  get(_target, prop: keyof OrganizationInfo) {
    return cachedOrganization[prop];
  },
});

export default organization;
