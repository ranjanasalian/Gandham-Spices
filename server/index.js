import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDB, commit } from './db.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'gandham-secret-key-2026';

app.use(cors());
app.use(express.json());

// Helper: Parse Date baseline (always defaulting to 2026-07-20 for realistic dashboard stats)
const getBaselineDate = () => new Date('2026-07-20');

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. Token missing.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Access denied. Invalid or expired token.' });
    req.user = user;
    next();
  });
}

// ---------------- AUTH ROUTES ----------------
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const db = getDB();
  const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(400).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const db = getDB();
  const userIndex = db.users.findIndex(u => u.id === req.user.id);

  if (userIndex === -1) return res.status(404).json({ message: 'User not found' });
  const user = db.users[userIndex];

  if (!bcrypt.compareSync(currentPassword, user.passwordHash)) {
    return res.status(400).json({ message: 'Current password is incorrect' });
  }

  const salt = bcrypt.genSaltSync(10);
  user.passwordHash = bcrypt.hashSync(newPassword, salt);
  
  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Changed Password',
    details: `Admin changed password.`,
    timestamp: new Date().toISOString()
  });

  await commit();
  res.json({ message: 'Password changed successfully' });
});


// ---------------- STATS & CHARTS ROUTE ----------------
app.get('/api/admin/dashboard-stats', authenticateToken, (req, res) => {
  const { range, startDate, endDate } = req.query;
  const db = getDB();

  // Baseline is 2026-07-20
  const baseline = getBaselineDate();
  
  let start = new Date(baseline);
  let end = new Date(baseline);

  if (range === 'today') {
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
  } else if (range === 'week') {
    start.setDate(baseline.getDate() - 6);
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
  } else if (range === 'month') {
    start.setDate(1);
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
  } else if (range === 'year') {
    start.setMonth(0, 1);
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
  } else if (range === 'custom' && startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    end.setHours(23,59,59,999);
  } else {
    // Default to 'week' if unspecified
    start.setDate(baseline.getDate() - 6);
    start.setHours(0,0,0,0);
  }

  const isInRange = (dateStr) => {
    const d = new Date(dateStr);
    return d >= start && d <= end;
  };

  // Filter lists based on date
  const filteredSales = db.sales.filter(s => isInRange(s.date));
  const filteredDeliveries = db.deliveries.filter(d => isInRange(d.deliveryDate));
  const filteredBatches = db.batches.filter(b => isInRange(b.manufacturingDate));
  const filteredExpenses = db.expenses.filter(e => isInRange(e.date));
  const filteredOrders = db.orders.filter(o => isInRange(o.orderDate));

  // 1. Products Manufactured Today (Count of packets)
  const productsManufactured = filteredBatches.reduce((acc, b) => acc + b.packetsProduced, 0);

  // 2. Products Sold Today (Count of packets)
  const productsSold = filteredSales.reduce((acc, s) => {
    return acc + s.items.reduce((sum, item) => sum + item.quantity, 0);
  }, 0);

  // 3. Products Delivered Today
  const productsDelivered = filteredDeliveries
    .filter(d => d.status === 'Delivered')
    .reduce((acc, d) => acc + d.quantity, 0);

  // 4. Current Inventory (sum of stock of finished goods)
  const currentInventory = db.products.reduce((acc, p) => acc + p.currentStock, 0);

  // 5. Total Revenue
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);

  // 6. Expenses
  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  // 7. Total Profit
  // Profit = Revenue - Cost Price of items sold.
  // Net Profit = Profit - Other Expenses.
  let grossProfit = 0;
  filteredSales.forEach(s => {
    s.items.forEach(item => {
      const prod = db.products.find(p => p.id === item.productId);
      const cost = prod ? prod.costPrice : 0;
      grossProfit += (item.sellingPrice - cost) * item.quantity;
    });
  });
  const totalProfit = Math.max(0, grossProfit - totalExpenses);

  // 8. Pending Payments (unpaid outstanding invoices)
  const pendingPayments = db.pendingPayments
    .filter(p => p.status === 'Pending')
    .reduce((acc, p) => acc + p.pendingAmount, 0);

  // 9. Total Customers
  const totalCustomers = db.customers.length;

  // 10. Total Shops (Wholesalers, Retailers, Distributors)
  const totalShops = db.customers.filter(c => c.customerType !== 'Direct Customer').length;

  // 11. Orders Received
  const ordersReceived = filteredOrders.length;

  // 12. Orders Delivered (in stage Delivered or Paid)
  const ordersDelivered = filteredOrders.filter(o => o.status === 'Delivered' || o.status === 'Paid').length;

  // 13. Low Stock Alerts
  const lowStockMaterials = db.rawMaterials.filter(rm => rm.currentStock < rm.minStockLevel).length;
  const lowStockProducts = db.products.filter(p => p.currentStock < 20).length;
  const lowStockAlerts = lowStockMaterials + lowStockProducts;

  // Recent Activities
  const recentActivities = db.recentActivities.slice(0, 8);

  // ---------------- CHART DATA GENERATION ----------------
  // Generate daily points for the last N days
  const dateMap = {};
  const tempDate = new Date(start);
  while (tempDate <= end) {
    const key = tempDate.toISOString().split('T')[0];
    dateMap[key] = { date: key, sales: 0, revenue: 0, profit: 0 };
    tempDate.setDate(tempDate.getDate() + 1);
  }

  // Populate sales & revenue
  filteredSales.forEach(s => {
    const key = s.date;
    if (dateMap[key]) {
      dateMap[key].revenue += s.totalAmount;
      dateMap[key].sales += s.items.reduce((sum, item) => sum + item.quantity, 0);
      
      let saleProfit = 0;
      s.items.forEach(item => {
        const prod = db.products.find(p => p.id === item.productId);
        const cost = prod ? prod.costPrice : 0;
        saleProfit += (item.sellingPrice - cost) * item.quantity;
      });
      dateMap[key].profit += saleProfit;
    }
  });

  const chartData = Object.values(dateMap).sort((a,b) => a.date.localeCompare(b.date));

  // Product performance chart data (Top selling products)
  const productSales = {};
  db.products.forEach(p => {
    productSales[p.id] = { name: p.name, quantity: 0, revenue: 0 };
  });

  filteredSales.forEach(s => {
    s.items.forEach(item => {
      if (productSales[item.productId]) {
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.totalAmount;
      }
    });
  });
  const productPerformance = Object.values(productSales).sort((a,b) => b.revenue - a.revenue);

  // Inventory breakdown data
  const inventoryData = db.products.map(p => ({
    name: p.name,
    stock: p.currentStock
  }));

  res.json({
    summary: {
      productsManufactured,
      productsSold,
      productsDelivered,
      currentInventory,
      totalRevenue,
      totalProfit,
      totalExpenses,
      pendingPayments,
      totalCustomers,
      totalShops,
      ordersReceived,
      ordersDelivered,
      lowStockAlerts
    },
    charts: {
      dailyTrends: chartData,
      productPerformance,
      inventoryData
    },
    recentActivities
  });
});


