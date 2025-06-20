import express from "express";
import { createOrder, getMyOrders } from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js"; // Захист для залогінених

const router = express.Router();
// Маршрут для створення нового замовлення
router.post("/", protect, createOrder);
router.get("/my", protect, getMyOrders);

export default router;
