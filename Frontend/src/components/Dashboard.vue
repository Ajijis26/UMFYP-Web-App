  <template>
    <div class="dashboard-container">
      <!-- Key Metrics Section -->
      <div class="metrics-section">
        <div class="metric-card">
          <h3>{{ totalAlerts }}</h3>
          <p>Alerts Detected</p>
          <div class="toggle-buttons">
            <button @click="setTimeFilter('daily')" :class="{ active: timeFilter === 'daily' }">Daily</button>
            <button @click="setTimeFilter('weekly')" :class="{ active: timeFilter === 'weekly' }">Weekly</button>
            <button @click="setTimeFilter('monthly')" :class="{ active: timeFilter === 'monthly' }">Monthly</button>
          </div>
        </div>
        <div class="metric-card">
          <h3>{{ resolvedAlerts }}</h3>
          <p>Alerts Resolved</p>
          <div class="toggle-buttons">
            <button @click="setTimeFilter('daily')" :class="{ active: timeFilter === 'daily' }">Daily</button>
            <button @click="setTimeFilter('weekly')" :class="{ active: timeFilter === 'weekly' }">Weekly</button>
            <button @click="setTimeFilter('monthly')" :class="{ active: timeFilter === 'monthly' }">Monthly</button>
          </div>
        </div>
      </div>


      <!-- Traffic Visualization Section -->
      <div class="traffic-section">
        <h2>Alerts Detected Over Time</h2>
        <canvas id="trafficChart"></canvas>
      </div>


      <!-- Real-Time Alert Table -->
      <div class="alerts-section">
        <h2>Real-Time Alerts</h2>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Source IP</th>
              <th>Destination IP</th>
              <th>Port</th>
              <th>Alert Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alert in alerts" :key="alert.id">
              <td>{{ alert.timestamp }}</td>
              <td>{{ alert.srcIP }}</td>
              <td>{{ alert.dstIP }}</td>
              <td>{{ alert.port }}</td>
              <td>{{ alert.type }}</td>
              <td :class="{'resolved': alert.status === 'Resolved', 'unresolved': alert.status !== 'Resolved'}">
                {{ alert.status }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>

  <script>
  import { ref, onMounted } from "vue";
  import Chart from "chart.js/auto";

  export default {
    name: "Dashboard",
    setup() {
      const totalAlerts = ref(10); // Example data
      const resolvedAlerts = ref(5); // Example data
      const timeFilter = ref("daily");
      const alerts = ref([
        {
          id: 1,
          timestamp: "2024-11-30 14:23:11",
          srcIP: "192.168.1.5",
          dstIP: "192.168.1.1",
          port: "443",
          type: "Port Scan",
          status: "Unresolved",
        },
        // Add more example alerts here
      ]);

      const setTimeFilter = (filter) => {
        timeFilter.value = filter;
        // Update data based on the selected time filter
      };

      const renderTrafficChart = () => {
        const ctx = document.getElementById("trafficChart").getContext("2d");

        // Create a gradient for the chart bars
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, "rgba(75, 192, 192, 1)");
        gradient.addColorStop(1, "rgba(75, 192, 192, 0.2)");

        new Chart(ctx, {
          type: "bar",
          data: {
            labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], // Added Saturday and Sunday
            datasets: [
              {
                label: "Alerts Detected",
                data: [12, 19, 3, 5, 2, 7, 8], // Example data for all days
                backgroundColor: gradient,
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 2,
                borderRadius: 10, // Rounded corners for the bars
                barPercentage: 0.6, // Bar thickness
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false, // Adjusts for custom container sizes
            plugins: {
              legend: {
                display: true,
                labels: {
                  color: "#333",
                  font: {
                    size: 14,
                  },
                },
              },
              tooltip: {
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                titleColor: "#fff",
                bodyColor: "#fff",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
              },
            },
            scales: {
              x: {
                ticks: {
                  color: "#333",
                  font: {
                    size: 12,
                  },
                },
                grid: {
                  display: false, // Hide gridlines for X-axis
                },
              },
              y: {
                beginAtZero: true,
                ticks: {
                  color: "#333",
                  font: {
                    size: 12,
                  },
                },
                grid: {
                  color: "rgba(200, 200, 200, 0.2)", // Light gridlines
                },
              },
            },
          },
        });
      };

      onMounted(() => {
        renderTrafficChart();
      });

      return {
        totalAlerts,
        resolvedAlerts,
        timeFilter,
        setTimeFilter,
        alerts,
      };
    },
  };
  </script>

  <style scoped>
  .dashboard-container {
    display: flex;
    flex-direction: column;
    padding: 0px;
  }

  h2{
    margin: 0;
    font-size: 2rem;
    font-weight: bold;
  }

  .metrics-section {
    display: flex;
    justify-content: space-around;
    margin: 0 0;
  }
  .metric-card {
    background-color: #f4f4f4;
    padding: 15px;
    border-radius: 20px;
    text-align: center;
    width: 25%;
  }
  h3 {
    margin: 0;
    font-size: 2.5rem;
    font-weight: bold;
  }
  
  .metric-card p {
    margin: 5px 0 10px;
    font-size: 1.3rem;
    font-weight: bold;
  }
  .toggle-buttons button {
    margin: 10px;
    padding: 15px 30px;
    font-size: 0.8rem;
    font-weight: bold;
    border: none;
    background-color: #c4c4c4;
    border-radius: 8px;
    cursor: pointer;
  }
  .toggle-buttons button.active {
    background-color: #4caf50;
    color: white;
  }


  .traffic-section {
    margin: 2.0px 0 50px; /* Increased bottom margin for spacing */
    height: 300px; /* Adjusted height for the chart */
    position: relative;
  }


  .alerts-section {
    margin-top: 20px; /* Added margin-top to push it further down */
  }
  .alerts-section table {
    width: 100%;
    border-collapse: collapse;
  }
  .alerts-section th {
    border: 1px solid rgb(0, 0, 0);
    background-color: silver;
    font-size: 1rem;
    padding: 8px;
  }
  .alerts-section td {
    border: 1px solid #000000;
    padding: 8px;
    font-size: 0.8rem;
    text-align: center;
  }
  .alerts-section tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  .alerts-section tr:hover {
    background-color: #f1f1f1;
  }
  .resolved {
    color: green;
  }
  .unresolved {
    color: red;
  }
  </style>

