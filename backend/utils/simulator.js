const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Child = require('../models/Child');
const Geofence = require('../models/Geofence');
const LocationHistory = require('../models/LocationHistory');
const Alert = require('../models/Alert');
const Attendance = require('../models/Attendance');
const { updateChildLocation } = require('../controllers/locationController');

// Home coordinates: San Francisco City Hall
const HOME_LAT = 37.7794;
const HOME_LNG = -122.4194;

// School coordinates: SF Museum of Modern Art
const SCHOOL_LAT = 37.7858;
const SCHOOL_LNG = -122.4008;

// A path of coordinates from Home to School (simulating a school bus trip)
const BUS_ROUTE_PATH = [
  { lat: 37.7794, lng: -122.4194, speed: 0 },   // Home
  { lat: 37.7798, lng: -122.4168, speed: 25 },  // Transit
  { lat: 37.7812, lng: -122.4135, speed: 35 },  // Transit (Outside geofences)
  { lat: 37.7828, lng: -122.4095, speed: 30 },  // Near checkpoint
  { lat: 37.7845, lng: -122.4055, speed: 20 },  // Approaching School
  { lat: 37.7858, lng: -122.4008, speed: 0 }    // At School
];

let routeIndex = 0;
let direction = 1; // 1 = to School, -1 = to Home

// Seed database with sample data if empty
async function seedDatabase() {
  try {
    // Check if database contains users
    const userCount = await User.countDocuments({});
    if (userCount > 0) {
      console.log('⚡ Database already contains data. Skipping seeding.');
      return;
    }

    console.log('🌱 Seeding database with fresh demo data...');

    // Hashed password for demo accounts
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('safety123', salt);

    // Create default accounts
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@safety.com',
      password: defaultPassword,
      role: 'Admin',
      phone: '+1 (555) 019-2834'
    });

    const parentUser = await User.create({
      name: 'Sarah Green (Parent)',
      email: 'parent@safety.com',
      password: defaultPassword,
      role: 'Parent',
      phone: '+1 (555) 014-9988'
    });

    const staffUser = await User.create({
      name: 'Principal Davis (School)',
      email: 'staff@safety.com',
      password: defaultPassword,
      role: 'School Staff',
      phone: '+1 (555) 012-4411'
    });

    console.log('✅ Demo accounts seeded (Password is "safety123"):');
    console.log('   - Admin: admin@safety.com');
    console.log('   - Parent: parent@safety.com');
    console.log('   - School Staff: staff@safety.com');

    // Create Children
    const bobbyChild = await Child.create({
      name: 'Bobby Green',
      age: 9,
      class: 'Grade 4A',
      parentId: parentUser._id.toString(),
      parentName: parentUser.name,
      emergencyContacts: [
        { name: 'Sarah Green', phone: '+1 (555) 014-9988', relationship: 'Mother' },
        { name: 'David Green', phone: '+1 (555) 014-9922', relationship: 'Father' }
      ],
      medicalInfo: 'Peanut allergy. Carries EpiPen.',
      status: 'Safe',
      currentLocation: {
        lat: HOME_LAT,
        lng: HOME_LNG,
        lastUpdated: new Date()
      }
    });

    const aliceChild = await Child.create({
      name: 'Alice Green',
      age: 7,
      class: 'Grade 2B',
      parentId: parentUser._id.toString(),
      parentName: parentUser.name,
      emergencyContacts: [
        { name: 'Sarah Green', phone: '+1 (555) 014-9988', relationship: 'Mother' }
      ],
      medicalInfo: 'Asthma. Uses inhaler.',
      status: 'Safe',
      currentLocation: {
        lat: HOME_LAT,
        lng: HOME_LNG,
        lastUpdated: new Date()
      }
    });

    console.log('✅ Demo child profiles registered: Bobby Green and Alice Green.');

    // Create Geofences
    const homeFence = await Geofence.create({
      name: 'Green Residence (Home)',
      type: 'Circle',
      center: { lat: HOME_LAT, lng: HOME_LNG },
      radius: 120, // 120m
      childId: 'ALL',
      isActive: true
    });

    const schoolFence = await Geofence.create({
      name: 'Oakwood Primary (School)',
      type: 'Circle',
      center: { lat: SCHOOL_LAT, lng: SCHOOL_LNG },
      radius: 200, // 200m
      childId: 'ALL',
      isActive: true
    });

    console.log('✅ Geofences registered: Home Safe Zone and School Safe Zone.');

    // Seed location history breadcrumbs
    await LocationHistory.create({
      childId: bobbyChild._id.toString(),
      lat: HOME_LAT,
      lng: HOME_LNG,
      speed: 0,
      timestamp: new Date(Date.now() - 3600000)
    });

    await LocationHistory.create({
      childId: aliceChild._id.toString(),
      lat: HOME_LAT,
      lng: HOME_LNG,
      speed: 0,
      timestamp: new Date(Date.now() - 3600000)
    });

    // Seed a couple of solved logs
    await Attendance.create({
      childId: bobbyChild._id.toString(),
      childName: bobbyChild.name,
      class: bobbyChild.class,
      type: 'Check-In',
      timestamp: new Date(Date.now() - 28800000), // 8 hours ago
      method: 'RFID',
      loggedBy: staffUser._id.toString(),
      loggedByName: staffUser.name
    });

    await Attendance.create({
      childId: bobbyChild._id.toString(),
      childName: bobbyChild.name,
      class: bobbyChild.class,
      type: 'Check-Out',
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      method: 'Manual',
      loggedBy: staffUser._id.toString(),
      loggedByName: staffUser.name
    });

    console.log('🌱 Demo data seeding complete!');
  } catch (error) {
    console.error('❌ Error during demo data seeding:', error);
  }
}

