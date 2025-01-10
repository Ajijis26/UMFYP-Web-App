<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>Dashboard</h1>

      <!-- Week Selector -->
      <div class="week-selector">
        <label for="weekStart">Select Week:</label>
        <input type="date" id="weekStart" v-model="weekStart" @change="onWeekChange" />
      </div>

      <div class="alertslogs-chart-container">
        <!-- Alerts Detected Over Time -->
        <div class="alerts-chart-section">
          <h2>Alerts Detected Over Time</h2>
          <div class="chart-container">
            <!-- Loading Spinner Overlay -->
            <div v-if="chartLoading" class="loading-overlay">
              <div class="spinner"></div>
              <p>Loading chart...</p>
            </div>
            <!-- Chart Canvas -->
            <canvas id="alertsChart"></canvas>
          </div>
        </div>

        <!-- Logs Over Time -->
        <div class="logs-chart-section">
          <h2>Logs Over Time</h2>
          <div class="chart-container">
            <!-- Loading Spinner Overlay -->
            <div v-if="logsChartLoading" class="loading-overlay">
              <div class="spinner"></div>
              <p>Loading chart...</p>
            </div>
            <!-- Chart Canvas -->
            <canvas id="logsChart"></canvas>
          </div>
        </div>

      </div>
      

      <!-- Alert Label Distribution -->
      <div class="alert-label-section">
        <h2>Alert Labels Distribution</h2>
        <div class="alert-label-table-section">
          <table class="alert-label-table">
            <thead>
              <tr>
                <th>Alert Label</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              <!-- Display Loading -->
              <tr v-if="isLoadingAlertLabels">
                <td colspan="3" style="text-align: center;">Loading...</td>
              </tr>
              <!-- Display No Data Found -->
              <tr v-else-if="alertLabels.length === 0">
                <td colspan="3" style="text-align: center;">No data found</td>
              </tr>
              <!-- Display Data -->
              <tr v-else v-for="label in alertLabels" :key="label.name">
                <td>{{ label.name.toUpperCase() }}</td>
                <td>{{ label.count }}</td>
                <td>{{ label.percentage }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Real-Time Alerts -->
      <div class="real-time-alerts-section">
        <h2>Real-Time Alerts</h2>
        <div class="real-time-table-section">
          <table class="real-time-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Connection ID</th>
                <th>Label</th>
                <th>Owner</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <!-- Display Loading -->
              <tr v-if="isLoadingRealTimeAlerts">
                <td colspan="5" style="text-align: center;">Loading...</td>
              </tr>
              <!-- Display No Data Found -->
              <tr v-else-if="realTimeAlerts.length === 0">
                <td colspan="5" style="text-align: center;">No data found</td>
              </tr>
              <!-- Display Data -->
              <tr v-else v-for="alert in realTimeAlerts" :key="alert.timestamp">
                <td>{{ formatTimestamp(alert.timestamp) }}</td>
                <td>{{ alert.connectionID }}</td>
                <td>{{ alert.label.toUpperCase() }}</td>
                <td>{{ alert.owner || 'Unassigned' }}</td>
                <td :class="{ resolved: alert.status === 'Resolved', unresolved: alert.status !== 'Resolved' }">
                  {{ alert.status.toUpperCase() }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>


    </div>
  </div>
</template>

<script>
import { onMounted, ref, nextTick, onUnmounted } from "vue";
import axios from "axios";
import Chart from "chart.js/auto";
import Swal from "sweetalert2";

export default {
  name: "Dashboard",
  setup() {
    const alertsPerDay = ref([]); // Data for alerts detected over time
    const logsPerDay = ref([]);
    const alertLabels = ref([]); // Data for alert label distribution
    const realTimeAlerts = ref([]); // Data for real-time alerts
    const weekStart = ref(""); // Start date of the selected week
    const chartLoading = ref(false);
    const logsChartLoading = ref(false);
    const isLoadingAlertLabels = ref(true); // Loading state for Alert Labels
    const isLoadingRealTimeAlerts = ref(true);
    let alertsChartInstance = null;
    let logsChartInstance = null;
    let refreshInterval = null; // To store the interval ID

    // Format the timestamp to 'yyyy-mm-dd hh:mm:ss'
    const formatTimestamp = (timestamp) => {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const fetchDashboardData = async () => {
      if (!weekStart.value) return;

      isLoadingRealTimeAlerts.value = true;
      isLoadingAlertLabels.value = true;
      logsChartLoading.value = true;
      chartLoading.value = true; // Start chart loading
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;

        const startDate = new Date(weekStart.value);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);

        const response = await axios.get(`${backendUrl}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          params: {
            weekStart: startDate.toISOString(),
            weekEnd: endDate.toISOString(),
          },
        });

        const data = response.data;

        alertsPerDay.value = data.alertsPerDay || [];
        alertLabels.value = data.alertLabels || [];
        realTimeAlerts.value = data.realTimeAlerts || [];

        // Process Logs Data
        logsPerDay.value = data.logsPerDay || [];

        await nextTick(); // Ensure DOM is updated before rendering chart
        renderAlertsChart();
        renderLogsChart();
      } catch (error) {
        console.error("Error fetching dashboard data:", error);

        // Handle token expiration or unauthorized access
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Use SweetAlert2 for token expiration
          Swal.fire({
            title: "Session Expired",
            text: "Your session has expired. Please log in again.",
            icon: "warning",
            confirmButtonText: "OK",
          }).then(() => {
            localStorage.removeItem("token"); // Clear token from localStorage
            window.location.href = "/"; // Redirect to login page
          });
        }
      } finally {
        chartLoading.value = false; // End chart loading
        logsChartLoading.value = false;
        isLoadingAlertLabels.value = false;
        isLoadingRealTimeAlerts.value = false;
      }
    };

    const fetchAlertLabels = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;

        const response = await axios.get(`${backendUrl}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const updatedAlertLabels = response.data.alertLabels || [];

        // Sort by percentage in descending order
        updatedAlertLabels.sort((a, b) => b.percentage - a.percentage);

        alertLabels.value = updatedAlertLabels;

        console.log("Updated and Sorted Alert Labels:", alertLabels.value); // Debugging log
      } catch (error) {
        console.error("Error fetching alert label data:", error);

        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Use SweetAlert2 for token expiration
          Swal.fire({
            title: "Session Expired",
            text: "Your session has expired. Please log in again.",
            icon: "warning",
            confirmButtonText: "OK",
          }).then(() => {
            localStorage.removeItem("token"); // Clear token from localStorage
            window.location.href = "/"; // Redirect to login page
          });
        }
      }
    };


    const fetchRealTimeData = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL;

        const response = await axios.get(`${backendUrl}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const newRealTimeAlerts = response.data.realTimeAlerts || [];

        // Merge existing data with new data and sort by timestamp (newest first)
        realTimeAlerts.value = mergeData(realTimeAlerts.value, newRealTimeAlerts, "timestamp").sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp) // Sort descending by timestamp
        );

        console.log("Updated Real-Time Alerts:", realTimeAlerts.value); // Debugging log
      } catch (error) {
        console.error("Error fetching real-time data:", error);

        // Handle token expiration
        if (error.response && error.response.status === 401) {
          Swal.fire({
            title: "Session Expired",
            text: "Your session has expired. Please log in again.",
            icon: "warning",
            confirmButtonText: "OK",
          }).then(() => {
            localStorage.removeItem("token");
            window.location.href = "/";
          });
        }
      }
    };

    const mergeData = (existingData, newData, uniqueKey) => {
      const existingDataMap = new Map(existingData.map((item) => [item[uniqueKey], item]));

      // Merge new data into existing data
      newData.forEach((newItem) => {
        existingDataMap.set(newItem[uniqueKey], newItem);
      });

      // Convert the map back to an array, filtering out resolved alerts
      return Array.from(existingDataMap.values()).filter((item) => item.status !== "Resolved");
    };


    const renderAlertsChart = () => {
      const canvas = document.getElementById("alertsChart");
      if (!canvas) {
        console.error("Canvas element not found!");
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Canvas context not available!");
        return;
      }

      // Generate labels with the format: dayname\ndd/mm/yyyy
      const startDate = new Date(weekStart.value);
      const labels = Array.from({ length: 7 }).map((_, i) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long" });
        const date = currentDate.toLocaleDateString("en-GB");
        return `${dayName}\n${date}`;
      });

      const data = alertsPerDay.value.map((day) => day.count);

      // Find the maximum value in data to adjust the y-axis
      const maxValue = Math.max(...data) || 1;
      const yAxisMax = Math.ceil(maxValue / 5) * 5;

      // Destroy existing chart instance before rendering a new one
      if (alertsChartInstance) {
        alertsChartInstance.destroy();
      }

      alertsChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Alerts Detected ",
              data,
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: "#000",
                font: { size: 12 },
                callback: function (value) {
                  const label = this.getLabelForValue(value);
                  return label.split("\n");
                },
              },
            },
            y: {
              beginAtZero: true,
              max: yAxisMax,
              ticks: {
                color: "#333",
                callback: function (value) {
                  return value % 1 === 0 ? value : "";
                },
              },
              grid: { color: "rgba(200, 200, 200, 0.2)" },
            },
          },
        },
      });
    };

    const renderLogsChart = () => {
      const canvas = document.getElementById("logsChart");
      if (!canvas) {
        console.error("Canvas element for Logs Chart not found!");
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error("Canvas context for Logs Chart not available!");
        return;
      }

      const startDate = new Date(weekStart.value);
      const labels = Array.from({ length: 7 }).map((_, i) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dayName = currentDate.toLocaleDateString("en-US", { weekday: "long" });
        const date = currentDate.toLocaleDateString("en-GB");
        return `${dayName}\n${date}`;
      });

      const data = logsPerDay.value.map((day) => day.count);

      const maxValue = Math.max(...data) || 1;
      const yAxisMax = Math.ceil(maxValue / 5) * 5;

      if (logsChartInstance) {
        logsChartInstance.destroy();
      }

      logsChartInstance = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Logs Collected ",
              data,
              backgroundColor: "rgba(255, 159, 64, 0.2)",
              borderColor: "rgba(255, 159, 64, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            x: {
              grid: { display: false },
              ticks: {
                color: "#000",
                font: { size: 12 },
                callback: function (value) {
                  const label = this.getLabelForValue(value);
                  return label.split("\n");
                },
              },
            },
            y: {
              beginAtZero: true,
              max: yAxisMax,
              ticks: {
                color: "#333",
                callback: function (value) {
                  return value % 1 === 0 ? value : "";
                },
              },
              grid: { color: "rgba(200, 200, 200, 0.2)" },
            },
          },
        },
      });
    };


    const onWeekChange = () => {
      if (weekStart.value) {
        fetchDashboardData().then(() => {
        // Sort realTimeAlerts by timestamp in descending order
        alertLabels.value.sort((a, b) => b.percentage - a.percentage);
        realTimeAlerts.value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }); // Fetch new data for the selected week
      }
    };

    onMounted(() => {
      // Get today's date in local time
      const today = new Date();
      const localDate = new Date(today); // Already in local timezone
      weekStart.value = localDate.toLocaleDateString("en-CA"); // Format as "YYYY-MM-DD" for the date input

      fetchDashboardData().then(() => {
        // Sort realTimeAlerts by timestamp in descending order
        alertLabels.value.sort((a, b) => b.percentage - a.percentage);
        realTimeAlerts.value.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      });

      // Start refreshing real-time data every 30 seconds
      refreshInterval = setInterval(() => {
        fetchAlertLabels();
        fetchRealTimeData();
      }, 10000);
    });

    onUnmounted(() => {
      if (refreshInterval) {
        clearInterval(refreshInterval); // Clear the interval when the component is unmounted
      }
    });

    return {
      alertsPerDay,
      logsPerDay,
      alertLabels,
      realTimeAlerts,
      weekStart,
      onWeekChange,
      formatTimestamp,
      chartLoading,
      isLoadingAlertLabels,
      isLoadingRealTimeAlerts,
      logsChartLoading,
    };
  },
};
</script>

<style scoped>
.dashboard-container {
  max-width: 100%;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 60px rgba(0, 0, 0, 0.1);
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  flex-direction: column;
}

.dashboard-header h1 {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 5px;
  align-self: center;
}

/* Section Styling */
.week-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  align-items: center;
  align-self: center;
}

.week-selector input {
  padding: 2px;
}

.alertslogs-chart-container {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
}

.alerts-chart-section,
.logs-chart-section,
.alert-label-section,
.real-time-alerts-section {
  margin-bottom: 30px;
  background-color: lightgrey; /* Light gray border for sections */
  border-radius: 12px; /* Optional: Rounded corners */
  padding: 15px; /* Add some padding inside sections */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.chart-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.alerts-chart-section {
  flex: 1;
  min-width: 45%;
  margin-right: 30px;
}

.logs-chart-section {
  flex: 1;
  min-width: 45%;
}

h2 {
  margin-bottom: 10px;
  font-size: 1.5rem;
  font-weight: bold;
}

/* Chart Styling */
.chart-container {
  position: relative;
  width: 100%;
  max-width: 800px; /* Set max-width to control chart size */
  height: 400px; /* Set fixed height for the chart */
  margin: 0 auto; /* Center the chart */
}

/* Table Styling */
.alert-label-table-section {
  max-height: 65vh; /* Adjust height as needed */
  overflow-y: auto; /* Add vertical scrolling */
  overflow-x: auto;
  border: 1px solid #f8f8f8;
  background-color: #ccc;
}

.alert-label-table {
  width: 100%;
  border-collapse: collapse;
}

.alert-label-table th {
  position: sticky;
  top: 0;
  background-color: gray;
  z-index: 50;
  font-weight: bold;
  border-left: 1px solid gray;
  padding: 10px;
  text-align: center;
  font-size: 1rem;
}

.alert-label-table td {
  padding: 7px;
  text-align: center;
  border: 1px solid gray;
  font-size: 0.8rem;
}

.alert-label-table tr:hover{
  background-color: lightgoldenrodyellow;
}



.real-time-table-section {
  max-height: 65vh; /* Adjust height as needed */
  overflow-y: auto; /* Add vertical scrolling */
  overflow-x: auto;
  border: 1px solid #f8f8f8;
  background-color: #ccc;
}

.real-time-table {
  width: 100%;
  border-collapse: collapse;
}

.real-time-table th {
  position: sticky;
  top: 0;
  background-color: gray;
  z-index: 50;
  font-weight: bold;
  border-left: 1px solid gray;
  padding: 10px;
  text-align: center;
  font-size: 1rem;
}

.real-time-table td {
  padding: 7px;
  text-align: center;
  border: 1px solid gray;
  font-size: 0.8rem;
}

.real-time-table tr:hover{
  background-color: lightgoldenrodyellow;
}

.unresolved {
  color: red;
  font-weight: bold;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 60;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-top: 4px solid #000;
  border-radius: 50%;
  width: 40px;
  height: 40px;
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
</style>
