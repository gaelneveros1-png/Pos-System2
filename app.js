/**
 * Main Application Controller
 * Coordinates all modules and handles global app state
 */

const App = {
    currentView: 'sales',
    modals: {},
    toastShowTimer: null,
    toastHideTimer: null,


    /**
     * Initialize application
     */
    init() {
        console.log('🚀 Initializing POS System...');

        //Initialize storage
        Storage.init();

        // Initialize all modules
        Products.init();
        Sales.init();
        Clients.init();
        Scanner.init();
        Stats.init();

        // Setup navigation
        this.setupNavigation();

        // Setup modals
        this.setupModals();

        // Setup theme toggle
        this.setupThemeToggle();

        // Set initial view
        this.switchView('sales');

        console.log('✅ POS System Ready!');
    },

    /**
     * Setup bottom navigation
     */
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                this.switchView(view);
            });
        });
    },

    /**
     * Switch between views
     */
    switchView(viewName) {
    const view = document.getElementById(`view${this.capitalizeFirst(viewName)}`);
    if (!view) return; // vista inexistente: no se cambia nada

    // Hide all views
    document.querySelectorAll('.view').forEach(v => {
        v.classList.remove('active');
    });

    // Show selected view
    view.classList.add('active');

    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update current view
    this.currentView = viewName;

    // Refresh view-specific data
    this.refreshView(viewName);
},
    /**
     * Refresh view data
     */
    refreshView(viewName) {
        switch (viewName) {
            case 'sales':
                Products.render();
                break;
            case 'clients':
                Clients.render();
                break;
            case 'products':
                Products.renderInventory();
                break;
            case 'stats':
                Stats.render();
                break;
        }
    },

    /**
     * Setup modal controls
     */
    setupModals() {
        // Get all modals
        const modalIds = ['scanner', 'product', 'client', 'clientDetail', 'selectClient', 'payment'];

        modalIds.forEach(id => {
            this.modals[id] = document.getElementById(`${id}Modal`);
        });

        // Close buttons
        document.querySelectorAll('.btn-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalName = btn.dataset.modal;
                this.hideModal(modalName);
            });
        });

        // Close on backdrop click
        Object.values(this.modals).forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        // Find modal name
                        const modalName = Object.keys(this.modals).find(
                            key => this.modals[key] === modal
                        );
                        this.hideModal(modalName);
                    }
                });
            }
        });

        // Secondary close buttons in forms
        document.querySelectorAll('.btn-secondary[data-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalName = btn.dataset.modal;
                this.hideModal(modalName);
            });
        });
    },

    /**
     * Show modal
     */
    showModal(name) {
        const modal = this.modals[name];
        if (modal) {
            modal.classList.add('active');
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }
    },

    /**
     * Hide modal
     */
    hideModal(name) {
        const modal = this.modals[name];
        if (modal) {
            modal.classList.remove('active');

            // Allow body scroll
            document.body.style.overflow = '';

            // Cleanup for scanner
            if (name === 'scanner') {
                Scanner.cleanup();
            }
        }
    },

    /**
     * Show toast notification
     */
showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    // Cancelar temporizadores del aviso anterior
    clearTimeout(this.toastShowTimer);
    clearTimeout(this.toastHideTimer);

    toast.textContent = message;
    toast.className = `toast ${type}`;

    this.toastShowTimer = setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    this.toastHideTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
},

    /**
     * Setup theme toggle functionality
     */
    setupThemeToggle() {
        const btnThemeToggle = document.getElementById('btnThemeToggle');

        // Load saved theme or default to light
        const savedTheme = localStorage.getItem('pos_theme') || 'light';
        this.setTheme(savedTheme);

        // Toggle theme on button click
        btnThemeToggle?.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
        });
    },

    /**
     * Set theme (light or dark)
     */
   setTheme(theme) {
    const validTheme = theme === 'dark' ? 'dark' : 'light';
    const themeIcon = document.getElementById('themeIcon');
    document.documentElement.setAttribute('data-theme', validTheme);
    localStorage.setItem('pos_theme', validTheme);

    // Update icon
    if (themeIcon) {
        themeIcon.textContent = validTheme === 'light' ? '○' : '●';
    }
},

    /**
     * Utility: Capitalize first letter
     */
   capitalizeFirst(str) {
    if (typeof str !== 'string' || str.length === 0) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
} else {
    App.init();
}
if (typeof module !== 'undefined') {
    module.exports = App;
}