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
  // Перевіряємо, чи є токен в localStorage (наш спрощений спосіб перевірки "залогіненості")
  const isAuthenticated = !!localStorage.getItem("authToken"); // !! перетворює значення на boolean

  // Перевіряємо, чи маршрут, на який йде перехід (`to`), потребує автентифікації
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    // Якщо маршрут потребує входу, А користувач НЕ залогінений
    if (!isAuthenticated) {
      // Перенаправляємо на головну сторінку
      console.log(
        "Navigation Guard: User not authenticated, redirecting to Home",
      );
      next({ name: "Home" }); // Або на сторінку логіну, якби вона була окремим маршрутом: next({ name: 'Login' })
    } else {
      // Якщо маршрут потребує входу, І користувач залогінений - дозволяємо перехід
      next();
    }
  } else {
    // Якщо маршрут НЕ потребує входу - завжди дозволяємо перехід
    next();
  }
});
export default router; // Експортуємо маршрутизатор для використання у main.js
