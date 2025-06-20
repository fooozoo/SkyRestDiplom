import { createRouter, createWebHistory } from "vue-router";

import HomeView from "../views/HomePage.vue";
import ProfileView from "../views/ProfileView.vue";
import MenuView from "../views/MenuView.vue";
import AdminView from "../views/AdminView.vue";
import ReservationView from "../views/ReservationView.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: HomeView,
  },
  {
    path: "/profile/:id",
    name: "Profile",
    component: ProfileView,
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: "/menu",
    name: "Menu",
    component: MenuView,
  },
  {
    path: "/admin",
    name: "Admin",
    component: AdminView,
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/reservations",
    name: "Reservations",
    component: ReservationView,
    meta: { requiresAuth: true },
  },
];
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
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
        throw new Error("Parsed user data lacks ID");
      }
    } catch (e) {}
  } else if (isAuthenticated) {
  }

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin);

  if (requiresAuth && !isAuthenticated) {
    console.log("[Guard] Auth required, not authenticated. Redirecting Home.");
    next({ name: "Home" });
  } else if (
    requiresAdmin &&
    (!isAuthenticated || loggedInUser?.role !== "admin")
  ) {
    console.log(
      `[Guard] Admin required. User role: ${loggedInUser?.role}. Redirecting Home.`,
    );
    next({ name: "Home" });
  } else if (isAuthenticated && to.name === "Profile") {
    const requestedProfileId = to.params.id;
    const loggedInUserId = loggedInUser?.id;
    if (
      loggedInUserId &&
      requestedProfileId &&
      loggedInUserId.toString() === requestedProfileId.toString()
    ) {
      next();
    } else {
      console.log(
        `[Guard] Forbidden to access profile ${requestedProfileId}. Redirecting.`,
      );
      if (loggedInUserId) {
        next({ name: "Profile", params: { id: loggedInUserId } });
      } else {
        next({ name: "Home" });
      }
    }
  } else {
    next();
  }
});

export default router;
