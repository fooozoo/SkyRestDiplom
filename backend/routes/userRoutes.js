import express from "express";
// Імпортуємо логіку контролера (ми створимо її наступним кроком)
import { registerUser, loginUser } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  getUserProfile,
  updateUserAvatar,
} from "../controllers/userController.js"; // Создадим этот контроллер
// Імпортуємо валідатори (опціонально)
import {
  registerValidationRules,
  loginValidationRules,
} from "../middleware/validators.js"; // Створимо цей файл
import upload from "../middleware/uploadMiddleware.js";
const router = express.Router();

// Маршрут для реєстрації: POST /api/auth/register
// Спочатку йде валідація, потім основна логіка
router.post("/register", registerValidationRules(), registerUser);
router.post("/login", loginValidationRules(), loginUser);
router.get("/me", protect, getUserProfile);
// ---> ДОБАВЛЯЕМ МАРШРУТ ЗАГРУЗКИ АВАТАРА <---
// POST /api/users/avatar
// 1. protect - Проверяем JWT
// 2. upload.single('avatar') - Принимаем один файл из поля 'avatar' формы
// 3. updateUserAvatar - Обрабатываем загрузку и сохранение
router.post("/avatar", protect, upload.single("avatar"), updateUserAvatar);
// ---> КОНЕЦ МАРШРУТА ЗАГРУЗКИ АВАТАРА <---

export default router;
