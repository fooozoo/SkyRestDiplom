import { pool } from "../config/db.js";
// Функція створення нового замовлення
const createOrder = async (req, res) => {
  // Отримуємо ID користувача з токена
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: "Користувач не авторизований." });
  }
  // Отримуємо дані замовлення з тіла запиту
  const { items, totalPrice, deliveryAddress, customerComment } = req.body;
  //Базова валідація
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
    // 1. Вставляємо запис в таблицю `orders`
    const orderQuery = `INSERT INTO orders (user_id, total_price, delivery_address, customer_comment, status) VALUES (?, ?, ?, ?, ?)`;
    // Перетворюємо об'єкт адреси в рядок
    const addressString = `${deliveryAddress.street}, буд. ${deliveryAddress.house}${deliveryAddress.apartment ? ", кв. " + deliveryAddress.apartment : ""}${deliveryAddress.entrance ? ", під. " + deliveryAddress.entrance : ""}${deliveryAddress.floor ? ", пов. " + deliveryAddress.floor : ""}`;
    const orderValues = [
      userId,
      totalPrice,
      addressString,
      customerComment || null,
      "Нове",
    ];

    const [orderResult] = await connection.query(orderQuery, orderValues);
    const newOrderId = orderResult.insertId; // Отримуємо ID створеного замовлення

    console.log(`Order created with ID: ${newOrderId}`);
    // 2.Дані для вставки в `order_items`
    const orderItemsQuery = `INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_order) VALUES ?`;
    // Перевіряємо ціни товарів з БД на момент замовлення
    const itemIds = items.map((item) => item.id);
    if (itemIds.length === 0)
      throw new Error("No item IDs provided for order items."); // Додаткова перевірка

    const placeholders = itemIds.map(() => "?").join(",");
    const [menuItemsFromDB] = await connection.query(
      `SELECT id, price FROM menu_items WHERE id IN (${placeholders})`, // Отримуємо актуальні ціни
      itemIds,
    );
    // Створюємо масив значень для масової вставки
    const orderItemsValues = items.map((item) => {
      const dbItem = menuItemsFromDB.find((dbItem) => dbItem.id === item.id);
      if (!dbItem) {
        throw new Error(`Товар з ID ${item.id} не знайдено в меню.`);
      }
      const priceAtOrder = dbItem.price; // Беремо актуальну ціну з БД
      return [newOrderId, item.id, item.quantity, priceAtOrder];
    });
    // Перевіряємо, чи співпадає розрахована сума з тією, що прийшла з фронту
    const calculatedTotal = orderItemsValues.reduce(
      (sum, itemValues) => sum + itemValues[2] * itemValues[3],
      0,
    );
    if (Math.abs(calculatedTotal - totalPrice) > 0.01) {
      // Порівнюємо з невеликою похибкою
      throw new Error(
        `Загальна сума (<span class="math-inline">\{totalPrice\}\) не співпадає з розрахованою \(</span>{calculatedTotal}).`,
      );
    }
    // 3. Вставляємо позиції замовлення в `order_items`
    if (orderItemsValues.length > 0) {
      await connection.query(orderItemsQuery, [orderItemsValues]); // Передаємо масив масивів
      console.log(
        `${orderItemsValues.length} items inserted for order ${newOrderId}`,
      );
    } else {
      throw new Error("Не вдалося сформувати позиції замовлення.");
    }
    // 4. Якщо все добре - підтверджуємо транзакцію
    await connection.commit();
    console.log(`Transaction committed for order ${newOrderId}`);
    // 5. Відправляємо успішну відповідь
    res.status(201).json({
      message: "Замовлення успішно створено!",
      orderId: newOrderId,
    });
  } catch (
    error // Помилка
  ) {
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
    // 1. Отримуємо основні дані замовлень
    const [orders] = await connection.query(
      `SELECT id, total_price, delivery_address, status, order_time
            FROM orders
            WHERE user_id = ?
            ORDER BY order_time DESC`,
      [userId],
    );
    // Якщо замовлень немає, повертаємо порожній масив
    if (orders.length === 0) {
      console.log(`No orders found for user ${userId}`);
      return res.json([]);
    }
    // 2. Отримуємо ID всіх знайдених замовлень
    const orderIds = orders.map((order) => order.id);
    // 3. Отримуємо всі позиції (order_items) для цих замовлень,
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
    const [orderItems] = await connection.query(itemsQuery, [orderIds]); // Передаємо масив ID

    // 4. Розподіляємо позиції по відповідних замовленнях
    const ordersWithItems = orders.map((order) => {
      // Знаходимо всі позиції, що належать поточному order.id
      const itemsForThisOrder = orderItems.filter(
        (item) => item.order_id === order.id,
      );
      // Повертаємо об'єкт замовлення з доданим масивом items
      return {
        ...order, // Копіюємо всі поля замовлення (id, total_price, ...)
        items: itemsForThisOrder, // Додаємо масив позицій
      };
    });

    console.log(
      `Found ${orders.length} orders with ${orderItems.length} total items for user ${userId}`,
    );
    res.json(ordersWithItems); // Повертаємо замовлення разом з позиціями
  } catch (error) {
    console.error(`Error fetching orders for user ${userId}:`, error);
    res
      .status(500)
      .json({ message: "Помилка сервера при отриманні історії замовлень." });
  } finally {
    if (connection) connection.release();
  }
};
export { createOrder, getMyOrders };
