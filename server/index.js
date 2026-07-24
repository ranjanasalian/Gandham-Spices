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

// Helper: Parse Pack Size String (e.g. "100g", "1kg") to Kilograms
function parsePackSizeToKg(packSizeStr) {
  if (!packSizeStr) return 0.1; // default to 100g
  const clean = packSizeStr.toLowerCase().replace(/\s+/g, '');
  const num = parseFloat(clean);
  if (isNaN(num)) return 0.1;
  if (clean.endsWith('kg')) return num;
  if (clean.endsWith('g') || clean.endsWith('grams') || clean.endsWith('gm')) return num / 1000;
  return num / 1000; // default assumption grams
}

// Helper: Convert units between kg and grams
function convertUnit(qty, fromUnit, toUnit) {
  if (!fromUnit || !toUnit || fromUnit.toLowerCase() === toUnit.toLowerCase()) {
    return qty;
  }
  const f = fromUnit.toLowerCase();
  const t = toUnit.toLowerCase();
  if (f === 'grams' && t === 'kg') return qty / 1000;
  if (f === 'kg' && t === 'grams') return qty * 1000;
  return qty;
}

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
  const db = getDB();
  const baseline = new Date();
  const todayStr = baseline.toISOString().split('T')[0];

  const getStartOfWeek = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const getStartOfMonth = (d) => {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  };

  const todayEnd = new Date(baseline);
  todayEnd.setHours(23,59,59,999);

  const weekStart = getStartOfWeek(baseline);
  weekStart.setHours(0,0,0,0);
  const monthStart = getStartOfMonth(baseline);
  monthStart.setHours(0,0,0,0);

  // 1. TODAY STATS
  const todaySales = db.sales.filter(s => s.date === todayStr);
  const todayCustomerSales = (db.customers || []).filter(c => c.date === todayStr);
  const todayBatches = db.batches.filter(b => b.manufacturingDate === todayStr);
  
  const todayProduced = todayBatches.reduce((sum, b) => sum + b.packetsProduced, 0);
  const todaySold = todaySales.reduce((sum, s) => sum + s.quantityGiven, 0) + 
                    todayCustomerSales.reduce((sum, c) => sum + (c.quantityGiven || 0), 0);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmountReceivable, 0) + 
                      todayCustomerSales.reduce((sum, c) => sum + (c.totalAmountReceivable || 0), 0);

  // 2. THIS WEEK STATS
  const isInWeek = (dateStr) => {
    const d = new Date(dateStr);
    return d >= weekStart && d <= todayEnd;
  };
  const weekSales = db.sales.filter(s => isInWeek(s.date));
  const weekCustomerSales = (db.customers || []).filter(c => isInWeek(c.date));
  const weekBatches = db.batches.filter(b => isInWeek(b.manufacturingDate));

  const weekProduced = weekBatches.reduce((sum, b) => sum + b.packetsProduced, 0);
  const weekSold = weekSales.reduce((sum, s) => sum + s.quantityGiven, 0) + 
                  weekCustomerSales.reduce((sum, c) => sum + (c.quantityGiven || 0), 0);
  const weekRevenue = weekSales.reduce((sum, s) => sum + s.totalAmountReceivable, 0) + 
                      weekCustomerSales.reduce((sum, c) => sum + (c.totalAmountReceivable || 0), 0);
  
  let weekCostOfGoods = 0;
  weekSales.forEach(s => {
    const prod = db.products.find(p => p.id === s.productId);
    const cost = prod ? (prod.productionCost || prod.costPrice || 0) : 0;
    weekCostOfGoods += s.quantityGiven * cost;
  });
  weekCustomerSales.forEach(c => {
    const prod = db.products.find(p => p.id === c.productId);
    const cost = prod ? (prod.productionCost || prod.costPrice || 0) : 0;
    weekCostOfGoods += (c.quantityGiven || 0) * cost;
  });
  const weekProfit = weekRevenue - weekCostOfGoods;

  // 3. THIS MONTH STATS
  const currentMonthStr = todayStr.substring(0, 7);
  const isInMonth = (dateStr) => dateStr && dateStr.startsWith(currentMonthStr);

  const monthSales = db.sales.filter(s => isInMonth(s.date));
  const monthCustomerSales = (db.customers || []).filter(c => isInMonth(c.date));
  const monthBatches = db.batches.filter(b => isInMonth(b.manufacturingDate));
  const monthExpenses = db.expenses.filter(e => isInMonth(e.date));
  const monthPurchases = (db.ingredientPurchases || []).filter(p => isInMonth(p.purchaseDate));

  const monthRevenue = monthSales.reduce((sum, s) => sum + s.totalAmountReceivable, 0) + 
                       monthCustomerSales.reduce((sum, c) => sum + (c.totalAmountReceivable || 0), 0);
  const monthPurchaseTotal = monthPurchases.reduce((sum, p) => sum + p.totalCost, 0);
  const monthProduced = monthBatches.reduce((sum, b) => sum + b.packetsProduced, 0);
  const monthSold = monthSales.reduce((sum, s) => sum + s.quantityGiven, 0) + 
                    monthCustomerSales.reduce((sum, c) => sum + (c.quantityGiven || 0), 0);

  let monthCostOfGoods = 0;
  monthSales.forEach(s => {
    const prod = db.products.find(p => p.id === s.productId);
    const cost = prod ? (prod.productionCost || prod.costPrice || 0) : 0;
    monthCostOfGoods += s.quantityGiven * cost;
  });
  monthCustomerSales.forEach(c => {
    const prod = db.products.find(p => p.id === c.productId);
    const cost = prod ? (prod.productionCost || prod.costPrice || 0) : 0;
    monthCostOfGoods += (c.quantityGiven || 0) * cost;
  });
  
  const isGeneralExpense = (e) => e.category !== 'Raw Materials' && e.category !== 'Packaging' && e.category !== 'Production' && !e.id.startsWith('e_prod_');

  const monthOverheadExpenses = monthExpenses.filter(isGeneralExpense).reduce((sum, e) => sum + e.amount, 0);
  const monthExpenseTotal = monthExpenses.filter(isGeneralExpense).reduce((sum, e) => sum + e.amount, 0);

  const monthGrossProfit = monthRevenue - monthCostOfGoods;
  const monthNetProfit = monthGrossProfit - monthOverheadExpenses;

  // 3.1 THIS YEAR STATS
  const currentYearStr = todayStr.substring(0, 4);
  const isInYear = (dateStr) => dateStr && dateStr.startsWith(currentYearStr);

  const yearSales = db.sales.filter(s => isInYear(s.date));
  const yearCustomerSales = (db.customers || []).filter(c => isInYear(c.date));
  const yearBatches = db.batches.filter(b => isInYear(b.manufacturingDate));
  const yearExpenses = db.expenses.filter(e => isInYear(e.date));
  const yearPurchases = (db.ingredientPurchases || []).filter(p => isInYear(p.purchaseDate));

  const yearRevenue = yearSales.reduce((sum, s) => sum + s.totalAmountReceivable, 0) + 
                      yearCustomerSales.reduce((sum, c) => sum + (c.totalAmountReceivable || 0), 0);
  const yearExpenseTotal = yearExpenses.filter(isGeneralExpense).reduce((sum, e) => sum + e.amount, 0);
  const yearPurchaseTotal = yearPurchases.reduce((sum, p) => sum + p.totalCost, 0);
  const yearProduced = yearBatches.reduce((sum, b) => sum + b.packetsProduced, 0);
  const yearSold = yearSales.reduce((sum, s) => sum + s.quantityGiven, 0) + 
                   yearCustomerSales.reduce((sum, c) => sum + (c.quantityGiven || 0), 0);

  let yearCostOfGoods = 0;
  yearSales.forEach(s => {
    const prod = db.products.find(p => p.id === s.productId);
    const cost = prod ? (prod.productionCost || prod.costPrice || 0) : 0;
    yearCostOfGoods += s.quantityGiven * cost;
  });
  yearCustomerSales.forEach(c => {
    const prod = db.products.find(p => p.id === c.productId);
    const cost = prod ? (prod.productionCost || prod.costPrice || 0) : 0;
    yearCostOfGoods += (c.quantityGiven || 0) * cost;
  });

  const yearOverheadExpenses = yearExpenses.filter(isGeneralExpense).reduce((sum, e) => sum + e.amount, 0);

  const yearGrossProfit = yearRevenue - yearCostOfGoods;
  const yearNetProfit = yearGrossProfit - yearOverheadExpenses;

  // Inventory Totals
  const currentInventory = db.products.reduce((acc, p) => {
    const productBatches = db.batches.filter(b => b.productId === p.id);
    const totalProduced = productBatches.reduce((sum, b) => sum + b.packetsProduced, 0);
    const productSales = db.sales.filter(s => s.productId === p.id);
    const customerSales = (db.customers || []).filter(c => c.productId === p.id);
    const totalSold = productSales.reduce((sum, s) => sum + s.quantityGiven, 0) + 
                      customerSales.reduce((sum, c) => sum + (c.quantityGiven || 0), 0);
    return acc + (totalProduced - totalSold);
  }, 0);

  const pendingPayments = db.pendingPayments
    .filter(p => p.status === 'Pending')
    .reduce((acc, p) => acc + p.pendingAmount, 0);

  const lowStockMaterialsList = (db.rawMaterials || []).map(rm => {
    const purchases = (db.ingredientPurchases || []).filter(p => {
      if (p.rawMaterialId === rm.id) return true;
      if (p.rawMaterialName && p.rawMaterialName.toLowerCase() === rm.name.toLowerCase()) return true;
      const pMaterial = db.rawMaterials.find(m => m.id === p.rawMaterialId);
      return pMaterial && pMaterial.name.toLowerCase() === rm.name.toLowerCase();
    });

    const totalPurchased = purchases.reduce((sum, p) => {
      const pUnit = p.unit || rm.unit || 'kg';
      return sum + convertUnit(p.quantity, pUnit, rm.unit || 'kg');
    }, 0);

    let totalUsed = 0;
    (db.batches || []).forEach(b => {
      const recipe = db.recipes.find(r => r.id === b.recipeId || r.productId === b.productId);
      if (recipe) {
        const ing = (recipe.ingredients || []).find(i => {
          if (i.rawMaterialId === rm.id) return true;
          const iMaterial = db.rawMaterials.find(m => m.id === i.rawMaterialId);
          return iMaterial && iMaterial.name.toLowerCase() === rm.name.toLowerCase();
        });

        if (ing) {
          const product = db.products.find(p => p.id === (b.productId || recipe.productId));
          const packSizeKg = parsePackSizeToKg(product ? product.packSize : '');
          const yieldKg = recipe.yieldQuantity || 1;
          const totalBatchWeightKg = b.packetsProduced * packSizeKg;
          
          const qtyInRmUnit = convertUnit(ing.quantity, ing.unit || 'kg', rm.unit || 'kg');
          const usageInRmUnit = (qtyInRmUnit / yieldKg) * totalBatchWeightKg;
          totalUsed += usageInRmUnit;
        }
      }
    });

    const currentStock = Math.max(0, parseFloat((totalPurchased - totalUsed).toFixed(3)));
    const minThreshold = parseFloat(rm.minStockLevel || 0);

    if (minThreshold > 0 && currentStock < minThreshold) {
      return {
        id: rm.id,
        type: 'Raw Material',
        name: rm.name,
        currentStock: `${currentStock.toFixed(2)} ${rm.unit || 'kg'}`,
        threshold: `${minThreshold.toFixed(2)} ${rm.unit || 'kg'}`,
        actionUrl: '/admin/purchase-history',
        actionText: 'Restock Ingredient'
      };
    }
    return null;
  }).filter(Boolean);

  const lowStockProductsList = (db.products || []).map(p => {
    const productBatches = (db.batches || []).filter(b => b.productId === p.id);
    const totalProduced = productBatches.reduce((sum, b) => sum + b.packetsProduced, 0);
    const productSales = (db.sales || []).filter(s => s.productId === p.id);
    const totalSold = productSales.reduce((sum, s) => sum + s.quantityGiven, 0);
    const currentStock = Math.max(0, totalProduced - totalSold);
    const minThreshold = p.minStockLevel !== undefined ? p.minStockLevel : 10;

    if (minThreshold > 0 && currentStock < minThreshold) {
      return {
        id: p.id,
        type: 'Finished Product Pouch',
        name: p.name,
        currentStock: `${currentStock} packs`,
        threshold: `${minThreshold} packs`,
        actionUrl: '/admin/production',
        actionText: 'Log Production Batch'
      };
    }
    return null;
  }).filter(Boolean);

  const lowStockItemsList = [...lowStockMaterialsList, ...lowStockProductsList];
  const lowStockAlerts = lowStockItemsList.length;

  // 4. CHART TREND DATA
  const { range, startDate, endDate } = req.query;
  let start = new Date(baseline);
  let end = new Date(baseline);

  if (range === 'today') {
    start.setHours(0,0,0,0);
    end.setHours(23,59,59,999);
  } else if (range === 'week') {
    start.setDate(baseline.getDate() - 6);
    start.setHours(0,0,0,0);
  } else if (range === 'month') {
    start.setDate(1);
    start.setHours(0,0,0,0);
  } else if (range === 'year') {
    start.setMonth(0, 1);
    start.setHours(0,0,0,0);
  } else if (range === 'custom' && startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
  } else {
    start.setDate(baseline.getDate() - 6);
    start.setHours(0,0,0,0);
  }

  const dateMap = {};
  const tempDate = new Date(start);
  while (tempDate <= end) {
    const key = tempDate.toISOString().split('T')[0];
    dateMap[key] = { date: key, sales: 0, revenue: 0, profit: 0 };
    tempDate.setDate(tempDate.getDate() + 1);
  }

  const rangeSales = db.sales.filter(s => {
    const d = new Date(s.date);
    return d >= start && d <= end;
  });

  rangeSales.forEach(s => {
    const key = s.date;
    if (dateMap[key]) {
      dateMap[key].revenue += s.totalAmountReceivable;
      dateMap[key].sales += s.quantityGiven;
      
      const prod = db.products.find(p => p.id === s.productId);
      const cost = prod ? (prod.productionCost || prod.costPrice || 0) : 0;
      const profit = s.totalAmountReceivable - (s.quantityGiven * cost);
      dateMap[key].profit += profit;
    }
  });

  let dailyTrends = [];
  if (range === 'year') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = baseline.getFullYear();
    const monthMap = {};
    months.forEach((m, idx) => {
      monthMap[idx] = { date: m, sales: 0, revenue: 0, profit: 0 };
    });

    db.sales.forEach(s => {
      if (s.date) {
        const d = new Date(s.date);
        if (d.getFullYear() === currentYear) {
          const mIdx = d.getMonth();
          if (monthMap[mIdx]) {
            monthMap[mIdx].revenue += s.totalAmountReceivable;
            monthMap[mIdx].sales += s.quantityGiven;
            const prod = db.products.find(p => p.id === s.productId);
            const cost = prod ? (prod.productionCost || prod.costPrice || 0) : 0;
            monthMap[mIdx].profit += (s.totalAmountReceivable - (s.quantityGiven * cost));
          }
        }
      }
    });
    dailyTrends = Object.values(monthMap);
  } else {
    dailyTrends = Object.values(dateMap).sort((a,b) => a.date.localeCompare(b.date));
  }

  // Product performance chart data (Top selling products)
  const productSalesMap = {};
  db.products.forEach(p => {
    productSalesMap[p.id] = { name: p.name, quantity: 0, revenue: 0, profit: 0 };
  });

  rangeSales.forEach(s => {
    if (productSalesMap[s.productId]) {
      productSalesMap[s.productId].quantity += s.quantityGiven;
      productSalesMap[s.productId].revenue += s.totalAmountReceivable;
      
      const prod = db.products.find(p => p.id === s.productId);
      const cost = prod ? (prod.productionCost || prod.costPrice || 0) : 0;
      const profit = s.totalAmountReceivable - (s.quantityGiven * cost);
      productSalesMap[s.productId].profit += profit;
    }
  });
  const productPerformance = Object.values(productSalesMap).sort((a,b) => b.revenue - a.revenue);

  // Inventory breakdown data
  const inventoryData = db.products.map(p => {
    const productBatches = db.batches.filter(b => b.productId === p.id);
    const totalProduced = productBatches.reduce((sum, b) => sum + b.packetsProduced, 0);
    const productSales = db.sales.filter(s => s.productId === p.id);
    const totalSold = productSales.reduce((sum, s) => sum + s.quantityGiven, 0);
    return {
      name: p.name,
      stock: totalProduced - totalSold
    };
  });

  res.json({
    summary: {
      today: { productsProduced: todayProduced, productsSold: todaySold, revenue: todayRevenue },
      thisWeek: { production: weekProduced, sales: weekSold, revenue: weekRevenue, profit: weekProfit },
      thisMonth: { 
        revenue: monthRevenue, 
        netProfit: monthNetProfit, 
        expenses: monthExpenseTotal, 
        ingredientPurchases: monthPurchaseTotal, 
        productionQty: monthProduced, 
        pouchesSold: monthSold 
      },
      thisYear: {
        revenue: yearRevenue,
        netProfit: yearNetProfit,
        expenses: yearExpenseTotal,
        ingredientPurchases: yearPurchaseTotal,
        productionQty: yearProduced,
        pouchesSold: yearSold
      },
      currentInventory,
      lowStockAlerts,
      lowStockItemsList,
      pendingPayments
    },
    charts: {
      dailyTrends,
      productPerformance,
      inventoryData
    },
    recentActivities: db.recentActivities.slice(0, 8)
  });
});


