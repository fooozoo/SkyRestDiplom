import { pool } from "../config/db.js";
const createOrder = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Користувач не авторизований." });
  }
  const { items, totalPrice, deliveryAddress, customerComment } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Кошик не може бути порожнім." });
  }
  if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.house) {
    return res.status(400).json({
      message: "Будь ласка, вкажіть повну адресу доставки (вулиця та будинок).",
    });
  }
  if (isNaN(parseFloat(totalPrice)) || totalPrice <= 0) {
    return res.status(400).json({ message: "Некоректна загальна сума." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const orderQuery = `INSERT INTO orders (user_id, total_price, delivery_address, customer_comment, status) VALUES (?, ?, ?, ?, ?)`;
    const addressString = `${deliveryAddress.street}, буд. ${deliveryAddress.house}${deliveryAddress.apartment ? ", кв. " + deliveryAddress.apartment : ""}${deliveryAddress.entrance ? ", під. " + deliveryAddress.entrance : ""}${deliveryAddress.floor ? ", пов. " + deliveryAddress.floor : ""}`;
    const orderValues = [
      userId,
      totalPrice,
      addressString,
      customerComment || null,
      "Нове",
    ];

    const [orderResult] = await connection.query(orderQuery, orderValues);
    const newOrderId = orderResult.insertId;

    console.log(`Order created with ID: ${newOrderId}`);
    const orderItemsQuery = `INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order) VALUES ?`;
    const itemIds = items.map((item) => item.id);
    if (itemIds.length === 0)
      throw new Error("No item IDs provided for order items.");

    const placeholders = itemIds.map(() => "?").join(",");
    const [menuItemsFromDB] = await connection.query(
      `SELECT id, price FROM menu_items WHERE id IN (${placeholders})`,
      itemIds,
    );
    const orderItemsValues = items.map((item) => {
      const dbItem = menuItemsFromDB.find((dbItem) => dbItem.id === item.id);
      if (!dbItem) {
        throw new Error(`Товар з ID ${item.id} не знайдено в меню.`);
      }
      const priceAtOrder = dbItem.price;
      return [newOrderId, item.id, item.quantity, priceAtOrder];
    });
    const calculatedTotal = orderItemsValues.reduce(
      (sum, itemValues) => sum + itemValues[2] * itemValues[3],
      0,
    );
    if (Math.abs(calculatedTotal - totalPrice) > 0.01) {
      throw new Error(
        `Загальна сума (<span class="math-inline">\{totalPrice\}\) не співпадає з розрахованою \(</span>{calculatedTotal}).`,
      );
    }
    if (orderItemsValues.length > 0) {
      await connection.query(orderItemsQuery, [orderItemsValues]);
      console.log(
        `${orderItemsValues.length} items inserted for order ${newOrderId}`,
      );
    } else {
      throw new Error("Не вдалося сформувати позиції замовлення.");
    }
    await connection.commit();
    console.log(`Transaction committed for order ${newOrderId}`);
    res.status(201).json({
      message: "Замовлення успішно створено!",
      orderId: newOrderId,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Error creating order:", error);
    res.status(500).json({
      message: error.message || "Помилка сервера при створенні замовлення.",
    });
  } finally {
    if (connection) connection.release();
  }
};
const getMyOrders = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Користувач не авторизований." });
  }

  console.log(`Workspaceing orders for user ID: ${userId}`);
  let connection;
  try {
    connection = await pool.getConnection();
    const [orders] = await connection.query(
      `SELECT id, total_price, delivery_address, status, order_time
            FROM orders
            WHERE user_id = ?
            ORDER BY order_time DESC`,
      [userId],
    );
    if (orders.length === 0) {
      console.log(`No orders found for user ${userId}`);
      return res.json([]);
    }
    const orderIds = orders.map((order) => order.id);
    const itemsQuery = `
            SELECT
                oi.order_id,
                oi.menu_item_id,
                oi.quantity,
                oi.price_at_order,
                mi.name AS menu_item_name,  
                mi.image_url AS menu_item_image_url
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE oi.order_id IN (?)
        `;
    const [orderItems] = await connection.query(itemsQuery, [orderIds]);

    const ordersWithItems = orders.map((order) => {
      const itemsForThisOrder = orderItems.filter(
        (item) => item.order_id === order.id,
      );
      return {
        ...order,
        items: itemsForThisOrder,
      };
    });

    console.log(
      `Found ${orders.length} orders with ${orderItems.length} total items for user ${userId}`,
    );
    res.json(ordersWithItems);
  } catch (error) {
    console.error(`Error fetching orders for user ${userId}:`, error);
    res
      .status(500)
      .json({ message: "Помилка сервера при отриманні історії замовлень." });
  } finally {
    if (connection) connection.release();
  }
};
const confirmOrder = async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.query(
      "UPDATE orders SET status = 'Підтверджено', is_viewed_by_admin = 1 WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Замовлення не знайдено." });
    }

    res.status(200).json({ message: `Замовлення №${id} підтверджено.` });
  } catch (error) {
    console.error(`Error confirming order ${id}:`, error);
    res
      .status(500)
      .json({ message: "Помилка сервера при підтвердженні замовлення." });
  } finally {
    if (connection) connection.release();
  }
};
const cancelOrder = async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.query(
      "UPDATE orders SET status = 'Скасовано', is_viewed_by_admin = 1 WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Замовлення не знайдено." });
    }

    res.status(200).json({ message: `Замовлення №${id} скасовано.` });
  } catch (error) {
    console.error(`Error canceling order ${id}:`, error);
    res
      .status(500)
      .json({ message: "Помилка сервера при скасуванні замовлення." });
  } finally {
    if (connection) connection.release();
  }
};
export { createOrder, getMyOrders, confirmOrder, cancelOrder };
