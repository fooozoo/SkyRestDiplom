<template>
  <div class="content-section profile-page">
    <div class="container">
      <h2>Профіль користувача</h2>
      <div v-if="isLoading" class="loading-indicator">
        <p>Завантаження даних профілю...</p>
      </div>
      <div v-else-if="errorMessage" class="error-message-profile">
        <p>{{ errorMessage }}</p>
        <router-link to="/">Повернутись на головну</router-link>
      </div>
      <div v-else-if="profileData" class="profile-card">
        <div class="profile-header">
          <div class="avatar-section">
            <img
              :src="profileData.avatar_url || defaultAvatar"
              alt="Аватар користувача"
              class="profile-avatar"
            />
            <input
              type="file"
              ref="fileInput"
              @change="handleFileChange"
              accept="image/*"
              style="display: none"
            />
            <button
              @click="triggerFileInput"
              class="cta-button avatar-change-btn"
              :disabled="uploadingAvatar"
            >
              Змінити аватар
            </button>
            <button
              v-if="selectedFile"
              @click="uploadAvatar"
              class="cta-button upload-btn"
              :disabled="uploadingAvatar"
            >
              {{ uploadingAvatar ? "Завантаження..." : "Завантажити" }}
            </button>
            <div v-if="selectedFile" class="file-preview">
              Обрано: {{ selectedFile.name }}
            </div>
          </div>
          <h3>{{ profileData.username }}</h3>
        </div>
        <div class="profile-details">
          <div class="detail-item">
            <span class="detail-label">ID Користувача:</span>
            <span class="detail-value">{{ profileData.id }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Email:</span>
            <span class="detail-value">{{ profileData.email }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Дата реєстрації:</span>
            <span class="detail-value">{{ formattedRegistrationDate }}</span>
          </div>
        </div>
        <div class="profile-actions">
          <router-link
            v-if="currentUser?.role === 'admin'"
            to="/admin"
            class="cta-button"
            style="margin-right: auto; background-color: #17a2b8; color: white"
          >
            Адмін панель
          </router-link>
          <button @click="toggleReservations" class="cta-button tertiary">
            {{ showReservations ? "Сховати резервації" : "Мої резервації" }}
          </button>
          <button @click="toggleOrders" class="cta-button tertiary">
            {{ showOrders ? "Сховати замовлення" : "Мої замовлення" }}
          </button>
        </div>
      </div>
      <section v-if="showReservations" class="order-history-section">
        <h3>Мої резервації столиків</h3>
        <div v-if="isLoadingReservations" class="loading-indicator">
          <p>Завантаження резервацій...</p>
        </div>
        <div v-else-if="loadReservationsError" class="error-message">
          <p>{{ loadReservationsError }}</p>
        </div>
        <div v-else-if="userReservations.length > 0" class="orders-list">
          <div v-for="res in userReservations" :key="res.id" class="order-card">
            <div class="order-header">
              <span>Резервація №{{ res.id }}</span>
              <span
                >Статус:
                <strong :class="`status-${res.status?.toLowerCase()}`">{{
                  res.status
                }}</strong></span
              >
              <span>Створено: {{ formatDateTime(res.created_at) }}</span>
            </div>
            <div class="order-body">
              <p>
                <strong>Столик:</strong>
                {{ res.table_name || `ID ${res.table_id}` }}
              </p>
              <p>
                <strong>Дата та час резервації:</strong>
                {{ formatDateTime(res.reservation_datetime) }}
              </p>
              <p><strong>Кількість гостей:</strong> {{ res.party_size }}</p>
            </div>
            <div class="order-footer">...</div>
          </div>
        </div>
        <div v-else>
          <p>У вас ще немає жодної резервації столиків.</p>
        </div>
      </section>
      <div v-else class="no-data-message">
        <p>Не вдалося завантажити дані профілю. Спробуйте увійти знову.</p>
        <router-link to="/">Повернутись на головну</router-link>
      </div>

      <div v-else class="no-data-message">
        <p>Не вдалося завантажити дані...</p>
      </div>
      <section v-if="showOrders" class="order-history-section">
        <h3>Історія моїх замовлень</h3>

        <div v-if="isLoadingOrders" class="loading-indicator">
          <p>Завантаження замовлень...</p>
        </div>
        <div v-else-if="loadOrdersError" class="error-message">
          <p>{{ loadOrdersError }}</p>
        </div>
        <div v-else-if="userOrders.length > 0" class="orders-list">
          <div v-for="order in userOrders" :key="order.id" class="order-card">
            <div class="order-header">
              <span>Замовлення №{{ order.id }}</span>
              <span
                >Статус:
                <strong :class="`status-${order.status?.toLowerCase()}`">{{
                  order.status
                }}</strong></span
              >
              <span>Дата: {{ formatDateTime(order.order_time) }}</span>
            </div>
            <
            <div class="order-body">
              <p><strong>Адреса:</strong> {{ order.delivery_address }}</p>
              <div
                v-if="order.items && order.items.length > 0"
                class="order-items-details"
              >
                <strong>Замовлено:</strong>
                <ul>
                  <li
                    v-for="item in order.items"
                    :key="item.menu_item_id"
                    class="order-item-li"
                  >
                    <img
                      :src="item.menu_item_image_url || defaultAvatar"
                      :alt="item.menu_item_name"
                      class="order-item-image-small"
                    />
                    <span>{{ item.menu_item_name }}</span>
                    <span>(x {{ item.quantity }})</span>
                    <span
                      >-
                      {{
                        formatPrice(item.price_at_order * item.quantity)
                      }}</span
                    >
                  </li>
                </ul>
              </div>
            </div>
            <div class="order-footer">
              <strong>Всього: {{ formatPrice(order.total_price) }}</strong>
            </div>
          </div>
        </div>
        <div v-else>
          <p>У вас ще немає жодного замовлення.</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from "vue";
import axios from "axios";
import defaultAvatar from "../assets/default-avatar.png";
const currentUser = inject("currentUser");
const updateUserData = inject("updateUserData");
const showToast = inject("showToast", (message, type) =>
  console.warn(`Toast: ${type} - ${message}`),
);
const formatPrice = (price) => {
  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice)) {
    return price;
  }
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
  }).format(numericPrice);
};

