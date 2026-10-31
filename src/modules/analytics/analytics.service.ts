import {
  analyticsRepository,
  type DateFilterRange,
} from "../../database/repositories/analytics.repository.js";
import { organizationsRepository } from "../../database/repositories/organizations.repository.js";
import type {
  AnalyticsDateQuery,
  RevenueTrendQuery,
  TopCreatorsQuery,
  CatalogLeaderboardQuery,
  ZeroResultsQuery,
  TrackSearchEventInput,
  TrackSearchClickInput,
  TrackStorefrontEventInput,
  AnomaliesQuery,
  TrackMarketingInteractionInput,
  ReportExportQuery,
} from "./analytics.schema.js";

export interface TrendingSearchQueryItem {
  query: string;
  searchCount: number;
  clickedCount: number;
  conversionsCount: number;
  ctr: number;
  avgResults: number;
  lastSearchedAt: string;
}

export interface TrendingSearchQueriesResponse {
  period: string;
  queries: TrendingSearchQueryItem[];
}

export interface ZeroResultSearchItem {
  query: string;
  searchCount: number;
  lastSearchedAt: string;
}

export interface ZeroResultSearchesResponse {
  period: string;
  unmetDemandCount: number;
  queries: ZeroResultSearchItem[];
}

export interface SearchConversionFunnelResponse {
  period: string;
  funnel: {
    totalSearches: number;
    searchesWithResults: number;
    searchesWithClicks: number;
    searchesConverted: number;
    resultsRate: number; // % of searches with > 0 results
    ctr: number;         // % of searches clicked
    conversionRate: number; // % of searches that converted
  };
}

export interface FunnelStage {
  stage: string;
  count: number;
  dropOffRate: number;
  conversionRate: number;
}

export interface StorefrontFunnelResponse {
  period: string;
  totalVisitors: number;
  stages: FunnelStage[];
}

export interface BuyerCohort {
  cohort: string;
  totalBuyers: number;
  month0: { count: number; retentionPct: number };
  month1: { count: number; retentionPct: number };
  month2: { count: number; retentionPct: number };
  month3: { count: number; retentionPct: number };
}

export interface BuyerCohortRetentionResponse {
  cohorts: BuyerCohort[];
}

export interface DownloadsOverviewResponse {
  period: string;
  totalDownloads: number;
  totalBytesTransferred: number;
  totalGigabytesTransferred: number;
  uniqueDownloaders: number;
  totalLicensedItems: number;
  downloadedLicensedItems: number;
  fulfillmentRate: number;
  activeLicensesCount: number;
  totalActivationsCount: number;
}

export interface DownloadAnomaly {
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  ipAddress: string;
  licenseKey: string | null;
  downloadCount: number;
  lastDownloadAt: string;
  anomalyType: string;
  description: string;
}

export interface DownloadAnomaliesResponse {
  anomalies: DownloadAnomaly[];
}

export interface TopCouponItem {
  couponId: string;
  code: string;
  discountPercent: number;
  sellerId: string;
  sellerName: string;
  redemptionsCount: number;
  discountBurned: number;
  grossRevenue: number;
  netRevenue: number;
}

export interface CouponsSummaryResponse {
  period: string;
  currency: {
    code: string;
    symbol: string;
  };
  metrics: {
    totalRedemptions: number;
    totalDiscountBurned: number;
    promoGmv: number;
    promoNetRevenue: number;
    roiMultiple: number;
    avgDiscountPercent: number;
  };
  topCoupons: TopCouponItem[];
}

export interface MarketingBannerPerformanceItem {
  campaignType: string;
  campaignId: string;
  title: string;
  imageUrl: string | null;
  badgeType: string | null;
  isActive: boolean;
  impressionsCount: number;
  clicksCount: number;
  ctr: number;
  directConversions: number;
  attributedGmv: number;
}

export interface MarketingBannersResponse {
  period: string;
  campaigns: MarketingBannerPerformanceItem[];
}

export interface CurationImpactResponse {
  curatedAssetCount: number;
  standardAssetCount: number;
  curatedUnitsSold: number;
  standardUnitsSold: number;
  curatedGmv: number;
  standardGmv: number;
  curatedAvgSalesPerAsset: number;
  standardAvgSalesPerAsset: number;
  curatedConversionMultiplier: number;
  curatedGmvSharePct: number;
}

