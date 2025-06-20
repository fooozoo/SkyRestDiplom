import { pool } from "../config/db.js";

const RESERVATION_DURATION_MINUTES = 120;
// Функція для отримання опису всіх активних столиків
const getAllTables = async (req, res) => {
  console.log("Fetching all active tables description...");
  let connection;
  try {
    connection = await pool.getConnection();
    const [tables] = await connection.query(
      "SELECT id, name, capacity, table_type FROM tables WHERE is_active = TRUE ORDER BY id",
    );
    res.json(tables);
  } catch (error) {
    console.error("Error fetching all tables:", error);
    res
      .status(500)
      .json({ message: "Помилка сервера при отриманні списку столиків." });
  } finally {
    if (connection) connection.release();
  }
};

// Функція для перевірки доступності столиків на дату/час
const getTableAvailability = async (req, res) => {
  // Отримуємо дату та час з параметрів запиту (?date=YYYY-MM-DD&time=HH:MM)
  const { date, time } = req.query;
  console.log(`Checking table availability for date: ${date}, time: ${time}`);
  if (
    !date ||
    !time ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !/^\d{2}:\d{2}$/.test(time)
  ) {
    return res.status(400).json({
      message: "Будь ласка, вкажіть коректну дату (YYYY-MM-DD) та час (HH:MM).",
    });
  }
  // Формуємо повну дату-час початку бажаної резервації
  const requestedStartDateTime = `${date} ${time}:00`;
  let connection;
  try {
    connection = await pool.getConnection();
    // 1. Отримуємо всі активні столики
    const [allTables] = await connection.query(
      "SELECT id, name, capacity, table_type FROM tables WHERE is_active = TRUE ORDER BY id",
    );
    if (allTables.length === 0) {
      return res.json([]); // Якщо столиків немає
    }
    const availabilityQuery = `
            SELECT DISTINCT table_id
            FROM reservations
            WHERE
                status != 'Скасовано' AND status != 'Завершено'
                AND
                ? < DATE_ADD(reservation_datetime, INTERVAL ? MINUTE)
                AND
                DATE_ADD(?, INTERVAL ? MINUTE) > reservation_datetime
        `;
    const params = [
      requestedStartDateTime,
      RESERVATION_DURATION_MINUTES,
      requestedStartDateTime,
      RESERVATION_DURATION_MINUTES,
    ];

    const [bookedReservations] = await connection.query(
      availabilityQuery,
      params,
    );

    const bookedTableIds = new Set(
      bookedReservations.map((res) => res.table_id),
    );
    console.log("Booked table IDs for the slot:", Array.from(bookedTableIds));

    // 3. Формуємо відповідь: масив усіх столиків з полем is_available
    const availabilityResult = allTables.map((table) => ({
      ...table, // Копіюємо дані столика (id, name, capacity)
      is_available: !bookedTableIds.has(table.id),
    }));

    res.json(availabilityResult);
  } catch (error) {
    console.error(
      `Error checking table availability for ${requestedStartDateTime}:`,
      error,
    );
    res
      .status(500)
      .json({ message: "Помилка сервера при перевірці доступності столиків." });
  } finally {
    if (connection) connection.release();
  }
};

export { getAllTables, getTableAvailability };
