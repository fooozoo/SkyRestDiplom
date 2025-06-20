import mysql from "mysql2/promise";
import config from "./index.js";

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: config.db.port, // Порт з кофіга
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
async function checkConnection() {
  let connection;
  try {
    connection = await pool.getConnection(); // Використовую пулл для отримання підключення
    console.log("Successfully connected to the database.");
  } catch (error) {
    console.error("Error connecting to the database:", error);
    // Помилка підключення до ДБ та відключення
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
export { pool, checkConnection };
