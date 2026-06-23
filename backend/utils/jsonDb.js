const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

// Ensure database directory and file exist
function initializeDbFile() {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      users: [],
      children: [],
      alerts: [],
      attendance: [],
      geofences: [],
      locationHistory: []
    }, null, 2), 'utf8');
  }
}

initializeDbFile();

// Read full database
function readDb() {
  try {
    initializeDbFile();
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON DB file:', err);
    return {
      users: [],
      children: [],
      alerts: [],
      attendance: [],
      geofences: [],
      locationHistory: []
    };
  }
}

// Write full database
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing JSON DB file:', err);
  }
}

// Helper to check object matching
function matchFilter(item, filter) {
  if (!filter) return true;
  for (const key in filter) {
    const val = filter[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      // Handle operators like $gte, $lte, $in, $regex
      for (const op in val) {
        if (op === '$gte') {
          if (item[key] < val[op]) return false;
        } else if (op === '$lte') {
          if (item[key] > val[op]) return false;
        } else if (op === '$gt') {
          if (item[key] <= val[op]) return false;
        } else if (op === '$lt') {
          if (item[key] >= val[op]) return false;
        } else if (op === '$in') {
          if (!Array.isArray(val[op]) || !val[op].includes(item[key])) return false;
        } else if (op === '$regex') {
          const regex = new RegExp(val[op], val.$options || '');
          if (!regex.test(item[key] || '')) return false;
        }
      }
    } else {
      // Simple strict match
      if (item[key] !== val) return false;
    }
  }
  return true;
}

class JsonModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async find(filter = {}) {
    const db = readDb();
    const list = db[this.collectionName] || [];
    const filtered = list.filter(item => matchFilter(item, filter));
    
    // Return with helper chaining methods to mimic Mongoose
    return {
      sort: (sortOpt) => {
        if (!sortOpt) return filtered;
        const key = Object.keys(sortOpt)[0];
        const dir = sortOpt[key]; // 1 for asc, -1 for desc or -1/1
        const sorted = [...filtered].sort((a, b) => {
          if (a[key] < b[key]) return dir === -1 || dir === 'desc' ? 1 : -1;
          if (a[key] > b[key]) return dir === -1 || dir === 'desc' ? -1 : 1;
          return 0;
        });
        return {
          limit: (n) => sorted.slice(0, n),
          exec: async () => sorted
        };
      },
      limit: (n) => filtered.slice(0, n),
      exec: async () => filtered,
      then: (resolve) => resolve(filtered)
    };
  }

  async findOne(filter = {}) {
    const db = readDb();
    const list = db[this.collectionName] || [];
    const match = list.find(item => matchFilter(item, filter)) || null;
    return match;
  }

  async findById(id) {
    if (!id) return null;
    return this.findOne({ _id: id.toString() });
  }

  async create(docData) {
    const db = readDb();
    if (!db[this.collectionName]) db[this.collectionName] = [];
    
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      ...docData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    db[this.collectionName].push(newDoc);
    writeDb(db);
    return newDoc;
  }

  async findByIdAndUpdate(id, updateData, options = { new: true }) {
    const db = readDb();
    const list = db[this.collectionName] || [];
    const index = list.findIndex(item => item._id === id.toString());
    
    if (index === -1) return null;
    
    // Extract real changes (avoid nested object overwrite problems)
    const current = list[index];
    const updated = {
      ...current,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    db[this.collectionName][index] = updated;
    writeDb(db);
    return updated;
  }

  async findByIdAndDelete(id) {
    const db = readDb();
    const list = db[this.collectionName] || [];
    const index = list.findIndex(item => item._id === id.toString());
    
    if (index === -1) return null;
    
    const deleted = list[index];
    db[this.collectionName].splice(index, 1);
    writeDb(db);
    return deleted;
  }

  async countDocuments(filter = {}) {
    const db = readDb();
    const list = db[this.collectionName] || [];
    return list.filter(item => matchFilter(item, filter)).length;
  }

  async deleteMany(filter = {}) {
    const db = readDb();
    const list = db[this.collectionName] || [];
    const keep = list.filter(item => !matchFilter(item, filter));
    const deletedCount = list.length - keep.length;
    db[this.collectionName] = keep;
    writeDb(db);
    return { deletedCount };
  }
}

const models = {};

module.exports = {
  getModel: (name) => {
    // Map Mongoose model names to JSON collection array keys
    const nameMap = {
      'User': 'users',
      'Child': 'children',
      'Alert': 'alerts',
      'Attendance': 'attendance',
      'Geofence': 'geofences',
      'LocationHistory': 'locationHistory'
    };
    const key = nameMap[name];
    if (!key) throw new Error(`Unknown JSON model collection: ${name}`);
    if (!models[key]) {
      models[key] = new JsonModel(key);
    }
    return models[key];
  }
};