// ---------------- PRODUCTS CRUD ----------------
app.get('/api/admin/products', authenticateToken, (req, res) => {
  res.json(getDB().products);
});

app.post('/api/auth/register-dummy', async (req, res) => {
  // Utility for testing
  res.status(404).json({ message: 'Registration disabled' });
});

app.post('/api/admin/products', authenticateToken, async (req, res) => {
  const db = getDB();
  const newProduct = {
    id: `prod_${Date.now()}`,
    ...req.body
  };
  db.products.push(newProduct);
  
  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Added Product',
    details: `Added new product ${newProduct.name} (SKU: ${newProduct.sku})`,
    timestamp: new Date().toISOString()
  });

  await commit();
  res.status(201).json(newProduct);
});

app.put('/api/admin/products/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Product not found' });

  db.products[index] = { ...db.products[index], ...req.body };

  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Updated Product',
    details: `Updated details for ${db.products[index].name}`,
    timestamp: new Date().toISOString()
  });

  await commit();
  res.json(db.products[index]);
});

app.delete('/api/admin/products/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Product not found' });

  const deleted = db.products.splice(index, 1)[0];

  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Deleted Product',
    details: `Removed product ${deleted.name}`,
    timestamp: new Date().toISOString()
  });

  await commit();
  res.json({ message: 'Product deleted', product: deleted });
});


// ---------------- RAW MATERIALS CRUD ----------------
app.get('/api/admin/raw-materials', authenticateToken, (req, res) => {
  res.json(getDB().rawMaterials);
});

app.post('/api/admin/raw-materials', authenticateToken, async (req, res) => {
  const db = getDB();
  const newMaterial = {
    id: `rm_${Date.now()}`,
    ...req.body,
    currentStock: parseFloat(req.body.currentStock || 0)
  };
  db.rawMaterials.push(newMaterial);

  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Added Raw Material',
    details: `Added ${newMaterial.name} to raw materials inventory`,
    timestamp: new Date().toISOString()
  });

  await commit();
  res.status(201).json(newMaterial);
});

app.put('/api/admin/raw-materials/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.rawMaterials.findIndex(rm => rm.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Raw material not found' });

  db.rawMaterials[index] = { 
    ...db.rawMaterials[index], 
    ...req.body,
    currentStock: parseFloat(req.body.currentStock ?? db.rawMaterials[index].currentStock)
  };

  await commit();
  res.json(db.rawMaterials[index]);
});

// Record Purchase and auto-create Expense
app.post('/api/admin/raw-materials/purchase', authenticateToken, async (req, res) => {
  const { rawMaterialId, quantity, purchasePrice, supplierId, purchaseDate } = req.body;
  const db = getDB();

  const rmIndex = db.rawMaterials.findIndex(rm => rm.id === rawMaterialId);
  if (rmIndex === -1) return res.status(404).json({ message: 'Raw Material not found' });
  const rm = db.rawMaterials[rmIndex];

  const qty = parseFloat(quantity);
  const price = parseFloat(purchasePrice);
  const cost = qty * price;

  // Update material stock
  rm.currentStock += qty;
  rm.purchasePrice = price;
  rm.purchaseDate = purchaseDate;
  rm.supplierId = supplierId;

  // Add Expense
  const expenseId = `e_${Date.now()}`;
  db.expenses.push({
    id: expenseId,
    category: 'Raw Materials',
    amount: cost,
    date: purchaseDate,
    description: `Purchased ${qty} ${rm.unit} of ${rm.name} @ ₹${price}/${rm.unit}`
  });

  // Log supplier purchase history
  const supplier = db.suppliers.find(s => s.id === supplierId);
  if (supplier) {
    supplier.purchaseHistory.unshift({
      date: purchaseDate,
      item: `${rm.name} (${qty} ${rm.unit})`,
      amount: cost
    });
    // Add to outstanding payments if unpaid (we assume unpaid for demo if not paid in full)
    supplier.outstandingPayments += cost;
  }

  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Purchased Raw Material',
    details: `Purchased ${qty} ${rm.unit} of ${rm.name}. Auto-recorded ₹${cost} expense.`,
    timestamp: new Date().toISOString()
  });

  // Re-check stock levels
  if (rm.currentStock >= rm.minStockLevel) {
    // Dismiss old notifications for this low stock
    db.notifications = db.notifications.filter(n => !(n.type === 'Low Stock' && n.message.includes(rm.name)));
  }

  await commit();
  res.json({ message: 'Purchase logged successfully', rawMaterial: rm });
});

