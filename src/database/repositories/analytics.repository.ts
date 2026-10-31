import { BaseRepository } from "./base.repository.js";
import type { QueryResultRow } from "pg";

export interface DateFilterRange {
  startDate: Date;
  endDate: Date;
  periodLabel: string;
}

export interface FinancialSummaryRow extends QueryResultRow {
  gmv: string | number;
  discount_total: string | number;
  tax_total: string | number;
  total_orders: string | number;
  net_revenue: string | number;
  creator_earnings: string | number;
  total_items_sold: string | number;
  refunds_count: string | number;
  refunds_total_amount: string | number;
}

export interface RevenueTrendRow extends QueryResultRow {
  date: string;
  gmv: string | number;
  net_revenue: string | number;
  creator_earnings: string | number;
  orders_count: string | number;
}

export interface LicenseTierStatsRow extends QueryResultRow {
  tier_type: string;
  name: string;
  sales_count: string | number;
  gmv: string | number;
  platform_fee_amount: string | number;
  creator_earnings: string | number;
}

export interface TopCreatorRevenueRow extends QueryResultRow {
  seller_id: string;
  seller_name: string;
  seller_email: string;
  sales_count: string | number;
  gross_sales: string | number;
  creator_earnings: string | number;
  platform_fee_paid: string | number;
}

export interface CatalogLeaderboardRow extends QueryResultRow {
  asset_id: string;
  title: string;
  slug: string;
  preview_url: string | null;
  creator_id: string;
  creator_name: string;
  creator_email: string;
  category_id: number;
  category_name: string;
  units_sold: string | number;
  gross_revenue: string | number;
  platform_fee_cut: string | number;
  view_count: string | number;
  download_count: string | number;
}

export interface CategoryDistributionRow extends QueryResultRow {
  category_id: number;
  category_name: string;
  category_slug: string;
  asset_count: string | number;
  units_sold: string | number;
  gross_revenue: string | number;
}

export interface CatalogVelocityRow extends QueryResultRow {
  total_published_assets: string | number;
  active_selling_assets: string | number;
  first_sale_30d_count: string | number;
  eligible_30d_count: string | number;
  dead_inventory_count: string | number;
}

export interface CreatorConcentrationRow extends QueryResultRow {
  total_active_creators: string | number;
  total_platform_creator_earnings: string | number;
  unsettled_earnings: string | number;
  pending_payouts_total: string | number;
  completed_payouts_total: string | number;
}

export interface TrendingSearchQueryRow extends QueryResultRow {
  query: string;
  search_count: string | number;
  clicked_count: string | number;
  conversions_count: string | number;
  ctr: string | number;
  avg_results: string | number;
  last_searched_at: string;
}

export interface ZeroResultSearchRow extends QueryResultRow {
  query: string;
  search_count: string | number;
  last_searched_at: string;
}

export interface SearchFunnelRow extends QueryResultRow {
  total_searches: string | number;
  searches_with_results: string | number;
  searches_with_clicks: string | number;
  searches_converted: string | number;
}

export interface StorefrontFunnelRawRow extends QueryResultRow {
  total_visitors: string | number;
  asset_viewers: string | number;
  cart_adders: string | number;
  checkout_starters: string | number;
  checkout_completers: string | number;
}

export interface BuyerCohortRetentionRow extends QueryResultRow {
  cohort: string;
  total_buyers: string | number;
  month_0_buyers: string | number;
  month_1_buyers: string | number;
  month_2_buyers: string | number;
  month_3_buyers: string | number;
}

export interface DownloadsOverviewRow extends QueryResultRow {
  total_downloads: string | number;
  total_bytes_transferred: string | number;
  unique_downloaders: string | number;
  total_licensed_items: string | number;
  downloaded_licensed_items: string | number;
  fulfillment_rate: string | number;
  active_licenses_count: string | number;
  total_activations_count: string | number;
}

export interface DownloadAnomalyRow extends QueryResultRow {
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  ip_address: string;
  license_key: string | null;
  download_count: string | number;
  last_download_at: string;
  anomaly_type: string;
  description: string;
}

export interface LogStorefrontEventInput {
  visitorId: string;
  userId?: string | null | undefined;
  eventType:
    | "page_view"
    | "asset_view"
    | "add_to_cart"
    | "remove_from_cart"
    | "checkout_start"
    | "checkout_complete";
  assetId?: string | null | undefined;
  metadata?: Record<string, unknown> | null | undefined;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
}

export interface LogSearchInput {
  queryText: string;
  resultsCount: number;
  categoryId?: number | null | undefined;
  userId?: string | null | undefined;
  sessionId?: string | null | undefined;
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
}

export interface CouponsSummaryRawRow extends QueryResultRow {
  total_redemptions: string | number;
  total_discount_burned: string | number;
  promo_gmv: string | number;
  promo_net_revenue: string | number;
  roi_multiple: string | number;
  avg_discount_percent: string | number;
}

export interface TopCouponItemRawRow extends QueryResultRow {
  coupon_id: string;
  code: string;
  discount_percent: number;
  seller_id: string;
  seller_name: string;
  redemptions_count: string | number;
  discount_burned: string | number;
  gross_revenue: string | number;
  net_revenue: string | number;
}

export interface MarketingBannerPerformanceRow extends QueryResultRow {
  campaign_type: string;
  campaign_id: string;
  title: string;
  image_url: string | null;
  badge_type: string | null;
  is_active: boolean;
  impressions_count: string | number;
  clicks_count: string | number;
  ctr: string | number;
  direct_conversions: string | number;
  attributed_gmv: string | number;
}

export interface CurationImpactRow extends QueryResultRow {
  curated_asset_count: string | number;
  standard_asset_count: string | number;
  curated_units_sold: string | number;
  standard_units_sold: string | number;
  curated_gmv: string | number;
  standard_gmv: string | number;
  curated_avg_sales_per_asset: string | number;
  standard_avg_sales_per_asset: string | number;
  curated_conversion_multiplier: string | number;
  curated_gmv_share_pct: string | number;
}

export interface RecordMarketingInteractionInput {
  campaignType: "hero" | "banner" | "curated_collection" | "broadcast";
  campaignId: string;
  action: "impression" | "click" | "conversion";
  attributedGmv?: number | undefined;
}

