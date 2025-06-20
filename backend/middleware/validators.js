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
    // Пароль не може бути порожнім
    body("password", "Password is required").notEmpty(),
  ];
};
export const menuItemValidationRules = () => {
  return [
    body("name", "Назва блюда є обов'язковою")
      .notEmpty()
      .trim()
      .isLength({ min: 3, max: 150 })
      .withMessage("Назва має бути від 3 до 150 символів"),
    body("description", "Опис може бути текстом")
      .optional({ checkFalsy: true })
      .trim(),
    body("price", "Ціна є обов'язковою і має бути числом")
      .notEmpty()
      .isDecimal({ decimal_digits: "1,2" })
      .withMessage("Вкажіть коректну ціну (напр., 125.50)"),
    body("category", "Категорія є обов'язковою")
      .notEmpty()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Вкажіть категорію (мін. 2 символи)"),
  ];
};
export const reservationValidationRules = () => {
  return [
    body("table_id", "Необхідно вказати ID столика").isInt({ gt: 0 }),
    body("reservation_date", "Необхідно вказати дату резервації").isDate({
      format: "YYYY-MM-DD",
    }),
    body("reservation_time", "Необхідно вказати час резервації")
      .matches(/^\d{2}:\d{2}$/, "g")
      .withMessage("Некоректний формат часу (HH:MM)"),
    body("party_size", "Кількість гостей має бути цілим числом більше 0").isInt(
      { gt: 0 },
    ),
  ];
};

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  // Якщо є помилки, повертаємо їх клієнту
  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));
  return res.status(422).json({
    errors: extractedErrors,
  });
};
