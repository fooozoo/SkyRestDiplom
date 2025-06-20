import express from "express";
import {
  getAllTables,
  getTableAvailability,
} from "../controllers/tableController.js";

const router = express.Router();

// Маршрут для отримання опису всіх активних столиків
router.get("/", getAllTables);
// Маршрут для перевірки доступності столиків на дату і час
router.get("/availability", getTableAvailability);

export default router;
