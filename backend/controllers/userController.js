import { pool } from "../config/db.js";

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
        "SELECT id, username, email, created_at FROM users WHERE id = ?",
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

export { getUserProfile };
