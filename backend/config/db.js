import mysql from "mysql2/promise";
import config from "./index.js";

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: config.db.port, // Используем порт из config
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
async function checkConnection() {
  let connection;
  try {
    connection = await pool.getConnection(); // Пытаемся получить соединение из пула
    console.log("Successfully connected to the database.");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    // Если не удалось подключиться, возможно, стоит завершить приложение
    process.exit(1);
  } finally {
    // Всегда освобождаем соединение после проверки
    if (connection) {
      connection.release();
    }
  }
}

// Экспортируем пул для использования в других частях приложения
export { pool, checkConnection };
