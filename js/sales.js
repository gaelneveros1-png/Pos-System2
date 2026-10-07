/**
 * Sales Module
 * Handles shopping cart and sales transactions
 */

const Sales = {
    cart: [],

    /**
     * Initialize sales module
     */
    init() {
        this.bindEvents();
        this.render();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Search products
        let searchTimeout;
        document.getElementById('searchProducts')?.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                Products.search(e.target.value);
            }, 300); // Debounce search
        });

        // Clear cart
        document.getElementById('btnClearCart')?.addEventListener('click', () => {
            this.clearCart();
        });

        // Pay cash
        document.getElementById('btnPayCash')?.addEventListener('click', () => {
            this.completeSale('efectivo');
        });

        // Pay credit (fiar)
        document.getElementById('btnPayCredit')?.addEventListener('click', () => {
            this.selectClientForCredit();
        });

        // Event delegation for cart item buttons
        document.getElementById('cartItems')?.addEventListener('click', (e) => {
            const qtyBtn = e.target.closest('.qty-btn');
            if (qtyBtn) {
                const productId = qtyBtn.dataset.id;
                const action = qtyBtn.dataset.action;
                this.updateQuantity(productId, action);
            }
        });
    },

    /**
     * Add product to cart
     */
    addToCart(product) {
        const existing = this.cart.find(item => item.id === product.id);

        if (existing) {
            existing.cantidad++;
        } else {
            this.cart.push({
                id: product.id,
                nombre: product.nombre,
                precio: product.precio,
                cantidad: 1
            });
        }

        this.render();
        App.showToast(`${product.nombre} agregado`, 'success');
    },

    /**
     * Update cart item quantity
     */
    updateQuantity(productId, action) {
        const item = this.cart.find(i => i.id === productId);
        if (!item) return;

        if (action === 'increase') {
            item.cantidad++;
        } else if (action === 'decrease') {
            item.cantidad--;
            if (item.cantidad <= 0) {
                this.cart = this.cart.filter(i => i.id !== productId);
            }
        }

        this.render();
    },

    /**
     * Calculate cart total
     */
    getTotal() {
        return this.cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    },

    /**
     * Render cart
     */
    render() {
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');

        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p class="cart-empty">Carrito vacío</p>';
            cartTotal.textContent = `${Storage.CURRENCY}0.00`;
            return;
        }

        cartItems.innerHTML = this.cart.map(item => `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${this.escapeHtml(item.nombre)}</div>
          <div class="cart-item-price">${Storage.CURRENCY}${item.precio.toFixed(2)} c/u</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-id="${item.id}" data-action="decrease">−</button>
          <span class="qty-value">${item.cantidad}</span>
          <button class="qty-btn" data-id="${item.id}" data-action="increase">+</button>
        </div>
        <div class="cart-item-total">${Storage.CURRENCY}${(item.precio * item.cantidad).toFixed(2)}</div>
      </div>
    `).join('');

        cartTotal.textContent = `${Storage.CURRENCY}${this.getTotal().toFixed(2)}`;
    },

    /**
     * Clear cart
     */
    clearCart() {
        if (this.cart.length === 0) return;

        if (confirm('¿Vaciar el carrito?')) {
            this.cart = [];
            this.render();
            App.showToast('Carrito vaciado', 'success');
        }
    },

    /**
     * Complete cash sale
     */
    completeSale(tipo = 'efectivo', clientId = null) {
        if (this.cart.length === 0) {
            App.showToast('El carrito está vacío', 'warning');
            return;
        }

        const total = this.getTotal();
        const sale = {
            fecha: new Date().toISOString(),
            productos: [...this.cart],
            total: total,
            tipo: tipo,
            clienteId: clientId
        };

        // Save sale
        Storage.addSale(sale);

        // If credit sale, add to client's debt
        if (tipo === 'fiado' && clientId) {
            const note = {
                fecha: sale.fecha,
                productos: sale.productos,
                total: total,
                pagado: 0,
                pendiente: total
            };
            Storage.addDebtNote(clientId, note);
        }

        // Clear cart
        this.cart = [];
        this.render();

        // Show success message
        const message = tipo === 'efectivo'
            ? `Venta completada: ${Storage.CURRENCY}${total.toFixed(2)}`
            : 'Venta fiada registrada';
        App.showToast(message, 'success');

        // Refresh clients if needed
        if (tipo === 'fiado') {
            Clients.loadClients();
        }
    },

    /**
     * Select client for credit sale
     */
    selectClientForCredit() {
        if (this.cart.length === 0) {
            App.showToast('El carrito está vacío', 'warning');
            return;
        }

        Clients.showClientSelector((clientId) => {
            this.completeSale('fiado', clientId);
            App.hideModal('selectClient');
        });
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
