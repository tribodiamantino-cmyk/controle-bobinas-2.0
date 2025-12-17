/**
 * MOBILE V2.0 - MÓDULO CARREGAMENTO
 * 
 * Validação de cortes para envio ao cliente
 * 1. Lista PDCs finalizados
 * 2. Inicia carregamento
 * 3. Valida cortes via scanner
 * 4. Mostra progresso
 * 5. Finaliza carregamento
 */

class CarregamentoModule {
    constructor() {
        this.scanner = null;
        this.pdcAtual = null;
        this.carregamentoAtual = null;
        this.cortesValidados = [];
        this.init();
    }

    /**
     * Inicializa o módulo
     */
    init() {
        debugLog('Iniciando módulo CARREGAMENTO');
        
        // Inicializa scanner com callback que mostra feedback
        this.scanner = new Scanner((codigo) => this.onCodigoEscaneado(codigo));
        
        // Carrega lista
        this.carregarLista();
        
        debugLog('Módulo CARREGAMENTO inicializado');
    }

    /**
     * Callback quando scanner lê um código
     * Mostra feedback visual e depois processa
     */
    async onCodigoEscaneado(codigo) {
        debugLog('Código escaneado:', codigo);
        
        // Mostra toast com código lido para feedback
        Utils.mostrarSucesso(`Lido: ${codigo}`, 500);
        
        // Pequeno delay para usuário ver o código
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Processa o scan
        await this.processarScan(codigo);
    }

    /**
     * Carrega lista de PDCs disponíveis
     */
    async carregarLista() {
        try {
            this.mostrarView('listaView');
            Utils.mostrarLoading('Carregando PDCs...');

            const response = await API.getCarregamentosDisponiveis();
            const pdcs = response.data || [];

            Utils.esconderLoading();

            if (pdcs.length === 0) {
                this.renderListaVazia();
                return;
            }

            this.renderLista(pdcs);

        } catch (error) {
            console.error('Erro ao carregar lista:', error);
            Utils.esconderLoading();
            Utils.mostrarErro('Erro ao carregar PDCs disponíveis');
        }
    }

