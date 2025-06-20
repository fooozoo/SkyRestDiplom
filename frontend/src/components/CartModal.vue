<template>
  <transition name="modal-fade">
    <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-container cart-modal">
        <button class="modal-close-button" @click="closeModal">&times;</button>
        <div class="modal-content">
          <h2>Ваш Кошик</h2>
          <div v-if="!isLoggedIn" class="login-prompt error-message">
            <p>
              Будь ласка,
              <button class="inline-link-button" @click="switchToLogin">
                увійдіть
              </button>
              або
              <button class="inline-link-button" @click="switchToRegister">
                зареєструйтесь</button
              >, щоб оформити замовлення.
            </p>
          </div>
          <div v-if="cartStore.itemCount === 0" class="empty-cart-message">
            <p>Ваш кошик порожній.</p>
            <button @click="closeModal" class="cta-button secondary">
              Обрати страви
            </button>
          </div>
          <div v-else class="cart-items-list">
            <div
              v-for="item in cartStore.items"
              :key="item.id"
              class="cart-item"
            >
              <img
                :src="item.imageUrl || defaultDishImage"
                :alt="item.name"
                class="cart-item-image"
              />
              <div class="cart-item-details">
                <span class="cart-item-name">{{ item.name }}</span>
                <span class="cart-item-price">{{
                  formatPrice(item.price)
                }}</span>
              </div>
              <div class="cart-item-quantity">
                <button
                  @click="cartStore.decrementQuantity(item.id)"
                  class="quantity-btn"
                >
                  -
                </button>
                <span class="quantity-value">{{ item.quantity }}</span>
                <button
                  @click="cartStore.incrementQuantity(item.id)"
                  class="quantity-btn"
                >
                  +
                </button>
              </div>
              <div class="cart-item-subtotal">
                {{ formatPrice(item.price * item.quantity) }}
              </div>
              <button
                @click="cartStore.removeItem(item.id)"
                class="cart-item-remove"
              >
                &times;
              </button>
            </div>

            <div class="cart-total">
              <strong>Всього:</strong>
              <strong>{{ cartStore.formattedCartTotal }}</strong>
            </div>

            <div class="delivery-address-form">
              <h3>Адреса доставки</h3>
              <p
                v-if="addressError"
                class="error-message"
                style="margin-bottom: 1rem"
              >
                {{ addressError }}
              </p>

              <div class="address-grid">
                <div class="form-group">
                  <label for="addr-street">Вулиця: <span>*</span></label>
                  <input
                    type="text"
                    id="addr-street"
                    v-model.trim="deliveryAddress.street"
                    required
                    :disabled="!isLoggedIn"
                  />
                </div>
                <div class="form-group">
                  <label for="addr-house">Будинок: <span>*</span></label>
                  <input
                    type="text"
                    id="addr-house"
                    v-model.trim="deliveryAddress.house"
                    required
                    :disabled="!isLoggedIn"
                  />
                </div>
                <div class="form-group">
                  <label for="addr-apartment">Квартира:</label>
                  <input
                    type="text"
                    id="addr-apartment"
                    v-model.trim="deliveryAddress.apartment"
                    :disabled="!isLoggedIn"
                  />
                </div>
                <div class="form-group">
                  <label for="addr-entrance">Під'їзд:</label>
                  <input
                    type="text"
                    id="addr-entrance"
                    v-model.trim="deliveryAddress.entrance"
                    :disabled="!isLoggedIn"
                  />
                </div>
                <div class="form-group">
                  <label for="addr-floor">Поверх:</label>
                  <input
                    type="text"
                    id="addr-floor"
                    v-model.trim="deliveryAddress.floor"
                    :disabled="!isLoggedIn"
                  />
                </div>
                <div class="form-group address-comment">
                  <label for="addr-comment">Коментар:</label>
                  <textarea
                    id="addr-comment"
                    v-model.trim="deliveryAddress.comment"
                    rows="2"
                    :disabled="!isLoggedIn"
                    placeholder="Напр., код домофону, побажання кур'єру..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
          <div class="cart-actions">
            <button @click="closeModal" class="cta-button secondary">
              {{
                cartStore.itemCount === 0
                  ? "Обрати страви"
                  : "Продовжити покупки"
              }}
            </button>
            <button
              @click="placeOrder"
              class="cta-button"
              style="margin-left: 1rem"
              :disabled="
                cartStore.itemCount === 0 || !isLoggedIn || isPlacingOrder
              "
            >
              Зробити замовлення
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, reactive, inject } from "vue";
import { useCartStore } from "../stores/cart";
import defaultDishImage from "../assets/default-dish.png";
import axios from "axios";

const isLoggedIn = inject("isLoggedIn", ref(false)); // Отримуємо стан логіну
const showToast = inject("showToast", (msg, type) =>
  console.warn(`Toast: ${type}-${msg}`),
);
// Функція для відкриття модалки логіну
const openLoginModal = inject("openLoginModal", () =>
  console.warn("openLoginModal not provided"),
);
const openRegisterModal = inject("openRegisterModal", () =>
  console.warn("openRegisterModal not provided"),
);

defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
});
const emit = defineEmits(["close", "open-register", "open-login"]);

const cartStore = useCartStore();
const isPlacingOrder = ref(false);
const addressError = ref("");

const deliveryAddress = reactive({
  street: "",
  house: "",
  apartment: "",
  entrance: "",
  floor: "",
  comment: "",
});

