<template>
  <header class="header">
    <div class="logo">
      <img src="./assets/header-logo.png" alt="Restaurant Logo" />
      <h1>SkyRest</h1>
    </div>
    <nav class="nav">
      <button class="nav-button">Меню</button>
      <button class="nav-button">Контакты</button>
      <button class="nav-button">О нас</button>
    </nav>

    <div class="auth">
      <button class="auth-button">Вход</button>
      <button class="auth-button">Регистрация</button>
    </div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #2c3e50;
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.logo {
  display: flex;
  align-items: center;
}

.logo img {
  height: 40px;
  margin-right: 10px;
}

.logo h1 {
  font-size: 1.5rem;
  margin: 0;
  color: #2cdede;
}

.nav {
  display: flex;
  gap: 15px;
}

.nav-button {
  background: none;
  border: none;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: color 0.3s;
}

.nav-button:hover {
  color: #42b883;
}

.auth {
  display: flex;
  gap: 10px;
}

.auth-button {
  padding: 5px 10px;
  border: 1px solid #42b883;
  background-color: #42b883;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 5px;
  transition:
    background-color 0.3s,
    border-color 0.3s;
}

.auth-button:hover {
  background-color: transparent;
  border-color: white;
}
</style>
