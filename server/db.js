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

if (mongoUri) {
  try {
    console.log('Connecting to MongoDB Atlas...');
    client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db('gandham_spices');
    collection = db.collection('state');
    const doc = await collection.findOne({ id: 'global_state' });
    if (!doc) {
      const defaultDB = seedDatabase();
      await collection.insertOne({ id: 'global_state', data: defaultDB });
      dbCache = defaultDB;
      console.log('MongoDB Atlas successfully initialized with seed database.');
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
        currentStock: 120,
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
        currentStock: 85,
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
        currentStock: 10,
        status: 'Active',
        packSize: '50g'
      }
    ],
    rawMaterials: [
      { id: 'rm1', name: 'Red Chillies', currentStock: 50.0, unit: 'kg', purchasePrice: 180, minStockLevel: 10.0, purchaseDate: '2026-07-15', supplierId: 's1' },
      { id: 'rm2', name: 'Coriander Seeds', currentStock: 40.0, unit: 'kg', purchasePrice: 120, minStockLevel: 8.0, purchaseDate: '2026-07-15', supplierId: 's2' },
      { id: 'rm3', name: 'Cumin Seeds', currentStock: 30.0, unit: 'kg', purchasePrice: 220, minStockLevel: 5.0, purchaseDate: '2026-07-15', supplierId: 's2' },
      { id: 'rm4', name: 'Fenugreek', currentStock: 15.0, unit: 'kg', purchasePrice: 100, minStockLevel: 3.0, purchaseDate: '2026-07-15', supplierId: 's2' },
      { id: 'rm5', name: 'Pepper', currentStock: 25.0, unit: 'kg', purchasePrice: 350, minStockLevel: 5.0, purchaseDate: '2026-07-15', supplierId: 's1' },
      { id: 'rm6', name: 'Turmeric', currentStock: 20.0, unit: 'kg', purchasePrice: 150, minStockLevel: 5.0, purchaseDate: '2026-07-15', supplierId: 's2' },
      { id: 'rm7', name: 'Curry Leaves', currentStock: 10.0, unit: 'kg', purchasePrice: 50, minStockLevel: 2.0, purchaseDate: '2026-07-18', supplierId: 's2' },
      { id: 'rm8', name: 'Asafoetida', currentStock: 5.0, unit: 'kg', purchasePrice: 1200, minStockLevel: 1.0, purchaseDate: '2026-07-15', supplierId: 's2' },
      { id: 'rm9', name: 'Pouches (100g)', currentStock: 1500, unit: 'pcs', purchasePrice: 2.5, minStockLevel: 200, purchaseDate: '2026-07-10', supplierId: 's3' },
      { id: 'rm10', name: 'Pouches (50g)', currentStock: 2000, unit: 'pcs', purchasePrice: 2.0, minStockLevel: 250, purchaseDate: '2026-07-10', supplierId: 's3' },
      { id: 'rm11', name: 'Labels (Biryani Mix)', currentStock: 80, unit: 'pcs', purchasePrice: 1.5, minStockLevel: 100, purchaseDate: '2026-07-10', supplierId: 's3' },
      { id: 'rm12', name: 'Labels (Rasam Powder)', currentStock: 1200, unit: 'pcs', purchasePrice: 1.5, minStockLevel: 100, purchaseDate: '2026-07-10', supplierId: 's3' },
      { id: 'rm13', name: 'Labels (Chicken Sukka)', currentStock: 1500, unit: 'pcs', purchasePrice: 1.5, minStockLevel: 100, purchaseDate: '2026-07-10', supplierId: 's3' }
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
    batches: [
      {
        id: 'b1',
        batchNumber: 'BM01',
        productId: 'biryani',
        recipeId: 'rec1',
        manufacturingDate: '2026-07-10',
        bestBeforeDate: '2027-01-10',
        quantityProduced: 10.0,
        packSize: '100g',
        packetsProduced: 100,
        manufacturingCost: 5000,
        costPerPacket: 50,
        notes: 'Excellent aroma. Roasted in a single morning batch.',
        remainingStock: 50,
        shopsSupplied: ['Brahmavar Retail Mart', 'Udupi Spice Traders'],
        salesHistory: [
          { date: '2026-07-12', quantity: 30, revenue: 2700, profit: 1200 },
          { date: '2026-07-18', quantity: 20, revenue: 1800, profit: 800 }
        ]
      },
      {
        id: 'b2',
        batchNumber: 'RP01',
        productId: 'rasam',
        recipeId: 'rec2',
        manufacturingDate: '2026-07-12',
        bestBeforeDate: '2027-01-12',
        quantityProduced: 5.0,
        packSize: '50g',
        packetsProduced: 100,
        manufacturingCost: 2500,
        costPerPacket: 25,
        notes: 'Classic color and texture.',
        remainingStock: 45,
        shopsSupplied: ['Brahmavar Retail Mart'],
        salesHistory: [
          { date: '2026-07-15', quantity: 55, revenue: 2475, profit: 1100 }
        ]
      },
      {
        id: 'b3',
        batchNumber: 'CS01',
        productId: 'chicken-sukka',
        recipeId: 'rec3',
        manufacturingDate: '2026-07-18',
        bestBeforeDate: '2027-01-18',
        quantityProduced: 5.0,
        packSize: '50g',
        packetsProduced: 100,
        manufacturingCost: 2500,
        costPerPacket: 25,
        notes: 'Spicy and aromatic coastal style.',
        remainingStock: 10,
        shopsSupplied: ['Coastal Food Distributors'],
        salesHistory: [
          { date: '2026-07-19', quantity: 90, revenue: 4050, profit: 1800 }
        ]
      }
    ],
    suppliers: [
      { id: 's1', name: 'Malabar Spices Co.', contactNumber: '+91 9845012345', address: 'Market Road, Calicut, Kerala', ingredientsSupplied: 'Red Chillies, Pepper', outstandingPayments: 4500, purchaseHistory: [{ date: '2026-07-15', item: 'Red Chillies & Pepper', amount: 18000 }] },
      { id: 's2', name: 'Brahmavar Agro Suppliers', contactNumber: '+91 8244011223', address: 'NH 66, Brahmavar, Karnataka', ingredientsSupplied: 'Coriander, Cumin, Turmeric, Fenugreek, Curry Leaves, Asafoetida', outstandingPayments: 0, purchaseHistory: [{ date: '2026-07-15', item: 'Mixed Seeds & Turmeric', amount: 12000 }] },
      { id: 's3', name: 'Coastal Packaging Ltd.', contactNumber: '+91 8242045678', address: 'Baikampady Industrial Area, Mangalore, Karnataka', ingredientsSupplied: 'Pouches, Printed Labels', outstandingPayments: 1500, purchaseHistory: [{ date: '2026-07-10', item: 'Pouches & Labels', amount: 7750 }] }
    ],
    customers: [
      { id: 'c1', shopName: 'Brahmavar Retail Mart', ownerName: 'Ramesh Shetty', phoneNumber: '+91 9900887766', address: 'Opp. Bus Stand, Brahmavar, Karnataka', customerType: 'Retailer', outstandingBalance: 1200, notes: 'Pays within 10 days of delivery. Prefers Biryani Mix.' },
      { id: 'c2', shopName: 'Udupi Spice Traders', ownerName: 'Vignesh Kamath', phoneNumber: '+91 9886001122', address: 'Car Street, Udupi, Karnataka', customerType: 'Wholesaler', outstandingBalance: 4500, notes: 'Large bulk orders every month.' },
      { id: 'c3', shopName: 'Coastal Food Distributors', ownerName: 'Sandeep Salian', phoneNumber: '+91 9741002233', address: 'Kodialbail, Mangalore, Karnataka', customerType: 'Distributor', outstandingBalance: 0, notes: 'Distributes in Mangalore outskirts.' },
      { id: 'c4', shopName: 'Anita Hegde', ownerName: 'Anita Hegde', phoneNumber: '+91 9448003344', address: 'Kundapura, Karnataka', customerType: 'Direct Customer', outstandingBalance: 0, notes: 'Regular direct purchaser.' }
    ],
    deliveries: [
      { id: 'd1', deliveryDate: '2026-07-12', customerId: 'c1', productId: 'biryani', batchId: 'b1', quantity: 30, wholesalePrice: 90, totalAmount: 2700, status: 'Delivered', deliveredBy: 'Guru Prasad', notes: 'Delivered in the morning.' },
      { id: 'd2', deliveryDate: '2026-07-15', customerId: 'c1', productId: 'rasam', batchId: 'b2', quantity: 55, wholesalePrice: 45, totalAmount: 2475, status: 'Delivered', deliveredBy: 'Guru Prasad', notes: 'Partially paid.' },
      { id: 'd3', deliveryDate: '2026-07-18', customerId: 'c2', productId: 'biryani', batchId: 'b1', quantity: 20, wholesalePrice: 90, totalAmount: 1800, status: 'Delivered', deliveredBy: 'Raghavendra', notes: 'Invoiced to account.' },
      { id: 'd4', deliveryDate: '2026-07-19', customerId: 'c3', productId: 'chicken-sukka', batchId: 'b3', quantity: 90, wholesalePrice: 45, totalAmount: 4050, status: 'Delivered', deliveredBy: 'Raghavendra', notes: 'Paid in full on spot.' },
      { id: 'd5', deliveryDate: '2026-07-20', customerId: 'c1', productId: 'chicken-sukka', batchId: 'b3', quantity: 5, wholesalePrice: 45, totalAmount: 225, status: 'Dispatched', deliveredBy: 'Guru Prasad', notes: 'Pending delivery verification.' }
    ],
    sales: [
      {
        id: 's_inv_101',
        invoiceNumber: 'INV-1001',
        date: '2026-07-12',
        customerId: 'c1',
        discount: 0,
        paymentMethod: 'UPI',
        totalAmount: 2700,
        notes: 'Store invoice delivery.',
        items: [
          { productId: 'biryani', batchId: 'b1', quantity: 30, sellingPrice: 90, totalAmount: 2700 }
        ]
      },
      {
        id: 's_inv_102',
        invoiceNumber: 'INV-1002',
        date: '2026-07-15',
        customerId: 'c1',
        discount: 100,
        paymentMethod: 'Cash',
        totalAmount: 2375,
        notes: 'Cash payment with discount.',
        items: [
          { productId: 'rasam', batchId: 'b2', quantity: 55, sellingPrice: 45, totalAmount: 2475 }
        ]
      },
      {
        id: 's_inv_103',
        invoiceNumber: 'INV-1003',
        date: '2026-07-18',
        customerId: 'c2',
        discount: 0,
        paymentMethod: 'Bank Transfer',
        totalAmount: 1800,
        notes: 'Pending payment record.',
        items: [
          { productId: 'biryani', batchId: 'b1', quantity: 20, sellingPrice: 90, totalAmount: 1800 }
        ]
      },
      {
        id: 's_inv_104',
        invoiceNumber: 'INV-1004',
        date: '2026-07-19',
        customerId: 'c3',
        discount: 0,
        paymentMethod: 'UPI',
        totalAmount: 4050,
        notes: 'Full immediate payment.',
        items: [
          { productId: 'chicken-sukka', batchId: 'b3', quantity: 90, sellingPrice: 45, totalAmount: 4050 }
        ]
      }
    ],
    expenses: [
      { id: 'e1', category: 'Raw Materials', amount: 30000, date: '2026-07-15', description: 'Purchased seeds, pepper, chillies, pouches, labels.' },
      { id: 'e2', category: 'Transportation', amount: 1500, date: '2026-07-16', description: 'Diesel for delivery auto.' },
      { id: 'e3', category: 'Labour', amount: 4000, date: '2026-07-18', description: 'Weekly wages for roasting assistants.' },
      { id: 'e4', category: 'Electricity', amount: 2200, date: '2026-07-10', description: 'Electricity bill for grinding unit.' },
      { id: 'e5', category: 'Miscellaneous', amount: 500, date: '2026-07-20', description: 'Cleaning supplies.' }
    ],
    pendingPayments: [
      { id: 'pp1', customerId: 'c1', invoiceNumber: 'INV-1002', totalAmount: 2475, amountPaid: 1275, pendingAmount: 1200, dueDate: '2026-07-25', status: 'Pending' },
      { id: 'pp2', customerId: 'c2', invoiceNumber: 'INV-1003', totalAmount: 1800, amountPaid: 0, pendingAmount: 1800, dueDate: '2026-07-28', status: 'Pending' }
    ],
    orders: [
      { id: 'o1', invoiceNumber: 'INV-1001', customerId: 'c1', status: 'Paid', orderDate: '2026-07-12', notes: 'Completed.' },
      { id: 'o2', invoiceNumber: 'INV-1002', customerId: 'c1', status: 'Delivered', orderDate: '2026-07-15', notes: 'Pending final payment clearing.' },
      { id: 'o3', invoiceNumber: 'INV-1003', customerId: 'c2', status: 'Delivered', orderDate: '2026-07-18', notes: 'Awaiting bank transfer.' },
      { id: 'o4', invoiceNumber: 'INV-1004', customerId: 'c3', status: 'Paid', orderDate: '2026-07-19', notes: 'Completed.' },
      { id: 'o5', invoiceNumber: 'INV-1005', customerId: 'c1', status: 'Dispatched', orderDate: '2026-07-20', notes: 'In transit with delivery executive.' }
    ],
    salesTargets: [
      { id: 't1', period: '2026-07', targetRevenue: 50000, currentRevenue: 10925 }
    ],
    notifications: [
      { id: 'n1', type: 'Low Stock', message: 'Labels (Biryani Mix) is below minimum stock level (80/100 pcs).', date: '2026-07-10', read: false },
      { id: 'n2', type: 'Low Stock', message: 'Finished Product Chicken Sukka Masala is low on stock (10 packs left).', date: '2026-07-19', read: false },
      { id: 'n3', type: 'Pending Payment', message: 'Overdue warning: INV-1002 from Brahmavar Retail Mart is due in 5 days.', date: '2026-07-20', read: false }
    ],
    recentActivities: [
      { id: 'a1', action: 'Recorded Production Batch', details: 'Created batch BM01 (100 packets of Biryani Marination Mix). Raw materials automatically deducted.', timestamp: '2026-07-10T09:00:00Z' },
      { id: 'a2', action: 'Logged Sale', details: 'Invoice INV-1001 for 30 packs of Biryani Mix to Brahmavar Retail Mart.', timestamp: '2026-07-12T14:30:00Z' },
      { id: 'a3', action: 'Recorded Production Batch', details: 'Created batch RP01 (100 packets of Temple-Style Rasam Powder).', timestamp: '2026-07-12T10:00:00Z' },
      { id: 'a4', action: 'Logged Sale', details: 'Invoice INV-1002 for 55 packs of Rasam Powder to Brahmavar Retail Mart.', timestamp: '2026-07-15T16:15:00Z' },
      { id: 'a5', action: 'Recorded Production Batch', details: 'Created batch CS01 (100 packets of Chicken Sukka Masala).', timestamp: '2026-07-18T11:00:00Z' },
      { id: 'a6', action: 'Logged Sale', details: 'Invoice INV-1003 for 20 packs of Biryani Mix to Udupi Spice Traders.', timestamp: '2026-07-18T15:00:00Z' },
      { id: 'a7', action: 'Logged Sale', details: 'Invoice INV-1004 for 90 packs of Chicken Sukka Masala to Coastal Food Distributors.', timestamp: '2026-07-19T17:45:00Z' },
      { id: 'a8', action: 'Recorded Dispatch', details: 'Dispatched 5 packets of Chicken Sukka Masala to Brahmavar Retail Mart.', timestamp: '2026-07-20T11:30:00Z' }
    ]
  };

  return initialData;
}
