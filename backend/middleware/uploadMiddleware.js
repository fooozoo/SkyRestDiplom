import multer from "multer";

const storage = multer.memoryStorage();

// Фільтер
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // Прийняти файл
  } else {
    // Відклонити файл
    cb(new Error("Невірний тип файлу, дозволено тільки зображення!"), false);
  }
};

// Створюю middleware multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Лимит 5 MB
  fileFilter: fileFilter,
});

export default upload;
