const mongoose = require('mongoose');
const { getModel } = require('../config/db');

const LocationHistorySchema = new mongoose.Schema({
  childId: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  speed: { type: Number, default: 0 }, // in km/h
  timestamp: { type: Date, default: Date.now }
});

module.exports = getModel('LocationHistory', LocationHistorySchema);