const userReservations = ref([]);
const isLoadingReservations = ref(false);
const loadReservationsError = ref("");
const showReservations = ref(false);

const userOrders = ref([]); // Масив для замовлень
const isLoadingOrders = ref(false); // Чи йде завантаження замовлень?
const loadOrdersError = ref(""); // Помилка завантаження замовлень
const showOrders = ref(false); // Чи показувати секцію замовлень?

const profileData = ref(null);
const isLoading = ref(false);
const errorMessage = ref("");

const fileInput = ref(null);
const selectedFile = ref(null);
const uploadingAvatar = ref(false);

const formatDateTime = (dateString) => {
  if (!dateString) return "Невідомо";
  try {
    const date = new Date(dateString);
    return date.toLocaleString("uk-UA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return dateString;
  }
};

const formattedRegistrationDate = computed(() => {
  return profileData.value
    ? formatDateTime(profileData.value.created_at)
    : "Невідомо";
});

const fetchMyOrders = async () => {
  if (userOrders.value.length > 0 && !loadOrdersError.value) {
    console.log("Orders already fetched.");
    return;
  }
  isLoadingOrders.value = true;
  loadOrdersError.value = "";
  try {
    const response = await axios.get("http://localhost:5000/api/orders/my");
    userOrders.value = response.data;
    console.log("User orders fetched:", userOrders.value.length);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    loadOrdersError.value =
      error.response?.data?.message ||
      "Не вдалося завантажити історію замовлень.";
    showToast(loadOrdersError.value, "error");
  } finally {
    isLoadingOrders.value = false;
  }
};

const toggleOrders = () => {
  showOrders.value = !showOrders.value; // Перемикаємо видимість
  // Якщо секція стає видимою і замовлення ще не завантажені - завантажуємо
  if (
    showOrders.value &&
    userOrders.value.length === 0 &&
    !loadOrdersError.value
  ) {
    fetchMyOrders();
  }
};

onMounted(async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const response = await axios.get("http://localhost:5000/api/users/me");
    profileData.value = response.data;
  } catch (error) {
    console.error("Failed to fetch profile data in ProfileView:", error);
    errorMessage.value =
      error.response?.data?.message || "Не вдалося завантажити дані профілю.";
    if (error.response?.status === 401) {
      errorMessage.value = "Сесія недійсна. Будь ласка, увійдіть знову.";
    }
    profileData.value = null;
  } finally {
    isLoading.value = false;
  }
});

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileChange = (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    /*...*/ return;
  }
  if (!file.type.startsWith("image/")) {
    showToast("Будь ласка, оберіть файл зображення.", "error");
    selectedFile.value = null;
    event.target.value = "";
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast("Файл занадто великий (макс. 5MB).", "error");
    selectedFile.value = null;
    event.target.value = "";
    return;
  }
  selectedFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => {};
  reader.readAsDataURL(file);
  event.target.value = "";
};

