import { body, validationResult } from "express-validator";
// Правила валідації для реєстрації
export const registerValidationRules = () => {
  return [
    // Ім'я користувача: не пусте, мінімум 3 символи
    body("username", "Username is required")
      .notEmpty()
      .trim()
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters long"),
    // Email: має бути валідним email
    body("email", "Please include a valid email").isEmail().normalizeEmail(),
    // Пароль: мінімум 6 символів
    body("password", "Password must be at least 6 characters long").isLength({
      min: 3,
    }),
  ];
};
export const loginValidationRules = () => {
  return [
    // Перевіряємо username замість email
    body("username", "Username is required").notEmpty().trim(), // Додаємо trim(), щоб прибрати зайві пробіли
    // Пароль не може бути порожнім (без змін)
    body("password", "Password is required").notEmpty(),
  ];
};
// Middleware для перевірки результатів валідації
// (Можна викликати в контролері або прямо в маршруті після правил)
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next(); // Якщо помилок немає, йдемо далі
  }
  // Якщо є помилки, повертаємо їх клієнту
  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));

  return res.status(422).json({
    errors: extractedErrors,
  });
};
