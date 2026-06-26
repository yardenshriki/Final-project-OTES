const mysql = require("mysql2/promise");

const isRemote = process.env.DB_HOST && process.env.DB_HOST !== "localhost";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "otes_db",
  ssl: isRemote ? { rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
