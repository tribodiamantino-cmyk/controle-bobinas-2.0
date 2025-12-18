/**
 * Polling - Consulta a API periodicamente
 */

const axios = require('axios');
const config = require('../config.json');
const logger = require('./utils/logger');
const queue = require('./queue');

let intervalId = null;
let emExecucao = false;

const api = axios.create({
    baseURL: config.api.baseUrl,
    timeout: 10000
});

/**
 * Verifica conexão com a API
 */
async function verificarConexao() {
    try {
        const response = await api.get('/api/health');
        return response.data && response.status === 200;
    } catch (error) {
        logger.error('Erro ao verificar conexão:', error.message);
        return false;
    }
}

/**
 * Busca etiquetas pendentes
 */
async function buscarEtiquetasPendentes() {
    try {
        const response = await api.get('/api/impressao/pendentes', {
            params: { loja: config.api.loja }
        });
        
        if (response.data.success && response.data.data?.length > 0) {
            logger.info(`🏷️  ${response.data.data.length} etiqueta(s) pendente(s)`);
            return response.data.data;
        }
        return [];
    } catch (error) {
        // Endpoint pode não existir ainda, não é erro crítico
        if (error.response?.status !== 404) {
            logger.debug('Erro ao buscar etiquetas:', error.message);
        }
        return [];
    }
}

/**
 * Busca relatórios pendentes
 */
async function buscarRelatoriosPendentes() {
    try {
        const response = await api.get('/api/impressao/relatorios/pendentes', {
            params: { loja: config.api.loja }
        });
        
        if (response.data.success && response.data.data?.length > 0) {
            logger.info(`📄 ${response.data.data.length} relatório(s) pendente(s)`);
            return response.data.data;
        }
        return [];
    } catch (error) {
        // Endpoint pode não existir ainda, não é erro crítico
        if (error.response?.status !== 404) {
            logger.debug('Erro ao buscar relatórios:', error.message);
        }
        return [];
    }
}

/**
 * Busca dados de um carregamento para relatório
 */
async function buscarDadosCarregamento(carregamentoId) {
    try {
        const response = await api.get(`/api/carregamento/${carregamentoId}/relatorio`);
        
        if (response.data.success) {
            return response.data.data;
        }
        return null;
    } catch (error) {
        logger.error(`Erro ao buscar dados do carregamento ${carregamentoId}:`, error.message);
        return null;
    }
}

/**
 * Marca etiqueta como impressa
 */
async function marcarEtiquetaImpressa(id) {
    try {
        await api.post(`/api/impressao/${id}/marcar-impresso`);
        logger.debug(`Etiqueta ${id} marcada como impressa`);
        return true;
    } catch (error) {
        logger.error(`Erro ao marcar etiqueta ${id}:`, error.message);
        return false;
    }
}

/**
 * Marca relatório como impresso
 */
async function marcarRelatorioImpresso(id) {
    try {
        await api.post(`/api/impressao/relatorios/${id}/marcar-impresso`);
        logger.debug(`Relatório ${id} marcado como impresso`);
        return true;
    } catch (error) {
        logger.error(`Erro ao marcar relatório ${id}:`, error.message);
        return false;
    }
}

/**
 * Executa um ciclo de polling
 */
async function executarPolling() {
    if (emExecucao) {
        logger.debug('Polling anterior ainda em execução, pulando...');
        return;
    }
    
    emExecucao = true;
    
    try {
        // Buscar pendências em paralelo
        const [etiquetas, relatorios] = await Promise.all([
            buscarEtiquetasPendentes(),
            buscarRelatoriosPendentes()
        ]);
        
        // Adicionar à fila de etiquetas (prioridade alta)
        for (const etiqueta of etiquetas) {
            queue.adicionarEtiqueta(etiqueta);
        }
        
        // Adicionar à fila de relatórios
        for (const relatorio of relatorios) {
            // Buscar dados completos do carregamento
            if (relatorio.tipo === 'carregamento') {
                const dados = await buscarDadosCarregamento(relatorio.entidade_id);
                if (dados) {
                    queue.adicionarRelatorio({
                        ...relatorio,
                        dados
                    });
                }
            }
        }
        
    } catch (error) {
        logger.error('Erro no polling:', error.message);
    } finally {
        emExecucao = false;
    }
}

/**
 * Inicia o polling
 */
function iniciar() {
    if (intervalId) {
        logger.warn('Polling já está rodando');
        return;
    }
    
    logger.info(`🔄 Polling iniciado (intervalo: ${config.api.pollingInterval}ms)`);
    
    // Executar imediatamente na primeira vez
    executarPolling();
    
    // Agendar execuções periódicas
    intervalId = setInterval(executarPolling, config.api.pollingInterval);
}

/**
 * Para o polling
 */
function parar() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        logger.info('🛑 Polling parado');
    }
}

module.exports = {
    verificarConexao,
    buscarEtiquetasPendentes,
    buscarRelatoriosPendentes,
    buscarDadosCarregamento,
    marcarEtiquetaImpressa,
    marcarRelatorioImpresso,
    iniciar,
    parar
};
