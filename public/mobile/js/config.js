/**
 * MOBILE V2.0 - CONFIGURAÇÕES
 * 
 * Configurações globais do aplicativo mobile
 */

const CONFIG = {
    // URL base da API
    API_BASE_URL: 'https://controle-bobinas-20-production.up.railway.app/api',
    
    // Versão do app
    APP_VERSION: '2.0.0',
    
    // Configurações do scanner
    SCANNER: {
        formats: ['CODE_128'], // Apenas Code 128
        enableBeep: true,
        enableVibrate: true,
        vibrateDuration: 200
    },
    
    // Configurações da câmera
    CAMERA: {
        quality: 85,
        width: 1280,
        height: 720,
        allowEditing: false
    },
    
    // Timeouts
    TIMEOUTS: {
        request: 30000, // 30 segundos
        scanner: 60000  // 1 minuto
    },
    
    // Cache
    CACHE: {
        enabled: true,
        duration: 300000 // 5 minutos
    },
    
    // Debug mode
    DEBUG: false
};

// Função para debug
function debugLog(...args) {
    if (CONFIG.DEBUG) {
        console.log('[DEBUG]', ...args);
    }
}

// Exportar configurações
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
