<template>
  <div class="logs-details-container">
    <div class="logs-details-header">
      <h1>IDS Logs</h1>

      <div class="action-buttons">
        <!-- Refresh Button -->
        <button class="btn-refresh" @click="fetchLogs">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>

        <!-- Attribute Selection -->
        <select v-model="selectedAttribute" class="attribute-select">
          <option disabled value="">Select Attributes</option> <!-- Placeholder option -->
          <option
            v-for="(displayName, attribute) in attributeDisplayNames"
            :key="attribute"
            :value="attribute"
          >
            {{ displayName }}
          </option>
        </select>


        <!-- Search Input -->
        <div class="search-bar-wrapper">
          <label for="search-bar" class="search-bar-label">Search by :</label>
          <input
            id="search-bar"
            type="text"
            v-model="searchTerm"
            :placeholder="attributeDisplayNames[selectedAttribute]"
            @input="filterLogs"
            class="search-input"
          />
        </div>

        <!-- Date Range Filter -->
        <div class="date-range-container">
          <!-- Start Date Picker -->
          <div class="date-picker-wrapper">
            <label for="start-date" class="date-picker-label">Start Date :</label>
            <input
              type="date"
              id="start-date"
              v-model="startDate"
              @change="filterLogs"
              class="date-picker"
            />
          </div>

          <!-- End Date Picker -->
          <div class="date-picker-wrapper">
            <label for="end-date" class="date-picker-label">End Date :</label>
            <input
              type="date"
              id="end-date"
              v-model="endDate"
              @change="filterLogs"
              class="date-picker"
            />
          </div>
        </div>

        <!-- Export Button -->
        <div class="export-container">
          <button class="btn-export" @click="exportToCSV">
            <i class="fas fa-file-csv"></i> Export to CSV
          </button>
        </div>
      </div>
    </div>

    <div class="table-container">
      <div v-if="isLoading" class="loading-spinner-overlay">
        <div class="spinner"></div> <!-- You can replace this with a loading animation -->
      </div>
      <table class="logs-table">
        <thead>
          <tr>
            <th @click="sortData('ConnectionID')">Connection ID</th>
            <th @click="sortData('Timestamp')">Timestamp</th>
            <th @click="sortData('SrcIP')">Source IP</th>
            <th @click="sortData('DstIP')">Destination IP</th>
            <th @click="sortData('ProtocolType')">Protocol</th>
            <th @click="sortData('Label')">Label</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedLogs.length === 0">
            <td :colspan="16" class="no-logs-message">No logs found.</td>
          </tr>
          <tr v-else v-for="(log) in paginatedLogs" :key="log.ConnectionID" @click="showModal(log)">
            <td>{{ log.ConnectionID }}</td>
            <td>{{ formatTimestamp(log.Timestamp) }}</td>
            <td>{{ log.SrcIP }}</td>
            <td>{{ log.DstIP }}</td>
            <td>{{ log.ProtocolType }}</td>
            <td>{{ log.Label }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="filteredLogs.length > 0" class="pagination">
      <!-- Rows Per Page Dropdown -->
      <label for="rowsPerPage" class="pagination-label">Rows per page:</label>
      <select id="rowsPerPage" v-model="logsPerPage" @change="updatePagination" class="pagination-select">
        <option :value="50">50</option>
        <option :value="100">100</option>
        <option :value="200">200</option>
      </select>

      <!-- Existing Pagination Buttons -->
      <button class="btn-prev" @click="previousPage" :disabled="currentPage === 1">
        Previous
      </button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button class="btn-next" @click="nextPage" :disabled="currentPage === totalPages">
        Next
      </button>

      <!-- Go to Page Input -->
      <label for="goToPage" class="pagination-label">Go to Page:</label>
      <input
        type="number"
        id="goToPage"
        v-model="goToPageInput"
        @change="goToPage(goToPageInput)"
        :min="1"
        :max="totalPages"
        class="pagination-input"
      />
    </div>

    <!-- Modal Part -->
    <div
      v-if="isModalVisible"
      class="modal-overlay"
      tabindex="0"
      @keydown="handleEscape"
      ref="modal"
    >
      <div class="modal-content">
        <h2 id="modal-title" class="modal-title">Log Details</h2>
        <div class="log-details">
          <div class="log-detail" v-for="key in attributeOrder" :key="key">
            <span class="log-key">{{ formatKey(key) }}</span>
            <span class="log-separator">:</span>
            <span class="log-value">{{ selectedLog[key] || 'N/A' }}</span>
          </div>
        </div>
        <button class="modal-close-button" @click="closeModal">
          Close
        </button>
      </div>
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
    const selectedAttribute = ref("");
    const searchTerm = ref("");
    const startDate = ref(null); // Start date for filtering
    const endDate = ref(null);   // End date for filtering
    const currentPage = ref(1);
    const logsPerPage = ref(100);
    const goToPageInput = ref(1); // Input for "Go to Page"
    const sortKey = ref("Timestamp"); // Key to sort by
    const sortOrder = ref("desc"); // Sort order: 'asc' or 'desc'
    const isModalVisible = ref(false); // State for modal visibility
    const selectedLog = ref({}); // State for the log to display in the modal
    const isLoading = ref(false);
    const modal = ref(null); // Reference to the modal content
    const closeButton = ref(null); // Reference to the close button

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    const attributeDisplayNames = ref({
      ConnectionID: "Connection ID",
      SrcIP: "Source IP",
      DstIP: "Destination IP",
      ProtocolType: "Protocol",
      Label: "Label",
    });

    const attributeOrder = [
      "ConnectionID",
      "Timestamp",
      "SrcIP",
      "DstIP",
      "ProtocolType",
      "Service",
      "Label",
      "Duration",
      "SrcBytes",
      "DstBytes",
      "DiffSrvRate",
      "SameSrvRate",
      "SerrorRate",
      "RerrorRate",
      "Flag",
      "Land",
    ];

    // Fetch Log Function
    const fetchLogs = async () => {
      isLoading.value = true;
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          // Handle missing token
          alert("No token found. Please log in again.");
          localStorage.removeItem("token"); // Clear the token
          window.location.href = "/"; // Redirect to login page
          return; // Exit the function
        }

        const response = await axios.get("http://localhost:3000/api/ids-logs", {
          headers: { Authorization: `Bearer ${token}` },
        });

        logs.value = response.data; // Store all logs
        filteredLogs.value = response.data; // Initially, show all logs

        // Clear search and date picker values
        selectedAttribute.value = "";
        searchTerm.value = "";
        startDate.value = null;
        endDate.value = null;
        sortData("Timestamp");
        
      } catch (err) {
        console.error("Error fetching logs:", err);

        // Check if the error is due to an unauthorized request
        if (err.response && err.response.status === 401) {
          alert("Session expired or unauthorized access. Please log in again.");
          localStorage.removeItem("token"); // Clear the token
          window.location.href = "/"; // Redirect to the login page
        } else {
          alert("Login expired. Please try again.");
          localStorage.removeItem("token");
          window.location.href = "/";
        }
      } finally {
        isLoading.value = false;
      }
    };

    // Timestamp Format Function
    const formatTimestamp = (timestamp) => {
      const date = new Date(timestamp);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      const hh = String(date.getHours()).padStart(2, "0");
      const mi = String(date.getMinutes()).padStart(2, "0");
      const ss = String(date.getSeconds()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
    };

    // Filter Function
    const filterLogs = () => {
      const term = searchTerm.value.toLowerCase();

      filteredLogs.value = logs.value.filter((log) => {
        const attributeValue = log[selectedAttribute.value]?.toString().toLowerCase() || "";

        // Parse log timestamp as Date
        const logDate = new Date(log.Timestamp);

        // Date filtering logic
        const matchesDate = (() => {
          if (startDate.value && endDate.value) {
            // Range filtering: Include logs from startDate 00:00:00 to endDate 23:59:59
            const start = new Date(startDate.value);
            const end = new Date(endDate.value);
            end.setHours(23, 59, 59, 999); // Set end of the day for the endDate
            return logDate >= start && logDate <= end;
          } else if (startDate.value) {
            // Single day filtering: Include logs for the startDate only
            const start = new Date(startDate.value);
            const end = new Date(startDate.value);
            end.setHours(23, 59, 59, 999); // Set end of the day for the startDate
            return logDate >= start && logDate <= end;
          } else if (endDate.value) {
            // Include logs up to the endDate 23:59:59
            const end = new Date(endDate.value);
            end.setHours(23, 59, 59, 999);
            return logDate <= end;
          }
          // No date filter applied
          return true;
        })();

        // Search term filtering
        const matchesSearchTerm = attributeValue.includes(term);

        return matchesSearchTerm && matchesDate;
      });

      currentPage.value = 1; // Reset to the first page after filtering
    };


    // Sort Function
    const sortData = (key) => {
      if (sortKey.value === key) {
        sortOrder.value = sortOrder.value === "desc" ? "asc" : "desc";
      } else {
        sortKey.value = key;
        sortOrder.value = "desc";
      }

      filteredLogs.value.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];

        if (valA < valB) return sortOrder.value === "desc" ? -1 : 1;
        if (valA > valB) return sortOrder.value === "desc" ? 1 : -1;
        return 0;
      });

      currentPage.value = 1; // Reset to first page after sorting
    };

    // Reset Pagination Function
    const updatePagination = () => {
      currentPage.value = 1; // Reset to the first page when changing rows per page
      goToPageInput.value = 1; // Reset "Go to Page" input
    };

    // Go To Page Function
    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        goToPageInput.value = page; // Sync input with the current page
      }
    };

    // Compute Page Function
    const totalPages = computed(() => {
      const perPage = Number(logsPerPage.value); // Convert logsPerPage to a number
      return perPage > 0 ? Math.ceil(filteredLogs.value.length / perPage) : 1;
    });


    const paginatedLogs = computed(() => {
      const perPage = Number(logsPerPage.value); // Convert logsPerPage to a number
      const start = (currentPage.value - 1) * perPage;
      const end = start + perPage;
      return filteredLogs.value.slice(start, end);
    });

    const previousPage = () => {
      if (currentPage.value > 1) currentPage.value--;
    };

    const nextPage = () => {
      if (currentPage.value < totalPages.value) currentPage.value++;
    };

    // Export to CSV Function
    const exportToCSV = () => {
      const headers = [
        "Connection ID",
        "Timestamp",
        "Source IP",
        "Destination IP",
        "Protocol",
        "Service",
        "Label",
        "Duration",
        "Source Bytes",
        "Destination Bytes",
        "Diff Srv Rate",
        "Same Srv Rate",
        "Serror Rate",
        "Rerror Rate",
        "Flag",
        "Land",
      ];

      const rows = filteredLogs.value.map((log) => [
        log.ConnectionID,
        formatTimestamp(log.Timestamp),
        log.SrcIP,
        log.DstIP,
        log.ProtocolType,
        log.Service,
        log.Label,
        log.Duration,
        log.SrcBytes,
        log.DstBytes,
        log.DiffSrvRate,
        log.SameSrvRate,
        log.SerrorRate,
        log.RerrorRate,
        log.Flag,
        log.Land,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "filtered_logs.csv");
      document.body.appendChild(link);

      link.click();
      document.body.removeChild(link);
    };

    // Show Modal Function
    const showModal = (log) => {
      selectedLog.value = log;
      isModalVisible.value = true;

      // Wait for the DOM to render and focus on the modal
      nextTick(() => {
        const modalElement = document.querySelector(".modal-overlay");
        modalElement?.focus();
      });
    };

    // Close Modal Function
    const closeModal = () => {
      isModalVisible.value = false;
    };

    // Handle keyboard events
    const handleKeydown = (event) => {
      const focusableElements = modal.value?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0];
      const lastElement = focusableElements?.[focusableElements.length - 1];

      switch (event.key) {
        case "Tab":
          // Trap focus inside the modal
          if (event.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement?.focus();
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement?.focus();
            }
          }
          break;
        case "Escape":
          // Close the modal on Escape
          closeModal();
          break;
      }
    };

    const formatKey = (key) => {
      return key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
    };

    onMounted(() => {
      fetchLogs();
    });

    return {
      logs,
      filteredLogs,
      searchTerm,
      startDate,
      endDate,
      currentPage,
      logsPerPage,
      paginatedLogs,
      totalPages,
      fetchLogs,
      filterLogs,
      formatTimestamp,
      sortData,
      exportToCSV,
      previousPage,
      nextPage,
      goToPageInput,
      updatePagination,
      goToPage,
      attributeDisplayNames,
      selectedAttribute,
      isModalVisible,
      selectedLog,
      showModal,
      closeModal,
      handleKeydown,
      modal,
      closeButton,
      formatKey,
      attributeOrder,
      isLoading,
      handleEscape,
    };
  },
};
</script>

