import bcrypt from "bcrypt";
import { pool } from "../config/db.js"; // Імпортуємо наш пул з'єднань\
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import * as constants from "node:constants";

// Функція реєстрації користувача
export const registerUser = async (req, res) => {
  // 1. Перевірка помилок валідації
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() }); // Повертаємо помилки валідації
  }
  // 2. Отримуємо дані з тіла запиту
  const { username, email, password } = req.body;
  try {
    // 3. Перевірка, чи існує користувач з таким email або username
    let connection;
    try {
      connection = await pool.getConnection();
      const [existingUsers] = await connection.query(
        "SELECT email, username FROM users WHERE email = ? OR username = ?",
        [email, username],
      );
      if (existingUsers.length > 0) {
        // Перевіряємо, що саме зайнято
        const isEmailTaken = existingUsers.some((user) => user.email === email);
        const isUsernameTaken = existingUsers.some(
          (user) => user.username === username,
        );
        let errorMessage = "";
        if (isEmailTaken) errorMessage += "Email вже використовується. ";
        if (isUsernameTaken)
          errorMessage += "Ім'я користувача вже використовується.";

        return res.status(400).json({ message: errorMessage.trim() });
      }
      // 4. Хешування пароля
      const saltRounds = 10; // Кількість раундів солі
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 5. Збереження нового користувача в БД
      const [result] = await connection.query(
        "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
        [username, email, passwordHash],
      );
      const newUserId = result.insertId;
      console.log("User registered successfully:", result.insertId);
      // 6. Відповідь про успішну реєстрацію
      res.status(201).json({
        message: "Користувача успішно зареєстровано!",
        user: {
          id: newUserId,
          username: username,
          email: email,
        },
      });
    } finally {
      if (connection) connection.release(); // Повертаємо з'єднання в пул
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Помилка сервера при реєстрації." });
  }
};
export const loginUser = async (req, res) => {
  // 1. Перевірка помилок валідації
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // 2. Отримуємо дані з тіла запиту
  const { username, password } = req.body;
  try {
    let connection;
    try {
      connection = await pool.getConnection();
      // 3. Пошук користувача за email
      const [users] = await connection.query(
        "SELECT id, username, email, password_hash, created_at, role FROM users WHERE username = ?",
        [username],
      );
      // 4. Перевірка, чи знайдено користувача
      if (users.length === 0) {
        return res
          .status(400)
          .json({ message: "Невірне ім'я користувача або пароль" }); // Загальна помилка
      }
      const user = users[0];
      // 5. Перевірка пароля
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Невірне ім'я користувача або пароль" }); // Загальна помилка
      }
      // 6. Пароль вірний - Створення JWT токену
      const payload = {
        user: {
          id: user.id,
          username: user.username, // Можна додати інші дані, які не є секретними
          role: user.role,
        },
      };
      // Перевіряємо, чи є секретний ключ в .env
      if (!process.env.JWT_SECRET) {
        console.error("FATAL ERROR: JWT_SECRET is not defined.");
        return res.status(500).send("Помилка сервера (конфігурація)");
      }
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "1d" }, // Токен дійсний 1 день
        (err, token) => {
          if (err) throw err;
          // 7. Відправляємо токен та дані користувача
          res.json({
            message: "Вхід успішний!",
            token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              created_at: user.created_at,
              avatar: user.avatar,
              role: user.role,
            },
          });
        },
      );
    } finally {
      if (connection) connection.release();
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Помилка сервера при вході." });
  }
};
