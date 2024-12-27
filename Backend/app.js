// app.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Import bcrypt
const database = require('./database');
const { idsLogsConnection, userdataConnection } = require('./database');
const authenticateToken = require('./authMiddleware');

const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();

// CORS Configuration
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174']; // Allow multiple origins
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(bodyParser.json());
app.use(cookieParser());

// Environment variables
const secretKey = process.env.JWT_SECRET_KEY || 'SecretKeyU2001015HAHAHA';
const tokenExpiry = '1h'; // Define token expiry duration



// User Registration Endpoint
app.post('/api/register', async (req, res) => {
  const { role, fullname, username, email, password } = req.body;

  // Basic validation
  if (!role || !fullname || !username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  try {

    const checkUserSql = 'SELECT * FROM users WHERE username = ? OR email = ?';
    userdataConnection.query(checkUserSql, [username, email], async (checkErr, results) => {
      if (checkErr) {
        console.error('Error checking existing user:', checkErr);
        return res.status(500).json({ error: 'Internal server error.' });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: 'Username or email already exists.' });
      }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user data into the database
    const insertSql = 'INSERT INTO users (role, full_name, username, email, password) VALUES (?, ?, ?, ?, ?)';
      userdataConnection.query(insertSql, [role, fullname, username, email, hashedPassword], (insertErr, result) => {
        if (insertErr) {
          console.error('Error inserting user:', insertErr);
          return res.status(500).json({ error: 'Error registering user.' });
        }
        res.status(201).json({ message: 'User registered successfully' });
      });
    });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: 'Error registering user' });
  }
});



// Login Endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const sql = 'SELECT * FROM users WHERE username = ?';

  userdataConnection.query(sql, [username], async (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Internal server error during login' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = results[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        username: user.username,
        full_name: user.full_name, // Add full_name to the payload
        email: user.email,         // Add email to the payload
      },
      secretKey,
      { expiresIn: tokenExpiry }
    );
    

    // Set token as a cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'strict',
      maxAge: 3600000, // 1 hour
    });

    res.status(200).json({ message: 'Login successful', token, user: { id: user.id, role: user.role } });
    console.log('Login successful, sending token:', token);

  });
});