app.delete('/api/admin/raw-materials/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.rawMaterials.findIndex(rm => rm.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Raw material not found' });

  const deleted = db.rawMaterials.splice(index, 1)[0];
  await commit();
  res.json({ message: 'Deleted raw material', rawMaterial: deleted });
});


// ---------------- RECIPES CRUD ----------------
app.get('/api/admin/recipes', authenticateToken, (req, res) => {
  res.json(getDB().recipes);
});

app.post('/api/admin/recipes', authenticateToken, async (req, res) => {
  const db = getDB();
  const newRecipe = {
    id: `rec_${Date.now()}`,
    ...req.body
  };
  db.recipes.push(newRecipe);

  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Created Recipe',
    details: `Created recipe blueprint for ${newRecipe.name}`,
    timestamp: new Date().toISOString()
  });

  await commit();
  res.status(201).json(newRecipe);
});

app.put('/api/admin/recipes/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.recipes.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Recipe not found' });

  db.recipes[index] = { ...db.recipes[index], ...req.body };
  await commit();
  res.json(db.recipes[index]);
});

app.delete('/api/admin/recipes/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.recipes.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Recipe not found' });

  const deleted = db.recipes.splice(index, 1)[0];
  await commit();
  res.json({ message: 'Recipe deleted', recipe: deleted });
});


// ---------------- BATCHES (PRODUCTION) CRUD & TRACEABILITY ----------------
app.get('/api/admin/batches', authenticateToken, (req, res) => {
  res.json(getDB().batches);
});

// Create Batch: auto-deduct raw materials & add finished product stock
app.post('/api/admin/batches', authenticateToken, async (req, res) => {
  const { productId, recipeId, manufacturingDate, bestBeforeDate, quantityProduced, packSize, packetsProduced, manufacturingCost, notes } = req.body;
  const db = getDB();

  const product = db.products.find(p => p.id === productId);
  const recipe = db.recipes.find(r => r.id === recipeId);

  if (!product || !recipe) {
    return res.status(400).json({ message: 'Product or Recipe not found' });
  }

  // Derive Prefix for Batch Number
  // E.g. "Biryani Marination Mix" -> BM
  let prefix = 'BM';
  if (product.name.toLowerCase().includes('rasam')) prefix = 'RP';
  else if (product.name.toLowerCase().includes('sukka')) prefix = 'CS';
  else {
    // Fallback: take initials
    prefix = product.name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // Auto-generate next sequential batch number
  const productBatches = db.batches.filter(b => b.productId === productId && b.batchNumber.startsWith(prefix));
  let maxNum = 0;
  productBatches.forEach(b => {
    const numStr = b.batchNumber.substring(prefix.length);
    const num = parseInt(numStr, 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  });
  const nextNum = maxNum + 1;
  const nextBatchNumber = `${prefix}${String(nextNum).padStart(2, '0')}`;

  const packetsCount = parseInt(packetsProduced, 10);
  const mfgCost = parseFloat(manufacturingCost || 0);
  const costPerPack = packetsCount > 0 ? parseFloat((mfgCost / packetsCount).toFixed(2)) : 0;

  // 1. Deduct Raw Materials from recipe
  // For 1 pack, recipe lists quantities. So we multiply recipe quantity * packetsCount.
  const missingMaterials = [];
  recipe.ingredients.forEach(ing => {
    const rm = db.rawMaterials.find(m => m.id === ing.rawMaterialId);
    if (!rm) {
      missingMaterials.push(`Raw material ID ${ing.rawMaterialId} not configured.`);
      return;
    }
    const needed = ing.quantity * packetsCount;
    if (rm.currentStock < needed) {
      missingMaterials.push(`Insufficient stock for ${rm.name}. Needed: ${needed}${rm.unit}, Current: ${rm.currentStock}${rm.unit}`);
    }
  });

  if (missingMaterials.length > 0) {
    return res.status(400).json({ 
      message: 'Cannot record production batch. Raw material shortages:',
      errors: missingMaterials
    });
  }

  // Deduct stock and trigger alerts
  recipe.ingredients.forEach(ing => {
    const rm = db.rawMaterials.find(m => m.id === ing.rawMaterialId);
    const needed = ing.quantity * packetsCount;
    rm.currentStock = parseFloat((rm.currentStock - needed).toFixed(3));

    // Low stock notification trigger
    if (rm.currentStock < rm.minStockLevel) {
      const exists = db.notifications.some(n => n.type === 'Low Stock' && n.message.includes(rm.name));
      if (!exists) {
        db.notifications.unshift({
          id: `n_${Date.now()}_${rm.id}`,
          type: 'Low Stock',
          message: `Alert: Raw material ${rm.name} has fallen below minimum level (${rm.currentStock}/${rm.minStockLevel} ${rm.unit}).`,
          date: manufacturingDate,
          read: false
        });
      }
    }
  });

  // 2. Increment Finished Product stock
  product.currentStock += packetsCount;

  // 3. Create the batch
  const newBatch = {
    id: `b_${Date.now()}`,
    batchNumber: nextBatchNumber,
    productId,
    recipeId,
    manufacturingDate,
    bestBeforeDate,
    quantityProduced: parseFloat(quantityProduced),
    packSize,
    packetsProduced: packetsCount,
    manufacturingCost: mfgCost,
    costPerPacket: costPerPack,
    notes,
    remainingStock: packetsCount,
    shopsSupplied: [],
    salesHistory: []
  };

  db.batches.push(newBatch);

  // 4. Log Activity
  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Recorded Production Batch',
    details: `Created batch ${nextBatchNumber} (${packetsCount} packs of ${product.name}). Deducted ingredients.`,
    timestamp: new Date().toISOString()
  });

  // Trigger Low product stock dismissals
  if (product.currentStock >= 20) {
    db.notifications = db.notifications.filter(n => !(n.type === 'Low Stock' && n.message.includes(product.name)));
  }

  await commit();
  res.status(201).json(newBatch);
});

