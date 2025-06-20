// src/stores/cart.js
import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useCartStore = defineStore("cart", () => {
  const items = ref([]);

  // Обчислювана властивість для отримання загальної кількості товарів
  const itemCount = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0);
  });

  const cartTotal = computed(() => {
    return items.value.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  });
  const formattedCartTotal = computed(() => {
    const total = cartTotal.value;
    return new Intl.NumberFormat("uk-UA", {
      style: "currency",
      currency: "UAH",
    }).format(total);
  });

  function addItem(newItemData) {
    // Пошук, чи такий товар вже є в кошику
    const existingItem = items.value.find((item) => item.id === newItemData.id);

    if (existingItem) {
      existingItem.quantity++;
      console.log(`Cart: Increased quantity for item ${newItemData.id}`);
    } else {
      items.value.push({
        id: newItemData.id,
        name: newItemData.name,
        price: newItemData.price,
        quantity: 1,
        imageUrl: newItemData.image_url || null,
      });
      console.log(`Cart: Added new item ${newItemData.id}`);
    }
  }

  function removeItem(itemId) {
    console.log(`Cart: Removing item ${itemId}`);
    items.value = items.value.filter((item) => item.id !== itemId);
    // TODO: Оновити localStorage
  }

  function updateQuantity(itemId, newQuantity) {
    const item = items.value.find((item) => item.id === itemId);
    if (item) {
      const quantity = parseInt(newQuantity, 10);
      if (!isNaN(quantity) && quantity > 0) {
        item.quantity = quantity;
        console.log(`Cart: Updated quantity for item ${itemId} to ${quantity}`);
      } else {
        removeItem(itemId);
      }
    }
  }
  function incrementQuantity(itemId) {
    const item = items.value.find((item) => item.id === itemId);
    if (item) {
      item.quantity++;
      console.log(
        `Cart: Incremented quantity for item ${itemId} to ${item.quantity}`,
      );
    }
  }

  function decrementQuantity(itemId) {
    const item = items.value.find((item) => item.id === itemId);
    if (item) {
      if (item.quantity > 1) {
        item.quantity--;
        console.log(
          `Cart: Decremented quantity for item ${itemId} to ${item.quantity}`,
        );
      } else {
        removeItem(itemId);
      }
    }
  }

  function clearCart() {
    console.log("Cart: Clearing all items");
    items.value = [];
    // TODO: Оновити localStorage
  }

  return {
    items,
    itemCount,
    cartTotal,
    formattedCartTotal,
    addItem,
    removeItem,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    clearCart,
  };
});
