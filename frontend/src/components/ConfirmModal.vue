<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="onCancel">
    <div class="modal-container confirmation-modal">
      <button class="modal-close-button" @click="onCancel">&times;</button>
      <div class="modal-content">
        <h3 class="confirm-title">{{ title }}</h3>
        <p class="confirm-message">{{ message }}</p>
        <div class="confirm-actions">
          <button @click="onCancel" class="cta-button secondary cancel-btn">
            Скасувати
          </button>
          <button
            @click="onConfirm"
            class="cta-button delete-button confirm-btn"
          >
            Так, видалити
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: "Підтвердження дії",
  },
  message: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["confirm", "cancel"]);

const onConfirm = () => {
  emit("confirm");
};

const onCancel = () => {
  emit("cancel");
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

.confirm-title {
  text-align: center;
  margin-top: 0;
  margin-bottom: 0.75rem;
  font-size: 1.4rem;
  color: #0a192f;
}

.confirm-message {
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  color: #343a40;
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
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
}
.cta-button.secondary {
  background-color: #6c757d;
  border-color: #6c757d;
  color: white;
}
.cta-button.secondary:hover {
  background-color: #5a6268;
  border-color: #545b62;
}

.cta-button.delete-button {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
}
.cta-button.delete-button:hover {
  background-color: #c82333;
  border-color: #bd2130;
}
</style>
