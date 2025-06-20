const isAdmin = (req, res, next) => {
  // Перевіряємо, чи існує req.user та роль "admin"
  if (req.user && req.user.role === "admin") {
    // Користувач - адмін
    next();
  } else {
    // Якщо користувач не адмін або req.user відсутній
    res
      .status(403)
      .json({ message: "Доступ заборонено. Потрібні права адміністратора." });
  }
};
export { isAdmin };
