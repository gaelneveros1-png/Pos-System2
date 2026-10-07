/**
 * Products Management Module
 * Handles product CRUD and inventory display
 */

const Products = {
    currentProducts: [],
    searchTerm: '',

    /**
     * Initialize products module
     */
    init() {
        this.loadProducts();
        this.bindEvents();
    },

    /**
     * Load products from storage
     */
    loadProducts() {
        this.currentProducts = Storage.getProducts();
        this.render();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Add product button
        document.getElementById('btnAddProduct')?.addEventListener('click', () => {
            this.showProductForm();
        });

        // Product form submit
        document.getElementById('productForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        // Inventory search
        document.getElementById('searchInventory')?.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.renderInventory();
        });

        // Event delegation for edit/delete buttons
        document.getElementById('inventoryList')?.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-edit');
            const deleteBtn = e.target.closest('.btn-delete');

            if (editBtn) {
                const productId = editBtn.dataset.id;
                this.editProduct(productId);
            } else if (deleteBtn) {
                const productId = deleteBtn.dataset.id;
                this.deleteProduct(productId);
            }
        });
    },

    /**
     * Render products for sales view
     */
    render(searchTerm = '') {
        const grid = document.getElementById('productsGrid');
        if (!grid) return;

        const filtered = this.currentProducts.filter(p =>
            p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.codigo.includes(searchTerm)
        );

        if (filtered.length === 0) {
            grid.innerHTML = '<p class="text-center text-muted">No se encontraron productos</p>';
            return;
        }

        grid.innerHTML = filtered.map(product => `
      <div class="product-card" data-id="${product.id}">
        <div class="product-name">${this.escapeHtml(product.nombre)}</div>
        <div class="product-price">${Storage.CURRENCY}${product.precio.toFixed(2)}</div>
      </div>
    `).join('');

        // Add click handlers for adding to cart
        grid.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', () => {
                const productId = card.dataset.id;
                const product = this.currentProducts.find(p => p.id === productId);
                if (product) {
                    Sales.addToCart(product);
                }
            });
        });
    },

    /**
     * Render inventory list
     */
    renderInventory() {
        const list = document.getElementById('inventoryList');
        if (!list) return;

        const filtered = this.currentProducts.filter(p =>
            p.nombre.toLowerCase().includes(this.searchTerm) ||
            p.codigo.includes(this.searchTerm)
        );

        if (filtered.length === 0) {
            list.innerHTML = '<p class="text-center text-muted">No se encontraron productos</p>';
            return;
        }

        list.innerHTML = filtered.map(product => `
      <div class="inventory-item">
        <div class="inventory-info">
          <div class="inventory-name">${this.escapeHtml(product.nombre)}</div>
          <div class="inventory-code">Código: ${this.escapeHtml(product.codigo)}</div>
        </div>
        <div class="inventory-price">${Storage.CURRENCY}${product.precio.toFixed(2)}</div>
        <div class="inventory-actions">
          <button class="btn-edit" data-id="${product.id}" title="Editar">✏️</button>
          <button class="btn-delete" data-id="${product.id}" title="Eliminar">🗑️</button>
        </div>
      </div>
    `).join('');
    },

    /**
     * Show product form modal
     */
    showProductForm(product = null) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('productModalTitle');
        const form = document.getElementById('productForm');

        if (product) {
            title.textContent = 'Editar Producto';
            document.getElementById('productId').value = product.id;
            document.getElementById('productCode').value = product.codigo;
            document.getElementById('productName').value = product.nombre;
            document.getElementById('productPrice').value = product.precio;
        } else {
            title.textContent = 'Agregar Producto';
            form.reset();
            document.getElementById('productId').value = '';
        }

        App.showModal('product');
    },

    /**
     * Save product (add or update)
     */
    saveProduct() {
        const id = document.getElementById('productId').value;
        const codigo = document.getElementById('productCode').value.trim();
        const nombre = document.getElementById('productName').value.trim();
        const precio = parseFloat(document.getElementById('productPrice').value);

        if (!codigo || !nombre || !precio || precio < 0) {
            App.showToast('Por favor completa todos los campos', 'error');
            return;
        }

        const productData = { codigo, nombre, precio };

        if (id) {
            // Update existing
            Storage.updateProduct(id, productData);
            App.showToast('Producto actualizado', 'success');
        } else {
            // Add new
            Storage.addProduct(productData);
            App.showToast('Producto agregado', 'success');
        }

        this.loadProducts();
        this.renderInventory();
        App.hideModal('product');
    },

    /**
     * Edit product
     */
    editProduct(id) {
        const product = this.currentProducts.find(p => p.id === id);
        if (product) {
            this.showProductForm(product);
        }
    },

    /**
     * Delete product
     */
    deleteProduct(id) {
        if (confirm('¿Eliminar este producto?')) {
            Storage.deleteProduct(id);
            App.showToast('Producto eliminado', 'success');
            this.loadProducts();
            this.renderInventory();
        }
    },

    /**
     * Search products for sales view
     */
    search(term) {
        this.render(term);
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
