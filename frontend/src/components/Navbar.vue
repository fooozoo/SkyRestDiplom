<template>
  <nav class="navbar">
    <div class="container">
      <router-link to="/" class="navbar-logo">SkyRest</router-link>
      <button class="hamburger-button" @click="isMenuOpen = !isMenuOpen">
        ☰
      </button>
      <div class="navbar-links" :class="{ 'is-open': isMenuOpen }">
        <ul>
          <li>
            <router-link to="/" @click="isMenuOpen = false"
              >Головна</router-link
            >
          </li>
          <li>
            <router-link to="/menu" @click="isMenuOpen = false"
              >Меню</router-link
            >
          </li>
          <li>
            <router-link to="/reservations" @click="isMenuOpen = false"
              >Резервації</router-link
            >
          </li>
          <template v-if="!isLoggedIn">
            <li>
              <button
                @click="closeMenuAndEmit('open-login')"
                class="navbar-button-link"
              >
                Вхід
              </button>
            </li>
            <li>
              <button
                @click="closeMenuAndEmit('open-register')"
                class="navbar-button-link"
              >
                Реєстрація
              </button>
            </li>
          </template>
          <template v-else>
            <li v-if="currentUser && currentUser.id">
              <router-link
                :to="{ name: 'Profile', params: { id: currentUser.id } }"
                @click="isMenuOpen = false"
                >Профіль</router-link
              >
            </li>
            <li>
              <button
                @click="closeMenuAndEmit('logout')"
                class="navbar-button-link"
              >
                Вийти
              </button>
            </li>
            <li v-if="currentUser?.role === 'admin'" class="notification-item">
              <button
                @click="toggleNotificationMenu"
                class="navbar-button-link notification-bell"
              >
                <span class="bell-icon">🔔</span>
                <span v-if="unreadCount > 0" class="notification-badge">{{
                  unreadCount
                }}</span>
              </button>

              <div v-if="isNotificationMenuOpen" class="notification-dropdown">
                <div class="notification-header">
                  Сповіщення для адміністратора
                </div>
                <div v-if="isLoadingNotifications" class="notification-content">
                  Завантаження...
                </div>
                <ul
                  v-else-if="notifications.length > 0"
                  class="notification-list"
                >
                  <li
                    v-for="notif in notifications"
                    :key="`${notif.type}-${notif.id}`"
                    class="notification-list-item"
                  >
                    <div class="notification-main">
                      <div class="notification-text">
                        <strong v-if="notif.type === 'order'"
                          >Нове замовлення №{{ notif.id }}</strong
                        >
                        <strong v-if="notif.type === 'reservation'"
                          >Нова резервація №{{ notif.id }}</strong
                        >

                        <div class="notification-details">
                          <div v-if="notif.type === 'order'">
                            <div class="notification-line">
                              <span>Склад:</span> {{ notif.items_preview }}
                            </div>
                            <div class="notification-line">
                              <span>Адреса:</span>
                              <strong>{{ notif.delivery_address }}</strong>
                            </div>
                            <div
                              v-if="notif.customer_comment"
                              class="notification-line"
                            >
                              <span>Коментар:</span>
                              <em>{{ notif.customer_comment }}</em>
                            </div>
                          </div>

                          <div v-if="notif.type === 'reservation'">
                            <div class="notification-line">
                              <span>Стіл:</span>
                              <strong>{{ notif.table_name }}</strong>
                            </div>
                            <div class="notification-line">
                              <span>На:</span>
                              <strong>{{
                                formatFullDateTime(notif.reservation_datetime)
                              }}</strong>
                            </div>
                            <div class="notification-line">
                              <span>К-сть:</span>
                              <strong
                                >{{ notif.party_size }}
                                {{ pluralizePeople(notif.party_size) }}</strong
                              >
                            </div>
                          </div>

                          <div class="notification-line">
                            <span>Від:</span> {{ notif.username }} - о
                            {{
                              formatNotificationTime(
                                notif.order_time || notif.reservation_datetime,
                              )
                            }}
                          </div>
                        </div>
                      </div>

                      <button
                        @click.stop="
                          toggleActionMenu(`${notif.type}-${notif.id}`)
                        "
                        class="actions-button"
                      >
                        ⋮
                      </button>
                    </div>
                    <div
                      v-if="openedActionMenu === `${notif.type}-${notif.id}`"
                      class="actions-menu"
                    >
                      <button
                        v-if="notif.type === 'order'"
                        @click="handleConfirmOrder(notif)"
                        class="action-item action-item-confirm"
                      >
                        Підтвердити
                      </button>
                      <button
                        v-if="notif.type === 'order'"
                        @click="handleCancelOrder(notif)"
                        class="action-item action-item-cancel"
                      >
                        Скасувати замовлення
                      </button>
                      <button
                        v-if="notif.type === 'reservation'"
                        @click="handleConfirmReservation(notif)"
                        class="action-item action-item-confirm"
                      >
                        Підтвердити резервацію
                      </button>
                      <button
                        v-if="notif.type === 'reservation'"
                        @click="handleCancelReservation(notif)"
                        class="action-item action-item-cancel"
                      >
                        Скасувати резервацію
                      </button>
                    </div>
                  </li>
                </ul>
                <div v-else class="notification-content">
                  Нових сповіщень немає.
                </div>
              </div>
            </li>
          </template>
          <li>
            <button
              @click="closeMenuAndEmit('open-cart')"
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
import { ref, inject } from "vue";
import axios from "axios";