export interface GrowthTriggerItem {
  id: string;
  triggerType: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommendedAction: string;
  targetEntityType: string | null;
  targetEntityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface GrowthTriggersResponse {
  triggers: GrowthTriggerItem[];
}

export interface CatalogLeaderboardItem {
  assetId: string;
  title: string;
  slug: string;
  previewUrl: string | null;
  creatorId: string;
  creatorName: string;
  creatorEmail: string;
  categoryId: number;
  categoryName: string;
  unitsSold: number;
  grossRevenue: number;
  platformFeeCut: number;
  viewCount: number;
  downloadCount: number;
}

export interface CatalogLeaderboardResponse {
  period: string;
  metric: string;
  currency: {
    code: string;
    symbol: string;
  };
  leaderboard: CatalogLeaderboardItem[];
}

export interface CategoryDistributionItem {
  categoryId: number;
  name: string;
  slug: string;
  assetCount: number;
  unitsSold: number;
  grossRevenue: number;
  percentageOfRevenue: number;
}

export interface CategoryDistributionResponse {
  period: string;
  totalCategoryRevenue: number;
  categories: CategoryDistributionItem[];
}

export interface CatalogVelocityResponse {
  totalPublishedAssets: number;
  activeSellingAssets: number;
  catalogLiquidityRate: number; // % of published assets that have made >= 1 sale
  firstSale30dRate: number;     // % of 30d+ old assets that sold within 30 days
  deadInventoryCount: number;   // 0 sales & < 10 views after 60 days
  deadInventoryRate: number;    // % of published assets dead
}

export interface CreatorConcentrationResponse {
  totalActiveCreators: number;
  totalPlatformCreatorEarnings: number;
  unsettledEarnings: number;
  pendingPayoutsTotal: number;
  completedPayoutsTotal: number;
  currency: {
    code: string;
    symbol: string;
  };
}

export interface FinancialSummaryResponse {
  period: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  currency: {
    code: string;
    symbol: string;
  };
  metrics: {
    gmv: number;
    netRevenue: number;
    creatorEarnings: number;
    discountTotal: number;
    taxTotal: number;
    totalOrders: number;
    totalItemsSold: number;
    averageOrderValue: number;
    refundRate: number;
    refundsCount: number;
    refundsTotalAmount: number;
  };
}

export interface RevenueTrendResponse {
  period: string;
  interval: "day" | "week" | "month";
  currency: {
    code: string;
    symbol: string;
  };
  timeline: Array<{
    date: string;
    gmv: number;
    netRevenue: number;
    creatorEarnings: number;
    ordersCount: number;
  }>;
}

export interface LicenseTierStatsResponse {
  period: string;
  totalGmv: number;
  tiers: Array<{
    tierType: string;
    name: string;
    salesCount: number;
    gmv: number;
    platformFeeAmount: number;
    creatorEarnings: number;
    percentageOfGmv: number;
  }>;
}

export interface TopCreatorResponse {
  period: string;
  creators: Array<{
    sellerId: string;
    name: string;
    email: string;
    salesCount: number;
    grossSales: number;
    creatorEarnings: number;
    platformFeePaid: number;
  }>;
}

export class AnalyticsService {
  private async getPlatformCurrency(): Promise<{ code: string; symbol: string }> {
    try {
      const org = await organizationsRepository.getOrganization();
      const code = org?.default_currency || "USD";
      const symbol = (org?.currency as any)?.symbol || (code === "USD" ? "$" : code);
      return { code, symbol };
    } catch {
      return { code: "USD", symbol: "$" };
    }
  }

