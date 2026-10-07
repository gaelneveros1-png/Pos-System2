# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

No build step or dependencies to install. Open `index.html` directly in a browser, or serve it with any static file server:

```bash
npx serve .
# or
python -m http.server 8080
```

Deployed via Netlify — `netlify.toml` configures the publish directory as `.` with a catch-all SPA redirect.

## Architecture

This is a vanilla JS SPA (no framework, no bundler). All state lives in `localStorage`. Script load order in `index.html` matters — modules depend on each other as globals:

```
storage.js → products.js → sales.js → clients.js → scanner.js → stats.js → app.js
```

**Module pattern:** Each file exports a single `const` object (e.g., `Storage`, `Products`, `Sales`, `Clients`, `Scanner`, `Stats`, `App`) with `init()` and method functions. Modules call each other directly as globals.

**`Storage` (js/storage.js):** Single source of truth. All reads/writes go through this layer — never touch `localStorage` directly from other modules. LocalStorage keys are prefixed `pos_`. Data schema:
- Products: `{ id, codigo, nombre, precio }`
- Clients: `{ id, nombre, telefono, saldoDeuda, notas[] }` — `notas` is the debt history
- Sales: `{ id, fecha, productos[], total, tipo, clienteId }`

**`App` (app.js):** Bootstraps all modules, owns view switching (`switchView`), modal open/close (`showModal`/`hideModal`), and the toast notification system. All modals are pre-declared in HTML; JS toggles `.active` class.

**View routing:** Four views (`sales`, `clients`, `products`, `stats`) as sibling `<div class="view">` elements. Only one has `.active` at a time. Bottom nav `data-view` attributes drive routing.

**Currency:** `Storage.CURRENCY = 'S/.'` (Peruvian Sol). Always use this constant — never hardcode the symbol.

**XSS protection:** All user-supplied strings rendered into `innerHTML` must go through `escapeHtml()`, which is defined on each module that needs it (not shared — duplicated intentionally).

**Barcode scanning:** Uses the `html5-qrcode` CDN library (`js/scanner.js`). Camera access requires HTTPS or localhost.

**Theme:** Light/dark via `data-theme` attribute on `<html>`. CSS variables handle theming in `styles.css`. Preference saved to `localStorage` under key `pos_theme`.

## PWA

The app is configured as a Progressive Web App:

- **`manifest.json`** — `display: "standalone"`, theme `#059669`, shortcuts to `?view=sales` and `?view=clients`.
- **`sw.js`** — Service Worker with cache-first for static assets and network-first for navigation. Bump `CACHE_NAME` (e.g. `pos-ventas-v2`) whenever deploying changes so old caches are evicted on activation.
- **`icons/icon.svg` / `icon-maskable.svg`** — SVG icons (scale to any size). The maskable variant keeps content inside the safe zone (80% of canvas) for rounded system launchers.
- **Shortcuts** — `?view=<name>` query param is handled in the inline `<script>` at the bottom of `index.html` via `App.switchView()`.
- Service workers only work over **HTTPS or localhost**. Use `npx serve .` locally; production runs on Netlify HTTPS automatically.
