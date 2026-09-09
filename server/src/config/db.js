const sql = require('mssql');
require('dotenv').config();

function getConnectionConfig(database) {
  return {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: database || process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
      encrypt: process.env.DB_ENCRYPT === 'true',
      trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    },
  };
}

let poolPromise = null;

const getPool = async () => {
  if (!poolPromise) {
    poolPromise = sql.connect(getConnectionConfig(process.env.DB_DATABASE))
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
  getConnectionConfig,
  sql,
};
