const Child = require('../models/Child');
const LocationHistory = require('../models/LocationHistory');
const Geofence = require('../models/Geofence');
const Alert = require('../models/Alert');

// Haversine formula to compute distance in meters
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

// @desc    Get location history for a child
// @route   GET /api/location/history/:childId
// @access  Private
exports.getLocationHistory = async (req, res) => {
  try {
    const { childId } = req.params;

    // Parent permission check
    if (req.user.role === 'Parent') {
      const child = await Child.findById(childId);
      if (!child || child.parentId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const history = await LocationHistory.find({ childId })
      .sort({ timestamp: -1 })
      .limit(100)
      .exec();

    // Reverse history to return chronological order (oldest to newest)
    res.status(200).json({ success: true, count: history.length, data: [...history].reverse() });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving history' });
  }
};

// @desc    Update child location and run geofencing calculations
// @route   POST /api/location/update
// @access  Private (Admin / School Staff / Parent - simulating client updates)
exports.updateChildLocation = async (req, res) => {
  try {
    const { childId, lat, lng, speed } = req.body;

    if (!childId || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide childId, lat, and lng' });
    }

    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({ success: false, message: 'Child profile not found' });
    }

    // Access check: parents can only simulate their own children
    if (req.user.role === 'Parent' && child.parentId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const oldLocation = child.currentLocation || { lat: 37.7749, lng: -122.4194 };
    
    // Update child's current location
    child.currentLocation = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      lastUpdated: new Date()
    };

    // Save location breadcrumb
    await LocationHistory.create({
      childId,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      speed: parseFloat(speed || 0),
      timestamp: new Date()
    });

    // Check all active geofences for this child (specific + global)
    const geofences = await Geofence.find({ childId: { $in: [childId, 'ALL'] }, isActive: true });
    
    let isChildInAnySafeZone = false;
    let didBreachOccur = false;
    let alertMessage = '';
    let alertType = '';

    for (const fence of geofences) {
      const distNew = getDistance(parseFloat(lat), parseFloat(lng), fence.center.lat, fence.center.lng);
      const distOld = getDistance(oldLocation.lat, oldLocation.lng, fence.center.lat, fence.center.lng);

      const isInsideNew = distNew <= fence.radius;
      const isInsideOld = distOld <= fence.radius;

      if (fence.name.toLowerCase().includes('school') || fence.name.toLowerCase().includes('home') || fence.name.toLowerCase().includes('safe')) {
        if (isInsideNew) {
          isChildInAnySafeZone = true;
        }
      }

      // Check transition: Entered geofence
      if (!isInsideOld && isInsideNew) {
        alertType = 'Geofence Entry';
        alertMessage = `${child.name} has entered safe zone: ${fence.name}`;
        didBreachOccur = true;
      }
      // Check transition: Exited geofence
      else if (isInsideOld && !isInsideNew) {
        alertType = 'Geofence Exit';
        alertMessage = `${child.name} has left safe zone: ${fence.name}`;
        didBreachOccur = true;
      }
    }

    // Trigger alerts if status changed
    if (didBreachOccur) {
      await Alert.create({
        childId,
        childName: child.name,
        type: alertType,
        message: alertMessage,
        status: 'Active',
        severity: alertType === 'Geofence Exit' ? 'High' : 'Low',
        location: { lat: parseFloat(lat), lng: parseFloat(lng) }
      });
      
      // Update child status
      if (alertType === 'Geofence Exit' && child.status !== 'SOS') {
        child.status = 'Outside Safe Zone';
      } else if (alertType === 'Geofence Entry' && child.status !== 'SOS') {
        child.status = 'Safe';
      }
    }

    // Fallback: If no breach trigger, but we check if they are outside all safe zones and not SOS
    if (geofences.length > 0 && !isChildInAnySafeZone && child.status === 'Safe') {
      child.status = 'Outside Safe Zone';
    } else if (isChildInAnySafeZone && child.status === 'Outside Safe Zone') {
      child.status = 'Safe';
    }

    await child.save();

    res.status(200).json({
      success: true,
      data: child
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ success: false, message: 'Server error updating location' });
  }
};

// @desc    Trigger SOS alert for child
// @route   POST /api/location/sos/:childId
// @access  Private
exports.triggerSOS = async (req, res) => {
  try {
    const { childId } = req.params;
    const { lat, lng } = req.body;

    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({ success: false, message: 'Child profile not found' });
    }

    // Check parent ownership
    if (req.user.role === 'Parent' && child.parentId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Update child status to SOS
    child.status = 'SOS';
    if (lat !== undefined && lng !== undefined) {
      child.currentLocation = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        lastUpdated: new Date()
      };
    }
    await child.save();

    // Create SOS Alert
    const alert = await Alert.create({
      childId,
      childName: child.name,
      type: 'SOS',
      message: `EMERGENCY: ${child.name} has triggered SOS alarm! Immediate attention required.`,
      status: 'Active',
      severity: 'Critical',
      location: {
        lat: lat ? parseFloat(lat) : child.currentLocation.lat,
        lng: lng ? parseFloat(lng) : child.currentLocation.lng
      }
    });

    res.status(200).json({ success: true, data: alert, child });
  } catch (error) {
    console.error('SOS trigger error:', error);
    res.status(500).json({ success: false, message: 'Server error triggering SOS alarm' });
  }
};

// @desc    Resolve an SOS alert
// @route   POST /api/location/resolve-alert/:alertId
// @access  Private (Admin / School Staff)
exports.resolveAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    // Update Alert status
    alert.status = 'Resolved';
    alert.resolvedBy = req.user.id;
    alert.resolvedAt = new Date();
    await alert.save();

    // Check if there are any other active SOS alerts for this child. If none, restore child status to Safe
    const activeSOS = await Alert.findOne({ childId: alert.childId, type: 'SOS', status: 'Active' });
    if (!activeSOS) {
      const child = await Child.findById(alert.childId);
      if (child) {
        // Run simple safe zone check to see if child should be 'Safe' or 'Outside Safe Zone'
        const geofences = await Geofence.find({ childId: { $in: [child._id.toString(), 'ALL'] }, isActive: true });
        let isChildInAnySafeZone = false;
        for (const fence of geofences) {
          const dist = getDistance(child.currentLocation.lat, child.currentLocation.lng, fence.center.lat, fence.center.lng);
          if (dist <= fence.radius && (fence.name.toLowerCase().includes('school') || fence.name.toLowerCase().includes('home') || fence.name.toLowerCase().includes('safe'))) {
            isChildInAnySafeZone = true;
            break;
          }
        }
        child.status = isChildInAnySafeZone || geofences.length === 0 ? 'Safe' : 'Outside Safe Zone';
        await child.save();
      }
    }

    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    console.error('Resolve alert error:', error);
    res.status(500).json({ success: false, message: 'Server error resolving alert' });
  }
};

// @desc    Get all active and resolved alerts
// @route   GET /api/location/alerts
// @access  Private
exports.getAlerts = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'Parent') {
      const children = await Child.find({ parentId: req.user.id });
      const childIds = children.map(c => c._id.toString());
      query = { childId: { $in: childIds } };
    }

    // Fetch and sort by descending date
    const alerts = await Alert.find(query);
    const sorted = [...alerts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({ success: true, count: sorted.length, data: sorted });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving alert logs' });
  }
};
