import express from "express";
import {
  createReservation,
  getMyReservations,
  confirmReservation,
  cancelReservation,
} from "../controllers/reservationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { reservationValidationRules } from "../middleware/validators.js";
import { isAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/", protect, reservationValidationRules(), createReservation);
router.get("/my", protect, getMyReservations);
router.post("/:id/confirm", protect, isAdmin, confirmReservation);
router.post("/:id/cancel", protect, isAdmin, cancelReservation);
export default router;
