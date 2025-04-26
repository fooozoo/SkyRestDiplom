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

const handleSuccessfulLogin = ({ token, user }, isRegistration = false) => {
  console.log("Login/Reg success in App.vue, setting state...");
  currentUser.value = user;
  isLoggedIn.value = true;

  if (token) {
    localStorage.setItem("authToken", token);
    // ---> Устанавливаем заголовок для ТЕКУЩЕЙ сессии axios <---
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
  // Убираем сохранение currentUser в localStorage, будем запрашивать
  // localStorage.setItem('currentUser', JSON.stringify(user)); // <-- ВИДАЛИ ЦЕЙ РЯДОК

  closeLoginModal();
  closeRegisterModal();

  const redirectDelay = isRegistration ? 500 : 0;
  setTimeout(() => {
    router.push({ name: "Profile", params: { id: user.id } });
  }, redirectDelay);
};

const handleLogout = () => {
  console.log("Logging out in App.vue...");
  isLoggedIn.value = false;
  currentUser.value = null;
  localStorage.removeItem("authToken");
  // localStorage.removeItem('currentUser'); // <-- ВИДАЛИ ЦЕЙ РЯДОК
  // ---> Видаляємо заголовок axios <---
  delete axios.defaults.headers.common["Authorization"];
  router.push({ name: "Home" });
};
// Щоб користувач залишався залогіненим після оновлення сторінки
onMounted(async () => {
  isAuthLoading.value = true; // Начинаем проверку
  const token = localStorage.getItem("authToken");

  if (token) {
    console.log("onMounted: Token found. Verifying with /api/users/me...");
    // Устанавливаем заголовок для запроса (на случай если страница была обновлена и interceptor в main.js еще не отработал для ЭТОГО запроса)
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    try {
      // Запрашиваем данные пользователя с бекенда
      const response = await axios.get("http://localhost:5000/api/users/me"); // Убедись что порт верный
      currentUser.value = response.data; // Сохраняем актуальные данные
      isLoggedIn.value = true;
      console.log(
        "onMounted: User data fetched successfully:",
        currentUser.value,
      );
    } catch (error) {
      // Если запрос /me не удался (например, токен истек или невалиден)
      console.error(
        "onMounted: Failed to fetch user data or token invalid:",
        error,
      );
      // Интерцептор axios уже должен был очистить localStorage и перенаправить,
      // но на всякий случай очистим состояние и здесь
      isLoggedIn.value = false;
      currentUser.value = null;
      localStorage.removeItem("authToken");
      // localStorage.removeItem('currentUser'); // Больше не используется
      delete axios.defaults.headers.common["Authorization"];
      // Можно добавить router.push({ name: 'Home' }) если интерцептор не справился
    }
  } else {
    // Токен не найден - пользователь не залогинен
    isLoggedIn.value = false;
    currentUser.value = null;
    console.log("onMounted: No token found.");
  }
  isAuthLoading.value = false; // Завершаем проверку
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
#app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex-grow: 1;
}
</style>
