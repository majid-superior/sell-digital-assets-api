import { AppError } from "../../core/errors/app-error.js";
import {
  bannersRepository,
  type BannerAppearance,
  type BannerBadgeType,
  type BannerEntity,
  type BannersRepository,
} from "../../database/repositories/banners.repository.js";
import {
  isValidBannerUrl,
  isValidTimezone,
  type BannerQueryInput,
  type CreateBannerInput,
  type UpdateBannerInput,
} from "./banners.schema.js";

export type ComputedBannerStatus = "active" | "scheduled" | "expired" | "inactive";

export interface PublicBannerDto {
  id: string;
  title: string;
  description: string | null;
  supporting_text: string | null;
  supportingText: string | null;
  badge_type: BannerBadgeType;
  badgeType: BannerBadgeType;
  cta_label: string | null;
  ctaLabel: string | null;
  cta_url: string | null;
  ctaUrl: string | null;
  show_cta: boolean;
  showCta: boolean;
  is_dismissible: boolean;
  isDismissible: boolean;
  appearance: BannerAppearance;
  priority: number;
  starts_at: string | null;
  startsAt: string | null;
  ends_at: string | null;
  endsAt: string | null;
  timezone: string;
}

export interface AdminBannerDto extends PublicBannerDto {
  is_active: boolean;
  isActive: boolean;
  status: ComputedBannerStatus;
  created_by: string | null;
  createdBy: string | null;
  created_at: string;
  createdAt: string;
  updated_at: string;
  updatedAt: string;
}

export interface PaginatedAdminBannersResult {
  banners: AdminBannerDto[];
  metrics: {
    total: number;
    activeCount: number;
    scheduledCount: number;
    expiredCount: number;
    inactiveCount: number;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Converts a wall-clock date/time string (either ISO with offset/Z or local "YYYY-MM-DDTHH:mm[:ss]"
 * in a specific IANA timezone) into a canonical UTC ISO 8601 string.
 */
export function parseScheduledTimestamp(
  rawValue: string | null | undefined,
  timezone: string,
  fieldLabel: string,
): string | null {
  if (rawValue === undefined || rawValue === null) return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  if (!isValidTimezone(timezone)) {
    throw new AppError(
      `Invalid timezone '${timezone}'. Please select a valid IANA timezone such as 'UTC', 'America/New_York', or 'Asia/Karachi'.`,
      400,
    );
  }

  // Case 1: Timestamp already includes explicit UTC 'Z' or numeric timezone offset (±HH:MM or ±HHMM)
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new AppError(
        `${fieldLabel} ('${trimmed}') is not a valid date/time. Please provide a valid ISO 8601 date and time.`,
        400,
      );
    }
    return parsed.toISOString();
  }

  // Case 2: Wall-clock local datetime "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss" in `timezone`
  const match =
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(
      trimmed,
    );
  if (!match) {
    throw new AppError(
      `${fieldLabel} ('${trimmed}') has an invalid format. Expected 'YYYY-MM-DDTHH:mm' or an ISO 8601 timestamp.`,
      400,
    );
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] ? Number(match[6]) : 0;
  const ms = match[7] ? Number(match[7].padEnd(3, "0")) : 0;

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    throw new AppError(
      `${fieldLabel} ('${trimmed}') contains out-of-range calendar values. Please verify the date and time.`,
      400,
    );
  }

  const guessUtcMs = Date.UTC(year, month - 1, day, hour, minute, second, ms);

  const getOffsetMsAt = (instantMs: number): number => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const parts = formatter.formatToParts(new Date(instantMs));
    const map: Record<string, number> = {};
    for (const part of parts) {
      if (part.type !== "literal") {
        map[part.type] = Number(part.value);
      }
    }
    const wallUtcMs = Date.UTC(
      map.year ?? year,
      (map.month ?? month) - 1,
      map.day ?? day,
      (map.hour ?? 0) === 24 ? 0 : (map.hour ?? 0),
      map.minute ?? 0,
      map.second ?? 0,
      ms,
    );
    return wallUtcMs - instantMs;
  };

  const firstOffset = getOffsetMsAt(guessUtcMs);
  const firstPassUtcMs = guessUtcMs - firstOffset;
  const secondOffset = getOffsetMsAt(firstPassUtcMs);
  const finalUtcMs = guessUtcMs - secondOffset;

  return new Date(finalUtcMs).toISOString();
}

/**
 * Computes the effective lifecycle state of a banner at a reference point in time.
 */
