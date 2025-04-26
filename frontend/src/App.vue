<template>
  <div id="app-wrapper">
    <Navbar
      @open-register="openRegisterModal"
      @open-login="openLoginModal"
      :isLoggedIn="isLoggedIn"
      :currentUser="currentUser"
      @logout="handleLogout"
    />
    <main>
      <router-view />
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
// Імпортуємо useRouter для програмної навігації
import { useRouter } from "vue-router";
import Navbar from "./components/Navbar.vue";
import Footer from "./components/Footer.vue";
import RegisterModal from "./components/RegisterModal.vue";
import LoginModal from "./components/LoginModal.vue";

// Стан модального вікна
const isRegisterModalOpen = ref(false);
const isLoginModalOpen = ref(false);
const isLoggedIn = ref(false); // Чи користувач "залогінений"?
const currentUser = ref(null); // Зберігаємо дані поточного користувача

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
  console.log("App.vue received registration success:", userData);
  // 1. Зберігаємо дані користувача (умовно)
  currentUser.value = userData;
  // 2. Встановлюємо стан "залогінений"
  isLoggedIn.value = true; // Можна використовувати для відображення іншого стану Navbar, наприклад
  // 3. Закриваємо модальне вікно
  closeRegisterModal();
  // 4. Перенаправляємо на сторінку профілю, передаючи ID
  router.push({ name: "Profile", params: { id: userData.id } }); // Перехід за іменем маршруту
  // Або так: router.push(`/profile/${userData.id}`); // Перехід за шляхом
};
const handleSuccessfulLogin = ({ token, user }, isRegistration = false) => {
  console.log("App.vue received login success:", { token, user });
  currentUser.value = user;
  isLoggedIn.value = true;

  if (token) {
    localStorage.setItem("authToken", token);
    // ---> ДОБАВЬ ЭТУ СТРОКУ <---
    localStorage.setItem("currentUser", JSON.stringify(user)); // Сохраняем объект user как JSON-строку
    // ---> КОНЕЦ ДОБАВЛЕННОЙ СТРОКИ <---
  }

  closeLoginModal();
  closeRegisterModal();

  const redirectDelay = isRegistration ? 500 : 0;
  setTimeout(() => {
    router.push({ name: "Profile", params: { id: user.id } });
  }, redirectDelay);
};

//ФУНКЦІЯ ВИХОДУ
const handleLogout = () => {
  console.log("Logging out...");
  isLoggedIn.value = false;
  currentUser.value = null;
  localStorage.removeItem("authToken");
  // ---> ДОБАВЬ ЭТУ СТРОКУ <---
  localStorage.removeItem("currentUser"); // Удаляем данные пользователя при выходе
  // ---> КОНЕЦ ДОБАВЛЕННОЙ СТРОКИ <---
  router.push({ name: "Home" });
};
// Щоб користувач залишався залогіненим після оновлення сторінки
onMounted(() => {
  const token = localStorage.getItem("authToken");
  if (token) {
    console.log("Found token in localStorage, attempting to verify...");
    // В реальному додатку:
    // 1. Відправити токен на бекенд для перевірки (/api/auth/me або схоже)
    // 2. Якщо токен валідний, отримати дані користувача з відповіді
    // 3. Встановити isLoggedIn.value = true та currentUser.value
    // 4. Налаштувати axios для використання токена за замовчуванням

    // -------- СПРОЩЕНА СИМУЛЯЦІЯ (без перевірки на бекенді!) --------
    // Просто припускаємо, що токен валідний, якщо він є.
    // НЕ РОБИ ТАК В РЕАЛЬНОМУ ПРОЕКТІ! ПОТРІБНА ПЕРЕВІРКА НА БЕКЕНДІ!
    // Потрібно також десь зберегти дані користувача або запитати їх знову.
    // Наприклад, можна зберегти currentUser в localStorage разом з токеном.
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        currentUser.value = JSON.parse(storedUser);
        isLoggedIn.value = true;
        console.log("User restored from localStorage");
        // Тут не перенаправляємо, користувач вже міг бути на якійсь сторінці
      } catch (e) {
        console.error("Failed to parse stored user data", e);
        localStorage.removeItem("authToken");
        localStorage.removeItem("currentUser");
      }
    } else {
      // Якщо є токен, але немає даних користувача - це дивно, видаляємо токен
      localStorage.removeItem("authToken");
    }
    // -------- КІНЕЦЬ СПРОЩЕНОЇ СИМУЛЯЦІЇ --------
  }
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
