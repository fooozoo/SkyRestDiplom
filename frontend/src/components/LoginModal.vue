<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-container">
      <button class="modal-close-button" @click="closeModal">&times;</button>
      <div class="modal-content">
        <h2>Вхід до системи</h2>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label for="login-username">Ім'я користувача:</label>
            <input
              type="text"
              id="login-username"
              v-model="username"
              required
              :disabled="isLoading"
            />
          </div>
          <div class="form-group">
            <label for="login-password">Пароль:</label>
            <input
              type="password"
              id="login-password"
              v-model="password"
              required
              :disabled="isLoading"
            />
          </div>
          <button type="submit" class="cta-button" :disabled="isLoading">
            {{ isLoading ? "Вхід..." : "Увійти" }}
          </button>
        </form>
        <p style="margin-top: 1rem; font-size: 0.9em">
          Немає акаунту?
          <a href="#" @click.prevent="switchToRegister">Зареєструватися</a>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";

const props = defineProps({ isOpen: { type: Boolean, required: true } });
const emit = defineEmits(["close", "login-success", "open-register"]);

const username = ref("");
const password = ref("");
const isLoading = ref(false);
const errorMessage = ref("");

const closeModal = () => {
  username.value = "";
  password.value = "";
  errorMessage.value = "";
  isLoading.value = false;
  emit("close");
};

const handleLogin = async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const apiUrl = `${import.meta.env.VITE_API_URL}/api/auth/login`;
    const response = await axios.post(apiUrl, {
      username: username.value,
      password: password.value,
    });

    console.log("Login successful:", response.data);
    // Відправляємо подію про успішний вхід разом з токеном та даними користувача
    emit("login-success", {
      token: response.data.token,
      user: response.data.user,
    });
    closeModal();
  } catch (error) {
    console.error("Login failed:", error);
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message;
    } else if (error.response?.data?.errors) {
      const firstError = error.response.data.errors[0];
      const errorKey = Object.keys(firstError)[0];
      errorMessage.value = firstError[errorKey];
    } else {
      errorMessage.value =
        "Не вдалося увійти. Перевірте дані або спробуйте пізніше.";
    }
  } finally {
    isLoading.value = false;
  }
};

// Функція для переключення на вікно реєстрації
const switchToRegister = () => {
  closeModal();
  emit("open-register");
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-container {
  background-color: #fff;
  padding: 2rem 2.5rem;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  min-width: 300px;
  max-width: 500px;
  width: 90%;
  position: relative;
  color: #212529;
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
  color: #0a192f;
  text-align: center;
}
.modal-content p {
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 0.95em;
  color: #495057;
}
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
  width: 100%;
  margin-top: 0.5rem;
  padding: 0.8rem 1.8rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
  background-color: #64ffda;
  color: #0a192f;
  border: none;
  border-radius: 4px;
}
.cta-button:hover {
  background-color: #52d8c1;
}
.cta-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.modal-content a {
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
}
.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border-radius: 0.25rem;
  text-align: center;
  font-size: 0.9em !important;
}
</style>
