require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authenticateToken = require('./authMiddleware');
const {
  registerUser,
  loginUser,
  fetchUserDetails,
  fetchAllUsers,
  deleteUsers,
  updateUserDetails,
  getCurrentUser,
} = require('./queries/userQueries');
const {
  getIdsLogs,
  fetchAlerts,
  changeAlertOwner,
  updateAlertStatus,
  processLabelStats,
  getRealTimeAlerts,
  getLogsGroupedByDate,
} = require('./queries/idsLogsQueries');

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL , // Use environment variable for Netlify
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(cookieParser());

// User Routes
app.post('/api/register', authenticateToken, async (req, res) => {
  const { role, fullname, username, email, password } = req.body;

  // Ensure only Admins can register users
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Access denied. Only Admins can register new users.' });
  }

  try {
    const response = await registerUser(role, fullname, username, email, password);
    res.status(response.status).json(response);
  } catch (err) {
    res.status(err.status).json({ error: err.error });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const response = await loginUser(username, password);

    // Set token as a cookie
    res.cookie('token', response.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });

    res.status(response.status).json({
      message: response.message,
      token: response.token,
      user: response.user,
    });
  } catch (err) {
    res.status(err.status).json({ error: err.error });
  }
});

app.get('/api/users/:username', authenticateToken, async (req, res) => {
  const { username } = req.params;
  try {
    const response = await fetchUserDetails(username);
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.status).json({ error: err.error });
  }
});

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const response = await fetchAllUsers();
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.status).json({ error: err.error });
  }
});

//Update User Route
app.put('/api/users/:username', authenticateToken, async (req, res) => {
  const { username } = req.params;
  const { fullname, email, oldPassword, newPassword, newUsername } = req.body;
  try {
    const response = await updateUserDetails(username, fullname, email, oldPassword, newPassword, newUsername);
    console.log("Updated Token:", response.token); // Debugging
    res.status(response.status).json({ message: response.message, token: response.token, });
  } catch (err) {
    console.error("Error in updateUserDetails route:", err); // Debugging
    res.status(err.status).json({ error: err.error });
  }
});

app.delete('/api/users', authenticateToken, async (req, res) => {
  const { userIds } = req.body;
  try {
    const response = await deleteUsers(userIds);
    res.status(response.status).json(response);
  } catch (err) {
    res.status(err.status).json({ error: err.error });
  }
});

app.get('/api/currentuser', authenticateToken, async (req, res) => {
  try {
    const { username } = req.user; // Extract username from decoded token
    if (!username) {
      return res.status(400).json({ error: 'Invalid token, username not found.' });
    }

    const response = await getCurrentUser(username); // Fetch user details from DB
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(err.status || 500).json({ error: err.error || 'Failed to fetch user information.' });
  }
});

app.get('/api/usernameslist', authenticateToken, async (req, res) => {
  try {
    const response = await fetchAllUsers();
    const usernames = response.data.map((user) => user.username); // Extract usernames
    res.status(200).json(usernames);
  } catch (err) {
    console.error("Error fetching usernames:", err);
    res.status(err.status || 500).json({ error: err.error || "Failed to fetch usernames" });
  }
});