// Traceability Lookup by Batch Number
app.get('/api/admin/batches/trace/:batchNumber', authenticateToken, (req, res) => {
  const { batchNumber } = req.params;
  const db = getDB();

  const batch = db.batches.find(b => b.batchNumber.toLowerCase() === batchNumber.trim().toLowerCase());
  if (!batch) return res.status(404).json({ message: `Batch ${batchNumber} not found.` });

  const product = db.products.find(p => p.id === batch.productId);
  const recipe = db.recipes.find(r => r.id === batch.recipeId);

  // Map ingredients used
  const ingredientsUsed = recipe ? recipe.ingredients.map(ing => {
    const rm = db.rawMaterials.find(m => m.id === ing.rawMaterialId);
    return {
      name: rm ? rm.name : 'Unknown Material',
      quantityTotal: (ing.quantity * batch.packetsProduced).toFixed(2),
      unit: rm ? rm.unit : ''
    };
  }) : [];

  // Track deliveries containing this batch
  const matchedDeliveries = db.deliveries.filter(d => d.batchNumber === batch.batchNumber || d.batchId === batch.id);
  const shopsSupplied = Array.from(new Set(matchedDeliveries.map(d => {
    const cust = db.customers.find(c => c.id === d.customerId);
    return cust ? cust.shopName : 'Direct Customer';
  })));

  // Track sales containing this batch
  const salesHistory = [];
  let totalRevenueGenerated = 0;
  let totalProfitGenerated = 0;

  db.sales.forEach(sale => {
    const batchItems = sale.items.filter(item => item.batchId === batch.id || item.batchNumber === batch.batchNumber);
    if (batchItems.length > 0) {
      const cust = db.customers.find(c => c.id === sale.customerId);
      const qtySold = batchItems.reduce((acc, item) => acc + item.quantity, 0);
      const rev = batchItems.reduce((acc, item) => acc + item.totalAmount, 0);
      
      const costOfItem = product ? product.costPrice : 0;
      const profit = batchItems.reduce((acc, item) => acc + (item.sellingPrice - costOfItem) * item.quantity, 0);

      totalRevenueGenerated += rev;
      totalProfitGenerated += profit;

      salesHistory.push({
        invoiceNumber: sale.invoiceNumber,
        date: sale.date,
        customerName: cust ? cust.shopName : 'Direct Customer',
        quantity: qtySold,
        revenue: rev,
        profit: profit
      });
    }
  });

  res.json({
    batch,
    product,
    recipe,
    ingredientsUsed,
    shopsSupplied,
    salesHistory,
    financials: {
      revenueGenerated: totalRevenueGenerated,
      profitGenerated: Math.max(0, totalProfitGenerated),
      remainingStockValue: batch.remainingStock * batch.costPerPacket
    }
  });
});

app.delete('/api/admin/batches/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.batches.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Batch not found' });

  const deleted = db.batches.splice(index, 1)[0];
  await commit();
  res.json({ message: 'Batch record removed', batch: deleted });
});


// ---------------- CUSTOMERS / SHOPS CRUD ----------------
app.get('/api/admin/customers', authenticateToken, (req, res) => {
  res.json(getDB().customers);
});

app.post('/api/admin/customers', authenticateToken, async (req, res) => {
  const db = getDB();
  const newCustomer = {
    id: `c_${Date.now()}`,
    outstandingBalance: 0,
    ...req.body
  };
  db.customers.push(newCustomer);
  await commit();
  res.status(201).json(newCustomer);
});

app.put('/api/admin/customers/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.customers.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Customer not found' });

  db.customers[index] = { 
    ...db.customers[index], 
    ...req.body,
    outstandingBalance: parseFloat(req.body.outstandingBalance ?? db.customers[index].outstandingBalance)
  };
  await commit();
  res.json(db.customers[index]);
});

app.delete('/api/admin/customers/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.customers.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Customer not found' });

  const deleted = db.customers.splice(index, 1)[0];
  await commit();
  res.json({ message: 'Customer profile deleted', customer: deleted });
});


// ---------------- DELIVERIES CRUD ----------------
app.get('/api/admin/deliveries', authenticateToken, (req, res) => {
  res.json(getDB().deliveries);
});

app.post('/api/admin/deliveries', authenticateToken, async (req, res) => {
  const db = getDB();
  const newDelivery = {
    id: `d_${Date.now()}`,
    status: 'Pending',
    ...req.body,
    quantity: parseInt(req.body.quantity, 10),
    wholesalePrice: parseFloat(req.body.wholesalePrice),
    totalAmount: parseInt(req.body.quantity, 10) * parseFloat(req.body.wholesalePrice)
  };

  db.deliveries.push(newDelivery);
  await commit();
  res.status(201).json(newDelivery);
});

