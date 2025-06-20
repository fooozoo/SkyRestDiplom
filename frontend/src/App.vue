<template>
  <div id="app-wrapper" :class="{ 'app-background': showAppBackground }">
    <Navbar
      :isLoggedIn="isLoggedIn"
      :currentUser="currentUser"
      @open-register="openRegisterModal"
      @open-login="openLoginModal"
      @open-cart="openCartModal"
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
    <ToastNotification
      :visible="toast.visible"
      :message="toast.message"
      :type="toast.type"
      @close="hideToast"
    />
    <CartModal :isOpen="isCartModalOpen" @close="closeCartModal" />
  </div>
</template>

<script setup>
import { ref, onMounted, provide, reactive, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import Navbar from "./components/Navbar.vue";
import Footer from "./components/Footer.vue";
import RegisterModal from "./components/RegisterModal.vue";
import LoginModal from "./components/LoginModal.vue";
import ToastNotification from "./components/ToastNotification.vue";
import CartModal from "./components/CartModal.vue";

const isRegisterModalOpen = ref(false);
const isLoginModalOpen = ref(false);
const isCartModalOpen = ref(false);
const isLoggedIn = ref(false);
const currentUser = ref(null);
const isAuthLoading = ref(true);

const router = useRouter();

const showAppBackground = computed(() => router.name !== "Home");

const toast = reactive({
  visible: false,
  message: "",
  type: "success",
  timer: null,
});

const showToast = (message, type = "success", duration = 3500) => {
  if (toast.timer) {
    clearTimeout(toast.timer);
  }
  toast.message = message;
  toast.type = type;
  toast.visible = true;
  toast.timer = setTimeout(() => {
    hideToast();
  }, duration);
};

const hideToast = () => {
  if (toast.timer) {
    clearTimeout(toast.timer);
    toast.timer = null;
  }
  toast.visible = false;
  setTimeout(() => {
    toast.message = "";
    toast.type = "success";
  }, 500);
};

const openCartModal = () => {
  isCartModalOpen.value = true;
};
const closeCartModal = () => {
  isCartModalOpen.value = false;
};

async function fetchAndSetUser() {
  console.log("[App.vue] fetchAndSetUser ВИКЛИКАНА!");
  const token = localStorage.getItem("authToken");
  if (!token) {
    return;
  }
  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/users/me`,
    );
    currentUser.value = response.data;
    currentUser.value = response.data;
    isLoggedIn.value = true;
    console.log(
      "[fetchAndSetUser] Дані користувача оновлено:",
      currentUser.value,
    );
  } catch (error) {}
}

onMounted(async () => {
  isAuthLoading.value = true;
  await fetchAndSetUser();
  isAuthLoading.value = false;
});

const openRegisterModal = () => {
  closeLoginModal();
  isRegisterModalOpen.value = true;
};

const closeRegisterModal = () => {
  isRegisterModalOpen.value = false;
};

const openLoginModal = () => {
  closeRegisterModal();
  isLoginModalOpen.value = true;
};

const closeLoginModal = () => {
  isLoginModalOpen.value = false;
};

const handleSuccessfulRegistration = (userData) => {
  handleSuccessfulLogin({ token: null, user: userData }, true);
};

const handleSuccessfulLogin = ({ token, user }, isRegistration = false) => {
  console.log("[Login] Start. Token:", token, "User:", user);
  currentUser.value = user;
  console.log(
    "[Login Handler] currentUser state updated:",
    JSON.stringify(currentUser.value),
  );
  isLoggedIn.value = true;

  let savedToken = null;
  let savedUserStr = null;

  if (token) {
    console.log("[Login] Токен отриман.Сбереження в localStorage...");
    try {
      localStorage.setItem("authToken", token);
      savedToken = localStorage.getItem("authToken");
    } catch (e) {
      console.error("[Login] Помилка Збереження токена в localStorage:", e);
    }
  } else if (!isRegistration) {
  } else {
  }

  if (user) {
    console.log(
      "[Login] Дані користувача отримані.Збереження в localStorage...",
    );
    try {
      const userString = JSON.stringify(user);
      localStorage.setItem("currentUser", userString);
      savedUserStr = localStorage.getItem("currentUser");
      console.log(
        savedUserStr ? `(довжина ${savedUserStr.length})` : savedUserStr,
      );
    } catch (e) {
      console.error("", e);
    }
  }
  if (savedToken) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
    console.log("");
  }

  closeLoginModal();
  closeRegisterModal();
};

const handleLogout = () => {
  isLoggedIn.value = false;
  currentUser.value = null;
  try {
    localStorage.removeItem("authToken");
    localStorage.removeItem("currentUser");
  } catch (e) {}
  delete axios.defaults.headers.common["Authorization"];
  router.push({ name: "Home" });
};

provide("currentUser", currentUser);
provide("updateUserData", fetchAndSetUser);
provide("isLoggedIn", isLoggedIn);
provide("openLoginModal", openLoginModal);
provide("openRegisterModal", openRegisterModal);
provide("showToast", showToast);
onMounted(async () => {
  isAuthLoading.value = true;
  let tokenFromStorage = null;
  let storedUserStr = null;
  try {
    tokenFromStorage = localStorage.getItem("authToken");
    storedUserStr = localStorage.getItem("currentUser");
  } catch (e) {}

  if (tokenFromStorage) {
    axios.defaults.headers.common["Authorization"] =
      `Bearer ${tokenFromStorage}`;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/users/me`,
      );
      currentUser.value = response.data;
      isLoggedIn.value = true;
      if (storedUserStr) {
        try {
          const storedUserParsed = JSON.parse(storedUserStr);
          if (currentUser.value.id !== storedUserParsed.id) {
            localStorage.setItem(
              "currentUser",
              JSON.stringify(currentUser.value),
            );
          }
        } catch (e) {}
      } else {
        localStorage.setItem("currentUser", JSON.stringify(currentUser.value));
      }
    } catch (error) {
      isLoggedIn.value = false;
      currentUser.value = null;
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      delete axios.defaults.headers.common["Authorization"];
    }
  } else {
    // Токен не найден при загрузке
    isLoggedIn.value = false;
    currentUser.value = null;
  }
  isAuthLoading.value = false;
});
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
.app-background {
  background-image: url("assets/background.png");
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}
main {
  flex-grow: 1;
}
</style>
