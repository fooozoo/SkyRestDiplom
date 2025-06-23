import express from "express";
import {
  createOrder,
  getMyOrders,
  confirmOrder,
  cancelOrder,
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();
router.post("/", protect, createOrder);
router.get("/my", protect, getMyOrders);
router.post("/:id/confirm", protect, isAdmin, confirmOrder);
router.post("/:id/cancel", protect, isAdmin, cancelOrder);

export default router;
