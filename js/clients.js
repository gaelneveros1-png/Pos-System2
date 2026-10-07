/**
 * Clients Management Module
 * Handles client CRUD and debt tracking
 */

const Clients = {
    currentClients: [],
    searchTerm: '',
    onClientSelect: null,

    /**
     * Initialize clients module
     */
    init() {
        this.loadClients();
        this.bindEvents();
    },

    /**
     * Load clients from storage
     */
    loadClients() {
        this.currentClients = Storage.getClients();
        this.render();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Add client button
        document.getElementById('btnAddClient')?.addEventListener('click', () => {
            this.showClientForm();
        });

        // Client form submit
        document.getElementById('clientForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveClient();
        });

        // Payment form submit
        document.getElementById('paymentForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.recordPayment();
        });

        // Search clients
        document.getElementById('searchClients')?.addEventListener('input', (e) => {
            this.searchTerm = e.target.value.toLowerCase();
            this.render();
        });

        // Search in client selector
        document.getElementById('searchClientSelect')?.addEventListener('input', (e) => {
            this.renderClientSelector(e.target.value.toLowerCase());
        });

        // Event delegation for client cards
        document.getElementById('clientsList')?.addEventListener('click', (e) => {
            const clientCard = e.target.closest('.client-card');
            if (clientCard) {
                const clientId = clientCard.dataset.id;
                this.showClientDetail(clientId);
            }
        });

        // Event delegation for payment buttons
        document.getElementById('clientNotesList')?.addEventListener('click', (e) => {
            const payBtn = e.target.closest('.btn-pay');
            if (payBtn && !payBtn.disabled) {
                const clientId = payBtn.dataset.clientId;
                const noteId = payBtn.dataset.noteId;
                const pending = parseFloat(payBtn.dataset.pending);
                this.showPaymentForm(clientId, noteId, pending);
            }
        });
    },

    /**
     * Render clients list
     */
    render() {
        const list = document.getElementById('clientsList');
        if (!list) return;

        const filtered = this.currentClients.filter(c =>
            c.nombre.toLowerCase().includes(this.searchTerm)
        );

        if (filtered.length === 0) {
            list.innerHTML = '<p class="text-center text-muted">No se encontraron clientes</p>';
            return;
        }

        list.innerHTML = filtered.map(client => {
            const hasDebt = client.saldoDeuda > 0;
            return `
        <div class="client-card ${hasDebt ? 'has-debt' : ''}" data-id="${client.id}">
          <div class="client-info">
            <h3>${this.escapeHtml(client.nombre)}</h3>
            ${client.telefono ? `<div class="client-phone">📞 ${this.escapeHtml(client.telefono)}</div>` : ''}
          </div>
          <div class="client-debt">
            <div class="debt-label">Deuda</div>
            <div class="debt-amount ${hasDebt ? '' : 'zero'}">${Storage.CURRENCY}${client.saldoDeuda.toFixed(2)}</div>
          </div>
        </div>
      `;
        }).join('');
    },

    /**
     * Show client form modal
     */
    showClientForm(client = null) {
        const modal = document.getElementById('clientModal');
        const title = document.getElementById('clientModalTitle');
        const form = document.getElementById('clientForm');

        if (client) {
            title.textContent = 'Editar Cliente';
            document.getElementById('clientId').value = client.id;
            document.getElementById('clientName').value = client.nombre;
            document.getElementById('clientPhone').value = client.telefono || '';
        } else {
            title.textContent = 'Agregar Cliente';
            form.reset();
            document.getElementById('clientId').value = '';
        }

        App.showModal('client');
    },

    /**
     * Save client
     */
    saveClient() {
        const id = document.getElementById('clientId').value;
        const nombre = document.getElementById('clientName').value.trim();
        const telefono = document.getElementById('clientPhone').value.trim();

        if (!nombre) {
            App.showToast('Ingresa el nombre del cliente', 'error');
            return;
        }

        const clientData = { nombre, telefono };

        if (id) {
            Storage.updateClient(id, clientData);
            App.showToast('Cliente actualizado', 'success');
        } else {
            Storage.addClient(clientData);
            App.showToast('Cliente agregado', 'success');
        }

        this.loadClients();
        App.hideModal('client');
    },

    /**
     * Show client detail with debt history
     */
    showClientDetail(clientId) {
        const client = this.currentClients.find(c => c.id === clientId);
        if (!client) return;

        document.getElementById('clientDetailName').textContent = client.nombre;
        document.getElementById('clientDetailDebt').textContent = `${Storage.CURRENCY}${client.saldoDeuda.toFixed(2)}`;

        const notesList = document.getElementById('clientNotesList');

        if (!client.notas || client.notas.length === 0) {
            notesList.innerHTML = '<p class="text-muted text-center">No hay deudas registradas</p>';
        } else {
            // Sort notes by date (newest first)
            const sortedNotes = [...client.notas].sort((a, b) =>
                new Date(b.fecha) - new Date(a.fecha)
            );

            notesList.innerHTML = sortedNotes.map(note => {
                const isPaid = note.pendiente <= 0;
                const date = new Date(note.fecha).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const productSummary = note.productos
                    .map(p => `${p.cantidad}x ${p.nombre}`)
                    .join(', ');

                return `
          <div class="note-item">
            <div class="note-header">
              <span class="note-date">${date}</span>
              <span class="note-total">${Storage.CURRENCY}${note.total.toFixed(2)}</span>
            </div>
            <div class="note-products">${this.escapeHtml(productSummary)}</div>
            <div class="note-status">
              <span class="note-pending ${isPaid ? 'paid' : ''}">
                ${isPaid ? '✓ Pagado' : `Pendiente: ${Storage.CURRENCY}${note.pendiente.toFixed(2)}`}
              </span>
              ${!isPaid ? `
                <button 
                  class="btn-pay" 
                  data-client-id="${client.id}"
                  data-note-id="${note.id}"
                  data-pending="${note.pendiente}"
                >
                  💰 Abonar
                </button>
              ` : ''}
            </div>
          </div>
        `;
            }).join('');
        }

        App.showModal('clientDetail');
    },

    /**
     * Show payment form
     */
    showPaymentForm(clientId, noteId, pending) {
        document.getElementById('paymentClientId').value = clientId;
        document.getElementById('paymentNoteId').value = noteId;
        document.getElementById('paymentPending').textContent = `${Storage.CURRENCY}${pending.toFixed(2)}`;
        document.getElementById('paymentAmount').value = pending.toFixed(2);
        document.getElementById('paymentAmount').max = pending;

        App.showModal('payment');
    },

    /**
     * Record payment
     */
    recordPayment() {
        const clientId = document.getElementById('paymentClientId').value;
        const noteId = document.getElementById('paymentNoteId').value;
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const pending = parseFloat(document.getElementById('paymentPending').textContent.replace(Storage.CURRENCY, ''));

        if (!amount || amount <= 0) {
            App.showToast('Ingresa un monto válido', 'error');
            return;
        }

        if (amount > pending) {
            App.showToast('El monto no puede ser mayor a la deuda', 'error');
            return;
        }

        // Record payment
        Storage.recordPayment(clientId, noteId, amount);

        App.showToast(`Pago de ${Storage.CURRENCY}${amount.toFixed(2)} registrado`, 'success');
        App.hideModal('payment');

        // Refresh data and reopen client detail
        this.loadClients();

        // Small delay to allow data to refresh
        setTimeout(() => {
            this.showClientDetail(clientId);
        }, 100);
    },

    /**
     * Show client selector for credit sales
     */
    showClientSelector(callback) {
        this.onClientSelect = callback;
        this.renderClientSelector();
        App.showModal('selectClient');
    },

    /**
     * Render client selector list
     */
    renderClientSelector(searchTerm = '') {
        const list = document.getElementById('selectClientList');
        if (!list) return;

        const filtered = this.currentClients.filter(c =>
            c.nombre.toLowerCase().includes(searchTerm)
        );

        if (filtered.length === 0) {
            list.innerHTML = `
        <p class="text-center text-muted">No se encontraron clientes</p>
        <button class="btn-primary" style="margin-top: 1rem; width: 100%;" id="btnAddClientFromSelect">
          ➕ Agregar Nuevo Cliente
        </button>
      `;

            // Add event listener for add client button
            document.getElementById('btnAddClientFromSelect')?.addEventListener('click', () => {
                App.hideModal('selectClient');
                this.showClientForm();
            });
            return;
        }

        list.innerHTML = filtered.map(client => `
      <div class="select-client-item" data-id="${client.id}">
        <span class="select-client-name">${this.escapeHtml(client.nombre)}</span>
        <span class="select-client-debt">Deuda: ${Storage.CURRENCY}${client.saldoDeuda.toFixed(2)}</span>
      </div>
    `).join('');

        // Add click handlers
        list.querySelectorAll('.select-client-item').forEach(item => {
            item.addEventListener('click', () => {
                const clientId = item.dataset.id;
                if (this.onClientSelect) {
                    this.onClientSelect(clientId);
                }
            });
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