<style scoped>
.logs-details-container {
  max-width: 100%;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.logs-details-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 20px;
}

.logs-details-header h1 {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap; /* Allows wrapping if screen width is too small */
  gap: 20px; /* Spacing between elements */
  align-items: center; /* Vertically aligns items */
  justify-content: space-between; /* Pushes elements apart (left and right) */
  width: 100%; /* Ensures the buttons container spans the full width */
}

.btn-refresh {
  padding: 5px;
  background-color: green;
  color: white;
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid green;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.btn-refresh:hover {
  background-color: darkgreen;
  border: 2px solid darkgreen; /* Slightly darker red border */
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3); /* Add a shadow */
}

.date-range-container {
  display: flex;
  gap: 10px; /* Smaller gap for date pickers */
  align-items: center; /* Aligns labels and inputs in the center */
}

.search-bar-wrapper,
.date-picker-wrapper {
  display: flex;
  align-items: center; /* Aligns labels and inputs in the center */
  gap: 10px;
}

.search-bar-label,
.date-picker-label {
  font-size: 0.9rem;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
}

.search-input,
.date-picker {
  padding: 5px;
  border: 1.5px solid #000000;
  border-radius: 5px;
  color: #000000;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.search-input {
  width: 300px;
}

.search-input:focus,
.date-picker:focus {
  border: 1.5px solid #007bff;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
}