app.put('/api/admin/deliveries/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.deliveries.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Delivery record not found' });

  const prevStatus = db.deliveries[index].status;
  db.deliveries[index] = { ...db.deliveries[index], ...req.body };

  // Log dispatch or delivery events
  if (req.body.status && req.body.status !== prevStatus) {
    db.recentActivities.unshift({
      id: `a_${Date.now()}`,
      action: `Delivery ${req.body.status}`,
      details: `Delivery status updated to ${req.body.status} for ${db.deliveries[index].quantity} packets to customer.`,
      timestamp: new Date().toISOString()
    });
  }

  await commit();
  res.json(db.deliveries[index]);
});

app.delete('/api/admin/deliveries/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.deliveries.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Delivery record not found' });

  const deleted = db.deliveries.splice(index, 1)[0];
  await commit();
  res.json({ message: 'Delivery record deleted', delivery: deleted });
});


// ---------------- SALES & INVOICING CRUD ----------------
app.get('/api/admin/sales', authenticateToken, (req, res) => {
  res.json(getDB().sales);
});

app.post('/api/admin/sales', authenticateToken, async (req, res) => {
  const { date, customerId, discount, paymentMethod, items, notes } = req.body;
  const db = getDB();

  // Find Customer
  const customer = db.customers.find(c => c.id === customerId);
  if (!customer) return res.status(400).json({ message: 'Customer profile required.' });

  // Generate Invoice Number
  const maxInvoiceNum = db.sales.reduce((max, s) => {
    const num = parseInt(s.invoiceNumber.replace('INV-', ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 1000);
  const nextInvoiceNumber = `INV-${maxInvoiceNum + 1}`;

  // Validate and update stock
  const errorStock = [];
  let subtotal = 0;

  items.forEach(item => {
    const product = db.products.find(p => p.id === item.productId);
    const batch = db.batches.find(b => b.id === item.batchId);

    if (!product) {
      errorStock.push(`Product ID ${item.productId} not found.`);
      return;
    }
    if (!batch) {
      errorStock.push(`Production batch not selected for ${product.name}.`);
      return;
    }

    const qty = parseInt(item.quantity, 10);
    if (batch.remainingStock < qty) {
      errorStock.push(`Insufficient stock in batch ${batch.batchNumber} for ${product.name}. Available: ${batch.remainingStock}, Requested: ${qty}`);
    } else {
      subtotal += qty * parseFloat(item.sellingPrice);
    }
  });

  if (errorStock.length > 0) {
    return res.status(400).json({ message: 'Stock error:', errors: errorStock });
  }

  const discountAmount = parseFloat(discount || 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);

  // Commit Stock deductions and batch links
  const processedItems = items.map(item => {
    const product = db.products.find(p => p.id === item.productId);
    const batch = db.batches.find(b => b.id === item.batchId);
    const qty = parseInt(item.quantity, 10);
    const itemPrice = parseFloat(item.sellingPrice);

    // Deduct batch inventory
    batch.remainingStock -= qty;
    
    // Add shop to supplied list if not present
    if (!batch.shopsSupplied.includes(customer.shopName)) {
      batch.shopsSupplied.push(customer.shopName);
    }

    // Deduct product inventory
    product.currentStock -= qty;

    // Trigger finished product low stock notification
    if (product.currentStock < 20) {
      const exists = db.notifications.some(n => n.type === 'Low Stock' && n.message.includes(product.name));
      if (!exists) {
        db.notifications.unshift({
          id: `n_${Date.now()}_${product.id}`,
          type: 'Low Stock',
          message: `Alert: Finished product ${product.name} is low on stock (${product.currentStock} packs left).`,
          date: date,
          read: false
        });
      }
    }

    return {
      productId: item.productId,
      batchId: item.batchId,
      batchNumber: batch.batchNumber,
      quantity: qty,
      sellingPrice: itemPrice,
      totalAmount: qty * itemPrice
    };
  });

  // Create Sale invoice
  const newSale = {
    id: `s_${Date.now()}`,
    invoiceNumber: nextInvoiceNumber,
    date,
    customerId,
    discount: discountAmount,
    paymentMethod,
    totalAmount,
    notes,
    items: processedItems
  };

  db.sales.push(newSale);

  // Handle payments (Outstanding Balances vs Pending payments)
  const isCredit = paymentMethod === 'Credit' || paymentMethod === 'Bank Transfer' || paymentMethod === 'Due';
  if (isCredit) {
    customer.outstandingBalance += totalAmount;

    // Add Pending Payment record
    db.pendingPayments.push({
      id: `pp_${Date.now()}`,
      customerId,
      invoiceNumber: nextInvoiceNumber,
      totalAmount,
      amountPaid: 0,
      pendingAmount: totalAmount,
      dueDate: new Date(new Date(date).getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 days due
      status: 'Pending'
    });
  }

  // Create Order in pipeline (Paid or Delivered depending on cash vs credit)
  db.orders.push({
    id: `o_${Date.now()}`,
    invoiceNumber: nextInvoiceNumber,
    customerId,
    status: isCredit ? 'Delivered' : 'Paid', // credit -> delivered but unpaid, cash -> paid
    orderDate: date,
    notes: `Generated via sales log. Payment: ${paymentMethod}`
  });

  // Update Sales Target Progression for the current month
  const monthKey = date.substring(0, 7); // e.g. "2026-07"
  const target = db.salesTargets.find(t => t.period === monthKey);
  if (target) {
    target.currentRevenue += totalAmount;
  }

  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Logged Sale / Invoice',
    details: `Logged Invoice ${nextInvoiceNumber} to ${customer.shopName} for ₹${totalAmount}.`,
    timestamp: new Date().toISOString()
  });

  await commit();
  res.status(201).json(newSale);
});

app.delete('/api/admin/sales/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.sales.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Sale invoice not found' });

  const deleted = db.sales.splice(index, 1)[0];
  // Note: we do not automatically reverse stock to prevent batch historical conflicts in this simple demo, but we log the delete action.
  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Deleted Invoice',
    details: `Deleted Invoice ${deleted.invoiceNumber} (₹${deleted.totalAmount}).`,
    timestamp: new Date().toISOString()
  });

  await commit();
  res.json({ message: 'Invoice removed', sale: deleted });
});


