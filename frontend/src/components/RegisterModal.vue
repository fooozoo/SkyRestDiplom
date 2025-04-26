<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <button class="modal-close-button" @click="closeModal">&times;</button>
      <div class="modal-content">
        <h2>Реєстрація нового користувача</h2>
        <p>
          Будь ласка, заповніть форму нижче для створення облікового запису.
        </p>
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label for="reg-username">Ім'я користувача:</label>
            <input type="text" id="reg-username" v-model="username" required />
          </div>
          <div class="form-group">
            <label for="reg-email">Email:</label>
            <input type="email" id="reg-email" v-model="email" required />
          </div>
          <div class="form-group">
            <label for="reg-password">Пароль:</label>
            <input
              type="password"
              id="reg-password"
              v-model="password"
              required
            />
          </div>
          <button type="submit" class="cta-button">Зареєструватися</button>
        </form>
        <p style="margin-top: 1rem; font-size: 0.9em">
          Вже маєте акаунт?
          <a href="#" @click.prevent="switchToLogin">Увійти</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
// Отримуємо пропс 'isOpen' від батьківського компонента
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});
// Визначаємо подію 'close', яку відправляємо батькам
const emit = defineEmits(["close", "registration-success"]);

// Змінні для стану запиту та повідомлень
const isLoading = ref(false); // Чи йде запит?
const errorMessage = ref(""); // Повідомлення про помилку

const username = ref("");
const email = ref("");
const password = ref("");

const closeModal = () => {
  // Скидаємо стан при закритті
  username.value = "";
  email.value = "";
  password.value = "";
  errorMessage.value = "";
  isLoading.value = false;
  emit("close");
};

// Функція реєстрації з відправкою на бекенд
const handleRegister = async () => {
  isLoading.value = true; // Починаємо завантаження
  errorMessage.value = ""; // Скидаємо попередні помилки

  try {
    // Переконайся, що порт 5000 правильний для твого бекенду
    const apiUrl = "http://localhost:5000/api/auth/register"; // Або інший порт
    // Відправляємо POST-запит з даними форми
    const response = await axios.post(apiUrl, {
      username: username.value,
      email: email.value,
      password: password.value,
    });

    // Успішна реєстрація
    console.log("Registration successful, emitting data:", response.data.user);
    // Відправляємо подію батьківському компоненту з даними користувача
    emit("registration-success", response.data.user);
    // Очистимо форму (або закриємо вікно через деякий час)
    username.value = "";
    email.value = "";
    password.value = "";
  } catch (error) {
    console.error("Registration failed:", error);
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message;
    } else if (error.response?.data?.errors) {
      // Скорочений запис
      const firstError = error.response.data.errors[0];
      const errorKey = Object.keys(firstError)[0];
      errorMessage.value = firstError[errorKey];
    } else {
      errorMessage.value = "Не вдалося зареєструватися. Спробуйте пізніше.";
    }
  } finally {
    isLoading.value = false;
  }
};
const switchToLogin = () => {
  closeModal(); // Закриваємо вікно логіну
  emit("open-login"); // Просимо App.vue відкрити вікно реєстрації
};
</script>

<style scoped>
.modal-overlay {
  position: fixed; /* Фіксована позиція відносно вікна браузера */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6); /* Напівпрозорий темний фон */
  display: flex; /* Використовуємо flex для центрування */
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Поверх інших елементів */
}

.modal-container {
  background-color: #ffffff; /* Білий фон для вікна */
  padding: 2rem 2.5rem;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  min-width: 300px; /* Мінімальна ширина */
  max-width: 500px; /* Максимальна ширина */
  width: 90%; /* Ширина відносно батька */
  position: relative; /* Для позиціонування кнопки закриття */
  color: #212529; /* Темний текст всередині модалки */
}

.modal-close-button {
  position: absolute;
  top: 0.75rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.8rem;
  font-weight: bold;
  color: #6c757d;
  cursor: pointer;
  line-height: 1;
}
.modal-close-button:hover {
  color: #343a40;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #0a192f; /* Темно-синій заголовок */
  text-align: center;
}
.modal-content p {
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 0.95em;
  color: #495057;
}

/* Стилі для форми всередині модального вікна */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.3rem;
  font-weight: 500;
  font-size: 0.9em;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"] {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.cta-button {
  /* Можна перевизначити стилі кнопки */
  width: 100%;
  margin-top: 0.5rem;
}

.modal-content a {
  color: #007bff; /* Стандартний синій для посилань */
  text-decoration: underline;
  cursor: pointer;
}
/* Стилі для повідомлень про помилку/успіх */
.error-message {
  color: #dc3545; /* Червоний */
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border-radius: 0.25rem;
  text-align: center;
  font-size: 0.9em !important; /* Зменшимо шрифт і зробимо важливим */
}

.success-message {
  color: #155724; /* Зелений */
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border-radius: 0.25rem;
  text-align: center;
  font-size: 0.9em !important;
}
</style>
