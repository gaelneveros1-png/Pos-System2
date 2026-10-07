/**
 * Barcode Scanner Module
 * Uses Html5-QRCode library for camera-based scanning
 */

const Scanner = {
    html5QrCode: null,
    isScanning: false,

    /**
     * Initialize scanner module
     */
    init() {
        this.bindEvents();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Scan button
        document.getElementById('btnScan')?.addEventListener('click', () => {
            this.startScanning();
        });
    },

    /**
     * Start camera and scanning
     */
    async startScanning() {
        if (this.isScanning) return;

        // Check if Html5Qrcode is available
        if (typeof Html5Qrcode === 'undefined') {
            App.showToast('Error: Librería de escaneo no disponible', 'error');
            return;
        }

        try {
            // Show modal
            App.showModal('scanner');

            // Initialize scanner
            this.html5QrCode = new Html5Qrcode("scannerReader");

            // Configuration
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            // Supported formats (QR + common barcodes)
            const supportedFormats = [
                Html5QrcodeScanType.SCAN_TYPE_CAMERA
            ];

            // Start scanning
            await this.html5QrCode.start(
                { facingMode: "environment" }, // Use back camera
                config,
                (decodedText, decodedResult) => {
                    this.onScanSuccess(decodedText, decodedResult);
                },
                (errorMessage) => {
                    // Ignore scan errors (happens frequently)
                    // console.log(errorMessage);
                }
            );

            this.isScanning = true;

        } catch (err) {
            console.error('Scanner error:', err);

            let errorMsg = 'No se pudo acceder a la cámara';

            if (err.name === 'NotAllowedError') {
                errorMsg = 'Permiso de cámara denegado';
            } else if (err.name === 'NotFoundError') {
                errorMsg = 'No se encontró cámara';
            } else if (err.name === 'NotSupportedError') {
                errorMsg = 'Navegador no compatible';
            } else if (err.name === 'NotReadableError') {
                errorMsg = 'Cámara en uso por otra app';
            }

            App.showToast(errorMsg, 'error');
            App.hideModal('scanner');
        }
    },

    /**
     * Handle successful scan
     */
    onScanSuccess(decodedText, decodedResult) {
        // Stop scanning
        this.stopScanning();

        // Try to find product by barcode
        const product = Storage.findProductByCode(decodedText);

        if (product) {
            // Add to cart
            Sales.addToCart(product);
            App.showToast(`${product.nombre} escaneado y agregado`, 'success');
        } else {
            App.showToast(`Código no encontrado: ${decodedText}`, 'warning');

            // Optionally, ask if user wants to create new product
            if (confirm(`¿Deseas crear un nuevo producto con el código ${decodedText}?`)) {
                this.createProductFromScan(decodedText);
            }
        }

        // Hide modal
        App.hideModal('scanner');
    },

    /**
     * Stop scanning
     */
    async stopScanning() {
        if (!this.isScanning || !this.html5QrCode) return;

        try {
            await this.html5QrCode.stop();
            this.html5QrCode.clear();
            this.isScanning = false;
        } catch (err) {
            console.error('Error stopping scanner:', err);
        }
    },

    /**
     * Create new product from scanned code
     */
    createProductFromScan(code) {
        // Pre-fill product form with scanned code
        const form = document.getElementById('productForm');
        form.reset();
        document.getElementById('productId').value = '';
        document.getElementById('productCode').value = code;

        const title = document.getElementById('productModalTitle');
        title.textContent = 'Nuevo Producto Escaneado';

        App.showModal('product');

        // Focus on name field
        setTimeout(() => {
            document.getElementById('productName').focus();
        }, 300);
    },

    /**
     * Cleanup on modal close
     */
    cleanup() {
        this.stopScanning();
    }
};
