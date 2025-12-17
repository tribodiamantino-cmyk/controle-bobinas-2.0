// INICIALIZAÇÃO MOBILE - FORÇAR TEMA CLARO E DEBUG
(function() {
    'use strict';
    
    console.log('🚀 Init: Iniciando configuração mobile...');
    
    // ============ FORÇAR TEMA CLARO ============
    function forcarTemaClaro() {
        console.log('🎨 Init: Forçando tema claro...');
        
        // 1. Atributo HTML
        document.documentElement.setAttribute('data-bs-theme', 'light');
        document.documentElement.style.colorScheme = 'light only';
        
        // 2. Meta tag
        let metaColorScheme = document.querySelector('meta[name="color-scheme"]');
        if (!metaColorScheme) {
            metaColorScheme = document.createElement('meta');
            metaColorScheme.name = 'color-scheme';
            document.head.appendChild(metaColorScheme);
        }
        metaColorScheme.content = 'light only';
        
        // 3. Body style forçado
        document.body.style.backgroundColor = '#f5f6fa';
        document.body.style.color = '#2c3e50';
        document.body.classList.remove('dark', 'dark-theme', 'dark-mode');
        document.body.classList.add('light', 'light-theme');
        
        // 4. Remover preferência de tema escuro do Bootstrap
        document.querySelectorAll('[data-bs-theme="dark"]').forEach(el => {
            el.setAttribute('data-bs-theme', 'light');
        });
        
        console.log('✅ Init: Tema claro aplicado');
    }
    
    // Aplicar tema imediatamente
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forcarTemaClaro);
    } else {
        forcarTemaClaro();
    }
    
    // Também aplicar após load completo
    window.addEventListener('load', forcarTemaClaro);
    
    // ============ DEBUG CAPACITOR ============
    window.addEventListener('load', function() {
        console.log('📱 ========== DEBUG CAPACITOR ==========');
        
        if (typeof Capacitor === 'undefined') {
            console.warn('📱 Capacitor NÃO está definido - rodando no navegador');
            console.warn('📱 O scanner só funciona no APK instalado no dispositivo');
            return;
        }
        
        console.log('📱 Capacitor:', Capacitor);
        console.log('📱 Plataforma:', Capacitor.getPlatform());
        console.log('📱 É nativo?', Capacitor.isNativePlatform());
        
        const plugins = Capacitor.Plugins || {};
        console.log('📱 Plugins registrados:', Object.keys(plugins));
        
        // Verificar BarcodeScanner especificamente
        if (plugins.BarcodeScanner) {
            console.log('✅ BarcodeScanner encontrado!');
            console.log('📱 BarcodeScanner métodos:', Object.keys(plugins.BarcodeScanner));
        } else {
            console.error('❌ BarcodeScanner NÃO encontrado nos plugins!');
            console.log('📱 Isso pode indicar que o plugin não foi sincronizado corretamente.');
            console.log('📱 Execute: npm run android:sync');
        }
        
        // Verificar Camera
        if (plugins.Camera) {
            console.log('✅ Camera encontrado!');
        } else {
            console.warn('⚠️ Camera não encontrado');
        }
        
        console.log('📱 ========================================');
        
        // ============ HANDLER BOTÃO VOLTAR ANDROID ============
        if (Capacitor.isNativePlatform()) {
            const { App } = Capacitor.Plugins;
            if (App) {
                App.addListener('backButton', ({ canGoBack }) => {
                    console.log('📱 Botão voltar pressionado, canGoBack:', canGoBack);
                    
                    // Se tem histórico de navegação, volta
                    if (window.history.length > 1) {
                        window.history.back();
                    } else {
                        // Confirma se quer sair do app
                        if (confirm('Deseja sair do aplicativo?')) {
                            App.exitApp();
                        }
                    }
                });
                console.log('✅ Handler do botão voltar configurado');
            }
        }
    });
    
    // ============ PREVENIR ZOOM ============
    document.addEventListener('gesturestart', function(e) {
        e.preventDefault();
    });
    
    // ============ FEEDBACK DE TOQUE ============
    document.addEventListener('touchstart', function() {}, { passive: true });
    
})();

console.log('✅ Init.js carregado');
