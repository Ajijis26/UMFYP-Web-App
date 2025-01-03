<template>
  <div class="alert-details-container">
    <div class="alert-details-header">
      <h1>IDS Alerts</h1>

      <div class="action-buttons">
        <!-- Refresh Button -->
        <button class="btn-refresh" @click="fetchAlerts">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>

        <!-- Attribute Selection -->
        <select v-model="selectedAttribute" class="attribute-select">
          <option disabled value="">Select Attributes</option>
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
          <label for="search-bar" class="search-bar-label">Search by:</label>
          <input
            id="search-bar"
            type="text"
            v-model="searchTerm"
            :placeholder="attributeDisplayNames[selectedAttribute] || 'Search Alerts'"
            @input="filterAlerts"
            class="search-input"
          />
        </div>

        <!-- Date Range Filter -->
        <div class="date-range-container">
          <!-- Start Date Picker -->
          <div class="date-picker-wrapper">
            <label for="start-date" class="date-picker-label">Start Date:</label>
            <input
              type="date"
              id="start-date"
              v-model="startDate"
              @change="filterAlerts"
              class="date-picker"
            />
          </div>

          <!-- End Date Picker -->
          <div class="date-picker-wrapper">
            <label for="end-date" class="date-picker-label">End Date:</label>
            <input
              type="date"
              id="end-date"
              v-model="endDate"
              @change="filterAlerts"
              class="date-picker"
            />
          </div>
        </div>

        <!-- Change Owner Button -->
        <div class="change-owner-container">
          <!-- Change Owner Button -->
          <button class="btn-change-owner" @click="changeOwner">
            <i class="fas fa-user-edit"></i> Change Owner
          </button>
        </div>
      </div>
    </div>


    <!-- Alerts Table -->
    <div class="table-container">
      <div v-if="isLoading" class="loading-spinner-overlay">
        <div class="spinner"></div>
      </div>
      <table class="alerts-table">
        <thead>
          <tr>
            <th>
              <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll"/>
            </th>
            <th @click="sortData('Timestamp')">Timestamp</th>
            <th @click="sortData('ConnectionID')">Connection ID</th>
            <th @click="sortData('SrcIP')">Source IP</th>
            <th @click="sortData('DstIP')">Destination IP</th>
            <th @click="sortData('Service')">Service</th>
            <th @click="sortData('ProtocolType')">Protocol</th>
            <th @click="sortData('Label')">Label</th>
            <th @click="sortData('Status')">Status</th>
            <th @click="sortData('Owner')">Owner</th>
            <th @click="sortData('LastUpdatedBy')">Last Updated By</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="paginatedAlerts.length === 0">
            <td :colspan="16" class="no-logs-message">No alert found.</td>
          </tr>
          <tr v-else v-for="(alert) in paginatedAlerts" :key="alert.ConnectionID" @click="showModal(alert)">
            <td>
              <input type="checkbox" v-model="selectedAlerts" :value="alert.ConnectionID" @click.stop />
            </td>
            <td>{{ formatTimestamp(alert.Timestamp) }}</td>
            <td>{{ alert.ConnectionID }}</td>
            <td>{{ alert.SrcIP }}</td>
            <td>{{ alert.DstIP }}</td>
            <td>{{ alert.Service }}</td>
            <td>{{ alert.ProtocolType }}</td>
            <td>{{ alert.Label }}</td>
            <td>
              <button
                class="status-button"
                :class="{ resolved: alert.Status === 'Resolved', unresolved: alert.Status === 'Unresolved' }"
                :disabled="alert.Owner !== currentUser"
                @click.stop="toggleStatus(alert)"
              >
                {{ alert.Status }}
              </button>
            </td>
            <td>{{ alert.Owner }}</td>
            <td>{{ alert.LastUpdatedBy }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="filteredAlerts.length > 0" class="pagination">
      <label for="rowsPerPage" class="pagination-label">Rows per page: </label>
      <select
        id="rowsPerPage"
        v-model="alertsPerPage"
        @change="updatePagination"
        class="pagination-select"
      >
        <option :value="50">50</option>
        <option :value="100">100</option>
        <option :value="200">200</option>
      </select>

      <button class="btn-prev" @click="previousPage" :disabled="currentPage === 1">
        Previous
      </button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button class="btn-next" @click="nextPage" :disabled="currentPage === totalPages">
        Next
      </button>

      <!-- Go to Page Input -->
      <label for="goToPage" class="pagination-label">Go to Page: </label>
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
    <!-- Modal for Alert Details -->
    <div
      v-if="isModalVisible"
      class="modal-overlay"
      tabindex="0"
      @keydown="handleEscape"
      ref="modal"
    >
      <div class="modal-content-details">
        <h2 id="modal-title" class="modal-title">Alert Details</h2>
        <div class="alert-details">
          <div class="alert-detail" v-for="key in attributeOrder" :key="key">
            <span class="alert-key">{{ formatKey(key) }}</span>
            <span class="alert-separator">:</span>
            <span class="alert-value">{{ selectedAlert[key] || 'N/A' }}</span>
          </div>
        </div>
        <button class="modal-close-button" @click="closeModal">
          Close
        </button>
      </div>
    </div>

    <!-- Modal for Change Owner -->
    <div
      v-if="isOwnerModalVisible"
      class="modal-overlay"
      tabindex="0"
    >
      <div class="modal-content-changeOwner">
        <h2 class="modal-title">Change Owner</h2>
        <div class="modal-body">
          <label for="new-owner-input" class="modal-label">Enter New Owner Username :</label>
          <input
            id="new-owner-input"
            type="text"
            placeholder="Username"
            v-model="newOwnerUsername"
            class="modal-input"
          />
        </div>
        <div class="modal-footer">
          <button class="modal-button-cancel" @click="isOwnerModalVisible = false">Cancel</button>
          <button class="modal-button-confirm" @click="confirmChangeOwner">Confirm</button>
        </div>
      </div>
    </div>


  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from "vue";
import axios from "axios";

export default {
  name: "AlertDetails",
  setup() {
    const currentUser = ref(""); // Current logged-in user
    const alerts = ref([]); // All alerts
    const filteredAlerts = ref([]); // Filtered alerts for search
    const selectedAttribute = ref("");
    const searchTerm = ref("");
    const startDate = ref(null);
    const endDate = ref(null);
    const currentPage = ref(1);
    const alertsPerPage = ref(50);
    const goToPageInput = ref(1);
    const sortKey = ref("");
    const sortOrder = ref("asc");
    const selectedAlerts = ref([]);
    const selectedAlert = ref({});
    const isModalVisible = ref(false);
    const isLoading = ref(false);
    const modal = ref(null);
    const closeButton = ref(null);
    const isOwnerModalVisible = ref(false);
    const newOwnerUsername = ref("");


    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    const attributeDisplayNames = ref({
      ConnectionID: "Connection ID",
      Service: "Service",
      Owner: "Owner",
      Status: "Status",
      LastUpdatedBy: "Last Updated By",
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
      "Status",
      "Owner",
      "LastUpdatedBy",
    ];

    // Reconfirm the user is exist in the system
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found. Please log in again.");

        // Optionally, verify token via API (if needed for dynamic user state validation)
        const response = await axios.get("http://localhost:3000/api/currentuser", {
          headers: { Authorization: `Bearer ${token}` },
        });

        currentUser.value = response.data.username;
      } catch (err) {
        console.error("Error fetching current user:", err);
        alert("Failed to fetch user information. Redirecting to Login Page");
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    };

    // Fetch alerts from API
    const fetchAlerts = async () => {
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

        const response = await axios.get("http://localhost:3000/api/alerts", {
          headers: { Authorization: `Bearer ${token}` },
        });

        alerts.value = response.data;
        filteredAlerts.value = response.data; // Initialize filtered alerts

        // Clear search and date picker values
        selectedAttribute.value = "";
        searchTerm.value = "";
        startDate.value = null;
        endDate.value = null;
        sortData("Timestamp");

      } catch (err) {
        console.error("Error fetching alerts:", err);

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

    // Filter alerts based on search term
    const filterAlerts = () => {
      const term = searchTerm.value;

      filteredAlerts.value = alerts.value.filter((alert) => {
        // Check if the search term matches the selected attribute
        const matchesSearch = selectedAttribute.value
          ? (selectedAttribute.value === "Owner" || selectedAttribute.value === "LastUpdatedBy"
              ? alert[selectedAttribute.value] === term // Case-sensitive comparison for Owner
              : selectedAttribute.value === "Status"
              ? alert[selectedAttribute.value].toLowerCase() === term.toLowerCase() // Case-insensitive for Status
              : alert[selectedAttribute.value]?.toString().toLowerCase().includes(term.toLowerCase())) // Case-insensitive for other attributes
          : true;

        // Ensure status is either "Resolved" or "Unresolved" (case-insensitive)
        const matchesStatus =
          alert.Status.toLowerCase() === "resolved" ||
          alert.Status.toLowerCase() === "unresolved";

        // Filter by date range
        const alertDate = new Date(alert.Timestamp);
        const matchesDate = (() => {
          if (startDate.value && endDate.value) {
            const start = new Date(startDate.value);
            const end = new Date(endDate.value);
            end.setHours(23, 59, 59, 999);
            return alertDate >= start && alertDate <= end;
          } else if (startDate.value) {
            // Single day filtering: Include alerts for the startDate only
            const start = new Date(startDate.value);
            const end = new Date(startDate.value);
            end.setHours(23, 59, 59, 999); // Set end of the day for the startDate
            return alertDate >= start && alertDate <= end;
          } else if (endDate.value) {
            const end = new Date(endDate.value);
            end.setHours(23, 59, 59, 999);
            return alertDate <= end;
          }
          return true; // No date filter applied
        })();

        return matchesSearch && matchesStatus && matchesDate;
      });

      currentPage.value = 1; // Reset to the first page after filtering
    };

    // Sort alerts based on a given key
    const sortData = (key) => {
      if (sortKey.value === key) {
        sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
      } else {
        sortKey.value = key;
        sortOrder.value = "asc";
      }

      filteredAlerts.value.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];

        if (valA < valB) return sortOrder.value === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder.value === "asc" ? 1 : -1;
        return 0;
      });

      currentPage.value = 1; // Reset to first page after sorting
    };

    // Change the owner of selected alerts
    const changeOwner = () => {
      if (selectedAlerts.value.length === 0) {
        alert("Please select at least one alert to change the owner.");
        return;
      }
      isOwnerModalVisible.value = true; // Show the owner modal
    };


    const confirmChangeOwner = async () => {
      if (!newOwnerUsername.value) {
        alert("Owner username cannot be empty.");
        return;
      }

      try {
        const alertsToUpdate = selectedAlerts.value.map((id) => {
          const alert = filteredAlerts.value.find((a) => a.ConnectionID === id);
          return alert ? { ConnectionID: alert.ConnectionID, SrcIP: alert.SrcIP } : null;
        }).filter(Boolean); // Remove any null values

        console.log("Alerts to update:", alertsToUpdate); // Debug log

        if (alertsToUpdate.length === 0) {
          alert("No alerts selected for update.");
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
          alert("No authentication token found. Please log in again.");
          return;
        }

        await axios.put(
          "http://localhost:3000/api/alerts/change-owner",
          {
            alerts: alertsToUpdate,
            newOwner: newOwnerUsername.value,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Update the UI
        filteredAlerts.value.forEach((alert) => {
          if (selectedAlerts.value.includes(alert.ConnectionID)) {
            alert.Owner = newOwnerUsername.value;
          }
        });

        selectedAlerts.value = [];
        newOwnerUsername.value = "";
        isOwnerModalVisible.value = false;
      } catch (err) {
        console.error("Error updating owner:", err.response || err);
        alert("Failed to update owner.");
      }
    };

    // Toggle the status of an alert
    const toggleStatus = async (alertItem) => {
      if (alertItem.Owner !== currentUser.value) {
        alert("You are not the owner of this alert. Please change the owner to yourself first.");
        return;
      }

      const newStatus = alertItem.Status === "Resolved" ? "Unresolved" : "Resolved";

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found. Please log in again.");

        // Send both ConnectionID and SrcIP for the request
        await axios.put(
          `http://localhost:3000/api/alerts/status`,
          {
            ConnectionID: alertItem.ConnectionID, // Partition Key
            SrcIP: alertItem.SrcIP,              // Sort Key
            status: newStatus,                   // New status
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        alertItem.Status = newStatus;
        alertItem.LastUpdatedBy = currentUser.value;
      } catch (err) {
        console.error("Error updating alert status:", err);
        alert("Failed to update alert status.");
      }
    };

    const updatePagination = () => {
      currentPage.value = 1;
      goToPageInput.value = 1;
    };

    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        goToPageInput.value = page;
      }
    };

    const totalPages = computed(() =>
      Math.ceil(filteredAlerts.value.length / alertsPerPage.value)
    );

    // Get alerts for the current page
    const paginatedAlerts = computed(() => {
      const start = (currentPage.value - 1) * alertsPerPage.value;
      const end = start + alertsPerPage.value;
      return filteredAlerts.value.slice(start, end);
    });

    // Check if all alerts on the current page are selected
    const isAllSelected = computed(() => {
      const alertIds = paginatedAlerts.value.map((alert) => alert.ConnectionID);
      return (
        alertIds.length > 0 &&
        alertIds.every((id) => selectedAlerts.value.includes(id))
      );
    });

    // Toggle "Select All" functionality
    const toggleSelectAll = () => {
      const alertIds = paginatedAlerts.value.map((alert) => alert.ConnectionID);
      if (isAllSelected.value) {
        // Deselect all alerts on the current page
        selectedAlerts.value = selectedAlerts.value.filter(
          (id) => !alertIds.includes(id)
        );
      } else {
        // Select all alerts on the current page
        selectedAlerts.value = Array.from(
          new Set([...selectedAlerts.value, ...alertIds])
        );
      }
    };

    // Pagination controls
    const previousPage = () => {
      if (currentPage.value > 1) currentPage.value--;
    };

    const nextPage = () => {
      if (currentPage.value < totalPages.value) currentPage.value++;
    };

    // Show Modal Function
    const showModal = (alert) => {
      selectedAlert.value = alert;
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

    const formatKey = (key) => {
      // Convert camelCase or snake_case keys to readable format
      return key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
    };


    onMounted(() => {
      fetchCurrentUser();
      fetchAlerts();
    });

    return {
      currentUser,
      alerts,
      filteredAlerts,
      selectedAttribute,
      searchTerm,
      startDate,
      endDate,
      currentPage,
      alertsPerPage,
      goToPageInput,
      sortKey,
      sortOrder,
      selectedAlerts,
      selectedAlert,
      isModalVisible,
      isLoading,
      modal,
      closeButton,
      isOwnerModalVisible,
      newOwnerUsername,
      handleEscape,
      attributeDisplayNames,
      attributeOrder,
      fetchCurrentUser,
      fetchAlerts,
      formatTimestamp,
      filterAlerts,
      sortData,
      changeOwner,
      confirmChangeOwner,
      toggleStatus,
      updatePagination,
      goToPage,
      totalPages,
      paginatedAlerts,
      isAllSelected,
      toggleSelectAll,
      previousPage,
      nextPage,
      showModal,
      closeModal,
      formatKey,
    };
  },
};
</script>


<style scoped>
.alert-details-container {
  max-width: 100%;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.alert-details-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 20px;
}

.alert-details-header h1 {
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

.change-owner-container {
  margin-left: auto; /* Pushes the button to the right side */
}

.btn-change-owner {
  padding: 5px 15px;
  background-color: red;
  color: white;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #d32f2f;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);

}

.btn-change-owner:hover {
  background-color: darkred;
  border: 2px solid darkred;
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3);
}

.status-button {
  padding: 5px 10px;
  border: none;
  border-radius: 10px;
  font-size: 0.5rem;
  cursor: pointer;
  text-transform: uppercase;
  transition: all 0.3s ease;
}

/* Resolved Button Design */
.status-button.resolved {
  background-color: green; /* Green background */
  color: white; /* White text */
  border: 2px solid green; /* Slightly darker green border */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2); /* Add a shadow */
}