// ---------------- EXPENSES CRUD ----------------
app.get('/api/admin/expenses', authenticateToken, (req, res) => {
  res.json(getDB().expenses);
});

app.post('/api/admin/expenses', authenticateToken, async (req, res) => {
  const db = getDB();
  const newExpense = {
    id: `e_${Date.now()}`,
    amount: parseFloat(req.body.amount),
    ...req.body
  };
  db.expenses.push(newExpense);

  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Logged Expense',
    details: `Recorded ₹${newExpense.amount} expense under ${newExpense.category}`,
    timestamp: new Date().toISOString()
  });

  await commit();
  res.status(201).json(newExpense);
});

app.put('/api/admin/expenses/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.expenses.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Expense not found' });

  db.expenses[index] = { ...db.expenses[index], ...req.body, amount: parseFloat(req.body.amount) };
  await commit();
  res.json(db.expenses[index]);
});

app.delete('/api/admin/expenses/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.expenses.findIndex(e => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Expense not found' });

  const deleted = db.expenses.splice(index, 1)[0];
  await commit();
  res.json({ message: 'Expense deleted', expense: deleted });
});


// ---------------- PENDING PAYMENTS CRUD ----------------
app.get('/api/admin/pending-payments', authenticateToken, (req, res) => {
  res.json(getDB().pendingPayments);
});

app.post('/api/admin/pending-payments/:id/pay', authenticateToken, async (req, res) => {
  const { amountPaid } = req.body;
  const db = getDB();

  const ppIndex = db.pendingPayments.findIndex(p => p.id === req.params.id);
  if (ppIndex === -1) return res.status(404).json({ message: 'Payment record not found' });
  const pp = db.pendingPayments[ppIndex];

  const pay = parseFloat(amountPaid);
  pp.amountPaid += pay;
  pp.pendingAmount = Math.max(0, pp.totalAmount - pp.amountPaid);

  if (pp.pendingAmount === 0) {
    pp.status = 'Paid';
  }

  // Deduct from customer's outstanding balance
  const customer = db.customers.find(c => c.id === pp.customerId);
  if (customer) {
    customer.outstandingBalance = Math.max(0, customer.outstandingBalance - pay);
  }

  // Find order associated and update to Paid status if pending amount is 0
  const order = db.orders.find(o => o.invoiceNumber === pp.invoiceNumber);
  if (order && pp.pendingAmount === 0) {
    order.status = 'Paid';
  }

  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Collected Payment',
    details: `Collected ₹${pay} for invoice ${pp.invoiceNumber} from ${customer ? customer.shopName : 'Customer'}.`,
    timestamp: new Date().toISOString()
  });

  // Re-check overdue warnings and dismiss them
  if (pp.status === 'Paid') {
    db.notifications = db.notifications.filter(n => !(n.type === 'Pending Payment' && n.message.includes(pp.invoiceNumber)));
  }

  await commit();
  res.json({ message: 'Payment applied successfully', pendingPayment: pp });
});


// ---------------- ORDER WORKFLOW CRUD ----------------
app.get('/api/admin/orders', authenticateToken, (req, res) => {
  res.json(getDB().orders);
});

app.put('/api/admin/orders/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.orders.findIndex(o => o.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Order not found' });

  const prevStatus = db.orders[index].status;
  db.orders[index] = { ...db.orders[index], ...req.body };

  if (req.body.status && req.body.status !== prevStatus) {
    db.recentActivities.unshift({
      id: `a_${Date.now()}`,
      action: 'Order Stage Shift',
      details: `Order ${db.orders[index].invoiceNumber} moved to stage: ${req.body.status}`,
      timestamp: new Date().toISOString()
    });
  }

  await commit();
  res.json(db.orders[index]);
});


// ---------------- SUPPLIERS CRUD ----------------
app.get('/api/admin/suppliers', authenticateToken, (req, res) => {
  res.json(getDB().suppliers);
});

app.post('/api/admin/suppliers', authenticateToken, async (req, res) => {
  const db = getDB();
  const newSupplier = {
    id: `s_${Date.now()}`,
    outstandingPayments: 0,
    purchaseHistory: [],
    ...req.body
  };
  db.suppliers.push(newSupplier);
  await commit();
  res.status(201).json(newSupplier);
});

app.put('/api/admin/suppliers/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.suppliers.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Supplier not found' });

  db.suppliers[index] = { 
    ...db.suppliers[index], 
    ...req.body,
    outstandingPayments: parseFloat(req.body.outstandingPayments ?? db.suppliers[index].outstandingPayments)
  };
  await commit();
  res.json(db.suppliers[index]);
});

