import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  let token;

  // Ищем токен в заголовке Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Извлекаем токен ('Bearer <token>')
      token = req.headers.authorization.split(" ")[1];

      // Проверяем токен с нашим секретом
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Добавляем информацию о пользователе из токена в объект запроса (req)
      // Убедись, что при создании токена в payload было поле 'user'
      // Мы НЕ делаем запрос к БД здесь, только проверяем токен
      req.user = decoded.user; // Содержит { id, username }

      next(); // Переходим к следующему middleware или обработчику маршрута
    } catch (error) {
      console.error("Token verification failed:", error.message);
      res.status(401).json({ message: "Не авторизований, токен недійсний" }); // 401 Unauthorized
    }
  }

  if (!token) {
    res.status(401).json({ message: "Не авторизований, немає токена" }); // 401 Unauthorized
  }
};

export { protect };
