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
          <button class="cta-button secondary">Редагувати профіль</button>
          <button class="cta-button tertiary">Мої замовлення</button>
        </div>
      </div>
      <div v-else class="no-data-message">
        <p>Не вдалося завантажити дані профілю. Спробуйте увійти знову.</p>
        <router-link to="/">Повернутись на головну</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const profileData = ref(null);
const isLoading = ref(false);
const errorMessage = ref("");

// Функция форматирования даты (без изменений)
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

onMounted(async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const response = await axios.get("http://localhost:5000/api/users/me");
    profileData.value = response.data;
  } catch (error) {
    console.error("Failed to fetch profile data in ProfileView:", error);
    // Используем сообщение от сервера если есть, иначе общее
    errorMessage.value =
      error.response?.data?.message || "Не вдалося завантажити дані профілю.";
    if (error.response?.status === 401) {
      // Если ошибка авторизации, интерцептор уже должен был сработать,
      // но можно добавить доп. логику или сообщение
      errorMessage.value = "Сесія недійсна. Будь ласка, увійдіть знову.";
    }
    profileData.value = null;
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
/* Стили для страницы профиля */
.profile-page .container {
  max-width: 800px; /* Сделаем контейнер чуть уже для профиля */
}

.profile-page h2 {
  color: #0a192f; /* Темно-синий заголовок из темы */
  text-align: center;
  margin-bottom: 2.5rem;
}

.profile-card {
  background-color: #ffffff; /* Белый фон карточки */
  border-radius: 8px; /* Скругленные углы */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); /* Легкая тень */
  overflow: hidden; /* Чтобы внутренние элементы не вылезали */
  margin-bottom: 2rem; /* Отступ снизу */
}

.profile-header {
  background-color: #112240; /* Темно-синий фон шапки */
  color: #ccd6f6; /* Светлый текст */
  padding: 1.5rem 2rem;
}

.profile-header h3 {
  margin: 0;
  font-size: 1.8rem;
  color: #ffffff; /* Белый текст для имени */
}

.profile-details {
  padding: 2rem; /* Внутренние отступы для деталей */
}

.detail-item {
  display: flex;
  justify-content: space-between; /* Разносим метку и значение */
  padding: 0.8rem 0; /* Вертикальные отступы */
  border-bottom: 1px solid #e9ecef; /* Разделитель */
  font-size: 1rem;
}

.detail-item:last-child {
  border-bottom: none; /* Убираем нижнюю границу у последнего элемента */
}

.detail-label {
  font-weight: 500; /* Полужирный для метки */
  color: #495057; /* Темно-серый цвет метки */
  margin-right: 1rem;
}

.detail-value {
  color: #212529; /* Основной цвет текста для значения */
  text-align: right;
}

.profile-actions {
  background-color: #f8f9fa; /* Очень светлый фон для секции кнопок */
  padding: 1.5rem 2rem;
  text-align: right; /* Кнопки справа */
  border-top: 1px solid #e9ecef;
}

.profile-actions .cta-button {
  margin-left: 1rem; /* Отступ между кнопками */
  padding: 0.6rem 1.2rem; /* Уменьшим кнопки */
  width: auto; /* Автоматическая ширина */
  font-size: 0.9rem;
}

/* Стили для кнопок-заглушек (можно использовать классы из index.css или определить свои) */
.cta-button.secondary {
  background-color: #6c757d; /* Серый */
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

/* Стили для сообщений загрузки/ошибки */
.loading-indicator,
.no-data-message,
.error-message-profile {
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
}
.error-message-profile {
  color: #dc3545; /* Красный */
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
</style>
