import express from "express";
import {
  getMenuItems,
  createMenuItem,
  deleteMenuItem,
  updateMenuItem,
} from "../controllers/menuController.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/adminMiddleware.js";
import upload from "../middleware/uploadMiddleware.js"; //multer
import { menuItemValidationRules } from "../middleware/validators.js"; // Валідатори
// Створюємо новий екземпляр маршрутизатора
const router = express.Router();
router.get("/", getMenuItems);
router.post(
  "/",
  protect, // 1. Перевірка JWT
  isAdmin, // 2. Перевірка ролі
  upload.single("image"), // 3. Приймаємо файл з поля image
  menuItemValidationRules(), // 4. Валідація текстових полів
  createMenuItem, // 5. Логіка створення
);
router.put(
  "/:id",
  protect,
  isAdmin,
  upload.single("image"),
  menuItemValidationRules(),
  updateMenuItem,
);
router.delete("/:id", protect, isAdmin, deleteMenuItem);
export default router;
