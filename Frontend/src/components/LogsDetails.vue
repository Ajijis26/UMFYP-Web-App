<template>
  <div class="logs-details-container">
    <div class="logs-details-header">
      <h1>IDS Logs</h1>

      <div class="action-buttons">
        <!-- Refresh Button -->
        <button class="btn-refresh" @click="fetchLogs">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
        <!-- Search Input -->
        <input
          type="text"
          v-model="searchTerm"
          placeholder="Search Logs (Source/Destination IP)"
          @input="filterLogs"
          class="search-input"
        />
      </div>
    </div>

    <table v-if="paginatedLogs.length > 0" class="logs-table">
      <thead>
        <tr>
          <th @click="sortData('id')">ID</th>
          <th @click="sortData('Timestamp')">Timestamp</th>
          <th @click="sortData('Source_IP')">Source IP</th>
          <th @click="sortData('Destination_IP')">Destination IP</th>
          <th @click="sortData('Protocol')">Protocol</th>
          <th @click="sortData('Port')">Port</th>
          <th @click="sortData('Traffic_Volume')">Traffic Volume</th>
          <th @click="sortData('Action')">Action</th>
          <th @click="sortData('Label')">Label</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(log) in paginatedLogs" :key="log.id">
          <td>{{ log.id }}</td>
          <td>{{ log.Timestamp }}</td>
          <td>{{ log.Source_IP }}</td>
          <td>{{ log.Destination_IP }}</td>
          <td>{{ log.Protocol }}</td>
          <td>{{ log.Port }}</td>
          <td>{{ log.Traffic_Volume }}</td>
          <td>{{ log.Action }}</td>
          <td>{{ log.Label }}</td>
        </tr>
      </tbody>
    </table>

    <div v-if="paginatedLogs.length === 0" class="no-logs-message">
      No logs found.
    </div>

    <div v-if="filteredLogs.length > 0" class="pagination">
      <button class="btn-prev" @click="previousPage" :disabled="currentPage === 1">
        Previous
      </button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button class="btn-next" @click="nextPage" :disabled="currentPage === totalPages">
        Next
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import axios from "axios";

export default {
  name: "LogsDetails",
  setup() {
    const logs = ref([]); // Full logs from the server
    const filteredLogs = ref([]); // Logs after filtering
    const searchTerm = ref("");
    const currentPage = ref(1);
    const logsPerPage = 100;

    const sortKey = ref(""); // Key to sort by
    const sortOrder = ref("asc"); // Sort order: 'asc' or 'desc'

    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found. Please log in again.");

        const response = await axios.get("http://localhost:3000/api/ids-logs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        logs.value = response.data; // Store all logs
        filteredLogs.value = response.data; // Initially, show all logs
      } catch (err) {
        console.error("Error fetching logs:", err);
        alert("Failed to fetch logs. Please try again.");
      }
    };

    const filterLogs = () => {
      const term = searchTerm.value.toLowerCase();
      filteredLogs.value = logs.value.filter(
        (log) =>
          log.Source_IP.toLowerCase().includes(term) ||
          log.Destination_IP.toLowerCase().includes(term)
      );
      currentPage.value = 1; // Reset to the first page after filtering
    };

    const sortData = (key) => {
      if (sortKey.value === key) {
        // Toggle sort order if the same key is clicked
        sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
      } else {
        // Set the new key and default to ascending
        sortKey.value = key;
        sortOrder.value = "asc";
      }

      filteredLogs.value.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];

        if (valA < valB) return sortOrder.value === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder.value === "asc" ? 1 : -1;
        return 0;
      });

      currentPage.value = 1; // Reset to first page after sorting
    };

    const totalPages = computed(() =>
      Math.ceil(filteredLogs.value.length / logsPerPage)
    );

    const paginatedLogs = computed(() => {
      const start = (currentPage.value - 1) * logsPerPage;
      const end = start + logsPerPage;
      return filteredLogs.value.slice(start, end);
    });

    const previousPage = () => {
      if (currentPage.value > 1) currentPage.value--;
    };

    const nextPage = () => {
      if (currentPage.value < totalPages.value) currentPage.value++;
    };

    onMounted(() => {
      fetchLogs();
    });

    return {
      logs,
      filteredLogs,
      searchTerm,
      currentPage,
      logsPerPage,
      paginatedLogs,
      totalPages,
      fetchLogs,
      filterLogs,
      sortData,
      previousPage,
      nextPage,
    };
  },
};
</script>

<style scoped>
.logs-details-container {
  max-width: 1200px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.logs-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.logs-details-header h1 {
  font-size: 2rem;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 20px;
}

.search-input {
  width: 250px;
  padding: 5px;
  border: 1px solid #7a7a7a;
  border-radius: 5px;
}

.btn-refresh {
  padding: 5px;
  font-size: 0.8rem;
  background-color: green;
  color: white;
  border: 1px solid #7a7a7a;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid green; /* Slightly darker red border */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2); /* Add a shadow */
}

.btn-refresh:hover {
  background-color: darkgreen;
  border: 2px solid darkgreen; /* Slightly darker red border */
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3); /* Add a shadow */
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
}

.logs-table th,
.logs-table td {
  text-align: center;
  padding: 10px;
  border-bottom: 1px solid #ccc;
  font-size: 0.8rem;
}

.logs-table th {
  background-color: #000000;
  color: #ffffff;
  font-weight: bold;
  cursor: pointer;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.btn-prev,
.btn-next {
  padding: 5px 10px;
  margin: 0 10px;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 5px;
  cursor: pointer;
}

.btn-prev[disabled],
.btn-next[disabled] {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>