// ---------------- PRODUCTS CRUD ----------------
app.get('/api/admin/products', authenticateToken, (req, res) => {
  const db = getDB();
  db.products.forEach(p => {
    const productBatches = db.batches.filter(b => b.productId === p.id);
    const totalProduced = productBatches.reduce((sum, b) => sum + b.packetsProduced, 0);

    const productSales = db.sales.filter(s => s.productId === p.id);
    const customerSales = (db.customers || []).filter(c => c.productId === p.id);
    const totalSold = productSales.reduce((sum, s) => sum + s.quantityGiven, 0) + 
                      customerSales.reduce((sum, c) => sum + (c.quantityGiven || 0), 0);

    p.totalProduced = totalProduced;
    p.totalSold = totalSold;
    p.currentStock = totalProduced - totalSold;

    const mrpValue = parseFloat(p.mrp || 0);
    const margin = parseFloat(p.retailerMargin || 0);
    const cost = parseFloat(p.productionCost || p.costPrice || 0);
    p.wholesalePrice = parseFloat((mrpValue * (1 - margin / 100)).toFixed(2));
    p.netProfit = parseFloat((p.wholesalePrice - cost).toFixed(2));
    p.netMargin = p.wholesalePrice > 0 ? parseFloat(((p.netProfit / p.wholesalePrice) * 100).toFixed(2)) : 0;
  });
  res.json(db.products);
});

