const express = require('express');
const router = express.Router();
const { getGeofences, getChildGeofences, createGeofence, updateGeofence, deleteGeofence } = require('../controllers/geofenceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getGeofences)
  .post(protect, createGeofence);

router.route('/child/:childId')
  .get(protect, getChildGeofences);

router.route('/:id')
  .put(protect, updateGeofence)
  .delete(protect, deleteGeofence);

module.exports = router;
