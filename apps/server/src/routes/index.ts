import { Router } from "express";
import participantsRouter from "./v1/participantRoutes";
import giftExchangesRouter from "./v1/giftExchangeRoutes";
import assignmentRouter from "./v1/assignmentRoutes";

const router = Router();

// API version 1 routes
router.use("/v1/participants", participantsRouter);
router.use("/v1/gift-exchanges", giftExchangesRouter);
router.use("/v1/assignments", assignmentRouter);

export default router;
