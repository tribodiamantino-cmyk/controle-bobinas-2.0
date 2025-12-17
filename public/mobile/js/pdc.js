/**
 * MOBILE V2.0 - MÓDULO PDC (PLANOS DE CORTE)
 * 
 * Fluxo completo de produção:
 * 1. Lista PDCs em produção
 * 2. Ver origens agrupadas
 * 3. Validar origem (scanner)
 * 4. Registrar cortes com foto
 * 5. Atualizar locação
 * 6. Finalizar PDC com locações
 */

class PDCModule {
    constructor() {
        this.scanner = null;
        this.camera = null;
        this.pdcAtual = null;
        this.origemAtual = null;
        this.corteAtual = null;
        this.locacoesFinalizacao = [];
        this.init();
    }

    /**
     * Inicializa o módulo
     */
    init() {
        debugLog('Iniciando módulo PDC');
        
        // Inicializa scanner e câmera
        this.scanner = new Scanner((codigo) => this.onCodigoEscaneado(codigo));
        this.camera = new Camera();
        
        // Carrega lista de PDCs
        this.carregarLista();
        
        debugLog('Módulo PDC inicializado');
    }

    /**
     * Callback quando scanner lê um código
     * Preenche o input para feedback visual e depois processa
     */
    async onCodigoEscaneado(codigo) {
        debugLog('Código escaneado:', codigo);
        
        // Preenche o input de origem manual para feedback visual
        const input = document.getElementById('codigoOrigemManual');
        if (input) {
            input.value = codigo.toUpperCase();
            input.focus();
        }
        
        // Pequeno delay para usuário ver o código
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Processa o scan
        await this.processarScan(codigo);
    }

    /**
     * Carrega lista de PDCs em produção
     */
    async carregarLista() {
        try {
            this.mostrarView('listaView');
            Utils.mostrarLoading('Carregando PDCs...');

            const response = await API.getPDCsProducao();
            const pdcs = response.data || [];

            Utils.esconderLoading();

            if (pdcs.length === 0) {
                this.renderListaVazia();
                return;
            }

            this.renderLista(pdcs);

        } catch (error) {
            console.error('Erro ao carregar PDCs:', error);
            Utils.esconderLoading();
            Utils.mostrarErro('Erro ao carregar lista de PDCs');
        }
    }