app.post('/api/admin/products', authenticateToken, async (req, res) => {
  const db = getDB();
  const { name, sku, category, mrp, retailerMargin, productionCost, status, packSize } = req.body;
  
  const mrpValue = parseFloat(mrp || 0);
  const margin = parseFloat(retailerMargin || 0);
  const cost = parseFloat(productionCost || 0);
  
  const wholesalePrice = mrpValue * (1 - margin / 100);
  const netProfit = wholesalePrice - cost;
  const netMargin = wholesalePrice > 0 ? (netProfit / wholesalePrice) * 100 : 0;

  const newProduct = {
    id: `prod_${Date.now()}`,
    sku: sku || `SKU-${Date.now()}`,
    name,
    category: category || 'General',
    mrp: mrpValue,
    retailerMargin: margin,
    wholesalePrice: parseFloat(wholesalePrice.toFixed(2)),
    productionCost: cost,
    costPrice: cost,
    netProfit: parseFloat(netProfit.toFixed(2)),
    netMargin: parseFloat(netMargin.toFixed(2)),
    currentStock: 0,
    status: status || 'Active',
    packSize: packSize || '100g'
  };

  db.products.push(newProduct);
  
  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Added Product',
    details: `Added product ${newProduct.name} to registry`,
    timestamp: new Date().toISOString()
  });

  await commit();
  res.status(201).json(newProduct);
});

app.put('/api/admin/products/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Product not found' });

  const mrpValue = parseFloat(req.body.mrp ?? db.products[index].mrp);
  const margin = parseFloat(req.body.retailerMargin ?? db.products[index].retailerMargin ?? 0);
  const cost = parseFloat(req.body.productionCost ?? db.products[index].productionCost ?? db.products[index].costPrice ?? 0);

  const wholesalePrice = mrpValue * (1 - margin / 100);
  const netProfit = wholesalePrice - cost;
  const netMargin = wholesalePrice > 0 ? (netProfit / wholesalePrice) * 100 : 0;

  db.products[index] = { 
    ...db.products[index], 
    ...req.body,
    mrp: mrpValue,
    retailerMargin: margin,
    wholesalePrice: parseFloat(wholesalePrice.toFixed(2)),
    productionCost: cost,
    costPrice: cost,
    netProfit: parseFloat(netProfit.toFixed(2)),
    netMargin: parseFloat(netMargin.toFixed(2))
  };

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


// ---------------- INGREDIENT PURCHASES CRUD ----------------
app.get('/api/admin/ingredient-purchases', authenticateToken, (req, res) => {
  res.json(getDB().ingredientPurchases || []);
});

app.post('/api/admin/ingredient-purchases', authenticateToken, async (req, res) => {
  const db = getDB();
  const { purchaseDate, rawMaterialId, quantity, totalCost, supplierName, notes, unit } = req.body;
  
  if (!purchaseDate || !rawMaterialId || !quantity || !totalCost) {
    return res.status(400).json({ message: 'Missing required purchase fields' });
  }

  let rm = db.rawMaterials.find(m => m.id === rawMaterialId || m.name.toLowerCase() === rawMaterialId.toLowerCase());
  if (!rm) {
    rm = {
      id: `rm_${Date.now()}`,
      name: rawMaterialId,
      unit: unit || 'kg',
      minStockLevel: 1,
      currentStock: 0,
      totalPurchased: 0,
      totalUsed: 0
    };
    db.rawMaterials.push(rm);
  }

  const purchaseUnit = unit || rm.unit || 'kg';

  const newPurchase = {
    id: `ip_${Date.now()}`,
    purchaseDate,
    rawMaterialId: rm.id,
    rawMaterialName: rm.name,
    quantity: parseFloat(quantity),
    unit: purchaseUnit,
    totalCost: parseFloat(totalCost),
    supplierName: supplierName || '',
    notes: notes || ''
  };

  if (!db.ingredientPurchases) db.ingredientPurchases = [];
  db.ingredientPurchases.push(newPurchase);

  // Auto-log expense
  db.expenses.push({
    id: `e_${newPurchase.id}`,
    category: 'Raw Materials',
    amount: parseFloat(totalCost),
    date: purchaseDate,
    description: `Purchased ${quantity} ${purchaseUnit} of ${rm.name} @ total ₹${totalCost}`
  });

  // Log supplier purchase history if supplierName matches a registered supplier
  if (supplierName) {
    const supplier = db.suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
    if (supplier) {
      if (!supplier.purchaseHistory) supplier.purchaseHistory = [];
      supplier.purchaseHistory.unshift({
        date: purchaseDate,
        item: `${rm.name} (${quantity} ${purchaseUnit})`,
        amount: parseFloat(totalCost)
      });
      supplier.outstandingPayments = parseFloat((supplier.outstandingPayments + parseFloat(totalCost)).toFixed(2));
    }
  }

  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Purchased Ingredient',
    details: `Purchased ${quantity} ${purchaseUnit} of ${rm.name} for ₹${totalCost}.`,
    timestamp: new Date().toISOString()
  });

  await commit();
  res.status(201).json(newPurchase);
});