.status-button.resolved:hover {
  background-color: darkgreen; /* Slightly lighter green */
  border: 2px solid darkgreen; /* Slightly darker red border */
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3); /* Add hover shadow */
}

/* Unresolved Button Design */
.status-button.unresolved {
  background-color: #f44336; /* Red background */
  color: white; /* White text */
  border: 2px solid #d32f2f; /* Slightly darker red border */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2); /* Add a shadow */
}

.status-button.unresolved:hover {
  background-color: darkred; /* Slightly lighter red */
  border: 2px solid darkred; /* Slightly darker red border */
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3); /* Add hover shadow */
}

/* Disabled State */
.status-button:disabled {
  background-color: #d3d3d3; /* Light gray */
  color: #7a7a7a; /* Darker gray for text */
  cursor: not-allowed; /* Disabled cursor */
  border: 2px solid grey; /* Gray border */
  box-shadow: none; /* No shadow */
}

.status-button:disabled:hover {
  background-color: #d3d3d3; /* Light gray */
  color: #7a7a7a; /* Darker gray for text */
  cursor: not-allowed; /* Disabled cursor */
  border: 2px solid grey; /* Gray border */
  box-shadow: none; /* No shadow */
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

.alerts-table {
  width: 100%;
  border-collapse: collapse;
}

.alerts-table th {
  position: sticky;
  top: 0;
  background-color: #000000;
  z-index: 1; /* Ensure it stays above other elements */
  color: #ffffff;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
}

.alerts-table td {
  font-size: 0.9rem;
  border-right: 1px solid #ccc;
  word-wrap: break-word;
  max-width: 250px; /* Adjust as needed */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alerts-table th,
.alerts-table td {
  text-align: center;
  padding: 10px;
  border-bottom: 1px solid #ccc;
}

.alerts-table tbody tr:hover {
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
.alert-details {
  display: flex;
  flex-direction: column; /* Arrange items vertically */
  gap: 10px; /* Add spacing between each row */
  margin-bottom: 20px; /* Add spacing below the details */
}

/* Each row of key-value data */
.alert-detail {
  display: flex;
  justify-content: flex-start; /* Align content to the left */
  align-items: center; /* Align items vertically */
  gap: 10px; /* Add spacing between key, separator, and value */
  
}

/* Style for the key */
.alert-key {
  font-weight: bold;
  width: 150px; /* Set a fixed width for keys for proper alignment */
  text-align: left; /* Align the key text to the left */
  color: black;
}

/* Separator style */
.alert-separator {
  font-weight: bold;
  color: black;
}

/* Style for the value */
.alert-value {
  text-align: left; /* Align the value text to the left */
  color: blue;
  flex-grow: 1; /* Let the value take the remaining space */
  font-family: 'Courier New', Courier, monospace; /* Monospace font for alignment */
  font-weight: bold;
  font-size: 0.9 rem;
}

/* Adjust the modal content alignment */
.modal-content-details {
  background: white;
  border-radius: 30px;
  padding: 20px;
  width: 90%;
  max-width: 600px;
  min-width: 300px;
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

.modal-content-changeOwner {
  width: 50%;
  min-width: 200px;
  max-width: 400px;
  background: white;
  border-radius: 30px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.modal-label {
  font-size: 1rem;
}

.modal-input {
  padding: 10px;
  border: 2px solid gray;
  border-radius: 20px;
  width: 250px;
}

.modal-input::placeholder {
  color: gray;
  font-size: 0.8rem;
  font-weight: bold;
}

.modal-input:focus {
  border: 2px solid rgb(0, 0, 0);
  font-size: 0.9rem;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.modal-button-confirm {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.modal-button-confirm:hover {
  background-color: #0056b3;
  transform: scale(1.05);
}

.modal-button-cancel {
  padding: 10px 20px;
  background-color: red;
  color: white;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.modal-button-cancel:hover {
  background-color: darkred;
  transform: scale(1.05);
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
