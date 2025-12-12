/**
 * Componente de Modal de Histórico
 * 
 * Exibe timeline de movimentações de bobinas, retalhos e produtos
 * Uso: HistoricoModal.mostrar('bobina', 123)
 */

const HistoricoModal = {
    modalElement: null,
    tipoAtual: null,
    idAtual: null,

    /**
     * Inicializa o modal (cria o HTML se não existir)
     */
    init() {
        if (document.getElementById('historicoModal')) return;

        const modalHtml = `
        <div class="modal fade" id="historicoModal" tabindex="-1" aria-labelledby="historicoModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-scrollable">
                <div class="modal-content">
                    <div class="modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        <h5 class="modal-title" id="historicoModalLabel">
                            <i class="bi bi-clock-history me-2"></i>Histórico
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Fechar"></button>
                    </div>
                    <div class="modal-body p-0">
                        <!-- Cabeçalho com info da entidade -->
                        <div id="historicoHeader" class="p-3 bg-light border-bottom">
                            <!-- Preenchido dinamicamente -->
                        </div>
                        
                        <!-- Filtro de Datas -->
                        <div id="historicoFiltros" class="p-3 border-bottom bg-white">
                            <div class="row g-2 align-items-end">
                                <div class="col-md-4">
                                    <label class="form-label small mb-1">Data Início</label>
                                    <input type="date" class="form-control form-control-sm" id="historicoDataInicio">
                                </div>
                                <div class="col-md-4">
                                    <label class="form-label small mb-1">Data Fim</label>
                                    <input type="date" class="form-control form-control-sm" id="historicoDataFim">
                                </div>
                                <div class="col-md-4">
                                    <button class="btn btn-sm btn-primary w-100" onclick="HistoricoModal.aplicarFiltro()">
                                        <i class="bi bi-funnel me-1"></i>Filtrar
                                    </button>
                                </div>
                            </div>
                            <div class="mt-2">
                                <button class="btn btn-sm btn-outline-secondary me-1" onclick="HistoricoModal.filtroRapido('hoje')">Hoje</button>
                                <button class="btn btn-sm btn-outline-secondary me-1" onclick="HistoricoModal.filtroRapido('semana')">Última Semana</button>
                                <button class="btn btn-sm btn-outline-secondary me-1" onclick="HistoricoModal.filtroRapido('mes')">Último Mês</button>
                                <button class="btn btn-sm btn-outline-secondary" onclick="HistoricoModal.filtroRapido('todos')">Todos</button>
                            </div>
                        </div>
                        
                        <!-- Resumo -->
                        <div id="historicoResumo" class="p-3 border-bottom">
                            <!-- Preenchido dinamicamente -->
                        </div>
                        
                        <!-- Timeline -->
                        <div id="historicoTimeline" class="p-3">
                            <div class="text-center py-5">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Carregando...</span>
                                </div>
                                <p class="text-muted mt-2">Carregando histórico...</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Fechar</button>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            .historico-timeline {
                position: relative;
                padding-left: 30px;
            }
            .historico-timeline::before {
                content: '';
                position: absolute;
                left: 10px;
                top: 0;
                bottom: 0;
                width: 2px;
                background: linear-gradient(to bottom, #667eea, #764ba2);
            }
            .historico-item {
                position: relative;
                padding-bottom: 20px;
            }
            .historico-item:last-child {
                padding-bottom: 0;
            }
            .historico-item::before {
                content: '';
                position: absolute;
                left: -24px;
                top: 5px;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #667eea;
                border: 2px solid white;
                box-shadow: 0 0 0 2px #667eea;
            }
            .historico-item.tipo-entrada::before,
            .historico-item.tipo-entrada_bobina::before,
            .historico-item.tipo-origem::before {
                background: #28a745;
                box-shadow: 0 0 0 2px #28a745;
            }
            .historico-item.tipo-corte::before,
            .historico-item.tipo-corte_bobina::before,
            .historico-item.tipo-corte_retalho::before {
                background: #dc3545;
                box-shadow: 0 0 0 2px #dc3545;
            }
            .historico-item.tipo-retalho_gerado::before {
                background: #fd7e14;
                box-shadow: 0 0 0 2px #fd7e14;
            }
            .historico-card {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 12px;
                border-left: 3px solid #667eea;
            }
            .historico-card.tipo-entrada,
            .historico-card.tipo-entrada_bobina,
            .historico-card.tipo-origem {
                border-left-color: #28a745;
            }
            .historico-card.tipo-corte,
            .historico-card.tipo-corte_bobina,
            .historico-card.tipo-corte_retalho {
                border-left-color: #dc3545;
            }
            .historico-card.tipo-retalho_gerado {
                border-left-color: #fd7e14;
            }
            .historico-data {
                font-size: 0.8em;
                color: #6c757d;
            }
            .historico-descricao {
                font-weight: 500;
                margin-bottom: 5px;
            }
            .historico-detalhes {
                font-size: 0.85em;
                color: #495057;
            }
            .resumo-card {
                text-align: center;
                padding: 10px;
                border-radius: 8px;
                background: #f8f9fa;
            }
            .resumo-card .valor {
                font-size: 1.5em;
                font-weight: bold;
                color: #667eea;
            }
            .resumo-card .label {
                font-size: 0.8em;
                color: #6c757d;
            }
        </style>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    },

    /**
     * Mostra o modal de histórico
     * @param {string} tipo - 'bobina', 'retalho' ou 'produto'
     * @param {number} id - ID da entidade
     * @param {string} dataInicio - Data início (opcional)
     * @param {string} dataFim - Data fim (opcional)
     */
    async mostrar(tipo, id, dataInicio = null, dataFim = null) {
        this.init();
        this.tipoAtual = tipo;
        this.idAtual = id;
        
        const modal = new bootstrap.Modal(document.getElementById('historicoModal'));
        modal.show();
        
        // Limpar filtros de data se não especificados
        if (!dataInicio && !dataFim) {
            document.getElementById('historicoDataInicio').value = '';
            document.getElementById('historicoDataFim').value = '';
        } else {
            if (dataInicio) document.getElementById('historicoDataInicio').value = dataInicio;
            if (dataFim) document.getElementById('historicoDataFim').value = dataFim;
        }

        // Limpar conteúdo anterior
        document.getElementById('historicoHeader').innerHTML = '<div class="text-muted">Carregando...</div>';
        document.getElementById('historicoResumo').innerHTML = '';
        document.getElementById('historicoTimeline').innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="text-muted mt-2">Carregando histórico...</p>
            </div>
        `;

        // Atualizar título
        const titulos = {
            bobina: 'Histórico da Bobina',
            retalho: 'Histórico do Retalho',
            produto: 'Histórico do Produto'
        };
        document.getElementById('historicoModalLabel').innerHTML = `
            <i class="bi bi-clock-history me-2"></i>${titulos[tipo] || 'Histórico'}
        `;

        try {
            // Montar URL com filtros
            const endpoints = {
                bobina: `/api/bobinas/${id}/historico`,
                retalho: `/api/retalhos/${id}/historico`,
                produto: `/api/produtos/${id}/historico`
            };
            
            let url = endpoints[tipo];
            const params = new URLSearchParams();
            if (dataInicio) params.append('data_inicio', dataInicio);
            if (dataFim) params.append('data_fim', dataFim);
            if (params.toString()) url += '?' + params.toString();

            const response = await fetch(url);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Erro ao carregar histórico');
            }

            // Renderizar conteúdo
            this.renderizarHeader(tipo, result.data);
            this.renderizarResumo(tipo, result.data.resumo);
            this.renderizarTimeline(result.data.eventos);

        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            document.getElementById('historicoTimeline').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Erro ao carregar histórico: ${error.message}
                </div>
            `;
        }
    },
    
    /**
     * Aplica o filtro de datas
     */
    aplicarFiltro() {
        const dataInicio = document.getElementById('historicoDataInicio').value || null;
        const dataFim = document.getElementById('historicoDataFim').value || null;
        
        if (this.tipoAtual && this.idAtual) {
            // Apenas recarregar os dados, não recriar o modal
            this.recarregarDados(dataInicio, dataFim);
        }
    },
    
    /**
     * Recarrega os dados com filtros
     */
    async recarregarDados(dataInicio, dataFim) {
        document.getElementById('historicoTimeline').innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="text-muted mt-2">Filtrando...</p>
            </div>
        `;
        
        try {
            const endpoints = {
                bobina: `/api/bobinas/${this.idAtual}/historico`,
                retalho: `/api/retalhos/${this.idAtual}/historico`,
                produto: `/api/produtos/${this.idAtual}/historico`
            };
            
            let url = endpoints[this.tipoAtual];
            const params = new URLSearchParams();
            if (dataInicio) params.append('data_inicio', dataInicio);
            if (dataFim) params.append('data_fim', dataFim);
            if (params.toString()) url += '?' + params.toString();

            const response = await fetch(url);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Erro ao carregar histórico');
            }

            this.renderizarResumo(this.tipoAtual, result.data.resumo);
            this.renderizarTimeline(result.data.eventos);

        } catch (error) {
            console.error('Erro ao filtrar histórico:', error);
            document.getElementById('historicoTimeline').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Erro ao filtrar: ${error.message}
                </div>
            `;
        }
    },
    
    /**
     * Aplica filtros rápidos de data
     */
    filtroRapido(periodo) {
        const hoje = new Date();
        let dataInicio = null;
        let dataFim = hoje.toISOString().split('T')[0];
        
        switch (periodo) {
            case 'hoje':
                dataInicio = dataFim;
                break;
            case 'semana':
                const semanaAtras = new Date(hoje);
                semanaAtras.setDate(hoje.getDate() - 7);
                dataInicio = semanaAtras.toISOString().split('T')[0];
                break;
            case 'mes':
                const mesAtras = new Date(hoje);
                mesAtras.setMonth(hoje.getMonth() - 1);
                dataInicio = mesAtras.toISOString().split('T')[0];
                break;
            case 'todos':
                dataInicio = null;
                dataFim = null;
                break;
        }
        
        document.getElementById('historicoDataInicio').value = dataInicio || '';
        document.getElementById('historicoDataFim').value = dataFim || '';
        
        this.recarregarDados(dataInicio, dataFim);
    },

    /**
     * Renderiza o cabeçalho com info da entidade
     */
    renderizarHeader(tipo, data) {
        let html = '';

        if (tipo === 'bobina' && data.bobina) {
            const b = data.bobina;
            html = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1"><i class="bi bi-box-seam me-2"></i>${b.codigo || `BOB-${b.id}`}</h6>
                        <small class="text-muted">
                            ${b.cor || ''} ${b.gramatura ? b.gramatura + 'gr' : ''} ${b.largura ? b.largura + 'cm' : ''} | ${b.fabricante || 'S/F'}
                        </small>
                    </div>
                    <span class="badge bg-${data.resumo.status === 'Disponível' ? 'success' : data.resumo.status === 'Esgotado' ? 'secondary' : 'warning'}">${data.resumo.status}</span>
                </div>
            `;
        } else if (tipo === 'retalho' && data.retalho) {
            const r = data.retalho;
            html = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-1"><i class="bi bi-scissors me-2"></i>${r.codigo || `RET-${r.id}`}</h6>
                        <small class="text-muted">
                            ${r.cor || ''} ${r.gramatura ? r.gramatura + 'gr' : ''} ${r.largura ? r.largura + 'cm' : ''} | ${r.fabricante || 'S/F'}
                        </small>
                        ${data.bobina_origem ? `<br><small class="text-info">Origem: ${data.bobina_origem.codigo || `BOB-${data.bobina_origem.id}`}</small>` : ''}
                    </div>
                    <span class="badge bg-${data.resumo.status === 'Disponível' ? 'success' : data.resumo.status === 'Esgotado' ? 'secondary' : 'warning'}">${data.resumo.status}</span>
                </div>
            `;
        } else if (tipo === 'produto' && data.produto) {
            const p = data.produto;
            html = `
                <div>
                    <h6 class="mb-1"><i class="bi bi-box me-2"></i>${p.codigo || `PROD-${p.id}`}</h6>
                    <small class="text-muted">
                        ${p.cor || ''} ${p.gramatura ? p.gramatura + 'gr' : ''} ${p.largura ? p.largura + 'cm' : ''} | ${p.fabricante || 'S/F'} | ${p.loja || ''}
                    </small>
                </div>
            `;
        }

        document.getElementById('historicoHeader').innerHTML = html;
    },

    /**
     * Renderiza cards de resumo
     */
    renderizarResumo(tipo, resumo) {
        if (!resumo) return;

        let cards = [];

        if (tipo === 'bobina') {
            cards = [
                { valor: this.formatarMetragem(resumo.metragem_inicial), label: 'Metragem Inicial' },
                { valor: this.formatarMetragem(resumo.total_cortado), label: 'Total Cortado', cor: 'danger' },
                { valor: this.formatarMetragem(resumo.metragem_atual), label: 'Metragem Atual', cor: 'success' },
                { valor: resumo.qtd_cortes, label: 'Cortes' },
                { valor: resumo.qtd_retalhos, label: 'Retalhos Gerados' }
            ];
        } else if (tipo === 'retalho') {
            cards = [
                { valor: this.formatarMetragem(resumo.metragem_original), label: 'Metragem Original' },
                { valor: this.formatarMetragem(resumo.total_cortado), label: 'Total Cortado', cor: 'danger' },
                { valor: this.formatarMetragem(resumo.metragem_atual), label: 'Metragem Atual', cor: 'success' },
                { valor: resumo.qtd_cortes, label: 'Cortes' }
            ];
        } else if (tipo === 'produto') {
            cards = [
                { valor: this.formatarMetragem(resumo.total_entrada), label: 'Total Entrada' },
                { valor: this.formatarMetragem(resumo.total_cortado), label: 'Total Cortado', cor: 'danger' },
                { valor: this.formatarMetragem(resumo.estoque_total), label: 'Estoque Atual', cor: 'success' },
                { valor: resumo.qtd_bobinas, label: 'Bobinas' },
                { valor: resumo.qtd_retalhos, label: 'Retalhos' },
                { valor: resumo.qtd_cortes, label: 'Cortes' }
            ];
        }

        const html = `
            <div class="row g-2">
                ${cards.map(c => `
                    <div class="col">
                        <div class="resumo-card">
                            <div class="valor ${c.cor ? 'text-' + c.cor : ''}">${c.valor}</div>
                            <div class="label">${c.label}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        document.getElementById('historicoResumo').innerHTML = html;
    },

    /**
     * Renderiza a timeline de eventos
     */
    renderizarTimeline(eventos) {
        if (!eventos || eventos.length === 0) {
            document.getElementById('historicoTimeline').innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    Nenhuma movimentação registrada
                </div>
            `;
            return;
        }

        const html = `
            <h6 class="mb-3"><i class="bi bi-list-ul me-2"></i>Timeline de Movimentações</h6>
            <div class="historico-timeline">
                ${eventos.map(e => `
                    <div class="historico-item tipo-${e.tipo}">
                        <div class="historico-card tipo-${e.tipo}">
                            <div class="historico-data">
                                ${e.icone || '📋'} ${this.formatarData(e.data)}
                            </div>
                            <div class="historico-descricao">${e.descricao}</div>
                            ${e.detalhes ? this.renderizarDetalhes(e.tipo, e.detalhes) : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        document.getElementById('historicoTimeline').innerHTML = html;
    },

    /**
     * Renderiza detalhes de um evento
     */
    renderizarDetalhes(tipo, detalhes) {
        let items = [];

        if (tipo.includes('corte')) {
            if (detalhes.cliente) items.push(`<strong>Cliente:</strong> ${detalhes.cliente}`);
            if (detalhes.obra) items.push(`<strong>Obra:</strong> ${detalhes.obra}`);
            if (detalhes.operador) items.push(`<strong>Operador:</strong> ${detalhes.operador}`);
            if (detalhes.codigo_corte) items.push(`<strong>Código:</strong> ${detalhes.codigo_corte}`);
        } else if (tipo === 'entrada' || tipo === 'entrada_bobina') {
            if (detalhes.nota_fiscal) items.push(`<strong>NF:</strong> ${detalhes.nota_fiscal}`);
        } else if (tipo === 'retalho_gerado') {
            if (detalhes.status) items.push(`<strong>Status:</strong> ${detalhes.status}`);
        }

        if (items.length === 0) return '';

        return `<div class="historico-detalhes">${items.join(' | ')}</div>`;
    },

    /**
     * Formata data para exibição
     */
    formatarData(data) {
        if (!data) return '-';
        const d = new Date(data);
        return d.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Formata metragem para exibição
     */
    formatarMetragem(valor) {
        if (!valor && valor !== 0) return '0,00m';
        const num = parseFloat(valor);
        return num.toFixed(2).replace('.', ',') + 'm';
    }
};

// Expor globalmente
window.HistoricoModal = HistoricoModal;
