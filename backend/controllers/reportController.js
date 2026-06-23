const Child = require('../models/Child');
const Alert = require('../models/Alert');
const Attendance = require('../models/Attendance');
const Geofence = require('../models/Geofence');

// @desc    Get dashboard summary statistics
// @route   GET /api/reports/dashboard-stats
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    let childQuery = {};
    let alertQuery = {};
    let attendanceQuery = {};

    if (req.user.role === 'Parent') {
      const parentChildren = await Child.find({ parentId: req.user.id });
      const parentChildIds = parentChildren.map(c => c._id.toString());
      childQuery = { parentId: req.user.id };
      alertQuery = { childId: { $in: parentChildIds } };
      attendanceQuery = { childId: { $in: parentChildIds } };
    }

    // Counts
    const totalChildren = await Child.countDocuments(childQuery);
    
    // Active tracking represents children that aren't marked Inactive
    const activeTrackingQuery = { ...childQuery, status: { $ne: 'Inactive' } };
    const activeTracking = await Child.countDocuments(activeTrackingQuery);

    // Safe Check-ins: Total Check-Ins today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const todayCheckInQuery = {
      ...attendanceQuery,
      type: 'Check-In',
      timestamp: { $gte: startOfToday.toISOString(), $lte: endOfToday.toISOString() }
    };
    const safeCheckIns = await Attendance.countDocuments(todayCheckInQuery);

    // Active SOS Alerts
    const activeAlertsQuery = {
      ...alertQuery,
      type: 'SOS',
      status: 'Active'
    };
    const emergencyAlerts = await Alert.countDocuments(activeAlertsQuery);

    // Status distributions (for charts)
    const safeCount = await Child.countDocuments({ ...childQuery, status: 'Safe' });
    const outsideCount = await Child.countDocuments({ ...childQuery, status: 'Outside Safe Zone' });
    const sosCount = await Child.countDocuments({ ...childQuery, status: 'SOS' });
    const inactiveCount = await Child.countDocuments({ ...childQuery, status: 'Inactive' });

    // Recent alerts list (limit 5)
    const recentAlerts = await Alert.find(alertQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .exec();

    // Chart Data: Attendance timeline (past 7 days check-ins)
    const attendanceChartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const count = await Attendance.countDocuments({
        ...attendanceQuery,
        type: 'Check-In',
        timestamp: { $gte: start.toISOString(), $lte: end.toISOString() }
      });

      attendanceChartData.push({
        day: dayName,
        checkIns: count
      });
    }

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalChildren,
          activeTracking,
          safeCheckIns,
          emergencyAlerts
        },
        statusDistribution: {
          safe: safeCount,
          outside: outsideCount,
          sos: sosCount,
          inactive: inactiveCount
        },
        recentAlerts,
        attendanceChartData
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error compiling dashboard analytics' });
  }
};

// @desc    Get report records based on filters
// @route   GET /api/reports/query
// @access  Private
exports.getReportData = async (req, res) => {
  try {
    const { category, search, classFilter, startDate, endDate, status } = req.query;

    let childQuery = {};
    if (req.user.role === 'Parent') {
      childQuery = { parentId: req.user.id };
    }

    // Resolve children matching basic search / class filters
    if (search) {
      childQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } }
      ];
    }
    if (classFilter) {
      childQuery.class = classFilter;
    }

    const matchedChildren = await Child.find(childQuery);
    const childIds = matchedChildren.map(c => c._id.toString());

    let results = [];

    // If searching specifically for children lists
    if (category === 'children') {
      results = matchedChildren.map(c => ({
        id: c._id,
        name: c.name,
        age: c.age,
        class: c.class,
        parentName: c.parentName,
        status: c.status,
        createdAt: c.createdAt
      }));
    }
    // Attendance reports
    else if (category === 'attendance') {
      const attendanceQuery = { childId: { $in: childIds } };
      
      if (status) {
        attendanceQuery.type = status; // Check-In or Check-Out
      }
      if (startDate || endDate) {
        attendanceQuery.timestamp = {};
        if (startDate) attendanceQuery.timestamp.$gte = new Date(startDate).toISOString();
        if (endDate) attendanceQuery.timestamp.$lte = new Date(endDate).toISOString();
      }

      const logs = await Attendance.find(attendanceQuery);
      results = [...logs]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .map(l => ({
          id: l._id,
          childName: l.childName,
          class: l.class,
          type: l.type,
          timestamp: l.timestamp,
          method: l.method,
          loggedByName: l.loggedByName || 'System'
        }));
    }
    // Alerts reports
    else if (category === 'alerts') {
      const alertsQuery = { childId: { $in: childIds } };

      if (status) {
        alertsQuery.status = status; // Active or Resolved
      }
      if (startDate || endDate) {
        alertsQuery.createdAt = {};
        if (startDate) alertsQuery.createdAt.$gte = new Date(startDate).toISOString();
        if (endDate) alertsQuery.createdAt.$lte = new Date(endDate).toISOString();
      }

      const logs = await Alert.find(alertsQuery);
      results = [...logs]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(a => ({
          id: a._id,
          childName: a.childName,
          type: a.type,
          message: a.message,
          severity: a.severity,
          status: a.status,
          createdAt: a.createdAt,
          resolvedAt: a.resolvedAt
        }));
    }

    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Get report data error:', error);
    res.status(500).json({ success: false, message: 'Server error generating reports' });
  }
};
