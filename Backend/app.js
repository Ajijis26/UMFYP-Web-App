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
} = require('./queries/idsLogsQueries');

const app = express();

// Middleware
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// User Routes
app.post('/api/register', async (req, res) => {
  const { role, fullname, username, email, password } = req.body;
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
      secure: false, // Set to true in production with HTTPS
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

app.put('/api/users/:username', authenticateToken, async (req, res) => {
  const { username } = req.params;
  const { fullname, email, oldPassword, newPassword, newUsername } = req.body;
  try {
    const response = await updateUserDetails(username, fullname, email, oldPassword, newPassword, newUsername);
    res.status(response.status).json({ message: response.message });
  } catch (err) {
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
  const { ConnectionID, SrcIP, status } = req.body;

  // Extract username from the authenticated user
  const { username } = req.user;

  // Check if all required fields are provided
  if (!ConnectionID || !SrcIP || !status) {
    return res.status(400).json({ error: 'Invalid request data. Ensure all fields are provided.' });
  }

  try {
    // Pass the username as LastUpdatedBy
    const response = await updateAlertStatus(ConnectionID, SrcIP, status, username);

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


// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
