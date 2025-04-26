import cors from "cors";
import express from "express";
import config from "./config/index.js";
import { pool, checkConnection } from "./config/db.js";
import authRoutes from "./routes/userRoutes.js";
import userRoutes from "./routes/userRoutes.js";
const app = express();
// Используем порт сервера из конфигурации
const PORT = config.server.port;

// --- Middleware (cors, express.json и т.д.) остаются как были ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Маршруты остаются как были ---
app.get("/", (req, res) => {
  res.send("Hello from backend");
});

// Підключаємо маршрути автентифікації з префіксом /api/auth
app.use("/api/auth", authRoutes); // <--- Додай цей рядок
app.use("/api/users", userRoutes); // <--- Подключаем маршруты пользователя
// --- Запуск сервера остается как был ---
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  // Вызов проверки соединения остается
  await checkConnection();
});
