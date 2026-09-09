require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dashboardRouter = require('./routes/dashboard');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/dashboard-data', dashboardRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.send('Dashboard API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
