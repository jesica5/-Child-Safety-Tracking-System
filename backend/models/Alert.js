const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const AlertSchema = new mongoose.Schema({
  childId: { type: String, required: true },
  childName: { type: String, required: true },
  type: { type: String, enum: ['SOS', 'Geofence Entry', 'Geofence Exit', 'Check-In', 'Check-Out'], required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Resolved'], default: 'Active' },
  resolvedBy: { type: String }, // User ID who resolved
  resolvedAt: { type: Date },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = getModel('Alert', AlertSchema);
