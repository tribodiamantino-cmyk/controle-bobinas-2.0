// MOBILE V2.0 - SCANNER MODULE
// Plugin: @capacitor-mlkit/barcode-scanning

class Scanner {
    constructor(callback) {
        this.callback = callback;
        this.isScanning = false;
        this.permissaoSolicitada = false;
    }

    async estaDisponivel() {
        try {
            if (typeof Capacitor === 'undefined' || !Capacitor.isNativePlatform()) {
                console.warn('Scanner: Nao esta em ambiente nativo Capacitor');
                return false;
            }
            if (typeof Capacitor.Plugins.BarcodeScanning === 'undefined') {
                console.warn('Scanner: Plugin MLKit nao encontrado');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Scanner: Erro:', error);
            return false;
        }
    }

    getPlugin() {
        if (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.BarcodeScanning) {
            return Capacitor.Plugins.BarcodeScanning;
        }
        return null;
    }

    async solicitarPermissoes() {
        try {
            const plugin = this.getPlugin();
            if (!plugin) return false;

            const { camera } = await plugin.checkPermissions();
            if (camera === 'granted') {
                this.permissaoSolicitada = true;
                return true;
            }
            
            const result = await plugin.requestPermissions();
            if (result.camera === 'granted') {
                this.permissaoSolicitada = true;
                return true;
            }
            
            Utils.mostrarErro('Permissao de camera negada');
            return false;
        } catch (error) {
            console.error('Scanner: Erro permissoes:', error);
            return false;
        }
    }

    async verificarGooglePlayServices() {
        try {
            const plugin = this.getPlugin();
            if (!plugin || !plugin.isGoogleBarcodeScannerModuleAvailable) return true;
            
            const { available } = await plugin.isGoogleBarcodeScannerModuleAvailable();
            if (!available) {
                await plugin.installGoogleBarcodeScannerModule();
            }
            return true;
        } catch (error) {
            return true;
        }
    }

    async iniciar() {
        try {
            if (!await this.estaDisponivel()) {
                Utils.mostrarAviso('Scanner nao disponivel. Digite o codigo manualmente.');
                return;
            }

            if (!await this.solicitarPermissoes()) return;
            await this.verificarGooglePlayServices();

            console.log('Scanner: Iniciando...');
            this.isScanning = true;

            const plugin = this.getPlugin();
            const { barcodes } = await plugin.scan({
                formats: ['QR_CODE', 'CODE_128', 'CODE_39', 'EAN_13', 'EAN_8']
            });

            if (barcodes && barcodes.length > 0) {
                const codigo = barcodes[0].rawValue || barcodes[0].displayValue;
                console.log('Scanner: Codigo:', codigo);
                await this.processarCodigo(codigo);
            }
        } catch (error) {
            if (error.message && !error.message.includes('cancel')) {
                Utils.mostrarErro('Erro ao escanear');
            }
        } finally {
            this.isScanning = false;
        }
    }

    async parar() {
        try {
            if (this.isScanning) {
                const plugin = this.getPlugin();
                if (plugin && plugin.stopScan) await plugin.stopScan();
                this.isScanning = false;
            }
        } catch (error) {}
    }

    async processarCodigo(codigo) {
        try {
            if (!codigo) {
                Utils.mostrarErro('Codigo vazio');
                return;
            }
            codigo = codigo.trim().toUpperCase();

            if (typeof Utils.feedbackSucesso === 'function') {
                Utils.feedbackSucesso();
            }

            if (this.callback) {
                await this.callback(codigo);
            }
        } catch (error) {
            Utils.mostrarErro('Erro ao processar codigo');
        }
    }

    async toggleFlash() {
        try {
            const plugin = this.getPlugin();
            if (plugin && plugin.toggleTorch) await plugin.toggleTorch();
        } catch (error) {}
    }
}

console.log('Scanner Module v2.0 carregado');