app.put('/api/admin/ingredient-purchases/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  if (!db.ingredientPurchases) db.ingredientPurchases = [];
  const index = db.ingredientPurchases.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Purchase record not found' });

  const current = db.ingredientPurchases[index];
  const { purchaseDate, rawMaterialId, quantity, totalCost, supplierName, notes } = req.body;

  const rm = db.rawMaterials.find(m => m.id === (rawMaterialId || current.rawMaterialId));
  if (!rm) return res.status(404).json({ message: 'Raw material type not found' });

  // Revert old supplier adjustments
  if (current.supplierName) {
    const oldSupplier = db.suppliers.find(s => s.name.toLowerCase() === current.supplierName.toLowerCase());
    if (oldSupplier) {
      oldSupplier.purchaseHistory = (oldSupplier.purchaseHistory || []).filter(h => !(h.date === current.purchaseDate && h.amount === current.totalCost));
      oldSupplier.outstandingPayments = Math.max(0, parseFloat((oldSupplier.outstandingPayments - current.totalCost).toFixed(2)));
    }
  }

  // Update the purchase record
  db.ingredientPurchases[index] = {
    ...current,
    purchaseDate: purchaseDate || current.purchaseDate,
    rawMaterialId: rawMaterialId || current.rawMaterialId,
    quantity: quantity !== undefined ? parseFloat(quantity) : current.quantity,
    totalCost: totalCost !== undefined ? parseFloat(totalCost) : current.totalCost,
    supplierName: supplierName ?? current.supplierName,
    notes: notes ?? current.notes
  };
  const updated = db.ingredientPurchases[index];

  // Update auto-logged expense
  const expenseIndex = db.expenses.findIndex(e => e.id === `e_${updated.id}`);
  if (expenseIndex !== -1) {
    db.expenses[expenseIndex] = {
      ...db.expenses[expenseIndex],
      amount: updated.totalCost,
      date: updated.purchaseDate,
      description: `Purchased ${updated.quantity} ${rm.unit} of ${rm.name} @ total ₹${updated.totalCost}`
    };
  } else {
    db.expenses.push({
      id: `e_${updated.id}`,
      category: 'Raw Materials',
      amount: updated.totalCost,
      date: updated.purchaseDate,
      description: `Purchased ${updated.quantity} ${rm.unit} of ${rm.name} @ total ₹${updated.totalCost}`
    });
  }

  // Apply new supplier adjustments
  if (updated.supplierName) {
    const newSupplier = db.suppliers.find(s => s.name.toLowerCase() === updated.supplierName.toLowerCase());
    if (newSupplier) {
      if (!newSupplier.purchaseHistory) newSupplier.purchaseHistory = [];
      newSupplier.purchaseHistory.unshift({
        date: updated.purchaseDate,
        item: `${rm.name} (${updated.quantity} ${rm.unit})`,
        amount: updated.totalCost
      });
      newSupplier.outstandingPayments = parseFloat((newSupplier.outstandingPayments + updated.totalCost).toFixed(2));
    }
  }

  await commit();
  res.json(updated);
});

app.delete('/api/admin/ingredient-purchases/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  if (!db.ingredientPurchases) db.ingredientPurchases = [];
  const index = db.ingredientPurchases.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Purchase record not found' });

  const deleted = db.ingredientPurchases.splice(index, 1)[0];

  // Clean up auto-expense
  db.expenses = db.expenses.filter(e => e.id !== `e_${deleted.id}`);

  // Deduct from supplier history
  if (deleted.supplierName) {
    const supplier = db.suppliers.find(s => s.name.toLowerCase() === deleted.supplierName.toLowerCase());
    if (supplier) {
      supplier.purchaseHistory = (supplier.purchaseHistory || []).filter(h => !(h.date === deleted.purchaseDate && h.amount === deleted.totalCost));
      supplier.outstandingPayments = Math.max(0, parseFloat((supplier.outstandingPayments - deleted.totalCost).toFixed(2)));
    }
  }

  await commit();
  res.json(deleted);
});

// ---------------- RAW MATERIALS CRUD ----------------
app.get('/api/admin/raw-materials', authenticateToken, (req, res) => {
  const db = getDB();
  db.rawMaterials.forEach(rm => {
    // 1. Combine ALL purchases of this ingredient (by ID or matching name)
    const purchases = (db.ingredientPurchases || []).filter(p => {
      if (p.rawMaterialId === rm.id) return true;
      if (p.rawMaterialName && p.rawMaterialName.toLowerCase() === rm.name.toLowerCase()) return true;
      const pMaterial = db.rawMaterials.find(m => m.id === p.rawMaterialId);
      return pMaterial && pMaterial.name.toLowerCase() === rm.name.toLowerCase();
    });

    const totalPurchased = purchases.reduce((sum, p) => {
      const pUnit = p.unit || rm.unit || 'kg';
      return sum + convertUnit(p.quantity, pUnit, rm.unit || 'kg');
    }, 0);

    // 2. Sum ALL quantities used across production batches
    let totalUsed = 0;
    db.batches.forEach(b => {
      const recipe = db.recipes.find(r => r.id === b.recipeId || r.productId === b.productId);
      if (recipe) {
        const ing = (recipe.ingredients || []).find(i => {
          if (i.rawMaterialId === rm.id) return true;
          const iMaterial = db.rawMaterials.find(m => m.id === i.rawMaterialId);
          return iMaterial && iMaterial.name.toLowerCase() === rm.name.toLowerCase();
        });

        if (ing) {
          const product = db.products.find(p => p.id === (b.productId || recipe.productId));
          const packSizeKg = parsePackSizeToKg(product ? product.packSize : '');
          
          // Formula:
          // ing.quantity is required per yield (e.g. 1 kg yield = yieldQuantity: 1)
          // Total output produced in batch = b.packetsProduced * packSizeKg
          const yieldKg = recipe.yieldQuantity || 1;
          const totalBatchWeightKg = b.packetsProduced * packSizeKg;
          
          const qtyInRmUnit = convertUnit(ing.quantity, ing.unit || 'kg', rm.unit || 'kg');
          const usageInRmUnit = (qtyInRmUnit / yieldKg) * totalBatchWeightKg;
          totalUsed += usageInRmUnit;
        }
      }
    });

    rm.totalPurchased = parseFloat(totalPurchased.toFixed(3));
    rm.totalUsed = parseFloat(totalUsed.toFixed(3));
    rm.currentStock = Math.max(0, parseFloat((totalPurchased - totalUsed).toFixed(3)));
  });
  res.json(db.rawMaterials);
});

