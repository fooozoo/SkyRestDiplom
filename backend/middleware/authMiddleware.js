import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  let token;
  // Шукаєм токен в Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Берем токене
      token = req.headers.authorization.split(" ")[1];

      //Звіряєм токен
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded.user;

      next();
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