  /**
   * Retrieves high-level financial summary KPIs.
   */
  async getFinancialSummary(query: AnalyticsDateQuery): Promise<FinancialSummaryResponse> {
    const dateRange: DateFilterRange = analyticsRepository.resolveDateRange(
      query.period,
      query.from,
      query.to,
    );

    const [summaryRow, currency] = await Promise.all([
      analyticsRepository.getFinancialSummary(dateRange),
      this.getPlatformCurrency(),
    ]);

    const gmv = Number(summaryRow.gmv) || 0;
    const netRevenue = Number(summaryRow.net_revenue) || 0;
    const creatorEarnings = Number(summaryRow.creator_earnings) || 0;
    const discountTotal = Number(summaryRow.discount_total) || 0;
    const taxTotal = Number(summaryRow.tax_total) || 0;
    const totalOrders = Number(summaryRow.total_orders) || 0;
    const totalItemsSold = Number(summaryRow.total_items_sold) || 0;
    const refundsCount = Number(summaryRow.refunds_count) || 0;
    const refundsTotalAmount = Number(summaryRow.refunds_total_amount) || 0;

    const averageOrderValue =
      totalOrders > 0 ? Number((gmv / totalOrders).toFixed(2)) : 0;
    const refundRate =
      totalOrders > 0
        ? Number(((refundsCount / totalOrders) * 100).toFixed(2))
        : 0;

    return {
      period: dateRange.periodLabel,
      dateRange: {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      },
      currency,
      metrics: {
        gmv: Number(gmv.toFixed(2)),
        netRevenue: Number(netRevenue.toFixed(2)),
        creatorEarnings: Number(creatorEarnings.toFixed(2)),
        discountTotal: Number(discountTotal.toFixed(2)),
        taxTotal: Number(taxTotal.toFixed(2)),
        totalOrders,
        totalItemsSold,
        averageOrderValue,
        refundRate,
        refundsCount,
        refundsTotalAmount: Number(refundsTotalAmount.toFixed(2)),
      },
    };
  }

  /**
   * Retrieves timeline data for charts (GMV, net take, creator payouts).
   */
  async getRevenueTrend(query: RevenueTrendQuery): Promise<RevenueTrendResponse> {
    const dateRange: DateFilterRange = analyticsRepository.resolveDateRange(
      query.period,
      query.from,
      query.to,
    );

    const [trendRows, currency] = await Promise.all([
      analyticsRepository.getRevenueTrend(dateRange, query.interval),
      this.getPlatformCurrency(),
    ]);

    const timeline = trendRows.map((row) => ({
      date: row.date,
      gmv: Number(Number(row.gmv || 0).toFixed(2)),
      netRevenue: Number(Number(row.net_revenue || 0).toFixed(2)),
      creatorEarnings: Number(Number(row.creator_earnings || 0).toFixed(2)),
      ordersCount: Number(row.orders_count) || 0,
    }));

    return {
      period: dateRange.periodLabel,
      interval: query.interval || "day",
      currency,
      timeline,
    };
  }

  /**
   * Retrieves revenue and transaction distribution across license tiers.
   */
  async getLicenseTierStats(query: AnalyticsDateQuery): Promise<LicenseTierStatsResponse> {
    const dateRange: DateFilterRange = analyticsRepository.resolveDateRange(
      query.period,
      query.from,
      query.to,
    );

    const tierRows = await analyticsRepository.getLicenseTierStats(dateRange);

    let totalGmv = 0;
    const mappedTiers = tierRows.map((row) => {
      const gmv = Number(row.gmv) || 0;
      totalGmv += gmv;
      return {
        tierType: row.tier_type,
        name: row.name,
        salesCount: Number(row.sales_count) || 0,
        gmv: Number(gmv.toFixed(2)),
        platformFeeAmount: Number(Number(row.platform_fee_amount || 0).toFixed(2)),
        creatorEarnings: Number(Number(row.creator_earnings || 0).toFixed(2)),
        percentageOfGmv: 0,
      };
    });

    // Compute percentage of total GMV per tier
    const tiers = mappedTiers.map((t) => ({
      ...t,
      percentageOfGmv:
        totalGmv > 0 ? Number(((t.gmv / totalGmv) * 100).toFixed(1)) : 0,
    }));

    return {
      period: dateRange.periodLabel,
      totalGmv: Number(totalGmv.toFixed(2)),
      tiers,
    };
  }

  /**
   * Retrieves top creators by gross revenue.
   */
  async getTopCreators(query: TopCreatorsQuery): Promise<TopCreatorResponse> {
    const dateRange: DateFilterRange = analyticsRepository.resolveDateRange(
      query.period,
      query.from,
      query.to,
    );

    const rows = await analyticsRepository.getTopCreatorsByRevenue(
      dateRange,
      query.limit,
    );

    const creators = rows.map((r) => ({
      sellerId: r.seller_id,
      name: r.seller_name || "Unknown Creator",
      email: r.seller_email || "",
      salesCount: Number(r.sales_count) || 0,
      grossSales: Number(Number(r.gross_sales || 0).toFixed(2)),
      creatorEarnings: Number(Number(r.creator_earnings || 0).toFixed(2)),
      platformFeePaid: Number(Number(r.platform_fee_paid || 0).toFixed(2)),
    }));

    return {
      period: dateRange.periodLabel,
      creators,
    };
  }

