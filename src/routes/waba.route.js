import express from "express";
import trimRequest from "trim-request";
import authMiddleware from "../middlewares/authMiddleware.js";
import { handleWabaWebhookMessages } from "../controllers/waba.controller.js";

const router = express.Router();

router
  .route("/webhook")
  .post(trimRequest.all, authMiddleware, handleWabaWebhookMessages);

export default router;