app.post('/api/admin/raw-materials', authenticateToken, async (req, res) => {
  const db = getDB();
  const newMaterial = {
    id: `rm_${Date.now()}`,
    name: req.body.name,
    unit: req.body.unit || 'kg',
    minStockLevel: parseFloat(req.body.minStockLevel || 0),
    currentStock: 0,
    totalPurchased: 0,
    totalUsed: 0
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
    name: req.body.name ?? db.rawMaterials[index].name,
    unit: req.body.unit ?? db.rawMaterials[index].unit,
    minStockLevel: parseFloat(req.body.minStockLevel ?? db.rawMaterials[index].minStockLevel)
  };

  await commit();
  res.json(db.rawMaterials[index]);
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


const parsePouchGrams = (sizeStr) => {
  if (!sizeStr) return 100;
  const clean = sizeStr.toLowerCase().replace(/\s+/g, '');
  const num = parseFloat(clean);
  if (isNaN(num)) return 100;
  if (clean.endsWith('kg')) return num * 1000;
  return num;
};

const migrateCustomerSuppliesToSales = (db) => {
  if (!db || !db.customers) return;
  if (!db.sales) db.sales = [];

  const remainingCustomers = [];
  let migrated = false;

  db.customers.forEach(c => {
    if (c.productId || (c.quantityGiven && c.quantityGiven > 0)) {
      migrated = true;
      let profile = remainingCustomers.find(rc => rc.shopName?.toLowerCase().trim() === c.shopName?.toLowerCase().trim());
      if (!profile) {
        profile = {
          id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          date: c.date || new Date().toISOString().split('T')[0],
          contactName: c.contactName || c.shopName,
          shopName: c.shopName,
          customerClassification: c.customerClassification || 'Retailer',
          phoneNumber: c.phoneNumber || '',
          address: c.address || '',
          remarks: c.remarks || ''
        };
        remainingCustomers.push(profile);
      }

      const existingSale = db.sales.find(s => s.id === c.id || (s.shopName === c.shopName && s.date === c.date && s.productId === c.productId && s.quantityGiven === c.quantityGiven));
      if (!existingSale) {
        db.sales.push({
          id: c.id.startsWith('c_') ? c.id.replace('c_', 's_') : `s_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          date: c.date || new Date().toISOString().split('T')[0],
          customerId: profile.id,
          shopName: c.shopName,
          productId: c.productId,
          productName: c.productName || 'Spice Product',
          batchId: c.batchId || '',
          batchNumber: c.batchNumber || 'Batch 1',
          packSize: c.packSize || '50g',
          quantityGiven: parseInt(c.quantityGiven || 0, 10),
          wholesalePrice: parseFloat(c.wholesalePrice || 0),
          totalAmountReceivable: parseFloat(c.totalAmountReceivable || 0),
          amountReceived: parseFloat(c.amountReceived || 0),
          balanceAmount: parseFloat(c.balanceAmount || 0),
          paymentStatus: c.paymentStatus || 'Paid',
          paymentDate: c.paymentDate || '',
          remarks: c.remarks || ''
        });
      }
    } else {
      if (!remainingCustomers.some(rc => rc.id === c.id || rc.shopName?.toLowerCase().trim() === c.shopName?.toLowerCase().trim())) {
        remainingCustomers.push(c);
      }
    }
  });

  if (migrated) {
    db.customers = remainingCustomers;
  }
};

const recalculateBatchStocks = (db) => {
  if (!db || !db.batches) return;
  migrateCustomerSuppliesToSales(db);
  const sales = db.sales || [];
  db.batches.forEach(b => {
    let produced = parseInt(b.packetsProduced || 0, 10);
    const weightKg = parseFloat(b.quantityProduced || 0);
    const pouchGrams = parsePouchGrams(b.packSize);

    if (weightKg > 0 && pouchGrams > 0) {
      const estimated = Math.floor((weightKg * 1000) / pouchGrams);
      if ((produced <= 1 || isNaN(produced)) && estimated > 0) {
        produced = estimated;
        b.packetsProduced = estimated;
      }
    }

    const totalSold = sales
      .filter(s => (s.batchId && s.batchId === b.id) || (s.productId === b.productId && s.batchNumber === b.batchNumber))
      .reduce((sum, s) => sum + (s.quantityGiven || 0), 0);

    b.remainingStock = Math.max(0, produced - totalSold);
  });
};

// ---------------- BATCHES (PRODUCTION) CRUD & TRACEABILITY ----------------
app.get('/api/admin/batches', authenticateToken, async (req, res) => {
  const db = getDB();
  recalculateBatchStocks(db);
  await commit();
  res.json(db.batches);
});

// Create Batch: auto-deduct raw materials & add finished product stock
app.post('/api/admin/batches', authenticateToken, async (req, res) => {
  const { productId, batchNumber, batchCode, manufacturingDate, bestBeforeDate, packSize, packetsProduced, manufacturingCost, notes } = req.body;
  const db = getDB();

  const product = db.products.find(p => p.id === productId);
  if (!product) {
    return res.status(400).json({ message: 'Product not found' });
  }

  const packetsCount = parseInt(packetsProduced, 10) || 0;
  const mfgCost = parseFloat(manufacturingCost || 0);

  // Check ingredient stock if recipe exists
  const recipe = db.recipes.find(r => r.productId === productId);
  if (recipe) {
    const missingMaterials = [];
    recipe.ingredients.forEach(ing => {
      const rm = db.rawMaterials.find(m => m.id === ing.rawMaterialId);
      if (!rm) return;
      
      const purchases = (db.ingredientPurchases || []).filter(p => p.rawMaterialId === rm.id);
      const totalPurchased = purchases.reduce((sum, p) => sum + p.quantity, 0);
      let totalUsed = 0;
      db.batches.forEach(b => {
        const r = db.recipes.find(rec => rec.id === b.recipeId);
        if (r) {
          const rIng = r.ingredients.find(ri => ri.rawMaterialId === rm.id);
          if (rIng) {
            const prod = db.products.find(p => p.id === r.productId);
            const pSizeKg = parsePackSizeToKg(prod ? prod.packSize : '');
            const rIngQtyInRmUnit = convertUnit(rIng.quantity, rIng.unit || 'kg', rm.unit);
            totalUsed += rIngQtyInRmUnit * b.packetsProduced * pSizeKg;
          }
        }
      });
      const currentStock = totalPurchased - totalUsed;
      const ingQtyInRmUnit = convertUnit(ing.quantity, ing.unit || 'kg', rm.unit);
      const packSizeKg = parsePackSizeToKg(product ? product.packSize : '');
      const needed = ingQtyInRmUnit * packetsCount * packSizeKg;

      if (currentStock < needed) {
        missingMaterials.push(`Insufficient stock for ${rm.name}. Needed: ${needed.toFixed(3)} ${rm.unit}, Current: ${currentStock.toFixed(3)} ${rm.unit}`);
      }
    });

    if (missingMaterials.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot record production batch. Raw material shortages:',
        errors: missingMaterials
      });
    }
  }

  // Create the batch
  const newBatch = {
    id: `b_${Date.now()}`,
    batchNumber: batchNumber || batchCode || `B-${Date.now()}`,
    batchCode: batchCode || batchNumber || `B-${Date.now()}`,
    productId,
    recipeId: recipe ? recipe.id : '',
    manufacturingDate,
    bestBeforeDate: bestBeforeDate || '',
    packSize: packSize || product.packSize,
    packetsProduced: packetsCount,
    manufacturingCost: mfgCost,
    costPerPacket: packetsCount > 0 ? parseFloat((mfgCost / packetsCount).toFixed(2)) : 0,
    notes,
    remainingStock: packetsCount,
    shopsSupplied: [],
    salesHistory: []
  };

  db.batches.push(newBatch);

  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Logged Production Batch',
    details: `Produced ${packetsCount} pouches of ${product.name} (Batch #${newBatch.batchNumber})`,
    timestamp: new Date().toISOString()
  });

  await commit();
  res.status(201).json(newBatch);
});

// Traceability Lookup by Batch Number
app.get('/api/admin/batches/trace/:batchNumber', authenticateToken, (req, res) => {
  const { batchNumber } = req.params;
  const db = getDB();
  const query = batchNumber.trim().toLowerCase();

  const batch = db.batches.find(b => 
    (b.batchNumber && b.batchNumber.toLowerCase() === query) ||
    (b.batchCode && b.batchCode.toLowerCase() === query) ||
    (b.id && b.id.toLowerCase() === query)
  );

  if (!batch) return res.status(404).json({ message: `Batch "${batchNumber}" not found.` });

  const product = db.products.find(p => p.id === batch.productId);
  const recipe = db.recipes.find(r => r.id === batch.recipeId);

  // Map ingredients used
  const ingredientsUsed = recipe ? recipe.ingredients.map(ing => {
    const rm = db.rawMaterials.find(m => m.id === ing.rawMaterialId);
    return {
      name: rm ? rm.name : 'Unknown Material',
      quantityTotal: (ing.quantity * (batch.packetsProduced || 0)).toFixed(2),
      unit: rm ? rm.unit : ''
    };
  }) : [];

  // Match sales in db.sales
  const matchedSales = (db.sales || []).filter(s => 
    s.batchId === batch.id || 
    (s.productId === batch.productId && s.batchNumber === batch.batchNumber)
  );

  const shopsSupplied = Array.from(new Set(matchedSales.map(s => {
    const cust = db.customers.find(c => c.id === s.customerId);
    return cust ? cust.shopName : (s.shopName || 'Direct Customer');
  })));

  let totalRevenueGenerated = 0;
  let totalProfitGenerated = 0;
  const costPerPack = batch.costPerPacket || (product ? product.costPrice : 0) || 0;

  const salesHistory = matchedSales.map(s => {
    const cust = db.customers.find(c => c.id === s.customerId);
    const qty = s.quantityGiven || 0;
    const rev = s.totalAmountReceivable || 0;
    const profit = parseFloat((rev - (qty * costPerPack)).toFixed(2));

    totalRevenueGenerated += rev;
    totalProfitGenerated += profit;

    return {
      invoiceNumber: s.id,
      date: s.date,
      customerName: cust ? cust.shopName : (s.shopName || 'Direct Customer'),
      quantity: qty,
      revenue: rev,
      profit: profit
    };
  });

  res.json({
    batch,
    product,
    recipe,
    ingredientsUsed,
    shopsSupplied,
    salesHistory,
    financials: {
      revenueGenerated: parseFloat(totalRevenueGenerated.toFixed(2)),
      profitGenerated: Math.max(0, parseFloat(totalProfitGenerated.toFixed(2))),
      remainingStockValue: parseFloat(((batch.remainingStock || 0) * (batch.costPerPacket || 0)).toFixed(2))
    }
  });
});

app.put('/api/admin/batches/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.batches.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Batch not found' });

  const current = db.batches[index];
  const { productId, batchNumber, batchCode, manufacturingDate, bestBeforeDate, packSize, packetsProduced, manufacturingCost, quantityProduced, notes } = req.body;

  const prodId = productId || current.productId;
  const product = db.products.find(p => p.id === prodId);
  if (!product) return res.status(400).json({ message: 'Product not found' });

  const packetsCount = parseInt(packetsProduced !== undefined ? packetsProduced : current.packetsProduced, 10) || 0;
  const mfgCost = parseFloat(manufacturingCost !== undefined ? manufacturingCost : current.manufacturingCost) || 0;

  // Validate raw spices (temporary update check excluding current batch)
  const recipe = db.recipes.find(r => r.productId === prodId);
  if (recipe) {
    const missingMaterials = [];
    recipe.ingredients.forEach(ing => {
      const rm = db.rawMaterials.find(m => m.id === ing.rawMaterialId);
      if (!rm) return;
      
      const purchases = (db.ingredientPurchases || []).filter(p => p.rawMaterialId === rm.id);
      const totalPurchased = purchases.reduce((sum, p) => sum + p.quantity, 0);
      let totalUsed = 0;
      db.batches.forEach(b => {
        if (b.id === req.params.id) return;

        const r = db.recipes.find(rec => rec.id === b.recipeId);
        if (r) {
          const rIng = r.ingredients.find(ri => ri.rawMaterialId === rm.id);
          if (rIng) {
            const p = db.products.find(prod => prod.id === r.productId);
            const pSizeKg = parsePackSizeToKg(p ? p.packSize : '');
            const rIngQtyInRmUnit = convertUnit(rIng.quantity, rIng.unit || 'kg', rm.unit);
            totalUsed += rIngQtyInRmUnit * b.packetsProduced * pSizeKg;
          }
        }
      });
      const currentStock = totalPurchased - totalUsed;
      const ingQtyInRmUnit = convertUnit(ing.quantity, ing.unit || 'kg', rm.unit);
      const pSizeKg = parsePackSizeToKg(product.packSize);
      const needed = ingQtyInRmUnit * packetsCount * pSizeKg;

      if (currentStock < needed) {
        missingMaterials.push(`Insufficient stock for ${rm.name}. Needed: ${needed.toFixed(3)} ${rm.unit}, Current: ${currentStock.toFixed(3)} ${rm.unit}`);
      }
    });

    if (missingMaterials.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot update production batch. Raw material shortages:',
        errors: missingMaterials
      });
    }
  }

  // Update batch fields
  db.batches[index] = {
    ...current,
    productId: prodId,
    recipeId: recipe ? recipe.id : '',
    batchNumber: batchNumber || current.batchNumber,
    batchCode: batchCode || current.batchCode,
    manufacturingDate: manufacturingDate || current.manufacturingDate,
    bestBeforeDate: bestBeforeDate !== undefined ? bestBeforeDate : current.bestBeforeDate,
    quantityProduced: quantityProduced !== undefined ? parseFloat(quantityProduced) : current.quantityProduced,
    packSize: packSize || current.packSize,
    packetsProduced: packetsCount,
    manufacturingCost: mfgCost,
    costPerPacket: packetsCount > 0 ? parseFloat((mfgCost / packetsCount).toFixed(2)) : 0,
    notes: notes !== undefined ? notes : current.notes,
    remainingStock: packetsCount
  };
  const updated = db.batches[index];

  // Update auto-logged expense
  const expenseIndex = db.expenses.findIndex(e => e.id === `e_prod_${updated.id}`);
  if (expenseIndex !== -1) {
    db.expenses[expenseIndex] = {
      ...db.expenses[expenseIndex],
      amount: mfgCost,
      date: updated.manufacturingDate,
      description: `Production cost for batch ${updated.batchNumber} (${packetsCount} pouches of ${product.name})`
    };
  } else {
    db.expenses.push({
      id: `e_prod_${updated.id}`,
      category: 'Production',
      amount: mfgCost,
      date: updated.manufacturingDate,
      description: `Production cost for batch ${updated.batchNumber} (${packetsCount} pouches of ${product.name})`
    });
  }

  recalculateBatchStocks(db);
  await commit();
  res.json(updated);
});

app.delete('/api/admin/batches/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.batches.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Batch not found' });

  const deleted = db.batches.splice(index, 1)[0];
  db.expenses = db.expenses.filter(e => e.id !== `e_prod_${deleted.id}`);

  await commit();
  res.json({ message: 'Batch record removed', batch: deleted });
});


