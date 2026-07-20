import { MongoClient } from 'mongodb';

const mongoUri = "mongodb://admin:GandhamSpices@ac-olif5ap-shard-00-00.7yd5f7j.mongodb.net:27017,ac-olif5ap-shard-00-01.7yd5f7j.mongodb.net:27017,ac-olif5ap-shard-00-02.7yd5f7j.mongodb.net:27017/gandham_spices?ssl=true&replicaSet=atlas-110us1-shard-0&authSource=admin";

const cleanData = {
  users: [
    {
      id: "u1",
      username: "admin",
      passwordHash: "$2b$10$/7GuRHn7Aa/k.cHT.JE2OOtbOuk0nA0HMFkm..H.lpZq/slehQ5QS",
      role: "Admin",
      name: "Gandham Spices Admin"
    }
  ],
  products: [
    {
      id: "biryani",
      sku: "GS-BM01",
      name: "Biryani Marination Mix",
      category: "Spice Blends",
      mrp: 120,
      wholesalePrice: 90,
      costPrice: 50,
      currentStock: 0,
      status: "Active",
      packSize: "100g"
    },
    {
      id: "rasam",
      sku: "GS-RP01",
      name: "Temple-Style Rasam Powder",
      category: "Spice Powders",
      mrp: 60,
      wholesalePrice: 45,
      costPrice: 25,
      currentStock: 0,
      status: "Active",
      packSize: "50g"
    },
    {
      id: "chicken-sukka",
      sku: "GS-CS01",
      name: "Chicken Sukka Masala",
      category: "Masalas",
      mrp: 60,
      wholesalePrice: 45,
      costPrice: 25,
      currentStock: 0,
      status: "Active",
      packSize: "50g"
    }
  ],
  rawMaterials: [
    { id: "rm1", name: "Red Chillies", currentStock: 0, unit: "kg", purchasePrice: 180, minStockLevel: 10, purchaseDate: "2026-07-20", supplierId: "" },
    { id: "rm2", name: "Coriander Seeds", currentStock: 0, unit: "kg", purchasePrice: 120, minStockLevel: 8, purchaseDate: "2026-07-20", supplierId: "" },
    { id: "rm3", name: "Cumin Seeds", currentStock: 0, unit: "kg", purchasePrice: 220, minStockLevel: 5, purchaseDate: "2026-07-20", supplierId: "" },
    { id: "rm4", name: "Fenugreek", currentStock: 0, unit: "kg", purchasePrice: 100, minStockLevel: 3, purchaseDate: "2026-07-20", supplierId: "" },
    { id: "rm5", name: "Pepper", currentStock: 0, unit: "kg", purchasePrice: 350, minStockLevel: 5, purchaseDate: "2026-07-20", supplierId: "" },
    { id: "rm6", name: "Turmeric", currentStock: 0, unit: "kg", purchasePrice: 150, minStockLevel: 5, purchaseDate: "2026-07-20", supplierId: "" },
    { id: "rm7", name: "Curry Leaves", currentStock: 0, unit: "kg", purchasePrice: 50, minStockLevel: 2, purchaseDate: "2026-07-20", supplierId: "" },
    { id: "rm8", name: "Asafoetida", currentStock: 0, unit: "kg", purchasePrice: 1200, minStockLevel: 1, purchaseDate: "2026-07-20", supplierId: "" },
    { id: "rm9", name: "Pouches (100g)", currentStock: 0, unit: "pcs", purchasePrice: 2.5, minStockLevel: 200, purchaseDate: "2026-07-20", supplierId: "" },
    { id: "rm10", name: "Pouches (50g)", currentStock: 0, unit: "pcs", purchasePrice: 2, minStockLevel: 250, purchaseDate: "2026-07-20", supplierId: "" },
    { id: "rm11", name: "Labels (Biryani Mix)", currentStock: 0, unit: "pcs", purchasePrice: 1.5, minStockLevel: 100, purchaseDate: "2026-07-20", supplierId: "" },
    { id: "rm12", name: "Labels (Rasam Powder)", currentStock: 0, unit: "pcs", purchasePrice: 1.5, minStockLevel: 100, purchaseDate: "2026-07-20", supplierId: "" },
    { id: "rm13", name: "Labels (Chicken Sukka)", currentStock: 0, unit: "pcs", purchasePrice: 1.5, minStockLevel: 100, purchaseDate: "2026-07-20", supplierId: "" }
  ],
  recipes: [
    {
      id: "rec1",
      name: "Biryani Marination Mix",
      productId: "biryani",
      yieldQuantity: 100,
      notes: "Classic hand-roasted recipe. Roast coriander and red chillies separately.",
      ingredients: [
        { rawMaterialId: "rm2", quantity: 0.04, unit: "kg" },
        { rawMaterialId: "rm3", quantity: 0.02, unit: "kg" },
        { rawMaterialId: "rm1", quantity: 0.02, unit: "kg" },
        { rawMaterialId: "rm5", quantity: 0.01, unit: "kg" },
        { rawMaterialId: "rm6", quantity: 0.005, unit: "kg" },
        { rawMaterialId: "rm9", quantity: 1, unit: "pcs" },
        { rawMaterialId: "rm11", quantity: 1, unit: "pcs" }
      ]
    },
    {
      id: "rec2",
      name: "Temple-Style Rasam Powder",
      productId: "rasam",
      yieldQuantity: 100,
      notes: "Roast with a few drops of pure coconut oil. Do not over-roast curry leaves.",
      ingredients: [
        { rawMaterialId: "rm2", quantity: 0.02, unit: "kg" },
        { rawMaterialId: "rm3", quantity: 0.01, unit: "kg" },
        { rawMaterialId: "rm1", quantity: 0.01, unit: "kg" },
        { rawMaterialId: "rm5", quantity: 0.005, unit: "kg" },
        { rawMaterialId: "rm7", quantity: 0.003, unit: "kg" },
        { rawMaterialId: "rm8", quantity: 0.002, unit: "kg" },
        { rawMaterialId: "rm10", quantity: 1, unit: "pcs" },
        { rawMaterialId: "rm12", quantity: 1, unit: "pcs" }
      ]
    },
    {
      id: "rec3",
      name: "Chicken Sukka Masala",
      productId: "chicken-sukka",
      yieldQuantity: 100,
      notes: "Roast spices slowly till dark brown. Add dried curry leaves during grinding.",
      ingredients: [
        { rawMaterialId: "rm2", quantity: 0.015, unit: "kg" },
        { rawMaterialId: "rm3", quantity: 0.01, unit: "kg" },
        { rawMaterialId: "rm1", quantity: 0.015, unit: "kg" },
        { rawMaterialId: "rm5", quantity: 0.005, unit: "kg" },
        { rawMaterialId: "rm6", quantity: 0.003, unit: "kg" },
        { rawMaterialId: "rm10", quantity: 1, unit: "pcs" },
        { rawMaterialId: "rm13", quantity: 1, unit: "pcs" }
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
    { id: "t1", period: "2026-07", targetRevenue: 50000, currentRevenue: 0 }
  ],
  notifications: [],
  recentActivities: []
};

async function clearMongo() {
  console.log('Connecting to clear database...');
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db('gandham_spices');
    const collection = db.collection('state');
    await collection.updateOne(
      { id: 'global_state' },
      { $set: { data: cleanData } },
      { upsert: true }
    );
    console.log('Wiped database state in MongoDB Atlas!');
  } catch (err) {
    console.error('Error clearing:', err);
  } finally {
    await client.close();
  }
}

clearMongo();
