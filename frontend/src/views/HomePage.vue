<template>
  <div>
    <section class="hero-section">
      <div class="container">
        <h1>Добро пожаловать в SkyRest</h1>
        <p>Насладитесь изысканной кухней с панорамным видом на город.</p>
        <a href="/reservations" class="cta-button">Забронировать столик</a>
      </div>
    </section>

    <section class="content-section">
      <div class="container">
        <h2>О Ресторане</h2>
        <p>
          SkyRest - это уникальное место, где высокая кухня встречается с
          захватывающими видами. Мы предлагаем...
        </p>
      </div>
    </section>
    <section class="content-section" style="background-color: #e9ecef">
      <div class="container">
        <h2>Популярные блюда</h2>
        <p>
          Здесь будут карточки с изображениями и описаниями нескольких блюд...
        </p>
        <div style="text-align: center; margin-top: 2rem">
          <a
            href="/menu"
            class="cta-button"
            style="background-color: #0a192f; color: #64ffda"
            >Смотреть все меню</a
          >
        </div>
      </div>
    </section>
    <section class="content-section">
      <div class="container">
        <h2>Свяжитесь с нами</h2>
        <p>
          Забронируйте столик онлайн или позвоните нам. Мы находимся по
          адресу...
        </p>
        <div style="text-align: center; margin-top: 2rem">
          <a href="/reservations" class="cta-button">Резервация онлайн</a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// Логика для главной страницы (если нужна)
// Например, загрузка популярных блюд
</script>

<style scoped>
/* Стили, специфичные только для HomeView (если нужны) */
h1,
h2 {
  /* Пример локального стиля, если хочешь переопределить index.css */
  /* color: navy; */
}
</style>
