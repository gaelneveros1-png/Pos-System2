/**
 * Pruebas unitarias del controlador principal (app.js)
 */

document.body.innerHTML = `
  <button id="btnThemeToggle"></button>
  <span id="themeIcon"></span>

  <div id="viewSales" class="view active"></div>
  <div id="viewClients" class="view"></div>
  <div id="viewProducts" class="view"></div>
  <div id="viewStats" class="view"></div>

  <button class="nav-item active" data-view="sales"></button>
  <button class="nav-item" data-view="clients"></button>
  <button class="nav-item" data-view="products"></button>
  <button class="nav-item" data-view="stats"></button>

  <div id="scannerModal"></div>
  <div id="productModal"></div>
  <div id="clientModal"></div>
  <div id="clientDetailModal"></div>
  <div id="selectClientModal"></div>
  <div id="paymentModal"></div>

  <div id="toast" class="toast"></div>
`;

// Simulacros (mocks) de los demás módulos, para probar App de forma aislada
global.Storage  = { init: jest.fn() };
global.Products = { init: jest.fn(), render: jest.fn(), renderInventory: jest.fn() };
global.Sales    = { init: jest.fn() };
global.Clients  = { init: jest.fn(), render: jest.fn() };
global.Scanner  = { init: jest.fn(), cleanup: jest.fn() };
global.Stats    = { init: jest.fn(), render: jest.fn() };

jest.spyOn(console, 'log').mockImplementation(() => {});

// Al importar app.js se ejecuta App.init() automáticamente
const App = require('../app');

beforeEach(() => {
  localStorage.clear();
  document.body.style.overflow = '';
  document.documentElement.removeAttribute('data-theme');
  document.querySelectorAll('.active, .show').forEach(el => el.classList.remove('active', 'show'));
  App.switchView('sales');
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Utilidades', () => {
  test('CP-A01: capitalizeFirst pone la primera letra en mayúscula', () => {
    expect(App.capitalizeFirst('sales')).toBe('Sales');
  });

  test('CP-A02: capitalizeFirst con texto vacío devuelve vacío', () => {
    expect(App.capitalizeFirst('')).toBe('');
  });

  test('CP-A03: capitalizeFirst no debe fallar con undefined', () => {
    expect(() => App.capitalizeFirst(undefined)).not.toThrow();
  });
});

describe('Navegación entre vistas', () => {
  test('CP-A04: switchView activa la vista de clientes y la refresca', () => {
    App.switchView('clients');
    expect(document.getElementById('viewClients').classList.contains('active')).toBe(true);
    expect(App.currentView).toBe('clients');
    expect(Clients.render).toHaveBeenCalled();
  });

  test('CP-A05: la vista de productos renderiza el inventario', () => {
    App.switchView('products');
    expect(Products.renderInventory).toHaveBeenCalled();
  });

  test('CP-A06: una vista inexistente no debe dejar la pantalla en blanco', () => {
    App.switchView('inexistente');
    expect(App.currentView).toBe('sales');
    expect(document.querySelector('.view.active')).not.toBeNull();
  });
});

describe('Tema claro/oscuro', () => {
  test('CP-A07: setTheme guarda el tema y cambia el ícono', () => {
    App.setTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('pos_theme')).toBe('dark');
    expect(document.getElementById('themeIcon').textContent).toBe('●');
  });

  test('CP-A08: un tema inválido debe usar el tema claro', () => {
    App.setTheme('banana');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  test('CP-A09: el botón alterna entre claro y oscuro', () => {
    App.setTheme('light');
    document.getElementById('btnThemeToggle').click();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

describe('Modales', () => {
  test('CP-A10: showModal abre y bloquea el scroll; hideModal lo restaura', () => {
    const modal = document.getElementById('productModal');
    App.showModal('product');
    expect(modal.classList.contains('active')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    App.hideModal('product');
    expect(modal.classList.contains('active')).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  test('CP-A11: cerrar el modal del escáner libera la cámara', () => {
    App.showModal('scanner');
    App.hideModal('scanner');
    expect(Scanner.cleanup).toHaveBeenCalled();
  });

  test('CP-A12: cerrar un modal inexistente no falla', () => {
    expect(() => App.hideModal('noexiste')).not.toThrow();
  });

  test('CP-A13: clic en el fondo cierra el modal', () => {
    App.showModal('product');
    const modal = document.getElementById('productModal');
    modal.click();
    expect(modal.classList.contains('active')).toBe(false);
  });
});

describe('Notificaciones (toast)', () => {
  test('CP-A14: el toast muestra el mensaje y se oculta a los 3 segundos', () => {
    jest.useFakeTimers();
    const toast = document.getElementById('toast');

    App.showToast('Venta guardada', 'success');
    jest.advanceTimersByTime(10);
    expect(toast.textContent).toBe('Venta guardada');
    expect(toast.classList.contains('show')).toBe(true);

    jest.advanceTimersByTime(3000);
    expect(toast.classList.contains('show')).toBe(false);
  });

  test('CP-A15: un segundo toast no debe ocultarse antes de tiempo', () => {
    jest.useFakeTimers();
    const toast = document.getElementById('toast');

    App.showToast('Primero');
    jest.advanceTimersByTime(2000);
    App.showToast('Segundo');
    jest.advanceTimersByTime(1500);

    expect(toast.classList.contains('show')).toBe(true);
  });
});