app.delete('/api/admin/suppliers/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.suppliers.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Supplier not found' });

  const deleted = db.suppliers.splice(index, 1)[0];
  await commit();
  res.json({ message: 'Supplier removed', supplier: deleted });
});


// ---------------- SALES TARGETS CRUD ----------------
app.get('/api/admin/targets', authenticateToken, (req, res) => {
  res.json(getDB().salesTargets);
});

app.post('/api/admin/targets', authenticateToken, async (req, res) => {
  const { period, targetRevenue } = req.body;
  const db = getDB();

  let target = db.salesTargets.find(t => t.period === period);
  if (target) {
    target.targetRevenue = parseFloat(targetRevenue);
  } else {
    // calculate current revenue for that month
    const rev = db.sales
      .filter(s => s.date.startsWith(period))
      .reduce((acc, s) => acc + s.totalAmount, 0);

    target = {
      id: `t_${Date.now()}`,
      period,
      targetRevenue: parseFloat(targetRevenue),
      currentRevenue: rev
    };
    db.salesTargets.push(target);
  }

  await commit();
  res.json(target);
});


// ---------------- NOTIFICATIONS CRUD ----------------
app.get('/api/admin/notifications', authenticateToken, (req, res) => {
  res.json(getDB().notifications);
});

app.post('/api/admin/notifications/dismiss', authenticateToken, async (req, res) => {
  const { id } = req.body;
  const db = getDB();
  db.notifications = db.notifications.filter(n => n.id !== id);
  await commit();
  res.json({ success: true });
});

app.get('/api/admin/activities', authenticateToken, (req, res) => {
  res.json(getDB().recentActivities);
});