// ---------------- CUSTOMERS / SHOPS CRUD (REVISED) ----------------
app.get('/api/admin/customers', authenticateToken, (req, res) => {
  res.json(getDB().customers || []);
});

app.post('/api/admin/customers', authenticateToken, async (req, res) => {
  const db = getDB();
  const { 
    date,
    contactName, 
    shopName, 
    customerClassification, 
    phoneNumber, 
    address, 
    remarks 
  } = req.body;

  if (!shopName || !contactName) {
    return res.status(400).json({ message: 'Shop Name and Contact Name are required.' });
  }

  const newCustomer = {
    id: `c_${Date.now()}`,
    date: date || new Date().toISOString().split('T')[0],
    contactName,
    shopName,
    customerClassification: customerClassification || 'Retailer',
    phoneNumber: phoneNumber || '',
    address: address || '',
    outstandingBalance: 0,
    remarks: remarks || ''
  };

  db.customers.push(newCustomer);

  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Registered New Shop',
    details: `Registered outlet "${shopName}" (${contactName}).`,
    timestamp: new Date().toISOString()
  });

  await commit();
  res.status(201).json(newCustomer);
});

app.put('/api/admin/customers/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.customers.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Customer record not found' });

  const current = db.customers[index];
  const { 
    contactName, 
    shopName, 
    customerClassification, 
    phoneNumber, 
    address, 
    remarks 
  } = req.body;

  db.customers[index] = { 
    ...current,
    contactName: contactName || current.contactName,
    shopName: shopName || current.shopName,
    customerClassification: customerClassification || current.customerClassification,
    phoneNumber: phoneNumber !== undefined ? phoneNumber : current.phoneNumber,
    address: address !== undefined ? address : current.address,
    remarks: remarks !== undefined ? remarks : current.remarks
  };

  await commit();
  res.json(db.customers[index]);
});

app.post('/api/admin/customers/:id/payment', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.customers.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Customer record not found' });

  const customer = db.customers[index];
  const { amountPaid, paymentDate, notes } = req.body;
  const payVal = parseFloat(amountPaid || 0);

  if (isNaN(payVal) || payVal <= 0) {
    return res.status(400).json({ message: 'Please enter a valid payment amount.' });
  }

  // Calculate current dues based on sales minus payments
  const sales = (db.sales || []).filter(s => s.customerId === customer.id);
  const totalReceivables = sales.reduce((sum, s) => sum + (s.totalAmountReceivable || 0), 0);
  const totalDirectReceived = sales.reduce((sum, s) => sum + (s.amountReceived || 0), 0);
  
  const currentDues = Math.max(0, totalReceivables - totalDirectReceived);
  
  // Register payment record in pendingPayments or payments array
  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Dues Payment Collected',
    details: `Collected ₹${payVal.toFixed(2)} from ${customer.shopName}.`,
    timestamp: new Date().toISOString()
  });

  // Track customer direct dues payment entry if needed
  if (!db.customerPayments) db.customerPayments = [];
  db.customerPayments.push({
    id: `cp_${Date.now()}`,
    customerId: customer.id,
    amount: payVal,
    date: paymentDate || new Date().toISOString().split('T')[0],
    notes: notes || ''
  });

  await commit();
  res.json({ message: 'Payment recorded successfully', customer });
});

app.delete('/api/admin/customers/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.customers.findIndex(c => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Customer record not found' });

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
  res.json(getDB().sales || []);
});

