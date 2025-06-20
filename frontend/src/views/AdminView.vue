<template>
  <div class="content-section admin-page">
    <div class="container">
      <h1>Адмін Панель</h1>

      <div class="admin-sections">
        <section>
          <h2>Керування Меню</h2>
          <div class="add-menu-item-form">
            <h3>{{ editItemId ? "Редагувати блюдо" : "Додати нове блюдо" }}</h3>

            <p v-if="formError" class="error-message">{{ formError }}</p>

            <form @submit.prevent="handleSubmitItem">
              <div class="form-grid">
                <div class="form-group">
                  <label for="item-name">Назва: <span>*</span></label>
                  <input
                    type="text"
                    id="item-name"
                    v-model="newItem.name"
                    required
                  />
                </div>
                <div class="form-group">
                  <label for="item-price">Ціна (грн): <span>*</span></label>
                  <input
                    type="number"
                    id="item-price"
                    v-model.number="newItem.price"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div class="form-group">
                  <label for="item-category">Категорія: <span>*</span></label>
                  <select
                    id="item-category"
                    v-model="newItem.category"
                    required
                  >
                    <option value="" disabled>-- Оберіть категорію --</option>
                    <option
                      v-for="cat in availableCategories"
                      :key="cat"
                      :value="cat"
                    >
                      {{ cat }}
                    </option>
                  </select>
                </div>
                <div class="form-group form-group-full">
                  <label for="item-description">Опис:</label>
                  <textarea
                    id="item-description"
                    v-model="newItem.description"
                    rows="3"
                  ></textarea>
                </div>
                <div class="form-group form-group-full">
                  <label for="item-image"
                    >Зображення
                    {{
                      editItemId ? "(залиште порожнім, щоб не змінювати)" : ""
                    }}:</label
                  >
                  <input
                    type="file"
                    id="item-image"
                    @change="handleImageSelect"
                    accept="image/*"
                  />
                  <div v-if="newItem.imagePreview" class="image-preview">
                    <img
                      :src="newItem.imagePreview"
                      alt="Прев'ю/поточне зображення"
                    />
                  </div>
                </div>
              </div>
              <div class="form-actions">
                <button
                  type="submit"
                  class="cta-button"
                  :disabled="isSubmittingForm"
                >
                  {{
                    isSubmittingForm
                      ? editItemId
                        ? "Оновлення..."
                        : "Додавання..."
                      : editItemId
                        ? "Оновити блюдо"
                        : "Додати блюдо"
                  }}
                </button>
                <button
                  type="button"
                  v-if="editItemId"
                  @click="cancelEdit"
                  class="cta-button secondary"
                  :disabled="isSubmittingForm"
                >
                  Скасувати редагування
                </button>
              </div>
            </form>
          </div>
          <hr style="margin: 2rem 0" />

          <h3>Існуючі страви</h3>

          <div v-if="isLoadingItems" class="loading-indicator">
            <p>Завантаження списку страв...</p>
          </div>
          <div v-else-if="loadItemsError" class="error-message">
            <p>{{ loadItemsError }}</p>
          </div>
          <table v-else-if="existingItems.length > 0" class="items-table">
            <thead>
              <tr>
                <th>Зображення</th>
                <th>Назва</th>
                <th>Категорія</th>
                <th>Ціна</th>
                <th>Статус</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in existingItems" :key="item.id">
                <td>
                  <img
                    :src="item.image_url || defaultDishImage"
                    :alt="item.name"
                    class="table-item-image"
                  />
                </td>
                <td>{{ item.name }}</td>
                <td>{{ item.category }}</td>
                <td>{{ formatPrice(item.price) }}</td>
                <td>Статус...</td>
                <td>
                  <button
                    @click="startEditingItem(item)"
                    class="action-button edit-button"
                  >
                    Редагувати
                  </button>
                  <button
                    @click="handleDeleteItem(item.id, item.name)"
                    class="action-button delete-button"
                  >
                    Видалити
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else>В меню ще немає жодної страви. Додайте першу!</p>
        </section>
      </div>
    </div>
    <ConfirmModal
      :isOpen="showConfirmModal"
      :title="'Підтвердити видалення'"
      :message="`Ви впевнені, що хочете видалити страву '${itemToDelete?.name || ''}'? `"
      @confirm="confirmDeletion"
      @cancel="cancelDeletion"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, inject, computed } from "vue";
