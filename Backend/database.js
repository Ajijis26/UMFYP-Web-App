// database.js
const mysql = require('mysql2');
const config = require('./config');

// Connection for userdata schema
const userdataConnection = mysql.createConnection(config.db_userdata);
userdataConnection.connect((err) => {
  if (err) {
    console.error('Error connecting to userdata database:', err);
    process.exit(1);
  } else {
    console.log('Connected to userdata database');
  }
});

// Connection for ids_logs_db schema
const idsLogsConnection = mysql.createConnection(config.db_ids_logs);
idsLogsConnection.connect((err) => {
  if (err) {
    console.error('Error connecting to ids_logs_db database:', err);
    process.exit(1);
  } else {
    console.log('Connected to ids_logs_db database');
  }
});

module.exports = {
  userdataConnection,
  idsLogsConnection,
};
