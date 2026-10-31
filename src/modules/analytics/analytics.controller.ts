import type { Request, Response, NextFunction } from "express";
import { analyticsService } from "./analytics.service.js";
import {
  AnalyticsDateQuerySchema,
  RevenueTrendQuerySchema,
  TopCreatorsQuerySchema,
  CatalogLeaderboardQuerySchema,
  ZeroResultsQuerySchema,
  TrackSearchEventSchema,
  TrackSearchClickSchema,
  TrackStorefrontEventSchema,
  AnomaliesQuerySchema,
  TrackMarketingInteractionSchema,
  ReportExportQuerySchema,
} from "./analytics.schema.js";

export class AnalyticsController {
  async getFinancialSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = AnalyticsDateQuerySchema.parse(req.query);
      const summary = await analyticsService.getFinancialSummary(query);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  async getRevenueTrend(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = RevenueTrendQuerySchema.parse(req.query);
      const trend = await analyticsService.getRevenueTrend(query);

      res.status(200).json({
        success: true,
        data: trend,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLicenseTierStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = AnalyticsDateQuerySchema.parse(req.query);
      const stats = await analyticsService.getLicenseTierStats(query);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTopCreators(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = TopCreatorsQuerySchema.parse(req.query);
      const topCreators = await analyticsService.getTopCreators(query);

      res.status(200).json({
        success: true,
        data: topCreators,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCatalogLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = CatalogLeaderboardQuerySchema.parse(req.query);
      const leaderboard = await analyticsService.getCatalogLeaderboard(query);

      res.status(200).json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategoryDistribution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = AnalyticsDateQuerySchema.parse(req.query);
      const categories = await analyticsService.getCategoryDistribution(query);

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCatalogVelocityStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await analyticsService.getCatalogVelocityStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCreatorConcentration(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await analyticsService.getCreatorConcentration();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTrendingSearchQueries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = AnalyticsDateQuerySchema.extend({
        limit: TopCreatorsQuerySchema.shape.limit,
      }).parse(req.query);
      const results = await analyticsService.getTrendingSearchQueries(query);

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  async getZeroResultSearches(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = ZeroResultsQuerySchema.parse(req.query);
      const results = await analyticsService.getZeroResultSearches(query);

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSearchConversionFunnel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = AnalyticsDateQuerySchema.parse(req.query);
      const funnel = await analyticsService.getSearchConversionFunnel(query);

      res.status(200).json({
        success: true,
        data: funnel,
      });
    } catch (error) {
      next(error);
    }
  }

  async trackSearchEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = TrackSearchEventSchema.parse(req.body);
      const userId = (req as any).user?.id || null;
      const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket?.remoteAddress || null;
      const userAgent = (req.headers["user-agent"] as string) || null;

      await analyticsService.trackSearchEvent(input, { userId, ipAddress, userAgent });

      res.status(200).json({
        success: true,
        message: "Search event logged",
      });
    } catch (error) {
      next(error);
    }
  }

  async trackSearchClick(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = TrackSearchClickSchema.parse(req.body);
      await analyticsService.trackSearchClick(input);

      res.status(200).json({
        success: true,
        message: "Search click tracked",
      });
    } catch (error) {
      next(error);
    }
  }

  async getStorefrontFunnel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = AnalyticsDateQuerySchema.parse(req.query);
      const funnel = await analyticsService.getStorefrontFunnel(query);

      res.status(200).json({
        success: true,
        data: funnel,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBuyerCohortRetention(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cohorts = await analyticsService.getBuyerCohortRetention();

      res.status(200).json({
        success: true,
        data: cohorts,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDownloadsOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = AnalyticsDateQuerySchema.parse(req.query);
      const overview = await analyticsService.getDownloadsOverview(query);

      res.status(200).json({
        success: true,
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDownloadAnomalies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = AnomaliesQuerySchema.parse(req.query);
      const anomalies = await analyticsService.getDownloadAnomalies(query);

      res.status(200).json({
        success: true,
        data: anomalies,
      });
    } catch (error) {
      next(error);
    }
  }

  async trackStorefrontEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = TrackStorefrontEventSchema.parse(req.body);
      const userId = (req as any).user?.id || null;
      const ipAddress = (req.headers["x-forwarded-for"] as string) || req.socket?.remoteAddress || null;
      const userAgent = (req.headers["user-agent"] as string) || null;

      await analyticsService.trackStorefrontEvent(input, { userId, ipAddress, userAgent });

      res.status(200).json({
        success: true,
        message: "Storefront event logged",
      });
    } catch (error) {
      next(error);
    }
  }

  async getCouponsSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = AnalyticsDateQuerySchema.parse(req.query);
      const coupons = await analyticsService.getCouponsSummary(query);

      res.status(200).json({
        success: true,
        data: coupons,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBannersPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = AnalyticsDateQuerySchema.parse(req.query);
      const banners = await analyticsService.getBannersPerformance(query);

      res.status(200).json({
        success: true,
        data: banners,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurationImpact(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const impact = await analyticsService.getCurationImpact();

      res.status(200).json({
        success: true,
        data: impact,
      });
    } catch (error) {
      next(error);
    }
  }

  async trackMarketingInteraction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = TrackMarketingInteractionSchema.parse(req.body);
      await analyticsService.trackMarketingInteraction(input);

      res.status(200).json({
        success: true,
        message: "Marketing interaction recorded",
      });
    } catch (error) {
      next(error);
    }
  }

  async getGrowthTriggers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const triggers = await analyticsService.getGrowthTriggers();

      res.status(200).json({
        success: true,
        data: triggers,
      });
    } catch (error) {
      next(error);
    }
  }

  async dismissGrowthTrigger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const triggerId = String(req.params.id);
      const userId = (req as any).user?.id || null;

      await analyticsService.dismissGrowthTrigger(triggerId, userId);

      res.status(200).json({
        success: true,
        message: "Growth trigger dismissed",
      });
    } catch (error) {
      next(error);
    }
  }

  async exportCsvReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = ReportExportQuerySchema.parse(req.query);
      const { filename, csvContent } = await analyticsService.exportCsvReport(query);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();