const unreadCount = inject("unreadCount", ref(0));
const isNotificationMenuOpen = ref(false);
const notifications = ref([]);
const isLoadingNotifications = ref(false);

const showToast = inject("showToast", (msg, type) =>
  console.warn(`Toast: ${type}-${msg}`),
);

const toggleNotificationMenu = async () => {
  isNotificationMenuOpen.value = !isNotificationMenuOpen.value;
  if (isNotificationMenuOpen.value && unreadCount.value > 0) {
    isLoadingNotifications.value = true;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/notifications/unread`,
      );
      notifications.value = response.data;

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/notifications/mark-as-read`,
      );

      unreadCount.value = 0;
    } catch (error) {
      console.error("Не вдалося завантажити сповіщення:", error);
    } finally {
      isLoadingNotifications.value = false;
    }
  } else if (isNotificationMenuOpen.value) {
    notifications.value = [];
  }
};

const isMenuOpen = ref(false);

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
const emit = defineEmits([
  "open-register",
  "logout",
  "open-login",
  "open-cart",
]);

const cartStore = useCartStore();

const closeMenuAndEmit = (eventName) => {
  if (eventName) {
    emit(eventName);
  }
  isMenuOpen.value = false;
};

const openedActionMenu = ref(null);

const toggleActionMenu = (notificationId) => {
  if (openedActionMenu.value === notificationId) {
    openedActionMenu.value = null;
  } else {
    openedActionMenu.value = notificationId;
  }
};

const handleConfirmOrder = async (orderToConfirm) => {
  try {
    const apiUrl = `${import.meta.env.VITE_API_URL}/api/orders/${orderToConfirm.id}/confirm`;
    await axios.post(apiUrl);

    showToast(`Замовлення №${orderToConfirm.id} підтверджено!`, "success");

    const confirmedNotif = notifications.value.find(
      (n) => n.id === orderToConfirm.id && n.type === "order",
    );
    if (confirmedNotif) {
      confirmedNotif.status = "Підтверджено";
    }
    openedActionMenu.value = null;
  } catch (error) {
    showToast("Помилка підтвердження замовлення.", "error");
    console.error("Error confirming order:", error);
  }
};
const handleCancelOrder = async (orderToCancel) => {
  try {
    const apiUrl = `${import.meta.env.VITE_API_URL}/api/orders/${orderToCancel.id}/cancel`;
    await axios.post(apiUrl);

    showToast(`Замовлення №${orderToCancel.id} скасовано.`, "info");

    notifications.value = notifications.value.filter(
      (n) => n.id !== orderToCancel.id || n.type !== "order",
    );
    openedActionMenu.value = null;
  } catch (error) {
    showToast("Помилка скасування замовлення.", "error");
    console.error("Error canceling order:", error);
  }
};
const handleConfirmReservation = async (reservation) => {
  try {
    const apiUrl = `${import.meta.env.VITE_API_URL}/api/reservations/${reservation.id}/confirm`;
    await axios.post(apiUrl);
    showToast(`Резервацію №${reservation.id} підтверджено!`, "success");
    notifications.value = notifications.value.filter(
      (n) => n.id !== reservation.id || n.type !== "reservation",
    );
    openedActionMenu.value = null;
  } catch (error) {
    showToast("Помилка підтвердження резервації.", "error");
    console.error("Error confirming reservation:", error);
  }
};

