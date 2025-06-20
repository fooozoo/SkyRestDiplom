import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

console.log(`--- DEBUG [config/index.js]: Загружаю .env из ${envPath} ---`);
const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
  console.error(
    "--- DEBUG [config/index.js]: Ошибка загрузки .env:",
    dotenvResult.error,
  );
} else {
  console.log(
    `--- DEBUG [config/index.js]: .env загружен. process.env.DB_PORT =`,
    process.env.DB_PORT,
  );
}

export default {
  db: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || "3306", 10),
  },
  server: {
    port: parseInt(process.env.PORT || "5000", 10),
  },
};
