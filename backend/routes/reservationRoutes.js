import express from "express";
import {
  createReservation,
  getMyReservations,
} from "../controllers/reservationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { reservationValidationRules } from "../middleware/validators.js";

const router = express.Router();

// Маршрут для створення нової резервації
router.post("/", protect, reservationValidationRules(), createReservation);
router.get("/my", protect, getMyReservations);

export default router;
