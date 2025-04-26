<template>
  <nav class="navbar">
    <div class="container">
      <router-link to="/" class="navbar-logo">SkyRest</router-link>
      <div class="navbar-links">
        <ul>
          <li><router-link to="/">Головна</router-link></li>
          <li><router-link to="/menu">Меню</router-link></li>
          <li><router-link to="/reservations">Резервації</router-link></li>
          <template v-if="!isLoggedIn">
            <li>
              <button @click="openLoginModal" class="navbar-button-link">
                Вхід
              </button>
            </li>
            <li>
              <button @click="openRegisterModal" class="navbar-button-link">
                Реєстрація
              </button>
            </li>
          </template>
          <template v-else>
            <li v-if="currentUser && currentUser.id">
              <router-link
                :to="{ name: 'Profile', params: { id: currentUser.id } }"
                >Профіль</router-link
              >
            </li>
            <li>
              <button @click="logout" class="navbar-button-link">Вийти</button>
            </li>
          </template>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
// ---> ОТРИМУЄМО ПРОПСИ <---
const props = defineProps({
  isLoggedIn: {
    type: Boolean,
    required: true,
  },
  currentUser: {
    // Може бути об'єктом { id, username, ... } або null
    type: Object,
    default: null, // Значення за замовчуванням, якщо не передано
  },
});
// ---> ВИЗНАЧАЄМО ПОДІЇ <---
// Подія для відкриття модалки реєстрації
// Подія для виконання виходу
const emit = defineEmits(["open-register", "logout", "open-login"]);

const openRegisterModal = () => {
  emit("open-register");
};

// ---> ФУНКЦІЯ ДЛЯ ВИХОДУ <---
const logout = () => {
  emit("logout"); // Сигнал батьківському компоненту App.vue
};
const openLoginModal = () => {
  emit("open-login");
};
</script>

<style scoped>
/* ... (попередні стилі) ... */

.router-link-exact-active {
  color: #64ffda;
  font-weight: bold;
}

.navbar-button-link {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font-family: inherit;
  font-size: inherit;
  color: #ccd6f6;
  cursor: pointer;
  transition: color 0.3s ease;
}

.navbar-button-link:hover {
  color: #64ffda;
}
</style>
