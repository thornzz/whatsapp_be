import express from "express";
import trimRequest from "trim-request";

import { closeConversation, create_open_conversation, createGroup, getConversations, getUserReceiverConversations, transferConversation } from "../controllers/conversation.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .post(trimRequest.all, authMiddleware, create_open_conversation);
router.route("/").get(trimRequest.all, authMiddleware, getConversations);

router
  .route("/user")
  .get(trimRequest.all, authMiddleware, getUserReceiverConversations);

router.route("/group").post(trimRequest.all, authMiddleware, createGroup);

router.route("/close").post(trimRequest.all, authMiddleware, closeConversation);

router
  .route("/transfer")
  .post(trimRequest.all, authMiddleware, transferConversation);
  
export default router;