// ---------------- REPORTS DATA GENERATION ----------------
app.get('/api/admin/reports', authenticateToken, (req, res) => {
  const { type, startDate, endDate } = req.query;
  const db = getDB();

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23,59,59,999);

  const filterByDate = (list, key) => {
    return list.filter(item => {
      const d = new Date(item[key]);
      return d >= start && d <= end;
    });
  };

  let reportData = [];
  let summary = {};

  switch (type) {
    case 'today-sales':
    case 'weekly-sales':
    case 'monthly-sales':
    case 'yearly-sales': {
      const filteredSales = filterByDate(db.sales, 'date');
      reportData = filteredSales.map(s => {
        const cust = db.customers.find(c => c.id === s.customerId);
        return {
          'Invoice #': s.invoiceNumber,
          'Date': s.date,
          'Shop / Customer': cust ? cust.shopName : 'Direct Customer',
          'Items Count': s.items.length,
          'Payment Method': s.paymentMethod,
          'Discount': `₹${s.discount}`,
          'Total Amount': `₹${s.totalAmount}`
        };
      });
      const totalRev = filteredSales.reduce((acc, s) => acc + s.totalAmount, 0);
      summary = {
        'Total Invoices': filteredSales.length,
        'Gross Revenue': `₹${totalRev}`,
        'Average Invoice Value': filteredSales.length > 0 ? `₹${(totalRev / filteredSales.length).toFixed(2)}` : '₹0.00'
      };
      break;
    }
    case 'revenue': {
      const filteredSales = filterByDate(db.sales, 'date');
      const productTotals = {};
      filteredSales.forEach(s => {
        s.items.forEach(item => {
          const p = db.products.find(prod => prod.id === item.productId);
          const name = p ? p.name : 'Unknown Product';
          if (!productTotals[name]) productTotals[name] = 0;
          productTotals[name] += item.totalAmount;
        });
      });
      reportData = Object.entries(productTotals).map(([product, total]) => ({
        'Product Name': product,
        'Revenue Generated': `₹${total}`
      }));
      summary = {
        'Total Revenue': `₹${filteredSales.reduce((acc, s) => acc + s.totalAmount, 0)}`,
        'Active Sales Invoices': filteredSales.length
      };
      break;
    }
    case 'profit': {
      const filteredSales = filterByDate(db.sales, 'date');
      const filteredExpenses = filterByDate(db.expenses, 'date');
      let grossProfit = 0;
      const productProfit = {};

      filteredSales.forEach(s => {
        s.items.forEach(item => {
          const prod = db.products.find(p => p.id === item.productId);
          const cost = prod ? prod.costPrice : 0;
          const profit = (item.sellingPrice - cost) * item.quantity;
          grossProfit += profit;

          const pName = prod ? prod.name : 'Unknown';
          if (!productProfit[pName]) productProfit[pName] = { sales: 0, cost: 0, profit: 0 };
          productProfit[pName].sales += item.totalAmount;
          productProfit[pName].cost += cost * item.quantity;
          productProfit[pName].profit += profit;
        });
      });

      reportData = Object.entries(productProfit).map(([product, metrics]) => ({
        'Product': product,
        'Sales Revenue': `₹${metrics.sales}`,
        'Cost of Production': `₹${metrics.cost}`,
        'Gross Profit Margin': `₹${metrics.profit}`
      }));

      const totalExp = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
      summary = {
        'Gross Margin': `₹${grossProfit}`,
        'Operating Expenses': `₹${totalExp}`,
        'Net Operating Profit': `₹${Math.max(0, grossProfit - totalExp)}`
      };
      break;
    }
    case 'production': {
      const filteredBatches = filterByDate(db.batches, 'manufacturingDate');
      reportData = filteredBatches.map(b => {
        const prod = db.products.find(p => p.id === b.productId);
        return {
          'Batch #': b.batchNumber,
          'Product Name': prod ? prod.name : 'Unknown',
          'MFG Date': b.manufacturingDate,
          'Best Before': b.bestBeforeDate,
          'Quantity Produced': `${b.quantityProduced} kg`,
          'Pack Size': b.packSize,
          'Packets Produced': b.packetsProduced,
          'Production Cost': `₹${b.manufacturingCost}`,
          'Cost Per Packet': `₹${b.costPerPacket}`
        };
      });
      summary = {
        'Batches Completed': filteredBatches.length,
        'Total Packets Produced': filteredBatches.reduce((acc, b) => acc + b.packetsProduced, 0),
        'Total Capital Invested': `₹${filteredBatches.reduce((acc, b) => acc + b.manufacturingCost, 0)}`
      };
      break;
    }
    case 'inventory': {
      reportData = db.rawMaterials.map(rm => {
        const supp = db.suppliers.find(s => s.id === rm.supplierId);
        return {
          'Material Name': rm.name,
          'Current Stock': `${rm.currentStock} ${rm.unit}`,
          'Min. Stock Level': `${rm.minStockLevel} ${rm.unit}`,
          'Last Purchase Price': `₹${rm.purchasePrice}/${rm.unit}`,
          'Supplier': supp ? supp.name : 'Unknown',
          'Stock Status': rm.currentStock < rm.minStockLevel ? 'LOW STOCK ALERT' : 'Normal'
        };
      });
      summary = {
        'Raw Materials Tracked': db.rawMaterials.length,
        'Low Stock Items': db.rawMaterials.filter(rm => rm.currentStock < rm.minStockLevel).length,
        'Estimated Materials Value': `₹${db.rawMaterials.reduce((acc, rm) => acc + rm.currentStock * rm.purchasePrice, 0).toFixed(2)}`
      };
      break;
    }
    case 'delivery': {
      const filteredDeliveries = filterByDate(db.deliveries, 'deliveryDate');
      reportData = filteredDeliveries.map(d => {
        const cust = db.customers.find(c => c.id === d.customerId);
        const prod = db.products.find(p => p.id === d.productId);
        return {
          'Delivery Date': d.deliveryDate,
          'Shop Name': cust ? cust.shopName : 'Direct Customer',
          'Product Name': prod ? prod.name : 'Unknown',
          'Batch #': d.batchNumber,
          'Quantity': d.quantity,
          'Wholesale Price': `₹${d.wholesalePrice}`,
          'Total Amount': `₹${d.totalAmount}`,
          'Status': d.status,
          'Delivered By': d.deliveredBy
        };
      });
      summary = {
        'Deliveries Executed': filteredDeliveries.length,
        'Total Quantity Shipped': filteredDeliveries.reduce((acc, d) => acc + d.quantity, 0),
        'Total Shipments Value': `₹${filteredDeliveries.reduce((acc, d) => acc + d.totalAmount, 0)}`
      };
      break;
    }
    case 'customer': {
      reportData = db.customers.map(c => ({
        'Shop Name': c.shopName,
        'Owner Name': c.ownerName,
        'Phone Number': c.phoneNumber,
        'Address': c.address,
        'Customer Type': c.customerType,
        'Outstanding Ledger Balance': `₹${c.outstandingBalance}`
      }));
      summary = {
        'Total Profiles': db.customers.length,
        'Wholesale Partners': db.customers.filter(c => c.customerType === 'Wholesaler').length,
        'Total Outstanding Dues': `₹${db.customers.reduce((acc, c) => acc + c.outstandingBalance, 0)}`
      };
      break;
    }
    case 'pending-payments': {
      const pending = db.pendingPayments.filter(p => p.status === 'Pending');
      reportData = pending.map(pp => {
        const cust = db.customers.find(c => c.id === pp.customerId);
        const isOverdue = new Date(pp.dueDate) < getBaselineDate();
        return {
          'Customer / Shop': cust ? cust.shopName : 'Unknown',
          'Invoice #': pp.invoiceNumber,
          'Invoice Total': `₹${pp.totalAmount}`,
          'Amount Paid': `₹${pp.amountPaid}`,
          'Outstanding Balance': `₹${pp.pendingAmount}`,
          'Payment Due Date': pp.dueDate,
          'Status': isOverdue ? 'OVERDUE' : 'Pending'
        };
      });
      summary = {
        'Unpaid Invoices': pending.length,
        'Overdue Dues': `₹${db.pendingPayments.filter(p => p.status === 'Pending' && new Date(p.dueDate) < getBaselineDate()).reduce((acc, p) => acc + p.pendingAmount, 0)}`,
        'Total Pending Collections': `₹${pending.reduce((acc, p) => acc + p.pendingAmount, 0)}`
      };
      break;
    }
    case 'expense': {
      const filteredExpenses = filterByDate(db.expenses, 'date');
      reportData = filteredExpenses.map(e => ({
        'Date': e.date,
        'Category': e.category,
        'Description': e.description,
        'Amount Paid': `₹${e.amount}`
      }));
      summary = {
        'Expenses Recorded': filteredExpenses.length,
        'Total Operating Dues Paid': `₹${filteredExpenses.reduce((acc, e) => acc + e.amount, 0)}`
      };
      break;
    }
  }

  res.json({
    reportData,
    summary,
    title: `${type.toUpperCase().replace('-', ' ')} REPORT`,
    dateRange: `${startDate} to ${endDate}`
  });
});


// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gandham Spices Admin Server running on http://localhost:${PORT}`);
});
