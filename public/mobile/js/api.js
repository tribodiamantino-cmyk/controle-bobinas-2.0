/**
 * MOBILE V2.0 - API LAYER
 * 
 * Camada de comunicação com o backend
 * Todas as requisições HTTP passam por aqui
 */

class API {
    static BASE_URL = CONFIG.API_BASE_URL;

    /**
     * Requisição genérica
     */
    static async request(endpoint, options = {}) {
        try {
            const url = `${this.BASE_URL}${endpoint}`;
            
            debugLog('API Request:', url, options);
            Utils.mostrarLoading('Carregando...');

            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: CONFIG.TIMEOUTS.request
            };

            // Merge options
            const fetchOptions = { ...defaultOptions, ...options };
            
            // Se for FormData, remover Content-Type (browser define automaticamente)
            if (options.body instanceof FormData) {
                delete fetchOptions.headers['Content-Type'];
            }

            const response = await fetch(url, fetchOptions);
            const data = await response.json();

            Utils.esconderLoading();
            debugLog('API Response:', data);

            if (!data.success) {
                throw new Error(data.error || 'Erro na requisição');
            }

            return data;

        } catch (error) {
            Utils.esconderLoading();
            // Melhor serialização do erro para logs
            const errorInfo = {
                message: error.message || 'Erro desconhecido',
                name: error.name,
                stack: error.stack?.substring(0, 300)
            };
            console.error('Erro na API:', JSON.stringify(errorInfo));
            Utils.mostrarErro(error.message || 'Erro de conexão');
            throw error;
        }
    }

    // ===================================
    // MÓDULO: CONSULTAS
    // ===================================

    /**
     * Valida código de barras e retorna tipo + ID
     */
    static async validarCodigo(codigo) {
        return this.request(`/mobile/validar-codigo/${encodeURIComponent(codigo)}`);
    }

    /**
     * Busca detalhes de bobina
     */
    static async getBobinaDetails(id) {
        return this.request(`/bobinas/${id}`);
    }

    /**
     * Busca detalhes de retalho
     */
    static async getRetalhoDetails(id) {
        return this.request(`/retalhos/${id}`);
    }

    /**
     * Busca detalhes de corte por código
     */
    static async getCorteDetailsByCodigo(codigoCorte) {
        return this.request(`/mobile/corte/${encodeURIComponent(codigoCorte)}`);
    }

    /**
     * Busca detalhes de locação com itens armazenados
     */
    static async getLocacaoDetails(id) {
        return this.request(`/locacoes/${id}/detalhes-mobile`);
    }

    /**
     * Solicita impressão de etiqueta
     */
    static async imprimirEtiqueta(tipo, id) {
        return this.request(`/mobile/imprimir`, {
            method: 'POST',
            body: JSON.stringify({ tipo, id })
        });
    }

    /**
     * Busca histórico de movimentações
     */
    static async getHistorico(tipo, id) {
        return this.request(`/mobile/historico/${tipo}/${id}`);
    }

    // ===================================
    // MÓDULO: PDC
    // ===================================

    /**
     * Lista PDCs em produção
     */
    static async getPDCsProducao(loja = null) {
        const query = loja ? `?loja=${loja}` : '';
        return this.request(`/mobile/pdcs/producao${query}`);
    }

    /**
     * Busca origens de um PDC (bobinas/retalhos agrupados)
     */
    static async getPDCOrigens(pdcId) {
        return this.request(`/mobile/pdcs/${pdcId}/origens`);
    }

    /**
     * Valida se código escaneado é a origem esperada
     */
    static async validarOrigem(dados) {
        return this.request('/mobile/pdcs/validar-origem', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    }

    /**
     * Registra um corte realizado (com foto)
     */
    static async registrarCorte(formData) {
        // FormData já tem Content-Type multipart/form-data
        return this.request('/mobile/registrar-corte', {
            method: 'POST',
            body: formData
        });
    }

    /**
     * Atualiza locação de uma origem após cortes
     */
    static async atualizarLocacao(dados) {
        return this.request('/mobile/pdcs/atualizar-locacao', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    }

    /**
     * Atualiza locação de bobina/retalho após todos cortes concluídos
     */
    static async atualizarLocacaoOrigem(dados) {
        return this.request('/mobile/pdcs/atualizar-locacao-origem', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    }

    /**
     * Finaliza um PDC (todos cortes concluídos)
     */
    static async finalizarPDC(pdcId, locacoes) {
        return this.request(`/mobile/pdcs/${pdcId}/finalizar`, {
            method: 'POST',
            body: JSON.stringify({ locacoes })
        });
    }

    // ===================================
    // MÓDULO: CARREGAMENTO
    // ===================================

    /**
     * Lista PDCs finalizados disponíveis para carregamento
     */
    static async getCarregamentosDisponiveis(loja = null) {
        const query = loja ? `?loja=${loja}` : '';
        return this.request(`/mobile/carregamento/disponiveis${query}`);
    }

    /**
     * Inicia processo de carregamento
     */
    static async iniciarCarregamento(pdcId) {
        return this.request('/mobile/carregamento/iniciar', {
            method: 'POST',
            body: JSON.stringify({ pdc_id: pdcId })
        });
    }

    /**
     * Busca cortes de um carregamento
     */
    static async getCarregamentoCortes(carregamentoId) {
        return this.request(`/mobile/carregamento/${carregamentoId}/cortes`);
    }

    /**
     * Valida corte escaneado no carregamento
     */
    static async validarCorteCarregamento(carregamentoId, codigoCorte) {
        return this.request('/mobile/carregamento/validar-corte', {
            method: 'POST',
            body: JSON.stringify({
                carregamento_id: carregamentoId,
                codigo_corte: codigoCorte
            })
        });
    }

    /**
     * Finaliza carregamento
     */
    static async finalizarCarregamento(carregamentoId) {
        return this.request(`/mobile/carregamento/${carregamentoId}/finalizar`, {
            method: 'POST'
        });
    }

    /**
     * Busca histórico de carregamentos
     */
    static async getHistoricoCarregamentos() {
        return this.request('/mobile/carregamento/historico');
    }

    /**
     * Busca detalhes de um carregamento específico
     */
    static async getCarregamentoDetalhes(carregamentoId) {
        return this.request(`/mobile/carregamento/${carregamentoId}`);
    }

    // ===================================
    // HEALTH CHECK
    // ===================================

    /**
     * Verifica se API está online
     */
    static async healthCheck() {
        try {
            const response = await fetch(`${this.BASE_URL}/health`);
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Log de inicialização
debugLog('API Layer carregado com sucesso');
debugLog('Base URL:', API.BASE_URL);
