import { Router } from "express";
import { ExclusionRuleController } from "../../controllers/ExclusionRuleController";
import { validate } from "../../middleware/validation";
import {
  createExclusionRuleSchema,
  getExclusionsQuerySchema,
  exclusionRuleParamsSchema,
  giftExchangeParamsSchema,
} from "../../validation/exclusionRule";

const router = Router();
const exclusionRuleController = new ExclusionRuleController();

// GET /api/v1/exclusion-rules/:giftExchangeId
router.get(
  "/:giftExchangeId",
  validate(giftExchangeParamsSchema.merge(getExclusionsQuerySchema)),
  exclusionRuleController.getExclusionRulesForExchange,
);

// POST /api/v1/exclusion-rules/:giftExchangeId
router.post(
  "/:giftExchangeId",
  validate(giftExchangeParamsSchema.merge(createExclusionRuleSchema)),
  exclusionRuleController.createExclusionRule,
);

// DELETE /api/v1/exclusion-rules/:giftExchangeId/:id
router.delete(
  "/:giftExchangeId/:id",
  validate(giftExchangeParamsSchema.merge(exclusionRuleParamsSchema)),
  exclusionRuleController.deleteExclusionRule,
);

// GET /api/v1/exclusion-rules/:giftExchangeId/validate
router.get(
  "/:giftExchangeId/validate",
  validate(giftExchangeParamsSchema),
  exclusionRuleController.validateExclusionRules,
);

export default router;
