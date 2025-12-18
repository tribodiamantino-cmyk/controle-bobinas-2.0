/**
 * Queue - Gerenciamento de filas de impressão
 */

const logger = require('./utils/logger');
const polling = require('./polling');

// Filas separadas por tipo
const filaEtiquetas = [];
const filaRelatorios = [];

// IDs já processados (evitar duplicatas)
const processados = {
    etiquetas: new Set(),
    relatorios: new Set()
};

// Estado do processamento
let processando = false;
let intervalId = null;

// Importar impressoras (lazy load para evitar problemas de inicialização)
let impressoraTermica = null;
let impressoraA4 = null;

async function carregarImpressoras() {
    if (!impressoraTermica) {
        impressoraTermica = require('./printers/thermal');
    }
    if (!impressoraA4) {
        impressoraA4 = require('./printers/pdf');
    }
}

/**
 * Adiciona etiqueta à fila (prioridade alta)
 */
function adicionarEtiqueta(etiqueta) {
    const id = etiqueta.id || etiqueta.codigo;
    
    // Evitar duplicatas
    if (processados.etiquetas.has(id)) {
        logger.debug(`Etiqueta ${id} já foi processada, ignorando`);
        return;
    }
    
    // Verificar se já está na fila
    if (filaEtiquetas.some(e => (e.id || e.codigo) === id)) {
        logger.debug(`Etiqueta ${id} já está na fila, ignorando`);
        return;
    }
    
    filaEtiquetas.push(etiqueta);
    logger.debug(`🏷️  Etiqueta ${id} adicionada à fila (total: ${filaEtiquetas.length})`);
}

/**
 * Adiciona relatório à fila
 */
function adicionarRelatorio(relatorio) {
    const id = relatorio.id;
    
    // Evitar duplicatas
    if (processados.relatorios.has(id)) {
        logger.debug(`Relatório ${id} já foi processado, ignorando`);
        return;
    }
    
    // Verificar se já está na fila
    if (filaRelatorios.some(r => r.id === id)) {
        logger.debug(`Relatório ${id} já está na fila, ignorando`);
        return;
    }
    
    filaRelatorios.push(relatorio);
    logger.debug(`📄 Relatório ${id} adicionado à fila (total: ${filaRelatorios.length})`);
}

/**
 * Processa um item da fila de etiquetas
 */
async function processarEtiqueta(etiqueta) {
    const id = etiqueta.id || etiqueta.codigo;
    
    try {
        logger.info(`🖨️  Imprimindo etiqueta ${id}...`);
        
        await carregarImpressoras();
        await impressoraTermica.imprimirEtiqueta(etiqueta);
        
        // Marcar como impressa na API
        if (etiqueta.id) {
            await polling.marcarEtiquetaImpressa(etiqueta.id);
        }
        
        // Adicionar aos processados
        processados.etiquetas.add(id);
        
        logger.info(`✅ Etiqueta ${id} impressa com sucesso`);
        return true;
        
    } catch (error) {
        logger.error(`❌ Erro ao imprimir etiqueta ${id}:`, error.message);
        return false;
    }
}

/**
 * Processa um item da fila de relatórios
 */
async function processarRelatorio(relatorio) {
    const id = relatorio.id;
    
    try {
        logger.info(`🖨️  Imprimindo relatório ${id} (${relatorio.tipo})...`);
        
        await carregarImpressoras();
        
        if (relatorio.tipo === 'carregamento') {
            await impressoraA4.imprimirRomaneio(relatorio.dados);
        }
        
        // Marcar como impresso na API
        await polling.marcarRelatorioImpresso(id);
        
        // Adicionar aos processados
        processados.relatorios.add(id);
        
        logger.info(`✅ Relatório ${id} impresso com sucesso`);
        return true;
        
    } catch (error) {
        logger.error(`❌ Erro ao imprimir relatório ${id}:`, error.message);
        return false;
    }
}

/**
 * Processa a fila (etiquetas têm prioridade)
 */
async function processar() {
    if (processando) return;
    
    processando = true;
    
    try {
        // Prioridade 1: Etiquetas
        while (filaEtiquetas.length > 0) {
            const etiqueta = filaEtiquetas.shift();
            await processarEtiqueta(etiqueta);
            
            // Pequeno delay entre impressões
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Prioridade 2: Relatórios
        while (filaRelatorios.length > 0) {
            const relatorio = filaRelatorios.shift();
            await processarRelatorio(relatorio);
            
            // Delay maior para relatórios (PDF pesado)
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
    } finally {
        processando = false;
    }
}

/**
 * Inicia o processamento da fila
 */
function iniciar() {
    if (intervalId) {
        logger.warn('Processamento de fila já está rodando');
        return;
    }
    
    logger.info('📋 Processamento de fila iniciado');
    
    // Verificar fila a cada 1 segundo
    intervalId = setInterval(processar, 1000);
}

/**
 * Para o processamento
 */
function parar() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        logger.info('🛑 Processamento de fila parado');
    }
}

/**
 * Retorna status das filas
 */
function status() {
    return {
        etiquetas: {
            pendentes: filaEtiquetas.length,
            processados: processados.etiquetas.size
        },
        relatorios: {
            pendentes: filaRelatorios.length,
            processados: processados.relatorios.size
        },
        processando
    };
}

module.exports = {
    adicionarEtiqueta,
    adicionarRelatorio,
    iniciar,
    parar,
    status
};
