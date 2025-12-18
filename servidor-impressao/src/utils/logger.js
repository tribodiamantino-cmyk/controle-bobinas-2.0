/**
 * Logger - Utilitário de logs
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config.json');

const NIVEIS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

const CORES = {
    debug: '\x1b[36m',   // Cyan
    info: '\x1b[32m',    // Verde
    warn: '\x1b[33m',    // Amarelo
    error: '\x1b[31m',   // Vermelho
    reset: '\x1b[0m'
};

const nivelAtual = NIVEIS[config.logs?.nivel || 'info'];
const logDir = path.join(__dirname, '../../logs');

// Criar pasta de logs se não existir
if (config.logs?.arquivo && !fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

function formatarData() {
    const agora = new Date();
    return agora.toLocaleString('pt-BR');
}

function formatarDataArquivo() {
    const agora = new Date();
    return agora.toISOString().split('T')[0];
}

function log(nivel, ...args) {
    if (NIVEIS[nivel] < nivelAtual) return;
    
    const timestamp = formatarData();
    const cor = CORES[nivel];
    const reset = CORES.reset;
    const prefixo = `[${timestamp}] [${nivel.toUpperCase()}]`;
    
    // Console com cores
    console.log(`${cor}${prefixo}${reset}`, ...args);
    
    // Arquivo de log
    if (config.logs?.arquivo) {
        const mensagem = `${prefixo} ${args.map(a => 
            typeof a === 'object' ? JSON.stringify(a) : a
        ).join(' ')}\n`;
        
        const arquivoLog = path.join(logDir, `${formatarDataArquivo()}.log`);
        fs.appendFileSync(arquivoLog, mensagem);
    }
}

module.exports = {
    debug: (...args) => log('debug', ...args),
    info: (...args) => log('info', ...args),
    warn: (...args) => log('warn', ...args),
    error: (...args) => log('error', ...args)
};