    /**
     * Renderiza lista de PDCs
     */
    renderLista(pdcs) {
        const container = document.getElementById('listaContainer');
        
        const html = pdcs.map(pdc => {
            const locacoesHtml = pdc.locacoes && pdc.locacoes.length > 0
                ? `<div class="list-item-meta mt-2">
                    ${pdc.locacoes.map(loc => `<span><i class="bi bi-geo-alt"></i> ${loc}</span>`).join('')}
                   </div>`
                : '';

            return `
                <div class="list-item" onclick='carregamento.iniciarCarregamento(${JSON.stringify(pdc).replace(/'/g, "&apos;")})'>
                    <div class="list-item-header">
                        <div>
                            <div class="list-item-title">${pdc.codigo_plano}</div>
                            <div class="list-item-subtitle">${pdc.cliente}</div>
                            <div class="list-item-subtitle">${pdc.aviario || ''}</div>
                        </div>
                        <div>
                            <span class="badge bg-info">${pdc.total_cortes} cortes</span>
                        </div>
                    </div>
                    
                    ${locacoesHtml}
                    
                    <div class="mt-2">
                        <small class="text-muted">
                            <i class="bi bi-calendar"></i> 
                            Finalizado em ${Utils.formatarData(pdc.data_finalizacao)}
                        </small>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Renderiza lista vazia
     */
    renderListaVazia() {
        const container = document.getElementById('listaContainer');
        container.innerHTML = `
            <div class="text-center py-5">
                <div class="icon-xl text-muted mb-3">
                    <i class="bi bi-inbox"></i>
                </div>
                <h5 class="text-muted">Nenhum PDC disponível</h5>
                <p class="text-muted">
                    <small>Finalize um PDC no módulo de produção</small>
                </p>
            </div>
        `;
    }

    /**
     * Inicia processo de carregamento
     */
    async iniciarCarregamento(pdc) {
        try {
            this.pdcAtual = pdc;
            
            Utils.mostrarLoading('Iniciando carregamento...');

            const response = await API.iniciarCarregamento(pdc.id);
            this.carregamentoAtual = response.carregamento;
            this.cortesValidados = [];

            Utils.esconderLoading();

            debugLog('Carregamento iniciado:', this.carregamentoAtual);

            // Mostra tela de validação
            this.renderValidacao();

        } catch (error) {
            console.error('Erro ao iniciar carregamento:', error);
            Utils.esconderLoading();
            Utils.mostrarErro('Erro ao iniciar carregamento');
        }
    }

    /**
     * Renderiza tela de validação
     */
    renderValidacao() {
        this.mostrarView('validacaoView');

        // Header
        document.getElementById('carregamentoPDC').textContent = this.pdcAtual.codigo_plano;
        document.getElementById('carregamentoCliente').textContent = 
            `${this.pdcAtual.cliente} ${this.pdcAtual.aviario ? '- ' + this.pdcAtual.aviario : ''}`;

        // Locações
        if (this.pdcAtual.locacoes && this.pdcAtual.locacoes.length > 0) {
            const locacoesHtml = `
                <div class="alert alert-info">
                    <h6><i class="bi bi-geo-alt"></i> Locações dos Cortes</h6>
                    <div class="d-flex flex-wrap gap-2">
                        ${this.pdcAtual.locacoes.map(loc => 
                            `<span class="badge bg-primary">${loc}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
            document.getElementById('carregamentoLocacoes').innerHTML = locacoesHtml;
        }

        // Progresso inicial
        this.atualizarProgresso();
    }

    /**
     * Atualiza barra de progresso
     */
    atualizarProgresso() {
        const validados = this.cortesValidados.length;
        const total = this.carregamentoAtual.total_cortes;
        const percentual = total > 0 ? Math.round((validados / total) * 100) : 0;

        document.getElementById('progressoTexto').textContent = `${validados}/${total} cortes validados`;
        document.getElementById('progressoPercent').textContent = `${percentual}%`;
        document.getElementById('progressoBar').style.width = `${percentual}%`;
        document.getElementById('progressoBar').textContent = `${percentual}%`;

        // Mostra botão finalizar se todos validados
        if (validados === total && total > 0) {
            document.getElementById('finalizarSection').style.display = 'block';
        }
    }

    /**
     * Inicia scanner de cortes
     */
    async escanearCorte() {
        try {
            await this.scanner.iniciar();
        } catch (error) {
            console.error('Erro ao escanear:', error);
            Utils.mostrarErro('Erro ao abrir scanner');
        }
    }

    /**
     * Processa código escaneado
     */
    async processarScan(codigo) {
        try {
            debugLog('Validando corte:', codigo);

            // Valida se é um corte (COR-XXX-X-X ou COR-XXX-XXX-XX)
            if (!codigo.startsWith('COR-')) {
                Utils.feedbackErro();
                Utils.mostrarErro('Código inválido. Escaneie um código de CORTE (COR-PLA-1-1)');
                return;
            }

            // Normaliza código compacto para formato completo
            const codigoNormalizado = Utils.normalizarCodigo(codigo);
            debugLog('Código normalizado:', codigoNormalizado);

            Utils.mostrarLoading('Validando corte...');

            const response = await API.validarCorteCarregamento(
                this.carregamentoAtual.id,
                codigoNormalizado
            );

            Utils.esconderLoading();

            if (!response.valido) {
                Utils.feedbackErro();
                
                // Mostra erro específico
                if (response.erro === 'Corte pertence a outro PDC') {
                    Utils.mostrarErro(
                        `❌ ERRO: Corte pertence a outro PDC!\n\n` +
                        `PDC Correto: ${response.corte.pdc_correto}\n` +
                        `Cliente: ${response.corte.cliente}`
                    );
                } else {
                    Utils.mostrarErro(response.erro || 'Corte inválido');
                }
                return;
            }

            // Sucesso!
            Utils.feedbackSucesso();
            
            // Adiciona à lista
            this.cortesValidados.push(response.corte);
            
            // Atualiza UI
            this.atualizarProgresso();
            this.renderUltimosValidados();
            
            // Toast de sucesso
            Utils.mostrarSucesso(
                `✅ ${response.corte.codigo_corte} - ${Utils.formatarMetragem(response.corte.metragem)}`
            );

        } catch (error) {
            console.error('Erro ao validar corte:', error);
            Utils.esconderLoading();
            Utils.feedbackErro();
            Utils.mostrarErro('Erro ao validar corte');
        }
    }

    /**
     * Renderiza últimos cortes validados
     */
    renderUltimosValidados() {
        const container = document.getElementById('ultimosValidados');
        
        if (this.cortesValidados.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhum corte validado ainda</p>';
            return;
        }

        // Mostra últimos 5
        const ultimos = this.cortesValidados.slice(-5).reverse();
        
        const html = ultimos.map((corte, index) => `
            <div class="alert alert-success d-flex justify-content-between align-items-center mb-2">
                <div>
                    <strong>${corte.codigo_corte}</strong>
                    <br>
                    <small>${Utils.formatarMetragem(corte.metragem)}</small>
                </div>
                <i class="bi bi-check-circle text-success" style="font-size: 1.5rem;"></i>
            </div>
        `).join('');

        container.innerHTML = html;

        // Scroll para mostrar último
        container.scrollTop = 0;
    }

    /**
     * Finaliza carregamento
     */
    async finalizar() {
        try {
            const validados = this.cortesValidados.length;
            const total = this.carregamentoAtual.total_cortes;

            if (validados < total) {
                Utils.mostrarAviso(`Faltam ${total - validados} cortes para validar`);
                return;
            }

            Utils.mostrarLoading('Finalizando carregamento...');

            await API.finalizarCarregamento(this.carregamentoAtual.id);

            Utils.esconderLoading();
            Utils.feedbackSucesso();

            // Mostra tela de sucesso
            this.renderSucesso();

        } catch (error) {
            console.error('Erro ao finalizar:', error);
            Utils.esconderLoading();
            Utils.mostrarErro('Erro ao finalizar carregamento');
        }
    }

    /**
     * Renderiza tela de sucesso
     */
    renderSucesso() {
        this.mostrarView('sucessoView');

        document.getElementById('sucessoPDC').textContent = 
            `${this.pdcAtual.codigo_plano} - ${this.pdcAtual.cliente}`;
        
        document.getElementById('sucessoTotal').textContent = 
            `${this.cortesValidados.length} cortes validados`;
    }

    /**
     * Mostra histórico de carregamentos
     */
    async verHistorico() {
        try {
            Utils.mostrarLoading('Carregando histórico...');

            const response = await API.getHistoricoCarregamentos();
            const historico = response.data || [];

            Utils.esconderLoading();

            if (historico.length === 0) {
                this.renderHistoricoVazio();
                return;
            }

            this.renderHistorico(historico);

        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            Utils.esconderLoading();
            Utils.mostrarErro('Erro ao carregar histórico');
        }
    }

    /**
     * Renderiza histórico
     */
    renderHistorico(historico) {
        this.mostrarView('historicoView');
        const container = document.getElementById('historicoContainer');

        const html = historico.map(item => `
            <div class="list-item">
                <div class="list-item-header">
                    <div>
                        <div class="list-item-title">${item.codigo_carregamento}</div>
                        <div class="list-item-subtitle">
                            ${item.pdc.codigo_plano} - ${item.pdc.cliente}
                        </div>
                        <div class="list-item-subtitle">
                            <i class="bi bi-calendar"></i> 
                            ${Utils.formatarDataHora(item.data_conclusao)}
                        </div>
                    </div>
                    <div>
                        <span class="badge bg-success">${item.total_cortes} cortes</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    /**
     * Renderiza histórico vazio
     */
    renderHistoricoVazio() {
        this.mostrarView('historicoView');
        const container = document.getElementById('historicoContainer');

        container.innerHTML = `
            <div class="text-center py-5">
                <div class="icon-xl text-muted mb-3">
                    <i class="bi bi-inbox"></i>
                </div>
                <h5 class="text-muted">Nenhum carregamento realizado</h5>
            </div>
        `;
    }

    /**
     * Recarrega lista
     */
    recarregar() {
        this.carregarLista();
    }

    /**
     * Volta para lista
     */
    voltarParaLista() {
        this.pdcAtual = null;
        this.carregamentoAtual = null;
        this.cortesValidados = [];
        this.carregarLista();
    }

    /**
     * Mostra view específica
     */
    mostrarView(viewId) {
        const views = ['listaView', 'validacaoView', 'sucessoView', 'historicoView'];
        views.forEach(v => {
            document.getElementById(v).style.display = v === viewId ? 'block' : 'none';
        });
    }
}

// Inicializa módulo quando DOM estiver pronto
let carregamento;
document.addEventListener('DOMContentLoaded', () => {
    carregamento = new CarregamentoModule();
    debugLog('Página CARREGAMENTO carregada');
});
