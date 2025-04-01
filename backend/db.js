const { Pool } = require("pg");

const pool = new Pool({
  user: "admin",
  host: "localhost",
  database: "bucketlist",
  password: "secret",
  port: 5432,
});

module.exports = pool;
