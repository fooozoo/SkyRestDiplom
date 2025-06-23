import express from "express";
import {
  getUnreadCount,
  getUnreadNotifications,
  markAllAsRead,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/unread-count", protect, isAdmin, getUnreadCount);

router.get("/unread", protect, isAdmin, getUnreadNotifications);

router.post("/mark-as-read", protect, isAdmin, markAllAsRead);

export default router;
