import express from "express";
import trimRequest from "trim-request";
import authMiddleware from "../middlewares/authMiddleware.js";
import { handleWabaWebhookMessages,handleIncomingWabaFlowMessages } from "../controllers/waba.controller.js";

const router = express.Router();

router
  .route("/webhook")
  .post(trimRequest.all, authMiddleware, handleWabaWebhookMessages);
  router
  .route("/flows")
  .post(trimRequest.all, handleIncomingWabaFlowMessages);

export default router;
