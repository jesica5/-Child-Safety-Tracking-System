const express = require('express');
const router = express.Router();
const { getLocationHistory, updateChildLocation, triggerSOS, resolveAlert, getAlerts } = require('../controllers/locationController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/history/:childId', protect, getLocationHistory);
router.post('/update', protect, updateChildLocation);
router.post('/sos/:childId', protect, triggerSOS);
router.post('/resolve-alert/:alertId', protect, authorizeRoles('Admin', 'School Staff'), resolveAlert);
router.get('/alerts', protect, getAlerts);

module.exports = router;
