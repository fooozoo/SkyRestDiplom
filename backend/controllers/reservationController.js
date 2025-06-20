import { pool } from "../config/db.js";
import { validationResult } from "express-validator";
const RESERVATION_DURATION_MINUTES = 120;

const createReservation = async (req, res) => {
  // 1. Перевірка помилок валідації
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // 2. Отримуємо ID користувача з токену
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Користувач не авторизований." });
  }
  // 3. Отримуємо дані з тіла запиту
  const { table_id, reservation_date, reservation_time, party_size } = req.body;
  // Формуємо повну дату-час резервації
  const reservationDateTime = `${reservation_date} ${reservation_time}:00`;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction(); // Починаємо транзакцію
    // 4. Перевірка місткості столика
    const [tables] = await connection.query(
      "SELECT capacity FROM tables WHERE id = ? AND is_active = TRUE",
      [table_id],
    );
    if (tables.length === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ message: "Обраний столик не знайдено або неактивний." });
    }
    if (tables[0].capacity < party_size) {
      await connection.rollback();
      return res.status(400).json({
        message: `Обраний столик вміщує максимум ${tables[0].capacity} гостей.`,
      });
    }

    // 5. ПОВТОРНА ПЕРЕВІРКА ДОСТУПНОСТІ
    const availabilityQuery = `
            SELECT table_id
            FROM reservations
            WHERE
                table_id = ?
                AND status != 'Скасовано' AND status != 'Завершено'
                AND ? < DATE_ADD(reservation_datetime, INTERVAL ? MINUTE)
                AND DATE_ADD(?, INTERVAL ? MINUTE) > reservation_datetime
            LIMIT 1
        `;
    const params = [
      table_id,
      reservationDateTime,
      RESERVATION_DURATION_MINUTES,
      reservationDateTime,
      RESERVATION_DURATION_MINUTES,
    ];
    const [conflictingReservations] = await connection.query(
      availabilityQuery,
      params,
    );
    if (conflictingReservations.length > 0) {
      // Якщо знайдено конфліктуючу резервацію - відкочуємо транзакцію
      await connection.rollback();
      console.warn(
        `Booking conflict detected for table ${table_id} at ${reservationDateTime}`,
      );
      return res.status(409).json({
        message:
          "На жаль, цей столик вже зарезервовано на обраний час. Спробуйте інший час або столик.",
      });
    }

    // 6. Якщо столик вільний - створюємо резервацію
    const insertQuery = `INSERT INTO reservations (user_id, table_id, reservation_datetime, party_size, status) VALUES (?, ?, ?, ?, ?)`;
    const insertValues = [
      userId,
      table_id,
      reservationDateTime,
      party_size,
      "Підтверджено",
    ]; // Статус 'Підтверджено'

    const [result] = await connection.query(insertQuery, insertValues);
    const newReservationId = result.insertId;

    // 7. Підтверджуємо транзакцію
    await connection.commit();
    console.log(
      `Reservation created successfully. ID: ${newReservationId} for user ${userId}`,
    );

    // 8. Відправляємо успішну відповідь
    res.status(201).json({
      message: "Столик успішно зарезервовано!",
      reservationId: newReservationId,
    });
  } catch (error) {
    // Відкочуємо транзакцію у випадку будь-якої помилки
    if (connection) await connection.rollback();
    console.error(`Error creating reservation for user ${userId}:`, error);
    res.status(500).json({
      message: error.message || "Помилка сервера при створенні резервації.",
    });
  } finally {
    if (connection) connection.release();
  }
};
const getMyReservations = async (req, res) => {
  // ID користувача з токену
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Користувач не авторизований." });
  }
  console.log(`Workspaceing reservations for user ID: ${userId}`);
  let connection;
  try {
    connection = await pool.getConnection();
    // Отримуємо резервації для користувача, приєднуємо назву столика
    // Сортуємо від найновіших до найстаріших
    const [reservations] = await connection.query(
      `SELECT
               r.id, r.table_id, r.reservation_datetime,
               r.party_size, r.status, r.created_at,
               t.name as table_name
           FROM reservations r
                    JOIN tables t ON r.table_id = t.id
           WHERE r.user_id = ?
           ORDER BY r.reservation_datetime DESC`,
      [userId],
    );

    console.log(`Found ${reservations.length} reservations for user ${userId}`);
    res.json(reservations);
  } catch (error) {
    console.error(`Error fetching reservations for user ${userId}:`, error);
    res
      .status(500)
      .json({ message: "Помилка сервера при отриманні історії резервацій." });
  } finally {
    if (connection) connection.release();
  }
};
export { createReservation, getMyReservations };
