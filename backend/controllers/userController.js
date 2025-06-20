import { pool } from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
const getUserProfile = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ message: "Користувача не знайдено в токені" });
  }

  try {
    let connection;
    try {
      connection = await pool.getConnection();
      const [users] = await connection.query(
        "SELECT id, username, email, created_at, avatar_url, role FROM users WHERE id = ?",
        [userId],
      );

      if (users.length > 0) {
        res.json(users[0]);
      } else {
        res
          .status(404)
          .json({ message: "Користувача не знайдено в базі даних" });
      }
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Помилка сервера при отриманні профілю" });
  }
};
const updateUserAvatar = async (req, res) => {
  const userId = req.user?.id;

  if (!req.file) {
    return res.status(400).json({ message: "Файл аватара не завантажено." });
  }

  if (!userId) {
    return res.status(401).json({ message: "Користувач не авторизований." });
  }

  console.log(
    `Received avatar upload for user ID: ${userId}, Filename: ${req.file.originalname}, Size: ${req.file.size}`,
  );

  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "skyrest_avatars",
      public_id: `user_${userId}_avatar`,
      overwrite: true,
      resource_type: "image",
    },
    async (error, result) => {
      if (error) {
        console.error("Cloudinary upload error:", error);
        return res
          .status(500)
          .json({ message: "Помилка завантаження зображення в хмару." });
      }

      if (!result) {
        return res
          .status(500)
          .json({ message: "Cloudinary не повернув результат." });
      }

      const avatarUrl = result.secure_url;
      const publicId = result.public_id;

      console.log(
        `Cloudinary upload successful for user ${userId}. URL: ${avatarUrl}`,
      );

      let connection;
      try {
        connection = await pool.getConnection();
        await connection.query("UPDATE users SET avatar_url = ? WHERE id = ?", [
          avatarUrl,
          userId,
        ]);
        console.log(`Database updated for user ${userId} with new avatar URL.`);

        res.json({
          message: "Аватар успішно оновлено!",
          avatarUrl: avatarUrl,
        });
      } catch (dbError) {
        console.error(
          "Database update error after Cloudinary upload:",
          dbError,
        );
        res
          .status(500)
          .json({ message: "Помилка збереження URL аватара в базі даних." });
      } finally {
        if (connection) connection.release();
      }
    },
  );
  uploadStream.end(req.file.buffer);
};
export { getUserProfile, updateUserAvatar };