// Endpoint to fetch user details by username
app.get('/api/users/:username', authenticateToken, (req, res) => {
  const { username } = req.params;

  const sql = `
    SELECT 
      role, 
      full_name AS fullname, 
      username, 
      email 
    FROM users 
    WHERE username = ?
  `;

  userdataConnection.query(sql, [username], (err, results) => {
    if (err) {
      console.error('Error fetching user details:', err);
      return res.status(500).json({ error: 'Error fetching user details' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(results[0]);
  });
});



app.put('/api/users/:username', authenticateToken, async (req, res) => {
  const { username } = req.params;
  const { fullname, email, oldPassword, newPassword, newUsername } = req.body;

  const sqlGetUser = 'SELECT * FROM users WHERE username = ?';
  const sqlCheckUsername = 'SELECT * FROM users WHERE username = ?';
  const sqlUpdate = `
    UPDATE users 
    SET full_name = ?, email = ?, username = ?, password = ? 
    WHERE username = ?
  `;

  try {
    // Fetch user details
    const [userResult] = await new Promise((resolve, reject) => {
      userdataConnection.query(sqlGetUser, [username], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!userResult) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult;

    // Validate old password if a new password is provided
    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ error: 'Old password is required to update your password' });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: 'Old password is incorrect' });
      }
    }

    // Ensure new username is not already taken (if changed)
    if (newUsername && newUsername !== username) {
      const [usernameCheckResult] = await new Promise((resolve, reject) => {
        userdataConnection.query(sqlCheckUsername, [newUsername], (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

      if (usernameCheckResult) {
        return res.status(400).json({ error: 'Username already exists. Please choose another one.' });
      }
    }

    // Hash new password if provided, otherwise keep the existing password
    const hashedPassword = newPassword
      ? await bcrypt.hash(newPassword, 10)
      : user.password;

    // Update user details
    await new Promise((resolve, reject) => {
      userdataConnection.query(
        sqlUpdate,
        [fullname, email, newUsername || username, hashedPassword, username],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    // Generate a new token with updated details
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        username: newUsername || username,
        fullname,
        email,
      },
      secretKey,
      { expiresIn: tokenExpiry }
    );
    
    return res.status(200).json({ message: 'User details updated successfully', token });
  } catch (err) {
    console.error('Error updating user details:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Endpoint to fetch all users
app.get('/api/users', authenticateToken, (req, res) => {
  const sql = `
    SELECT 
      id, 
      role, 
      username, 
      full_name AS fullname, 
      email, 
      DATE_FORMAT(created_at, '%Y-%m-%d') AS createdDate
    FROM users
  `;

  userdataConnection.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching users:', {
        message: err.message,
        sqlMessage: err.sqlMessage,
        sql: err.sql,
      });
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json(results);
  });
});






app.delete('/api/users', authenticateToken, (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !userIds.length) {
    return res.status(400).json({ error: 'No user IDs provided for deletion.' });
  }

  const sql = `DELETE FROM users WHERE id IN (?)`;
  userdataConnection.query(sql, [userIds], (err, results) => {
    if (err) {
      console.error('Error deleting users:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.status(200).json({ message: 'Users deleted successfully' });
  });
});




// Endpoint to fetch IDS logs with optional filtering and formatted timestamps
app.get('/api/ids-logs', authenticateToken, (req, res) => {
  const { sourceIP } = req.query; // Optional query parameter for filtering by Source_IP

  let sql = `
    SELECT 
      id,
      DATE_FORMAT(Timestamp, '%Y-%m-%d %H:%i:%s') AS Timestamp,
      Source_IP,
      Destination_IP,
      Protocol,
      Port,
      Traffic_Volume,
      Action,
      Label
    FROM ids_logs
  `;
  const params = [];

  // If sourceIP query parameter is provided, add WHERE clause for filtering
  if (sourceIP) {
    sql += ' WHERE Source_IP LIKE ?';
    params.push(`%${sourceIP}%`);
  }

  idsLogsConnection.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error fetching IDS logs:', err);
      res.status(500).send('Error fetching IDS logs');
      return;
    }
    res.json(results); // Send the filtered logs to the client
  });
});




// Endpoint to fetch IDS Alerts with formatted timestamps
app.get('/api/alerts', authenticateToken, (req, res) => {
  const label = req.query.label || 'intrusion'; // Default to 'intrusion' if not provided
  const sql = `
    SELECT 
      id,
      DATE_FORMAT(Timestamp, '%Y-%m-%d %H:%i:%s') AS Timestamp,
      Port,
      Label,
      IFNULL(Owner, '-') AS Owner,
      Status
    FROM ids_logs
    WHERE Label = ?
  `;

  idsLogsConnection.query(sql, [label], (err, results) => {
    if (err) {
      console.error('Error fetching alerts:', err);
      res.status(500).send('Error fetching alerts');
      return;
    }
    res.json(results);
  });
});



app.put('/api/alerts/change-owner', (req, res) => {
  const { alertIds, newOwner } = req.body;
  const sql = `UPDATE ids_logs SET Owner = ? WHERE id IN (?)`;

  idsLogsConnection.query(sql, [newOwner, alertIds], (err, results) => {
    if (err) {
      console.error('Error updating alert owner:', err);
      res.status(500).send('Error updating alert owner');
      return;
    }
    res.status(200).send('Alert owner updated successfully');
  });
});



app.put('/api/alerts/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const { username } = req.user;

  if (!['Resolved', 'Unresolved'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const checkOwnerSql = `SELECT Owner FROM ids_logs WHERE id = ?`;
  const updateStatusSql = `UPDATE ids_logs SET Status = ? WHERE id = ?`;

  idsLogsConnection.query(checkOwnerSql, [id], (err, results) => {
    if (err) {
      console.error('Error checking alert owner:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    const owner = results[0].Owner;

    // Enforce case-sensitive ownership check
    if (owner !== username) {
      return res.status(403).json({ message: 'You are not the owner of this alert.' });
    }

    // Update status in the database
    idsLogsConnection.query(updateStatusSql, [status, id], (updateErr) => {
      if (updateErr) {
        console.error('Error updating alert status:', updateErr);
        return res.status(500).json({ message: 'Error updating alert status' });
      }

      res.status(200).json({ message: 'Alert status updated successfully' });
    });
  });
});



app.get("/api/currentuser", authenticateToken, (req, res) => {
  console.log("Authenticated user:", req.user);
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: User not found in request." });
  }
  res.status(200).json({ username: req.user.username });
});






app.put('/api/alerts/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log(`Updating status for ID: ${id}, New Status: ${status}`);

  if (!['Resolved', 'Unresolved'].includes(status)) {
    return res.status(400).send('Invalid status value');
  }

  const sql = `UPDATE ids_logs SET Status = ? WHERE id = ?`;
  idsLogsConnection.query(sql, [status, id], (err, results) => {
    if (err) {
      console.error('Error updating alert status:', err);
      res.status(500).send('Error updating alert status');
      return;
    }

    res.status(200).send('Alert status updated successfully');
  });
});




app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});


// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
