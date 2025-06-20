import { pool } from "../config/db.js";
import cloudinary from "../config/cloudinary.js"; // Імпортуємо cloudinary
import { validationResult } from "express-validator"; // Для валідації
const getMenuItems = async (req, res) => {
  console.log("Attempting to fetch menu items...");
  let connection;
  try {
    connection = await pool.getConnection();
    console.log("Database connection obtained for menu items.");
    // Отримуємо всі активні пункти меню та сортеруємо
    const [rows] = await connection.query(
      `SELECT id, name, description, price, category, image_url
       FROM menu_items
       WHERE is_available = TRUE
       ORDER BY category, name`,
    );

    console.log(`Workspaceed ${rows.length} menu items.`);
    res.json(rows); // Відправляємо результат у форматі JSON
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({ message: "Помилка сервера при отриманні меню." });
  } finally {
    if (connection) {
      console.log("Releasing database connection for menu items.");
      connection.release();
    }
  }
};
// Експортуємо функцію, щоб її можна було використовувати в маршрутах
const createMenuItem = async (req, res) => {
  // 1. Перевірка помилок валідації для текстових полів
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // 2. Отримуємо дані з тіла запиту (текстові поля)
  const { name, description, price, category } = req.body;
  const userId = req.user?.id; // ID адміна, який створює
  if (!req.file) {
    console.warn(`Creating menu item "${name}" without image.`);
  }
  console.log(`Admin ${userId} attempting to create menu item: ${name}`);
  let imageUrl = null;
  // Функція для завантаження в хмару
  const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "skyrest_menu_items", // Окрема папка для страв в ХС
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          if (!result) {
            return reject(new Error("Cloudinary upload failed silently."));
          }
          resolve(result.secure_url); // Повертаємо URL
        },
      );
      uploadStream.end(fileBuffer);
    });
  };
  // 3.Файл є, завантажуємо його в Cloudinary
  if (req.file) {
    try {
      console.log(`Uploading image ${req.file.originalname} to Cloudinary...`);
      imageUrl = await uploadToCloudinary(req.file.buffer);
      console.log(`Image uploaded successfully. URL: ${imageUrl}`);
    } catch (uploadError) {
      console.error(
        "Cloudinary upload error during item creation:",
        uploadError,
      );
      return res
        .status(500)
        .json({ message: "Помилка завантаження зображення в хмару." });
    }
  }
  // 4. Збереження даних блюда в БД
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.query(
      "INSERT INTO menu_items (name, description, price, category, image_url) VALUES (?, ?, ?, ?, ?)",
      [name, description || null, price, category, imageUrl], // Передаємо imageUrl
    );
    const newItemId = result.insertId;
    console.log(`Menu item created with ID: ${newItemId}`);
    // Повертаємо створений об'єкт
    const [newItemRows] = await connection.query(
      "SELECT * FROM menu_items WHERE id = ?",
      [newItemId],
    );
    res
      .status(201)
      .json({ message: "Блюдо успішно додано!", item: newItemRows[0] });
  } catch (dbError) {
    console.error("Database insert error for menu item:", dbError);
    // TODO: Якщо картинка завантажилась, а запис в БД не вдався, треба видалити картинку з Cloudinary?
    res.status(500).json({ message: "Помилка збереження блюда в базі даних." });
  } finally {
    if (connection) connection.release();
  }
};
const deleteMenuItem = async (req, res) => {
  const itemId = req.params.id; // Отримуємо ID з параметрів маршруту
  const adminId = req.user?.id; // ID адміна, який видаляє
  console.log(`Admin ${adminId} attempting to delete menu item ID: ${itemId}`);
  if (isNaN(itemId)) {
    return res.status(400).json({ message: "Некоректний ID блюда." });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    // 1. Видалити запис з бази даних
    const [result] = await connection.query(
      "DELETE FROM menu_items WHERE id = ?",
      [itemId],
    );

    // 2. Перевіряємо, чи було щось видалено
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Блюдо з таким ID не знайдено." });
    }
    // 3. Підтверджуємо транзакцію
    await connection.commit();
    console.log(
      `Menu item ID: ${itemId} deleted successfully by admin ${adminId}.`,
    );
    res.json({ message: "Блюдо успішно видалено." });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error(`Error deleting menu item ${itemId}:`, error);
    res.status(500).json({ message: "Помилка сервера при видаленні блюда." });
  } finally {
    if (connection) connection.release();
  }
};
const updateMenuItem = async (req, res) => {
  // 1. Валідація текстових полів
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // 2. Отримуємо ID та дані
  const itemId = req.params.id;
  const { name, description, price, category } = req.body;
  if (isNaN(itemId)) {
    return res.status(400).json({ message: "Некоректний ID блюда." });
  }
  const adminId = req.user?.id;
  console.log(`Admin ${adminId} attempting to update menu item ID: ${itemId}`);
  let imageUrl = undefined; // Використовуємо undefined

  const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
      const publicId = `skyrest_menu_items/menu_item_${itemId}_${Date.now()}`;
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          overwrite: true,
          resource_type: "image",
          folder: "skyrest_menu_items",
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          if (!result) {
            return reject(new Error("Cloudinary upload failed silently."));
          }
          resolve(result.secure_url);
        },
      );
      uploadStream.end(fileBuffer);
    });
  };
  // 3. Завантаження картинки в меню якщо її завантажили
  if (req.file) {
    try {
      console.log(`Updating image for item ${itemId}...`);
      imageUrl = await uploadToCloudinary(req.file.buffer);
      console.log(`New image uploaded. URL: ${imageUrl}`);
    } catch (uploadError) {
      console.error("Cloudinary upload error during item update:", uploadError);
      return res
        .status(500)
        .json({ message: "Помилка завантаження нового зображення в хмару." });
    }
  }
  // 4. Оновлюємо дані в БД
  let connection;
  try {
    connection = await pool.getConnection();
    // Оновлюємо тільки ті поля, що передані + image_url
    let sqlSetParts = [];
    let queryParams = [];
    if (name !== undefined) {
      sqlSetParts.push("name = ?");
      queryParams.push(name);
    }
    if (description !== undefined) {
      sqlSetParts.push("description = ?");
      queryParams.push(description || null);
    }
    if (price !== undefined) {
      sqlSetParts.push("price = ?");
      queryParams.push(price);
    }
    if (category !== undefined) {
      sqlSetParts.push("category = ?");
      queryParams.push(category);
    }
    if (imageUrl !== undefined) {
      sqlSetParts.push("image_url = ?");
      queryParams.push(imageUrl);
    } // Оновлюємо URL, якщо є нова картинка

    if (sqlSetParts.length === 0) {
      return res.status(400).json({ message: "Немає даних для оновлення." });
    }

    const updateQuery = `UPDATE menu_items SET ${sqlSetParts.join(", ")} WHERE id = ?`;
    queryParams.push(itemId);

    const [result] = await connection.query(updateQuery, queryParams);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Блюдо з таким ID не знайдено для оновлення." });
    }
    console.log(
      `Menu item ID: ${itemId} updated successfully by admin ${adminId}.`,
    );
    // Повертаємо оновлену страву
    const [updatedItemRows] = await connection.query(
      "SELECT * FROM menu_items WHERE id = ?",
      [itemId],
    );
    res.json({ message: "Блюдо успішно оновлено!", item: updatedItemRows[0] });
  } catch (dbError) {
    console.error(`Database update error for menu item ${itemId}:`, dbError);
    res.status(500).json({ message: "Помилка оновлення блюда в базі даних." });
  } finally {
    if (connection) connection.release();
  }
};
export { getMenuItems, createMenuItem, deleteMenuItem, updateMenuItem };
