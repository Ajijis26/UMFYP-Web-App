const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { userdataConnection } = require('../database');
const secretKey = process.env.JWT_SECRET_KEY || 'SecretKeyU2001015HAHAHA';
const tokenExpiry = '1h';

async function registerUser(role, fullname, username, email, password) {
  return new Promise((resolve, reject) => {
    // Basic validation
    if (!role || !fullname || !username || !email || !password) {
        return reject({ status: 400, error: 'All fields are required.' });
      }
  
      if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return reject({ status: 400, error: 'Invalid email format.' });
      }
  
      if (password.length < 8) {
        return reject({ status: 400, error: 'Password must be at least 8 characters long.' });
      }
    
    const checkUserSql = 'SELECT * FROM users WHERE username = ? OR email = ?';
    userdataConnection.query(checkUserSql, [username, email], async (checkErr, results) => {
      if (checkErr) return reject({ status: 500, error: 'Internal server error.' });

      if (results.length > 0) {
        return reject({ status: 400, error: 'Username or email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const insertSql = 'INSERT INTO users (role, full_name, username, email, password, created_at) VALUES (?, ?, ?, ?, ?, NOW())';
      userdataConnection.query(insertSql, [role, fullname, username, email, hashedPassword], (insertErr) => {
        if (insertErr) return reject({ status: 500, error: 'Error registering user.' });
        resolve({ status: 201, message: 'User registered successfully' });
      });
    });
  });
}

async function loginUser(username, password) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE username = ?';
    userdataConnection.query(sql, [username], async (err, results) => {
        if (err) {
            console.error('Database error during login:', err.message);
            return reject({ status: 500, error: 'Internal server error during login' });
        }
      if (results.length === 0) return reject({ status: 401, error: 'Invalid credentials' });

      const user = results[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match) return reject({ status: 401, error: 'Invalid credentials' });

      const token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          username: user.username,
          fullname: user.full_name,
          email: user.email,
        },
        secretKey,
        { expiresIn: tokenExpiry }
      );

      resolve({ status: 200, message: 'Login successful', token, user: { id: user.id, role: user.role } });
    });
  });
}

async function updateUserDetails(username, fullname, email, oldPassword, newPassword, newUsername) {
    return new Promise(async (resolve, reject) => {
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
          return reject({ status: 404, error: 'User not found' });
        }
  
        const user = userResult;
  
        // Validate old password if a new password is provided
        if (newPassword) {
          if (!oldPassword) {
            return reject({ status: 400, error: 'Old password is required to update your password' });
          }
  
          const isMatch = await bcrypt.compare(oldPassword, user.password);
          if (!isMatch) {
            return reject({ status: 400, error: 'Old password is incorrect' });
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
            return reject({ status: 400, error: 'Username already exists. Please choose another one.' });
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
  
        resolve({ status: 200, message: 'User details updated successfully' });
      } catch (err) {
        console.error('Error updating user details:', err);
        reject({ status: 500, error: 'Internal server error' });
      }
    });
}

async function fetchUserDetails(username) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT role, full_name AS fullname, username, email FROM users WHERE username = ?';
    userdataConnection.query(sql, [username], (err, results) => {
      if (err) return reject({ status: 500, error: 'Error fetching user details' });
      if (results.length === 0) return reject({ status: 404, error: 'User not found' });
      resolve({ status: 200, data: results[0] });
    });
  });
}

async function fetchAllUsers() {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, role, username, full_name AS fullname, email, DATE_FORMAT(created_at, "%Y-%m-%d") AS createdDate FROM users';
    userdataConnection.query(sql, (err, results) => {
      if (err) return reject({ status: 500, error: 'Internal server error' });
      resolve({ status: 200, data: results });
    });
  });
}

async function deleteUsers(userIds) {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM users WHERE id IN (?)';
    userdataConnection.query(sql, [userIds], (err) => {
      if (err) return reject({ status: 500, error: 'Internal server error' });
      resolve({ status: 200, message: 'Users deleted successfully' });
    });
  });
}

module.exports = {
  registerUser,
  loginUser,
  updateUserDetails,
  fetchUserDetails,
  fetchAllUsers,
  deleteUsers,
};
