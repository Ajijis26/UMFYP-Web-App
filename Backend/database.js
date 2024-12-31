// database.js
const mysql = require('mysql2');
const AWS = require('aws-sdk');
const config = require('./config');

// Connection for userdata schema
const userdataConnection = mysql.createConnection(config.db_userdata);
userdataConnection.connect((err) => {
  if (err) {
    console.error('Error connecting to AWS RDS:', err.message, err.stack);
    process.exit(1);
  } else {
    console.log('Successfully connected to AWS RDS database (Userdata Table)');
  }
});

// DynamoDB Setup
AWS.config.update({
  region: config.aws_dynamodb.region,
  accessKeyId: config.aws_dynamodb.accessKeyId,
  secretAccessKey: config.aws_dynamodb.secretAccessKey,
});

// DynamoDB Client
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Test DynamoDB Connection
(async () => {
  try {
    const params = {
      TableName: config.aws_dynamodb.tableName,
      Limit: 1, // Try to fetch 1 item to confirm the table exists
    };
    await dynamoDB.scan(params).promise();
    console.log(`Successfully connected to the DynamoDB table: ${config.aws_dynamodb.tableName}`);
  } catch (error) {
    console.error('Error connecting to DynamoDB:', error.message, error.stack);
    process.exit(1);
  }
})();

module.exports = {
  userdataConnection,
  dynamoDB,
};
