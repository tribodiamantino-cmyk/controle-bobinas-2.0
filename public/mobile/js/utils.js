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
     * Valida formato de código de barras
     */
    validarCodigoBarras(codigo) {
        if (!codigo) return false;
        
        const padroes = [
            /^BOB-[A-Z]{3}-\d{6}$/,     // BOB-PLA-000001
            /^RET-[A-Z]{3}-\d{6}$/,     // RET-CIA-000042
            /^COR-\d{4}-\d{5}$/,        // COR-2025-00001
            /^PDC-[A-Z]{3}-\d{3}$/,     // PDC-PLA-015
            /^LOC-\d+$/                 // LOC-15
        ];
        
        return padroes.some(padrao => padrao.test(codigo));
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
    }
};

// Log de inicialização
debugLog('Utils carregado com sucesso');
