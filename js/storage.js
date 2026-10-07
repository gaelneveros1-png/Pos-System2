/**
 * LocalStorage Data Manager
 * Handles all data persistence operations
 */

const Storage = {
  // Keys for localStorage
  KEYS: {
    PRODUCTS: 'pos_inventario',
    CLIENTS: 'pos_clientes',
    SALES: 'pos_ventas',
    VERSION: 'pos_version'
  },

  // Current data version for migrations
  VERSION: '1.0.0',

  // Currency configuration
  CURRENCY: 'S/.',

  /**
   * Initialize storage with default data if empty
   */
  init() {
    // Check version
    const currentVersion = localStorage.getItem(this.KEYS.VERSION);
    if (!currentVersion) {
      localStorage.setItem(this.KEYS.VERSION, this.VERSION);
    }

    // Initialize with sample data if first run
    if (!this.getProducts().length) {
      this.initSampleProducts();
    }
  },

  /**
   * Load sample products
   */
  initSampleProducts() {
    const sampleProducts = [
      { id: 'p1', codigo: '7501234567890', nombre: 'Coca Cola 1L', precio: 5.50 },
      { id: 'p2', codigo: '7501234567891', nombre: 'Aceite de Girasol 1L', precio: 7.00 },
      { id: 'p3', codigo: '7501234567892', nombre: 'Inka Kola 3L', precio: 8.50 },
      { id: 'p4', codigo: '7501234567893', nombre: 'Shampoo H&S 700ml', precio: 22.00 },
      { id: 'p5', codigo: '7501234567894', nombre: 'Galleta Oreo', precio: 2.50 },
      { id: 'p6', codigo: '7501234567895', nombre: 'Leche Gloria 1 tarro', precio: 5.00 },
      { id: 'p7', codigo: '7501234567896', nombre: 'Cerveza Pilsen', precio: 7.00 },
      { id: 'p8', codigo: '7501234567897', nombre: 'Cerveza Cristal', precio: 7.00 },
      { id: 'p9', codigo: '7501234567898', nombre: 'Azucar 1 kilo', precio: 8.50 },
      { id: 'p10', codigo: '7501234567899', nombre: 'Chocolate Sublime', precio: 6.00 }
    ];

    this.saveProducts(sampleProducts);
  },

  /**
   * Generic get/set helpers
   */
  get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing ${key}:`, error);
      return false;
    }
  },

  /**
   * PRODUCTS
   */
  getProducts() {
    return this.get(this.KEYS.PRODUCTS) || [];
  },

  saveProducts(products) {
    return this.set(this.KEYS.PRODUCTS, products);
  },

  addProduct(product) {
    const products = this.getProducts();
    product.id = product.id || this.generateId();
    products.push(product);
    this.saveProducts(products);
    return product;
  },

  updateProduct(id, updates) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      this.saveProducts(products);
      return products[index];
    }
    return null;
  },

  deleteProduct(id) {
    const products = this.getProducts();
    const filtered = products.filter(p => p.id !== id);
    this.saveProducts(filtered);
    return filtered.length < products.length;
  },

  findProductByCode(code) {
    const products = this.getProducts();
    return products.find(p => p.codigo === code);
  },

  /**
   * CLIENTS
   */
  getClients() {
    return this.get(this.KEYS.CLIENTS) || [];
  },

  saveClients(clients) {
    return this.set(this.KEYS.CLIENTS, clients);
  },

  addClient(client) {
    const clients = this.getClients();
    client.id = client.id || this.generateId();
    client.saldoDeuda = client.saldoDeuda || 0;
    client.notas = client.notas || [];
    clients.push(client);
    this.saveClients(clients);
    return client;
  },

  updateClient(id, updates) {
    const clients = this.getClients();
    const index = clients.findIndex(c => c.id === id);
    if (index !== -1) {
      clients[index] = { ...clients[index], ...updates };
      this.saveClients(clients);
      return clients[index];
    }
    return null;
  },

  deleteClient(id) {
    const clients = this.getClients();
    const filtered = clients.filter(c => c.id !== id);
    this.saveClients(filtered);
    return filtered.length < clients.length;
  },

  addDebtNote(clientId, note) {
    const clients = this.getClients();
    const client = clients.find(c => c.id === clientId);
    if (client) {
      note.id = note.id || this.generateId();
      note.fecha = note.fecha || new Date().toISOString();
      note.pendiente = note.pendiente || note.total;
      client.notas.push(note);
      client.saldoDeuda = this.calculateClientDebt(client);
      this.saveClients(clients);
      return note;
    }
    return null;
  },

  recordPayment(clientId, noteId, amount) {
    const clients = this.getClients();
    const client = clients.find(c => c.id === clientId);
    if (client) {
      const note = client.notas.find(n => n.id === noteId);
      if (note) {
        note.pagado = (note.pagado || 0) + amount;
        note.pendiente = note.total - note.pagado;
        client.saldoDeuda = this.calculateClientDebt(client);
        this.saveClients(clients);
        return true;
      }
    }
    return false;
  },

  calculateClientDebt(client) {
    return client.notas.reduce((sum, note) => sum + (note.pendiente || 0), 0);
  },

  /**
   * SALES
   */
  getSales() {
    return this.get(this.KEYS.SALES) || [];
  },

  saveSales(sales) {
    return this.set(this.KEYS.SALES, sales);
  },

  addSale(sale) {
    const sales = this.getSales();
    sale.id = sale.id || this.generateId();
    sale.fecha = sale.fecha || new Date().toISOString();
    sales.push(sale);
    this.saveSales(sales);
    return sale;
  },

  /**
   * UTILITIES
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  /**
   * Backup & Restore
   */
  exportData() {
    return {
      version: this.VERSION,
      timestamp: new Date().toISOString(),
      products: this.getProducts(),
      clients: this.getClients(),
      sales: this.getSales()
    };
  },

  importData(data) {
    try {
      if (data.products) this.saveProducts(data.products);
      if (data.clients) this.saveClients(data.clients);
      if (data.sales) this.saveSales(data.sales);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },

  clearAll() {
    localStorage.removeItem(this.KEYS.PRODUCTS);
    localStorage.removeItem(this.KEYS.CLIENTS);
    localStorage.removeItem(this.KEYS.SALES);
    this.init();
  }
};
