import { createRouter, createWebHistory } from "vue-router";

// Імпортуємо компоненти сторінок (View)
import HomeView from "../views/HomePage.vue";
import ProfileView from "../views/ProfileView.vue";
// Додай імпорти для інших сторінок тут (напр., MenuView, LoginView...)

// Визначаємо маршрути
const routes = [
  {
    path: "/", // Шлях URL для головної сторінки
    name: "Home", // Ім'я маршруту (необов'язково, але корисно)
    component: HomeView, // Компонент, що відображається
  },
  {
    path: "/profile/:id",
    name: "Profile",
    component: ProfileView,
    props: true,
    meta: { requiresAuth: true },
  },
  // Додай інші маршрути тут
  // {
  //   path: '/menu',
  //   name: 'Menu',
  //   component: () => import('../views/MenuView.vue') // Приклад ледачого завантаження (lazy loading)
  // },
];
// Створюємо екземпляр маршрутизатора
const router = createRouter({
  // Використовуємо режим історії HTML5 (чисті URL без #)
  // Потребує налаштування сервера для правильної роботи при оновленні сторінки
  history: createWebHistory(import.meta.env.BASE_URL),
  routes, // Масив маршрутів, визначених вище
  // Опціонально: Прокрутка до верху при переході
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

router.beforeEach((to, from, next) => {
  let isAuthenticated = !!localStorage.getItem("authToken");
  let loggedInUser = null;
  const storedUser = localStorage.getItem("currentUser");

  if (storedUser) {
    try {
      loggedInUser = JSON.parse(storedUser);
      if (!loggedInUser?.id) {
        // Перевіряємо тільки ID
        throw new Error("Parsed user data lacks ID");
      }
    } catch (e) {
      /* ... (обробка помилки парсингу, без змін) ... */
    }
  } else if (isAuthenticated) {
    /* ... (обробка відсутності currentUser, без змін) ... */
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !isAuthenticated) {
    next({ name: "Home" });
  } else if (requiresAuth && isAuthenticated && to.name === "Profile") {
    // ---> ЗМІНИ ТУТ: Порівнюємо ID <---
    const requestedProfileId = to.params.id; // Параметр тепер :id
    const loggedInUserId = loggedInUser?.id; // ID залогіненого користувача

    // Порівнюємо ID (приводимо до рядка для надійності)
    if (
      loggedInUserId &&
      requestedProfileId &&
      loggedInUserId.toString() === requestedProfileId.toString()
    ) {
      // ID співпадають - дозволяємо
      next();
    } else {
      // ID не співпадають або щось пішло не так
      console.log(
        `Navigation Guard: User ${loggedInUserId} forbidden to access profile ${requestedProfileId}. Redirecting.`,
      );
      // Перенаправляємо на власний профіль (використовуючи ID) або на головну
      if (loggedInUserId) {
        next({ name: "Profile", params: { id: loggedInUserId } }); // <-- Повертаємо ID
      } else {
        next({ name: "Home" });
      }
    }
    // ---> КІНЕЦЬ ЗМІН <---
  } else {
    next();
  }
});
// ---> КОНЕЦ ОБНОВЛЕНИЯ ОХРАННИКА <---

export default router;
