<template>
  <div class="alert-details-container">
    <div class="alert-details-header">
      <h1>IDS Alerts</h1>
      <div class="action-buttons">
        <!-- Search Input -->
        <input
          type="text"
          v-model="searchTerm"
          placeholder="Search Alerts (Log ID or Owner)"
          @input="filterAlerts"
          class="search-input"
        />
        <!-- Change Owner Button -->
        <button class="btn-change-owner" @click="changeOwner">
          <i class="fas fa-user-edit"></i> Change Owner
        </button>
      </div>
    </div>

    <!-- Alerts Table -->
    <table v-if="paginatedAlerts.length > 0" class="alerts-table">
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              :checked="isAllSelected"
              @change="toggleSelectAll"
            />
          </th>
          <th @click="sortData('id')">Log ID</th>
          <th @click="sortData('Timestamp')">Timestamp</th>
          <th @click="sortData('Port')">Port</th>
          <th @click="sortData('Owner')">Owner</th>
          <th @click="sortData('Status')">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(alert) in paginatedAlerts" :key="alert.id">
          <td>
            <input
              type="checkbox"
              v-model="selectedAlerts"
              :value="alert.id"
            />
          </td>
          <td>{{ alert.id }}</td>
          <td>{{ alert.Timestamp }}</td>
          <td>{{ alert.Port }}</td>
          <td>{{ alert.Owner }}</td>
          <td>
            <button
              class="status-button"
              :class="{ resolved: alert.Status === 'Resolved', unresolved: alert.Status === 'Unresolved' }"
              :disabled="alert.Owner !== currentUser"
              @click="toggleStatus(alert)"
            >
              {{ alert.Status }}
            </button>
          </td>
        </tr>
        <tr v-if="paginatedAlerts.length === 0">
          <td colspan="6">No alerts found.</td>
        </tr>
      </tbody>
    </table>

    <!-- No Alerts Message -->
    <div v-if="paginatedAlerts.length === 0" class="no-alerts-message">
      No alerts found.
    </div>

    <!-- Pagination -->
    <div v-if="filteredAlerts.length > 0" class="pagination">
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
  name: "AlertDetails",
  setup() {
    const currentUser = ref(""); // Current logged-in user
    const alerts = ref([]); // All alerts
    const filteredAlerts = ref([]); // Filtered alerts for search
    const selectedAlerts = ref([]); // Selected alert IDs
    const searchTerm = ref(""); // Search term
    const currentPage = ref(1); // Current page
    const alertsPerPage = 50; // Alerts per page
    const sortKey = ref(""); // Key to sort by
    const sortOrder = ref("asc"); // Sort order: ascending or descending


    // Fetch alerts from API
    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found. Please log in again.");

        const response = await axios.get("http://localhost:3000/api/alerts", {
          headers: { Authorization: `Bearer ${token}` },
        });

        alerts.value = response.data;
        filteredAlerts.value = response.data; // Initialize filtered alerts
      } catch (err) {
        console.error("Error fetching alerts:", err);
        alerts.value = [];
        alert("Failed to fetch alerts. Please try again.");
      }
    };

    // Filter alerts based on search term
    const filterAlerts = () => {
      const term = searchTerm.value;

      filteredAlerts.value = alerts.value.filter(
        (alert) =>
          alert.id.toString().includes(term) || // Exact Log ID match
          alert.Owner === term // Exact case-sensitive Owner match
      );
      currentPage.value = 1; // Reset to the first page after filtering
    };

    // Sort alerts based on a given key
    const sortData = (key) => {
      if (sortKey.value === key) {
        // Toggle sort order if the same key is clicked
        sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
      } else {
        // Set the new key and default to ascending
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

    // Get total pages for pagination
    const totalPages = computed(() =>
      Math.ceil(filteredAlerts.value.length / alertsPerPage)
    );

    // Get alerts for the current page
    const paginatedAlerts = computed(() => {
      const start = (currentPage.value - 1) * alertsPerPage;
      const end = start + alertsPerPage;
      return filteredAlerts.value.slice(start, end);
    });

    // Check if all alerts on the current page are selected
    const isAllSelected = computed(() => {
      const alertIds = paginatedAlerts.value.map((alert) => alert.id);
      return (
        alertIds.length > 0 &&
        alertIds.every((id) => selectedAlerts.value.includes(id))
      );
    });

    // Toggle "Select All" functionality
    const toggleSelectAll = () => {
      const alertIds = paginatedAlerts.value.map((alert) => alert.id);
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

    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found. Please log in again.");
        console.log("Token sent in request:", token);

        const response = await axios.get("http://localhost:3000/api/currentuser", {
          headers: { Authorization: `Bearer ${token}` },
        });

        currentUser.value = response.data.username;
        console.log("Current User:", currentUser.value);
      } catch (err) {
        console.error("Error fetching current user:", err);
        alert("Failed to fetch user information. Please log in again.");
        window.location.href = "/"; // Redirect to login if user details can't be fetched
      }
    };



    // Pagination controls
    const previousPage = () => {
      if (currentPage.value > 1) currentPage.value--;
    };

    const nextPage = () => {
      if (currentPage.value < totalPages.value) currentPage.value++;
    };

    // Change the owner of selected alerts
    const changeOwner = async () => {
      if (selectedAlerts.value.length === 0) {
        alert("Please select at least one alert to change the owner.");
        return;
      }

      const newOwner = prompt("Enter new owner username:");
      if (!newOwner) {
        alert("Owner change canceled.");
        return;
      }

      try {
        await axios.put("http://localhost:3000/api/alerts/change-owner", {
          alertIds: selectedAlerts.value,
          newOwner,
        });

        filteredAlerts.value.forEach((alert) => {
          if (selectedAlerts.value.includes(alert.id)) {
            alert.Owner = newOwner;
          }
        });

        selectedAlerts.value = [];
        alert("Owner updated successfully.");
      } catch (err) {
        console.error("Error updating owner:", err);
        alert("Failed to update owner.");
      }
    };

    // Toggle the status of an alert
    const toggleStatus = async (alert) => {
      if (alert.Owner !== currentUser.value) { // Case-sensitive comparison
        alert("You are not the owner of this alert. Please change the owner to yourself first.");
        return;
      }

      const newStatus = alert.Status === "Resolved" ? "Unresolved" : "Resolved";

      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found. Please log in again.");

        await axios.put(`http://localhost:3000/api/alerts/${alert.id}/status`, 
        { status: newStatus }, 
        {
          headers: { Authorization: `Bearer ${token}` },
        });

        alert.Status = newStatus; // Update status locally after success
        alert("Alert status updated successfully.");
      } catch (err) {
        console.error("Error updating alert status:", err);
        alert("Failed to update alert status.");
      }
    };


    onMounted(async () => {
  try {
    await fetchCurrentUser();
    await fetchAlerts();
  } catch (err) {
    console.error("Initialization failed:", err);
    alert("Error fetching data. Please check your connection or log in again.");
  }
});



    return {
      currentUser,
      alerts,
      filteredAlerts,
      searchTerm,
      selectedAlerts,
      currentPage,
      totalPages,
      paginatedAlerts,
      fetchAlerts,
      filterAlerts,
      sortData,
      changeOwner,
      toggleStatus,
      previousPage,
      nextPage,
      isAllSelected,
      toggleSelectAll,
    };
  },
};
</script>


<style scoped>
.alert-details-container {
  max-width: 1200px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.alert-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.alert-details-header h1 {
  font-size: 2rem;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 20px;
}

.search-input {
  width: 100%;
  padding: 5px;
  border: 1px solid #7a7a7a;
  border-radius: 5px;
}

.btn-change-owner {
  padding: 5px;
  font-size: 0.7rem;
  background-color: red;
  color: white;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid #d32f2f; /* Slightly darker red border */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2); /* Add a shadow */
}

.btn-change-owner:hover {
  background-color: darkred;
  border: 2px solid darkred; /* Slightly darker red border */
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3); /* Add a shadow */
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

.alerts-table {
  width: 100%;
  border-collapse: collapse;
}

.alerts-table th,
.alerts-table td {
  text-align: center;
  padding: 10px;
  border-bottom: 1px solid #ccc;
  font-size: 0.8rem;
}

.alerts-table th {
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
