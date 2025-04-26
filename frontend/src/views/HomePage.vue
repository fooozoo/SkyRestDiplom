<template>
  <div>
    <section class="hero-section">
      <div class="container">
        <h1>Ласкаво просимо до SkyRest</h1>
        <p>Насолоджуйтесь вишуканою кухнею з панорамним видом на місто.</p>
        <router-link to="/reservations" class="cta-button"
          >Забронювати столик</router-link
        >
      </div>
    </section>

    <section class="content-section">
      <div class="container">
        <h2>Про Ресторан</h2>
        <p>
          SkyRest - це унікальне місце, де висока кухня зустрічається із
          захоплюючими краєвидами. Ми пропонуємо...
        </p>
      </div>
    </section>

    <section class="content-section" style="background-color: #e9ecef">
      <div class="container">
        <h2>Популярні страви</h2>
        <p>Тут будуть картки із зображеннями та описами декількох страв...</p>
        <div style="text-align: center; margin-top: 2rem">
          <router-link
            to="/menu"
            class="cta-button"
            style="background-color: #0a192f; color: #64ffda"
            >Дивитися все меню</router-link
          >
        </div>
      </div>
    </section>

    <section class="content-section">
      <div class="container">
        <h2>Зв'яжіться з нами</h2>
        <p>
          Забронюйте столик онлайн або зателефонуйте нам. Ми знаходимося за
          адресою...
        </p>
        <div style="text-align: center; margin-top: 2rem">
          <router-link to="/reservations" class="cta-button"
            >Резервація онлайн</router-link
          >
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// Скриптова частина залишається без змін
</script>

<style scoped>
/* Стилі залишаються без змін */
</style>
