const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || "admin",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "bucketlist",
  password: process.env.DB_PASSWORD || "secret",
  port: process.env.DB_PORT || 5432,
});

// Test database connection
pool
  .connect()
  .then(() => {
    console.log("Successfully connected to PostgreSQL database");
  })
  .catch((err) => {
    console.error("Error connecting to PostgreSQL database:", err);
  });

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
