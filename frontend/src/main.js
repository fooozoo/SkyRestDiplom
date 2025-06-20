import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import axios from "axios";
import "./index.css";

const token = localStorage.getItem("authToken");
if (token) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  console.log("Axios default header set with token.");
}
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    р;
    console.log("[Axios Interceptor] Перехвачена ошибка ответа сервера!");
    console.log("[Axios Interceptor] Статус ошибки:", error.response?.status);
    console.log("[Axios Interceptor] URL запроса:", error.config?.url);
    if (error.response && error.response.status === 401) {
      console.log("Axios interceptor: Received 401. Logging out.");
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      delete axios.defaults.headers.common["Authorization"];
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);
const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
app.mount("#app");
