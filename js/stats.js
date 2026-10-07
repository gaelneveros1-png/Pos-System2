/**
 * Statistics Module
 * Analyzes sales data and generates reports
 */

const Stats = {
  currentPeriod: 'week',
  salesData: [],

  /**
   * Initialize stats module
   */
  init() {
    this.bindEvents();
  },

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Period filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const period = e.target.dataset.period;
        this.setPeriod(period);
      });
    });
  },

  /**
   * Set time period filter
   */
  setPeriod(period) {
    this.currentPeriod = period;

    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.period === period);
    });

    this.render();
  },

  /**
   * Load and render statistics
   */
  render() {
    this.salesData = Storage.getSales();
    const filtered = this.filterByPeriod(this.salesData);

    const statsContent = document.getElementById('statsContent');
    if (!statsContent) return;

    if (filtered.length === 0) {
      statsContent.innerHTML = `
        <p class="text-center text-muted" style="padding: 2rem;">
          No hay ventas en este período
        </p>
      `;
      return;
    }

    // Calculate statistics
    const totalSales = filtered.length;
    const totalRevenue = filtered.reduce((sum, sale) => sum + sale.total, 0);
    const totalCash = filtered.filter(s => s.tipo === 'efectivo').reduce((sum, sale) => sum + sale.total, 0);
    const totalCredit = filtered.filter(s => s.tipo === 'fiado').reduce((sum, sale) => sum + sale.total, 0);

    // Get top products
    const topProducts = this.getTopProducts(filtered);

    // Render
    statsContent.innerHTML = `
      <div class="stats-summary">
        <div class="stat-card">
          <div class="stat-label">Total Ventas</div>
          <div class="stat-value">${totalSales}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Ingresos</div>
          <div class="stat-value">${Storage.CURRENCY}${totalRevenue.toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Efectivo</div>
          <div class="stat-value" style="color: var(--color-primary);">${Storage.CURRENCY}${totalCash.toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Fiado</div>
          <div class="stat-value" style="color: var(--color-warning);">${Storage.CURRENCY}${totalCredit.toFixed(2)}</div>
        </div>
      </div>

      <div class="stats-table">
        <h3>Productos Más Vendidos</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Ingresos</th>
            </tr>
          </thead>
          <tbody>
            ${topProducts.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${this.escapeHtml(item.nombre)}</td>
                <td>${item.cantidad}</td>
                <td style="color: var(--color-primary); font-weight: 600;">${Storage.CURRENCY}${item.ingresos.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  /**
   * Filter sales by time period
   */
  filterByPeriod(sales) {
    if (this.currentPeriod === 'all') {
      return sales;
    }

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    return sales.filter(sale => {
      const saleDate = new Date(sale.fecha);

      if (this.currentPeriod === 'week') {
        return saleDate >= startOfWeek;
      } else if (this.currentPeriod === 'month') {
        return saleDate >= startOfMonth;
      }

      return true;
    });
  },

  /**
   * Get top selling products
   */
  getTopProducts(sales) {
    const productMap = new Map();

    // Aggregate product data
    sales.forEach(sale => {
      sale.productos.forEach(product => {
        const key = product.nombre;

        if (productMap.has(key)) {
          const existing = productMap.get(key);
          existing.cantidad += product.cantidad;
          existing.ingresos += product.precio * product.cantidad;
        } else {
          productMap.set(key, {
            nombre: product.nombre,
            cantidad: product.cantidad,
            ingresos: product.precio * product.cantidad
          });
        }
      });
    });

    // Convert to array and sort by quantity
    const products = Array.from(productMap.values());
    products.sort((a, b) => b.cantidad - a.cantidad);

    // Return top 10
    return products.slice(0, 10);
  },

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
