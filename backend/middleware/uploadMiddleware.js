import multer from "multer";

// Настраиваем хранилище в памяти (удобно для передачи буфера в Cloudinary)
const storage = multer.memoryStorage();

// Фильтр для приема только изображений
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // Принять файл
  } else {
    // Отклонить файл с ошибкой
    cb(new Error("Невірний тип файлу, дозволено тільки зображення!"), false);
  }
};

// Создаем middleware multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Лимит 5 MB
  fileFilter: fileFilter,
});

// Экспортируем middleware для использования в маршрутах
// Например, upload.single('avatar') для одного файла с именем поля 'avatar'
export default upload;
