/**
 * Impressora PDF/A4 - Relatórios
 * 
 * Gera PDFs usando Puppeteer e envia para impressora A4
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const logger = require('../utils/logger');

// Usar config global
const config = global.CONFIG;
const baseDir = global.BASE_DIR;

// Tentar importar pdf-to-printer
let printer = null;
try {
    printer = require('pdf-to-printer');
} catch (e) {
    logger.warn('⚠️ pdf-to-printer não disponível, usando método alternativo');
}

// Puppeteer será carregado sob demanda
let puppeteer = null;

/**
 * Busca o caminho do Chrome/Chromium instalado no sistema
 */
function encontrarChrome() {
    const possiblePaths = [
        // Chrome padrão Windows
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        // Chrome user-specific
        path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
        // Edge (Chromium)
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        // Brave
        path.join(os.homedir(), 'AppData', 'Local', 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
    ];
    
    for (const chromePath of possiblePaths) {
        if (fs.existsSync(chromePath)) {
            return chromePath;
        }
    }
    
    return null;
}

/**
 * Inicializa o Puppeteer
 */
async function inicializarPuppeteer() {
    if (puppeteer) return;
    
    try {
        puppeteer = require('puppeteer');
    } catch (e) {
        logger.error('❌ Puppeteer não disponível:', e.message);
        throw new Error('Puppeteer não instalado. Execute: npm install puppeteer');
    }
}

/**
 * Carrega e preenche template HTML
 * @param {string} templateName - Nome do template (sem extensão)
 * @param {Object} dados - Dados para substituir
 * @returns {string} HTML preenchido
 */
function preencherTemplate(templateName, dados) {
    // Tentar carregar template de diferentes locais
    const possiblePaths = [
        path.join(baseDir, 'templates', `${templateName}.html`),
        path.join(baseDir, 'src', 'templates', `${templateName}.html`),
        path.join(__dirname, '..', 'templates', `${templateName}.html`)
    ];
    
    let templatePath = null;
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            templatePath = p;
            break;
        }
    }
    
    if (!templatePath) {
        throw new Error(`Template ${templateName}.html não encontrado`);
    }
    
    let html = fs.readFileSync(templatePath, 'utf-8');
    
    // Substituir variáveis simples
    for (const [chave, valor] of Object.entries(dados)) {
        const placeholder = `{{${chave}}}`;
        html = html.replace(new RegExp(placeholder, 'g'), valor || '-');
    }
    
    return html;
}

/**
 * Gera linhas da tabela de cortes
 * @param {Array} cortes - Lista de cortes
 * @returns {string} HTML das linhas
 */
function gerarLinhasCortes(cortes) {
    return cortes.map((corte, index) => `
        <tr>
            <td class="col-seq">${index + 1}</td>
            <td class="col-codigo">${corte.codigo_corte || corte.codigo}</td>
            <td class="col-origem">${corte.codigo_origem || '-'}</td>
            <td class="col-obs">${corte.observacoes || '-'}</td>
            <td class="col-metragem">${(corte.metragem_cortada || corte.metragem || 0).toFixed(2)}m</td>
            <td class="col-ok"><span class="checkbox"></span></td>
        </tr>
    `).join('');
}

/**
 * Formata data para exibição
 * @param {Date|string} data 
 * @returns {string}
 */
