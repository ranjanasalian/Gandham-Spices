const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('gandham_admin_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    if (response.status === 401 || response.status === 403) {
      // Session expired or unauthorized, clear token
      localStorage.removeItem('gandham_admin_token');
      localStorage.removeItem('gandham_admin_user');
      // If we are currently inside the admin application, refresh to force login screen
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin';
      }
      throw new Error('Unauthorized or session expired');
    }

    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.message || response.statusText || 'An error occurred';
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  auth: {
    login: async (username, password) => {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      if (data.token) {
        localStorage.setItem('gandham_admin_token', data.token);
        localStorage.setItem('gandham_admin_user', JSON.stringify(data.user));
      }
      return data;
    },
    logout: () => {
      localStorage.removeItem('gandham_admin_token');
      localStorage.removeItem('gandham_admin_user');
      window.location.href = '/admin';
    },
    me: () => request('/auth/me'),
    changePassword: (currentPassword, newPassword) => request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    })
  },
  stats: {
    getDashboardStats: (range = 'week', startDate = '', endDate = '') => {
      let query = `?range=${range}`;
      if (range === 'custom') {
        query += `&startDate=${startDate}&endDate=${endDate}`;
      }
      return request(`/admin/dashboard-stats${query}`);
    }
  },
  products: {
    getAll: () => request('/admin/products'),
    create: (product) => request('/admin/products', {
      method: 'POST',
      body: JSON.stringify(product)
    }),
    update: (id, product) => request(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    }),
    delete: (id) => request(`/admin/products/${id}`, {
      method: 'DELETE'
    })
  },
  rawMaterials: {
    getAll: () => request('/admin/raw-materials'),
    create: (material) => request('/admin/raw-materials', {
      method: 'POST',
      body: JSON.stringify(material)
    }),
    update: (id, material) => request(`/admin/raw-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(material)
    }),
    purchase: (details) => request('/admin/raw-materials/purchase', {
      method: 'POST',
      body: JSON.stringify(details)
    }),
    delete: (id) => request(`/admin/raw-materials/${id}`, {
      method: 'DELETE'
    })
  },
  ingredientPurchases: {
    getAll: () => request('/admin/ingredient-purchases'),
    create: (purchase) => request('/admin/ingredient-purchases', {
      method: 'POST',
      body: JSON.stringify(purchase)
    }),
    update: (id, purchase) => request(`/admin/ingredient-purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(purchase)
    }),
    delete: (id) => request(`/admin/ingredient-purchases/${id}`, {
      method: 'DELETE'
    })
  },
  recipes: {
    getAll: () => request('/admin/recipes'),
    create: (recipe) => request('/api/admin/recipes', {
      // Fallback endpoint handler
      method: 'POST',
      body: JSON.stringify(recipe)
    }),
    createFixed: (recipe) => request('/admin/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe)
    }),
    update: (id, recipe) => request(`/admin/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipe)
    }),
    delete: (id) => request(`/admin/recipes/${id}`, {
      method: 'DELETE'
    })
  },
  batches: {
    getAll: () => request('/admin/batches'),
    create: (batch) => request('/admin/batches', {
      method: 'POST',
      body: JSON.stringify(batch)
    }),
    trace: (batchNumber) => request(`/admin/batches/trace/${batchNumber}`),
    update: (id, batch) => request(`/admin/batches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(batch)
    }),
    delete: (id) => request(`/admin/batches/${id}`, {
      method: 'DELETE'
    })
  },
  customers: {
    getAll: () => request('/admin/customers'),
    create: (customer) => request('/admin/customers', {
      method: 'POST',
      body: JSON.stringify(customer)
    }),
    update: (id, customer) => request(`/admin/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customer)
    }),
    delete: (id) => request(`/admin/customers/${id}`, {
      method: 'DELETE'
    })
  },
  deliveries: {
    getAll: () => request('/admin/deliveries'),
    create: (delivery) => request('/admin/deliveries', {
      method: 'POST',
      body: JSON.stringify(delivery)
    }),
    update: (id, delivery) => request(`/admin/deliveries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(delivery)
    }),
    delete: (id) => request(`/admin/deliveries/${id}`, {
      method: 'DELETE'
    })
  },
  sales: {
    getAll: () => request('/admin/sales'),
    create: (sale) => request('/admin/sales', {
      method: 'POST',
      body: JSON.stringify(sale)
    }),
    update: (id, sale) => request(`/admin/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sale)
    }),
    delete: (id) => request(`/admin/sales/${id}`, {
      method: 'DELETE'
    })
  },
  expenses: {
    getAll: () => request('/admin/expenses'),
    create: (expense) => request('/admin/expenses', {
      method: 'POST',
      body: JSON.stringify(expense)
    }),
    update: (id, expense) => request(`/admin/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense)
    }),
    delete: (id) => request(`/admin/expenses/${id}`, {
      method: 'DELETE'
    })
  },
  pendingPayments: {
    getAll: () => request('/admin/pending-payments'),
    pay: (id, amountPaid) => request(`/admin/pending-payments/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amountPaid })
    })
  },
  orders: {
    getAll: () => request('/admin/orders'),
    update: (id, orderDetails) => request(`/admin/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderDetails)
    })
  },
  suppliers: {
    getAll: () => request('/admin/suppliers'),
    create: (supplier) => request('/admin/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier)
    }),
    update: (id, supplier) => request(`/admin/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplier)
    }),
    delete: (id) => request(`/admin/suppliers/${id}`, {
      method: 'DELETE'
    })
  },
  targets: {
    getAll: () => request('/admin/targets'),
    save: (period, targetRevenue) => request('/admin/targets', {
      method: 'POST',
      body: JSON.stringify({ period, targetRevenue })
    })
  },
  notifications: {
    getAll: () => request('/admin/notifications'),
    dismiss: (id) => request('/admin/notifications/dismiss', {
      method: 'POST',
      body: JSON.stringify({ id })
    })
  },
  reports: {
    getReport: (type, startDate, endDate) => request(`/admin/reports?type=${type}&startDate=${startDate}&endDate=${endDate}`)
  },
  activities: {
    getAll: () => request('/admin/activities')
  }
};