export function computeBannerStatus(
  banner: Pick<BannerEntity, "is_active" | "starts_at" | "ends_at">,
  referenceNow: Date = new Date(),
): ComputedBannerStatus {
  if (!banner.is_active) {
    return "inactive";
  }

  const nowMs = referenceNow.getTime();

  if (banner.starts_at) {
    const startMs = new Date(banner.starts_at).getTime();
    if (!Number.isNaN(startMs) && startMs > nowMs) {
      return "scheduled";
    }
  }

  if (banner.ends_at) {
    const endMs = new Date(banner.ends_at).getTime();
    if (!Number.isNaN(endMs) && endMs <= nowMs) {
      return "expired";
    }
  }

  return "active";
}

function toIsoOrNull(val: Date | string | null | undefined): string | null {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toPublicBannerDto(entity: BannerEntity): PublicBannerDto {
  const badgeType: BannerBadgeType = entity.badge_type || "special_offer";
  const startsAt = toIsoOrNull(entity.starts_at);
  const endsAt = toIsoOrNull(entity.ends_at);
  const showCta =
    Boolean(entity.show_cta) &&
    Boolean(entity.cta_label?.trim()) &&
    Boolean(entity.cta_url?.trim());

  return {
    id: entity.id,
    title: entity.title,
    description: entity.description ?? null,
    supporting_text: entity.supporting_text ?? null,
    supportingText: entity.supporting_text ?? null,
    badge_type: badgeType,
    badgeType,
    cta_label: showCta ? (entity.cta_label?.trim() ?? null) : (entity.cta_label ?? null),
    ctaLabel: showCta ? (entity.cta_label?.trim() ?? null) : (entity.cta_label ?? null),
    cta_url: showCta ? (entity.cta_url?.trim() ?? null) : (entity.cta_url ?? null),
    ctaUrl: showCta ? (entity.cta_url?.trim() ?? null) : (entity.cta_url ?? null),
    show_cta: showCta,
    showCta,
    is_dismissible: entity.is_dismissible !== false,
    isDismissible: entity.is_dismissible !== false,
    appearance: entity.appearance || "primary",
    priority: Number(entity.priority) || 0,
    starts_at: startsAt,
    startsAt,
    ends_at: endsAt,
    endsAt,
    timezone: entity.timezone || "UTC",
  };
}

function toAdminBannerDto(
  entity: BannerEntity,
  referenceNow: Date = new Date(),
): AdminBannerDto {
  const pub = toPublicBannerDto(entity);
  const createdAt = toIsoOrNull(entity.created_at) ?? new Date().toISOString();
  const updatedAt = toIsoOrNull(entity.updated_at) ?? createdAt;

  return {
    ...pub,
    // Preserve raw cta_label / cta_url for admin editing even when show_cta is false
    cta_label: entity.cta_label ?? null,
    ctaLabel: entity.cta_label ?? null,
    cta_url: entity.cta_url ?? null,
    ctaUrl: entity.cta_url ?? null,
    show_cta: Boolean(entity.show_cta),
    showCta: Boolean(entity.show_cta),
    is_active: Boolean(entity.is_active),
    isActive: Boolean(entity.is_active),
    status: computeBannerStatus(entity, referenceNow),
    created_by: entity.created_by ?? null,
    createdBy: entity.created_by ?? null,
    created_at: createdAt,
    createdAt,
    updated_at: updatedAt,
    updatedAt,
  };
}

export class BannersService {
  constructor(
    private readonly repo: BannersRepository = bannersRepository,
  ) {}

  /**
   * Returns only eligible (active and within schedule window) promotional banners
   * for the public website, ordered by priority DESC, created_at DESC.
   */
  async getActiveBanners(referenceNow?: Date): Promise<PublicBannerDto[]> {
    const now = referenceNow ?? new Date();
    const rows = await this.repo.findActiveEligible(now);

    // Defensive filter ensuring strict server-side schedule & active rules
    return rows
      .filter((row) => computeBannerStatus(row, now) === "active")
      .map(toPublicBannerDto);
  }

  /**
   * Returns all promotional banners for Admin management with computed statuses,
   * summary counts, optional status/search filtering, and pagination.
   */
  async getAdminBanners(
    query: BannerQueryInput = {},
    referenceNow?: Date,
  ): Promise<PaginatedAdminBannersResult> {
    const now = referenceNow ?? new Date();
    const allRows = await this.repo.findAll({ search: query.search });
    const mapped = allRows.map((row) => toAdminBannerDto(row, now));

    const metrics = {
      total: mapped.length,
      activeCount: mapped.filter((b) => b.status === "active").length,
      scheduledCount: mapped.filter((b) => b.status === "scheduled").length,
      expiredCount: mapped.filter((b) => b.status === "expired").length,
      inactiveCount: mapped.filter((b) => b.status === "inactive").length,
    };

    const statusFilter = query.status && query.status !== "all" ? query.status : null;
    const filtered = statusFilter
      ? mapped.filter((b) => b.status === statusFilter)
      : mapped;

    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 50;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      banners: paginated,
      metrics,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Retrieves a single banner by UUID for Admin inspection/editing.
   */
  async getBannerById(id: string, referenceNow?: Date): Promise<AdminBannerDto> {
    const row = await this.repo.findById(id);
    if (!row) {
      throw new AppError(
        `Promotional banner not found. The requested banner (ID: ${id}) does not exist or may have been deleted.`,
        404,
      );
    }
    return toAdminBannerDto(row, referenceNow ?? new Date());
  }

  /**
   * Validates and creates a new promotional banner in PostgreSQL.
   */
  async createBanner(
    input: CreateBannerInput,
    createdByUserId?: string | null,
  ): Promise<AdminBannerDto> {
    const timezone = (input.timezone ?? "UTC").trim() || "UTC";
    if (!isValidTimezone(timezone)) {
      throw new AppError(
        `Invalid timezone '${timezone}'. Please provide a valid IANA timezone identifier such as 'UTC', 'America/New_York', or 'Asia/Karachi'.`,
        400,
      );
    }

    const rawStartsAt = input.startsAt !== undefined ? input.startsAt : input.starts_at;
    const rawEndsAt = input.endsAt !== undefined ? input.endsAt : input.ends_at;

    const startsAtIso = parseScheduledTimestamp(rawStartsAt, timezone, "Start date/time");
    const endsAtIso = parseScheduledTimestamp(rawEndsAt, timezone, "End date/time");

    if (startsAtIso && endsAtIso) {
      if (new Date(endsAtIso).getTime() <= new Date(startsAtIso).getTime()) {
        throw new AppError(
          "Invalid banner schedule: End date/time must be later than the start date/time. Please adjust the schedule window.",
          400,
        );
      }
    }

    const badgeType: BannerBadgeType =
      input.badgeType ?? input.badge_type ?? "special_offer";

    const showCta = input.showCta ?? input.show_cta ?? true;
    const ctaLabel =
      (input.ctaLabel !== undefined ? input.ctaLabel : input.cta_label)?.trim() ||
      null;
    const ctaUrl =
      (input.ctaUrl !== undefined ? input.ctaUrl : input.cta_url)?.trim() ||
      null;

    if (showCta) {
      if (!ctaLabel) {
        throw new AppError(
          "CTA button label is required when CTA visibility is enabled. Enter a button label or turn off CTA visibility.",
          400,
        );
      }
      if (!ctaUrl || !isValidBannerUrl(ctaUrl)) {
        throw new AppError(
          "A valid CTA destination URL (e.g., '/signup' or 'https://example.com') is required when CTA visibility is enabled.",
          400,
        );
      }
    }

    const created = await this.repo.create({
      title: input.title.trim(),
      description: input.description?.trim() || null,
      supporting_text:
        (input.supportingText !== undefined
          ? input.supportingText
          : input.supporting_text
        )?.trim() || null,
      badge_type: badgeType,
      cta_label: ctaLabel,
      cta_url: ctaUrl,
      show_cta: showCta,
      is_dismissible: input.isDismissible ?? input.is_dismissible ?? true,
      appearance: input.appearance ?? "primary",
      priority: input.priority ?? 0,
      is_active: input.isActive ?? input.is_active ?? true,
      starts_at: startsAtIso,
      ends_at: endsAtIso,
      timezone,
      created_by: createdByUserId ?? null,
    });

    return toAdminBannerDto(created);
  }

  /**
   * Validates and updates an existing promotional banner in PostgreSQL.
   */
  async updateBanner(
    id: string,
    input: UpdateBannerInput,
  ): Promise<AdminBannerDto> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppError(
        `Cannot update promotional banner: Banner with ID '${id}' was not found.`,
        404,
      );
    }

    const timezone =
      input.timezone !== undefined
        ? input.timezone.trim() || "UTC"
        : existing.timezone || "UTC";

    if (!isValidTimezone(timezone)) {
      throw new AppError(
        `Invalid timezone '${timezone}'. Please provide a valid IANA timezone identifier such as 'UTC', 'America/New_York', or 'Asia/Karachi'.`,
        400,
      );
    }

    const hasStartsAtUpdate =
      input.startsAt !== undefined || input.starts_at !== undefined;
    const hasEndsAtUpdate =
      input.endsAt !== undefined || input.ends_at !== undefined;

    const rawStartsAt =
      input.startsAt !== undefined ? input.startsAt : input.starts_at;
    const rawEndsAt =
      input.endsAt !== undefined ? input.endsAt : input.ends_at;

    const nextStartsAtIso = hasStartsAtUpdate
      ? parseScheduledTimestamp(rawStartsAt, timezone, "Start date/time")
      : toIsoOrNull(existing.starts_at);

    const nextEndsAtIso = hasEndsAtUpdate
      ? parseScheduledTimestamp(rawEndsAt, timezone, "End date/time")
      : toIsoOrNull(existing.ends_at);

    if (nextStartsAtIso && nextEndsAtIso) {
      if (new Date(nextEndsAtIso).getTime() <= new Date(nextStartsAtIso).getTime()) {
        throw new AppError(
          "Invalid banner schedule: End date/time must be later than the start date/time. Please adjust the schedule window.",
          400,
        );
      }
    }

    const nextBadgeType: BannerBadgeType =
      input.badgeType ?? input.badge_type ?? existing.badge_type;

    const nextShowCta =
      input.showCta ?? input.show_cta ?? existing.show_cta;

    const hasCtaLabelUpdate =
      input.ctaLabel !== undefined || input.cta_label !== undefined;
    const nextCtaLabel = hasCtaLabelUpdate
      ? (input.ctaLabel !== undefined ? input.ctaLabel : input.cta_label)?.trim() || null
      : existing.cta_label;

    const hasCtaUrlUpdate =
      input.ctaUrl !== undefined || input.cta_url !== undefined;
    const nextCtaUrl = hasCtaUrlUpdate
      ? (input.ctaUrl !== undefined ? input.ctaUrl : input.cta_url)?.trim() || null
      : existing.cta_url;

    if (nextShowCta) {
      if (!nextCtaLabel?.trim()) {
        throw new AppError(
          "CTA button label is required when CTA visibility is enabled. Enter a button label or turn off CTA visibility.",
          400,
        );
      }
      if (!nextCtaUrl?.trim() || !isValidBannerUrl(nextCtaUrl)) {
        throw new AppError(
          "A valid CTA destination URL (e.g., '/signup' or 'https://example.com') is required when CTA visibility is enabled.",
          400,
        );
      }
    }

    const hasSupportingTextUpdate =
      input.supportingText !== undefined || input.supporting_text !== undefined;
    const nextSupportingText = hasSupportingTextUpdate
      ? (input.supportingText !== undefined
          ? input.supportingText
          : input.supporting_text
        )?.trim() || null
      : existing.supporting_text;

    const updated = await this.repo.update(id, {
      title: input.title !== undefined ? input.title.trim() : existing.title,
      description:
        input.description !== undefined
          ? input.description?.trim() || null
          : existing.description,
      supporting_text: nextSupportingText,
      badge_type: nextBadgeType,
      cta_label: nextCtaLabel,
      cta_url: nextCtaUrl,
      show_cta: nextShowCta,
      is_dismissible:
        input.isDismissible ?? input.is_dismissible ?? existing.is_dismissible,
      appearance: input.appearance ?? existing.appearance,
      priority: input.priority !== undefined ? input.priority : existing.priority,
      is_active: input.isActive ?? input.is_active ?? existing.is_active,
      starts_at: nextStartsAtIso,
      ends_at: nextEndsAtIso,
      timezone,
    });

    if (!updated) {
      throw new AppError(
        `Cannot update promotional banner: Banner with ID '${id}' was not found.`,
        404,
      );
    }

    return toAdminBannerDto(updated);
  }

  /**
   * Toggles a banner's active status (activate / deactivate).
   */
  async toggleBannerStatus(
    id: string,
    isActive: boolean,
  ): Promise<AdminBannerDto> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppError(
        `Cannot change banner status: Banner with ID '${id}' was not found.`,
        404,
      );
    }

    const updated = await this.repo.update(id, { is_active: isActive });
    if (!updated) {
      throw new AppError(
        `Cannot change banner status: Banner with ID '${id}' was not found.`,
        404,
      );
    }

    return toAdminBannerDto(updated);
  }

  /**
   * Deletes a promotional banner permanently by UUID.
   */
  async deleteBanner(id: string): Promise<{ id: string }> {
    const deleted = await this.repo.deleteById(id);
    if (!deleted) {
      throw new AppError(
        `Cannot delete promotional banner: Banner with ID '${id}' does not exist or has already been removed.`,
        404,
      );
    }
    return { id };
  }
}

export const bannersService = new BannersService();
export default bannersService;

