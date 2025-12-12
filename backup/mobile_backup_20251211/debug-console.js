/**
 * Console de Debug Visual - Componente Reutilizável
 * Uso: Incluir no HTML e chamar initDebugConsole()
 */

const debugLines = [];
const MAX_DEBUG_LINES = 150;

function addDebugLine(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const line = `[${timestamp}] ${message}`;
    
    debugLines.push({ line, type });
    if (debugLines.length > MAX_DEBUG_LINES) {
        debugLines.shift();
    }
    
    updateDebugConsole();
}

function updateDebugConsole() {
    const container = document.getElementById('debug-lines');
    if (!container) return;
    
    container.innerHTML = debugLines.map(({ line, type }) => 
        `<div class="debug-line debug-${type}">${line}</div>`
    ).join('');
    
    // Auto-scroll para última linha
    const debugConsole = document.getElementById('debug-console');
    if (debugConsole && debugConsole.classList.contains('visible')) {
        debugConsole.scrollTop = debugConsole.scrollHeight;
    }
}

function copiarLogs() {
    const texto = debugLines.map(({ line }) => line).join('\n');
    
    // Tentar copiar usando API moderna
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto)
            .then(() => {
                alert('✅ Logs copiados!\n\n' + debugLines.length + ' linhas copiadas para a área de transferência.\n\nAgora você pode colar e me enviar.');
            })
            .catch(err => {
                console.error('Erro ao copiar:', err);
                mostrarLogsEmAlert(texto);
            });
    } else {
        mostrarLogsEmAlert(texto);
    }
}

function mostrarLogsEmAlert(texto) {
    const textoLimitado = texto.split('\n').slice(-30).join('\n');
    alert('📋 LOGS (últimas 30 linhas):\n\n' + textoLimitado + '\n\n⚠️ Tire screenshot desta tela!');
}

function toggleDebugConsole() {
    const debugConsole = document.getElementById('debug-console');
    const mainContent = document.querySelector('.app-main');
    const btn = document.getElementById('toggle-debug');
    
    if (!debugConsole || !btn) return;
    
    debugConsole.classList.toggle('visible');
    if (mainContent) {
        mainContent.classList.toggle('debug-active');
    }
    
    if (debugConsole.classList.contains('visible')) {
        btn.textContent = '✖ Fechar Debug';
        debugConsole.scrollTop = debugConsole.scrollHeight;
    } else {
        btn.textContent = '🐛 Debug';
    }
}

function limparLogs() {
    debugLines.length = 0;
    updateDebugConsole();
    addDebugLine('🗑️ Logs limpos', 'info');
}

// Interceptar console.log/error/warn
function setupConsoleInterceptor() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = function(...args) {
        originalLog.apply(console, args);
        addDebugLine(args.join(' '), 'info');
    };
    
    console.error = function(...args) {
        originalError.apply(console, args);
        addDebugLine('❌ ' + args.join(' '), 'error');
    };
    
    console.warn = function(...args) {
        originalWarn.apply(console, args);
        addDebugLine('⚠️ ' + args.join(' '), 'warn');
    };
}

// Injetar HTML do console de debug
function injectDebugConsole() {
    const debugHTML = `
        <!-- BOTÃO TOGGLE DEBUG -->
        <button id="toggle-debug" onclick="toggleDebugConsole()">🐛 Debug</button>
        
        <!-- DEBUG CONSOLE VISUAL -->
        <div id="debug-console">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 2px solid #3b82f6;">
                <strong style="color: #60a5fa; font-size: 14px;">📋 Console de Debug</strong>
                <div>
                    <button onclick="copiarLogs()" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer; margin-right: 5px;">
                        📋 Copiar
                    </button>
                    <button onclick="limparLogs()" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer;">
                        🗑️ Limpar
                    </button>
                </div>
            </div>
            <div id="debug-lines"></div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', debugHTML);
}

// Injetar CSS do console de debug
function injectDebugCSS() {
    const style = document.createElement('style');
    style.textContent = `
        #debug-console {
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            max-height: 300px;
            overflow-y: auto;
            background: #1e293b;
            color: #e2e8f0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 15px;
            border-bottom: 3px solid #3b82f6;
            z-index: 9999;
            display: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        
        #debug-console.visible {
            display: block;
        }
        
        .debug-line {
            padding: 3px 0;
            border-bottom: 1px solid #334155;
            word-wrap: break-word;
            user-select: text;
        }
        
        .debug-error { color: #fca5a5; font-weight: bold; }
        .debug-warn { color: #fcd34d; }
        .debug-info { color: #93c5fd; }
        .debug-success { color: #86efac; }
        
        #toggle-debug {
            position: fixed;
            top: 70px;
            right: 15px;
            padding: 10px 16px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 20px;
            font-size: 13px;
            font-weight: bold;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        #toggle-debug:active {
            transform: scale(0.95);
            background: #2563eb;
        }
        
        .app-main.debug-active {
            margin-top: 320px;
        }
    `;
    document.head.appendChild(style);
}

// Inicializar console de debug
function initDebugConsole() {
    injectDebugCSS();
    injectDebugConsole();
    setupConsoleInterceptor();
    
    console.log('🐛 Console de debug inicializado');
    console.log('📱 Plataforma:', window.Capacitor ? 'Nativa (Android)' : 'Web');
}

// Auto-inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDebugConsole);
} else {
    initDebugConsole();
}
