import { pool } from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
// Функция для получения профиля залогиненного пользователя
const getUserProfile = async (req, res) => {
  // req.user был добавлен middleware 'protect' после проверки токена
  const userId = req.user?.id;

  if (!userId) {
    // Этого не должно произойти, если protect отработал правильно
    return res
      .status(401)
      .json({ message: "Користувача не знайдено в токені" });
  }

  try {
    let connection;
    try {
      connection = await pool.getConnection();
      // Получаем актуальные данные из БД
      const [users] = await connection.query(
        "SELECT id, username, email, created_at, avatar_url FROM users WHERE id = ?",
        [userId],
      );

      if (users.length > 0) {
        res.json(users[0]); // Отправляем данные пользователя (без хеша пароля)
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
  const userId = req.user?.id; // ID пользователя из JWT токена (добавлен middleware 'protect')

  // 1. Проверяем, был ли файл загружен multer'ом
  if (!req.file) {
    return res.status(400).json({ message: "Файл аватара не завантажено." });
  }

  // 2. Проверяем ID пользователя
  if (!userId) {
    return res.status(401).json({ message: "Користувач не авторизований." });
  }

  console.log(
    `Received avatar upload for user ID: ${userId}, Filename: ${req.file.originalname}, Size: ${req.file.size}`,
  );

  // 3. Загрузка в Cloudinary через stream
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: "skyrest_avatars", // Папка в Cloudinary (создастся автоматически)
      public_id: `user_${userId}_avatar`, // Уникальное имя файла для перезаписи
      overwrite: true, // Перезаписывать файл с таким же public_id
      resource_type: "image", // Указываем, что это изображение
      // можно добавить форматирование: transformation: [{ width: 150, height: 150, crop: "fill" }]
    },
    async (error, result) => {
      // Callback после загрузки
      if (error) {
        console.error("Cloudinary upload error:", error);
        // Отправляем ошибку обратно, чтобы фронтенд мог ее показать
        return res
          .status(500)
          .json({ message: "Помилка завантаження зображення в хмару." });
      }

      if (!result) {
        return res
          .status(500)
          .json({ message: "Cloudinary не повернув результат." });
      }

      const avatarUrl = result.secure_url; // Безопасный HTTPS URL изображения
      const publicId = result.public_id; // Public ID (если нужен)

      console.log(
        `Cloudinary upload successful for user ${userId}. URL: ${avatarUrl}`,
      );

      // 4. Сохранение URL в базу данных
      let connection;
      try {
        connection = await pool.getConnection();
        await connection.query("UPDATE users SET avatar_url = ? WHERE id = ?", [
          avatarUrl,
          userId,
        ]);
        console.log(`Database updated for user ${userId} with new avatar URL.`);

        // 5. Успешный ответ фронтенду
        res.json({
          message: "Аватар успішно оновлено!",
          avatarUrl: avatarUrl, // Возвращаем новый URL
        });
      } catch (dbError) {
        console.error(
          "Database update error after Cloudinary upload:",
          dbError,
        );
        // Попытка удалить уже загруженный файл из Cloudinary, если БД не обновилась? (Сложно)
        // cloudinary.uploader.destroy(publicId, (err, res) => { ... });
        res
          .status(500)
          .json({ message: "Помилка збереження URL аватара в базі даних." });
      } finally {
        if (connection) connection.release();
      }
    },
  );

  // Отправляем буфер файла (из req.file.buffer) в поток Cloudinary
  uploadStream.end(req.file.buffer);
};
export { getUserProfile, updateUserAvatar };
