const express = require('express');
const router = express.Router();
const { getDashboardStats, getReportData } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.get('/dashboard-stats', protect, getDashboardStats);
router.get('/query', protect, getReportData);

module.exports = router;
