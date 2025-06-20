<template>
  <transition name="toast-fade">
    <div v-if="visible" :class="['toast-notification', type]" role="alert">
      <span>{{ message }}</span>
      <button
        @click="$emit('close')"
        class="toast-close-btn"
        aria-label="Закрити"
      >
        &times;
      </button>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: "success",
    validator: (value) =>
      ["success", "error", "info", "warning"].includes(value),
  },
});

defineEmits(["close"]);
</script>

<style scoped>
.toast-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1100;
  min-width: 250px;
  max-width: 400px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: 0.95;
  border-left-width: 5px;
  border-left-style: solid;
}

.toast-notification.success {
  background-color: #d4edda;
  color: #155724;
  border-left-color: #28a745;
}

.toast-notification.error {
  background-color: #f8d7da;
  color: #721c24;
  border-left-color: #dc3545;
}

.toast-notification.info {
  background-color: #d1ecf1;
  color: #0c5460;
  border-left-color: #17a2b8;
}
.toast-notification.warning {
  background-color: #fff3cd;
  color: #856404;
  border-left-color: #ffc107;
}

.toast-close-btn {
  background: none;
  border: none;
  color: inherit;
  opacity: 0.7;
  font-size: 1.4rem;
  font-weight: bold;
  line-height: 1;
  cursor: pointer;
  padding: 0 0 0 1rem;
  margin-left: 1rem;
}
.toast-close-btn:hover {
  opacity: 1;
}
</style>
