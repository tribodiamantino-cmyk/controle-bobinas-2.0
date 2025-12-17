// CAPACITOR PLUGINS - Registro manual para uso sem bundler
// Este arquivo deve ser carregado APÓS capacitor.js

(function() {
    'use strict';
    
    console.log('🔌 Capacitor Plugins: Iniciando registro...');
    
    // Verificar se Capacitor está disponível
    if (typeof Capacitor === 'undefined') {
        console.warn('🔌 Capacitor não disponível - rodando no navegador');
        return;
    }
    
    // Função helper para registrar plugin
    function registerPlugin(name) {
        if (Capacitor.Plugins && Capacitor.Plugins[name]) {
            console.log(`🔌 Plugin ${name} já registrado`);
            return Capacitor.Plugins[name];
        }
        
        // No Capacitor nativo, os plugins são registrados automaticamente
        // pela bridge Java/Kotlin. Precisamos apenas acessá-los.
        if (Capacitor.isNativePlatform()) {
            // Tentar acessar via Capacitor.Plugins (método padrão Capacitor 3+)
            if (Capacitor.Plugins && Capacitor.Plugins[name]) {
                return Capacitor.Plugins[name];
            }
            
            // Tentar registrar manualmente se não existir
            try {
                const plugin = Capacitor.registerPlugin ? 
                    Capacitor.registerPlugin(name) : 
                    null;
                if (plugin) {
                    console.log(`🔌 Plugin ${name} registrado via registerPlugin`);
                    return plugin;
                }
            } catch (e) {
                console.warn(`🔌 Erro ao registrar ${name}:`, e);
            }
        }
        
        console.warn(`🔌 Plugin ${name} não encontrado`);
        return null;
    }
    
    // Aguardar Capacitor estar pronto
    function initPlugins() {
        console.log('🔌 Verificando plugins nativos...');
        console.log('🔌 Plataforma:', Capacitor.getPlatform());
        console.log('🔌 É nativo:', Capacitor.isNativePlatform());
        
        if (!Capacitor.Plugins) {
            Capacitor.Plugins = {};
        }
        
        // Listar todos os plugins disponíveis
        const availablePlugins = Object.keys(Capacitor.Plugins);
        console.log('🔌 Plugins disponíveis:', availablePlugins);
        
        // Verificar BarcodeScanner
        if (Capacitor.Plugins.BarcodeScanner) {
            console.log('✅ BarcodeScanner está disponível!');
            console.log('🔌 Métodos:', Object.keys(Capacitor.Plugins.BarcodeScanner));
        } else {
            console.error('❌ BarcodeScanner NÃO está disponível');
            
            // Listar o que temos para debug
            console.log('🔌 DEBUG - Capacitor object:', Object.keys(Capacitor));
            if (Capacitor.Plugins) {
                console.log('🔌 DEBUG - Plugins object:', Capacitor.Plugins);
            }
        }
        
        // Verificar Camera
        if (Capacitor.Plugins.Camera) {
            console.log('✅ Camera está disponível!');
        } else {
            console.warn('⚠️ Camera não está disponível');
        }
    }
    
    // Inicializar quando o documento estiver pronto
    if (document.readyState === 'complete') {
        initPlugins();
    } else {
        window.addEventListener('load', initPlugins);
    }
    
    // Também expor globalmente para facilitar debug
    window.checkPlugins = function() {
        console.log('=== CHECK PLUGINS ===');
        console.log('Capacitor:', typeof Capacitor !== 'undefined');
        if (typeof Capacitor !== 'undefined') {
            console.log('Platform:', Capacitor.getPlatform());
            console.log('isNative:', Capacitor.isNativePlatform());
            console.log('Plugins:', Capacitor.Plugins);
            
            if (Capacitor.Plugins) {
                Object.keys(Capacitor.Plugins).forEach(name => {
                    console.log(`  - ${name}:`, typeof Capacitor.Plugins[name]);
                });
            }
        }
        console.log('=====================');
    };
    
})();

console.log('✅ capacitor-plugins.js carregado');