.attribute-select {
  padding: 5px;
  border: 1.5px solid #000000;
  border-radius: 5px;
  color: #000000;
  outline: none; /* Removes the default focus outline */
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.attribute-select:focus {
  border: 1.5px solid #007bff; /* Highlight border on focus */
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.5); /* Add a subtle shadow */
}

.export-container {
  margin-left: auto; /* Pushes the button to the right side */
}

.btn-export {
  padding: 5px 15px;
  background-color: #007bff;
  color: white;
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid #007bff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.btn-export:hover {
  background-color: #0056b3;
  border: 2px solid #0056b3;
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3);
}

.no-logs-message {
  text-align: center;
  font-style: italic;
  color: gray;
  padding: 20px;
}

.table-container {
  max-height: 65vh; /* Adjust height as needed */
  overflow-y: auto; /* Add vertical scrolling */
  border: 1px solid #ccc; /* Optional: border for the table container */
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
}

.logs-table th {
  position: sticky;
  top: 0;
  background-color: #000000;
  z-index: 1; /* Ensure it stays above other elements */
  color: #ffffff;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
}

.logs-table td {
  font-size: 0.9rem;
  border-right: 1px solid #ccc;
  word-wrap: break-word;
  max-width: 250px; /* Adjust as needed */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logs-table th,
.logs-table td {
  text-align: center;
  padding: 10px;
  border-bottom: 1px solid #ccc;
}

.logs-table tbody tr:hover {
  background-color: lightgray; /* Light gray background color on hover */
  cursor: pointer; /* Change cursor to pointer to indicate interactivity */
  transition: background-color 0.3s ease; /* Smooth transition effect */
}

.pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

.pagination-label {
  font-size: 0.9rem;
  font-weight: bold;
  margin-right: 5px;
}

.pagination-select,
.pagination-input {
  padding: 5px;
  border: 1px solid #777;
  border-radius: 10px;
  text-align: center;
  width: auto;
}

.pagination-input {
  max-width: 100px; /* Adjust width for the input field */
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
  background-color: gray;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Make sure it's above other content */
}

/* Center the modal title */
.modal-title {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 20px;
  color:black;
  font-weight: bold;
}

/* Style the log-details container */
.log-details {
  display: flex;
  flex-direction: column; /* Arrange items vertically */
  gap: 10px; /* Add spacing between each row */
  margin-bottom: 20px; /* Add spacing below the details */
}

/* Each row of key-value data */
.log-detail {
  display: flex;
  justify-content: flex-start; /* Align content to the left */
  align-items: center; /* Align items vertically */
  gap: 10px; /* Add spacing between key, separator, and value */
  
}

/* Style for the key */
.log-key {
  font-weight: bold;
  width: 150px; /* Set a fixed width for keys for proper alignment */
  text-align: left; /* Align the key text to the left */
  color: black;
}

/* Separator style */
.log-separator {
  font-weight: bold;
  color: black;
}

/* Style for the value */
.log-value {
  text-align: left; /* Align the value text to the left */
  color: blue;
  flex-grow: 1; /* Let the value take the remaining space */
  font-family: 'Courier New', Courier, monospace; /* Monospace font for alignment */
  font-weight: bold;
  font-size: 0.9 rem;
}

/* Adjust the modal content alignment */
.modal-content {
  background: white;
  border-radius: 30px;
  padding: 20px;
  width: 90%;
  max-width: 600px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  max-height: 90%;
  overflow-y: auto; /* Scroll if content overflows */
}

.modal-close-button {
  display: block;
  margin: 20px auto 0;
  padding: 10px 20px; /* Adjust padding for button size */
  background-color: red; /* Button background color */
  color: white; /* Button text color */
  border: none; /* Remove border */
  border-radius: 10px; /* Rounded corners */
  cursor: pointer; /* Pointer cursor on hover */
  font-size: 1rem; /* Adjust font size */
  font-weight: bold;
  transition: background-color 0.3s ease; /* Smooth hover effect */
}

.modal-close-button:hover {
  background-color: darkred;
  border: 1px solid darkred; /* Slightly darker red border */
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3); /* Add a shadow */
}

.loading-spinner {
  text-align: center;
  font-size: 1.5rem;
  color: #007bff;
  margin-bottom: 20px; /* Add spacing between spinner and table */
}

.loading-spinner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(109, 109, 109, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10; /* Ensure it overlays the table */
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #ff0800;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

:focus {
  outline: 1px solid lightgray;
  outline-offset: 0px;
}

</style>
