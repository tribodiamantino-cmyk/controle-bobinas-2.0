// SCANNER MODULE - MLKit Barcode Scanning
// Plugin: @capacitor-mlkit/barcode-scanning

class Scanner {
    constructor(callback) {
        this.callback = callback;
        this.isScanning = false;
        this.plugin = null;
    }

    async estaDisponivel() {
        try {
            console.log('Scanner: Verificando disponibilidade...');
            
            // Verificar se Capacitor está disponível
            if (typeof Capacitor === 'undefined') {
                console.warn('Scanner: Capacitor não definido - rodando no navegador?');
                return false;
            }
            
            console.log('Scanner: Plataforma:', Capacitor.getPlatform());
            console.log('Scanner: É nativo?', Capacitor.isNativePlatform());
            console.log('Scanner: Plugins disponíveis:', Object.keys(Capacitor.Plugins || {}));
            
            // Tentar obter o plugin
            this.plugin = this.getPlugin();
            
            if (!this.plugin) {
                console.error('Scanner: Plugin BarcodeScanner NÃO encontrado!');
                console.error('Scanner: Verifique se o plugin foi instalado e sincronizado corretamente');
                return false;
            }
            
            console.log('Scanner: ✅ Plugin encontrado!');
            
            // Verificar se o método scan existe
            if (typeof this.plugin.scan !== 'function') {
                console.error('Scanner: Método scan() não disponível no plugin');
                return false;
            }
            
            console.log('Scanner: ✅ Método scan() disponível');
            return true;
            
        } catch (error) {
            console.error('Scanner: Erro ao verificar disponibilidade:', error);
            return false;
        }
    }

    getPlugin() {
        // Método 1: Acesso via Capacitor.Plugins (mais comum)
        if (typeof Capacitor !== 'undefined' && Capacitor.Plugins) {
            // O MLKit registra como 'BarcodeScanner'
            if (Capacitor.Plugins.BarcodeScanner) {
                console.log('Scanner: Plugin encontrado via Capacitor.Plugins.BarcodeScanner');
                return Capacitor.Plugins.BarcodeScanner;
            }
            
            // Algumas versões registram como 'BarcodeScannerPlugin'
            if (Capacitor.Plugins.BarcodeScannerPlugin) {
                console.log('Scanner: Plugin encontrado via Capacitor.Plugins.BarcodeScannerPlugin');
                return Capacitor.Plugins.BarcodeScannerPlugin;
            }
            
            // MLKit pode registrar como 'MLKitBarcodeScanner'
            if (Capacitor.Plugins.MLKitBarcodeScanner) {
                console.log('Scanner: Plugin encontrado via Capacitor.Plugins.MLKitBarcodeScanner');
                return Capacitor.Plugins.MLKitBarcodeScanner;
            }
        }
        
        // Método 2: Variável global (alguns plugins expõem assim)
        if (typeof BarcodeScanner !== 'undefined') {
            console.log('Scanner: Plugin encontrado via variável global BarcodeScanner');
            return BarcodeScanner;
        }
        
        // Método 3: capacitorBarcodeScanner (nome usado no bundle)
        if (typeof capacitorBarcodeScanner !== 'undefined' && capacitorBarcodeScanner.BarcodeScanner) {
            console.log('Scanner: Plugin encontrado via capacitorBarcodeScanner');
            return capacitorBarcodeScanner.BarcodeScanner;
        }
        
        console.error('Scanner: Nenhum método de acesso ao plugin funcionou');
        return null;
    }

    async solicitarPermissoes() {
        try {
            if (!this.plugin) {
                this.plugin = this.getPlugin();
                if (!this.plugin) return false;
            }

            console.log('Scanner: Verificando permissões de câmera...');
            
            // Verificar permissões atuais
            const status = await this.plugin.checkPermissions();
            console.log('Scanner: Status da permissão:', status);
            
            if (status.camera === 'granted') {
                console.log('Scanner: ✅ Permissão já concedida');
                return true;
            }
            
            // Solicitar permissão se necessário
            console.log('Scanner: Solicitando permissão...');
            const result = await this.plugin.requestPermissions();
            console.log('Scanner: Resultado da solicitação:', result);
            
            if (result.camera === 'granted') {
                console.log('Scanner: ✅ Permissão concedida');
                return true;
            }
            
            console.warn('Scanner: ⚠️ Permissão negada pelo usuário');
            return false;
            
        } catch (error) {
            console.error('Scanner: Erro ao solicitar permissões:', error);
            return false;
        }
    }

    async iniciar() {
        try {
            console.log('Scanner: ========== INICIANDO SCANNER ==========');
            
            // Verificar disponibilidade
            if (!await this.estaDisponivel()) {
                const msg = 'Scanner não disponível neste dispositivo. Use o campo de texto para digitar o código manualmente.';
                if (typeof Utils !== 'undefined' && Utils.mostrarAviso) {
                    Utils.mostrarAviso(msg);
                } else {
                    alert(msg);
                }
                return;
            }

            // Solicitar permissões
            if (!await this.solicitarPermissoes()) {
                const msg = 'Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do app.';
                if (typeof Utils !== 'undefined' && Utils.mostrarErro) {
                    Utils.mostrarErro(msg);
                } else {
                    alert(msg);
                }
                return;
            }

            this.isScanning = true;
            
            console.log('Scanner: Abrindo câmera para scan...');
            
            // Executar scan com opções
            const result = await this.plugin.scan({
                formats: ['QR_CODE', 'CODE_128', 'CODE_39', 'EAN_13', 'EAN_8']
            });

            console.log('Scanner: Resultado do scan:', result);
            
            // Processar resultado
            if (result && result.barcodes && result.barcodes.length > 0) {
                const codigo = result.barcodes[0].rawValue || result.barcodes[0].displayValue;
                console.log('Scanner: ✅ Código lido:', codigo);
                
                // Feedback visual/sonoro (se disponível)
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate(100);
                }
                
                await this.processarCodigo(codigo);
            } else {
                console.log('Scanner: Nenhum código detectado');
            }
            
        } catch (error) {
            console.error('Scanner: Erro durante scan:', error);
            
            // Ignorar erro de cancelamento pelo usuário
            if (error.message && error.message.toLowerCase().includes('cancel')) {
                console.log('Scanner: Scan cancelado pelo usuário');
                return;
            }
            
            const msg = 'Erro ao escanear: ' + (error.message || 'Erro desconhecido');
            if (typeof Utils !== 'undefined' && Utils.mostrarErro) {
                Utils.mostrarErro(msg);
            } else {
                alert(msg);
            }
        } finally {
            this.isScanning = false;
            console.log('Scanner: ========== SCAN FINALIZADO ==========');
        }
    }

    async processarCodigo(codigo) {
        console.log('Scanner: Processando código:', codigo);
        if (this.callback && typeof this.callback === 'function') {
            await this.callback(codigo);
        }
    }

    parar() {
        this.isScanning = false;
        console.log('Scanner: Parado');
    }
}

// Exportar globalmente
window.Scanner = Scanner;

console.log('✅ Scanner module carregado');