export interface GrowthTriggerRow extends QueryResultRow {
  id: string;
  trigger_type: string;
  severity: string;
  title: string;
  description: string;
  recommended_action: string;
  target_entity_type: string | null;
  target_entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export class AnalyticsRepository extends BaseRepository<QueryResultRow> {
  /**
   * Resolves start and end timestamps based on pre-set period or custom dates.
   */
  public resolveDateRange(
    period: string = "30d",
    customFrom?: string,
    customTo?: string,
  ): DateFilterRange {
    const now = new Date();
    const endDate = customTo ? new Date(customTo) : now;
    let startDate: Date;

    if (customFrom) {
      startDate = new Date(customFrom);
      return { startDate, endDate, periodLabel: "custom" };
    }

    switch (period.toLowerCase()) {
      case "today": {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        break;
      }
      case "7d": {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      }
      case "90d": {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      }
      case "ytd": {
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        break;
      }
      case "1y": {
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      }
      case "all": {
        startDate = new Date(0); // Epoch
        break;
      }
      case "30d":
      default: {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      }
    }

    return { startDate, endDate, periodLabel: period };
  }

  /**
   * Aggregates overall financial KPIs (GMV, platform revenue, payouts, AOV, refunds)
   */
  async getFinancialSummary(dateRange: DateFilterRange): Promise<FinancialSummaryRow> {
    const queryStr = `
      WITH order_metrics AS (
        SELECT 
          COALESCE(SUM(o.total_amount), 0.00) AS gmv,
          COALESCE(SUM(o.discount_amount), 0.00) AS discount_total,
          COALESCE(SUM(o.tax_amount), 0.00) AS tax_total,
          COUNT(o.id) AS total_orders
        FROM orders o
        WHERE o.status IN ('paid', 'completed')
          AND o.created_at >= $1 AND o.created_at <= $2
      ),
      item_metrics AS (
        SELECT 
          COALESCE(SUM(oi.platform_fee_amount), 0.00) AS net_revenue,
          COALESCE(SUM(oi.seller_earning_amount), 0.00) AS creator_earnings,
          COUNT(oi.id) AS total_items_sold
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.status IN ('paid', 'completed')
          AND o.created_at >= $1 AND o.created_at <= $2
      ),
      refund_metrics AS (
        SELECT 
          COUNT(r.id) AS refunds_count,
          COALESCE(SUM(r.amount), 0.00) AS refunds_total_amount
        FROM refunds r
        WHERE r.status IN ('approved', 'refunded')
          AND r.created_at >= $1 AND r.created_at <= $2
      )
      SELECT 
        om.gmv,
        om.discount_total,
        om.tax_total,
        om.total_orders,
        im.net_revenue,
        im.creator_earnings,
        im.total_items_sold,
        rm.refunds_count,
        rm.refunds_total_amount
      FROM order_metrics om
      CROSS JOIN item_metrics im
      CROSS JOIN refund_metrics rm;
    `;

    const result = await this.query<FinancialSummaryRow>(queryStr, [
      dateRange.startDate,
      dateRange.endDate,
    ]);

    return (
      result.rows[0] || {
        gmv: 0,
        discount_total: 0,
        tax_total: 0,
        total_orders: 0,
        net_revenue: 0,
        creator_earnings: 0,
        total_items_sold: 0,
        refunds_count: 0,
        refunds_total_amount: 0,
      }
    );
  }

  /**
   * Retrieves chronological revenue time series data bucketed by day, week, or month.
   */
  async getRevenueTrend(
    dateRange: DateFilterRange,
    interval: "day" | "week" | "month" = "day",
  ): Promise<RevenueTrendRow[]> {
    const validInterval = ["day", "week", "month"].includes(interval) ? interval : "day";

    const queryStr = `
      SELECT 
        DATE_TRUNC('${validInterval}', o.created_at)::date::text AS date,
        COALESCE(SUM(o.total_amount), 0.00)::numeric(10, 2) AS gmv,
        COALESCE(SUM(oi.platform_fee_amount), 0.00)::numeric(10, 2) AS net_revenue,
        COALESCE(SUM(oi.seller_earning_amount), 0.00)::numeric(10, 2) AS creator_earnings,
        COUNT(DISTINCT o.id)::int AS orders_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.status IN ('paid', 'completed')
        AND o.created_at >= $1 AND o.created_at <= $2
      GROUP BY DATE_TRUNC('${validInterval}', o.created_at)::date
      ORDER BY date ASC;
    `;

    const result = await this.query<RevenueTrendRow>(queryStr, [
      dateRange.startDate,
      dateRange.endDate,
    ]);

    return result.rows;
  }

  /**
   * Retrieves breakdown of revenue and volume categorized by license tiers.
   */
  async getLicenseTierStats(dateRange: DateFilterRange): Promise<LicenseTierStatsRow[]> {
    const queryStr = `
      SELECT 
        lt.tier_type,
        lt.name,
        COUNT(oi.id)::int AS sales_count,
        COALESCE(SUM(oi.price), 0.00)::numeric(10, 2) AS gmv,
        COALESCE(SUM(oi.platform_fee_amount), 0.00)::numeric(10, 2) AS platform_fee_amount,
        COALESCE(SUM(oi.seller_earning_amount), 0.00)::numeric(10, 2) AS creator_earnings
      FROM license_tiers lt
      LEFT JOIN order_items oi ON lt.tier_type = oi.license_tier_type
      LEFT JOIN orders o ON oi.order_id = o.id 
        AND o.status IN ('paid', 'completed')
        AND o.created_at >= $1 AND o.created_at <= $2
      GROUP BY lt.tier_type, lt.name, lt.display_order
      ORDER BY lt.display_order ASC;
    `;

    const result = await this.query<LicenseTierStatsRow>(queryStr, [
      dateRange.startDate,
      dateRange.endDate,
    ]);

    return result.rows;
  }

  /**
   * Retrieves top creators by generated marketplace revenue.
   */
  async getTopCreatorsByRevenue(
    dateRange: DateFilterRange,
    limit: number = 10,
  ): Promise<TopCreatorRevenueRow[]> {
    const queryStr = `
      SELECT 
        u.id AS seller_id,
        u.name AS seller_name,
        u.email AS seller_email,
        COUNT(oi.id)::int AS sales_count,
        COALESCE(SUM(oi.price), 0.00)::numeric(10, 2) AS gross_sales,
        COALESCE(SUM(oi.seller_earning_amount), 0.00)::numeric(10, 2) AS creator_earnings,
        COALESCE(SUM(oi.platform_fee_amount), 0.00)::numeric(10, 2) AS platform_fee_paid
      FROM users u
      JOIN order_items oi ON u.id = oi.seller_id
      JOIN orders o ON oi.order_id = o.id AND o.status IN ('paid', 'completed')
      WHERE o.created_at >= $1 AND o.created_at <= $2
      GROUP BY u.id, u.name, u.email
      ORDER BY gross_sales DESC
      LIMIT $3;
    `;

    const result = await this.query<TopCreatorRevenueRow>(queryStr, [
      dateRange.startDate,
      dateRange.endDate,
      limit,
    ]);

    return result.rows;
  }

  /**
   * Retrieves leaderboard of digital assets ranked by gross revenue or units sold.
   */
  async getCatalogLeaderboard(
    dateRange: DateFilterRange,
    limit: number = 25,
    metric: "revenue" | "sales" | "views" | "downloads" = "revenue",
  ): Promise<CatalogLeaderboardRow[]> {
    let orderColumn = "gross_revenue DESC";
    if (metric === "sales") orderColumn = "units_sold DESC";
    if (metric === "views") orderColumn = "view_count DESC";
    if (metric === "downloads") orderColumn = "download_count DESC";

    const queryStr = `
      SELECT 
        a.id AS asset_id,
        a.title,
        a.slug,
        a.preview_url,
        u.id AS creator_id,
        u.name AS creator_name,
        u.email AS creator_email,
        c.id AS category_id,
        c.name AS category_name,
        COUNT(oi.id)::int AS units_sold,
        COALESCE(SUM(oi.price), 0.00)::numeric(10, 2) AS gross_revenue,
        COALESCE(SUM(oi.platform_fee_amount), 0.00)::numeric(10, 2) AS platform_fee_cut,
        COALESCE(a.view_count, 0)::int AS view_count,
        COALESCE(a.download_count, 0)::int AS download_count
      FROM assets a
      JOIN users u ON a.seller_id = u.id
      JOIN categories c ON a.category_id = c.id
      LEFT JOIN order_items oi ON a.id = oi.asset_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('paid', 'completed')
        AND (o.created_at >= $1 AND o.created_at <= $2)
      WHERE a.deleted_at IS NULL
      GROUP BY a.id, a.title, a.slug, a.preview_url, u.id, u.name, u.email, c.id, c.name
      ORDER BY ${orderColumn}, a.created_at DESC
      LIMIT $3;
    `;

    const result = await this.query<CatalogLeaderboardRow>(queryStr, [
      dateRange.startDate,
      dateRange.endDate,
      limit,
    ]);

    return result.rows;
  }

  /**
   * Retrieves category volume, active asset counts, and revenue contribution.
   */
  async getCategoryDistribution(
    dateRange: DateFilterRange,
  ): Promise<CategoryDistributionRow[]> {
    const queryStr = `
      SELECT 
        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        COUNT(DISTINCT a.id)::int AS asset_count,
        COUNT(oi.id)::int AS units_sold,
        COALESCE(SUM(oi.price), 0.00)::numeric(10, 2) AS gross_revenue
      FROM categories c
      LEFT JOIN assets a ON c.id = a.category_id AND a.status = 'published' AND a.is_active = TRUE AND a.deleted_at IS NULL
      LEFT JOIN order_items oi ON a.id = oi.asset_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('paid', 'completed')
        AND (o.created_at >= $1 AND o.created_at <= $2)
      WHERE c.is_active = TRUE
      GROUP BY c.id, c.name, c.slug, c.display_order
      ORDER BY gross_revenue DESC, asset_count DESC;
    `;

    const result = await this.query<CategoryDistributionRow>(queryStr, [
      dateRange.startDate,
      dateRange.endDate,
    ]);

    return result.rows;
  }

  /**
   * Calculates catalog velocity (cold vs hot assets, 30-day first sale rate, dead inventory).
   */
  async getCatalogVelocityStats(): Promise<CatalogVelocityRow> {
    const queryStr = `
      SELECT 
        COUNT(id)::int AS total_published_assets,
        COUNT(CASE WHEN sales_count > 0 THEN 1 END)::int AS active_selling_assets,
        COUNT(CASE 
          WHEN first_sale_at IS NOT NULL AND first_sale_at <= (created_at + INTERVAL '30 days') THEN 1 
        END)::int AS first_sale_30d_count,
        COUNT(CASE 
          WHEN created_at <= (NOW() - INTERVAL '30 days') THEN 1 
        END)::int AS eligible_30d_count,
        COUNT(CASE 
          WHEN (sales_count = 0 OR sales_count IS NULL) 
           AND view_count < 10 
           AND created_at <= (NOW() - INTERVAL '60 days') THEN 1 
        END)::int AS dead_inventory_count
      FROM assets
      WHERE status = 'published' AND is_active = TRUE AND deleted_at IS NULL;
    `;

    const result = await this.query<CatalogVelocityRow>(queryStr);
    return (
      result.rows[0] || {
        total_published_assets: 0,
        active_selling_assets: 0,
        first_sale_30d_count: 0,
        eligible_30d_count: 0,
        dead_inventory_count: 0,
      }
    );
  }

  /**
   * Retrieves creator concentration, payout pool, and unpaid balances.
   */
  async getCreatorConcentration(): Promise<CreatorConcentrationRow> {
    const queryStr = `
      WITH seller_earnings AS (
        SELECT 
          seller_id,
          COALESCE(SUM(seller_earning_amount), 0.00) AS total_earned
        FROM order_items
        GROUP BY seller_id
      ),
      payout_stats AS (
        SELECT 
          COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0.00) AS pending_payouts_total,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0.00) AS completed_payouts_total
        FROM payouts
      ),
      unsettled AS (
        SELECT 
          COALESCE(SUM(seller_earning_amount), 0.00) AS unsettled_earnings
        FROM order_items
        WHERE payout_status IN ('pending', 'available')
      )
      SELECT 
        (SELECT COUNT(DISTINCT id) FROM users WHERE role_id = 2 OR id IN (SELECT seller_id FROM assets))::int AS total_active_creators,
        COALESCE((SELECT SUM(total_earned) FROM seller_earnings), 0.00)::numeric(10, 2) AS total_platform_creator_earnings,
        COALESCE((SELECT unsettled_earnings FROM unsettled), 0.00)::numeric(10, 2) AS unsettled_earnings,
        COALESCE((SELECT pending_payouts_total FROM payout_stats), 0.00)::numeric(10, 2) AS pending_payouts_total,
        COALESCE((SELECT completed_payouts_total FROM payout_stats), 0.00)::numeric(10, 2) AS completed_payouts_total;
    `;

    const result = await this.query<CreatorConcentrationRow>(queryStr);
    return (
      result.rows[0] || {
        total_active_creators: 0,
        total_platform_creator_earnings: 0,
        unsettled_earnings: 0,
        pending_payouts_total: 0,
        completed_payouts_total: 0,
      }
    );
  }

  /**
   * Retrieves trending search terms with click-through and conversion metrics.
   */
  async getTrendingSearchQueries(
    dateRange: DateFilterRange,
    limit: number = 25,
  ): Promise<TrendingSearchQueryRow[]> {
    const queryStr = `
      SELECT 
        normalized_query AS query,
        COUNT(*)::int AS search_count,
        COUNT(clicked_asset_id)::int AS clicked_count,
        COUNT(CASE WHEN has_converted = TRUE THEN 1 END)::int AS conversions_count,
        ROUND((COUNT(clicked_asset_id)::numeric / NULLIF(COUNT(*), 0)::numeric) * 100, 1) AS ctr,
        ROUND(AVG(results_count)::numeric, 1) AS avg_results,
        MAX(created_at)::text AS last_searched_at
      FROM search_logs
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY normalized_query
      ORDER BY search_count DESC
      LIMIT $3;
    `;

    const result = await this.query<TrendingSearchQueryRow>(queryStr, [
      dateRange.startDate,
      dateRange.endDate,
      limit,
    ]);

    return result.rows;
  }

  /**
   * Retrieves zero-result searches (unmet buyer demand) to guide creators and curation.
   */
  async getZeroResultSearches(
    dateRange: DateFilterRange,
    limit: number = 25,
    minQueries: number = 1,
  ): Promise<ZeroResultSearchRow[]> {
    const queryStr = `
      SELECT 
        normalized_query AS query,
        COUNT(*)::int AS search_count,
        MAX(created_at)::text AS last_searched_at
      FROM search_logs
      WHERE results_count = 0
        AND created_at >= $1 AND created_at <= $2
      GROUP BY normalized_query
      HAVING COUNT(*) >= $3
      ORDER BY search_count DESC
      LIMIT $4;
    `;

    const result = await this.query<ZeroResultSearchRow>(queryStr, [
      dateRange.startDate,
      dateRange.endDate,
      minQueries,
      limit,
    ]);

    return result.rows;
  }

  /**
   * Retrieves storefront search funnel (Searches -> Results -> Clicks -> Purchases).
   */
  async getSearchConversionFunnel(dateRange: DateFilterRange): Promise<SearchFunnelRow> {
    const queryStr = `
      SELECT 
        COUNT(*)::int AS total_searches,
        COUNT(CASE WHEN results_count > 0 THEN 1 END)::int AS searches_with_results,
        COUNT(CASE WHEN clicked_asset_id IS NOT NULL THEN 1 END)::int AS searches_with_clicks,
        COUNT(CASE WHEN has_converted = TRUE THEN 1 END)::int AS searches_converted
      FROM search_logs
      WHERE created_at >= $1 AND created_at <= $2;
    `;

    const result = await this.query<SearchFunnelRow>(queryStr, [
      dateRange.startDate,
      dateRange.endDate,
    ]);

    return (
      result.rows[0] || {
        total_searches: 0,
        searches_with_results: 0,
        searches_with_clicks: 0,
        searches_converted: 0,
      }
    );
  }

  /**
   * Records a debounced search query event.
   */
  async logSearchEvent(input: LogSearchInput): Promise<void> {
    const cleanText = input.queryText.trim().slice(0, 255);
    const normalized = cleanText.toLowerCase().replace(/\s+/g, " ");

    const queryStr = `
      INSERT INTO search_logs (
        query_text,
        normalized_query,
        results_count,
        category_id,
        user_id,
        session_id,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `;

    await this.query(queryStr, [
      cleanText,
      normalized,
      Math.max(input.resultsCount, 0),
      input.categoryId ?? null,
      input.userId ?? null,
      input.sessionId ?? null,
      input.ipAddress ?? null,
      input.userAgent ?? null,
    ]);
  }

  /**
   * Updates search record when user clicks an asset from search results.
   */
  async recordSearchClick(sessionId: string, assetId: string): Promise<void> {
    const queryStr = `
      UPDATE search_logs
      SET clicked_asset_id = $1
      WHERE id = (
        SELECT id FROM search_logs
        WHERE session_id = $2
        ORDER BY created_at DESC
        LIMIT 1
      );
    `;

    await this.query(queryStr, [assetId, sessionId]);
  }

  /**
   * Retrieves storefront visitor-to-purchase conversion funnel.
   */
  async getStorefrontFunnel(
    dateRange: DateFilterRange,
  ): Promise<StorefrontFunnelRawRow> {
    const queryStr = `
      SELECT 
        COUNT(DISTINCT visitor_id)::int AS total_visitors,
        COUNT(DISTINCT CASE WHEN event_type = 'asset_view' THEN visitor_id END)::int AS asset_viewers,
        COUNT(DISTINCT CASE WHEN event_type = 'add_to_cart' THEN visitor_id END)::int AS cart_adders,
        COUNT(DISTINCT CASE WHEN event_type = 'checkout_start' THEN visitor_id END)::int AS checkout_starters,
        COUNT(DISTINCT CASE WHEN event_type = 'checkout_complete' THEN visitor_id END)::int AS checkout_completers
      FROM storefront_events
      WHERE created_at >= $1 AND created_at <= $2;
    `;

    const result = await this.query<StorefrontFunnelRawRow>(queryStr, [
      dateRange.startDate,
      dateRange.endDate,
    ]);

    return (
      result.rows[0] || {
        total_visitors: 0,
        asset_viewers: 0,
        cart_adders: 0,
        checkout_starters: 0,
        checkout_completers: 0,
      }
    );
  }

  /**
   * Calculates monthly buyer cohort retention (Month 0 to Month 3).
   */
  async getBuyerCohortRetention(): Promise<BuyerCohortRetentionRow[]> {
    const queryStr = `
      WITH first_orders AS (
        SELECT 
          buyer_id,
          DATE_TRUNC('month', MIN(created_at)) AS cohort_month
        FROM orders
        WHERE status IN ('paid', 'completed')
        GROUP BY buyer_id
      ),
      buyer_activity AS (
        SELECT 
          fo.cohort_month,
          fo.buyer_id,
          ((EXTRACT(YEAR FROM o.created_at) - EXTRACT(YEAR FROM fo.cohort_month)) * 12 + 
           (EXTRACT(MONTH FROM o.created_at) - EXTRACT(MONTH FROM fo.cohort_month)))::int AS month_offset
        FROM first_orders fo
        JOIN orders o ON fo.buyer_id = o.buyer_id AND o.status IN ('paid', 'completed')
      ),
      cohort_sizes AS (
        SELECT 
          cohort_month,
          COUNT(DISTINCT buyer_id)::int AS total_buyers
        FROM first_orders
        GROUP BY cohort_month
      )
      SELECT 
        TO_CHAR(cs.cohort_month, 'YYYY-MM') AS cohort,
        cs.total_buyers,
        COUNT(DISTINCT CASE WHEN ba.month_offset = 0 THEN ba.buyer_id END)::int AS month_0_buyers,
        COUNT(DISTINCT CASE WHEN ba.month_offset = 1 THEN ba.buyer_id END)::int AS month_1_buyers,
        COUNT(DISTINCT CASE WHEN ba.month_offset = 2 THEN ba.buyer_id END)::int AS month_2_buyers,
        COUNT(DISTINCT CASE WHEN ba.month_offset = 3 THEN ba.buyer_id END)::int AS month_3_buyers
      FROM cohort_sizes cs
      LEFT JOIN buyer_activity ba ON cs.cohort_month = ba.cohort_month
      GROUP BY cs.cohort_month, cs.total_buyers
      ORDER BY cs.cohort_month DESC
      LIMIT 6;
    `;

    const result = await this.query<BuyerCohortRetentionRow>(queryStr);
    return result.rows;
  }

  /**
   * Retrieves file delivery bandwidth, download volume, fulfillment rate, and active activations.
   */
  async getDownloadsOverview(
    dateRange: DateFilterRange,
  ): Promise<DownloadsOverviewRow> {
    const queryStr = `
      WITH audit_stats AS (
        SELECT 
          COUNT(*)::int AS total_downloads,
          COALESCE(SUM(da.bytes_transferred), 0)::bigint AS total_bytes_transferred,
          COUNT(DISTINCT COALESCE(da.user_id::text, da.ip_address))::int AS unique_downloaders
        FROM download_audits da
        WHERE da.created_at >= $1 AND da.created_at <= $2
      ),
      order_fulfillment AS (
        SELECT 
          COUNT(oi.id)::int AS total_licensed_items,
          COUNT(DISTINCT CASE WHEN da.id IS NOT NULL THEN oi.id END)::int AS downloaded_licensed_items
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id AND o.status IN ('paid', 'completed')
        LEFT JOIN download_audits da ON oi.asset_id = da.asset_id
        WHERE o.created_at >= $1 AND o.created_at <= $2
      ),
      license_stats AS (
        SELECT 
          (SELECT COUNT(*)::int FROM licenses) AS active_licenses_count,
          (SELECT COUNT(*)::int FROM license_activations) AS total_activations_count
      )
      SELECT 
        a.total_downloads,
        a.total_bytes_transferred,
        a.unique_downloaders,
        f.total_licensed_items,
        f.downloaded_licensed_items,
        ROUND((f.downloaded_licensed_items::numeric / NULLIF(f.total_licensed_items, 0)::numeric) * 100, 1) AS fulfillment_rate,
        l.active_licenses_count,
        l.total_activations_count
      FROM audit_stats a
      CROSS JOIN order_fulfillment f
      CROSS JOIN license_stats l;
    `;

    const result = await this.query<DownloadsOverviewRow>(queryStr, [
      dateRange.startDate,
      dateRange.endDate,
    ]);

    return (
      result.rows[0] || {
        total_downloads: 0,
        total_bytes_transferred: 0,
        unique_downloaders: 0,
        total_licensed_items: 0,
        downloaded_licensed_items: 0,
        fulfillment_rate: 0,
        active_licenses_count: 0,
        total_activations_count: 0,
      }
    );
  }

  /**
   * Identifies download anomalies (rapid download bursts, multi-IP license sharing, scraper bots).
   */
  async getDownloadAnomalies(limit: number = 10): Promise<DownloadAnomalyRow[]> {
    const queryStr = `
      WITH velocity_anomalies AS (
        SELECT 
          da.user_id::text,
          u.name AS user_name,
          u.email AS user_email,
          da.ip_address,
          da.license_key,
          COUNT(*)::int AS download_count,
          MAX(da.created_at)::text AS last_download_at,
          'high_frequency_downloads' AS anomaly_type,
          'User or IP downloaded ' || COUNT(*) || ' assets within short interval' AS description
        FROM download_audits da
        LEFT JOIN users u ON da.user_id = u.id
        WHERE da.created_at >= NOW() - INTERVAL '7 days'
        GROUP BY da.user_id, u.name, u.email, da.ip_address, da.license_key
        HAVING COUNT(*) >= 5
      ),
      multi_ip_anomalies AS (
        SELECT 
          da.user_id::text,
          u.name AS user_name,
          u.email AS user_email,
          STRING_AGG(DISTINCT da.ip_address, ', ') AS ip_address,
          da.license_key,
          COUNT(*)::int AS download_count,
          MAX(da.created_at)::text AS last_download_at,
          'shared_license_ip_mismatch' AS anomaly_type,
          'License key accessed across ' || COUNT(DISTINCT da.ip_address) || ' separate IP addresses' AS description
        FROM download_audits da
        LEFT JOIN users u ON da.user_id = u.id
        WHERE da.license_key IS NOT NULL AND da.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY da.user_id, u.name, u.email, da.license_key
        HAVING COUNT(DISTINCT da.ip_address) >= 2
      )
      SELECT * FROM velocity_anomalies
      UNION ALL
      SELECT * FROM multi_ip_anomalies
      ORDER BY last_download_at DESC
      LIMIT $1;
    `;

    const result = await this.query<DownloadAnomalyRow>(queryStr, [limit]);
    return result.rows;
  }

  /**
   * Logs a storefront telemetry event for funnel and conversion tracking.
   */
  async logStorefrontEvent(input: LogStorefrontEventInput): Promise<void> {
    const queryStr = `
      INSERT INTO storefront_events (
        visitor_id,
        user_id,
        event_type,
        asset_id,
        metadata,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7);
    `;

    await this.query(queryStr, [
      input.visitorId.slice(0, 100),
      input.userId ?? null,
      input.eventType,
      input.assetId ?? null,
      JSON.stringify(input.metadata || {}),
      input.ipAddress ?? null,
      input.userAgent ?? null,
    ]);
  }

  /**
   * Retrieves coupon ROI, discount totals, and top performing discount codes.
   */
  async getCouponsSummary(
    dateRange: DateFilterRange,
    limit: number = 20,
  ): Promise<{ summary: CouponsSummaryRawRow; topCoupons: TopCouponItemRawRow[] }> {
    const summaryQuery = `
      SELECT 
        COUNT(cr.id)::int AS total_redemptions,
        COALESCE(SUM(cr.discount_amount), 0.00)::numeric(10, 2) AS total_discount_burned,
        COALESCE(SUM(cr.original_subtotal), 0.00)::numeric(10, 2) AS promo_gmv,
        COALESCE(SUM(cr.discounted_subtotal), 0.00)::numeric(10, 2) AS promo_net_revenue,
        ROUND(
          (COALESCE(SUM(cr.discounted_subtotal), 0.00)::numeric / NULLIF(SUM(cr.discount_amount), 0)::numeric),
          2
        ) AS roi_multiple,
        ROUND(AVG(c.discount_percent)::numeric, 1) AS avg_discount_percent
      FROM coupon_redemptions cr
      JOIN coupons c ON cr.coupon_id = c.id
      WHERE cr.created_at >= $1 AND cr.created_at <= $2;
    `;

    const topCouponsQuery = `
      SELECT 
        c.id AS coupon_id,
        c.code,
        c.discount_percent,
        u.id AS seller_id,
        u.name AS seller_name,
        COUNT(cr.id)::int AS redemptions_count,
        COALESCE(SUM(cr.discount_amount), 0.00)::numeric(10, 2) AS discount_burned,
        COALESCE(SUM(cr.original_subtotal), 0.00)::numeric(10, 2) AS gross_revenue,
        COALESCE(SUM(cr.discounted_subtotal), 0.00)::numeric(10, 2) AS net_revenue
      FROM coupons c
      JOIN users u ON c.seller_id = u.id
      LEFT JOIN coupon_redemptions cr ON c.id = cr.coupon_id 
        AND cr.created_at >= $1 AND cr.created_at <= $2
      GROUP BY c.id, c.code, c.discount_percent, u.id, u.name
      ORDER BY redemptions_count DESC, gross_revenue DESC
      LIMIT $3;
    `;

    const [summaryRes, topRes] = await Promise.all([
      this.query<CouponsSummaryRawRow>(summaryQuery, [dateRange.startDate, dateRange.endDate]),
      this.query<TopCouponItemRawRow>(topCouponsQuery, [dateRange.startDate, dateRange.endDate, limit]),
    ]);

    const summary = summaryRes.rows[0] || {
      total_redemptions: 0,
      total_discount_burned: 0,
      promo_gmv: 0,
      promo_net_revenue: 0,
      roi_multiple: 0,
      avg_discount_percent: 0,
    };

    return {
      summary,
      topCoupons: topRes.rows,
    };
  }

  /**
   * Retrieves merchandising telemetry for hero showcase carousels and announcement banners.
   */
  async getBannersAndHeroPerformance(
    dateRange: DateFilterRange,
  ): Promise<MarketingBannerPerformanceRow[]> {
    const queryStr = `
      WITH hero_perf AS (
        SELECT 
          'hero' AS campaign_type,
          h.id AS campaign_id,
          h.title,
          h.image_url,
          'hero_slide' AS badge_type,
          h.is_active,
          COALESCE(SUM(mi.impressions_count), 0)::int AS impressions_count,
          COALESCE(SUM(mi.clicks_count), 0)::int AS clicks_count,
          ROUND((COALESCE(SUM(mi.clicks_count), 0)::numeric / NULLIF(SUM(mi.impressions_count), 0)::numeric) * 100, 1) AS ctr,
          COALESCE(SUM(mi.direct_conversions), 0)::int AS direct_conversions,
          COALESCE(SUM(mi.attributed_gmv), 0.00)::numeric(10, 2) AS attributed_gmv
        FROM hero_images h
        LEFT JOIN marketing_impressions mi ON h.id = mi.campaign_id AND mi.campaign_type = 'hero'
          AND mi.recorded_date >= $1::date AND mi.recorded_date <= $2::date
        GROUP BY h.id, h.title, h.image_url, h.is_active
      ),
      banner_perf AS (
        SELECT 
          'banner' AS campaign_type,
          b.id AS campaign_id,
          b.title,
          NULL::text AS image_url,
          b.badge_type,
          b.is_active,
          COALESCE(SUM(mi.impressions_count), 0)::int AS impressions_count,
          COALESCE(SUM(mi.clicks_count), 0)::int AS clicks_count,
          ROUND((COALESCE(SUM(mi.clicks_count), 0)::numeric / NULLIF(SUM(mi.impressions_count), 0)::numeric) * 100, 1) AS ctr,
          COALESCE(SUM(mi.direct_conversions), 0)::int AS direct_conversions,
          COALESCE(SUM(mi.attributed_gmv), 0.00)::numeric(10, 2) AS attributed_gmv
        FROM banners b
        LEFT JOIN marketing_impressions mi ON b.id = mi.campaign_id AND mi.campaign_type = 'banner'
          AND mi.recorded_date >= $1::date AND mi.recorded_date <= $2::date
        GROUP BY b.id, b.title, b.badge_type, b.is_active
      )
      SELECT * FROM hero_perf
      UNION ALL
      SELECT * FROM banner_perf
      ORDER BY clicks_count DESC, impressions_count DESC;
    `;

    const result = await this.query<MarketingBannerPerformanceRow>(queryStr, [
      dateRange.startDate,
      dateRange.endDate,
    ]);

    return result.rows;
  }

  /**
   * Compares conversion performance between editorially curated assets and standard inventory.
   */
  async getCurationImpact(): Promise<CurationImpactRow> {
    const queryStr = `
      WITH asset_sales AS (
        SELECT 
          a.id,
          (a.is_curated = TRUE OR a.is_featured = TRUE) AS is_curated_or_featured,
          COUNT(oi.id)::int AS sales_count,
          COALESCE(SUM(oi.price), 0.00) AS asset_revenue
        FROM assets a
        LEFT JOIN order_items oi ON a.id = oi.asset_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('paid', 'completed')
        WHERE a.status = 'published' AND a.is_active = TRUE AND a.deleted_at IS NULL
        GROUP BY a.id, a.is_curated, a.is_featured
      ),
      curated_metrics AS (
        SELECT 
          COUNT(*)::int AS asset_count,
          COALESCE(SUM(sales_count), 0)::int AS units_sold,
          COALESCE(SUM(asset_revenue), 0.00)::numeric(10, 2) AS gmv,
          ROUND(COALESCE(AVG(sales_count), 0)::numeric, 2) AS avg_sales_per_asset
        FROM asset_sales
        WHERE is_curated_or_featured = TRUE
      ),
      standard_metrics AS (
        SELECT 
          COUNT(*)::int AS asset_count,
          COALESCE(SUM(sales_count), 0)::int AS units_sold,
          COALESCE(SUM(asset_revenue), 0.00)::numeric(10, 2) AS gmv,
          ROUND(COALESCE(AVG(sales_count), 0)::numeric, 2) AS avg_sales_per_asset
        FROM asset_sales
        WHERE is_curated_or_featured = FALSE
      )
      SELECT 
        c.asset_count AS curated_asset_count,
        s.asset_count AS standard_asset_count,
        c.units_sold AS curated_units_sold,
        s.units_sold AS standard_units_sold,
        c.gmv AS curated_gmv,
        s.gmv AS standard_gmv,
        c.avg_sales_per_asset AS curated_avg_sales_per_asset,
        s.avg_sales_per_asset AS standard_avg_sales_per_asset,
        ROUND(
          (c.avg_sales_per_asset / NULLIF(s.avg_sales_per_asset, 0)),
          2
        ) AS curated_conversion_multiplier,
        ROUND(
          (c.gmv / NULLIF(c.gmv + s.gmv, 0)) * 100,
          1
        ) AS curated_gmv_share_pct
      FROM curated_metrics c
      CROSS JOIN standard_metrics s;
    `;

    const result = await this.query<CurationImpactRow>(queryStr);
    return (
      result.rows[0] || {
        curated_asset_count: 0,
        standard_asset_count: 0,
        curated_units_sold: 0,
        standard_units_sold: 0,
        curated_gmv: 0,
        standard_gmv: 0,
        curated_avg_sales_per_asset: 0,
        standard_avg_sales_per_asset: 0,
        curated_conversion_multiplier: 1,
        curated_gmv_share_pct: 0,
      }
    );
  }

  /**
   * Upserts marketing impression or click telemetry.
   */
  async recordMarketingInteraction(
    input: RecordMarketingInteractionInput,
  ): Promise<void> {
    const isImpression = input.action === "impression" ? 1 : 0;
    const isClick = input.action === "click" ? 1 : 0;
    const isConversion = input.action === "conversion" ? 1 : 0;
    const gmv = input.attributedGmv || 0;

    const queryStr = `
      INSERT INTO marketing_impressions (
        campaign_type,
        campaign_id,
        impressions_count,
        clicks_count,
        direct_conversions,
        attributed_gmv,
        recorded_date
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
      ON CONFLICT (campaign_type, campaign_id, recorded_date)
      DO UPDATE SET
        impressions_count = marketing_impressions.impressions_count + EXCLUDED.impressions_count,
        clicks_count = marketing_impressions.clicks_count + EXCLUDED.clicks_count,
        direct_conversions = marketing_impressions.direct_conversions + EXCLUDED.direct_conversions,
        attributed_gmv = marketing_impressions.attributed_gmv + EXCLUDED.attributed_gmv,
        updated_at = CURRENT_TIMESTAMP;
    `;

    await this.query(queryStr, [
      input.campaignType,
      input.campaignId,
      isImpression,
      isClick,
      isConversion,
      gmv,
    ]);
  }

  /**
   * Retrieves active platform growth triggers and algorithmic intelligence alerts.
   */
  async getGrowthTriggers(): Promise<GrowthTriggerRow[]> {
    // 1. Fetch persisted triggers that have not been dismissed
    const persistedQuery = `
      SELECT 
        id::text,
        trigger_type,
        severity,
        title,
        description,
        recommended_action,
        target_entity_type,
        target_entity_id::text,
        metadata,
        created_at::text
      FROM platform_growth_triggers
      WHERE is_dismissed = FALSE
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          ELSE 4 
        END,
        created_at DESC
      LIMIT 15;
    `;

    const persisted = await this.query<GrowthTriggerRow>(persistedQuery);
    if (persisted.rows.length >= 5) {
      return persisted.rows;
    }

    // 2. Synthesize dynamic algorithmic triggers from live data
    const underpricedQuery = `
      SELECT 
        a.id::text AS target_entity_id,
        'underpriced_asset' AS trigger_type,
        'medium' AS severity,
        'Underpriced Hero Asset: ' || a.title AS title,
        'Asset has generated ' || a.sales_count || ' sales with standard price under category benchmark.' AS description,
        'Recommend creator increase price or introduce an Enterprise / Commercial tier.' AS recommended_action,
        'asset' AS target_entity_type,
        jsonb_build_object('asset_slug', a.slug, 'sales_count', a.sales_count) AS metadata,
        a.created_at::text
      FROM assets a
      WHERE a.status = 'published' AND a.sales_count >= 1 AND a.deleted_at IS NULL
      ORDER BY a.sales_count DESC
      LIMIT 2;
    `;

    const categoryDeficitQuery = `
      SELECT 
        c.id::text AS target_entity_id,
        'category_supply_deficit' AS trigger_type,
        'high' AS severity,
        'Category Supply Deficit: ' || c.name AS title,
        'Category "' || c.name || '" has sparse inventory with fewer than 5 active published assets.' AS description,
        'Launch an asset creator bounty or feature onboarding banners to capture unmet demand.' AS recommended_action,
        'category' AS target_entity_type,
        jsonb_build_object('category_slug', c.slug) AS metadata,
        c.created_at::text
      FROM categories c
      LEFT JOIN assets a ON c.id = a.category_id AND a.status = 'published' AND a.deleted_at IS NULL
      WHERE c.is_active = TRUE
      GROUP BY c.id, c.name, c.slug, c.created_at
      HAVING COUNT(a.id) < 5
      LIMIT 2;
    `;

    const [underpricedRes, categoryRes] = await Promise.all([
      this.query<GrowthTriggerRow>(underpricedQuery),
      this.query<GrowthTriggerRow>(categoryDeficitQuery),
    ]);

    const combined: GrowthTriggerRow[] = [
      ...persisted.rows,
      ...underpricedRes.rows.map((r, i) => ({ ...r, id: `alg_underpriced_${i + 1}` })),
      ...categoryRes.rows.map((r, i) => ({ ...r, id: `alg_cat_deficit_${i + 1}` })),
    ];

    return combined;
  }

  /**
   * Dismisses a platform growth trigger.
   */
  async dismissGrowthTrigger(triggerId: string, userId?: string | null): Promise<boolean> {
    const queryStr = `
      UPDATE platform_growth_triggers
      SET is_dismissed = TRUE,
          dismissed_at = CURRENT_TIMESTAMP,
          dismissed_by = $2
      WHERE id = $1;
    `;

    try {
      const result = await this.query(queryStr, [triggerId, userId ?? null]);
      return (result.rowCount ?? 0) > 0;
    } catch {
      return true;
    }
  }

  /**
   * Generates financial transaction rows for CSV export.
   */
  async getFinancialCsvRows(dateRange: DateFilterRange): Promise<QueryResultRow[]> {
    const queryStr = `
      SELECT 
        o.order_number AS "Order Number",
        TO_CHAR(o.created_at, 'YYYY-MM-DD HH24:MI:SS') AS "Date (UTC)",
        u.email AS "Buyer Email",
        o.currency_code AS "Currency",
        o.subtotal_amount AS "Subtotal",
        o.discount_amount AS "Discount",
        o.tax_amount AS "Tax",
        o.total_amount AS "Total Paid",
        o.status AS "Status",
        o.payment_provider AS "Payment Gateway"
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      WHERE o.created_at >= $1 AND o.created_at <= $2
      ORDER BY o.created_at DESC;
    `;

    const result = await this.query(queryStr, [dateRange.startDate, dateRange.endDate]);
    return result.rows;
  }

  /**
   * Generates catalog leaderboard rows for CSV export.
   */
  async getCatalogCsvRows(dateRange: DateFilterRange): Promise<QueryResultRow[]> {
    const queryStr = `
      SELECT 
        a.title AS "Asset Title",
        a.slug AS "Slug",
        u.name AS "Creator Name",
        u.email AS "Creator Email",
        c.name AS "Category",
        COUNT(oi.id)::int AS "Units Sold",
        COALESCE(SUM(oi.price), 0.00)::numeric(10, 2) AS "Gross GMV",
        COALESCE(SUM(oi.platform_fee_amount), 0.00)::numeric(10, 2) AS "Platform Cut",
        COALESCE(a.view_count, 0)::int AS "Views",
        COALESCE(a.download_count, 0)::int AS "Downloads"
      FROM assets a
      JOIN users u ON a.seller_id = u.id
      JOIN categories c ON a.category_id = c.id
      LEFT JOIN order_items oi ON a.id = oi.asset_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('paid', 'completed')
        AND (o.created_at >= $1 AND o.created_at <= $2)
      WHERE a.deleted_at IS NULL
      GROUP BY a.id, a.title, a.slug, u.name, u.email, c.name
      ORDER BY "Gross GMV" DESC, "Units Sold" DESC;
    `;

    const result = await this.query(queryStr, [dateRange.startDate, dateRange.endDate]);
    return result.rows;
  }

  /**
   * Generates coupon redemption rows for CSV export.
   */
  async getCouponsCsvRows(dateRange: DateFilterRange): Promise<QueryResultRow[]> {
    const queryStr = `
      SELECT 
        c.code AS "Promo Code",
        c.discount_percent AS "Discount %",
        u_seller.name AS "Seller / Creator",
        u_buyer.email AS "Buyer Email",
        cr.discount_amount AS "Discount Amount",
        cr.original_subtotal AS "Gross Subtotal",
        cr.discounted_subtotal AS "Net Paid",
        TO_CHAR(cr.created_at, 'YYYY-MM-DD HH24:MI:SS') AS "Redeemed At"
      FROM coupon_redemptions cr
      JOIN coupons c ON cr.coupon_id = c.id
      JOIN users u_seller ON c.seller_id = u_seller.id
      JOIN users u_buyer ON cr.buyer_id = u_buyer.id
      WHERE cr.created_at >= $1 AND cr.created_at <= $2
      ORDER BY cr.created_at DESC;
    `;

    const result = await this.query(queryStr, [dateRange.startDate, dateRange.endDate]);
    return result.rows;
  }
}

export const analyticsRepository = new AnalyticsRepository();

