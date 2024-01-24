import express from "express";
import trimRequest from "trim-request";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  handleWabaWebhookMessages,
  handleIncomingWabaFlowMessages,
  handleDownloadFileFromWaba,
} from "../controllers/waba.controller.js";

const router = express.Router();

router
  .route("/webhook")
  .post(trimRequest.all, authMiddleware, handleWabaWebhookMessages);
router.route("/flows").post(trimRequest.all, handleIncomingWabaFlowMessages);
router.route("/download").post(trimRequest.all, handleDownloadFileFromWaba);

export default router;
