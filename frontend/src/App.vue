<template>
  <div id="app-wrapper">
    <Navbar
      :isLoggedIn="isLoggedIn"
      :currentUser="currentUser"
      @open-register="openRegisterModal"
      @open-login="openLoginModal"
      @logout="handleLogout"
    />
    <main>
      <router-view v-if="!isAuthLoading" />
      <div v-else class="container">Завантаження...</div>
    </main>
    <Footer />

    <RegisterModal
      :isOpen="isRegisterModalOpen"
      @close="closeRegisterModal"
      @registration-success="handleSuccessfulRegistration"
      @open-login="openLoginModalFromRegister"
    />
    <LoginModal
      :isOpen="isLoginModalOpen"
      @close="closeLoginModal"
      @login-success="handleSuccessfulLogin"
      @open-register="openRegisterModalFromLogin"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import Navbar from "./components/Navbar.vue";
import Footer from "./components/Footer.vue";
import RegisterModal from "./components/RegisterModal.vue";
import LoginModal from "./components/LoginModal.vue";

// Стан модального вікна
const isRegisterModalOpen = ref(false);
const isLoginModalOpen = ref(false);
const isLoggedIn = ref(false); // Чи користувач "залогінений"?
const currentUser = ref(null); // Зберігаємо дані поточного користувача
const isAuthLoading = ref(true); // Новый флаг для индикации загрузки состояния аутентификации

// Отримуємо екземпляр маршрутизатора
const router = useRouter(); // <--- Ініціалізація useRouter

const openRegisterModal = () => {
  closeLoginModal();
  isRegisterModalOpen.value = true;
};

const closeRegisterModal = () => {
  isRegisterModalOpen.value = false;
};

const openLoginModal = () => {
  closeRegisterModal(); // Закриваємо реєстрацію, якщо вона відкрита
  isLoginModalOpen.value = true;
};
const closeLoginModal = () => {
  isLoginModalOpen.value = false;
};

// Вона викликається, коли RegisterModal надсилає подію 'registration-success'
const handleSuccessfulRegistration = (userData) => {
  // Сразу логиним после регистрации (без токена, но с данными)
  handleSuccessfulLogin({ token: null, user: userData }, true);
};

// --- ОБНОВЛЕННАЯ ФУНКЦИЯ ЛОГИНА ---
const handleSuccessfulLogin = ({ token, user }, isRegistration = false) => {
  console.log("[Login] Start. Token:", token, "User:", user); // Лог: Начало, полученные данные
  currentUser.value = user;
  isLoggedIn.value = true;

  let savedToken = null;
  let savedUserStr = null;

  if (token) {
    console.log("[Login] Токен получен. Пытаюсь сохранить в localStorage...");
    try {
      localStorage.setItem("authToken", token);
      savedToken = localStorage.getItem("authToken"); // Читаем сразу после записи
      console.log(
        "[Login] Результат чтения токена сразу после сохранения:",
        savedToken ? `(длина ${savedToken.length})` : savedToken,
      ); // Лог: Проверка записи токена
    } catch (e) {
      console.error("[Login] ОШИБКА сохранения токена в localStorage:", e);
    }
  } else if (!isRegistration) {
    console.warn("[Login] Вызван без токена (и это не регистрация).");
  } else {
    console.log("[Login] Вызван без токена (поток регистрации).");
  }

  if (user) {
    console.log(
      "[Login] Данные пользователя получены. Пытаюсь сохранить в localStorage...",
    );
    try {
      const userString = JSON.stringify(user);
      localStorage.setItem("currentUser", userString);
      savedUserStr = localStorage.getItem("currentUser"); // Читаем сразу после записи
      console.log(
        "[Login] Результат чтения currentUser сразу после сохранения:",
        savedUserStr ? `(длина ${savedUserStr.length})` : savedUserStr,
      ); // Лог: Проверка записи пользователя
    } catch (e) {
      console.error("[Login] ОШИБКА сохранения currentUser в localStorage:", e);
    }
  }

  // Устанавливаем заголовок Axios, если токен был успешно сохранен
  if (savedToken) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
    console.log("[Login] Заголовок Axios установлен.");
  }

  closeLoginModal();
  closeRegisterModal();

  if (user && user.id) {
    console.log(
      `[Login] Подготовка к перенаправлению на Profile ID: ${user.id}`,
    );
    const redirectDelay = isRegistration ? 500 : 0;
    setTimeout(() => {
      console.log(`[Login] Выполняю перенаправление на /profile/${user.id}`);
      router.push({ name: "Profile", params: { id: user.id } });
    }, redirectDelay);
  } else {
    console.error("[Login] Невозможно перенаправить, нет user.id!");
    router.push({ name: "Home" });
  }
};

