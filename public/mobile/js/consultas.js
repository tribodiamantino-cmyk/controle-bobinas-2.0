/**
 * MOBILE V2.0 - MÓDULO CONSULTAS
 * 
 * Scanner de código de barras + exibição de detalhes
 * Suporta: BOB, RET, COR, LOC
 */

class ConsultasModule {
    constructor() {
        this.scanner = null;
        this.itemAtual = null;
        this.init();
    }

    /**
     * Inicializa o módulo
     */
    init() {
        debugLog('Iniciando módulo CONSULTAS');
        
        // Inicializa scanner com callback que preenche o input
        this.scanner = new Scanner((codigo) => this.onCodigoEscaneado(codigo));
        
        // Event listeners
        this.attachEventListeners();
        
        debugLog('Módulo CONSULTAS inicializado');
    }

    /**
     * Callback quando scanner lê um código
     * Preenche o input e depois processa
     */
    async onCodigoEscaneado(codigo) {
        debugLog('Código escaneado:', codigo);
        
        // Preenche o input para feedback visual
        const input = document.getElementById('inputManual');
        if (input) {
            input.value = codigo.toUpperCase();
            input.focus();
        }
        
        // Pequeno delay para usuário ver o código
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Processa o código
        await this.processarCodigo(codigo);
    }

