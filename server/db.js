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
    products: [
      {
        id: 'biryani',
        sku: 'GS-BM01',
        name: 'Biryani Marination Mix',
        category: 'Spice Blends',
        mrp: 120,
        wholesalePrice: 90,
        costPrice: 50,
        currentStock: 0,
        status: 'Active',
        packSize: '100g'
      },
      {
        id: 'rasam',
        sku: 'GS-RP01',
        name: 'Temple-Style Rasam Powder',
        category: 'Spice Powders',
        mrp: 60,
        wholesalePrice: 45,
        costPrice: 25,
        currentStock: 0,
        status: 'Active',
        packSize: '50g'
      },
      {
        id: 'chicken-sukka',
        sku: 'GS-CS01',
        name: 'Chicken Sukka Masala',
        category: 'Masalas',
        mrp: 60,
        wholesalePrice: 45,
        costPrice: 25,
        currentStock: 0,
        status: 'Active',
        packSize: '50g'
      }
    ],
    rawMaterials: [
      { id: 'rm1', name: 'Red Chillies', currentStock: 0, unit: 'kg', purchasePrice: 180, minStockLevel: 10, purchaseDate: '2026-07-20', supplierId: '' },
      { id: 'rm2', name: 'Coriander Seeds', currentStock: 0, unit: 'kg', purchasePrice: 120, minStockLevel: 8, purchaseDate: '2026-07-20', supplierId: '' },
      { id: 'rm3', name: 'Cumin Seeds', currentStock: 0, unit: 'kg', purchasePrice: 220, minStockLevel: 5, purchaseDate: '2026-07-20', supplierId: '' },
      { id: 'rm4', name: 'Fenugreek', currentStock: 0, unit: 'kg', purchasePrice: 100, minStockLevel: 3, purchaseDate: '2026-07-20', supplierId: '' },
      { id: 'rm5', name: 'Pepper', currentStock: 0, unit: 'kg', purchasePrice: 350, minStockLevel: 5, purchaseDate: '2026-07-20', supplierId: '' },
      { id: 'rm6', name: 'Turmeric', currentStock: 0, unit: 'kg', purchasePrice: 150, minStockLevel: 5, purchaseDate: '2026-07-20', supplierId: '' },
      { id: 'rm7', name: 'Curry Leaves', currentStock: 0, unit: 'kg', purchasePrice: 50, minStockLevel: 2, purchaseDate: '2026-07-20', supplierId: '' },
      { id: 'rm8', name: 'Asafoetida', currentStock: 0, unit: 'kg', purchasePrice: 1200, minStockLevel: 1, purchaseDate: '2026-07-20', supplierId: '' },
      { id: 'rm9', name: 'Pouches (100g)', currentStock: 0, unit: 'pcs', purchasePrice: 2.5, minStockLevel: 200, purchaseDate: '2026-07-20', supplierId: '' },
      { id: 'rm10', name: 'Pouches (50g)', currentStock: 0, unit: 'pcs', purchasePrice: 2, minStockLevel: 250, purchaseDate: '2026-07-20', supplierId: '' },
      { id: 'rm11', name: 'Labels (Biryani Mix)', currentStock: 0, unit: 'pcs', purchasePrice: 1.5, minStockLevel: 100, purchaseDate: '2026-07-20', supplierId: '' },
      { id: 'rm12', name: 'Labels (Rasam Powder)', currentStock: 0, unit: 'pcs', purchasePrice: 1.5, minStockLevel: 100, purchaseDate: '2026-07-20', supplierId: '' },
      { id: 'rm13', name: 'Labels (Chicken Sukka)', currentStock: 0, unit: 'pcs', purchasePrice: 1.5, minStockLevel: 100, purchaseDate: '2026-07-20', supplierId: '' }
    ],
    recipes: [
      {
        id: 'rec1',
        name: 'Biryani Marination Mix',
        productId: 'biryani',
        yieldQuantity: 100,
        notes: 'Classic hand-roasted recipe. Roast coriander and red chillies separately.',
        ingredients: [
          { rawMaterialId: 'rm2', quantity: 0.04, unit: 'kg' },
          { rawMaterialId: 'rm3', quantity: 0.02, unit: 'kg' },
          { rawMaterialId: 'rm1', quantity: 0.02, unit: 'kg' },
          { rawMaterialId: 'rm5', quantity: 0.01, unit: 'kg' },
          { rawMaterialId: 'rm6', quantity: 0.005, unit: 'kg' },
          { rawMaterialId: 'rm9', quantity: 1, unit: 'pcs' },
          { rawMaterialId: 'rm11', quantity: 1, unit: 'pcs' }
        ]
      },
      {
        id: 'rec2',
        name: 'Temple-Style Rasam Powder',
        productId: 'rasam',
        yieldQuantity: 100,
        notes: 'Roast with a few drops of pure coconut oil. Do not over-roast curry leaves.',
        ingredients: [
          { rawMaterialId: 'rm2', quantity: 0.02, unit: 'kg' },
          { rawMaterialId: 'rm3', quantity: 0.01, unit: 'kg' },
          { rawMaterialId: 'rm1', quantity: 0.01, unit: 'kg' },
          { rawMaterialId: 'rm5', quantity: 0.005, unit: 'kg' },
          { rawMaterialId: 'rm7', quantity: 0.003, unit: 'kg' },
          { rawMaterialId: 'rm8', quantity: 0.002, unit: 'kg' },
          { rawMaterialId: 'rm10', quantity: 1, unit: 'pcs' },
          { rawMaterialId: 'rm12', quantity: 1, unit: 'pcs' }
        ]
      },
      {
        id: 'rec3',
        name: 'Chicken Sukka Masala',
        productId: 'chicken-sukka',
        yieldQuantity: 100,
        notes: 'Roast spices slowly till dark brown. Add dried curry leaves during grinding.',
        ingredients: [
          { rawMaterialId: 'rm2', quantity: 0.015, unit: 'kg' },
          { rawMaterialId: 'rm3', quantity: 0.01, unit: 'kg' },
          { rawMaterialId: 'rm1', quantity: 0.015, unit: 'kg' },
          { rawMaterialId: 'rm5', quantity: 0.005, unit: 'kg' },
          { rawMaterialId: 'rm6', quantity: 0.003, unit: 'kg' },
          { rawMaterialId: 'rm10', quantity: 1, unit: 'pcs' },
          { rawMaterialId: 'rm13', quantity: 1, unit: 'pcs' }
        ]
      }
    ],
    batches: [],
    suppliers: [],
    customers: [],
    deliveries: [],
    sales: [],
    expenses: [],
    pendingPayments: [],
    orders: [],
    salesTargets: [
      { id: 't1', period: '2026-07', targetRevenue: 50000, currentRevenue: 0 }
    ],
    notifications: [],
    recentActivities: []
  };

  return initialData;
}
