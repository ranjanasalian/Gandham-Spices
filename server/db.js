import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Helper to ensure database directory exists
function ensureDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

// Atomic write to prevent file corruption
async function saveDatabase(data) {
  ensureDir();
  const tempFile = `${DB_FILE}.tmp`;
  try {
    await fs.promises.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf8');
    await fs.promises.rename(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to save database atomically:', err);
    // Fallback directly if rename fails
    await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  }
}

// Synchronous fallback read for initialization
function readDatabaseSync() {
  ensureDir();
  if (!fs.existsSync(DB_FILE)) {
    const defaultDB = seedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2), 'utf8');
    return defaultDB;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse database file. Re-initializing...', err);
    const defaultDB = seedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2), 'utf8');
    return defaultDB;
  }
}

// MongoDB Persistent State Variables
let client = null;
let collection = null;
let dbCache = null;

const mongoUri = process.env.MONGODB_URI;
const FORCE_WIPE = process.env.WIPE_DATABASE === 'true';

if (mongoUri) {
  try {
    console.log('Connecting to MongoDB Atlas...');
    client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db('gandham_spices');
    collection = db.collection('state');
    const doc = await collection.findOne({ id: 'global_state' });
    if (!doc || FORCE_WIPE) {
      const defaultDB = seedDatabase();
      if (doc) {
        await collection.updateOne({ id: 'global_state' }, { $set: { data: defaultDB } });
        console.log('MongoDB Atlas live state wiped and reset to clean template.');
      } else {
        await collection.insertOne({ id: 'global_state', data: defaultDB });
        console.log('MongoDB Atlas successfully initialized with seed database.');
      }
      dbCache = defaultDB;
    } else {
      dbCache = doc.data;
      console.log('MongoDB Atlas state successfully loaded.');
    }
  } catch (err) {
    console.error('MongoDB Atlas connection failed. Falling back to local db.json...', err);
    dbCache = readDatabaseSync();
    client = null;
    collection = null;
  }
} else {
  dbCache = readDatabaseSync();
}

// Get the DB object
export function getDB() {
  return dbCache;
}

// Force reload
export async function reloadDB() {
  if (collection) {
    try {
      const doc = await collection.findOne({ id: 'global_state' });
      if (doc) {
        dbCache = doc.data;
      }
    } catch (err) {
      console.error('Failed to reload database from MongoDB Atlas:', err);
    }
  } else {
    ensureDir();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = await fs.promises.readFile(DB_FILE, 'utf8');
        dbCache = JSON.parse(raw);
      } catch (err) {
        console.error('Failed to reload database:', err);
      }
    }
  }
}

// Persist the current in-memory cache
export async function commit() {
  if (collection) {
    try {
      await collection.updateOne({ id: 'global_state' }, { $set: { data: dbCache } }, { upsert: true });
    } catch (err) {
      console.error('Failed to commit state to MongoDB Atlas:', err);
    }
  } else {
    await saveDatabase(dbCache);
  }
}

// Default Seed Data Generator
function seedDatabase() {
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('GandhamSpices2026', salt);

  const initialData = {
    users: [
      {
        id: 'u1',
        username: 'admin',
        passwordHash: adminPasswordHash,
        role: 'Admin',
        name: 'Gandham Spices Admin'
      }
    ],
    products: [],
    rawMaterials: [],
    recipes: [],
    batches: [],
    suppliers: [],
    customers: [],
    deliveries: [],
    sales: [],
    expenses: [],
    pendingPayments: [],
    orders: [],
    salesTargets: [],
    notifications: [],
    recentActivities: [],
    ingredientPurchases: []
  };

  return initialData;
}
