const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const EmergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relationship: { type: String, required: true }
});

const ChildSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  class: { type: String, required: true },
  parentId: { type: String, required: true }, // Store parent User ID
  parentName: { type: String, required: true },
  emergencyContacts: [EmergencyContactSchema],
  medicalInfo: { type: String, default: 'None' },
  currentLocation: {
    lat: { type: Number, default: 37.7749 }, // Default starting coordinates
    lng: { type: Number, default: -122.4194 },
    lastUpdated: { type: Date, default: Date.now }
  },
  status: { type: String, enum: ['Safe', 'SOS', 'Outside Safe Zone', 'Inactive'], default: 'Safe' },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = getModel('Child', ChildSchema);
