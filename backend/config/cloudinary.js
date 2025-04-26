import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // Всегда использовать HTTPS
  });
  console.log("Cloudinary configuration successful.");
} catch (error) {
  console.error("Cloudinary configuration failed:", error);
  // В реальном приложении здесь стоит обработать ошибку более серьезно
}

export default cloudinary; // Экспортируем настроенный объект cloudinary