// Background coordinate generator
function startLocationSimulation() {
  console.log('🛸 GPS simulation engine started. Ticks running every 15 seconds.');

  setInterval(async () => {
    try {
      // Find Bobby Green in database to simulate path
      const bobby = await Child.findOne({ name: 'Bobby Green' });
      if (!bobby) return;

      // Skip simulation if Bobby is in SOS emergency state to prevent overwriting critical coordinate feeds
      if (bobby.status === 'SOS') {
        return;
      }

      // Update route index
      routeIndex += direction;
      
      // Pivot route directions
      if (routeIndex >= BUS_ROUTE_PATH.length) {
        routeIndex = BUS_ROUTE_PATH.length - 1;
        direction = -1; // Heading home
      } else if (routeIndex < 0) {
        routeIndex = 0;
        direction = 1; // Heading to school
      }

      const point = BUS_ROUTE_PATH[routeIndex];

      // Simulate network request context
      const mockReq = {
        user: { role: 'Admin', name: 'Simulated Tracker', id: 'system' },
        body: {
          childId: bobby._id.toString(),
          lat: point.lat,
          lng: point.lng,
          speed: point.speed
        }
      };

      const mockRes = {
        status: () => ({ json: () => {} }) // silent response recorder
      };

      // Call the location updater
      await updateChildLocation(mockReq, mockRes);

      // School Check-In / Check-Out Simulation triggers
      if (point.lat === SCHOOL_LAT && point.lng === SCHOOL_LNG && direction === 1) {
        // Just arrived at School -> Trigger Check-In Attendance if not logged recently
        const recentCheckIn = await Attendance.findOne({
          childId: bobby._id.toString(),
          type: 'Check-In',
          timestamp: { $gte: new Date(Date.now() - 30000).toISOString() } // within last 30s
        });

        if (!recentCheckIn) {
          const staffUser = await User.findOne({ role: 'School Staff' });
          await Attendance.create({
            childId: bobby._id.toString(),
            childName: bobby.name,
            class: bobby.class,
            type: 'Check-In',
            timestamp: new Date(),
            method: 'RFID',
            loggedBy: staffUser ? staffUser._id.toString() : 'system',
            loggedByName: staffUser ? staffUser.name : 'RFID Gate'
          });

          await Alert.create({
            childId: bobby._id.toString(),
            childName: bobby.name,
            type: 'Check-In',
            message: `${bobby.name} has checked in at Oakwood Primary School.`,
            status: 'Resolved',
            severity: 'Low',
            location: { lat: point.lat, lng: point.lng }
          });
          console.log(`🏫 SIMULATOR: Automatically checked-in ${bobby.name} at School.`);
        }
      } 
      else if (point.lat === HOME_LAT && point.lng === HOME_LNG && direction === -1) {
        // Just returned Home -> Trigger Check-Out Attendance if not logged recently
        const recentCheckOut = await Attendance.findOne({
          childId: bobby._id.toString(),
          type: 'Check-Out',
          timestamp: { $gte: new Date(Date.now() - 30000).toISOString() } // within last 30s
        });

        if (!recentCheckOut) {
          const staffUser = await User.findOne({ role: 'School Staff' });
          await Attendance.create({
            childId: bobby._id.toString(),
            childName: bobby.name,
            class: bobby.class,
            type: 'Check-Out',
            timestamp: new Date(),
            method: 'Manual',
            loggedBy: staffUser ? staffUser._id.toString() : 'system',
            loggedByName: staffUser ? staffUser.name : 'School Staff'
          });

          await Alert.create({
            childId: bobby._id.toString(),
            childName: bobby.name,
            type: 'Check-Out',
            message: `${bobby.name} has checked out (departed school) and returned safely.`,
            status: 'Resolved',
            severity: 'Low',
            location: { lat: point.lat, lng: point.lng }
          });
          console.log(`🏡 SIMULATOR: Automatically checked-out ${bobby.name} heading home.`);
        }
      }

    } catch (err) {
      console.error('Simulator tick error:', err);
    }
  }, 15000); // Trigger every 15s
}

module.exports = {
  seedDatabase,
  startLocationSimulation
};
