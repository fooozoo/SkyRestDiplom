<template>
  <div class="content-section reservation-page">
    <div class="container">
      <h2>Резервування столика</h2>
      <div class="reservation-controls">
        <div class="form-group">
          <label for="res-date">Дата:</label>
          <input
            type="date"
            id="res-date"
            v-model="selectedDate"
            :min="todayDate"
            @change="clearSelectionAndFetchAvailability"
          />
        </div>
        <div class="form-group">
          <label for="res-time">Час:</label>
          <input
            type="time"
            id="res-time"
            v-model="selectedTime"
            step="1800"
            @change="clearSelectionAndFetchAvailability"
          />
        </div>
        <div class="form-group">
          <label for="res-guests">Кількість гостей:</label>
          <input
            type="number"
            id="res-guests"
            v-model.number="partySize"
            min="1"
            @input="clearSelection"
          />
        </div>
      </div>
      <div v-if="error" class="error-message">{{ error }}</div>
      <div v-if="isLoadingAvailability" class="loading-indicator">
        Перевірка доступності столиків...
      </div>

      <div
        class="tables-layout"
        v-if="selectedDate && selectedTime && !isLoadingAvailability"
      >
        <p v-if="allTables.length === 0">
          Не вдалося завантажити схему столиків.
        </p>
        <p v-else-if="!isAnyTableAvailable" class="no-tables-message">
          На жаль, на обраний час вільних столиків немає.
        </p>

        <div v-else>
          <div v-if="regularTables.length > 0" class="table-group">
            <h4>Звичайні столики</h4>
            <div class="tables-grid">
              <div
                v-for="table in regularTables"
                :key="table.id"
                class="table-visual"
                :class="getTableClasses(table)"
                @click="selectTable(table)"
                :title="getTableTitle(table)"
              >
                <span class="table-name">{{ table.name }}</span>
                <span class="table-capacity">({{ table.capacity }} місць)</span>
              </div>
            </div>
          </div>

          <div v-if="terraceTables.length > 0" class="table-group">
            <h4>Тераса</h4>
            <div class="tables-grid">
              <div
                v-for="table in terraceTables"
                :key="table.id"
                class="table-visual"
                :class="getTableClasses(table)"
                @click="selectTable(table)"
                :title="getTableTitle(table)"
              >
                <span class="table-name">{{ table.name }}</span>
                <span class="table-capacity">({{ table.capacity }} місць)</span>
              </div>
            </div>
          </div>

          <div v-if="vipTables.length > 0" class="table-group">
            <h4>VIP</h4>
            <div class="tables-grid">
              <div
                v-for="table in vipTables"
                :key="table.id"
                class="table-visual"
                :class="getTableClasses(table)"
                @click="selectTable(table)"
                :title="getTableTitle(table)"
              >
                <span class="table-name">{{ table.name }}</span>
                <span class="table-capacity">({{ table.capacity }} місць)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p v-else class="select-prompt">Будь ласка, оберіть дату та час.</p>
      <div class="reservation-confirm" v-if="selectedTableId">
        <p>
          Ви обрали: <strong>{{ selectedTableName }}</strong> на
          {{ partySize }} {{ guestWord(partySize) }}.
        </p>
        <button
          @click="makeReservation"
          class="cta-button"
          :disabled="isReserving"
        >
          {{ isReserving ? "Резервування..." : "Зарезервувати" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { inject } from "vue";

// --- Inject ---
const showToast = inject("showToast", (msg, type) =>
  console.warn(`Toast: ${type}-${msg}`),
);
const isLoggedIn = inject("isLoggedIn", ref(false)); // Перевіряємо логін перед резервацією

// --- Refs & Reactive ---
const selectedDate = ref("");
const selectedTime = ref("");
const partySize = ref(1);
const allTables = ref([]);
const selectedTableId = ref(null);
const isLoadingTables = ref(false);
const isLoadingAvailability = ref(false);
const isReserving = ref(false);
const error = ref(null);
const router = useRouter();
const typeOrder = { regular: 1, terrace: 2, vip: 3 };
const todayDate = computed(() => new Date().toISOString().split("T")[0]);

const sortedTables = computed(() => {
  return [...allTables.value].sort((a, b) => {
    const orderA = typeOrder[a.table_type] || 99;
    const orderB = typeOrder[b.table_type] || 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.id - b.id;
  });
});
const regularTables = computed(() =>
  sortedTables.value.filter(
    (t) => t.table_type === "regular" && t.capacity >= partySize.value,
  ),
);
const terraceTables = computed(() =>
  sortedTables.value.filter(
    (t) => t.table_type === "terrace" && t.capacity >= partySize.value,
  ),
);
const vipTables = computed(() =>
  sortedTables.value.filter(
    (t) => t.table_type === "vip" && t.capacity >= partySize.value,
  ),
);

const availableTablesForGuests = computed(() => {
  return allTables.value.filter((table) => table.capacity >= partySize.value);
});

const isAnyTableAvailable = computed(() => {
  return availableTablesForGuests.value.some((table) => table.is_available);
});

const selectedTableName = computed(() => {
  const table = allTables.value.find((t) => t.id === selectedTableId.value);
  return table ? table.name : "";
});

const guestWord = (count) => {
  if (count === 1) return "гостя";
  if (count > 1 && count < 5) return "гостей";
  return "гостей";
};

const isTableBigEnough = (table) => {
  return table.capacity >= partySize.value;
};

const getTableTitle = (table) => {
  if (!isTableBigEnough(table))
    return `Замало місць (потрібно ${partySize.value})`;
  if (!table.is_available) return "Зайнято на цей час";
  if (table.id === selectedTableId.value) return `Обрано ${table.name}`;
  return `Обрати ${table.name} (${table.capacity} місць)`;
};

const fetchAllTables = async () => {
  isLoadingTables.value = true;
  error.value = null;
  try {
    const response = await axios.get("http://localhost:5000/api/tables");
    allTables.value = response.data.map((table) => ({
      ...table,
      is_available: true,
      is_selected: false,
    }));
  } catch (err) {
    console.error("Error fetching tables:", err);
    error.value = "Не вдалося завантажити схему столиків.";
    showToast(error.value, "error");
  } finally {
    isLoadingTables.value = false;
  }
};

let availabilityRequestTimeout = null;
const fetchAvailability = async () => {
  if (!selectedDate.value || !selectedTime.value) return;

  const selectedDateTime = new Date(
    `${selectedDate.value}T${selectedTime.value}`,
  );
  if (selectedDateTime < new Date()) {
    error.value = "Будь ласка, оберіть майбутній час.";
    allTables.value.forEach((t) => (t.is_available = false));
    return;
  }

  isLoadingAvailability.value = true;
  error.value = null;
  selectedTableId.value = null;

  clearTimeout(availabilityRequestTimeout);
  availabilityRequestTimeout = setTimeout(async () => {
    try {
      const params = { date: selectedDate.value, time: selectedTime.value };
      const response = await axios.get(
        "http://localhost:5000/api/tables/availability",
        { params },
      );
      const availabilityData = response.data;

      allTables.value = allTables.value.map((table) => {
        const availabilityInfo = availabilityData.find(
          (a) => a.id === table.id,
        );
        return {
          ...table,
          is_available: availabilityInfo
            ? availabilityInfo.is_available
            : false,
          is_selected: false,
        };
      });
    } catch (err) {
      console.error("Error fetching availability:", err);
      error.value = "Не вдалося перевірити доступність столиків.";
      showToast(error.value, "error");
      allTables.value.forEach((t) => (t.is_available = false));
    } finally {
      isLoadingAvailability.value = false;
    }
  }, 300);
};

const selectTable = (table) => {
  if (!table.is_available) {
    showToast("Цей столик зайнятий на обраний час.", "error");
    return;
  }
  if (!isTableBigEnough(table)) {
    showToast(
      `Цей столик замалий (потрібно місць: ${partySize.value}).`,
      "error",
    );
    return;
  }
  selectedTableId.value = table.id;
  allTables.value.forEach((t) => (t.is_selected = t.id === table.id));
  console.log("Selected table:", table.id);
};

const clearSelectionAndFetchAvailability = () => {
  selectedTableId.value = null;
  allTables.value.forEach((t) => (t.is_selected = false));
  fetchAvailability();
};
const clearSelection = () => {
  selectedTableId.value = null;
  allTables.value.forEach((t) => (t.is_selected = false));
};

const makeReservation = async () => {
  if (
    !selectedTableId.value ||
    !selectedDate.value ||
    !selectedTime.value ||
    partySize.value < 1
  ) {
    showToast(/* ... */);
    return;
  }
  if (!isLoggedIn.value) {
    showToast(/* ... */);
    return;
  }

  isReserving.value = true;
  error.value = null;

  const reservationData = {
    table_id: selectedTableId.value,
    reservation_date: selectedDate.value,
    reservation_time: selectedTime.value,
    party_size: partySize.value,
  };

  console.log("Submitting reservation:", reservationData);

  try {
    const apiUrl = "http://localhost:5000/api/reservations";
    const response = await axios.post(apiUrl, reservationData);

    console.log("Reservation successful:", response.data);
    showToast(
      response.data.message || "Столик успішно зарезервовано!",
      "success",
    );

    await fetchAvailability();
    selectedTableId.value = null;
    allTables.value.forEach((t) => (t.is_selected = false));
  } catch (err) {
    console.error("Error placing reservation:", err);
    const errorMsg =
      err.response?.data?.message || "Помилка при резервації столика.";
    showToast(errorMsg, "error", 5000);
    if (err.response?.status === 409) {
      await fetchAvailability();
    }
  } finally {
    isReserving.value = false;
  }
};

onMounted(fetchAllTables);

const getTableClasses = (table) => {
  return {
    "table-available": table.is_available,
    "table-booked": !table.is_available,
    "table-selected": table.id === selectedTableId.value,
    "table-too-small": !isTableBigEnough(table) && table.is_available,
    "table-type-regular": table.table_type === "regular",
    "table-type-terrace": table.table_type === "terrace",
    "table-type-vip": table.table_type === "vip",
  };
};
</script>

<style scoped>
.reservation-page .container {
  max-width: 1000px;
}
.reservation-page h2 {
  text-align: center;
  color: #0a192f;
  margin-bottom: 2rem;
}

.reservation-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 0.4rem;
  font-weight: 500;
  font-size: 0.9em;
  color: #495057;
}

.form-group input[type="date"],
.form-group input[type="time"],
.form-group input[type="number"] {
  padding: 0.6rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  min-width: 150px;
}
.form-group input[type="number"] {
  min-width: 80px;
  width: 80px;
}

.form-group input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(250, 0, 0, 0.25);
}

