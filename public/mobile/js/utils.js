/**
 * MOBILE V2.0 - UTILIDADES
 * 
 * Funções utilitárias compartilhadas entre todos os módulos
 */

const Utils = {
    /**
     * Formata metragem para exibição
     */
    formatarMetragem(metros) {
        if (!metros && metros !== 0) return '-';
        return `${parseFloat(metros).toFixed(2)}m`;
    },

    /**
     * Formata data para padrão brasileiro
     */
    formatarData(dataISO) {
        if (!dataISO) return '-';
        const data = new Date(dataISO);
        return data.toLocaleDateString('pt-BR');
    },

    /**
     * Formata data e hora para padrão brasileiro
     */
    formatarDataHora(dataISO) {
        if (!dataISO) return '-';
        const data = new Date(dataISO);
        return data.toLocaleString('pt-BR');
    },

    /**
     * Formata número com separador de milhares
     */
    formatarNumero(numero) {
        if (!numero && numero !== 0) return '-';
        return numero.toLocaleString('pt-BR');
    },

    /**
     * Mostra loading overlay
     */
    mostrarLoading(texto = 'Carregando...') {
        const existente = document.getElementById('loadingOverlay');
        if (existente) existente.remove();

        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${texto}</div>
        `;
        document.body.appendChild(overlay);
    },

    /**
     * Esconde loading overlay
     */
    esconderLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    },

    /**
     * Mostra toast de sucesso
     */
    mostrarSucesso(mensagem, duracao = 3000) {
        this.mostrarToast(mensagem, 'success', duracao);
    },

    /**
     * Mostra toast de erro
     */
    mostrarErro(mensagem, duracao = 5000) {
        this.mostrarToast(mensagem, 'danger', duracao);
    },

    /**
     * Mostra toast de aviso
     */
    mostrarAviso(mensagem, duracao = 4000) {
        this.mostrarToast(mensagem, 'warning', duracao);
    },

    /**
     * Mostra toast genérico
     */
    mostrarToast(mensagem, tipo = 'info', duracao = 3000) {
        const container = document.getElementById('toastContainer') || this.criarToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `alert alert-${tipo} alert-mobile shadow`;
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi bi-${this.getIconeToast(tipo)} me-2"></i>
                <div>${mensagem}</div>
            </div>
        `;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            setTimeout(() => toast.remove(), 300);
        }, duracao);
    },

    /**
     * Cria container de toasts
     */
    criarToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    },

    /**
     * Retorna ícone apropriado para o tipo de toast
     */
    getIconeToast(tipo) {
        const icones = {
            success: 'check-circle-fill',
            danger: 'exclamation-triangle-fill',
            warning: 'exclamation-circle-fill',
            info: 'info-circle-fill'
        };
        return icones[tipo] || 'info-circle-fill';
    },

    /**
     * Vibra o dispositivo
     */
    vibrar(duracao = 200) {
        if ('vibrate' in navigator) {
            navigator.vibrate(duracao);
        }
    },

    /**
     * Toca um beep (se disponível)
     */
    beep() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (err) {
            console.warn('Não foi possível tocar beep:', err);
        }
    },

    /**
     * Feedback de sucesso (vibra + beep)
     */
    feedbackSucesso() {
        this.vibrar(200);
        this.beep();
    },

    /**
     * Feedback de erro (vibração dupla)
     */
    feedbackErro() {
        this.vibrar([100, 50, 100]);
    },

    /**
     * Preenche um input com valor e dispara evento de Enter após delay
     * Usado pelo scanner para dar feedback visual antes de processar
     * @param {string} inputId - ID do elemento input
     * @param {string} valor - Valor a ser preenchido
     * @param {number} delay - Delay em ms antes de disparar Enter (default: 300)
     */
    preencherInputEDisparar(inputId, valor, delay = 300) {
        const input = document.getElementById(inputId);
        if (!input) {
            console.warn('Utils: Input não encontrado:', inputId);
            return false;
        }

        // Preenche o valor
        input.value = valor.toUpperCase();
        
        // Dispara evento de input para atualizar bindings
        input.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Foca no input para mostrar que algo aconteceu
        input.focus();
        
        // Após delay, dispara Enter
        setTimeout(() => {
            const enterEvent = new KeyboardEvent('keypress', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true
            });
            input.dispatchEvent(enterEvent);
            
            // Também tenta clicar no botão de busca se existir
            const btnBuscar = document.getElementById('btnBuscar');
            if (btnBuscar) {
                btnBuscar.click();
            }
        }, delay);
        
        return true;
    },

    /**
     * Valida formato de código de barras
     * Aceita formato completo (com zeros) ou compacto (sem zeros)
     */
    validarCodigoBarras(codigo) {
        if (!codigo) return false;
        
        const padroes = [
            /^BOB-[A-Z]{3}-\d{1,6}$/,         // BOB-PLA-1 até BOB-PLA-000001
            /^RET-[A-Z]{3}-\d{1,6}$/,         // RET-CIA-42 até RET-CIA-000042
            /^COR-[A-Z]{3}-\d{1,3}-\d{1,2}$/, // COR-PLA-1-1 até COR-PLA-001-01
            /^PDC-[A-Z]{3}-\d{1,3}$/,         // PDC-PLA-1 até PDC-PLA-015
            /^LOC-\d{1,4}-[A-Z]-\d{1,4}$/,    // LOC-1-A-1 até LOC-9999-Z-9999
            /^\d{1,4}-[A-Z]-\d{1,4}$/         // 1-A-1 até 9999-Z-9999 (sem prefixo)
        ];
        
        return padroes.some(padrao => padrao.test(codigo));
    },

    /**
     * Normaliza código compacto para formato completo (com zeros)
     * BOB-PLA-1 → BOB-PLA-000001
     * RET-CIA-42 → RET-CIA-000042
     * COR-PLA-1-1 → COR-PLA-001-01
     * LOC-1-A-1 → 0001-A-0001
     */
    normalizarCodigo(codigo) {
        if (!codigo) return codigo;
        
        // BOB-PLA-1 → BOB-PLA-000001
        if (/^BOB-[A-Z]{3}-\d+$/.test(codigo)) {
            const partes = codigo.split('-');
            const numero = partes[2].padStart(6, '0');
            return `${partes[0]}-${partes[1]}-${numero}`;
        }
        
        // RET-CIA-42 → RET-CIA-000042
        if (/^RET-[A-Z]{3}-\d+$/.test(codigo)) {
            const partes = codigo.split('-');
            const numero = partes[2].padStart(6, '0');
            return `${partes[0]}-${partes[1]}-${numero}`;
        }
        
        // COR-PLA-1-1 → COR-PLA-001-01
        if (/^COR-[A-Z]{3}-\d+-\d+$/.test(codigo)) {
            const partes = codigo.split('-');
            const plano = partes[2].padStart(3, '0');
            const seq = partes[3].padStart(2, '0');
            return `${partes[0]}-${partes[1]}-${plano}-${seq}`;
        }
        
        // PDC-PLA-1 → PDC-PLA-001
        if (/^PDC-[A-Z]{3}-\d+$/.test(codigo)) {
            const partes = codigo.split('-');
            const numero = partes[2].padStart(3, '0');
            return `${partes[0]}-${partes[1]}-${numero}`;
        }
        
        // LOC-1-A-1 → 0001-A-0001 (remove prefixo e adiciona zeros)
        if (/^LOC-\d+-[A-Z]-\d+$/.test(codigo)) {
            const partes = codigo.split('-');
            const setor = partes[1].padStart(4, '0');
            const corredor = partes[2];
            const posicao = partes[3].padStart(4, '0');
            return `${setor}-${corredor}-${posicao}`;
        }
        
        // 1-A-1 → 0001-A-0001 (locação sem prefixo)
        if (/^\d+-[A-Z]-\d+$/.test(codigo)) {
            const partes = codigo.split('-');
            const setor = partes[0].padStart(4, '0');
            const corredor = partes[1];
            const posicao = partes[2].padStart(4, '0');
            return `${setor}-${corredor}-${posicao}`;
        }
        
        return codigo;
    },

    /**
     * Detecta tipo de código
     */
    detectarTipoCodigo(codigo) {
        if (!codigo) return null;
        
        if (codigo.startsWith('BOB-')) return 'bobina';
        if (codigo.startsWith('RET-')) return 'retalho';
        if (codigo.startsWith('COR-')) return 'corte';
        if (codigo.startsWith('PDC-')) return 'pdc';
        if (codigo.startsWith('LOC-')) return 'locacao';
        
        // Formato de locação SEM prefixo: 1-A-1 até 9999-Z-9999
        if (/^\d{1,4}-[A-Z]-\d{1,4}$/.test(codigo)) return 'locacao';
        
        return null;
    },

    /**
     * Retorna cor baseada no status
     */
    getCorStatus(status) {
        const cores = {
            'Disponível': 'success',
            'Reservado': 'warning',
            'Esgotado': 'secondary',
            'Arquivado': 'secondary',
            'pendente': 'warning',
            'concluido': 'success',
            'em_andamento': 'info',
            'cancelado': 'danger'
        };
        return cores[status] || 'secondary';
    },

    /**
     * Retorna ícone baseado no tipo
     */
    getIconeTipo(tipo) {
        const icones = {
            'bobina': 'bi-box',
            'retalho': 'bi-recycle',
            'corte': 'bi-scissors',
            'pdc': 'bi-clipboard-check',
            'locacao': 'bi-geo-alt-fill'
        };
        return icones[tipo] || 'bi-question-circle';
    },

    /**
     * Salva no cache local
     */
    salvarCache(chave, valor, expiracao = 300000) {
        const item = {
            valor: valor,
            expira: Date.now() + expiracao
        };
        localStorage.setItem(`cache_${chave}`, JSON.stringify(item));
    },

    /**
     * Busca do cache local
     */
    buscarCache(chave) {
        const item = localStorage.getItem(`cache_${chave}`);
        if (!item) return null;
        
        const dados = JSON.parse(item);
        if (Date.now() > dados.expira) {
            localStorage.removeItem(`cache_${chave}`);
            return null;
        }
        
        return dados.valor;
    },

    /**
     * Limpa todo o cache
     */
    limparCache() {
        const chaves = Object.keys(localStorage);
        chaves.forEach(chave => {
            if (chave.startsWith('cache_')) {
                localStorage.removeItem(chave);
            }
        });
    },

    /**
     * Calcula percentual
     */
    calcularPercentual(parte, total) {
        if (!total || total === 0) return 0;
        return Math.round((parte / total) * 100);
    },

    /**
     * Debounce para inputs
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Scroll suave para elemento
     */
    scrollPara(elementoId) {
        const elemento = document.getElementById(elementoId);
        if (elemento) {
            elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },

    /**
     * Converte base64 para Blob
     */
    base64ParaBlob(base64, mimeType = 'image/jpeg') {
        const byteString = atob(base64.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        
        return new Blob([ab], { type: mimeType });
    },

    /**
     * Aplica auto-hífen durante digitação de locação
     * Insere hífen automaticamente na transição número→letra e letra→número
     * @param {string} valor - Valor digitado
     * @returns {string} - Valor com hífens automáticos
     */
    aplicarAutoHifenLocacao(valor) {
        if (!valor) return '';
        
        // Mantém prefixo LOC- se existir
        let prefixo = '';
        let resto = valor.toUpperCase();
        
        if (resto.startsWith('LOC-')) {
            prefixo = 'LOC-';
            resto = resto.substring(4);
        } else if (resto.startsWith('LOC')) {
            prefixo = 'LOC-';
            resto = resto.substring(3);
        }
        
        // Remove tudo que não é número ou letra
        let limpo = resto.replace(/[^0-9A-Z]/g, '');
        
        let resultado = '';
        let ultimoTipo = null; // 'numero' ou 'letra'
        
        for (let i = 0; i < limpo.length; i++) {
            const char = limpo[i];
            const tipoAtual = /[0-9]/.test(char) ? 'numero' : 'letra';
            
            // Se mudou de tipo (número→letra ou letra→número), insere hífen
            if (ultimoTipo && ultimoTipo !== tipoAtual) {
                resultado += '-';
            }
            
            resultado += char;
            ultimoTipo = tipoAtual;
        }
        
        return prefixo + resultado;
    },

    /**
     * Normaliza locação para formato padrão 0000-X-0000
     * @param {string} locacao - Locação em qualquer formato
     * @returns {string|null} - Locação normalizada ou null se inválido
     */
    normalizarLocacao(locacao) {
        if (!locacao) return null;
        
        let codigo = locacao.trim().toUpperCase();
        codigo = codigo.replace(/^LOC-?/, '');
        codigo = codigo.replace(/[^0-9A-Z-]/g, '');
        
        const match = codigo.match(/^(\d{1,4})-?([A-Z])-?(\d{1,4})$/);
        if (!match) return null;
        
        const area = match[1].padStart(4, '0');
        const corredor = match[2];
        const posicao = match[3].padStart(4, '0');
        
        return `${area}-${corredor}-${posicao}`;
    },

    /**
     * Valida se uma locação está em formato válido
     * @param {string} locacao - Locação para validar
     * @returns {boolean} - True se válido
     */
    validarLocacao(locacao) {
        if (!locacao) return false;
        const codigo = locacao.trim().toUpperCase().replace(/^LOC-?/, '');
        return /^\d{1,4}-?[A-Z]-?\d{1,4}$/.test(codigo);
    }
};

// Log de inicialização
debugLog('Utils carregado com sucesso');
