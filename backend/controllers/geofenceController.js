const Geofence = require('../models/Geofence');
const Child = require('../models/Child');

// @desc    Get all geofences (Filtered by parent's children if Parent role)
// @route   GET /api/geofences
// @access  Private
exports.getGeofences = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'Parent') {
      // Find parent's children
      const children = await Child.find({ parentId: req.user.id });
      const childIds = children.map(c => c._id.toString());
      query = { childId: { $in: [...childIds, 'ALL'] } };
    }

    const geofences = await Geofence.find(query);
    res.status(200).json({ success: true, count: geofences.length, data: geofences });
  } catch (error) {
    console.error('Get geofences error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving geofences' });
  }
};

// @desc    Get geofences for a specific child
// @route   GET /api/geofences/child/:childId
// @access  Private
exports.getChildGeofences = async (req, res) => {
  try {
    const { childId } = req.params;

    // Check parent permission
    if (req.user.role === 'Parent') {
      const child = await Child.findById(childId);
      if (!child || child.parentId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied to this child\'s geofences' });
      }
    }

    const geofences = await Geofence.find({ childId: { $in: [childId, 'ALL'] } });
    res.status(200).json({ success: true, count: geofences.length, data: geofences });
  } catch (error) {
    console.error('Get child geofences error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving child geofences' });
  }
};

// @desc    Create a geofence
// @route   POST /api/geofences
// @access  Private (Admin / School Staff / Parent)
exports.createGeofence = async (req, res) => {
  try {
    const { name, type, lat, lng, radius, childId } = req.body;

    if (!name || !lat || !lng || !radius || !childId) {
      return res.status(400).json({ success: false, message: 'Please provide name, center coordinates (lat, lng), radius, and target childId' });
    }

    // Parents can only create geofences for their own children
    if (req.user.role === 'Parent') {
      if (childId === 'ALL') {
        return res.status(403).json({ success: false, message: 'Parents cannot create global/school-wide geofences' });
      }
      const child = await Child.findById(childId);
      if (!child || child.parentId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied: Child does not belong to you' });
      }
    }

    const geofence = await Geofence.create({
      name,
      type: type || 'Circle',
      center: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      radius: parseFloat(radius),
      childId,
      isActive: true
    });

    res.status(201).json({ success: true, data: geofence });
  } catch (error) {
    console.error('Create geofence error:', error);
    res.status(500).json({ success: false, message: 'Server error creating geofence' });
  }
};

// @desc    Update a geofence
// @route   PUT /api/geofences/:id
// @access  Private
exports.updateGeofence = async (req, res) => {
  try {
    let geofence = await Geofence.findById(req.params.id);
    if (!geofence) {
      return res.status(404).json({ success: false, message: 'Geofence not found' });
    }

    // Role checks
    if (req.user.role === 'Parent') {
      if (geofence.childId === 'ALL') {
        return res.status(403).json({ success: false, message: 'Parents cannot update school-wide geofences' });
      }
      const child = await Child.findById(geofence.childId);
      if (!child || child.parentId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const { name, lat, lng, radius, isActive } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (lat !== undefined && lng !== undefined) {
      updateData.center = { lat: parseFloat(lat), lng: parseFloat(lng) };
    }
    if (radius !== undefined) updateData.radius = parseFloat(radius);
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await Geofence.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update geofence error:', error);
    res.status(500).json({ success: false, message: 'Server error updating geofence' });
  }
};

// @desc    Delete a geofence
// @route   DELETE /api/geofences/:id
// @access  Private
exports.deleteGeofence = async (req, res) => {
  try {
    const geofence = await Geofence.findById(req.params.id);
    if (!geofence) {
      return res.status(404).json({ success: false, message: 'Geofence not found' });
    }

    // Role checks
    if (req.user.role === 'Parent') {
      if (geofence.childId === 'ALL') {
        return res.status(403).json({ success: false, message: 'Parents cannot delete school-wide geofences' });
      }
      const child = await Child.findById(geofence.childId);
      if (!child || child.parentId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    await Geofence.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Geofence deleted successfully' });
  } catch (error) {
    console.error('Delete geofence error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting geofence' });
  }
};
