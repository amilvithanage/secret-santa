import { Request, Response, NextFunction } from "express";
import { ExclusionRuleService } from "../services/exclusionRuleService";
import { ApiResponse } from "@secret-santa/shared-types";
import { ResponseHelper } from "../utils/ResponseHelper";

export class ExclusionRuleController {
  private exclusionRuleService: ExclusionRuleService;

  constructor() {
    this.exclusionRuleService = new ExclusionRuleService();
  }

  /**
   * Create a new exclusion rule
   * POST /api/v1/exclusion-rules/:giftExchangeId
   */
  createExclusionRule = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { giftExchangeId } = req.params;
      const exclusionRule = await this.exclusionRuleService.createExclusionRule(
        giftExchangeId,
        req.body,
      );

      ResponseHelper.created(
        res,
        exclusionRule,
        "Exclusion rule created successfully",
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get exclusion rules for a gift exchange
   * GET /api/v1/exclusion-rules/:giftExchangeId
   */
  getExclusionRulesForExchange = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { giftExchangeId } = req.params;
      const result =
        await this.exclusionRuleService.getExclusionRulesForExchange(
          giftExchangeId,
          req.query as any,
        );

      ResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete an exclusion rule
   * DELETE /api/v1/exclusion-rules/:giftExchangeId/:id
   */
  deleteExclusionRule = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      await this.exclusionRuleService.deleteExclusionRule(id);

      ResponseHelper.success(res, null, "Exclusion rule deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  /**
   * Validate exclusion rules for a gift exchange
   * GET /api/v1/exclusion-rules/:giftExchangeId/validate
   */
  validateExclusionRules = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { giftExchangeId } = req.params;
      const result =
        await this.exclusionRuleService.validateExclusionRules(giftExchangeId);

      ResponseHelper.success(res, result);
    } catch (error) {
      next(error);
    }
  };
}