// Функція для форматування ціни
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
const closeModal = () => {
  emit("close");
};
// Функція для переключення на вікна входу/реєстрації
const switchToLogin = () => {
  closeModal();
  if (openLoginModal) openLoginModal();
};
const switchToRegister = () => {
  closeModal();
  if (openRegisterModal) openRegisterModal();
};

const placeOrder = async () => {
  // 1. Перевірка чи користувач залогінений
  if (!isLoggedIn.value) {
    showToast(
      "Будь ласка, увійдіть або зареєструйтесь, щоб оформити замовлення.",
      "error",
    );
    return;
  }
  // 2. Перевірка чи кошик не порожній
  if (cartStore.itemCount === 0) {
    showToast("Ваш кошик порожній.", "error");
    return;
  }

  // 3. Валідація адреси
  addressError.value = "";
  if (!deliveryAddress.street || !deliveryAddress.house) {
    addressError.value = "Будь ласка, вкажіть вулицю та номер будинку.";
    showToast("Будь ласка, вкажіть вулицю та номер будинку.", "error");
    return;
  }
  // 4. Підготовка даних для відправки
  isPlacingOrder.value = true;
  const orderPayload = {
    // Відправляємо тільки ID, кількість та ціну на момент додавання
    items: cartStore.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      priceAtOrder: item.price,
    })),
    totalPrice: cartStore.cartTotal, // Загальна сума з геттера
    deliveryAddress: { ...deliveryAddress },
    customerComment: deliveryAddress.comment,
  };

  console.log(
    "Attempting to place order with payload:",
    JSON.stringify(orderPayload),
  );

  // 5. Відправка запиту на бекенд
  try {
    const apiUrl = "http://localhost:5000/api/orders";
    const response = await axios.post(apiUrl, orderPayload);

    console.log("Order placed successfully:", response.data);
    showToast(
      response.data.message || "Замовлення успішно оформлено!",
      "success",
    );

    // 6. Очищення кошика та закриття вікна
    cartStore.clearCart();
    deliveryAddress.street = "";
    deliveryAddress.house = "";
    deliveryAddress.apartment = "";
    deliveryAddress.entrance = "";
    deliveryAddress.floor = "";
    deliveryAddress.comment = "";
    closeModal();
  } catch (error) {
    console.error("Error placing order:", error);
    const errorMsg =
      error.response?.data?.message || "Помилка оформлення замовлення.";
    showToast(errorMsg, "error", 5000);
  } finally {
    isPlacingOrder.value = false;
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.modal-container {
  background-color: #fff;
  padding: 1.5rem 2rem;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  max-width: 450px;
  width: 90%;
  position: relative;
  color: #212529;
}

.modal-close-button {
  position: absolute;
  top: 0.75rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.8rem;
  font-weight: bold;
  color: #6c757d;
  cursor: pointer;
  line-height: 1;
}
.modal-close-button:hover {
  color: #343a40;
}

.modal-content {
  padding-top: 1rem;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.cta-button {
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
  font-weight: 500;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
  background-color: #64ffda;
  color: #0a192f;
}
.cta-button.secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}
.cta-button:disabled {
  background-color: #ccc;
  border-color: #ccc;
  cursor: not-allowed;
}
.empty-cart-message {
  text-align: center;
  padding: 2rem 0;
  color: #6c757d;
}
.empty-cart-message p {
  margin-bottom: 1.5rem;
}

.cart-items-list {
  margin-top: 1.5rem;
  max-height: 40vh;
  overflow-y: auto;
  padding-right: 5px;
}

.cart-item {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}
.cart-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.cart-item-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 1rem;
}

.cart-item-details {
  flex-grow: 1;
  margin-right: 1rem;
}

.cart-item-name {
  font-weight: 500;
  display: block;
}

.cart-item-price {
  font-size: 0.9em;
  color: #6c757d;
  display: block;
}

.cart-item-quantity {
  display: flex;
  align-items: center;
  margin-right: 1rem;
}

.quantity-btn {
  background-color: #e9ecef;
  border: 1px solid #ced4da;
  color: #495057;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.quantity-btn:hover {
  background-color: #dee2e6;
}

.quantity-value {
  min-width: 30px;
  text-align: center;
  font-weight: 500;
  padding: 0 0.5rem;
}

.cart-item-subtotal {
  min-width: 80px;
  text-align: right;
  font-weight: 500;
  margin-right: 1rem;
}

.cart-item-remove {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 1.4rem;
  font-weight: bold;
  cursor: pointer;
  padding: 0 5px;
  line-height: 1;
}
.cart-item-remove:hover {
  color: #a71d2a;
}

.cart-total {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 2px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  font-size: 1.2rem;
  font-weight: bold;
}

.delivery-address-form {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px dashed #ccc;
}
.delivery-address-form h3 {
  margin-bottom: 1rem;
  text-align: center;
  font-size: 1.2rem;
}

.cart-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.login-prompt {
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 0.95em;
  padding: 0.75rem;
}
.inline-link-button {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  color: #0056b3;
  text-decoration: underline;
  cursor: pointer;
  font-size: inherit;
}
.inline-link-button:hover {
  color: #003d80;
}

.delivery-address-form {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}
.address-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}
.address-comment {
  grid-column: 1 / -1;
}
.form-group span {
  color: #dc3545;
  margin-left: 2px;
}
.form-group textarea {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
  resize: vertical;
  min-height: 50px;
}
.form-group textarea:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.cart-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}
</style>
