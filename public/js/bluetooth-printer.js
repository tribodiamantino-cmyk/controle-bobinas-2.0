/**
 * Módulo de Impressão Bluetooth ESC/POS
 * Plugin: cordova-plugin-bluetooth-serial
 * Compatível com: M58-LL (58mm) e outras impressoras ESC/POS
 */

class BluetoothPrinterManager {
    constructor() {
        this.isConnected = false;
        this.deviceAddress = null;
    }

    /**
     * Inicializar plugin (verifica se está disponível)
     */
    async init() {
        if (window.bluetoothSerial) {
            console.log('✅ Plugin Bluetooth Serial disponível');
            return true;
        } else {
            console.warn('⚠️ Plugin Bluetooth Serial não encontrado (modo web)');
            return false;
        }
    }

    /**
     * Verificar se Bluetooth está ativado
     */
    async isBluetoothEnabled() {
        return new Promise((resolve) => {
            if (!window.bluetoothSerial) {
                resolve(false);
                return;
            }
            
            window.bluetoothSerial.isEnabled(
                () => resolve(true),
                () => resolve(false)
            );
        });
    }

    /**
     * Listar dispositivos Bluetooth pareados
     */
    async listDevices() {
        return new Promise((resolve, reject) => {
            if (!window.bluetoothSerial) {
                reject(new Error('Plugin Bluetooth não disponível'));
                return;
            }

            window.bluetoothSerial.list(
                (devices) => {
                    console.log('📱 Dispositivos Bluetooth:', devices);
                    resolve(devices);
                },
                (error) => {
                    console.error('❌ Erro ao listar:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Conectar à impressora
     * @param {string} address - Endereço MAC (ex: 00:11:22:33:44:55)
     */
    async connect(address) {
        return new Promise((resolve, reject) => {
            if (!window.bluetoothSerial) {
                reject(new Error('Plugin Bluetooth não disponível'));
                return;
            }

            // Timeout de 15 segundos para conexão
            const timeout = setTimeout(() => {
                this.isConnected = false;
                this.deviceAddress = null;
                reject(new Error('Timeout ao conectar (15s)'));
            }, 15000);

            window.bluetoothSerial.connect(
                address,
                () => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    this.deviceAddress = address;
                    console.log('✅ Conectado:', address);
                    resolve(true);
                },
                (error) => {
                    clearTimeout(timeout);
                    this.isConnected = false;
                    this.deviceAddress = null;
                    console.error('❌ Falha ao conectar:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Desconectar da impressora
     */
    async disconnect() {
        if (!this.isConnected) return;

        return new Promise((resolve, reject) => {
            window.bluetoothSerial.disconnect(
                () => {
                    this.isConnected = false;
                    this.deviceAddress = null;
                    console.log('✅ Desconectado');
                    resolve(true);
                },
                (error) => {
                    console.error('❌ Erro ao desconectar:', error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Enviar dados para impressora
     * @param {Uint8Array} data - Bytes para enviar
     */
    async write(data) {
        if (!this.isConnected) {
            throw new Error('Impressora não conectada');
        }

        return new Promise((resolve, reject) => {
            window.bluetoothSerial.write(
                data,
                () => resolve(true),
                async (error) => {
                    // Se perder conexão, tentar reconectar UMA vez
                    if (error.includes && error.includes('connection was lost') && this.deviceAddress) {
                        console.warn('⚠️ Conexão perdida, tentando reconectar...');
                        this.isConnected = false;
                        
                        try {
                            await this.connect(this.deviceAddress);
                            console.log('✅ Reconectado! Reenviando dados...');
                            // Tentar enviar novamente APENAS uma vez
                            window.bluetoothSerial.write(
                                data,
                                () => resolve(true),
                                (err2) => reject(err2)
                            );
                        } catch (reconnectError) {
                            reject(new Error('Falha ao reconectar: ' + reconnectError));
                        }
                    } else {
                        reject(error);
                    }
                }
            );
        });
    }

    // ========== COMANDOS ESC/POS ==========

    ESC_POS = {
        INIT: '\x1B\x40',                    // Reset impressora
        ALIGN_LEFT: '\x1B\x61\x00',         // Alinhar esquerda
        ALIGN_CENTER: '\x1B\x61\x01',       // Alinhar centro
        ALIGN_RIGHT: '\x1B\x61\x02',        // Alinhar direita
        BOLD_ON: '\x1B\x45\x01',            // Negrito ON
        BOLD_OFF: '\x1B\x45\x00',           // Negrito OFF
        FONT_SIZE_2X: '\x1D\x21\x11',       // Tamanho 2x
        FONT_SIZE_3X: '\x1D\x21\x22',       // Tamanho 3x
        FONT_SIZE_NORMAL: '\x1D\x21\x00',   // Tamanho normal
        LINE_FEED: '\n',                     // Nova linha
        CUT_PAPER: '\x1D\x56\x00',          // Cortar papel
    };

    /**
     * Converter string para bytes
     */
    stringToBytes(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }

    /**
     * Enviar comando ESC/POS
     */
    async sendCommand(command) {
        const bytes = this.stringToBytes(command);
        await this.write(bytes);
    }

    /**
     * Imprimir QR Code - Versão Simplificada para M58-LL
     */
    async printQRCode(data, size = 8) { // Tamanho MÁXIMO permitido (3-8)
        console.log('🔧 Imprimindo QR Code:', data);
        
        try {
            // Comandos ESC/POS padrão para QR Code
            const dataLength = data.length;
            const pL = (dataLength + 3) % 256;
            const pH = Math.floor((dataLength + 3) / 256);
            
            // Centralizar ANTES do QR Code
            let cmd = this.ESC_POS.ALIGN_CENTER;
            
            // Adicionar espaço acima
            cmd += this.ESC_POS.LINE_FEED;
            
            // Modelo 2 (mais compatível)
            cmd += '\x1D\x28\x6B\x04\x00\x31\x41\x32\x00';
            
            // Tamanho do módulo MÁXIMO (8 = maior tamanho suportado)
            cmd += '\x1D\x28\x6B\x03\x00\x31\x43' + String.fromCharCode(size);
            
            // Nível de correção de erro (48=L, 49=M, 50=Q, 51=H)
            cmd += '\x1D\x28\x6B\x03\x00\x31\x45\x31'; // M level
            
            // Armazenar dados
            cmd += '\x1D\x28\x6B' + String.fromCharCode(pL, pH) + '\x31\x50\x30' + data;
            
            // Imprimir
            cmd += '\x1D\x28\x6B\x03\x00\x31\x51\x30';
            
            // Espaço abaixo
            cmd += this.ESC_POS.LINE_FEED;
            
            console.log('✅ Enviando comando QR Code...');
            await this.sendCommand(cmd);
            console.log('✅ QR Code enviado!');
            
        } catch (error) {
            console.error('❌ Erro ao imprimir QR Code:', error);
            // Não falhar - continua sem QR Code
        }
    }

    /**
     * Imprimir texto
     */
    async printText(text, align = 'center', bold = false, size = 'normal') {
        let commands = '';

        // Alinhamento
        if (align === 'center') commands += this.ESC_POS.ALIGN_CENTER;
        else if (align === 'left') commands += this.ESC_POS.ALIGN_LEFT;
        else if (align === 'right') commands += this.ESC_POS.ALIGN_RIGHT;

        // Negrito
        if (bold) commands += this.ESC_POS.BOLD_ON;

        // Tamanho
        if (size === '2x') commands += this.ESC_POS.FONT_SIZE_2X;
        else if (size === '3x') commands += this.ESC_POS.FONT_SIZE_3X;
        else commands += this.ESC_POS.FONT_SIZE_NORMAL;

        // Texto + quebra de linha
        commands += text + this.ESC_POS.LINE_FEED;

        // Reset formatação
        if (bold) commands += this.ESC_POS.BOLD_OFF;
        commands += this.ESC_POS.FONT_SIZE_NORMAL;

        await this.sendCommand(commands);
    }

    /**
     * Imprimir etiqueta de bobina
     */
    async imprimirBobina(dados) {
        try {
            // Reset impressora
            await this.sendCommand(this.ESC_POS.INIT);

            // QR Code
            await this.printQRCode(dados.codigo, 5);
            await this.sendCommand(this.ESC_POS.LINE_FEED);

            // Código
            await this.printText(dados.codigo, 'center', true, '2x');

            // Produto
            await this.printText(dados.produto, 'center', false, 'normal');

            // Metragem
            await this.printText(`${dados.metragem}m`, 'center', true, '2x');

            // PLACA (se existir)
            if (dados.placa) {
                await this.printText('--- PLACA ---', 'center', false, 'normal');
                await this.printText(dados.placa, 'center', true, 'normal');
            }

            // Detalhes
            await this.printText(dados.detalhes, 'center', false, 'normal');

            // Espaço e corte
            await this.sendCommand(this.ESC_POS.LINE_FEED + this.ESC_POS.LINE_FEED);
            await this.sendCommand(this.ESC_POS.CUT_PAPER);

            console.log('✅ Etiqueta de bobina impressa');
            return true;
        } catch (error) {
            console.error('❌ Erro ao imprimir bobina:', error);
            throw error;
        }
    }

    /**
     * Imprimir etiqueta de retalho
     */
    async imprimirRetalho(dados) {
        try {
            await this.sendCommand(this.ESC_POS.INIT);
            await this.printQRCode(dados.codigo, 5);
            await this.sendCommand(this.ESC_POS.LINE_FEED);
            await this.printText(dados.codigo, 'center', true, '2x');
            await this.printText(dados.produto, 'center', false, 'normal');
            await this.printText(`${dados.metragem}m`, 'center', true, '2x');
            await this.printText(dados.detalhes, 'center', false, 'normal');
            await this.sendCommand(this.ESC_POS.LINE_FEED + this.ESC_POS.LINE_FEED);
            await this.sendCommand(this.ESC_POS.CUT_PAPER);

            console.log('✅ Etiqueta de retalho impressa');
            return true;
        } catch (error) {
            console.error('❌ Erro ao imprimir retalho:', error);
            throw error;
        }
    }

    /**
     * Imprimir etiqueta de corte
     */
    async imprimirCorte(dados) {
        try {
            await this.sendCommand(this.ESC_POS.INIT);
            await this.printQRCode(dados.codigo, 5);
            await this.sendCommand(this.ESC_POS.LINE_FEED);
            await this.printText(dados.codigo, 'center', true, '2x');
            await this.printText(`Plano: ${dados.plano}`, 'center', false, 'normal');
            await this.printText(dados.item, 'center', false, 'normal');
            await this.printText(`${dados.metragem}m`, 'center', true, '2x');
            await this.printText(`Op: ${dados.operador}`, 'center', false, 'normal');
            await this.printText(dados.data, 'center', false, 'normal');
            await this.sendCommand(this.ESC_POS.LINE_FEED + this.ESC_POS.LINE_FEED);
            await this.sendCommand(this.ESC_POS.CUT_PAPER);

            console.log('✅ Etiqueta de corte impressa');
            return true;
        } catch (error) {
            console.error('❌ Erro ao imprimir corte:', error);
            throw error;
        }
    }

    /**
     * Imprimir etiqueta de localização
     */
    async imprimirLocalizacao(dados) {
        try {
            // Reset impressora
            await this.sendCommand(this.ESC_POS.INIT);

            // QR Code
            await this.printQRCode(dados.codigo, 5);
            await this.sendCommand(this.ESC_POS.LINE_FEED);

            // Código
            await this.printText(dados.codigo, 'center', true, '2x');

            // Localização
            await this.printText(`Corredor: ${dados.corredor}`, 'center', false, 'normal');
            await this.printText(`Coluna: ${dados.coluna}`, 'center', false, 'normal');
            await this.printText(`Altura: ${dados.altura}`, 'center', false, 'normal');

            // Espaço e corte
            await this.sendCommand(this.ESC_POS.LINE_FEED + this.ESC_POS.LINE_FEED);
            await this.sendCommand(this.ESC_POS.CUT_PAPER);

            console.log('✅ Etiqueta de localização impressa');
            return true;
        } catch (error) {
            console.error('❌ Erro ao imprimir localização:', error);
            throw error;
        }
    }

    /**
     * Teste de impressão
     */
    async imprimirTeste() {
        try {
            await this.sendCommand(this.ESC_POS.INIT);
            await this.printText('TESTE DE IMPRESSAO', 'center', true, '2x');
            await this.sendCommand(this.ESC_POS.LINE_FEED);
            await this.printText('Controle Bobinas 2.0', 'center', false, 'normal');
            await this.printText('Impressora M58-LL', 'center', false, 'normal');
            await this.sendCommand(this.ESC_POS.LINE_FEED);
            await this.printQRCode('TEST-12345', 5);
            await this.sendCommand(this.ESC_POS.LINE_FEED + this.ESC_POS.LINE_FEED);
            await this.sendCommand(this.ESC_POS.CUT_PAPER);

            console.log('✅ Teste de impressão concluído');
            return true;
        } catch (error) {
            console.error('❌ Erro no teste:', error);
            throw error;
        }
    }
}

// Exportar instância única (singleton) - Disponível globalmente
window.bluetoothPrinter = new BluetoothPrinterManager();