  /**
   * Retrieves leaderboard ranking of top performing assets.
   */
  async getCatalogLeaderboard(
    query: CatalogLeaderboardQuery,
  ): Promise<CatalogLeaderboardResponse> {
    const dateRange: DateFilterRange = analyticsRepository.resolveDateRange(
      query.period,
      query.from,
      query.to,
    );

    const [rows, currency] = await Promise.all([
      analyticsRepository.getCatalogLeaderboard(
        dateRange,
        query.limit,
        query.metric,
      ),
      this.getPlatformCurrency(),
    ]);

    const leaderboard = rows.map((r) => ({
      assetId: r.asset_id,
      title: r.title,
      slug: r.slug,
      previewUrl: r.preview_url,
      creatorId: r.creator_id,
      creatorName: r.creator_name || "Unknown Creator",
      creatorEmail: r.creator_email || "",
      categoryId: Number(r.category_id),
      categoryName: r.category_name,
      unitsSold: Number(r.units_sold) || 0,
      grossRevenue: Number(Number(r.gross_revenue || 0).toFixed(2)),
      platformFeeCut: Number(Number(r.platform_fee_cut || 0).toFixed(2)),
      viewCount: Number(r.view_count) || 0,
      downloadCount: Number(r.download_count) || 0,
    }));

    return {
      period: dateRange.periodLabel,
      metric: query.metric || "revenue",
      currency,
      leaderboard,
    };
  }

  /**
   * Retrieves category volume, sales, and revenue distribution.
   */
  async getCategoryDistribution(
    query: AnalyticsDateQuery,
  ): Promise<CategoryDistributionResponse> {
    const dateRange: DateFilterRange = analyticsRepository.resolveDateRange(
      query.period,
      query.from,
      query.to,
    );

    const rows = await analyticsRepository.getCategoryDistribution(dateRange);

    let totalRevenue = 0;
    const mappedCategories = rows.map((r) => {
      const grossRevenue = Number(r.gross_revenue) || 0;
      totalRevenue += grossRevenue;
      return {
        categoryId: Number(r.category_id),
        name: r.category_name,
        slug: r.category_slug,
        assetCount: Number(r.asset_count) || 0,
        unitsSold: Number(r.units_sold) || 0,
        grossRevenue: Number(grossRevenue.toFixed(2)),
        percentageOfRevenue: 0,
      };
    });

    const categories = mappedCategories.map((c) => ({
      ...c,
      percentageOfRevenue:
        totalRevenue > 0
          ? Number(((c.grossRevenue / totalRevenue) * 100).toFixed(1))
          : 0,
    }));

    return {
      period: dateRange.periodLabel,
      totalCategoryRevenue: Number(totalRevenue.toFixed(2)),
      categories,
    };
  }

  /**
   * Calculates catalog velocity metrics.
   */
  async getCatalogVelocityStats(): Promise<CatalogVelocityResponse> {
    const row = await analyticsRepository.getCatalogVelocityStats();

    const totalPublished = Number(row.total_published_assets) || 0;
    const activeSelling = Number(row.active_selling_assets) || 0;
    const firstSale30dCount = Number(row.first_sale_30d_count) || 0;
    const eligible30dCount = Number(row.eligible_30d_count) || 0;
    const deadCount = Number(row.dead_inventory_count) || 0;

    const catalogLiquidityRate =
      totalPublished > 0
        ? Number(((activeSelling / totalPublished) * 100).toFixed(1))
        : 0;

    const firstSale30dRate =
      eligible30dCount > 0
        ? Number(((firstSale30dCount / eligible30dCount) * 100).toFixed(1))
        : 0;

    const deadInventoryRate =
      totalPublished > 0
        ? Number(((deadCount / totalPublished) * 100).toFixed(1))
        : 0;

    return {
      totalPublishedAssets: totalPublished,
      activeSellingAssets: activeSelling,
      catalogLiquidityRate,
      firstSale30dRate,
      deadInventoryCount: deadCount,
      deadInventoryRate,
    };
  }

