import { Router } from "express";
import participantsRouter from "./v1/participantRoutes";
import giftExchangesRouter from "./v1/giftExchangeRoutes";
import assignmentRouter from "./v1/assignmentRoutes";
import exclusionRulesRouter from "./v1/exclusionRulesRoutes";
import { ResponseHelper } from "../utils/ResponseHelper";
import DatabaseService from "../services/database";

const router = Router();

// Health check endpoint
router.get("/health", async (_req, res) => {
  try {
    const dbHealth = await DatabaseService.getInstance().healthCheck();

    if (dbHealth) {
      ResponseHelper.success(res, {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env["NODE_ENV"] || "development",
        database: "connected",
      });
    } else {
      ResponseHelper.error(
        res,
        "Database connection failed",
        503,
        "Service temporarily unavailable",
      );
    }
  } catch (error) {
    ResponseHelper.error(
      res,
      "Health check failed",
      503,
      "Service temporarily unavailable",
    );
  }
});

// API version 1 routes
router.use("/v1/participants", participantsRouter);
router.use("/v1/gift-exchanges", giftExchangesRouter);
router.use("/v1/assignments", assignmentRouter);
router.use("/v1/exclusion-rules", exclusionRulesRouter);

export default router;
