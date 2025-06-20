<template>
  <footer class="footer">
    <div class="container">
      <p>&copy; {{ currentYear }} SkyRest. Всі права захищені .</p>
      <p>Адрес: г. Обухів, вул. Київська, 1 | Телефон: +123 456 7890</p>
      <p>
        Розроблено
        <a href="https://vuejs.org/" target="_blank" rel="noopener noreferrer"
          >Vue.js</a
        >
      </p>
    </div>
  </footer>
</template>

<script setup>
import { ref } from "vue";

const currentYear = ref(new Date().getFullYear());
</script>

<style scoped></style>