.select-prompt {
  text-align: center;
  color: #6c757d;
  margin-top: 2rem;
  font-style: italic;
}

.tables-layout {
  margin-top: 2rem;
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 5px;
  min-height: 200px;
  background-color: #fff;
}
.tables-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
}
.table-visual {
  border: 2px solid #ccc;
  border-radius: 5px;
  padding: 1rem;
  min-width: 100px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background-color: #e9f5e9;
  position: relative;
}
.table-visual .table-name {
  font-weight: bold;
  display: block;
  margin-bottom: 0.3rem;
}
.table-visual .table-capacity {
  font-size: 0.8em;
  color: #666;
  display: block;
}

.table-available:hover {
  border-color: #28a745;
  box-shadow: 0 0 8px rgba(40, 167, 69, 0.4);
  transform: scale(1.03);
}

.table-booked {
  background-color: #e9ecef;
  border-color: #ced4da;
  opacity: 0.6;
  cursor: not-allowed;
  color: #6c757d;
}

.table-selected {
  border-color: #007bff;
  background-color: #cfe2ff;
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
  transform: scale(1.05);
}

.table-too-small {
  background-color: #fff3cd;
  border-color: #ffeeba;
  cursor: not-allowed;
  color: #856404;
}
.table-too-small:hover {
  border-color: #ffeeba;
  box-shadow: none;
  transform: none;
}

