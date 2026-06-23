const Attendance = require('../models/Attendance');
const Child = require('../models/Child');
const Alert = require('../models/Alert');

// @desc    Get all attendance logs (Filtered by parent's children if Parent role)
// @route   GET /api/attendance
// @access  Private
exports.getAttendanceLogs = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'Parent') {
      const children = await Child.find({ parentId: req.user.id });
      const childIds = children.map(c => c._id.toString());
      query = { childId: { $in: childIds } };
    }

    const logs = await Attendance.find(query);
    const sorted = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({ success: true, count: sorted.length, data: sorted });
  } catch (error) {
    console.error('Get attendance logs error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving attendance logs' });
  }
};

// @desc    Get attendance logs for a specific child
// @route   GET /api/attendance/child/:childId
// @access  Private
exports.getChildAttendanceLogs = async (req, res) => {
  try {
    const { childId } = req.params;

    if (req.user.role === 'Parent') {
      const child = await Child.findById(childId);
      if (!child || child.parentId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const logs = await Attendance.find({ childId });
    const sorted = [...logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({ success: true, count: sorted.length, data: sorted });
  } catch (error) {
    console.error('Get child attendance logs error:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving child attendance logs' });
  }
};

// @desc    Log a new attendance check-in or check-out
// @route   POST /api/attendance
// @access  Private (Admin / School Staff)
exports.logAttendance = async (req, res) => {
  try {
    const { childId, type, method } = req.body;

    if (!childId || !type) {
      return res.status(400).json({ success: false, message: 'Please provide childId and type (Check-In or Check-Out)' });
    }

    if (!['Check-In', 'Check-Out'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Type must be Check-In or Check-Out' });
    }

    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({ success: false, message: 'Child profile not found' });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      childId,
      childName: child.name,
      class: child.class,
      type,
      method: method || 'Manual',
      loggedBy: req.user.id,
      loggedByName: req.user.name,
      timestamp: new Date()
    });

    // Create matching informational alert for timelines
    await Alert.create({
      childId,
      childName: child.name,
      type: type, // 'Check-In' or 'Check-Out'
      message: `${child.name} has been marked ${type === 'Check-In' ? 'PRESENT (Checked-In)' : 'DEPARTED (Checked-Out)'} at school via ${method || 'Manual'}.`,
      status: 'Resolved', // Marked resolved since it's an informational check-in event, not an active alert
      severity: 'Low',
      location: child.currentLocation
    });

    res.status(201).json({ success: true, data: attendance });
  } catch (error) {
    console.error('Log attendance error:', error);
    res.status(500).json({ success: false, message: 'Server error logging attendance' });
  }
};
