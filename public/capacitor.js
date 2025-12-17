// CAPACITOR BRIDGE - NÃO MODIFICAR
// Este arquivo é substituído automaticamente pelo Capacitor no build Android
// O stub abaixo só é usado quando rodando no navegador (desenvolvimento)

(function() {
    'use strict';
    
    // Se já existe um Capacitor (injetado pelo nativo), não sobrescrever!
    if (typeof window.Capacitor !== 'undefined' && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
        console.log('✅ Capacitor nativo detectado - usando bridge real');
        return;
    }
    
    // Verificar se o Capacitor foi injetado de outra forma
    if (typeof window.Capacitor !== 'undefined' && window.Capacitor.Plugins) {
        console.log('✅ Capacitor já existe com Plugins');
        return;
    }
    
    // Só criar stub se realmente não existir (navegador web)
    if (typeof window.Capacitor === 'undefined') {
        console.warn('⚠️ Capacitor não encontrado - criando stub para navegador');
        
        window.Capacitor = {
            getPlatform: function() { return 'web'; },
            isNativePlatform: function() { return false; },
            isPluginAvailable: function() { return false; },
            Plugins: {}
        };
    }
})();

