require('dotenv').config();

module.exports = {
  db_userdata: {
    host: process.env.DB_HOST, // Set in Render
    user: process.env.DB_USER, // Set in Render
    password: process.env.DB_PASSWORD, // Set in Render
    database: process.env.DB_NAME, // Set in Render
    port: process.env.DB_PORT || '3306', // Optional: default to 3306
  },
  aws_dynamodb: {
    region: process.env.AWS_REGION, // Set in Render
    accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Set in Render
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Set in Render
    tableName: process.env.AWS_DYNAMODB_TABLE_NAME, // Set in Render
  },
};
