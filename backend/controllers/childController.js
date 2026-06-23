const Child = require('../models/Child');
const User = require('../models/User');

// @desc    Get all children (Filtered by parentId if Parent role)
// @route   GET /api/children
// @access  Private
exports.getChildren = async (req, res) => {
  try {
    let children;
    if (req.user.role === 'Parent') {
      children = await Child.find({ parentId: req.user.id });
    } else {
      // Admin and School Staff can view all children
      children = await Child.find({});
    }

    res.status(200).json({ success: true, count: children.length, data: children });
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching children profiles' });
  }
};

// @desc    Get single child details
// @route   GET /api/children/:id
// @access  Private
exports.getChildById = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);
    if (!child) {
      return res.status(404).json({ success: false, message: 'Child profile not found' });
    }

    // Access check: Parents can only access their own child
    if (req.user.role === 'Parent' && child.parentId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this profile' });
    }

    res.status(200).json({ success: true, data: child });
  } catch (error) {
    console.error('Get child error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching child details' });
  }
};

// @desc    Create a child profile
// @route   POST /api/children
// @access  Private (Admin / Parent)
exports.createChild = async (req, res) => {
  try {
    const { name, age, class: classField, emergencyContacts, medicalInfo, parentId } = req.body;

    if (!name || !age || !classField) {
      return res.status(400).json({ success: false, message: 'Please provide name, age, and class' });
    }

    let resolvedParentId = req.user.id;
    let resolvedParentName = req.user.name;

    // Admin can create children for other parents
    if (req.user.role === 'Admin' && parentId) {
      resolvedParentId = parentId;
      const parentUser = await User.findById(parentId);
      if (!parentUser) {
        return res.status(400).json({ success: false, message: 'Specified parent user does not exist' });
      }
      resolvedParentName = parentUser.name;
    } else if (req.user.role === 'School Staff') {
      return res.status(403).json({ success: false, message: 'School Staff cannot create child profiles' });
    }

    // Format default starting locations (near a mock school center)
    const newChild = await Child.create({
      name,
      age: parseInt(age, 10),
      class: classField,
      parentId: resolvedParentId,
      parentName: resolvedParentName,
      emergencyContacts: emergencyContacts || [],
      medicalInfo: medicalInfo || 'None',
      status: 'Safe',
      currentLocation: {
        lat: 37.7749,
        lng: -122.4194,
        lastUpdated: new Date()
      }
    });

    res.status(201).json({ success: true, data: newChild });
  } catch (error) {
    console.error('Create child error:', error);
    res.status(500).json({ success: false, message: 'Server error creating child profile' });
  }
};

// @desc    Update child profile
// @route   PUT /api/children/:id
// @access  Private (Admin / Parent / Staff)
exports.updateChild = async (req, res) => {
  try {
    let child = await Child.findById(req.params.id);
    if (!child) {
      return res.status(404).json({ success: false, message: 'Child profile not found' });
    }

    // Parents can only update their own child
    if (req.user.role === 'Parent' && child.parentId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Update fields (excluding location history triggers unless specific)
    const { name, age, class: classField, emergencyContacts, medicalInfo, status } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (age) updateData.age = parseInt(age, 10);
    if (classField) updateData.class = classField;
    if (emergencyContacts) updateData.emergencyContacts = emergencyContacts;
    if (medicalInfo) updateData.medicalInfo = medicalInfo;
    if (status) updateData.status = status; // E.g., setting SOS, Safe, etc.

    const updatedChild = await Child.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.status(200).json({ success: true, data: updatedChild });
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({ success: false, message: 'Server error updating child profile' });
  }
};

// @desc    Delete child profile
// @route   DELETE /api/children/:id
// @access  Private (Admin)
exports.deleteChild = async (req, res) => {
  try {
    const child = await Child.findById(req.params.id);
    if (!child) {
      return res.status(404).json({ success: false, message: 'Child profile not found' });
    }

    // Only Admin can delete profiles
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Only Admins can delete profiles' });
    }

    await Child.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Child profile deleted successfully' });
  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({ success: false, message: 'Server error deleting child profile' });
  }
};
