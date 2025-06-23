import { pool } from "../config/db.js";
import { validationResult } from "express-validator";
const RESERVATION_DURATION_MINUTES = 120;

const createReservation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Користувач не авторизований." });
  }
  const { table_id, reservation_date, reservation_time, party_size } = req.body;
  const reservationDateTime = `${reservation_date} ${reservation_time}:00`;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
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
      await connection.rollback();
      console.warn(
        `Booking conflict detected for table ${table_id} at ${reservationDateTime}`,
      );
      return res.status(409).json({
        message:
          "На жаль, цей столик вже зарезервовано на обраний час. Спробуйте інший час або столик.",
      });
    }

    const insertQuery = `INSERT INTO reservations (user_id, table_id, reservation_datetime, party_size, status) VALUES (?, ?, ?, ?, ?)`;
    const insertValues = [
      userId,
      table_id,
      reservationDateTime,
      party_size,
      "Очікує",
    ];

    const [result] = await connection.query(insertQuery, insertValues);
    const newReservationId = result.insertId;

    await connection.commit();
    console.log(
      `Reservation created successfully. ID: ${newReservationId} for user ${userId}`,
    );

    res.status(201).json({
      message: "Столик успішно зарезервовано!",
      reservationId: newReservationId,
    });
  } catch (error) {
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
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Користувач не авторизований." });
  }
  console.log(`Workspaceing reservations for user ID: ${userId}`);
  let connection;
  try {
    connection = await pool.getConnection();
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
const confirmReservation = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "UPDATE reservations SET status = 'Підтверджено', is_viewed_by_admin = 1 WHERE id = ? AND status = 'Очікує'",
      [id],
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Резервацію не знайдено або вона вже оброблена." });
    }
    res.status(200).json({ message: `Резервацію №${id} підтверджено.` });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Помилка сервера при підтвердженні резервації." });
  }
};

const cancelReservation = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "UPDATE reservations SET status = 'Скасовано', is_viewed_by_admin = 1 WHERE id = ? AND status = 'Очікує'",
      [id],
    );
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Резервацію не знайдено або вона вже оброблена." });
    }
    res.status(200).json({ message: `Резервацію №${id} скасовано.` });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Помилка сервера при скасуванні резервації." });
  }
};

export {
  createReservation,
  getMyReservations,
  confirmReservation,
  cancelReservation,
};
