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
          <li>
            <button
              @click="openCartModal"
              class="navbar-button-link cart-button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="20px"
                height="20px"
                style="margin-bottom: -4px"
              >
                <path
                  d="M17.21 9l-4.38-6.56a1 1 0 00-1.66 0L6.79 9H2a1 1 0 00-.96.72l-2 9A1 1 0 00.02 20H24a1 1 0 00.98-1.28l-2-9A1 1 0 0022 9h-4.79zM9 9l3-4.5L15 9H9zm3 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
                ></path>
              </svg>
              <span v-if="cartStore.itemCount > 0" class="cart-count">{{
                cartStore.itemCount
              }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useCartStore } from "../stores/cart";

const props = defineProps({
  isLoggedIn: {
    type: Boolean,
    required: true,
  },
  currentUser: {
    type: Object,
    default: null,
  },
});
// Подія для відкриття модалки реєстрації
// Подія для виконання виходу
const emit = defineEmits([
  "open-register",
  "logout",
  "open-login",
  "open-cart",
]);

const cartStore = useCartStore();

const openRegisterModal = () => {
  emit("open-register");
};

const logout = () => {
  emit("logout");
};
const openLoginModal = () => {
  emit("open-login");
};
const openCartModal = () => {
  emit("open-cart");
};
</script>

<style scoped>
.cart-button {
  position: relative;
  padding: 5px;
}

.cart-count {
  position: absolute;
  top: -5px;
  right: -8px;
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  padding: 2px 5px;
  font-size: 0.7rem;
  font-weight: bold;
  line-height: 1;
  min-width: 16px;
  text-align: center;
  border: 1px solid #0a192f;
}

.navbar-button-link svg {
  vertical-align: middle;
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
