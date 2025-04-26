<template>
  <footer class="footer">
    <div class="container">
      <p>&copy; {{ currentYear }} SkyRest. Все права защищены.</p>
      <p>Адрес: г. Город, ул. Небесная, 1 | Телефон: +123 456 7890</p>
      <p>
        Разработано с
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

<style scoped>
/* Стили только для Footer (если нужны) */
</style>
