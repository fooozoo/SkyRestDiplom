import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");

console.log(``);
const dotenvResult = dotenv.config({ path: envPath });

if (dotenvResult.error) {
  console.error(" ", dotenvResult.error);
} else {
  console.log(``, process.env.DB_PORT);
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
