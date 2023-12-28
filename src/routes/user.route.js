import express from "express";
import trimRequest from "trim-request";
import { searchUsers,getSocketStatus } from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";
const router = express.Router();

router.route("/").get(trimRequest.all, authMiddleware, searchUsers);
router.route("/status").get(trimRequest.all, getSocketStatus);
export default router;
