<template>
  <div class="content-section">
    <div class="container">
      <h2>Профіль користувача</h2>
      <div v-if="userData">
        <p>
          Вітаємо, <strong>{{ userData.username }}</strong
          >!
        </p>
        <p>Ваш ID: {{ userData.id }}</p>
        <p>Ваш Email: {{ userData.email }}</p>
      </div>
      <div v-else-if="loading">
        <p>Завантаження даних профілю...</p>
      </div>
      <div v-else>
        <p>Не вдалося завантажити дані профілю для ID: {{ id }}.</p>
      </div>
      <router-link to="/">Повернутись на головну</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router"; // Для доступу до параметрів поточного маршруту

// Отримуємо ID з параметрів маршруту як пропс
const props = defineProps({
  id: {
    type: [String, Number], // ID може бути рядком або числом з URL
    required: true,
  },
});

const route = useRoute(); // Використовуємо для доступу до повного об'єкту маршруту, якщо потрібно

const userData = ref(null); // Тут зберігатимемо дані користувача
const loading = ref(false); // Стан завантаження

// Функція для отримання даних користувача (зараз симуляція)
// В реальному додатку тут був би запит на бекенд /api/users/:id
const fetchUserData = async (userId) => {
  loading.value = true;
  console.log(`Симуляція завантаження даних для користувача з ID: ${userId}`);
  // --- СИМУЛЯЦІЯ ---
  // У нашому спрощеному випадку ми не робимо реальний запит,
  // бо ми ще не передали дані з App.vue сюди.
  // Ми могли б передати їх через параметри маршруту або глобальний стан.
  // Зараз просто покажемо ID з URL.
  // АБО, якщо б ми мали глобальний стан, ми б взяли дані звідти.
  // Поки що залишимо userData = null, щоб показати повідомлення.
  // Для демонстрації, можна розкоментувати це:
  /*
  if (userId) { // Перевіряємо, чи є ID
     userData.value = {
        id: userId,
        username: `Користувач_${userId}`, // Тимчасове ім'я
        email: `user${userId}@example.com` // Тимчасовий email
     };
  }
  */
  // --- КІНЕЦЬ СИМУЛЯЦІЇ ---
  await new Promise((resolve) => setTimeout(resolve, 50)); // Маленька затримка для імітації запиту
  loading.value = false;
};

// Викликаємо fetchUserData при монтуванні компонента
onMounted(() => {
  fetchUserData(props.id);
});

// Також відслідковуємо зміни параметра ID, якщо користувач переходить
// з одного профілю на інший (хоча в нашому випадку це малоймовірно)
watch(
  () => props.id,
  (newId) => {
    fetchUserData(newId);
  },
);
</script>

<style scoped>
/* Додай стилі для сторінки профілю, якщо потрібно */
strong {
  color: #0a192f;
}
</style>