const uploadAvatar = async () => {
  if (!selectedFile.value) {
    showToast("Спочатку оберіть файл.", "error");
    return;
  }

  uploadingAvatar.value = true;

  const formData = new FormData();
  formData.append("avatar", selectedFile.value);

  try {
    const apiUrl = "http://localhost:5000/api/users/avatar";
    const response = await axios.post(apiUrl, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    selectedFile.value = null;

    showToast(response.data.message || "Аватар успішно оновлено!", "success");

    if (updateUserData) {
      console.log("[ProfileView] updateUserData є. Викликаю її...");
      await updateUserData();
    } else if (currentUser.value) {
      currentUser.value.avatar_url = response.data.avatarUrl;
    }
  } catch (error) {
    console.error("Avatar upload failed:", error);
    const errorMsg =
      error.response?.data?.message || "Помилка завантаження аватара.";
    showToast(errorMsg, "error", 5000);
  } finally {
    uploadingAvatar.value = false;
  }
};

const fetchMyReservations = async () => {
  if (userReservations.value.length > 0 && !loadReservationsError.value) return;

  isLoadingReservations.value = true;
  loadReservationsError.value = "";
  try {
    const response = await axios.get(
      "http://localhost:5000/api/reservations/my",
    );
    userReservations.value = response.data;
    console.log("User reservations fetched:", userReservations.value.length);
  } catch (error) {
    console.error("Error fetching user reservations:", error);
    loadReservationsError.value =
      error.response?.data?.message || "Не вдалося завантажити резервації.";
    showToast(loadReservationsError.value, "error");
  } finally {
    isLoadingReservations.value = false;
  }
};

const toggleReservations = () => {
  showReservations.value = !showReservations.value;
  if (
    showReservations.value &&
    userReservations.value.length === 0 &&
    !loadReservationsError.value
  ) {
    fetchMyReservations();
  }
};
</script>

<style scoped>
.profile-page .container {
  max-width: 800px;
}

.profile-page h2 {
  color: #0a192f;
  text-align: center;
  margin-bottom: 2.5rem;
}

.profile-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 2rem;
}

.profile-header {
  background-color: #112240;
  color: #ccd6f6;
  padding: 1.5rem 2rem;
}

.profile-header h3 {
  margin: 0;
  font-size: 1.8rem;
  color: #ffffff;
}

.profile-details {
  padding: 2rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 0;
  border-bottom: 1px solid #e9ecef;
  font-size: 1rem;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: #495057;
  margin-right: 1rem;
}

.detail-value {
  color: #212529;
  text-align: right;
}

.profile-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  background-color: #f8f9fa;
  padding: 1.5rem 2rem;
  border-top: 1px solid #e9ecef;
}

.profile-actions .cta-button {
  margin-left: 1rem;
}

.profile-actions .cta-button:first-of-type {
  margin-left: 0;
}

.profile-actions .router-link-active,
.profile-actions a.cta-button {
  margin-right: auto;
  padding: 0.6rem 1.2rem;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: bold;
  display: inline-block;
  text-align: center;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}
.profile-actions a.cta-button:hover {
  background-color: #138496 !important;
}

.cta-button.secondary {
  background-color: #6c757d;
  color: white;
}
.cta-button.secondary:hover {
  background-color: #5a6268;
}

.cta-button.tertiary {
  background-color: transparent;
  color: #0a192f;
  border: 1px solid #0a192f;
}
.cta-button.tertiary:hover {
  background-color: #0a192f;
  color: white;
}

.loading-indicator,
.no-data-message,
.error-message-profile {
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
}
.error-message-profile {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}
.error-message-profile a,
.no-data-message a {
  color: #007bff;
  text-decoration: underline;
}
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.avatar-change-btn {
  font-size: 0.85rem !important;
  padding: 0.4rem 0.8rem !important;
  width: auto !important;
  margin-top: 0 !important;
  background-color: #e9ecef !important;
  color: #495057 !important;
}
.avatar-change-btn:hover {
  background-color: #dee2e6 !important;
}

.file-preview {
  font-size: 0.8em;
  color: #6c757d;
  margin-top: 0.5rem;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-btn {
  margin-top: 0.5rem !important;
  width: auto !important;
  padding: 0.5rem 1rem !important;
  font-size: 0.9rem !important;
}

.upload-error {
  color: #dc3545;
  font-size: 0.85em;
  margin-top: 0.5rem;
}
.order-history-section {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.order-history-section h3 {
  text-align: center;
  color: #112240;
  margin-bottom: 2rem;
}

.order-card {
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  font-size: 0.95rem;
}

.order-header {
  background-color: #f8f9fa;
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.9em;
  color: #495057;
}
.order-header span:first-child {
  font-weight: bold;
  color: #343a40;
}
.status-нове {
  color: #007bff;
  font-weight: bold;
}
.status-в-обробці {
  color: #ffc107;
  font-weight: bold;
}
.status-доставлено {
  color: #28a745;
  font-weight: bold;
}
.status-скасовано {
  color: #dc3545;
  font-weight: bold;
}

.order-body {
  padding: 1.25rem;
}
.order-body p {
  margin: 0 0 0.5rem 0;
  line-height: 1.6;
}

.order-footer {
  padding: 0.75rem 1.25rem;
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
  text-align: right;
  font-size: 1.1em;
}
.order-items-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #eee;
  font-size: 0.9em;
}
.order-items-details strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #343a40;
}
.order-items-details ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}
.order-item-li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.3rem 0;
  color: #495057;
}
.order-item-li span:nth-child(2) {
  flex-grow: 1;
}
.order-item-li span:nth-child(3) {
  font-style: italic;
  color: #6c757d;
}
.order-item-li span:nth-child(4) {
  font-weight: 500;
  min-width: 70px;
  text-align: right;
}
.order-item-image-small {
  width: 30px;
  height: 30px;
  object-fit: cover;
  border-radius: 3px;
  border: 1px solid #eee;
}
</style>