    /**
     * Renderiza lista de PDCs
     */
    renderLista(pdcs) {
        const container = document.getElementById('listaContainer');
        
        const html = pdcs.map(pdc => {
            const statusClass = pdc.progresso === 100 ? 'success' : 
                               pdc.progresso > 0 ? 'info' : 'secondary';
            
            return `
                <div class="list-item" onclick="pdc.abrirPDC(${pdc.id})">
                    <div class="list-item-header">
                        <div>
                            <div class="list-item-title">${pdc.codigo_plano}</div>
                            <div class="list-item-subtitle">${pdc.cliente}</div>
                            <div class="list-item-subtitle">${pdc.aviario || ''}</div>
                        </div>
                        <div>
                            <span class="badge bg-${statusClass}">${pdc.progresso}%</span>
                        </div>
                    </div>
                    
                    <div class="progress-info mt-2">
                        <div class="progress-text">
                            <span>${pdc.cortes_concluidos}/${pdc.total_cortes} cortes</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar bg-${statusClass}" style="width: ${pdc.progresso}%">
                                ${pdc.progresso}%
                            </div>
                        </div>
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
                <h5 class="text-muted">Nenhum PDC em produção</h5>
                <p class="text-muted">
                    <small>Crie um novo PDC no sistema desktop</small>
                </p>
            </div>
        `;
    }

    /**
     * Abre PDC e carrega origens
     */
    async abrirPDC(pdcId) {
        try {
            Utils.mostrarLoading('Carregando origens...');

            const response = await API.getPDCOrigens(pdcId);
            this.pdcAtual = response.pdc;
            const origens = response.origens || [];

            Utils.esconderLoading();

            if (origens.length === 0) {
                Utils.mostrarAviso('PDC sem origens alocadas');
                return;
            }

            this.renderOrigens(origens);

        } catch (error) {
            console.error('Erro ao abrir PDC:', error);
            Utils.esconderLoading();
            Utils.mostrarErro('Erro ao carregar origens');
        }
    }

    /**
     * Renderiza origens agrupadas
     */
    renderOrigens(origens) {
        this.mostrarView('origensView');

        // Atualiza header do PDC
        document.getElementById('pdcTitulo').textContent = this.pdcAtual.codigo_plano;
        document.getElementById('pdcCliente').textContent = 
            `${this.pdcAtual.cliente} - ${this.pdcAtual.aviario || ''}`;

        // Calcula progresso total
        const totalCortes = origens.reduce((sum, o) => sum + o.total_cortes, 0);
        const totalConcluidos = origens.reduce((sum, o) => sum + o.cortes_concluidos, 0);
        const progresso = totalCortes > 0 ? Math.round((totalConcluidos / totalCortes) * 100) : 0;

        document.getElementById('progressoTexto').textContent = `${totalConcluidos}/${totalCortes} cortes`;
        document.getElementById('progressoPercent').textContent = `${progresso}%`;
        document.getElementById('progressoBar').style.width = `${progresso}%`;
        document.getElementById('progressoBar').textContent = `${progresso}%`;

        // Renderiza lista de origens
        const container = document.getElementById('origensContainer');
        
        const html = origens.map(origem => {
            const icone = origem.tipo === 'bobina' ? 'bi-box' : 'bi-recycle';
            const statusClass = origem.cortes_concluidos === origem.total_cortes ? 'success' : 'warning';
            const progressoParcial = origem.total_cortes > 0 
                ? Math.round((origem.cortes_concluidos / origem.total_cortes) * 100)
                : 0;

            return `
                <div class="list-item" onclick='pdc.abrirOrigem(${JSON.stringify(origem).replace(/'/g, "&apos;")})'>
                    <div class="list-item-header">
                        <div>
                            <div class="list-item-title">
                                <i class="bi ${icone}"></i> ${origem.codigo}
                            </div>
                            <div class="list-item-subtitle">${origem.produto || 'Produto'}</div>
                            <div class="list-item-subtitle">
                                <i class="bi bi-geo-alt"></i> ${origem.locacao || 'Sem locação'}
                            </div>
                        </div>
                        <div>
                            <span class="badge bg-${statusClass}">${origem.cortes_concluidos}/${origem.total_cortes}</span>
                        </div>
                    </div>
                    
                    <div class="progress mt-2">
                        <div class="progress-bar bg-${statusClass}" style="width: ${progressoParcial}%">
                            ${progressoParcial}%
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;

        // Verifica se todos cortes estão concluídos
        if (totalConcluidos === totalCortes && totalCortes > 0) {
            this.mostrarBotaoFinalizar();
        }
    }

    /**
     * Mostra botão de finalizar PDC
     */
    mostrarBotaoFinalizar() {
        const container = document.getElementById('origensContainer');
        const botao = `
            <div class="card shadow-sm mt-4 border-success">
                <div class="card-body text-center">
                    <h5 class="text-success mb-3">
                        <i class="bi bi-check-circle"></i> Todos cortes concluídos!
                    </h5>
                    <button class="btn btn-success btn-lg w-100" onclick="pdc.iniciarFinalizacao()">
                        <i class="bi bi-flag-fill"></i> FINALIZAR PDC
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += botao;
    }

    /**
     * Abre origem para cortar
     */
    abrirOrigem(origem) {
        this.origemAtual = origem;
        this.renderCortes();
    }

    /**
     * Renderiza cortes da origem
     */
    renderCortes() {
        this.mostrarView('cortesView');

        // Atualiza header da origem
        const icone = this.origemAtual.tipo === 'bobina' ? '📦' : '♻️';
        document.getElementById('origemTitulo').textContent = `${icone} ${this.origemAtual.codigo}`;
        document.getElementById('origemProduto').textContent = this.origemAtual.produto || 'Produto';
        document.querySelector('#origemLocacao span').textContent = this.origemAtual.locacao || 'Sem locação';

        // Mostra seção de validação (origem ainda não validada)
        document.getElementById('validarOrigemSection').style.display = 'block';
        document.getElementById('cortesSection').style.display = 'none';
    }

    /**
     * Valida origem antes de iniciar cortes
     */
    async validarOrigem() {
        try {
            debugLog('Iniciando validação de origem...');
            
            // Inicia scanner
            await this.scanner.iniciar();

        } catch (error) {
            console.error('Erro ao validar origem:', error);
            Utils.mostrarErro('Erro ao abrir scanner');
        }
    }

    /**
     * Valida origem via campo de texto manual
     */
    async validarOrigemManual() {
        const input = document.getElementById('codigoOrigemManual');
        const codigo = input.value.trim().toUpperCase();
        
        if (!codigo) {
            Utils.mostrarErro('Digite o código da origem');
            input.focus();
            return;
        }
        
        debugLog('Validando origem manual:', codigo);
        
        // Valida formato básico (aceita com ou sem zeros)
        // BOB-PLA-1 ou BOB-PLA-000001, RET-CIA-42 ou RET-CIA-000042
        if (!codigo.match(/^(BOB|RET)-[A-Z]{3}-\d{1,6}$/)) {
            Utils.mostrarErro('Formato inválido. Use: BOB-PLA-1 ou RET-CIA-42');
            return;
        }
        
        // Normaliza código compacto para formato completo
        const codigoNormalizado = Utils.normalizarCodigo(codigo);
        debugLog('Código normalizado:', codigoNormalizado);
        
        // Usa a mesma função de validação do scanner
        await this.validarOrigemEscaneada(codigoNormalizado);
        
        // Limpa o campo após validação
        input.value = '';
    }

    /**
     * Processa scan (validação de origem ou locação)
     */
    async processarScan(codigo) {
        debugLog('Código escaneado:', codigo);

        // Se está finalizando, é uma locação
        if (this.mostrandoView('finalizarView')) {
            await this.adicionarLocacaoFinalizacao(codigo);
            return;
        }

        // Normaliza código compacto para formato completo
        const codigoNormalizado = Utils.normalizarCodigo(codigo);
        debugLog('Código normalizado:', codigoNormalizado);

        // Senão, é validação de origem
        await this.validarOrigemEscaneada(codigoNormalizado);
    }

    /**
     * Valida origem escaneada
     */
    async validarOrigemEscaneada(codigo) {
        try {
            Utils.mostrarLoading('Validando origem...');

            const response = await API.validarOrigem({
                pdc_id: this.pdcAtual.id,
                origem_esperada_id: this.origemAtual.id,
                origem_esperada_tipo: this.origemAtual.tipo,
                codigo_escaneado: codigo
            });

            Utils.esconderLoading();

            if (!response.valido) {
                Utils.feedbackErro();
                Utils.mostrarErro(response.erro || 'Origem incorreta');
                return;
            }

            // Origem válida!
            Utils.feedbackSucesso();
            Utils.mostrarSucesso('Origem validada com sucesso!');

            // Esconde validação, mostra cortes
            document.getElementById('validarOrigemSection').style.display = 'none';
            document.getElementById('cortesSection').style.display = 'block';

            // Renderiza lista de cortes
            this.renderListaCortes();

        } catch (error) {
            console.error('Erro ao validar origem:', error);
            Utils.esconderLoading();
            Utils.mostrarErro('Erro na validação');
        }
    }

    /**
     * Renderiza lista de cortes da origem
     */
    renderListaCortes() {
        const container = document.getElementById('cortesContainer');
        const cortes = this.origemAtual.cortes || [];

        const html = cortes.map(corte => {
            const statusClass = corte.status === 'concluido' ? 'success' : 'warning';
            const statusIcon = corte.status === 'concluido' ? 'check-circle' : 'clock';
            const disabled = corte.status === 'concluido' ? 'opacity-50' : '';

            return `
                <div class="list-item ${disabled}">
                    <div class="list-item-header">
                        <div>
                            <div class="list-item-title">
                                ${corte.codigo_corte || `Corte #${corte.id}`}
                            </div>
                            <div class="list-item-subtitle">
                                ${Utils.formatarMetragem(corte.metragem)}
                            </div>
                        </div>
                        <div>
                            <i class="bi bi-${statusIcon} text-${statusClass}" style="font-size: 1.5rem;"></i>
                        </div>
                    </div>
                    
                    ${corte.status !== 'concluido' ? `
                        <button class="btn btn-primary w-100 mt-2" onclick='pdc.iniciarCorte(${JSON.stringify(corte).replace(/'/g, "&apos;")})'>
                            <i class="bi bi-scissors"></i> REALIZAR CORTE
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = html;

        // Verifica se todos cortes desta origem estão concluídos
        const todosConcluidos = cortes.every(c => c.status === 'concluido');
        if (todosConcluidos) {
            document.getElementById('atualizarLocacaoSection').style.display = 'block';
        }
    }

    /**
     * Inicia registro de corte
     */
    iniciarCorte(corte) {
        this.corteAtual = corte;
        this.renderCorteForm();
    }

    /**
     * Renderiza formulário de corte
     */
    renderCorteForm() {
        this.mostrarView('corteView');

        document.getElementById('corteOrigemCodigo').textContent = this.origemAtual.codigo;
        document.getElementById('corteMetragem').textContent = Utils.formatarMetragem(this.corteAtual.metragem);

        // Reseta foto
        const preview = document.getElementById('fotoPreview');
        preview.innerHTML = '<div class="foto-placeholder"><i class="bi bi-camera"></i></div>';
        
        // Desabilita botão confirmar
        document.getElementById('btnConfirmarCorte').disabled = true;
    }

    /**
     * Tira foto do medidor
     */
    async tirarFoto() {
        try {
            debugLog('Tirando foto...');
            
            const foto = await this.camera.tirarFoto();
            
            if (!foto) {
                return; // Usuário cancelou
            }

            // Mostra preview
            const preview = document.getElementById('fotoPreview');
            preview.innerHTML = `<img src="${foto.dataUrl}" alt="Foto" class="img-fluid rounded">`;

            // Habilita botão confirmar
            document.getElementById('btnConfirmarCorte').disabled = false;

            Utils.mostrarSucesso('Foto capturada!');

        } catch (error) {
            console.error('Erro ao tirar foto:', error);
            Utils.mostrarErro('Erro ao capturar foto');
        }
    }

    /**
     * Confirma registro do corte
     */
    async confirmarCorte() {
        try {
            if (!this.camera.temFoto()) {
                Utils.mostrarAviso('Tire a foto do medidor primeiro');
                return;
            }

            Utils.mostrarLoading('Registrando corte...');

            // Cria FormData com foto e dados
            const formData = await this.camera.criarFormData(null, 'foto', {
                pdc_id: this.pdcAtual.id,
                item_id: this.corteAtual.id,
                origem_id: this.origemAtual.id,
                origem_tipo: this.origemAtual.tipo,
                metragem_cortada: this.corteAtual.metragem
            });

            const response = await API.registrarCorte(formData);

            Utils.esconderLoading();

            if (!response.success) {
                throw new Error(response.error || 'Erro ao registrar corte');
            }

            const corteRegistrado = response.data;

            // Feedback de sucesso
            Utils.feedbackSucesso();
            this.mostrarSucessoCorte(corteRegistrado);

            // Limpa foto
            this.camera.limparUltimaFoto();

            // Aguarda 3 segundos e volta para lista
            setTimeout(() => {
                this.voltarParaCortes();
            }, 3000);

        } catch (error) {
            // Melhor serialização do erro para logs
            const errorInfo = {
                message: error.message || 'Erro desconhecido',
                name: error.name,
                stack: error.stack?.substring(0, 300)
            };
            console.error('Erro ao confirmar corte:', JSON.stringify(errorInfo));
            Utils.esconderLoading();
            Utils.mostrarErro(error.message || 'Erro ao registrar corte');
        }
    }

    /**
     * Mostra feedback de sucesso do corte
     */
    mostrarSucessoCorte(corte) {
        const container = document.querySelector('#corteView .card-body');
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="icon-xl text-success mb-3">
                    <i class="bi bi-check-circle"></i>
                </div>
                <h3>Corte Registrado!</h3>
                <p class="text-large mb-3">${corte.codigo_corte}</p>
                <p class="text-muted">${Utils.formatarMetragem(corte.metragem_cortada)}</p>
                
                <div class="alert alert-info mt-4">
                    <i class="bi bi-printer"></i>
                    <strong>Etiqueta enviada para impressão</strong>
                </div>

                <button class="btn btn-primary mt-3" onclick="pdc.voltarParaCortes()">
                    PRÓXIMO CORTE
                </button>
            </div>
        `;
    }

    /**
     * Volta para lista de cortes (recarrega dados)
     */
    async voltarParaCortes() {
        // Recarrega origem para atualizar status dos cortes
        await this.abrirPDC(this.pdcAtual.id);
        
        // Encontra a origem atual na lista atualizada
        // (simulação - em produção buscaria do servidor)
        this.renderCortes();
    }

    /**
     * Atualiza locação da origem após todos cortes
     */
    async atualizarLocacaoOrigem() {
        try {
            debugLog('Atualizando locação da origem...');
            
            // Inicia scanner para nova locação
            Utils.mostrarAviso('Escaneie a nova locação da origem');
            
            // Configura callback temporário do scanner
            const codigoOriginal = this.scanner.callback;
            this.scanner.callback = async (codigo) => {
                try {
                    // Valida se é locação
                    if (!codigo.startsWith('LOC-')) {
                        Utils.mostrarErro('Código inválido. Use LOC-XXX');
                        return;
                    }

                    Utils.mostrarLoading('Atualizando locação...');

                    await API.atualizarLocacao({
                        tipo: this.origemAtual.tipo,
                        id: this.origemAtual.id,
                        nova_locacao: codigo
                    });

                    Utils.esconderLoading();
                    Utils.feedbackSucesso();
                    Utils.mostrarSucesso('Locação atualizada!');

                    // Restaura callback original
                    this.scanner.callback = codigoOriginal;

                    // Volta para origens
                    await this.abrirPDC(this.pdcAtual.id);

                } catch (error) {
                    console.error('Erro ao atualizar locação:', error);
                    Utils.esconderLoading();
                    Utils.mostrarErro('Erro ao atualizar locação');
                    this.scanner.callback = codigoOriginal;
                }
            };

            await this.scanner.iniciar();

        } catch (error) {
            console.error('Erro:', error);
            Utils.mostrarErro('Erro ao abrir scanner');
        }
    }

    /**
     * Cancela corte em andamento
     */
    cancelarCorte() {
        this.corteAtual = null;
        this.camera.limparUltimaFoto();
        this.renderCortes();
    }

    /**
     * Inicia processo de finalização do PDC
     */
    iniciarFinalizacao() {
        this.locacoesFinalizacao = [];
        this.renderFinalizacao();
    }

    /**
     * Renderiza tela de finalização
     */
    renderFinalizacao() {
        this.mostrarView('finalizarView');

        document.getElementById('finalizarPDCNome').textContent = 
            `${this.pdcAtual.codigo_plano} - ${this.pdcAtual.cliente}`;

        this.atualizarListaLocacoes();
    }

    /**
     * Escaneia locação para finalização
     */
    async escanearLocacao() {
        try {
            await this.scanner.iniciar();
        } catch (error) {
            console.error('Erro ao escanear locação:', error);
            Utils.mostrarErro('Erro ao abrir scanner');
        }
    }

    /**
     * Adiciona locação via campo de texto manual
     */
    async adicionarLocacaoManual() {
        const input = document.getElementById('locacaoManual');
        let codigo = input.value.trim().toUpperCase();
        
        if (!codigo) {
            Utils.mostrarErro('Digite a locação');
            input.focus();
            return;
        }
        
        debugLog('Adicionando locação manual:', codigo);
        
        // Se não começar com LOC-, verifica se é formato de locação N-X-N
        if (!codigo.startsWith('LOC-')) {
            // Verifica formato N-X-N (ex: 1-A-1, 01-B-23, 0001-C-0001)
            if (codigo.match(/^\d{1,4}-[A-Z]-\d{1,4}$/)) {
                // Normaliza para formato padrão
                if (typeof Utils.normalizarLocacao === 'function') {
                    codigo = Utils.normalizarLocacao(codigo);
                }
                // Converte para código LOC- (simplificado: usa o próprio código)
                // Na prática, seria necessário buscar o ID da locação no banco
                // Por enquanto, permite usar o formato direto
            } else {
                Utils.mostrarErro('Formato inválido. Use: LOC-5 ou 1-A-1');
                return;
            }
        }
        
        // Usa a mesma função de adicionar locação do scanner
        await this.adicionarLocacaoFinalizacao(codigo);
        
        // Limpa o campo após adicionar
        input.value = '';
    }

    /**
     * Adiciona locação escaneada
     */
    async adicionarLocacaoFinalizacao(codigo) {
        try {
            // Valida se é locação (LOC-X ou formato N-X-N)
            const isLocCode = codigo.startsWith('LOC-');
            const isLocFormat = codigo.match(/^\d{4}-[A-Z]-\d{4}$/);
            
            if (!isLocCode && !isLocFormat) {
                Utils.feedbackErro();
                Utils.mostrarErro('Código inválido. Use LOC-5 ou 0001-A-0001');
                return;
            }

            // Verifica duplicação
            if (this.locacoesFinalizacao.includes(codigo)) {
                Utils.feedbackErro();
                Utils.mostrarAviso('Locação já adicionada');
                return;
            }

            // Adiciona
            this.locacoesFinalizacao.push(codigo);
            Utils.feedbackSucesso();

            // Atualiza lista
            this.atualizarListaLocacoes();

            // Habilita botão finalizar se tem pelo menos 1 locação
            document.getElementById('btnFinalizarPDC').disabled = this.locacoesFinalizacao.length === 0;

        } catch (error) {
            console.error('Erro ao adicionar locação:', error);
        }
    }

    /**
     * Atualiza lista de locações escaneadas
     */
    atualizarListaLocacoes() {
        const container = document.getElementById('locacoesEscaneadas');
        
        if (this.locacoesFinalizacao.length === 0) {
            container.innerHTML = '<p class="text-muted text-center">Nenhuma locação escaneada</p>';
            return;
        }

        const html = `
            <h6 class="mb-3">📍 Locações Escaneadas (${this.locacoesFinalizacao.length})</h6>
            ${this.locacoesFinalizacao.map(loc => `
                <div class="alert alert-success d-flex justify-content-between align-items-center">
                    <span><i class="bi bi-check-circle"></i> ${loc}</span>
                    <button class="btn btn-sm btn-outline-danger" onclick="pdc.removerLocacao('${loc}')">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            `).join('')}
        `;

        container.innerHTML = html;
    }

    /**
     * Remove locação da lista
     */
    removerLocacao(codigo) {
        this.locacoesFinalizacao = this.locacoesFinalizacao.filter(l => l !== codigo);
        this.atualizarListaLocacoes();
        document.getElementById('btnFinalizarPDC').disabled = this.locacoesFinalizacao.length === 0;
    }

    /**
     * Finaliza PDC
     */
    async finalizarPDC() {
        try {
            if (this.locacoesFinalizacao.length === 0) {
                Utils.mostrarAviso('Escaneie pelo menos uma locação');
                return;
            }

            Utils.mostrarLoading('Finalizando PDC...');

            await API.finalizarPDC(this.pdcAtual.id, this.locacoesFinalizacao);

            Utils.esconderLoading();
            Utils.feedbackSucesso();
            Utils.mostrarSucesso('PDC finalizado com sucesso!');

            // Volta para lista após 2 segundos
            setTimeout(() => {
                this.carregarLista();
            }, 2000);

        } catch (error) {
            console.error('Erro ao finalizar PDC:', error);
            Utils.esconderLoading();
            Utils.mostrarErro('Erro ao finalizar PDC');
        }
    }

    /**
     * Recarrega lista de PDCs
     */
    recarregarLista() {
        this.carregarLista();
    }

    /**
     * Volta para lista de PDCs
     */
    voltarParaLista() {
        this.pdcAtual = null;
        this.origemAtual = null;
        this.carregarLista();
    }

    /**
     * Volta para lista de origens
     */
    voltarParaOrigens() {
        this.origemAtual = null;
        this.abrirPDC(this.pdcAtual.id);
    }

    /**
     * Mostra view específica
     */
    mostrarView(viewId) {
        const views = ['listaView', 'origensView', 'cortesView', 'corteView', 'finalizarView'];
        views.forEach(v => {
            document.getElementById(v).style.display = v === viewId ? 'block' : 'none';
        });
    }

    /**
     * Verifica se está mostrando view específica
     */
    mostrandoView(viewId) {
        return document.getElementById(viewId).style.display === 'block';
    }
}

// Inicializa módulo quando DOM estiver pronto
let pdc;
document.addEventListener('DOMContentLoaded', () => {
    pdc = new PDCModule();
    debugLog('Página PDC carregada');
});
