import { Router } from "express";
import participantsRouter from "./v1/participantRoutes";
import giftExchangesRouter from "./v1/giftExchangeRoutes";
import assignmentRouter from "./v1/assignmentRoutes";
import exclusionRulesRouter from "./v1/exclusionRulesRoutes";

const router = Router();

// API version 1 routes
router.use("/v1/participants", participantsRouter);
router.use("/v1/gift-exchanges", giftExchangesRouter);
router.use("/v1/assignments", assignmentRouter);
router.use("/v1/exclusion-rules", exclusionRulesRouter);

export default router;