// IDS Logs Routes
app.get('/api/ids-logs', authenticateToken, async (req, res) => {
  try {
    const { sourceIP } = req.query;
    const response = await getIdsLogs(sourceIP);
    res.status(response.status).json(response.status === 200 ? response.data : { error: response.error });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/alerts', authenticateToken, async (req, res) => {
  try {
    const { label } = req.query;
    const response = await fetchAlerts(label);
    res.status(response.status).json(response.status === 200 ? response.data : { error: response.error });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const { weekStart, weekEnd } = req.query;

    // Generate all days of the week for alerts
    const startDate = new Date(weekStart);
    const alertdaysOfWeek = Array.from({ length: 7 }).map((_, i) => {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      return {
        name: currentDate.toLocaleDateString("en-US", { weekday: "long" }),
        date: currentDate.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" }),
        count: 0, // Default to 0 alerts
      };
    });

    // Generate all days of the week for logs
    const logsdaysOfWeek = Array.from({ length: 7 }).map((_, i) => {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      return {
        date: currentDate.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" }),
        count: 0, // Default to 0 logs
      };
    });

    // Fetch logs and filter by label and date range
    const logsResponse = await getIdsLogs();
    const logs = logsResponse.data || [];

    // Filter logs for alerts and group them by date
    const filteredLogs = logs.filter((log) => {
      const logDate = new Date(log.Timestamp);
      const label = log.Label ? log.Label.toLowerCase() : "";
      return (
        label !== "normal" &&
        logDate >= new Date(weekStart) &&
        logDate <= new Date(weekEnd)
      );
    });

    // Populate alertdaysOfWeek with alert counts
    filteredLogs.forEach((log) => {
      const logDate = new Date(log.Timestamp).toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });
      const dayIndex = alertdaysOfWeek.findIndex((day) => day.date === logDate);
      if (dayIndex !== -1) {
        alertdaysOfWeek[dayIndex].count += 1; // Increment the count for the matching day
      }
    });

    // Populate logsdaysOfWeek with all logs counts
    logs.forEach((log) => {
      const logDate = new Date(log.Timestamp).toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });
      const dayIndex = logsdaysOfWeek.findIndex((day) => day.date === logDate);
      if (dayIndex !== -1) {
        logsdaysOfWeek[dayIndex].count += 1; // Increment the count for the matching day
      }
    });

    // Fetch alert label distribution
    const alertsResponse = await fetchAlerts();
    const alerts = alertsResponse.data || [];
    const labelStats = processLabelStats(alerts);

    // Fetch real-time alerts
    const realTimeAlerts = await getRealTimeAlerts();

    // Return aggregated dashboard data
    res.status(200).json({
      alertsPerDay: alertdaysOfWeek, // Use alertdaysOfWeek to ensure all days are included
      logsPerDay: logsdaysOfWeek, // Use logsdaysOfWeek for logs count
      alertLabels: labelStats,
      realTimeAlerts: realTimeAlerts,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});


app.get('/api/logs-dashboard', authenticateToken, async (req, res) => {
  try {
    const { weekStart, weekEnd } = req.query;

    const response = await getLogsGroupedByDate(weekStart, weekEnd);
    res.status(response.status).json(response.status === 200 ? response.data : { error: response.error });
  } catch (err) {
    console.error('Error fetching dashboard logs:', err);
    res.status(500).json({ error: 'Failed to fetch logs data' });
  }
});

app.put('/api/alerts/change-owner', authenticateToken, async (req, res) => {
  const { alerts, newOwner } = req.body;

  if (!Array.isArray(alerts) || alerts.length === 0 || !newOwner) {
    return res.status(400).json({ error: 'Invalid request data' });
  }

  console.log("Alerts received:", alerts); // Debug log
  console.log("New owner:", newOwner); // Debug log

  try {
    const response = await changeAlertOwner(alerts, newOwner);
    res.status(response.status).json(
      response.status === 200
        ? { message: response.message }
        : { error: response.error }
    );
  } catch (err) {
    console.error("Error in change-owner route:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put('/api/alerts/status', authenticateToken, async (req, res) => {
  const { ConnectionID, Timestamp, status } = req.body;

  // Extract username from the authenticated user
  const { username } = req.user;

  // Check if all required fields are provided
  if (!ConnectionID || !Timestamp || !status) {
    return res.status(400).json({ error: 'Invalid request data. Ensure all fields are provided.' });
  }

  try {
    // Pass the username as LastUpdatedBy
    const response = await updateAlertStatus(ConnectionID, Timestamp, status, username);

    res.status(response.status).json(
      response.status === 200
        ? { message: response.message }
        : { error: response.error }
    );
  } catch (err) {
    console.error('Error updating alert status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout Route
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

//A fallback route to handle unmatched requests
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found' });
});



// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

