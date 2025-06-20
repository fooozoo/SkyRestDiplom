import express from "express";
// Імпортуємо логіку контролера
import { registerUser, loginUser } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  getUserProfile,
  updateUserAvatar,
} from "../controllers/userController.js";
//Валідатори
import {
  registerValidationRules,
  loginValidationRules,
} from "../middleware/validators.js";
import upload from "../middleware/uploadMiddleware.js";
const router = express.Router();

// Маршрут для реєстрації
router.post("/register", registerValidationRules(), registerUser);
router.post("/login", loginValidationRules(), loginUser);
router.get("/me", protect, getUserProfile);
router.post("/avatar", protect, upload.single("avatar"), updateUserAvatar);

export default router;
