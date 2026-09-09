const sql = require('mssql');
require('dotenv').config();

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourStrong!Passw0rd',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'DashboardDB',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // true for Azure
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true', // change to true for local dev / self-signed certs
  },
  port: parseInt(process.env.DB_PORT) || 1433,
};

let poolPromise = null;

const getPool = async () => {
  if (!poolPromise) {
    poolPromise = sql.connect(config)
      .then(pool => {
        console.log('Connected to MSSQL');
        return pool;
      })
      .catch(err => {
        console.error('Database Connection Failed:', err);
        poolPromise = null;
        throw err;
      });
  }
  return poolPromise;
};

module.exports = {
  getPool,
  sql
};
