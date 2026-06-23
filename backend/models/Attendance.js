const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const AttendanceSchema = new mongoose.Schema({
  childId: { type: String, required: true },
  childName: { type: String, required: true },
  class: { type: String, required: true },
  type: { type: String, enum: ['Check-In', 'Check-Out'], required: true },
  timestamp: { type: Date, default: Date.now },
  method: { type: String, enum: ['Manual', 'RFID', 'NFC', 'QR Code'], default: 'Manual' },
  loggedBy: { type: String, required: true }, // Staff / Admin ID
  loggedByName: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = getModel('Attendance', AttendanceSchema);
