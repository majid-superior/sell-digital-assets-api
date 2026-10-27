/**
 * Default Promotional Banners Configuration
 * Sourced during database initialization and reset migrations for the Admin Marketing -> Banners feature.
 */

import type {
  BannerAppearance,
  BannerBadgeType,
} from "../database/repositories/banners.repository.js";

export interface BannerSeed {
  id: string;
  title: string;
  description: string | null;
  supportingText?: string | null;
  supporting_text?: string | null;
  badgeType?: BannerBadgeType;
  badge_type?: BannerBadgeType;
  ctaLabel?: string | null;
  cta_label?: string | null;
  ctaUrl?: string | null;
  cta_url?: string | null;
  showCta?: boolean;
  show_cta?: boolean;
  isDismissible?: boolean;
  is_dismissible?: boolean;
  appearance: BannerAppearance;
  priority: number;
  isActive: boolean;
  is_active: boolean;
  startsAt: string;
  starts_at: string;
  endsAt: string;
  ends_at: string;
  timezone: string;
  createdBy?: string | null;
  created_by?: string | null;
  createdAt: string;
  created_at: string;
  updatedAt: string;
  updated_at: string;
}

export const defaultBanners: BannerSeed[] = [
  {
    id: "b1000000-0000-4000-8000-000000000001",
    title: "New Year Creator Launchpad: 40% Off Premium Assets",
    description:
      "Kick off 2026 with curated 3D models, UI kits, and vector graphics at exclusive discounted rates.",
    supportingText: "Limited-time promotional pricing across all verified creators.",
    supporting_text: "Limited-time promotional pricing across all verified creators.",
    badgeType: "special_offer",
    badge_type: "special_offer",
    ctaLabel: "Explore Deals",
    cta_label: "Explore Deals",
    ctaUrl: "/explore?tag=special_offer",
    cta_url: "/explore?tag=special_offer",
    showCta: true,
    show_cta: true,
    isDismissible: true,
    is_dismissible: true,
    appearance: "primary",
    priority: 30,
    isActive: false,
    is_active: false,
    startsAt: "2026-01-01T00:00:00.000Z",
    starts_at: "2026-01-01T00:00:00.000Z",
    endsAt: "2026-12-31T23:59:59.000Z",
    ends_at: "2026-12-31T23:59:59.000Z",
    timezone: "UTC",
    createdBy: "00000000-0000-0000-0000-000000000001",
    created_by: "00000000-0000-0000-0000-000000000001",
    createdAt: "2026-01-01T00:00:00.000Z",
    created_at: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "b2000000-0000-4000-8000-000000000002",
    title: "Flash Sale: High-Resolution 3D & VFX Asset Bundles",
    description:
      "Instant download access to enterprise-grade VFX packs, character rigs, and PBR texture collections.",
    supportingText: "Commercial licenses included for all asset bundle downloads.",
    supporting_text: "Commercial licenses included for all asset bundle downloads.",
    badgeType: "flash_sale",
    badge_type: "flash_sale",
    ctaLabel: "Shop Bundles",
    cta_label: "Shop Bundles",
    ctaUrl: "/categories/3d-models",
    cta_url: "/categories/3d-models",
    showCta: true,
    show_cta: true,
    isDismissible: true,
    is_dismissible: true,
    appearance: "accent",
    priority: 20,
    isActive: false,
    is_active: false,
    startsAt: "2026-01-01T00:00:00.000Z",
    starts_at: "2026-01-01T00:00:00.000Z",
    endsAt: "2026-12-31T23:59:59.000Z",
    ends_at: "2026-12-31T23:59:59.000Z",
    timezone: "UTC",
    createdBy: "00000000-0000-0000-0000-000000000001",
    created_by: "00000000-0000-0000-0000-000000000001",
    createdAt: "2026-01-01T00:00:00.000Z",
    created_at: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "b3000000-0000-4000-8000-000000000003",
    title: "New Release: Production-Ready UI Kits & Design Systems",
    description:
      "Over 500+ customizable components in Figma and React for rapid application development.",
    supportingText: "Updated regularly with new responsive layout patterns.",
    supporting_text: "Updated regularly with new responsive layout patterns.",
    badgeType: "new_release",
    badge_type: "new_release",
    ctaLabel: "Browse UI Kits",
    cta_label: "Browse UI Kits",
    ctaUrl: "/categories/ui-and-ux-kits",
    cta_url: "/categories/ui-and-ux-kits",
    showCta: true,
    show_cta: true,
    isDismissible: true,
    is_dismissible: true,
    appearance: "secondary",
    priority: 10,
    isActive: false,
    is_active: false,
    startsAt: "2026-01-01T00:00:00.000Z",
    starts_at: "2026-01-01T00:00:00.000Z",
    endsAt: "2026-12-31T23:59:59.000Z",
    ends_at: "2026-12-31T23:59:59.000Z",
    timezone: "UTC",
    createdBy: "00000000-0000-0000-0000-000000000001",
    created_by: "00000000-0000-0000-0000-000000000001",
    createdAt: "2026-01-01T00:00:00.000Z",
    created_at: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

