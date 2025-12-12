/**
 * MOBILE V2.0 - SCANNER MODULE
 * 
 * Módulo de scanner de código de barras usando ML Kit
 * Suporta Code 128
 */

class Scanner {
    constructor(callback) {
        this.callback = callback;
        this.isScanning = false;
        this.permissaoSolicitada = false;
    }

    /**
     * Verifica se o scanner está disponível
     */
    async estaDisponivel() {
        try {
            // Verifica se o plugin Capacitor está disponível
            if (typeof BarcodeScanner === 'undefined') {
                console.warn('Plugin BarcodeScanner não encontrado');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Erro ao verificar scanner:', error);
            return false;
        }
    }

    /**
     * Solicita permissões de câmera
     */
    async solicitarPermissoes() {
        try {
            if (this.permissaoSolicitada) return true;

            debugLog('Solicitando permissões de câmera...');
            
            const { BarcodeScanner } = window;
            const status = await BarcodeScanner.checkPermission({ force: true });

            this.permissaoSolicitada = true;

            if (status.granted) {
                debugLog('Permissões concedidas');
                return true;
            } else {
                Utils.mostrarErro('Permissão de câmera negada. Por favor, habilite nas configurações.');
                return false;
            }
        } catch (error) {
            console.error('Erro ao solicitar permissões:', error);
            Utils.mostrarErro('Erro ao acessar câmera: ' + error.message);
            return false;
        }
    }

    /**
     * Inicia o scanner
     */
    async iniciar() {
        try {
            // Verifica disponibilidade
            if (!await this.estaDisponivel()) {
                Utils.mostrarErro('Scanner não disponível neste dispositivo');
                return;
            }

            // Solicita permissões
            if (!await this.solicitarPermissoes()) {
                return;
            }

            // Prepara scanner
            debugLog('Preparando scanner...');
            this.isScanning = true;

            const { BarcodeScanner } = window;
            
            // Configura e inicia
            await BarcodeScanner.prepare();
            
            // Esconde body para mostrar câmera
            document.body.classList.add('scanner-active');
            document.querySelector('.scanner-view')?.classList.add('active');

            // Inicia scan
            const result = await BarcodeScanner.startScan({
                targetedFormats: ['CODE_128']
            });

            // Processa resultado
            if (result.hasContent) {
                debugLog('Código escaneado:', result.content);
                await this.processarCodigo(result.content);
            }

        } catch (error) {
            console.error('Erro no scanner:', error);
            
            if (error.message !== 'Scan cancelled') {
                Utils.mostrarErro('Erro ao escanear: ' + error.message);
            }
        } finally {
            await this.parar();
        }
    }

    /**
     * Para o scanner
     */
    async parar() {
        try {
            if (this.isScanning) {
                const { BarcodeScanner } = window;
                await BarcodeScanner.stopScan();
                
                document.body.classList.remove('scanner-active');
                document.querySelector('.scanner-view')?.classList.remove('active');
                
                this.isScanning = false;
                debugLog('Scanner parado');
            }
        } catch (error) {
            console.error('Erro ao parar scanner:', error);
        }
    }

    /**
     * Processa código escaneado
     */
    async processarCodigo(codigo) {
        try {
            // Valida formato
            if (!Utils.validarCodigoBarras(codigo)) {
                Utils.feedbackErro();
                Utils.mostrarErro('Código inválido: ' + codigo);
                return;
            }

            // Feedback de sucesso
            Utils.feedbackSucesso();

            // Chama callback
            if (this.callback) {
                await this.callback(codigo);
            }

        } catch (error) {
            console.error('Erro ao processar código:', error);
            Utils.mostrarErro('Erro ao processar código');
        }
    }

    /**
     * Alterna flash (lanterna)
     */
    async toggleFlash() {
        try {
            const { BarcodeScanner } = window;
            await BarcodeScanner.toggleTorch();
            debugLog('Flash alternado');
        } catch (error) {
            console.error('Erro ao alternar flash:', error);
        }
    }
}

// Log de inicialização
debugLog('Scanner Module carregado com sucesso');
