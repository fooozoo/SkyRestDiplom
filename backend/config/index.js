// backend/config/index.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Определяем путь к .env относительно ЭТОГО файла (config/index.js)
// Нам нужно подняться на один уровень вверх из 'config' в 'backend'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env"); // '../' поднимает на уровень выше

console.log(`--- DEBUG [config/index.js]: Загружаю .env из ${envPath} ---`);
const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
  console.error(
    "--- DEBUG [config/index.js]: Ошибка загрузки .env:",
    dotenvResult.error,
  );
} else {
  // Выводим значение DB_PORT сразу после загрузки dotenv
  console.log(
    `--- DEBUG [config/index.js]: .env загружен. process.env.DB_PORT =`,
    process.env.DB_PORT,
  );
}

// Экспортируем объект конфигурации
// Сразу преобразуем порты в числа и используем запасные значения
export default {
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER, // Пусть будет undefined, если не задан
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    // ВАЖНО: Парсим порт в число, используем 3306 по умолчанию
    port: parseInt(process.env.DB_PORT || "3306", 10),
  },
  server: {
    port: parseInt(process.env.PORT || "5000", 10),
  },
};