// --- ОБНОВЛЕННАЯ ФУНКЦИЯ ВЫХОДА ---
const handleLogout = () => {
  console.log("[Logout] handleLogout вызвана!"); // Лог: Вызов функции
  isLoggedIn.value = false;
  currentUser.value = null;
  try {
    localStorage.removeItem("authToken");
    console.log("[Logout] Токен удален из localStorage."); // Лог: Удаление токена
    localStorage.removeItem("currentUser");
    console.log("[Logout] currentUser удален из localStorage."); // Лог: Удаление пользователя
  } catch (e) {
    console.error("[Logout] ОШИБКА при удалении из localStorage:", e);
  }
  delete axios.defaults.headers.common["Authorization"];
  console.log("[Logout] Заголовок Axios удален.");
  router.push({ name: "Home" });
};

// --- ОБНОВЛЕННАЯ ФУНКЦИЯ onMounted ---
onMounted(async () => {
  isAuthLoading.value = true;
  let tokenFromStorage = null;
  let storedUserStr = null;

  console.log("------------------------------------");
  console.log(
    "[onMounted] Компонент App смонтирован. Начинаю проверку localStorage...",
  );

  try {
    tokenFromStorage = localStorage.getItem("authToken");
    console.log(
      `[onMounted] Прочитано из localStorage для 'authToken':`,
      tokenFromStorage
        ? `(длина ${tokenFromStorage.length})`
        : tokenFromStorage,
    ); // Лог: Чтение токена
    storedUserStr = localStorage.getItem("currentUser");
    console.log(
      `[onMounted] Прочитано из localStorage для 'currentUser':`,
      storedUserStr ? `(длина ${storedUserStr.length})` : storedUserStr,
    ); // Лог: Чтение пользователя
  } catch (e) {
    console.error("[onMounted] ОШИБКА чтения из localStorage:", e);
  }

  if (tokenFromStorage) {
    console.log(
      "[onMounted] Токен найден. Пытаюсь проверить его через /api/users/me...",
    );
    axios.defaults.headers.common["Authorization"] =
      `Bearer ${tokenFromStorage}`;
    try {
      const response = await axios.get("http://localhost:5000/api/users/me");
      currentUser.value = response.data;
      isLoggedIn.value = true;
      console.log(
        "[onMounted] Пользователь успешно получен с бекенда:",
        currentUser.value,
      );
      // Дополнительно проверим, совпадает ли полученный пользователь с сохраненным (если он был)
      if (storedUserStr) {
        try {
          const storedUserParsed = JSON.parse(storedUserStr);
          if (currentUser.value.id !== storedUserParsed.id) {
            console.warn(
              "[onMounted] ID пользователя с бекенда не совпадает с ID в localStorage!",
            );
            // Обновляем currentUser в localStorage на всякий случай
            localStorage.setItem(
              "currentUser",
              JSON.stringify(currentUser.value),
            );
          }
        } catch (e) {
          /* Ошибка парсинга уже обработана выше */
        }
      } else {
        // Если токен был, а юзера в сторадже нет - сохраняем полученного
        localStorage.setItem("currentUser", JSON.stringify(currentUser.value));
        console.log(
          "[onMounted] Данные пользователя сохранены в localStorage (т.к. отсутствовали).",
        );
      }
    } catch (error) {
      console.error(
        "[onMounted] Ошибка при запросе /api/users/me или токен невалиден:",
        error.response?.status,
        error.message,
      );
      // Интерцептор axios должен был обработать 401, но на всякий случай чистим состояние
      isLoggedIn.value = false;
      currentUser.value = null;
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      delete axios.defaults.headers.common["Authorization"];
      console.log(
        "[onMounted] Состояние сброшено из-за ошибки проверки токена.",
      );
    }
  } else {
    // Токен не найден при загрузке
    isLoggedIn.value = false;
    currentUser.value = null;
    console.log("[onMounted] Токен не найден в localStorage."); // Это сообщение ты видел
  }
  isAuthLoading.value = false;
  console.log("[onMounted] Проверка состояния аутентификации завершена.");
  console.log("------------------------------------");
});
// Функції для переключення між модалками
const openLoginModalFromRegister = () => {
  closeRegisterModal();
  openLoginModal();
};
const openRegisterModalFromLogin = () => {
  closeLoginModal();
  openRegisterModal();
};
</script>

<style scoped>
.container {
  padding: 2rem;
  text-align: center;
}
#app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex-grow: 1;
}
</style>