  /**
   * Retrieves creator concentration and payout summary.
   */
  async getCreatorConcentration(): Promise<CreatorConcentrationResponse> {
    const [row, currency] = await Promise.all([
      analyticsRepository.getCreatorConcentration(),
      this.getPlatformCurrency(),
    ]);

    return {
      totalActiveCreators: Number(row.total_active_creators) || 0,
      totalPlatformCreatorEarnings: Number(Number(row.total_platform_creator_earnings || 0).toFixed(2)),
      unsettledEarnings: Number(Number(row.unsettled_earnings || 0).toFixed(2)),
      pendingPayoutsTotal: Number(Number(row.pending_payouts_total || 0).toFixed(2)),
      completedPayoutsTotal: Number(Number(row.completed_payouts_total || 0).toFixed(2)),
      currency,
    };
  }

  /**
   * Retrieves trending search terms with click-through rate (CTR) and conversion metrics.
   */
  async getTrendingSearchQueries(
    query: AnalyticsDateQuery & { limit?: number },
  ): Promise<TrendingSearchQueriesResponse> {
    const dateRange: DateFilterRange = analyticsRepository.resolveDateRange(
      query.period,
      query.from,
      query.to,
    );

    const rows = await analyticsRepository.getTrendingSearchQueries(
      dateRange,
      query.limit ?? 25,
    );

    const queries = rows.map((r) => ({
      query: r.query,
      searchCount: Number(r.search_count) || 0,
      clickedCount: Number(r.clicked_count) || 0,
      conversionsCount: Number(r.conversions_count) || 0,
      ctr: Number(r.ctr) || 0,
      avgResults: Number(r.avg_results) || 0,
      lastSearchedAt: r.last_searched_at || "",
    }));

    return {
      period: dateRange.periodLabel,
      queries,
    };
  }

  /**
   * Retrieves zero-result searches (the Unmet Demand Gold Mine).
   */
  async getZeroResultSearches(
    query: ZeroResultsQuery,
  ): Promise<ZeroResultSearchesResponse> {
    const dateRange: DateFilterRange = analyticsRepository.resolveDateRange(
      query.period,
      query.from,
      query.to,
    );

    const rows = await analyticsRepository.getZeroResultSearches(
      dateRange,
      query.limit,
      query.minQueries,
    );

    const queries = rows.map((r) => ({
      query: r.query,
      searchCount: Number(r.search_count) || 0,
      lastSearchedAt: r.last_searched_at || "",
    }));

    return {
      period: dateRange.periodLabel,
      unmetDemandCount: queries.length,
      queries,
    };
  }

  /**
   * Retrieves the search-to-purchase conversion funnel.
   */
  async getSearchConversionFunnel(
    query: AnalyticsDateQuery,
  ): Promise<SearchConversionFunnelResponse> {
    const dateRange: DateFilterRange = analyticsRepository.resolveDateRange(
      query.period,
      query.from,
      query.to,
    );

    const row = await analyticsRepository.getSearchConversionFunnel(dateRange);

    const totalSearches = Number(row.total_searches) || 0;
    const searchesWithResults = Number(row.searches_with_results) || 0;
    const searchesWithClicks = Number(row.searches_with_clicks) || 0;
    const searchesConverted = Number(row.searches_converted) || 0;

    const resultsRate =
      totalSearches > 0
        ? Number(((searchesWithResults / totalSearches) * 100).toFixed(1))
        : 0;

    const ctr =
      totalSearches > 0
        ? Number(((searchesWithClicks / totalSearches) * 100).toFixed(1))
        : 0;

    const conversionRate =
      totalSearches > 0
        ? Number(((searchesConverted / totalSearches) * 100).toFixed(1))
        : 0;

    return {
      period: dateRange.periodLabel,
      funnel: {
        totalSearches,
        searchesWithResults,
        searchesWithClicks,
        searchesConverted,
        resultsRate,
        ctr,
        conversionRate,
      },
    };
  }

