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
  // ---> ИЗМЕНИ const НА let ЗДЕСЬ <---
  let isAuthenticated = !!localStorage.getItem("authToken"); // Используем let вместо const

  let loggedInUserId = null;
  const storedUser = localStorage.getItem("currentUser");

  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser);
      loggedInUserId = parsedUser?.id;
      if (!loggedInUserId) {
        // Если ID не найден после парсинга
        throw new Error("Parsed user data lacks ID");
      }
    } catch (e) {
      console.error("Failed to parse user data or ID missing:", e);
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      isAuthenticated = false; // Теперь это присваивание корректно
    }
  } else if (isAuthenticated) {
    // Если есть токен, но нет данных пользователя - неконсистентное состояние
    console.warn(
      "Auth token found but user data missing in localStorage. Clearing token.",
    );
    localStorage.removeItem("authToken");
    isAuthenticated = false; // Теперь это присваивание корректно
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !isAuthenticated) {
    // Случай 1: Маршрут требует входа, но пользователь НЕ залогинен (нет токена или данные повреждены)
    console.log(
      "Navigation Guard: User not authenticated, redirecting to Home",
    );
    next({ name: "Home" }); // Перенаправляем на главную
  } else if (requiresAuth && isAuthenticated && to.name === "Profile") {
    // Случай 2: Маршрут требует входа, пользователь залогинен, И это маршрут 'Profile'
    const requestedProfileId = to.params.id; // ID профиля из URL

    if (
      loggedInUserId &&
      requestedProfileId &&
      loggedInUserId.toString() === requestedProfileId.toString()
    ) {
      // ID залогиненного пользователя совпадает с ID в URL - разрешаем доступ
      next();
    } else {
      // ID не совпадают ИЛИ не удалось получить ID залогиненного пользователя - запрещаем доступ к чужому профилю
      console.log(
        `Navigation Guard: User ${loggedInUserId} forbidden to access profile ${requestedProfileId}. Redirecting.`,
      );
      // Перенаправляем пользователя на ЕГО СОБСТВЕННЫЙ профиль (если ID известен) или на главную
      if (loggedInUserId) {
        next({ name: "Profile", params: { id: loggedInUserId } });
      } else {
        next({ name: "Home" }); // Если что-то пошло не так с ID залогиненного юзера
      }
    }
  } else {
    // Случай 3: Маршрут не требует входа ИЛИ требует, и пользователь залогинен (но это не /profile/:id)
    // Просто разрешаем навигацию
    next();
  }
});
// ---> КОНЕЦ ОБНОВЛЕНИЯ ОХРАННИКА <---

export default router;
