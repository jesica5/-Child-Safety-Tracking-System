const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const GeofenceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Circle', 'Polygon'], default: 'Circle' },
  center: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  radius: { type: Number, required: true }, // in meters
  childId: { type: String, required: true }, // Can be specific child _id or 'ALL' for school-wide
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = getModel('Geofence', GeofenceSchema);
