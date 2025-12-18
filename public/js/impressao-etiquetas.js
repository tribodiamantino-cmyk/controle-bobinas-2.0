/**
 * Módulo de Impressão de Etiquetas
 * 
 * Uso:
 * 1. Incluir este script na página
 * 2. Chamar: ImpressaoEtiquetas.adicionar('bobina', 123)
 * 3. Ou usar modal: ImpressaoEtiquetas.abrirModal('bobina', 123)
 * 
 * Modo Teste:
 * - ImpressaoEtiquetas.MODO_TESTE = true
 * - Ao adicionar/imprimir, abre janela com preview visual da etiqueta
 * - Útil durante desenvolvimento/implantação sem impressora física
 */

const ImpressaoEtiquetas = {
    API_BASE: window.location.origin + '/api',
    
    /**
     * MODO TESTE: Se true, abre janela visual ao invés de só adicionar à fila
     * Ativar: ImpressaoEtiquetas.MODO_TESTE = true
     */
    MODO_TESTE: false,

    /**
     * Adicionar etiqueta à fila (sem modal)
     * @param {string} tipo - 'bobina', 'retalho', 'corte', 'locacao'
     * @param {number} id - ID da entidade
     * @param {number} quantidade - Quantidade de cópias (default: 1)
     * @returns {Promise<object>}
     */
    async adicionar(tipo, id, quantidade = 1) {
        try {
            const response = await fetch(`${this.API_BASE}/impressao/adicionar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo_etiqueta: tipo,
                    entidade_id: id,
                    quantidade: quantidade
                })
            });

            const result = await response.json();

            if (result.success) {
                this.notificar('sucesso', `Etiqueta ${result.data.codigo} adicionada à fila`);
                
                // MODO TESTE: Abre janela visual com a etiqueta
                if (this.MODO_TESTE && result.data.dados) {
                    this.abrirPreviewTeste(result.data.dados, quantidade);
                }
                
                return result;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.notificar('erro', error.message);
            throw error;
        }
    },

    /**
     * Preview da etiqueta (sem adicionar à fila)
     * @param {string} tipo 
     * @param {number} id 
     * @returns {Promise<object>}
     */
    async preview(tipo, id) {
        try {
            const response = await fetch(`${this.API_BASE}/impressao/preview/${tipo}/${id}`);
            const result = await response.json();

            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.notificar('erro', error.message);
            throw error;
        }
    },

    /**
     * Abrir modal de impressão com preview
     * @param {string} tipo 
     * @param {number} id 
     */
    async abrirModal(tipo, id) {
        // Buscar dados da etiqueta
        const dados = await this.preview(tipo, id);
        if (!dados) return;

        // Criar modal se não existir
        this.criarModalSeNaoExiste();

        // Preencher modal
        this.preencherModal(dados, tipo, id);

        // Abrir
        const modal = new bootstrap.Modal(document.getElementById('modalImpressaoEtiqueta'));
        modal.show();
    },

    /**
     * Criar estrutura do modal
     */
    criarModalSeNaoExiste() {
        if (document.getElementById('modalImpressaoEtiqueta')) return;

        const modalHtml = `
            <div class="modal fade" id="modalImpressaoEtiqueta" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-printer me-2"></i>Imprimir Etiqueta
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="d-flex flex-column align-items-center mb-3">
                                <p class="text-muted small mb-2">Preview (60x30mm ampliado 2x)</p>
                                <div id="previewEtiquetaContainer" style="transform: scale(1.5); transform-origin: top center; min-height: 200px; display: flex; justify-content: center; align-items: center;">
                                    <!-- Etiqueta será renderizada aqui -->
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-6">
                                    <label class="form-label">Quantidade</label>
                                    <input type="number" class="form-control" id="qtdEtiquetas" value="1" min="1" max="50">
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Prioridade</label>
                                    <select class="form-select" id="prioridadeEtiqueta">
                                        <option value="1">🔴 Urgente</option>
                                        <option value="3">🟡 Alta</option>
                                        <option value="5" selected>🟢 Normal</option>
                                        <option value="7">⚪ Baixa</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-outline-primary" id="btnPrintDireto">
                                <i class="bi bi-printer me-1"></i> Imprimir Agora
                            </button>
                            <button type="button" class="btn btn-primary" id="btnAdicionarFila">
                                <i class="bi bi-plus-lg me-1"></i> Adicionar à Fila
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <style>
                #previewEtiquetaContainer .etiqueta-preview {
                    width: 226px;
                    height: 113px;
                    background: white;
                    border: 1px solid #333;
                    font-family: Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    padding: 4px;
                    box-sizing: border-box;
                    margin: 0 auto;
                }
                #previewEtiquetaContainer .etiqueta-codigo {
                    font-family: 'Courier New', monospace;
                    font-weight: bold;
                    font-size: 14px;
                    text-align: center;
                    margin-bottom: 2px;
                }
                #previewEtiquetaContainer .etiqueta-codigo.grande {
                    font-size: 26px;
                    margin-bottom: 4px;
                }
                #previewEtiquetaContainer .etiqueta-barcode {
                    height: 38px;
                    margin: 2px 0;
                }
                #previewEtiquetaContainer .etiqueta-barcode.grande {
                    height: 56px;
                }
                #previewEtiquetaContainer .etiqueta-linha3,
                #previewEtiquetaContainer .etiqueta-linha4 {
                    font-size: 10px;
                    text-align: center;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    width: 100%;
                }
                #previewEtiquetaContainer .etiqueta-linha4 {
                    font-weight: bold;
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Carregar JsBarcode se não estiver
        if (typeof JsBarcode === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js';
            document.head.appendChild(script);
        }
    },

    /**
     * Preencher modal com dados da etiqueta
     */
    preencherModal(dados, tipo, id) {
        const container = document.getElementById('previewEtiquetaContainer');
        const isLocacao = dados.tipo === 'locacao';

        if (isLocacao) {
            container.innerHTML = `
                <div class="etiqueta-preview">
                    <div class="etiqueta-codigo grande">${dados.linha1}</div>
                    <svg id="modalBarcode" class="etiqueta-barcode grande"></svg>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="etiqueta-preview">
                    <div class="etiqueta-codigo">${dados.linha1}</div>
                    <svg id="modalBarcode" class="etiqueta-barcode"></svg>
                    <div class="etiqueta-linha3">${dados.linha3 || ''}</div>
                    <div class="etiqueta-linha4">${dados.linha4 || ''}</div>
                </div>
            `;
        }

        // Gerar barcode
        setTimeout(() => {
            if (typeof JsBarcode !== 'undefined') {
                JsBarcode('#modalBarcode', dados.linha2_barcode, {
                    format: "CODE128",
                    width: 1.5,
                    height: isLocacao ? 40 : 30,
                    displayValue: false,
                    margin: 0
                });
            }
        }, 100);

        // Configurar botões
        const btnAdicionarFila = document.getElementById('btnAdicionarFila');
        const btnPrintDireto = document.getElementById('btnPrintDireto');

        btnAdicionarFila.onclick = async () => {
            const qtd = parseInt(document.getElementById('qtdEtiquetas').value) || 1;
            await this.adicionar(tipo, id, qtd);
            bootstrap.Modal.getInstance(document.getElementById('modalImpressaoEtiqueta')).hide();
        };

        btnPrintDireto.onclick = () => {
            this.imprimirDireto(dados);
        };
    },

    /**
     * Imprimir diretamente via navegador
     * Em MODO_TESTE, abre preview visual ao invés de imprimir
     */
    imprimirDireto(dados, quantidade = 1) {
        // MODO TESTE: Mostrar preview visual
        if (this.MODO_TESTE) {
            this.abrirPreviewTeste(dados, quantidade);
            return;
        }
        
        const isLocacao = dados.tipo === 'locacao';
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Etiqueta ${dados.codigo}</title>
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
                <style>
                    @page { size: 60mm 30mm; margin: 0; }
                    body { margin: 0; padding: 0; }
                    .etiqueta {
                        width: 60mm;
                        height: 30mm;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        font-family: Arial, sans-serif;
                        box-sizing: border-box;
                        padding: 1mm;
                    }
                    .codigo { font-family: 'Courier New', monospace; font-weight: bold; font-size: ${isLocacao ? '26pt' : '14pt'}; }
                    .barcode { height: ${isLocacao ? '15mm' : '10mm'}; }
                    .linha { font-size: 10pt; text-align: center; }
                    .linha.bold { font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="etiqueta">
                    <div class="codigo">${dados.linha1}</div>
                    <svg id="bc" class="barcode"></svg>
                    ${!isLocacao ? `<div class="linha">${dados.linha3 || ''}</div>` : ''}
                    ${!isLocacao ? `<div class="linha bold">${dados.linha4 || ''}</div>` : ''}
                </div>
                <script>
                    JsBarcode('#bc', '${dados.linha2_barcode}', {
                        format: "CODE128",
                        width: 2,
                        height: ${isLocacao ? 40 : 28},
                        displayValue: false,
                        margin: 0
                    });
                    setTimeout(() => { window.print(); window.close(); }, 500);
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    },

    /**
     * MODO TESTE: Abre janela com preview visual da etiqueta (não fecha automaticamente)
     * Simula a impressão mostrando exatamente como ficaria na etiqueta física
     */
    abrirPreviewTeste(dados, quantidade = 1) {
        const isLocacao = dados.tipo === 'locacao';
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        
        // Gerar HTML para múltiplas etiquetas se quantidade > 1
        let etiquetasHtml = '';
        for (let i = 0; i < quantidade; i++) {
            etiquetasHtml += `
                <div class="etiqueta" style="margin-bottom: 5mm;">
                    <div class="codigo">${dados.linha1}</div>
                    <svg class="barcode bc-${i}"></svg>
                    ${!isLocacao ? `<div class="linha">${dados.linha3 || ''}</div>` : ''}
                    ${!isLocacao ? `<div class="linha bold">${dados.linha4 || ''}</div>` : ''}
                </div>
            `;
        }
        
        const previewWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes');
        previewWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>🧪 MODO TESTE - Etiqueta ${dados.codigo}</title>
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
                <style>
                    * { box-sizing: border-box; }
                    body { 
                        margin: 0; 
                        padding: 20px; 
                        background: #f5f5f5; 
                        font-family: Arial, sans-serif;
                    }
                    .header {
                        background: #198754;
                        color: white;
                        padding: 15px;
                        margin: -20px -20px 20px -20px;
                        text-align: center;
                    }
                    .header h3 { margin: 0 0 5px 0; }
                    .header small { opacity: 0.8; }
                    .info {
                        background: #e7f5ff;
                        border: 1px solid #74c0fc;
                        padding: 10px;
                        border-radius: 5px;
                        margin-bottom: 15px;
                        font-size: 12px;
                    }
                    .etiquetas-container {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 10px;
                    }
                    .etiqueta {
                        width: 60mm;
                        height: 30mm;
                        background: white;
                        border: 2px dashed #666;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        font-family: Arial, sans-serif;
                        padding: 1mm;
                        box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
                    }
                    .codigo { 
                        font-family: 'Courier New', monospace; 
                        font-weight: bold; 
                        font-size: ${isLocacao ? '26pt' : '14pt'}; 
                    }
                    .barcode { height: ${isLocacao ? '15mm' : '10mm'}; }
                    .linha { font-size: 10pt; text-align: center; }
                    .linha.bold { font-weight: bold; }
                    .footer {
                        margin-top: 20px;
                        text-align: center;
                    }
                    .btn {
                        padding: 10px 20px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        margin: 5px;
                    }
                    .btn-print { background: #0d6efd; color: white; }
                    .btn-close { background: #6c757d; color: white; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h3>🧪 MODO TESTE</h3>
                    <small>Simulação de impressão - ${timestamp}</small>
                </div>
                
                <div class="info">
                    <strong>📋 Tipo:</strong> ${dados.tipo} | 
                    <strong>🔢 Código:</strong> ${dados.codigo} | 
                    <strong>📦 Quantidade:</strong> ${quantidade}
                </div>
                
                <div class="etiquetas-container">
                    ${etiquetasHtml}
                </div>
                
                <div class="footer">
                    <button class="btn btn-print" onclick="window.print()">🖨️ Testar Impressão</button>
                    <button class="btn btn-close" onclick="window.close()">✖ Fechar</button>
                </div>
                
                <script>
                    // Gerar barcodes para todas as etiquetas
                    for (let i = 0; i < ${quantidade}; i++) {
                        JsBarcode('.bc-' + i, '${dados.linha2_barcode}', {
                            format: "CODE128",
                            width: 2,
                            height: ${isLocacao ? 40 : 28},
                            displayValue: false,
                            margin: 0
                        });
                    }
                <\/script>
            </body>
            </html>
        `);
        previewWindow.document.close();
    },

    /**
     * Notificar usuário
     */
    notificar(tipo, mensagem) {
        // Se tiver toastr ou similar, usar
        if (window.toastr) {
            tipo === 'sucesso' ? toastr.success(mensagem) : toastr.error(mensagem);
            return;
        }

        // Fallback: criar toast Bootstrap
        const toastId = 'toast-' + Date.now();
        const bgClass = tipo === 'sucesso' ? 'bg-success' : 'bg-danger';
        const icon = tipo === 'sucesso' ? 'check-circle' : 'exclamation-circle';

        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" 
                 role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 9999;">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-${icon} me-2"></i>${mensagem}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', toastHtml);
        
        const toastEl = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
        toast.show();

        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    },

    /**
     * Criar botão de imprimir para inserir em tabelas/cards
     * @param {string} tipo 
     * @param {number} id 
     * @param {string} tamanho - 'sm', 'md', 'lg'
     * @returns {string} HTML do botão
     */
    botaoHtml(tipo, id, tamanho = 'sm') {
        return `
            <button class="btn btn-outline-secondary btn-${tamanho}" 
                    onclick="ImpressaoEtiquetas.abrirModal('${tipo}', ${id})"
                    title="Imprimir etiqueta">
                <i class="bi bi-printer"></i>
            </button>
        `;
    },

    /**
     * Criar link para fila de impressão
     * @param {number} pendentes - Contador opcional
     * @returns {string} HTML do link
     */
    linkFilaHtml(pendentes = null) {
        const badge = pendentes !== null ? `<span class="badge bg-warning">${pendentes}</span>` : '';
        return `
            <a href="fila-impressao.html" class="btn btn-outline-primary">
                <i class="bi bi-printer me-1"></i> Fila de Impressão ${badge}
            </a>
        `;
    },

    // =============================================
    // IMPRESSÃO EM LOTE
    // =============================================

    /**
     * Adicionar múltiplas etiquetas à fila de uma vez
     * @param {string} tipo - 'bobina', 'retalho', 'corte', 'locacao'
     * @param {number[]} ids - Array de IDs das entidades
     * @returns {Promise<object>} - { success, adicionadas, erros }
     */
    async adicionarLote(tipo, ids) {
        const resultados = { adicionadas: 0, erros: [] };
        
        for (const id of ids) {
            try {
                await this.adicionar(tipo, id, 1);
                resultados.adicionadas++;
            } catch (error) {
                resultados.erros.push({ id, erro: error.message });
            }
        }
        
        if (resultados.adicionadas > 0) {
            this.notificar('sucesso', `${resultados.adicionadas} etiqueta(s) adicionada(s) à fila`);
        }
        
        if (resultados.erros.length > 0) {
            console.error('Erros ao adicionar etiquetas:', resultados.erros);
        }
        
        return resultados;
    },

    /**
     * Imprimir múltiplas etiquetas diretamente (abre janela de impressão)
     * @param {string} tipo - 'bobina', 'retalho', 'corte', 'locacao'
     * @param {number[]} ids - Array de IDs das entidades
     */
    async imprimirLote(tipo, ids) {
        if (!ids || ids.length === 0) {
            this.notificar('erro', 'Nenhum item selecionado para impressão');
            return;
        }

        // Buscar dados de todas as etiquetas
        const etiquetas = [];
        for (const id of ids) {
            try {
                const dados = await this.preview(tipo, id);
                if (dados) etiquetas.push(dados);
            } catch (error) {
                console.error(`Erro ao buscar etiqueta ${tipo}/${id}:`, error);
            }
        }

        if (etiquetas.length === 0) {
            this.notificar('erro', 'Não foi possível carregar as etiquetas');
            return;
        }

        // Abrir janela de impressão com todas as etiquetas
        this.abrirJanelaImpressaoLote(etiquetas);
    },

    /**
     * Abre janela de impressão com múltiplas etiquetas
     * Em MODO_TESTE, mostra preview visual sem impressão automática
     * @param {object[]} etiquetas - Array de dados de etiquetas
     */
    abrirJanelaImpressaoLote(etiquetas) {
        const printWindow = window.open('', '_blank', this.MODO_TESTE ? 'width=450,height=700,scrollbars=yes' : '');
        const timestamp = new Date().toLocaleTimeString('pt-BR');
        
        const etiquetasHtml = etiquetas.map((dados, index) => {
            const isLocacao = dados.tipo === 'locacao';
            
            if (isLocacao) {
                return `
                    <div class="etiqueta">
                        <div class="codigo grande">${dados.linha1}</div>
                        <svg class="barcode-svg barcode grande" data-code="${dados.linha2_barcode}"></svg>
                    </div>
                `;
            }
            
            return `
                <div class="etiqueta">
                    <div class="codigo">${dados.linha1}</div>
                    <svg class="barcode-svg barcode" data-code="${dados.linha2_barcode}"></svg>
                    <div class="linha">${dados.linha3 || ''}</div>
                    <div class="linha bold">${dados.linha4 || ''}</div>
                </div>
            `;
        }).join('');

        // Estilos extras para modo teste
        const modoTesteHeader = this.MODO_TESTE ? `
            <div style="background: #198754; color: white; padding: 15px; text-align: center; margin-bottom: 20px;">
                <h3 style="margin: 0 0 5px 0;">🧪 MODO TESTE - LOTE</h3>
                <small style="opacity: 0.8;">${etiquetas.length} etiqueta(s) - ${timestamp}</small>
            </div>
            <div style="background: #e7f5ff; border: 1px solid #74c0fc; padding: 10px; margin: 0 15px 15px 15px; border-radius: 5px; font-size: 12px;">
                <strong>Tipos:</strong> ${[...new Set(etiquetas.map(e => e.tipo))].join(', ')} | 
                <strong>Códigos:</strong> ${etiquetas.map(e => e.codigo).join(', ')}
            </div>
        ` : '';

        const modoTesteFooter = this.MODO_TESTE ? `
            <div style="text-align: center; margin-top: 20px; padding: 15px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #0d6efd; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
                    🖨️ Testar Impressão
                </button>
                <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
                    ✖ Fechar
                </button>
            </div>
        ` : '';

        const bodyStyle = this.MODO_TESTE ? 
            'margin: 0; padding: 0; background: #f5f5f5; font-family: Arial, sans-serif;' : 
            'margin: 0; padding: 0;';

        const etiquetaExtraStyle = this.MODO_TESTE ? 
            'border: 2px dashed #666; box-shadow: 2px 2px 5px rgba(0,0,0,0.2); margin: 10px auto; background: white;' : '';

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${this.MODO_TESTE ? '🧪 TESTE - ' : ''}Imprimir ${etiquetas.length} Etiquetas</title>
                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
                <style>
                    @page { size: 60mm 30mm; margin: 0; }
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white !important; }
                        .etiqueta { border: none !important; box-shadow: none !important; margin: 0 !important; }
                    }
                    body { ${bodyStyle} }
                    .etiqueta {
                        width: 60mm;
                        height: 30mm;
                        page-break-after: always;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        font-family: Arial, sans-serif;
                        box-sizing: border-box;
                        padding: 1mm;
                        ${etiquetaExtraStyle}
                    }
                    .codigo { font-family: 'Courier New', monospace; font-weight: bold; font-size: 14pt; }
                    .codigo.grande { font-size: 26pt; }
                    .barcode { height: 10mm; }
                    .barcode.grande { height: 15mm; }
                    .linha { font-size: 10pt; text-align: center; }
                    .linha.bold { font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="no-print">${modoTesteHeader}</div>
                ${etiquetasHtml}
                <div class="no-print">${modoTesteFooter}</div>
                <script>
                    document.querySelectorAll('.barcode-svg').forEach((svg) => {
                        const code = svg.dataset.code;
                        const grande = svg.classList.contains('grande');
                        JsBarcode(svg, code, {
                            format: "CODE128",
                            width: 2,
                            height: grande ? 40 : 28,
                            displayValue: false,
                            margin: 0
                        });
                    });
                    ${this.MODO_TESTE ? '// Modo teste: não imprime automaticamente' : 'setTimeout(() => window.print(), 500);'}
                <\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    },

    /**
     * Criar checkbox de seleção para usar em tabelas
     * @param {string} tipo 
     * @param {number} id 
     * @returns {string} HTML do checkbox
     */
    checkboxSelecaoHtml(tipo, id) {
        return `
            <input type="checkbox" 
                   class="form-check-input impressao-lote-checkbox" 
                   data-tipo="${tipo}" 
                   data-id="${id}"
                   onclick="event.stopPropagation()">
        `;
    },

    /**
     * Obter IDs selecionados pelos checkboxes
     * @returns {object} - { tipo, ids }
     */
    obterSelecionados() {
        const checkboxes = document.querySelectorAll('.impressao-lote-checkbox:checked');
        const ids = [];
        let tipo = null;
        
        checkboxes.forEach(cb => {
            tipo = cb.dataset.tipo;
            ids.push(parseInt(cb.dataset.id));
        });
        
        return { tipo, ids };
    },

    /**
     * Imprimir todos os itens selecionados
     */
    async imprimirSelecionados() {
        const { tipo, ids } = this.obterSelecionados();
        
        if (!ids || ids.length === 0) {
            this.notificar('erro', 'Selecione pelo menos um item para imprimir');
            return;
        }
        
        await this.imprimirLote(tipo, ids);
    },

    /**
     * Adicionar selecionados à fila
     */
    async adicionarSelecionadosAFila() {
        const { tipo, ids } = this.obterSelecionados();
        
        if (!ids || ids.length === 0) {
            this.notificar('erro', 'Selecione pelo menos um item');
            return;
        }
        
        await this.adicionarLote(tipo, ids);
    },

    /**
     * Criar barra de ações para impressão em lote
     * @returns {string} HTML da barra
     */
    barraAcoesLoteHtml() {
        return `
            <div id="barraImpressaoLote" class="card bg-light mb-3" style="display: none;">
                <div class="card-body py-2">
                    <div class="d-flex align-items-center gap-3">
                        <span><strong id="qtdSelecionadasImpressao">0</strong> selecionada(s)</span>
                        <button class="btn btn-primary btn-sm" onclick="ImpressaoEtiquetas.imprimirSelecionados()">
                            <i class="bi bi-printer me-1"></i> Imprimir Agora
                        </button>
                        <button class="btn btn-outline-primary btn-sm" onclick="ImpressaoEtiquetas.adicionarSelecionadosAFila()">
                            <i class="bi bi-plus-lg me-1"></i> Adicionar à Fila
                        </button>
                        <button class="btn btn-outline-secondary btn-sm" onclick="ImpressaoEtiquetas.limparSelecao()">
                            Limpar Seleção
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Limpar todos os checkboxes de seleção
     */
    limparSelecao() {
        document.querySelectorAll('.impressao-lote-checkbox').forEach(cb => {
            cb.checked = false;
        });
        this.atualizarBarraLote();
    },

    /**
     * Atualizar visibilidade da barra de ações em lote
     * Chamar sempre que um checkbox mudar
     */
    atualizarBarraLote() {
        const barra = document.getElementById('barraImpressaoLote');
        const qtdSpan = document.getElementById('qtdSelecionadasImpressao');
        
        if (!barra) return;
        
        const { ids } = this.obterSelecionados();
        
        if (ids.length > 0) {
            barra.style.display = 'block';
            if (qtdSpan) qtdSpan.textContent = ids.length;
        } else {
            barra.style.display = 'none';
        }
    },

    /**
     * Inicializar listeners para checkboxes de lote
     * Chamar após renderizar tabela com checkboxes
     */
    inicializarSelecaoLote() {
        document.querySelectorAll('.impressao-lote-checkbox').forEach(cb => {
            cb.addEventListener('change', () => this.atualizarBarraLote());
        });
    }
};

// Expor globalmente
window.ImpressaoEtiquetas = ImpressaoEtiquetas;