  /**
   * Ingests a search event from the storefront.
   */
  async trackSearchEvent(
    input: TrackSearchEventInput,
    meta: { userId?: string | null; ipAddress?: string | null; userAgent?: string | null },
  ): Promise<void> {
    await analyticsRepository.logSearchEvent({
      queryText: input.queryText,
      resultsCount: input.resultsCount,
      categoryId: input.categoryId,
      sessionId: input.sessionId,
      userId: meta.userId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  /**
   * Tracks a search result click.
   */
  async trackSearchClick(input: TrackSearchClickInput): Promise<void> {
    await analyticsRepository.recordSearchClick(input.sessionId, input.assetId);
  }

  /**
   * Retrieves storefront visitor-to-purchase conversion funnel.
   */
  async getStorefrontFunnel(
    query: AnalyticsDateQuery,
  ): Promise<StorefrontFunnelResponse> {
    const dateRange = analyticsRepository.resolveDateRange(
      query.period,
      query.from,
      query.to,
    );

    const row = await analyticsRepository.getStorefrontFunnel(dateRange);

    const visitors = Number(row.total_visitors) || 0;
    const views = Number(row.asset_viewers) || 0;
    const carts = Number(row.cart_adders) || 0;
    const checkouts = Number(row.checkout_starters) || 0;
    const purchases = Number(row.checkout_completers) || 0;

    const calcDropOff = (current: number, previous: number) => {
      if (previous <= 0) return 0;
      const drop = Math.max(0, previous - current);
      return Number(((drop / previous) * 100).toFixed(1));
    };

    const calcConv = (current: number) => {
      if (visitors <= 0) return 0;
      return Number(((current / visitors) * 100).toFixed(1));
    };

    const stages: FunnelStage[] = [
      {
        stage: "Storefront Visitors",
        count: visitors,
        dropOffRate: 0,
        conversionRate: 100,
      },
      {
        stage: "Asset Views",
        count: views,
        dropOffRate: calcDropOff(views, visitors),
        conversionRate: calcConv(views),
      },
      {
        stage: "Cart Additions",
        count: carts,
        dropOffRate: calcDropOff(carts, views),
        conversionRate: calcConv(carts),
      },
      {
        stage: "Checkout Initiated",
        count: checkouts,
        dropOffRate: calcDropOff(checkouts, carts),
        conversionRate: calcConv(checkouts),
      },
      {
        stage: "Purchase Completed",
        count: purchases,
        dropOffRate: calcDropOff(purchases, checkouts),
        conversionRate: calcConv(purchases),
      },
    ];

    return {
      period: dateRange.periodLabel,
      totalVisitors: visitors,
      stages,
    };
  }

  /**
   * Retrieves monthly buyer cohort retention matrices.
   */
  async getBuyerCohortRetention(): Promise<BuyerCohortRetentionResponse> {
    const rows = await analyticsRepository.getBuyerCohortRetention();

    const cohorts = rows.map((r) => {
      const total = Number(r.total_buyers) || 0;
      const m0 = Number(r.month_0_buyers) || 0;
      const m1 = Number(r.month_1_buyers) || 0;
      const m2 = Number(r.month_2_buyers) || 0;
      const m3 = Number(r.month_3_buyers) || 0;

      const calcPct = (cnt: number) =>
        total > 0 ? Number(((cnt / total) * 100).toFixed(1)) : 0;

      return {
        cohort: r.cohort,
        totalBuyers: total,
        month0: { count: m0, retentionPct: calcPct(m0) },
        month1: { count: m1, retentionPct: calcPct(m1) },
        month2: { count: m2, retentionPct: calcPct(m2) },
        month3: { count: m3, retentionPct: calcPct(m3) },
      };
    });

    return { cohorts };
  }

  /**
   * Retrieves download telemetry, bandwidth metrics, and delivery fulfillment.
   */
  async getDownloadsOverview(
    query: AnalyticsDateQuery,
  ): Promise<DownloadsOverviewResponse> {
    const dateRange = analyticsRepository.resolveDateRange(
      query.period,
      query.from,
      query.to,
    );

    const row = await analyticsRepository.getDownloadsOverview(dateRange);

    const bytes = Number(row.total_bytes_transferred) || 0;
    const gigabytes = Number((bytes / (1024 * 1024 * 1024)).toFixed(2));

    return {
      period: dateRange.periodLabel,
      totalDownloads: Number(row.total_downloads) || 0,
      totalBytesTransferred: bytes,
      totalGigabytesTransferred: gigabytes,
      uniqueDownloaders: Number(row.unique_downloaders) || 0,
      totalLicensedItems: Number(row.total_licensed_items) || 0,
      downloadedLicensedItems: Number(row.downloaded_licensed_items) || 0,
      fulfillmentRate: Number(row.fulfillment_rate) || 0,
      activeLicensesCount: Number(row.active_licenses_count) || 0,
      totalActivationsCount: Number(row.total_activations_count) || 0,
    };
  }

  /**
   * Retrieves download anomalies and potential scraping/anti-piracy incidents.
   */
  async getDownloadAnomalies(
    query: AnomaliesQuery,
  ): Promise<DownloadAnomaliesResponse> {
    const rows = await analyticsRepository.getDownloadAnomalies(query.limit);

    const anomalies = rows.map((r) => ({
      userId: r.user_id,
      userName: r.user_name || "Guest / Anonymous",
      userEmail: r.user_email || "",
      ipAddress: r.ip_address,
      licenseKey: r.license_key,
      downloadCount: Number(r.download_count) || 0,
      lastDownloadAt: r.last_download_at || "",
      anomalyType: r.anomaly_type,
      description: r.description,
    }));

    return { anomalies };
  }

  /**
   * Ingests a storefront funnel event.
   */
  async trackStorefrontEvent(
    input: TrackStorefrontEventInput,
    meta: {
      userId?: string | null;
      ipAddress?: string | null;
      userAgent?: string | null;
    },
  ): Promise<void> {
    await analyticsRepository.logStorefrontEvent({
      visitorId: input.visitorId,
      eventType: input.eventType,
      assetId: input.assetId,
      metadata: input.metadata,
      userId: meta.userId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  /**
   * Retrieves coupon campaign performance and top redeeming promo codes.
   */
  async getCouponsSummary(
    query: AnalyticsDateQuery,
  ): Promise<CouponsSummaryResponse> {
    const dateRange = analyticsRepository.resolveDateRange(
      query.period,
      query.from,
      query.to,
    );

    const [{ summary, topCoupons }, currency] = await Promise.all([
      analyticsRepository.getCouponsSummary(dateRange),
      this.getPlatformCurrency(),
    ]);

    const mappedCoupons = topCoupons.map((c) => ({
      couponId: c.coupon_id,
      code: c.code,
      discountPercent: Number(c.discount_percent) || 0,
      sellerId: c.seller_id,
      sellerName: c.seller_name || "Platform Admin",
      redemptionsCount: Number(c.redemptions_count) || 0,
      discountBurned: Number(Number(c.discount_burned || 0).toFixed(2)),
      grossRevenue: Number(Number(c.gross_revenue || 0).toFixed(2)),
      netRevenue: Number(Number(c.net_revenue || 0).toFixed(2)),
    }));

    return {
      period: dateRange.periodLabel,
      currency,
      metrics: {
        totalRedemptions: Number(summary.total_redemptions) || 0,
        totalDiscountBurned: Number(Number(summary.total_discount_burned || 0).toFixed(2)),
        promoGmv: Number(Number(summary.promo_gmv || 0).toFixed(2)),
        promoNetRevenue: Number(Number(summary.promo_net_revenue || 0).toFixed(2)),
        roiMultiple: Number(summary.roi_multiple) || 0,
        avgDiscountPercent: Number(summary.avg_discount_percent) || 0,
      },
      topCoupons: mappedCoupons,
    };
  }

  /**
   * Retrieves merchandising telemetry for hero showcases and top announcement banners.
   */
  async getBannersPerformance(
    query: AnalyticsDateQuery,
  ): Promise<MarketingBannersResponse> {
    const dateRange = analyticsRepository.resolveDateRange(
      query.period,
      query.from,
      query.to,
    );

    const rows = await analyticsRepository.getBannersAndHeroPerformance(dateRange);

    const campaigns = rows.map((r) => ({
      campaignType: r.campaign_type,
      campaignId: r.campaign_id,
      title: r.title,
      imageUrl: r.image_url,
      badgeType: r.badge_type,
      isActive: Boolean(r.is_active),
      impressionsCount: Number(r.impressions_count) || 0,
      clicksCount: Number(r.clicks_count) || 0,
      ctr: Number(r.ctr) || 0,
      directConversions: Number(r.direct_conversions) || 0,
      attributedGmv: Number(Number(r.attributed_gmv || 0).toFixed(2)),
    }));

    return {
      period: dateRange.periodLabel,
      campaigns,
    };
  }

  /**
   * Retrieves conversion impact metrics for editorially curated and featured inventory.
   */
  async getCurationImpact(): Promise<CurationImpactResponse> {
    const row = await analyticsRepository.getCurationImpact();

    return {
      curatedAssetCount: Number(row.curated_asset_count) || 0,
      standardAssetCount: Number(row.standard_asset_count) || 0,
      curatedUnitsSold: Number(row.curated_units_sold) || 0,
      standardUnitsSold: Number(row.standard_units_sold) || 0,
      curatedGmv: Number(Number(row.curated_gmv || 0).toFixed(2)),
      standardGmv: Number(Number(row.standard_gmv || 0).toFixed(2)),
      curatedAvgSalesPerAsset: Number(row.curated_avg_sales_per_asset) || 0,
      standardAvgSalesPerAsset: Number(row.standard_avg_sales_per_asset) || 0,
      curatedConversionMultiplier: Number(row.curated_conversion_multiplier) || 1,
      curatedGmvSharePct: Number(row.curated_gmv_share_pct) || 0,
    };
  }

  /**
   * Ingests a marketing promotional interaction (impression, click, conversion).
   */
  async trackMarketingInteraction(
    input: TrackMarketingInteractionInput,
  ): Promise<void> {
    await analyticsRepository.recordMarketingInteraction({
      campaignType: input.campaignType,
      campaignId: input.campaignId,
      action: input.action,
      attributedGmv: input.attributedGmv,
    });
  }

  /**
   * Retrieves automated growth triggers and actionable platform insights.
   */
  async getGrowthTriggers(): Promise<GrowthTriggersResponse> {
    const rows = await analyticsRepository.getGrowthTriggers();

    const triggers: GrowthTriggerItem[] = rows.map((r) => ({
      id: r.id,
      triggerType: r.trigger_type,
      severity: (r.severity as any) || "medium",
      title: r.title,
      description: r.description,
      recommendedAction: r.recommended_action,
      targetEntityType: r.target_entity_type,
      targetEntityId: r.target_entity_id,
      metadata: r.metadata,
      createdAt: r.created_at,
    }));

    return { triggers };
  }

  /**
   * Acknowledges / dismisses a platform growth trigger.
   */
  async dismissGrowthTrigger(
    triggerId: string,
    userId?: string | null,
  ): Promise<boolean> {
    return analyticsRepository.dismissGrowthTrigger(triggerId, userId);
  }

  /**
   * Generates a downloadable CSV report for administrative accounting and analysis.
   */
  async exportCsvReport(
    query: ReportExportQuery,
  ): Promise<{ filename: string; csvContent: string }> {
    const dateRange = analyticsRepository.resolveDateRange(
      query.period,
      query.from,
      query.to,
    );

    let rows: Record<string, any>[] = [];
    let filenamePrefix = "financial";

    if (query.reportType === "catalog") {
      rows = await analyticsRepository.getCatalogCsvRows(dateRange);
      filenamePrefix = "catalog_leaderboard";
    } else if (query.reportType === "coupons") {
      rows = await analyticsRepository.getCouponsCsvRows(dateRange);
      filenamePrefix = "coupons_redemptions";
    } else {
      rows = await analyticsRepository.getFinancialCsvRows(dateRange);
      filenamePrefix = "orders_financial";
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `assetdrop_${filenamePrefix}_${query.period}_${dateStr}.csv`;
    const csvContent = this.formatToCsv(rows);

    return { filename, csvContent };
  }

  private formatToCsv(rows: Record<string, any>[]): string {
    if (rows.length === 0) return "No records found for this period\r\n";
    const headers = Object.keys(rows[0]!);
    const csvLines: string[] = [];

    csvLines.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","));

    for (const row of rows) {
      const values = headers.map((header) => {
        const val = row[header];
        if (val === null || val === undefined) return '""';
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      });
      csvLines.push(values.join(","));
    }

    return csvLines.join("\r\n");
  }
}

export const analyticsService = new AnalyticsService();

