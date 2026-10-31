import { Router } from "express";
import { analyticsController } from "./analytics.controller.js";
import {
  authenticate,
  requireOrgAdmin,
} from "../../core/middleware/auth.middleware.js";

const router = Router();

// ============================================================================
// Public Storefront Telemetry Ingestion Routes (Unauthenticated / Guest safe)
// ============================================================================
router.post(
  "/search/track",
  analyticsController.trackSearchEvent.bind(analyticsController),
);

router.post(
  "/search/click",
  analyticsController.trackSearchClick.bind(analyticsController),
);

router.post(
  "/events/track",
  analyticsController.trackStorefrontEvent.bind(analyticsController),
);

router.post(
  "/marketing/track-interaction",
  analyticsController.trackMarketingInteraction.bind(analyticsController),
);

// ============================================================================
// Platform Admin Analytics Access Guard
// ============================================================================
router.use(authenticate);
router.use(requireOrgAdmin);

// ============================================================================
// Financial & Revenue Metrics Routes
// ============================================================================
router.get(
  "/financial/summary",
  analyticsController.getFinancialSummary.bind(analyticsController),
);

router.get(
  "/financial/revenue-trend",
  analyticsController.getRevenueTrend.bind(analyticsController),
);

router.get(
  "/financial/license-tiers",
  analyticsController.getLicenseTierStats.bind(analyticsController),
);

router.get(
  "/financial/top-creators",
  analyticsController.getTopCreators.bind(analyticsController),
);

// ============================================================================
// Marketplace Supply & Catalog Analytics Routes
// ============================================================================
router.get(
  "/catalog/leaderboard",
  analyticsController.getCatalogLeaderboard.bind(analyticsController),
);

router.get(
  "/catalog/category-distribution",
  analyticsController.getCategoryDistribution.bind(analyticsController),
);

router.get(
  "/catalog/velocity-stats",
  analyticsController.getCatalogVelocityStats.bind(analyticsController),
);

router.get(
  "/creators/concentration-curve",
  analyticsController.getCreatorConcentration.bind(analyticsController),
);

// ============================================================================
// Search & Unmet Demand Analytics Routes (Admin)
// ============================================================================
router.get(
  "/search/trending-queries",
  analyticsController.getTrendingSearchQueries.bind(analyticsController),
);

router.get(
  "/search/zero-results",
  analyticsController.getZeroResultSearches.bind(analyticsController),
);

router.get(
  "/search/conversion-funnel",
  analyticsController.getSearchConversionFunnel.bind(analyticsController),
);

// ============================================================================
// Buyer Behavior & Consumption Telemetry Routes (Admin)
// ============================================================================
router.get(
  "/buyers/funnel",
  analyticsController.getStorefrontFunnel.bind(analyticsController),
);

router.get(
  "/buyers/cohort-retention",
  analyticsController.getBuyerCohortRetention.bind(analyticsController),
);

router.get(
  "/downloads/overview",
  analyticsController.getDownloadsOverview.bind(analyticsController),
);

router.get(
  "/downloads/anomalies",
  analyticsController.getDownloadAnomalies.bind(analyticsController),
);

// ============================================================================
// Marketing & Promotion Performance Routes (Admin)
// ============================================================================
router.get(
  "/marketing/coupons-summary",
  analyticsController.getCouponsSummary.bind(analyticsController),
);

router.get(
  "/marketing/banners-performance",
  analyticsController.getBannersPerformance.bind(analyticsController),
);

router.get(
  "/marketing/curation-impact",
  analyticsController.getCurationImpact.bind(analyticsController),
);

// ============================================================================
// Actionable Growth Levers & Intelligence Routes (Admin)
// ============================================================================
router.get(
  "/insights/automated-triggers",
  analyticsController.getGrowthTriggers.bind(analyticsController),
);

router.post(
  "/insights/:id/dismiss",
  analyticsController.dismissGrowthTrigger.bind(analyticsController),
);

router.get(
  "/reports/export-csv",
  analyticsController.exportCsvReport.bind(analyticsController),
);

export default router;
export { router as analyticsRoutes };