const handleCancelReservation = async (reservation) => {
  try {
    const apiUrl = `${import.meta.env.VITE_API_URL}/api/reservations/${reservation.id}/cancel`;
    await axios.post(apiUrl);
    showToast(`Резервацію №${reservation.id} скасовано.`, "info");
    notifications.value = notifications.value.filter(
      (n) => n.id !== reservation.id || n.type !== "reservation",
    );
    openedActionMenu.value = null;
  } catch (error) {
    showToast("Помилка скасування резервації.", "error");
    console.error("Error canceling reservation:", error);
  }
};
const formatNotificationTime = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
const pluralizePeople = (count) => {
  if (count === 1) return "людина";
  if (count > 1 && count < 5) return "людини";
  return "людей";
};

const formatFullDateTime = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("uk-UA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

<style scoped>
.navbar {
  position: relative;
}
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
.hamburger-button {
  display: none;
  background: none;
  border: none;
  color: #ccd6f6;
  font-size: 2rem;
  cursor: pointer;
}

@media (max-width: 768px) {
  .navbar .container {
    justify-content: space-between;
  }

  .navbar-links {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background-color: #0a192f;
    flex-direction: column;
    align-items: center;
    padding: 1rem 0;
  }

  .navbar-links.is-open {
    display: flex;
  }

  .navbar-links ul {
    flex-direction: column;
    width: 100%;
    text-align: center;
  }

  .navbar-links li {
    margin: 0.5rem 0;
  }

  .hamburger-button {
    display: block;
  }
}
.notification-item {
  position: relative;
}

.notification-bell {
  position: relative;
  font-size: 1.5rem;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -8px;
  background-color: #dc3545;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: bold;
  line-height: 1;
  border: 2px solid #0a192f;
}

.notification-dropdown {
  position: absolute;
  top: 150%;
  right: 0;
  width: 300px;
  background-color: #f8f9fa;
  color: #212529;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  z-index: 1100;
  border: 1px solid #dee2e6;
  text-align: left;
}

.notification-header {
  padding: 0.75rem 1rem;
  font-weight: bold;
  border-bottom: 1px solid #dee2e6;
}

.notification-content {
  padding: 1rem;
  color: #6c757d;
}

.notification-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 400px;
  overflow-y: auto;
}

.notification-list-item {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}

.notification-list-item:last-child {
  border-bottom: none;
}
.notification-list-item {
  padding: 0;
}
.notification-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
}
.notification-details {
  font-size: 0.8em;
  color: #6c757d;
  margin-top: 4px;
}
.actions-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #6c757d;
  padding: 0 0.5rem;
}
.actions-menu {
  background-color: #fff;
  border-top: 1px solid #eee;
  padding: 0.5rem 0;
}
.action-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  font-size: 0.9em;
  cursor: pointer;
}
.action-item:hover {
  background-color: #f0f0f0;
}
.notification-details {
  font-size: 0.8em;
  color: #6c757d;
  margin-top: 5px;
}
.notification-line {
  margin-top: 3px;
  white-space: normal;
}
.notification-line span {
  color: #343a40;
}
.notification-line em {
  color: #555;
  font-style: italic;
}
</style>
