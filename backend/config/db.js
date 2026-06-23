const mongoose = require('mongoose');
const jsonDb = require('../utils/jsonDb');

let dbType = 'LocalJSON';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('⚠️  No MONGODB_URI found in environment variables.');
    console.log('📂 Running in LocalJSON database mode (backend/data/db.json).');
    dbType = 'LocalJSON';
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000 // Quick timeout to switch to local db if mongo offline
    });
    console.log('✅ Connected to MongoDB successfully.');
    dbType = 'MongoDB';
  } catch (err) {
    console.error(`❌ MongoDB connection failed: ${err.message}`);
    console.log('📂 Falling back to LocalJSON database mode (backend/data/db.json).');
    dbType = 'LocalJSON';
  }
};

const getModel = (name, schema) => {
  if (dbType === 'MongoDB') {
    return mongoose.models[name] || mongoose.model(name, schema);
  } else {
    return jsonDb.getModel(name);
  }
};

module.exports = {
  connectDB,
  getModel,
  getDbType: () => dbType
};
