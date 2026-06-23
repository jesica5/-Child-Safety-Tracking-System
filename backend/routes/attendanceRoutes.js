const express = require('express');
const router = express.Router();
const { getAttendanceLogs, getChildAttendanceLogs, logAttendance } = require('../controllers/attendanceController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getAttendanceLogs)
  .post(protect, authorizeRoles('Admin', 'School Staff'), logAttendance);

router.route('/child/:childId')
  .get(protect, getChildAttendanceLogs);

module.exports = router;