.loading-indicator,
.error-message,
.no-tables-message {
  text-align: center;
  padding: 1rem;
  color: #6c757d;
}
.error-message {
  color: #dc3545;
  font-weight: bold;
}
.no-tables-message {
  font-weight: bold;
  color: #dc3545;
}

.reservation-confirm {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 8px;
  text-align: center;
}
.reservation-confirm p {
  margin-bottom: 1rem;
  font-size: 1.1em;
}
.reservation-confirm .cta-button {
  width: auto;
}
.table-group {
  margin-bottom: 2rem;
}
.table-group h4 {
  margin-bottom: 1rem;
  font-size: 1.3rem;
  color: #343a40;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

.table-visual {
  border: 3px solid #dee2e6;
}

.table-type-regular.table-available {
  border-color: #f8f9fa;
}
.table-type-regular.table-selected {
  border-color: #343a40;
}

.table-type-terrace.table-available {
  border-color: #0d6efd;
}
.table-type-terrace.table-selected {
  border-color: #0a58ca;
  box-shadow: 0 0 10px rgba(13, 110, 253, 0.5);
}

.table-type-vip.table-available {
  border-color: #ffc107;
}
.table-type-vip.table-selected {
  border-color: #d39e00;
  box-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
}

.table-booked {
  background-color: #e9ecef;
  border-color: #ced4da;
  opacity: 0.6;
  cursor: not-allowed;
}
.table-too-small {
  background-color: #fff3cd !important;
  border-color: #ffeeba !important;
  cursor: not-allowed;
  color: #856404;
}
.table-too-small:hover {
  box-shadow: none;
  transform: none;
}
</style>
