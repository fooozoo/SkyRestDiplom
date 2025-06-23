import { pool } from "../config/db.js";

const getUnreadCount = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [ordersResult] = await connection.query(
      "SELECT COUNT(*) as count FROM orders WHERE is_viewed_by_admin = 0",
    );
    const unreadOrders = ordersResult[0].count;

    const [reservationsResult] = await connection.query(
      "SELECT COUNT(*) as count FROM reservations WHERE is_viewed_by_admin = 0",
    );
    const unreadReservations = reservationsResult[0].count;

    res.json({ unreadCount: unreadOrders + unreadReservations });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    res
      .status(500)
      .json({ message: "Ошибка сервера при получении уведомлений." });
  } finally {
    if (connection) connection.release();
  }
};

const getUnreadNotifications = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();

    const [orders] = await connection.query(
      `SELECT
                 o.id, o.user_id, o.total_price, o.order_time, o.delivery_address, o.customer_comment, u.username,
                 (SELECT GROUP_CONCAT(mi.name SEPARATOR ', ')
                  FROM order_items oi
                           JOIN menu_items mi ON oi.menu_item_id = mi.id
                  WHERE oi.order_id = o.id) AS items_preview
             FROM orders o
                      JOIN users u ON o.user_id = u.id
             WHERE o.is_viewed_by_admin = 0
             ORDER BY o.order_time DESC`,
    );

    const [reservations] = await connection.query(
      `SELECT
                 r.id, r.user_id, r.party_size, r.reservation_datetime, u.username, t.name as table_name
             FROM reservations r
                      JOIN users u ON r.user_id = u.id
                      JOIN tables t ON r.table_id = t.id
             WHERE r.is_viewed_by_admin = 0
             ORDER BY r.reservation_datetime DESC`,
    );

    const formattedOrders = orders.map((o) => ({ ...o, type: "order" }));
    const formattedReservations = reservations.map((r) => ({
      ...r,
      type: "reservation",
    }));

    const allNotifications = [...formattedOrders, ...formattedReservations];

    allNotifications.sort((a, b) => {
      const dateA = new Date(a.order_time || a.reservation_datetime);
      const dateB = new Date(b.order_time || b.reservation_datetime);
      return dateB - dateA;
    });

    res.json(allNotifications);
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    res
      .status(500)
      .json({ message: "Помилка сервера при отриманні списку сповіщень." });
  } finally {
    if (connection) connection.release();
  }
};

const markAllAsRead = async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query(
      "UPDATE orders SET is_viewed_by_admin = 1 WHERE is_viewed_by_admin = 0",
    );

    await connection.query(
      "UPDATE reservations SET is_viewed_by_admin = 1 WHERE is_viewed_by_admin = 0",
    );

    await connection.commit();

    res
      .status(200)
      .json({ message: "Все уведомления отмечены как просмотренные." });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error marking notifications as read:", error);
    res
      .status(500)
      .json({ message: "Ошибка сервера при обновлении уведомлений." });
  } finally {
    if (connection) connection.release();
  }
};
export { markAllAsRead, getUnreadCount, getUnreadNotifications };