import axios from "axios";
import ConfirmModal from "../components/ConfirmModal.vue";

const showToast = inject("showToast", (message, type) => {
  console.warn(`Toast injection failed. Message: ${message}, Type: ${type}`);
});

const availableCategories = ref([
  "Салати",
  "Перші страви",
  "Основні страви",
  "Паста та різотто",
  "Гарніри",
  "Десерти",
  "Напої",
  "Інше",
]);
const newItem = reactive({
  name: "",
  description: "",
  price: null,
  category: "",
  imageFile: null,
  imagePreview: null,
  currentImageUrl: null,
});

const editItemId = ref(null);
const existingItems = ref([]); // Масив для існуючих страв
const isLoadingItems = ref(false); // Завантаження списку
const loadItemsError = ref(""); // Помилка завантаження списку
const isSubmittingForm = ref(false);
const itemToDelete = ref(null);
const formError = ref("");
const formSuccess = ref("");
const showConfirmModal = ref(false);

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

const fetchExistingItems = async () => {
  isLoadingItems.value = true;
  loadItemsError.value = "";
  try {
    const response = await axios.get("http://localhost:5000/api/menu");
    existingItems.value = response.data;
    console.log("Existing menu items fetched:", existingItems.value.length);
  } catch (error) {
    console.error("Error fetching existing menu items:", error);
    loadItemsError.value = "Не вдалося завантажити список страв.";
  } finally {
    isLoadingItems.value = false;
  }
};

const handleDeleteItem = (itemId, itemName) => {
  itemToDelete.value = { id: itemId, name: itemName };
  showConfirmModal.value = true;
  console.log("Opening confirmation for deleting item:", itemToDelete.value);
};

const confirmDeletion = async () => {
  if (!itemToDelete.value) return;
  const { id, name } = itemToDelete.value;
  console.log(`Confirmation received. Deleting item ID: ${id}`);
  showConfirmModal.value = false;

  try {
    const apiUrl = `http://localhost:5000/api/menu/${id}`;
    await axios.delete(apiUrl);
    showToast(`Страва "${name}" видалена.`, "success");
    existingItems.value = existingItems.value.filter((item) => item.id !== id);
  } catch (error) {
    console.error(`Error deleting item ${id}:`, error);
    showToast(
      `Помилка видалення: ${error.response?.data?.message || error.message}`,
      "error",
    );
  } finally {
    itemToDelete.value = null;
  }
};

const cancelDeletion = () => {
  console.log("Deletion cancelled.");
  showConfirmModal.value = false;
  itemToDelete.value = null;
};

const startEditingItem = (item) => {
  console.log("Editing item:", item);
  editItemId.value = item.id;
  newItem.name = item.name;
  newItem.description = item.description || "";
  newItem.price = parseFloat(item.price);
  newItem.category = item.category;
  newItem.imageFile = null;
  newItem.imagePreview = item.image_url;
  newItem.currentImageUrl = item.image_url;
  formError.value = "";
  formSuccess.value = "";
  document
    .querySelector(".add-menu-item-form")
    ?.scrollIntoView({ behavior: "smooth" });
};

const cancelEdit = () => {
  editItemId.value = null;
  newItem.name = "";
  newItem.description = "";
  newItem.price = null;
  newItem.category = "";
  newItem.imageFile = null;
  newItem.imagePreview = null;
  newItem.currentImageUrl = null;
  const fileInput = document.getElementById("item-image");
  if (fileInput) fileInput.value = "";
  formError.value = "";
  formSuccess.value = "";
};

const handleImageSelect = (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    /* ... */ return;
  }
  if (!file.type.startsWith("image/")) {
    showToast("Будь ласка, оберіть файл зображення.", "error");
    /* ... */ return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast("Файл занадто великий (макс. 5MB).", "error");
    /* ... */ return;
  }
  newItem.imageFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    newItem.imagePreview = e.target.result;
  };
  reader.readAsDataURL(file);
  event.target.value = "";
};