function formatarData(data) {
    if (!data) return '-';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora para exibição
 * @param {Date|string} data 
 * @returns {string}
 */
function formatarDataHora(data) {
    if (!data) return '-';
    const d = new Date(data);
    return d.toLocaleString('pt-BR');
}

/**
 * Gera PDF do romaneio de carregamento
 * @param {Object} dados - Dados do carregamento
 * @param {string} via - 'MOTORISTA' ou 'ARQUIVO LOJA'
 * @returns {Promise<string>} Caminho do PDF gerado
 */
async function gerarPdfRomaneio(dados, via = 'MOTORISTA') {
    const { carregamento, plano, cortes, totais } = dados;
    
    // Determinar empresa/cidade
    const empresa = plano.loja === 'Cortinave' ? 'CORTINAVE' : 'BN';
    const cidadeEmpresa = plano.loja === 'Cortinave' ? 'Palotina/PR' : 'Cianorte/PR';
    
    // Preparar dados do template
    const templateData = {
        VIA: via,
        EMPRESA: empresa,
        CIDADE_EMPRESA: cidadeEmpresa,
        CODIGO_CARREGAMENTO: carregamento.codigo || `CAR-${carregamento.id}`,
        DATA_CARREGAMENTO: formatarData(carregamento.data_conclusao || carregamento.data_inicio),
        CODIGO_PDC: plano.codigo_plano || `PDC-${plano.id}`,
        CLIENTE: plano.cliente || '-',
        OBRA: plano.obra || '-',
        CIDADE_ENTREGA: plano.cidade || '-',
        COR: plano.cor || '-',
        MEDIDA: plano.medida || plano.largura || '-',
        BAINHA: plano.bainha || '-',
        GRAMATURA: plano.gramatura || '-',
        METRAGEM_SOLICITADA: (plano.metragem_total || 0).toFixed(2),
        OBSERVACOES_PDC: plano.observacoes || '-',
        CORTES_ROWS: gerarLinhasCortes(cortes || []),
        QTD_ITENS: totais?.quantidade_cortes || cortes?.length || 0,
        METRAGEM_TOTAL: (totais?.metragem_total || 0).toFixed(2),
        DATA_IMPRESSAO: formatarDataHora(new Date()),
        VERSAO: '2.6.0'
    };
    
    // Preencher template
    const html = preencherTemplate('romaneio', templateData);
    
    // Inicializar Puppeteer
    await inicializarPuppeteer();
    
    // Buscar Chrome instalado no sistema
    const chromePath = encontrarChrome();
    
    const launchOptions = {
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    };
    
    if (chromePath) {
        launchOptions.executablePath = chromePath;
        logger.debug(`Usando Chrome: ${chromePath}`);
    }
    
    // Gerar PDF com Puppeteer
    const browser = await puppeteer.launch(launchOptions);
    
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        
        // Nome do arquivo
        const timestamp = Date.now();
        const nomeArquivo = `romaneio_${carregamento.codigo || carregamento.id}_${via.replace(' ', '_')}_${timestamp}.pdf`;
        const caminhoArquivo = path.join(os.tmpdir(), nomeArquivo);
        
        // Gerar PDF
        await page.pdf({
            path: caminhoArquivo,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '12mm',
                right: '12mm',
                bottom: '12mm',
                left: '12mm'
            }
        });
        
        logger.debug(`PDF gerado: ${caminhoArquivo}`);
        return caminhoArquivo;
        
    } finally {
        await browser.close();
    }
}

/**
 * Imprime PDF na impressora A4
 * @param {string} caminhoArquivo - Caminho do PDF
 * @param {number} copias - Número de cópias
 */
async function imprimirPdf(caminhoArquivo, copias = 1) {
    const nomeImpressora = config.impressoras.a4.nome;
    
    // Método 1: pdf-to-printer (recomendado)
    if (printer) {
        const options = { copies: copias };
        
        if (nomeImpressora) {
            options.printer = nomeImpressora;
        }
        
        await printer.print(caminhoArquivo, options);
        logger.debug(`PDF impresso via pdf-to-printer (${copias} cópias)`);
        return;
    }
    
    // Método 2: Comando do Windows (fallback)
    const { exec } = require('child_process');
    
    return new Promise((resolve, reject) => {
        // Usar SumatraPDF se disponível (melhor para impressão silenciosa)
        // Ou Adobe Reader, ou impressão padrão do Windows
        
        let cmd;
        if (nomeImpressora) {
            // Imprimir em impressora específica
            cmd = `start /min "" "${caminhoArquivo}"`;
        } else {
            // Impressora padrão
            cmd = `start "" /min "${caminhoArquivo}"`;
        }
        
        // Para cada cópia
        for (let i = 0; i < copias; i++) {
            exec(cmd, (error) => {
                if (error && i === 0) {
                    reject(new Error(`Erro ao imprimir: ${error.message}`));
                }
            });
        }
        
        // Aguardar um pouco e resolver
        setTimeout(resolve, 2000);
    });
}

/**
 * Imprime romaneio de carregamento (2 vias)
 * @param {Object} dados - Dados do carregamento
 */
async function imprimirRomaneio(dados) {
    const copias = config.impressoras.a4.copias || 2;
    
    logger.info(`📄 Gerando romaneio de carregamento...`);
    
    // Gerar PDF para Via MOTORISTA
    const pdfMotorista = await gerarPdfRomaneio(dados, 'MOTORISTA');
    
    // Gerar PDF para Via ARQUIVO LOJA
    const pdfArquivo = await gerarPdfRomaneio(dados, 'ARQUIVO LOJA');
    
    // Imprimir ambas as vias
    logger.info(`🖨️ Imprimindo via MOTORISTA...`);
    await imprimirPdf(pdfMotorista, 1);
    
    logger.info(`🖨️ Imprimindo via ARQUIVO LOJA...`);
    await imprimirPdf(pdfArquivo, 1);
    
    // Limpar arquivos temporários
    setTimeout(() => {
        try {
            fs.unlinkSync(pdfMotorista);
            fs.unlinkSync(pdfArquivo);
        } catch (e) {
            // Ignorar erros de limpeza
        }
    }, 10000);
    
    logger.info(`✅ Romaneio impresso com sucesso (2 vias)`);
}

module.exports = {
    gerarPdfRomaneio,
    imprimirPdf,
    imprimirRomaneio
};