    /**
     * Anexa event listeners
     */
    attachEventListeners() {
        // Botão de scanner
        document.getElementById('btnScan')?.addEventListener('click', () => {
            this.iniciarScanner();
        });

        // Botão de busca manual
        document.getElementById('btnBuscar')?.addEventListener('click', () => {
            this.buscarManual();
        });

        // Enter no input manual
        document.getElementById('inputManual')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.buscarManual();
            }
        });

        // Auto-hífen para locação durante digitação
        document.getElementById('inputManual')?.addEventListener('input', (e) => {
            const valor = e.target.value;
            // Se parece ser uma locação (começa com número ou LOC), aplica auto-hífen
            if (/^(LOC|loc|\d)/i.test(valor)) {
                e.target.value = Utils.aplicarAutoHifenLocacao(valor);
            }
        });

        // Botão nova busca
        document.getElementById('btnNovaBusca')?.addEventListener('click', () => {
            this.voltarParaScanner();
        });
    }

    /**
     * Inicia o scanner
     */
    async iniciarScanner() {
        try {
            debugLog('Iniciando scanner...');
            await this.scanner.iniciar();
        } catch (error) {
            console.error('Erro ao iniciar scanner:', error);
            Utils.mostrarErro('Erro ao abrir câmera');
        }
    }

    /**
     * Busca manual por código
     */
    async buscarManual() {
        const input = document.getElementById('inputManual');
        const codigo = input.value.trim().toUpperCase();

        if (!codigo) {
            Utils.mostrarAviso('Digite um código');
            return;
        }

        await this.processarCodigo(codigo);
        input.value = '';
    }

    /**
     * Processa código escaneado ou digitado
     */
    async processarCodigo(codigo) {
        try {
            debugLog('Processando código:', codigo);

            // Valida formato
            if (!Utils.validarCodigoBarras(codigo)) {
                Utils.mostrarErro('Código inválido: ' + codigo);
                return;
            }

            // Normaliza código compacto para formato completo
            const codigoNormalizado = Utils.normalizarCodigo(codigo);
            debugLog('Código normalizado:', codigoNormalizado);

            // Detecta tipo
            const tipo = Utils.detectarTipoCodigo(codigo);
            debugLog('Tipo detectado:', tipo);

            // Busca dados na API (usa código normalizado)
            await this.buscarDados(tipo, codigoNormalizado);

        } catch (error) {
            console.error('Erro ao processar código:', error);
            Utils.mostrarErro('Erro ao buscar dados');
        }
    }

    /**
     * Busca dados do item na API
     */
    async buscarDados(tipo, codigo) {
        try {
            let dados = null;

            switch (tipo) {
                case 'bobina':
                    dados = await this.buscarBobina(codigo);
                    break;
                
                case 'retalho':
                    dados = await this.buscarRetalho(codigo);
                    break;
                
                case 'corte':
                    dados = await this.buscarCorte(codigo);
                    break;
                
                case 'locacao':
                    dados = await this.buscarLocacao(codigo);
                    break;
                
                default:
                    throw new Error('Tipo não suportado: ' + tipo);
            }

            if (dados) {
                this.itemAtual = { tipo, codigo, dados };
                this.mostrarDetalhes(tipo, dados);
            }

        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            Utils.mostrarErro(error.message || 'Erro ao buscar dados');
        }
    }

    /**
     * Busca bobina (extrai ID do código)
     */
    async buscarBobina(codigo) {
        try {
            // Valida código via API
            const validation = await API.validarCodigo(codigo);
            
            if (!validation.data || !validation.data.id) {
                throw new Error('Bobina não encontrada');
            }

            // Busca detalhes
            const response = await API.getBobinaDetails(validation.data.id);
            return response.data;

        } catch (error) {
            console.error('Erro ao buscar bobina:', error);
            throw error;
        }
    }

    /**
     * Busca retalho (extrai ID do código)
     */
    async buscarRetalho(codigo) {
        try {
            const validation = await API.validarCodigo(codigo);
            
            if (!validation.data || !validation.data.id) {
                throw new Error('Retalho não encontrado');
            }

            const response = await API.getRetalhoDetails(validation.data.id);
            return response.data;

        } catch (error) {
            console.error('Erro ao buscar retalho:', error);
            throw error;
        }
    }

    /**
     * Busca corte por código
     */
    async buscarCorte(codigo) {
        try {
            const response = await API.getCorteDetailsByCodigo(codigo);
            return response.data;

        } catch (error) {
            console.error('Erro ao buscar corte:', error);
            throw error;
        }
    }

    /**
     * Busca locação (valida código e busca detalhes)
     */
    async buscarLocacao(codigo) {
        try {
            // Valida código via API (aceita LOC-XXXX-X-XXXX ou XXXX-X-XXXX)
            const validation = await API.validarCodigo(codigo);
            
            if (!validation.data || !validation.data.id) {
                throw new Error('Locação não encontrada');
            }

            // Busca detalhes com itens armazenados
            const response = await API.getLocacaoDetails(validation.data.id);
            return response.data;

        } catch (error) {
            console.error('Erro ao buscar locação:', error);
            throw error;
        }
    }

    /**
     * Mostra detalhes do item
     */
    mostrarDetalhes(tipo, dados) {
        debugLog('Mostrando detalhes:', tipo, dados);

        // Esconde scanner, mostra detalhes
        document.getElementById('scannerSection').style.display = 'none';
        document.getElementById('detailsSection').style.display = 'block';

        // Renderiza baseado no tipo
        const container = document.getElementById('detailsContainer');
        
        switch (tipo) {
            case 'bobina':
                container.innerHTML = this.renderBobina(dados);
                break;
            
            case 'retalho':
                container.innerHTML = this.renderRetalho(dados);
                break;
            
            case 'corte':
                container.innerHTML = this.renderCorte(dados);
                break;
            
            case 'locacao':
                container.innerHTML = this.renderLocacao(dados);
                break;
        }

        // Scroll para topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Renderiza detalhes de bobina
     */
    renderBobina(data) {
        const statusClass = Utils.getCorStatus(data.status);
        const disponivelPercentual = Utils.calcularPercentual(
            data.metragem_disponivel, 
            data.metragem_original
        );

        return `
            <div class="detail-card">
                <div class="detail-header">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h2><i class="bi bi-box me-2"></i>${data.codigo_interno}</h2>
                            <span class="badge bg-${statusClass}">${data.status}</span>
                        </div>
                        <div class="text-end">
                            <small class="text-muted">ID: ${data.id}</small>
                        </div>
                    </div>
                </div>

                <!-- Produto -->
                <div class="info-section">
                    <h3><i class="bi bi-tag"></i> PRODUTO</h3>
                    <div class="info-row">
                        <span class="info-label">Descrição:</span>
                        <span class="info-value">${data.produto || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Fabricante:</span>
                        <span class="info-value">${data.fabricante || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Loja:</span>
                        <span class="info-value">${data.loja || '-'}</span>
                    </div>
                </div>

                <!-- Metragem -->
                <div class="info-section">
                    <h3><i class="bi bi-rulers"></i> METRAGEM</h3>
                    <div class="info-row">
                        <span class="info-label">Original:</span>
                        <span class="info-value text-large">${Utils.formatarMetragem(data.metragem_original)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Atual:</span>
                        <span class="info-value text-large">${Utils.formatarMetragem(data.metragem_atual)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Reservada:</span>
                        <span class="info-value text-warning">${Utils.formatarMetragem(data.metragem_reservada)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Disponível:</span>
                        <span class="info-value text-success text-xlarge">${Utils.formatarMetragem(data.metragem_disponivel)}</span>
                    </div>
                    
                    <div class="progress mt-3" style="height: 30px;">
                        <div class="progress-bar bg-success" style="width: ${disponivelPercentual}%">
                            ${disponivelPercentual}%
                        </div>
                    </div>
                </div>

                <!-- Localização -->
                <div class="info-section">
                    <h3><i class="bi bi-geo-alt"></i> LOCALIZAÇÃO</h3>
                    <div class="info-row">
                        <span class="info-label">Locação:</span>
                        <span class="info-value">${data.locacao || 'Não definida'}</span>
                    </div>
                </div>

                <!-- Informações Adicionais -->
                <div class="info-section">
                    <h3><i class="bi bi-info-circle"></i> INFORMAÇÕES</h3>
                    <div class="info-row">
                        <span class="info-label">Data Entrada:</span>
                        <span class="info-value">${Utils.formatarData(data.data_entrada)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Nota Fiscal:</span>
                        <span class="info-value">${data.nota_fiscal || '-'}</span>
                    </div>
                    ${data.placa ? `
                    <div class="info-row">
                        <span class="info-label">Placa:</span>
                        <span class="info-value">${data.placa}</span>
                    </div>
                    ` : ''}
                </div>

                <!-- Ações -->
                <div class="action-buttons mt-4">
                    <button class="btn btn-primary" onclick="consultas.imprimirEtiqueta('bobina', ${data.id})">
                        <i class="bi bi-printer"></i> Etiqueta
                    </button>
                    <button class="btn btn-secondary" onclick="consultas.verHistorico('bobina', ${data.id})">
                        <i class="bi bi-clock-history"></i> Histórico
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza detalhes de retalho
     */
    renderRetalho(data) {
        const statusClass = Utils.getCorStatus(data.status);

        return `
            <div class="detail-card">
                <div class="detail-header">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h2><i class="bi bi-recycle me-2"></i>${data.codigo_retalho}</h2>
                            <span class="badge bg-${statusClass}">${data.status}</span>
                        </div>
                        <div class="text-end">
                            <small class="text-muted">ID: ${data.id}</small>
                        </div>
                    </div>
                </div>

                <!-- Produto -->
                <div class="info-section">
                    <h3><i class="bi bi-tag"></i> PRODUTO</h3>
                    <div class="info-row">
                        <span class="info-label">Descrição:</span>
                        <span class="info-value">${data.produto || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Fabricante:</span>
                        <span class="info-value">${data.fabricante || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Loja:</span>
                        <span class="info-value">${data.loja || '-'}</span>
                    </div>
                </div>

                <!-- Origem -->
                <div class="info-section">
                    <h3><i class="bi bi-box-arrow-right"></i> ORIGEM</h3>
                    <div class="info-row">
                        <span class="info-label">Bobina Original:</span>
                        <span class="info-value">${data.bobina_origem || '-'}</span>
                    </div>
                </div>

                <!-- Metragem -->
                <div class="info-section">
                    <h3><i class="bi bi-rulers"></i> METRAGEM</h3>
                    <div class="info-row">
                        <span class="info-label">Atual:</span>
                        <span class="info-value text-xlarge">${Utils.formatarMetragem(data.metragem_atual)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Reservada:</span>
                        <span class="info-value text-warning">${Utils.formatarMetragem(data.metragem_reservada)}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Disponível:</span>
                        <span class="info-value text-success text-xlarge">${Utils.formatarMetragem(data.metragem_disponivel)}</span>
                    </div>
                </div>

                <!-- Localização -->
                <div class="info-section">
                    <h3><i class="bi bi-geo-alt"></i> LOCALIZAÇÃO</h3>
                    <div class="info-row">
                        <span class="info-label">Locação:</span>
                        <span class="info-value">${data.locacao || 'Não definida'}</span>
                    </div>
                </div>

                <!-- Ações -->
                <div class="action-buttons mt-4">
                    <button class="btn btn-primary" onclick="consultas.imprimirEtiqueta('retalho', ${data.id})">
                        <i class="bi bi-printer"></i> Etiqueta
                    </button>
                    <button class="btn btn-secondary" onclick="consultas.verHistorico('retalho', ${data.id})">
                        <i class="bi bi-clock-history"></i> Histórico
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Renderiza detalhes de corte
     */
    renderCorte(data) {
        const statusClass = Utils.getCorStatus(data.status);

        return `
            <div class="detail-card">
                <div class="detail-header">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h2><i class="bi bi-scissors me-2"></i>${data.codigo_corte}</h2>
                            <span class="badge bg-${statusClass}">${data.status}</span>
                            ${data.carregado ? '<span class="badge bg-success ms-2">Carregado</span>' : ''}
                        </div>
                        <div class="text-end">
                            <small class="text-muted">ID: ${data.id}</small>
                        </div>
                    </div>
                </div>

                <!-- PDC -->
                <div class="info-section">
                    <h3><i class="bi bi-clipboard-check"></i> PLANO DE CORTE</h3>
                    <div class="info-row">
                        <span class="info-label">PDC:</span>
                        <span class="info-value">${data.pdc || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Cliente:</span>
                        <span class="info-value">${data.cliente || '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Aviário:</span>
                        <span class="info-value">${data.aviario || '-'}</span>
                    </div>
                </div>

                <!-- Produto -->
                <div class="info-section">
                    <h3><i class="bi bi-tag"></i> PRODUTO</h3>
                    <div class="info-row">
                        <span class="info-label">Descrição:</span>
                        <span class="info-value">${data.produto || '-'}</span>
                    </div>
                </div>

                <!-- Metragem -->
                <div class="info-section">
                    <h3><i class="bi bi-rulers"></i> METRAGEM</h3>
                    <div class="info-row">
                        <span class="info-label">Cortada:</span>
                        <span class="info-value text-xlarge">${Utils.formatarMetragem(data.metragem)}</span>
                    </div>
                </div>

                <!-- Origem -->
                <div class="info-section">
                    <h3><i class="bi bi-box-arrow-right"></i> ORIGEM</h3>
                    <div class="info-row">
                        <span class="info-label">Código:</span>
                        <span class="info-value">${data.origem || '-'}</span>
                    </div>
                </div>

                <!-- Data -->
                <div class="info-section">
                    <h3><i class="bi bi-calendar"></i> DATA</h3>
                    <div class="info-row">
                        <span class="info-label">Corte realizado:</span>
                        <span class="info-value">${Utils.formatarDataHora(data.data_corte)}</span>
                    </div>
                </div>

                <!-- Foto -->
                ${data.foto_medidor ? `
                <div class="info-section">
                    <h3><i class="bi bi-camera"></i> FOTO DO MEDIDOR</h3>
                    <div class="foto-preview">
                        <img src="${data.foto_medidor}" alt="Foto do medidor" class="img-fluid rounded">
                    </div>
                </div>
                ` : ''}

                <!-- Ações -->
                <div class="action-buttons mt-4">
                    <button class="btn btn-primary" onclick="consultas.imprimirEtiqueta('corte', ${data.id})">
                        <i class="bi bi-printer"></i> Etiqueta
                    </button>
                    ${data.foto_medidor ? `
                    <button class="btn btn-secondary" onclick="window.open('${data.foto_medidor}', '_blank')">
                        <i class="bi bi-zoom-in"></i> Ver Foto
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Renderiza detalhes de locação
     */
    renderLocacao(data) {
        // Se locação vazia
        if (data.vazia || !data.itens || data.itens.length === 0) {
            return `
                <div class="detail-card">
                    <div class="detail-header">
                        <h2><i class="bi bi-geo-alt me-2"></i>LOC-${data.codigo}</h2>
                        ${data.descricao ? `<p class="text-muted mb-0">${data.descricao}</p>` : ''}
                    </div>

                    <div class="info-section text-center py-5">
                        <i class="bi bi-inbox display-1 text-muted mb-3"></i>
                        <h4 class="text-muted">Locação Vazia</h4>
                        <p class="text-muted">Nenhum item armazenado nesta locação</p>
                    </div>
                </div>
            `;
        }

        // Renderiza lista de itens
        const itensHtml = data.itens.map(item => {
            const icone = item.tipo === 'bobina' ? 'bi-box' : 'bi-recycle';
            const produto = `${item.nome_cor || ''} ${item.gramatura ? item.gramatura + 'g' : ''} ${item.fabricante || ''}`.trim();
            const badgeClass = item.status === 'Disponível' ? 'bg-success' : 'bg-warning';
            
            return `
                <div class="list-item mb-2">
                    <div class="list-item-header">
                        <div>
                            <div class="list-item-title">
                                <i class="bi ${icone}"></i> ${item.codigo}
                            </div>
                            <div class="list-item-subtitle">${produto}</div>
                            <small class="text-muted"><i class="bi bi-building"></i> ${item.loja}</small>
                        </div>
                        <div class="text-end">
                            <span class="badge ${badgeClass}">${Utils.formatarMetragem(item.metragem)}</span>
                            <small class="d-block text-muted mt-1">${item.status}</small>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-outline-primary mt-2 w-100" 
                            onclick="consultas.processarCodigo('${item.codigo}')">
                        <i class="bi bi-eye"></i> Ver Detalhes
                    </button>
                </div>
            `;
        }).join('');

        return `
            <div class="detail-card">
                <div class="detail-header">
                    <h2><i class="bi bi-geo-alt me-2"></i>LOC-${data.codigo}</h2>
                    ${data.descricao ? `<p class="text-muted mb-0">${data.descricao}</p>` : ''}
                </div>

                <div class="info-section">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h3 class="mb-0"><i class="bi bi-box"></i> ITENS ARMAZENADOS</h3>
                        <span class="badge bg-primary">${data.total_itens} ${data.total_itens === 1 ? 'item' : 'itens'}</span>
                    </div>
                    
                    <div class="mb-3">
                        <strong>Total de Metragem:</strong> 
                        <span class="badge bg-info">${Utils.formatarMetragem(data.total_metragem)}</span>
                    </div>

                    <hr>

                    ${itensHtml}
                </div>
            </div>
        `;
    }

    /**
     * Solicita impressão de etiqueta
     */
    async imprimirEtiqueta(tipo, id) {
        try {
            Utils.mostrarLoading('Enviando para impressão...');
            
            await API.imprimirEtiqueta(tipo, id);
            
            Utils.esconderLoading();
            Utils.mostrarSucesso('Etiqueta enviada para impressão!');

        } catch (error) {
            console.error('Erro ao imprimir:', error);
            Utils.esconderLoading();
            Utils.mostrarErro('Erro ao imprimir etiqueta');
        }
    }

    /**
     * Mostra histórico de movimentações
     */
    async verHistorico(tipo, id) {
        try {
            Utils.mostrarLoading('Buscando histórico...');
            
            const response = await API.getHistorico(tipo, id);
            
            Utils.esconderLoading();
            
            // TODO: Renderizar modal ou página de histórico
            console.log('Histórico:', response.data);
            Utils.mostrarSucesso('Funcionalidade em desenvolvimento');

        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
            Utils.esconderLoading();
            Utils.mostrarErro('Erro ao buscar histórico');
        }
    }

    /**
     * Volta para a tela do scanner
     */
    voltarParaScanner() {
        document.getElementById('detailsSection').style.display = 'none';
        document.getElementById('scannerSection').style.display = 'block';
        this.itemAtual = null;
        
        // Limpa input
        document.getElementById('inputManual').value = '';
        
        // Scroll para topo
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Inicializa módulo quando DOM estiver pronto
let consultas;
document.addEventListener('DOMContentLoaded', () => {
    consultas = new ConsultasModule();
    debugLog('Página CONSULTAS carregada');
});