const handleSubmitItem = async () => {
  if (!newItem.name || newItem.price === null || !newItem.category) {
    formError.value = "...";
    return;
  }
  isSubmittingForm.value = true;
  formError.value = "";
  formSuccess.value = "";

  const formData = new FormData();
  formData.append("name", newItem.name);
  formData.append("description", newItem.description || "");
  formData.append("price", newItem.price);
  formData.append("category", newItem.category);
  if (newItem.imageFile) {
    formData.append("image", newItem.imageFile);
  }

  try {
    let response;
    const headers = { "Content-Type": "multipart/form-data" };

    if (editItemId.value) {
      console.log(`Submitting UPDATE for item ID: ${editItemId.value}`);
      const apiUrl = `http://localhost:5000/api/menu/${editItemId.value}`;
      response = await axios.put(apiUrl, formData, { headers });
      formSuccess.value = response.data.message || "Блюдо успішно оновлено!";

      const index = existingItems.value.findIndex(
        (item) => item.id === editItemId.value,
      );
      if (index !== -1 && response.data.item) {
        existingItems.value[index] = response.data.item;
      } else {
        await fetchExistingItems();
      }

      cancelEdit();
    } else {
      console.log(`Submitting CREATE for new item`);
      const apiUrl = "http://localhost:5000/api/menu";
      response = await axios.post(apiUrl, formData, { headers });
      formSuccess.value = response.data.message || "Блюдо успішно додано!";
      if (response.data.item) {
        existingItems.value.unshift(response.data.item);
      } else {
        await fetchExistingItems();
      }
      cancelEdit();
    }

    console.log("Form submission successful:", response.data);
    showToast(`Страва "${name}" була оновелнна.`, "success");
    setTimeout(() => {
      formSuccess.value = "";
    }, 3000);
  } catch (error) {
    console.error("Error submitting menu item form:", error);
    const errorMsg =
      error.response?.data?.message ||
      (editItemId.value
        ? "Помилка оновлення блюда."
        : "Помилка додавання блюда.");
    formError.value = errorMsg;
    showToast(formError.value, "error", 5000);
    setTimeout(() => {
      formError.value = "";
    }, 5000);
  } finally {
    isSubmittingForm.value = false;
  }
};

onMounted(fetchExistingItems);
</script>

<style scoped>
.admin-page .container {
  max-width: 1140px;
}
.admin-page h1 {
  text-align: center;
  color: #0a192f;
  margin-bottom: 1.5rem;
}
.admin-page > .container > p {
  text-align: center;
  color: #495057;
  margin-bottom: 3rem;
}
.admin-sections section {
  background-color: #fff;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
}
.admin-sections h2 {
  margin-top: 0;
  color: #112240;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
}
.add-menu-item-form {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 5px;
  border: 1px solid #dee2e6;
}
.add-menu-item-form h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  text-align: center;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 0.3rem;
  font-weight: 500;
  font-size: 0.9em;
}
.form-group select {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
  background-color: white;
  cursor: pointer;
}

.form-group select:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-group select:invalid {
  color: #6c757d;
}

.form-group input[type="text"],
.form-group input[type="email"],
.form-group input[type="password"],
.form-group input[type="number"],
.form-group input[type="file"],
.form-group textarea {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}
.form-group textarea {
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.form-group-full {
  grid-column: 1 / -1;
}

.image-preview {
  margin-top: 0.5rem;
}
.image-preview img {
  max-width: 150px;
  max-height: 100px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.add-menu-item-form .cta-button {
  width: auto;
  padding: 0.7rem 1.5rem;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-radius: 4px;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1.5rem;
  font-size: 0.95rem;
}

.items-table th,
.items-table td {
  border: 1px solid #dee2e6;
  padding: 0.75rem;
  text-align: left;
  vertical-align: middle;
}

.items-table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.table-item-image {
  max-width: 60px;
  height: auto;
  max-height: 50px;
  border-radius: 4px;
  display: block;
}

.items-table td:last-child {
  text-align: center;
  white-space: nowrap;
}

.action-button {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid transparent;
  margin: 0 0.2rem;
  transition: opacity 0.2s ease;
}
.action-button:hover {
  opacity: 0.8;
}
.edit-button {
  background-color: #ffc107;
  border-color: #ffc107;
  color: #212529;
}

.delete-button {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
}
</style>
