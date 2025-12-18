/**
 * Servidor de Impressão Local
 * Controle de Bobinas 2.0
 * 
 * Este servidor roda no PC com as impressoras e:
 * 1. Consulta a API do Railway a cada 5 segundos
 * 2. Busca etiquetas e relatórios pendentes
 * 3. Imprime automaticamente
 * 4. Marca como impresso na API
 */

const fs = require('fs');
const path = require('path');

// Detectar se está rodando como executável (pkg)
const isPackaged = typeof process.pkg !== 'undefined';
const baseDir = isPackaged ? path.dirname(process.execPath) : __dirname.replace(/[\\\/]src$/, '');

// Carregar configuração
let config;
const configPath = path.join(baseDir, 'config.json');
try {
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    } else {
        console.error('❌ ERRO: config.json não encontrado em:', configPath);
        console.log('\nCrie o arquivo config.json com as configurações das impressoras.');
        process.exit(1);
    }
} catch (e) {
    console.error('❌ ERRO ao ler config.json:', e.message);
    process.exit(1);
}

// Exportar config e baseDir para outros módulos
global.CONFIG = config;
global.BASE_DIR = baseDir;

const logger = require('./utils/logger');
const polling = require('./polling');
const queue = require('./queue');

// Banner de inicialização
console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           🖨️  SERVIDOR DE IMPRESSÃO LOCAL                    ║
║              Controle de Bobinas 2.0                         ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  API: ${config.api.baseUrl.padEnd(50)}  ║
║  Loja: ${config.api.loja.padEnd(49)}  ║
║  Polling: ${(config.api.pollingInterval / 1000 + 's').padEnd(46)}  ║
╚══════════════════════════════════════════════════════════════╝
`);

// Inicialização
async function iniciar() {
    try {
        logger.info('🚀 Iniciando servidor de impressão...');
        
        // Verificar conexão com API
        const apiOk = await polling.verificarConexao();
        if (!apiOk) {
            logger.error('❌ Não foi possível conectar à API. Verifique a configuração.');
            process.exit(1);
        }
        logger.info('✅ Conexão com API estabelecida');
        
        // Verificar impressoras
        await verificarImpressoras();
        
        // Iniciar processamento da fila
        queue.iniciar();
        
        // Iniciar polling
        polling.iniciar();
        
        logger.info('✅ Servidor de impressão iniciado com sucesso!');
        logger.info('📋 Aguardando trabalhos de impressão...');
        
    } catch (error) {
        logger.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

async function verificarImpressoras() {
    const { termica, a4 } = config.impressoras;
    
    // Verificar impressora térmica
    if (termica.nome) {
        logger.info(`🏷️  Impressora térmica: ${termica.nome} (${termica.tipo})`);
    } else {
        logger.warn('⚠️  Impressora térmica não configurada');
    }
    
    // Verificar impressora A4
    if (a4.nome) {
        logger.info(`📄 Impressora A4: ${a4.nome} (${a4.copias} cópias)`);
    } else {
        logger.info('📄 Impressora A4: usando padrão do sistema');
    }
}

// Tratamento de sinais
process.on('SIGINT', () => {
    logger.info('🛑 Encerrando servidor de impressão...');
    polling.parar();
    queue.parar();
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('🛑 Encerrando servidor de impressão...');
    polling.parar();
    queue.parar();
    process.exit(0);
});

// Iniciar
iniciar();
