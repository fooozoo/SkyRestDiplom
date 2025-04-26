import express from "express";
// Імпортуємо логіку контролера (ми створимо її наступним кроком)
import { registerUser, loginUser } from "../controllers/authController.js";
// Імпортуємо валідатори (опціонально)
import {
  registerValidationRules,
  loginValidationRules,
} from "../middleware/validators.js"; // Створимо цей файл

const router = express.Router();

// Маршрут для реєстрації: POST /api/auth/register
// Спочатку йде валідація, потім основна логіка
router.post("/register", registerValidationRules(), registerUser);
router.post("/login", loginValidationRules(), loginUser);

// Тут можна додати інші маршрути автентифікації (напр., /login)

export default router;
