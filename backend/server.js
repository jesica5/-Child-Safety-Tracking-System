require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { seedDatabase, startLocationSimulation } = require('./utils/simulator');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const childRoutes = require('./routes/childRoutes');
const locationRoutes = require('./routes/locationRoutes');
const geofenceRoutes = require('./routes/geofenceRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Child Safety Tracking Server API is running' });
});

// Configure API Routing Paths
app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/geofences', geofenceRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);

// Error Handling Middleware fallback
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server Error: Something went wrong!' });
});

// Start Database, Seed and Start server
const startServer = async () => {
  // 1. Establish Database Connection (Mongoose or fallback JSON file DB)
  await connectDB();

  // 2. Seed database with demo data (Admin, Parents, Children, Geofences)
  await seedDatabase();

  // 3. Start GPS coordinates simulation loop
  startLocationSimulation();

  // 4. Start listening
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
};

startServer();
