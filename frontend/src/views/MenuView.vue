<template>
  <div class="content-section menu-page">
    <div class="container menu-container">
      <nav class="category-nav">
        <h4>Категорії меню</h4>
        <ul>
          <li v-for="category in categories" :key="category">
            <a
              href="#"
              @click.prevent="scrollToCategory(getCategoryId(category))"
              >{{ category }}</a
            >
          </li>
        </ul>
      </nav>

      <div class="menu-content">
        <h2>Наше Меню</h2>

        <div v-if="isLoading" class="loading-indicator">
          <p>Завантаження меню...</p>
        </div>
        <div v-else-if="error" class="error-message-menu">
          <p>{{ error }}</p>
        </div>

        <div v-else-if="categories.length > 0">
          <div
            v-for="category in categories"
            :key="category"
            class="menu-category"
            :id="getCategoryId(category)"
          >
            <h3>{{ category }}</h3>
            <Carousel
              v-bind="carouselSettings"
              :breakpoints="carouselBreakpoints"
            >
              <Slide v-for="item in groupedMenu[category]" :key="item.id">
                <div class="carousel__item">
                  <div class="menu-item-card">
                    <img
                      :src="item.image_url || defaultDishImage"
                      :alt="item.name"
                      class="item-image"
                    />
                    <div class="item-details">
                      <h4 class="item-name">{{ item.name }}</h4>
                      <p v-if="item.description" class="item-description">
                        {{ item.description }}
                      </p>
                      <p class="item-price">{{ formatPrice(item.price) }}</p>
                      <button
                        @click="handleAddToCart(item)"
                        class="add-to-cart-button"
                      >
                        Додати в кошик
                      </button>
                    </div>
                  </div>
                </div>
              </Slide>
              <template #addons> <Navigation /> <Pagination /> </template>
            </Carousel>
          </div>
        </div>
        <div v-else><p>На жаль, меню зараз порожнє.</p></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from "vue";
import axios from "axios";
import { useCartStore } from "../stores/cart";
import { Carousel, Slide, Pagination, Navigation } from "vue3-carousel";
import "vue3-carousel/dist/carousel.css";
import defaultDishImage from "../assets/default-dish.png"; //Дефолт картинка страви

const cartStore = useCartStore();
const showToast = inject("showToast", (msg, type) =>
  console.warn(`Toast: ${type}-${msg}`),
);

const menuItems = ref([]);
const isLoading = ref(false);
const error = ref(null);

const formatPrice = (price) => {
  const numericPrice = parseFloat(price);
  if (isNaN(numericPrice)) {
    return price;
  }
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
  }).format(numericPrice);
};
const scrollToCategory = (categoryId) => {
  const element = document.getElementById(categoryId);
  if (element) {
    console.log(`Прокрутка до елемента: #${categoryId}`);
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } else {
    console.warn(`Елемент з ID #${categoryId} не знайдено для прокрутки.`);
  }
};
const groupedMenu = computed(() => {
  return menuItems.value.reduce((acc, item) => {
    const category = item.category || "Інше";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});
});

const categories = computed(() => {
  const preferredOrder = [
    "Салати",
    "Перші страви",
    "Паста та різотто",
    "Основні страви",
    "Десерти",
    "Напої",
    "Інше",
  ];
  const availableCategories = Object.keys(groupedMenu.value);
  return preferredOrder
    .filter((cat) => availableCategories.includes(cat))
    .concat(availableCategories.filter((cat) => !preferredOrder.includes(cat)));
});

const fetchMenuItems = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const apiUrl = "http://localhost:5000/api/menu";
    const response = await axios.get(apiUrl);
    menuItems.value = response.data;
    console.log("Menu items fetched:", menuItems.value);
  } catch (err) {
    console.error("Error fetching menu items:", err);
    error.value = "Не вдалося завантажити меню. Спробуйте пізніше.";
  } finally {
    isLoading.value = false;
  }
};
const carouselSettings = ref({
  itemsToShow: 1.5,
  snapAlign: "center",
  wrapAround: false,
});

const carouselBreakpoints = ref({
  700: {
    itemsToShow: 2.5,
    snapAlign: "center",
  },
  1024: {
    itemsToShow: 4,
    snapAlign: "start",
  },
});
const getCategoryId = (categoryName) => {
  return `category-${categoryName.toLowerCase().replace(/\s+/g, "-")}`;
};

const handleAddToCart = (item) => {
  console.log("Add to cart:", item.name);
  cartStore.addItem(item);
  showToast(`"${item.name}" додано до кошика!`, "success", 2500);
};
onMounted(fetchMenuItems);
</script>

<style scoped>
.menu-page .container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 15px;
}

.menu-page h2 {
  color: #0a192f;
  text-align: center;
  margin-bottom: 2.5rem;
}

.menu-category {
  margin-bottom: 3rem;
}

.menu-category h3 {
  color: #112240;
  border-bottom: 2px solid #64ffda;
  padding-bottom: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.carousel__item {
  min-height: 200px;
  width: 100%;
  font-size: 20px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
}

.menu-item-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}
.menu-item-card:hover {
}
.item-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
}
.item-details {
  padding: 1rem;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.item-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: #0a192f;
  margin-top: 0;
  margin-bottom: 0.5rem;
}
.item-description {
  font-size: 0.9rem;
  color: #495057;
  margin-bottom: 1rem;
  flex-grow: 1;
}
.item-price {
  font-size: 1.1rem;
  font-weight: bold;
  color: #007bff;
  margin-top: auto;
  text-align: right;
}

:deep(.carousel__prev),
:deep(.carousel__next) {
  background-color: rgba(10, 25, 47, 0.7);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}
:deep(.carousel__prev):hover,
:deep(.carousel__next):hover {
  background-color: rgba(10, 25, 47, 0.9);
}

:deep(.carousel__prev) {
  left: -20px;
}

:deep(.carousel__next) {
  right: -20px;
}

:deep(.carousel__icon) {
  fill: #64ffda;
  width: 18px;
  height: 18px;
}

.loading-indicator,
.error-message-menu {
  text-align: center;
  padding: 3rem 1rem;
  color: #6c757d;
}
.error-message-menu {
  color: #dc3545;
  font-weight: bold;
}
.add-to-cart-button {
  background-color: #0a192f;
  color: #64ffda;
  border: 1px solid #64ffda;
  padding: 0.5rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.9rem;
  text-align: center;
  margin-top: 0.75rem;
  width: 100%;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.add-to-cart-button:hover {
  background-color: #64ffda;
  color: #0a192f;
}
.menu-container {
  max-width: 1400px;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.category-nav {
  width: 200px;
  flex-shrink: 0;
  position: sticky;
  top: 20px;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 5px;
  border: 1px solid #eee;
}

.category-nav h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: #0a192f;
  font-size: 1.1rem;
  text-align: center;
  border-bottom: 1px solid #ddd;
  padding-bottom: 0.5rem;
}

.category-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.category-nav li {
  margin-bottom: 0.5rem;
}

.category-nav a {
  display: block;
  padding: 0.4rem 0.8rem;
  color: #343a40;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.95rem;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.category-nav a:hover {
  background-color: #e9ecef;
  color: #0056b3;
}

.menu-content {
  flex-grow: 1;
}

.menu-category::before {
  content: "";
  display: block;
  height: 80px;
  margin-top: -80px;
  visibility: hidden;
  pointer-events: none;
}
</style>