app.post('/api/admin/sales', authenticateToken, async (req, res) => {
  const { date, customerId, productId, batchId, quantityGiven, amountReceived, paymentStatus, paymentDate, remarks } = req.body;
  const db = getDB();

  if (!customerId || !productId || !batchId || !quantityGiven) {
    return res.status(400).json({ message: 'Missing required sales fields' });
  }

  // Recalculate batch stocks dynamically from sales before checking
  recalculateBatchStocks(db);

  const customer = db.customers.find(c => c.id === customerId);
  const shopName = customer ? customer.shopName : 'Direct Shop';

  const product = db.products.find(p => p.id === productId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const batch = db.batches.find(b => b.id === batchId);
  if (!batch) return res.status(404).json({ message: 'Production batch not found' });

  const qty = parseInt(quantityGiven, 10) || 0;
  const received = parseFloat(amountReceived || 0);
  const selectedPriceType = req.body.priceType || 'Wholesale Price';
  const unitPriceUsed = selectedPriceType === 'MRP Price' ? product.mrp : product.wholesalePrice;

  if (batch.remainingStock < qty) {
    return res.status(400).json({ 
      message: `Insufficient stock in batch ${batch.batchNumber}. Available: ${batch.remainingStock}, Requested: ${qty}` 
    });
  }

  const totalReceivable = qty * unitPriceUsed;
  const balance = totalReceivable - received;

  const yearStr = new Date().getFullYear();
  const salesCount = (db.sales || []).length + 1;
  const generatedInvNo = req.body.invoiceNumber || `INV-${yearStr}-${String(salesCount).padStart(4, '0')}`;

  const newSale = {
    id: `s_${Date.now()}`,
    invoiceNumber: generatedInvNo,
    date,
    customerId,
    shopName,
    productId,
    productName: product.name,
    batchId,
    batchNumber: batch.batchNumber,
    packSize: product.packSize,
    quantityGiven: qty,
    priceType: selectedPriceType,
    mrp: product.mrp,
    wholesalePrice: product.wholesalePrice,
    totalAmountReceivable: parseFloat(totalReceivable.toFixed(2)),
    paymentStatus: paymentStatus || (balance <= 0 ? 'Paid' : 'Pending'),
    amountReceived: received,
    balanceAmount: parseFloat(balance.toFixed(2)),
    paymentDate: paymentDate || '',
    remarks: remarks || ''
  };

  db.sales.push(newSale);

  // Recalculate remaining stock for all batches
  recalculateBatchStocks(db);

  // Track customer outstanding dues
  if (customer) {
    customer.outstandingBalance = parseFloat((customer.outstandingBalance + balance).toFixed(2));
  }

  // Create Pending Payment record if balance > 0
  if (balance > 0) {
    db.pendingPayments.push({
      id: `pp_${Date.now()}`,
      customerId,
      invoiceNumber: newSale.invoiceNumber,
      totalAmount: totalReceivable,
      amountPaid: received,
      pendingAmount: balance,
      dueDate: new Date(new Date(date).getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending'
    });
  }

  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Recorded Sale Ledger',
    details: `Supplied ${qty} packs of ${product.name} to ${shopName}. Invoice: ${generatedInvNo}.`,
    timestamp: new Date().toISOString()
  });

  await commit();
  res.status(201).json(newSale);
});

// ---------------- INVOICES ROUTE ----------------
app.get('/api/admin/invoices', authenticateToken, (req, res) => {
  const db = getDB();
  const sales = db.sales || [];
  
  const groups = {};
  sales.forEach(s => {
    const invNo = s.invoiceNumber || `INV-${s.id.replace('s_', '').slice(-6).toUpperCase()}`;
    if (!groups[invNo]) {
      const cust = db.customers.find(c => c.id === s.customerId);
      groups[invNo] = {
        invoiceNumber: invNo,
        date: s.date,
        customerId: s.customerId,
        shopName: s.shopName,
        priceType: s.priceType || 'Wholesale Price',
        customer: cust || { shopName: s.shopName || 'Direct Shop', ownerName: '', address: '', phoneNumber: '' },
        items: [],
        subtotal: 0,
        amountReceived: 0,
        balanceAmount: 0,
        paymentStatus: 'Paid',
        remarks: s.remarks || ''
      };
    }

    if (s.priceType) groups[invNo].priceType = s.priceType;
    
    groups[invNo].items.push({
      saleId: s.id,
      productId: s.productId,
      productName: s.productName,
      packSize: s.packSize,
      batchId: s.batchId,
      batchNumber: s.batchNumber,
      quantityGiven: s.quantityGiven,
      priceType: s.priceType || 'Wholesale Price',
      mrp: s.mrp,
      wholesalePrice: s.wholesalePrice,
      totalAmount: s.totalAmountReceivable
    });

    groups[invNo].subtotal += s.totalAmountReceivable || 0;
    groups[invNo].amountReceived += s.amountReceived || 0;
    groups[invNo].balanceAmount += s.balanceAmount || 0;
    if (s.remarks && !groups[invNo].remarks) groups[invNo].remarks = s.remarks;
  });

  const invoiceList = Object.values(groups).map(inv => {
    inv.subtotal = parseFloat(inv.subtotal.toFixed(2));
    inv.amountReceived = parseFloat(inv.amountReceived.toFixed(2));
    inv.balanceAmount = Math.max(0, parseFloat((inv.subtotal - inv.amountReceived).toFixed(2)));
    inv.paymentStatus = inv.balanceAmount <= 0 ? 'Paid' : (inv.amountReceived > 0 ? 'Partially Paid' : 'Pending');
    return inv;
  });

  invoiceList.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  res.json(invoiceList);
});

app.put('/api/admin/sales/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.sales.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Sale record not found' });

  const current = db.sales[index];
  const { date, customerId, productId, batchId, quantityGiven, priceType, amountReceived, paymentStatus, paymentDate, remarks } = req.body;

  const targetCustId = customerId || current.customerId;
  const customer = db.customers.find(c => c.id === targetCustId);
  const shopName = customer ? customer.shopName : current.shopName;

  const prodId = productId || current.productId;
  const product = db.products.find(p => p.id === prodId);
  if (!product) return res.status(404).json({ message: 'Product not found' });

  const targetBatchId = batchId || current.batchId;
  const batch = db.batches.find(b => b.id === targetBatchId);
  if (!batch) return res.status(404).json({ message: 'Production batch not found' });

  const qty = parseInt(quantityGiven !== undefined ? quantityGiven : current.quantityGiven, 10) || 0;
  const received = parseFloat(amountReceived !== undefined ? amountReceived : current.amountReceived) || 0;
  const selectedPriceType = priceType || current.priceType || 'Wholesale Price';
  const unitPriceUsed = selectedPriceType === 'MRP Price' ? product.mrp : product.wholesalePrice;

  const totalReceivable = qty * unitPriceUsed;
  const balance = totalReceivable - received;

  if (customer) {
    customer.outstandingBalance = Math.max(0, parseFloat((customer.outstandingBalance - current.balanceAmount + balance).toFixed(2)));
  }

  db.sales[index] = {
    ...current,
    date: date || current.date,
    customerId: targetCustId,
    shopName,
    productId: prodId,
    productName: product.name,
    batchId: targetBatchId,
    batchNumber: batch.batchNumber,
    packSize: product.packSize,
    quantityGiven: qty,
    priceType: selectedPriceType,
    mrp: product.mrp,
    wholesalePrice: product.wholesalePrice,
    totalAmountReceivable: parseFloat(totalReceivable.toFixed(2)),
    paymentStatus: paymentStatus || (balance <= 0 ? 'Paid' : 'Pending'),
    amountReceived: received,
    balanceAmount: parseFloat(balance.toFixed(2)),
    paymentDate: paymentDate !== undefined ? paymentDate : current.paymentDate,
    remarks: remarks !== undefined ? remarks : current.remarks
  };

  recalculateBatchStocks(db);

  await commit();
  res.json(db.sales[index]);
});

