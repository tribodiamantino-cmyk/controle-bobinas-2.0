/**
 * Impressora Térmica - Elgin L42 Pro Full
 * 
 * Gera comandos ZPL para impressão de etiquetas 60x30mm
 * Envia via USB utilizando a biblioteca 'escpos'
 */

const config = require('../../config.json');
const logger = require('../utils/logger');

// Tentar importar escpos (opcional - fallback para impressão via driver Windows)
let escpos = null;
let USB = null;

try {
    escpos = require('escpos');
    USB = require('escpos-usb');
    escpos.USB = USB;
} catch (e) {
    logger.warn('⚠️ Biblioteca escpos não disponível, usando impressão via driver Windows');
}

/**
 * Imprime etiqueta via USB direto (ESC/POS)
 * @param {Object} dados - Dados da etiqueta
 */
async function imprimirViaUSB(dados) {
    if (!escpos || !USB) {
        throw new Error('Biblioteca escpos não disponível');
    }
    
    const device = new USB(
        parseInt(config.impressoras.termica.vendorId),
        parseInt(config.impressoras.termica.productId)
    );
    
    const printer = new escpos.Printer(device);
    
    return new Promise((resolve, reject) => {
        device.open((err) => {
            if (err) {
                reject(new Error(`Erro ao abrir dispositivo USB: ${err.message}`));
                return;
            }
            
            try {
                // Configurar etiqueta 60x30mm
                printer
                    .font('a')
                    .align('ct')
                    .size(1, 1);
                
                // Linha 1: Código
                printer.text(dados.linha1);
                
                // Linha 2: Código de barras
                printer.barcode(dados.linha2_barcode, 'CODE128', {
                    width: 2,
                    height: 60,
                    position: 'OFF'
                });
                
                // Linhas 3 e 4 (se não for locação)
                if (dados.tipo !== 'locacao') {
                    printer.text(dados.linha3 || '');
                    printer.style('b');
                    printer.text(dados.linha4 || '');
                }
                
                printer.cut();
                printer.close();
                
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    });
}

/**
 * Gera comandos ZPL para etiqueta
 * @param {Object} dados - Dados da etiqueta
 * @returns {string} Comandos ZPL
 */
function gerarZPL(dados) {
    const isLocacao = dados.tipo === 'locacao';
    
    // Dimensões em dots (203 DPI: 1mm = 8 dots)
    // Etiqueta 60mm x 30mm = 480 x 240 dots
    const largura = 480;
    const altura = 240;
    
    let zpl = `
^XA
^MMT
^PW${largura}
^LL${altura}
^LS0

`;
    
    if (isLocacao) {
        // Layout para LOCAÇÃO (código grande + barcode grande)
        zpl += `
^FO40,20^A0N,45,45^FD${dados.linha1}^FS
^BY2,2,100
^FO40,80^BCN,100,N,N,N^FD${dados.linha2_barcode}^FS
`;
    } else {
        // Layout para BOB/RET/COR (4 linhas)
        zpl += `
^FO40,10^A0N,28,28^FD${dados.linha1}^FS
^BY1.6,2,70
^FO40,45^BCN,70,N,N,N^FD${dados.linha2_barcode}^FS
^FO40,130^A0N,22,22^FD${dados.linha3 || ''}^FS
^FO40,160^A0N,26,26^FB400,1,0,C^FD${dados.linha4 || ''}^FS
`;
    }
    
    zpl += `
^XZ
`;
    
    return zpl;
}

/**
 * Imprime via driver Windows (usando impressora configurada)
 * @param {Object} dados - Dados da etiqueta
 * @param {number} quantidade - Número de cópias
 */
async function imprimirViaWindows(dados, quantidade = 1) {
    const { exec } = require('child_process');
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    // Gerar ZPL
    const zpl = gerarZPL(dados);
    
    // Salvar em arquivo temporário
    const tempFile = path.join(os.tmpdir(), `etiqueta_${Date.now()}.zpl`);
    
    // Repetir ZPL para quantidade desejada
    let zplCompleto = '';
    for (let i = 0; i < quantidade; i++) {
        zplCompleto += zpl;
    }
    
    fs.writeFileSync(tempFile, zplCompleto);
    
    // Enviar para impressora via copy (Windows)
    const nomeImpressora = config.impressoras.termica.nome;
    
    return new Promise((resolve, reject) => {
        // Usa o comando copy para enviar raw data para a impressora
        const cmd = `copy /b "${tempFile}" "\\\\%COMPUTERNAME%\\${nomeImpressora}"`;
        
        exec(cmd, (error, stdout, stderr) => {
            // Limpar arquivo temporário
            try { fs.unlinkSync(tempFile); } catch (e) {}
            
            if (error) {
                // Tentar método alternativo via print
                const cmdAlt = `print /d:"${nomeImpressora}" "${tempFile}"`;
                exec(cmdAlt, (err2, stdout2, stderr2) => {
                    if (err2) {
                        reject(new Error(`Erro ao imprimir: ${err2.message}`));
                    } else {
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    });
}

/**
 * Imprime etiqueta (escolhe método automaticamente)
 * @param {Object} etiqueta - Objeto da etiqueta da fila
 */
async function imprimirEtiqueta(etiqueta) {
    const dados = etiqueta.dados_etiqueta || etiqueta;
    const quantidade = etiqueta.quantidade || 1;
    
    logger.debug(`Imprimindo ${quantidade}x etiqueta: ${dados.linha1}`);
    
    // Tentar USB direto primeiro
    if (escpos && USB && config.impressoras.termica.tipo === 'usb') {
        try {
            for (let i = 0; i < quantidade; i++) {
                await imprimirViaUSB(dados);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            return;
        } catch (e) {
            logger.warn(`USB falhou: ${e.message}, tentando via Windows...`);
        }
    }
    
    // Fallback: Impressão via Windows
    if (config.impressoras.termica.nome) {
        await imprimirViaWindows(dados, quantidade);
    } else {
        throw new Error('Impressora térmica não configurada');
    }
}

module.exports = {
    imprimirEtiqueta,
    gerarZPL
};
