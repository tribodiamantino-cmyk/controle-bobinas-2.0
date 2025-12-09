/**
 * Configuração de API para App Mobile
 * Define URL base conforme ambiente (app nativo ou web)
 */

(function() {
    // URL do servidor Railway (produção)
    const RAILWAY_API_URL = 'https://controle-bobinas-20-production.up.railway.app';
    
    // Detectar se está em app nativo (Capacitor)
    function isNativeApp() {
        return window.Capacitor && 
               window.Capacitor.isNativePlatform && 
               window.Capacitor.isNativePlatform();
    }
    
    // Definir URL base da API
    let apiBaseUrl;
    
    if (isNativeApp()) {
        // App Nativo → Sempre usar Railway (API remota)
        apiBaseUrl = RAILWAY_API_URL;
        console.log('🤖 App Nativo - API: ' + apiBaseUrl);
    } else {
        // Navegador Web → Usar caminho relativo (mesmo servidor)
        apiBaseUrl = '';
        console.log('🌐 Modo Web - API: caminho relativo');
    }
    
    // Exportar configuração globalmente
    window.API_CONFIG = {
        BASE_URL: apiBaseUrl,
        MOBILE_API: apiBaseUrl + '/api/mobile',
        FULL_API: apiBaseUrl + '/api',
        
        // Helper para construir URLs de API
        url: function(path) {
            // Remove / inicial se houver
            path = path.replace(/^\//, '');
            return this.BASE_URL + '/' + path;
        },
        
        // Helper para mobile API
        mobileUrl: function(path) {
            // Remove /api/mobile inicial se houver
            path = path.replace(/^\/api\/mobile\//, '');
            return this.MOBILE_API + '/' + path;
        }
    };
    
    console.log('✅ API Config inicializada:', window.API_CONFIG);
})();