app.delete('/api/admin/sales/:id', authenticateToken, async (req, res) => {
  const db = getDB();
  const index = db.sales.findIndex(s => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Sale record not found' });

  const deleted = db.sales.splice(index, 1)[0];

  recalculateBatchStocks(db);

  const customer = db.customers.find(c => c.id === deleted.customerId);
  if (customer) {
    customer.outstandingBalance = Math.max(0, parseFloat((customer.outstandingBalance - deleted.balanceAmount).toFixed(2)));
  }

  db.pendingPayments = db.pendingPayments.filter(pp => pp.invoiceNumber !== deleted.id);

  db.recentActivities.unshift({
    id: `a_${Date.now()}`,
    action: 'Deleted Invoice',
    details: `Deleted Invoice ${deleted.id} (₹${deleted.totalAmountReceivable}).`,
    timestamp: new Date().toISOString()
  });

  await commit();
  res.json({ message: 'Invoice removed', sale: deleted });
});


// ---------------- EXPENSES CRUD ----------------
app.get('/api/admin/expenses', authenticateToken, (req, res) => {
  const db = getDB();
  const filtered = (db.expenses || []).filter(e => e.category !== 'Production' && !e.id.startsWith('e_prod_'));
  res.json(filtered);
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
          'Date': s.date,
          'Shop / Customer': cust ? cust.shopName : 'Direct Customer',
          'Product Name': s.productName,
          'Batch #': s.batchNumber,
          'Quantity Given': s.quantityGiven,
          'Wholesale Price': `₹${s.wholesalePrice}`,
          'Total Amount': `₹${s.totalAmountReceivable}`,
          'Status': s.paymentStatus
        };
      });
      const totalRev = filteredSales.reduce((acc, s) => acc + s.totalAmountReceivable, 0);
      summary = {
        'Total Transactions': filteredSales.length,
        'Average Transaction Value': filteredSales.length > 0 ? `₹${(totalRev / filteredSales.length).toFixed(2)}` : '₹0.00'
      };
      break;
    }
    case 'revenue': {
      const filteredSales = filterByDate(db.sales, 'date');
      const productTotals = {};
      filteredSales.forEach(s => {
        const name = s.productName || 'Unknown Product';
        if (!productTotals[name]) productTotals[name] = 0;
        productTotals[name] += s.totalAmountReceivable;
      });
      reportData = Object.entries(productTotals).map(([product, total]) => ({
        'Product Name': product,
        'Revenue Generated': `₹${total}`
      }));
      summary = {
        'Active Sales Records': filteredSales.length
      };
      break;
    }
    case 'profit': {
      const filteredSales = filterByDate(db.sales, 'date');
      const filteredExpenses = filterByDate(db.expenses, 'date');
      let grossProfit = 0;
      const productProfit = {};

      filteredSales.forEach(s => {
        const prod = db.products.find(p => p.id === s.productId);
        const cost = prod ? (prod.productionCost || prod.costPrice || 0) : 0;
        const profit = s.totalAmountReceivable - (cost * s.quantityGiven);
        grossProfit += profit;

        const pName = s.productName || 'Unknown';
        if (!productProfit[pName]) productProfit[pName] = { sales: 0, cost: 0, profit: 0 };
        productProfit[pName].sales += s.totalAmountReceivable;
        productProfit[pName].cost += cost * s.quantityGiven;
        productProfit[pName].profit += profit;
      });

      reportData = Object.entries(productProfit).map(([product, metrics]) => ({
        'Product': product,
        'Sales Revenue': `₹${metrics.sales}`,
        'Cost of Production': `₹${metrics.cost}`,
        'Gross Profit Margin': `₹${metrics.profit}`
      }));

      const totalExp = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
      summary = {
        'Operating Expenses': `₹${totalExp}`
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
          'Quantity Produced': `${b.packetsProduced} pouches`,
          'Pack Size': b.packSize,
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
        const purchases = (db.ingredientPurchases || []).filter(p => p.rawMaterialId === rm.id);
        const totalPurchased = purchases.reduce((sum, p) => sum + p.quantity, 0);
        let totalUsed = 0;
        db.batches.forEach(b => {
          const recipe = db.recipes.find(r => r.id === b.recipeId);
          if (recipe) {
            const ing = recipe.ingredients.find(i => i.rawMaterialId === rm.id);
            if (ing) {
              const product = db.products.find(p => p.id === recipe.productId);
              const packSizeKg = parsePackSizeToKg(product ? product.packSize : '');
              const qtyInRmUnit = convertUnit(ing.quantity, ing.unit || 'kg', rm.unit);
              totalUsed += qtyInRmUnit * b.packetsProduced * packSizeKg;
            }
          }
        });
        const currentStock = totalPurchased - totalUsed;
        return {
          'Material Name': rm.name,
          'Total Purchased': `${totalPurchased} ${rm.unit}`,
          'Total Used': `${totalUsed} ${rm.unit}`,
          'Current Stock': `${currentStock} ${rm.unit}`,
          'Min. Stock Level': `${rm.minStockLevel} ${rm.unit}`,
          'Stock Status': currentStock < rm.minStockLevel ? 'LOW STOCK ALERT' : 'Normal'
        };
      });
      summary = {
        'Raw Materials Tracked': db.rawMaterials.length,
        'Low Stock Items': db.rawMaterials.filter(rm => {
          const purchases = (db.ingredientPurchases || []).filter(p => p.rawMaterialId === rm.id);
          const totalPurchased = purchases.reduce((sum, p) => sum + p.quantity, 0);
          let totalUsed = 0;
          db.batches.forEach(b => {
            const recipe = db.recipes.find(r => r.id === b.recipeId);
            if (recipe) {
              const ing = recipe.ingredients.find(i => i.rawMaterialId === rm.id);
              if (ing) {
                const product = db.products.find(p => p.id === recipe.productId);
                const packSizeKg = parsePackSizeToKg(product ? product.packSize : '');
                const qtyInRmUnit = convertUnit(ing.quantity, ing.unit || 'kg', rm.unit);
                totalUsed += qtyInRmUnit * b.packetsProduced * packSizeKg;
              }
            }
          });
          return (totalPurchased - totalUsed) < rm.minStockLevel;
        }).length
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

  // ---------------- FINANCIAL SUMMARY FOR DATE RANGE ----------------
  const isGeneralExp = (e) => e.category !== 'Raw Materials' && e.category !== 'Packaging' && e.category !== 'Production' && !e.id.startsWith('e_prod_');
  const rangeSales = filterByDate(db.sales, 'date');
  const rangeCustomerSales = filterByDate(db.customers || [], 'date');
  const rangeExpenses = filterByDate(db.expenses || [], 'date').filter(isGeneralExp);

  const rangeRevenue = rangeSales.reduce((acc, s) => acc + s.totalAmountReceivable, 0) +
                       rangeCustomerSales.reduce((acc, c) => acc + (c.totalAmountReceivable || 0), 0);

  let rangeCogs = 0;
  rangeSales.forEach(s => {
    const prod = db.products.find(p => p.id === s.productId);
    const cost = prod ? (prod.productionCost || prod.costPrice || 0) : 0;
    rangeCogs += s.quantityGiven * cost;
  });
  rangeCustomerSales.forEach(c => {
    const prod = db.products.find(p => p.id === c.productId);
    const cost = prod ? (prod.productionCost || prod.costPrice || 0) : 0;
    rangeCogs += (c.quantityGiven || 0) * cost;
  });

  const rangeExpenseTotal = rangeExpenses.reduce((acc, e) => acc + e.amount, 0);
  const rangeGrossProfit = rangeRevenue - rangeCogs;
  const rangeNetProfit = rangeGrossProfit - rangeExpenseTotal;
  const rangeProfitMargin = rangeRevenue > 0 ? ((rangeNetProfit / rangeRevenue) * 100).toFixed(1) : '0.0';

  const financialMetrics = {
    revenue: `₹${rangeRevenue.toFixed(2)}`,
    cogs: `₹${rangeCogs.toFixed(2)}`,
    netProfit: `₹${rangeNetProfit.toFixed(2)}`,
    profitMargin: `${rangeProfitMargin}%`,
    period: `${startDate} to ${endDate}`
  };

  res.json({
    reportData,
    summary,
    financialMetrics,
    title: `${type.toUpperCase().replace('-', ' ')} REPORT`,
    dateRange: `${startDate} to ${endDate}`
  });
});


// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gandham Spices Admin Server running on http://localhost:${PORT}`);
});
