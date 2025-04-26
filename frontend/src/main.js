import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import axios from "axios"; // <--- Импортируем axios
import "./index.css";

// ---> НАСТРОЙКА AXIOS INTERCEPTOR <---
// Получаем токен из localStorage при старте
const token = localStorage.getItem("authToken");
if (token) {
  // Устанавливаем токен как заголовок по умолчанию для всех запросов axios
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  console.log("Axios default header set with token.");
}
// (Опционально, но полезно) Добавляем интерцептор ответов для обработки 401 ошибки
axios.interceptors.response.use(
  (response) => response, // Просто возвращаем успешный ответ
  (error) => {
    console.log("[Axios Interceptor] Перехвачена ошибка ответа сервера!");
    console.log("[Axios Interceptor] Статус ошибки:", error.response?.status);
    console.log("[Axios Interceptor] URL запроса:", error.config?.url);
    if (error.response && error.response.status === 401) {
      // Если сервер вернул 401 (Unauthorized) - токен невалиден или отсутствует
      console.log("Axios interceptor: Received 401. Logging out.");
      // Очищаем хранилище
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      // Удаляем заголовок по умолчанию
      delete axios.defaults.headers.common["Authorization"];
      // Перенаправляем на главную (или страницу входа)
      // Важно: не используй router.push здесь напрямую, т.к. main.js вне контекста компонентов
      // Лучше использовать window.location или глобальное событие, которое обработает App.vue
      window.location.href = "/"; // Простейший способ перенаправить
    }
    // Возвращаем ошибку дальше, чтобы ее можно было обработать в catch компонента
    return Promise.reject(error);
  },
);
const app = createApp(App);
app.use(router);
app.mount("#app"); // Или #root
