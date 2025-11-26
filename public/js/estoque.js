// Estado global
let produtosEstoque = [];
let produtoSelecionado = null;
let bobinaCriada = null;
let cores = [];
let gramaturas = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarEstoque();
    carregarCoresGramaturas();
    document.getElementById('form-bobina').addEventListener('submit', registrarBobina);
    document.getElementById('form-cadastro-rapido').addEventListener('submit', cadastrarProdutoRapido);
});

// Carregar cores e gramaturas para cadastro rápido
async function carregarCoresGramaturas() {
    try {
        // Carregar cores
        const resCores = await fetch('/api/cores');
        const dataCores = await resCores.json();
        if (dataCores.success) {
            cores = dataCores.data;
            const selectCor = document.getElementById('quick-cor_id');
            selectCor.innerHTML = '<option value="">Selecione...</option>' +
                cores.map(cor => `<option value="${cor.id}">${cor.nome_cor}</option>`).join('');
        }
        
        // Carregar gramaturas
        const resGram = await fetch('/api/gramaturas');
        const dataGram = await resGram.json();
        if (dataGram.success) {
            gramaturas = dataGram.data;
            const selectGram = document.getElementById('quick-gramatura_id');
            selectGram.innerHTML = '<option value="">Selecione...</option>' +
                gramaturas.map(g => `<option value="${g.id}">${g.gramatura}</option>`).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar cores/gramaturas:', error);
    }
}

// Resetar busca ao mudar loja ou fabricante
function resetarBusca() {
    document.getElementById('produto-encontrado').style.display = 'none';
    document.getElementById('produto-nao-encontrado').style.display = 'none';
    document.getElementById('codigo').value = '';
    produtoSelecionado = null;
    document.getElementById('btn-salvar').disabled = true;
}

// Buscar produto por loja + fabricante + código
async function buscarProduto() {
    const loja = document.getElementById('loja').value;
    const fabricante = document.getElementById('fabricante').value;
    const codigo = document.getElementById('codigo').value;
    
    if (!loja || !fabricante || !codigo) {
        mostrarAlerta('Selecione loja, fabricante e digite o código', 'warning');
        return;
    }
    
    try {
        const response = await fetch(
            `/api/bobinas/buscar-produto?loja=${loja}&fabricante=${fabricante}&codigo=${codigo}`
        );
        const data = await response.json();
        
        if (data.success && data.found) {
            // Produto encontrado
            produtoSelecionado = data.data;
            mostrarProdutoEncontrado(data.data);
            document.getElementById('btn-salvar').disabled = false;
        } else {
            // Produto não encontrado
            produtoSelecionado = null;
            mostrarProdutoNaoEncontrado();
            document.getElementById('btn-salvar').disabled = true;
        }
        
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        mostrarAlerta('Erro ao buscar produto', 'danger');
    }
}

// Mostrar dados do produto encontrado
function mostrarProdutoEncontrado(produto) {
    document.getElementById('produto-encontrado').style.display = 'block';
    document.getElementById('produto-nao-encontrado').style.display = 'none';
    
    let medidas = '';
    if (produto.tipo_tecido === 'Bando Y') {
        medidas = `
            <div><strong>Largura Maior:</strong> ${produto.largura_maior} cm</div>
            <div><strong>Largura Y:</strong> ${produto.largura_y} cm</div>
        `;
    } else {
        medidas = `
            <div><strong>Largura S/Costura:</strong> ${produto.largura_sem_costura} cm</div>
            <div><strong>Tipo Bainha:</strong> ${produto.tipo_bainha}</div>
            <div><strong>Largura Final:</strong> ${produto.largura_final} cm</div>
        `;
    }
    
    document.getElementById('produto-dados').innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
            <div><strong>Cor:</strong> ${produto.nome_cor}</div>
            <div><strong>Gramatura:</strong> ${produto.gramatura}</div>
            <div><strong>Tipo:</strong> ${produto.tipo_tecido || 'Normal'}</div>
            ${medidas}
        </div>
    `;
}

// Mostrar alerta de produto não encontrado
function mostrarProdutoNaoEncontrado() {
    document.getElementById('produto-encontrado').style.display = 'none';
    document.getElementById('produto-nao-encontrado').style.display = 'block';
}

// Abrir modal de cadastro rápido de produto
function abrirModalCadastroProduto() {
    const loja = document.getElementById('loja').value;
    const fabricante = document.getElementById('fabricante').value;
    const codigo = document.getElementById('codigo').value;
    
    // Preencher dados no modal
    document.getElementById('quick-loja').textContent = loja;
    document.getElementById('quick-fabricante').textContent = fabricante;
    document.getElementById('quick-codigo').textContent = codigo;
    
    // Mostrar modal
    document.getElementById('modal-cadastro-produto').style.display = 'flex';
}

// Fechar modal de cadastro de produto
function fecharModalCadastroProduto() {
    document.getElementById('modal-cadastro-produto').style.display = 'none';
    document.getElementById('form-cadastro-rapido').reset();
}

// Toggle campos do cadastro rápido
function toggleCamposTecidoRapido() {
    const tipoTecido = document.getElementById('quick-tipo_tecido').value;
    const camposNormal = document.getElementById('quick-campos-normal');
    const camposBandoY = document.getElementById('quick-campos-bando-y');
    
    if (tipoTecido === 'Bando Y') {
        camposNormal.style.display = 'none';
        camposBandoY.style.display = 'grid';
        
        // Remover required dos campos normais
        document.getElementById('quick-largura_sem_costura').removeAttribute('required');
        document.getElementById('quick-tipo_bainha').removeAttribute('required');
        document.getElementById('quick-largura_final').removeAttribute('required');
        
        // Adicionar required aos campos Bando Y
        document.getElementById('quick-largura_maior').setAttribute('required', 'required');
        document.getElementById('quick-largura_y').setAttribute('required', 'required');
    } else {
        camposNormal.style.display = 'grid';
        camposBandoY.style.display = 'none';
        
        // Adicionar required aos campos normais
        document.getElementById('quick-largura_sem_costura').setAttribute('required', 'required');
        document.getElementById('quick-tipo_bainha').setAttribute('required', 'required');
        document.getElementById('quick-largura_final').setAttribute('required', 'required');
        
        // Remover required dos campos Bando Y
        document.getElementById('quick-largura_maior').removeAttribute('required');
        document.getElementById('quick-largura_y').removeAttribute('required');
    }
}

// Cadastrar produto rapidamente
async function cadastrarProdutoRapido(e) {
    e.preventDefault();
    
    const loja = document.getElementById('loja').value;
    const fabricante = document.getElementById('fabricante').value;
    const codigo = document.getElementById('codigo').value;
    const tipoTecido = document.getElementById('quick-tipo_tecido').value;
    
    const produto = {
        loja: loja,
        codigo: codigo,
        cor_id: parseInt(document.getElementById('quick-cor_id').value),
        gramatura_id: parseInt(document.getElementById('quick-gramatura_id').value),
        fabricante: fabricante,
        tipo_tecido: tipoTecido
    };
    
    // Adicionar campos específicos conforme o tipo
    if (tipoTecido === 'Bando Y') {
        produto.largura_maior = parseFloat(document.getElementById('quick-largura_maior').value);
        produto.largura_y = parseFloat(document.getElementById('quick-largura_y').value);
    } else {
        produto.largura_sem_costura = parseFloat(document.getElementById('quick-largura_sem_costura').value);
        produto.tipo_bainha = document.getElementById('quick-tipo_bainha').value;
        produto.largura_final = parseFloat(document.getElementById('quick-largura_final').value);
    }
    
    try {
        const response = await fetch('/api/produtos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produto)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('Produto cadastrado com sucesso!', 'success');
            fecharModalCadastroProduto();
            
            // Buscar produto novamente
            await buscarProduto();
        } else {
            mostrarAlerta(data.error || 'Erro ao cadastrar produto', 'danger');
        }
        
    } catch (error) {
        console.error('Erro ao cadastrar produto:', error);
        mostrarAlerta('Erro ao cadastrar produto: ' + error.message, 'danger');
    }
}

// Registrar nova bobina
async function registrarBobina(e) {
    e.preventDefault();
    
    if (!produtoSelecionado) {
        mostrarAlerta('Busque um produto válido primeiro', 'warning');
        return;
    }
    
    const bobina = {
        nota_fiscal: document.getElementById('nota_fiscal').value,
        loja: document.getElementById('loja').value,
        produto_id: produtoSelecionado.id,
        metragem_inicial: parseFloat(document.getElementById('metragem_inicial').value),
        observacoes: document.getElementById('observacoes').value || null
    };
    
    try {
        const response = await fetch('/api/bobinas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bobina)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            bobinaCriada = data.data;
            mostrarModalSucesso(data.data);
            limparFormulario();
            carregarEstoque();
        } else {
            mostrarAlerta(data.error || 'Erro ao registrar bobina', 'danger');
        }
        
    } catch (error) {
        console.error('Erro ao registrar bobina:', error);
        mostrarAlerta('Erro ao registrar bobina: ' + error.message, 'danger');
    }
}

// Mostrar modal de sucesso
function mostrarModalSucesso(bobina) {
    document.getElementById('dados-bobina-criada').innerHTML = `
        <div class="alert alert-info">
            <h3 style="margin-top: 0;">🏷️ ${bobina.codigo_interno}</h3>
            <div><strong>📄 NF:</strong> ${bobina.nota_fiscal}</div>
            <div><strong>🏪 Loja:</strong> ${bobina.loja}</div>
            <div><strong>🏭 Fabricante:</strong> ${bobina.fabricante}</div>
            <div><strong>📦 Produto:</strong> ${bobina.codigo} (${bobina.nome_cor} • ${bobina.gramatura})</div>
            <div><strong>📏 Metragem:</strong> ${bobina.metragem_inicial}m</div>
            <div><strong>📅 Data:</strong> ${new Date(bobina.data_entrada).toLocaleString('pt-BR')}</div>
        </div>
    `;
    document.getElementById('modal-sucesso').style.display = 'flex';
}

// Fechar modal
function fecharModal() {
    document.getElementById('modal-sucesso').style.display = 'none';
    bobinaCriada = null;
}

// Imprimir etiqueta Zebra
function imprimirEtiqueta() {
    if (!bobinaCriada) return;
    
    // Abrir janela de impressão com etiqueta ZPL
    const janelaEtiqueta = window.open('', '_blank', 'width=400,height=600');
    janelaEtiqueta.document.write(gerarHtmlEtiqueta(bobinaCriada));
    janelaEtiqueta.document.close();
}

// Gerar HTML para visualização/impressão da etiqueta
function gerarHtmlEtiqueta(bobina) {
    const zplCode = gerarZPL(bobina);
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Etiqueta - ${bobina.codigo_interno}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                .etiqueta-preview {
                    border: 2px solid #333;
                    padding: 20px;
                    margin: 20px 0;
                    background: white;
                    width: 60mm;
                    height: 30mm;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                }
                .codigo-interno {
                    font-size: 16px;
                    font-weight: bold;
                    margin: 10px 0;
                }
                .info {
                    font-size: 10px;
                    margin: 2px 0;
                }
                textarea {
                    width: 100%;
                    height: 200px;
                    font-family: monospace;
                    font-size: 12px;
                }
                .btn {
                    padding: 10px 20px;
                    margin: 5px;
                    cursor: pointer;
                    border: none;
                    border-radius: 4px;
                    font-size: 14px;
                }
                .btn-primary {
                    background-color: #007bff;
                    color: white;
                }
                .btn-secondary {
                    background-color: #6c757d;
                    color: white;
                }
            </style>
        </head>
        <body>
            <h2>Etiqueta Zebra - ${bobina.codigo_interno}</h2>
            
            <div class="etiqueta-preview">
                <div class="info">CONTROLE DE BOBINAS</div>
                <div style="width: 80px; height: 80px; border: 2px solid #000; display: flex; align-items: center; justify-content: center; margin: 10px 0;">
                    QR CODE
                </div>
                <div class="codigo-interno">${bobina.codigo_interno}</div>
                <div class="info">${bobina.loja} | ${bobina.fabricante}</div>
                <div class="info">${bobina.codigo} | ${bobina.nome_cor}</div>
                <div class="info">${bobina.metragem_inicial}m | NF: ${bobina.nota_fiscal}</div>
            </div>
            
            <h3>Código ZPL (Zebra):</h3>
            <textarea id="zpl-code" readonly>${zplCode}</textarea>
            
            <div style="margin-top: 20px;">
                <button class="btn btn-primary" onclick="copiarZPL()">📋 Copiar Código ZPL</button>
                <button class="btn btn-secondary" onclick="enviarParaImpressora()">🖨️ Enviar para Impressora</button>
                <button class="btn btn-secondary" onclick="window.print()">🖨️ Imprimir Preview</button>
                <button class="btn btn-secondary" onclick="window.close()">✖️ Fechar</button>
            </div>
            
            <div id="mensagem" style="margin-top: 20px;"></div>
            
            <script>
                function copiarZPL() {
                    const zpl = document.getElementById('zpl-code');
                    zpl.select();
                    document.execCommand('copy');
                    document.getElementById('mensagem').innerHTML = '<div style="color: green;">✅ Código ZPL copiado para área de transferência!</div>';
                }
                
                function enviarParaImpressora() {
                    // Aqui você pode implementar a lógica para enviar direto para a impressora Zebra
                    // Por exemplo, usando uma biblioteca como qz-tray ou enviando para um endpoint
                    alert('Para imprimir, copie o código ZPL e cole no software da impressora Zebra, ou use QZ Tray.');
                }
            </script>
        </body>
        </html>
    `;
}

// Gerar código ZPL para impressora Zebra (60x30mm = 236x118 dots a 200dpi)
function gerarZPL(bobina) {
    // Etiqueta 60x30mm a 200dpi
    const zpl = `
^XA
^FO0,0^GB236,118,2^FS

^FO10,5^A0N,15,15^FDCONTROLE DE BOBINAS^FS

^FO60,25^BQN,2,3^FDQA,${bobina.codigo_interno}^FS

^FO10,85^A0N,20,20^FD${bobina.codigo_interno}^FS

^FO10,105^A0N,10,10^FD${bobina.loja} | ${bobina.fabricante}^FS
^FO10,115^A0N,10,10^FD${bobina.codigo} | ${bobina.nome_cor}^FS
^FO10,125^A0N,10,10^FD${bobina.metragem_inicial}m | NF: ${bobina.nota_fiscal}^FS

^XZ
`.trim();
    
    return zpl;
}

// Limpar formulário
function limparFormulario() {
    document.getElementById('form-bobina').reset();
    document.getElementById('produto-encontrado').style.display = 'none';
    document.getElementById('produto-nao-encontrado').style.display = 'none';
    document.getElementById('btn-salvar').disabled = true;
    produtoSelecionado = null;
}

// Carregar estoque (produtos com bobinas)
async function carregarEstoque() {
    try {
        const response = await fetch('/api/bobinas/produtos');
        const data = await response.json();
        
        if (data.success) {
            produtosEstoque = data.data;
            renderizarEstoque(produtosEstoque);
            carregarOpcoesFilros(); // Carregar opções dos filtros dinâmicos
        }
        
    } catch (error) {
        console.error('Erro ao carregar estoque:', error);
        mostrarAlerta('Erro ao carregar estoque', 'danger');
    }
}

// Renderizar lista de produtos (acordeão)
function renderizarEstoque(produtos) {
    const container = document.getElementById('lista-produtos-estoque');
    const emptyState = document.getElementById('empty-estoque');
    
    if (produtos.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    container.innerHTML = produtos.map(produto => `
        <div class="produto-card" id="produto-${produto.id}">
            <div class="produto-header" onclick="toggleProduto(${produto.id})">
                <div class="produto-info">
                    <span class="badge badge-info">🏪 ${produto.loja}</span>
                    <span class="badge badge-secondary">🏭 ${produto.fabricante}</span>
                    <span class="codigo-produto">🔢 ${produto.codigo}</span>
                </div>
                <button class="btn-expand" id="btn-expand-${produto.id}">▼</button>
            </div>
            <div class="produto-specs">
                ${produto.nome_cor} • ${produto.gramatura} • ${produto.tipo_tecido || 'Normal'}
            </div>
            <div class="produto-resumo">
                📊 ${produto.total_bobinas} bobina(s) | ${parseFloat(produto.metragem_disponivel || 0).toFixed(2)}m disponível
            </div>
            <div class="bobinas-lista" id="bobinas-${produto.id}" style="display: none;">
                <div class="loading">Carregando bobinas...</div>
            </div>
        </div>
    `).join('');
}

// Toggle expansão do produto (carregar bobinas)
async function toggleProduto(produtoId) {
    const bobinasContainer = document.getElementById(`bobinas-${produtoId}`);
    const btnExpand = document.getElementById(`btn-expand-${produtoId}`);
    
    if (bobinasContainer.style.display === 'none') {
        // Expandir - carregar bobinas
        bobinasContainer.style.display = 'block';
        btnExpand.textContent = '▲';
        await carregarBobinasProduto(produtoId);
    } else {
        // Colapsar
        bobinasContainer.style.display = 'none';
        btnExpand.textContent = '▼';
    }
}

// Carregar bobinas de um produto
async function carregarBobinasProduto(produtoId) {
    try {
        const response = await fetch(`/api/bobinas/produto/${produtoId}`);
        const data = await response.json();
        
        if (data.success) {
            renderizarBobinas(produtoId, data.data);
        }
        
    } catch (error) {
        console.error('Erro ao carregar bobinas:', error);
        document.getElementById(`bobinas-${produtoId}`).innerHTML = 
            '<div class="alert alert-danger">Erro ao carregar bobinas</div>';
    }
}

// Renderizar bobinas de um produto
function renderizarBobinas(produtoId, bobinas) {
    const container = document.getElementById(`bobinas-${produtoId}`);
    
    if (bobinas.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">Nenhuma bobina encontrada</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="bobinas-header">
            <h4>📦 Bobinas Individuais:</h4>
        </div>
        ${bobinas.map(bobina => {
            const statusClass = bobina.status === 'Disponível' ? 'success' : 
                               bobina.status === 'Em uso' ? 'warning' : 'danger';
            const statusIcon = bobina.status === 'Disponível' ? '🟢' : 
                              bobina.status === 'Em uso' ? '🟡' : '🔴';
            
            return `
                <div class="bobina-item">
                    <div class="bobina-info">
                        <div class="bobina-codigo">
                            <strong>🏷️ ${bobina.codigo_interno}</strong> | 📄 NF: ${bobina.nota_fiscal}
                        </div>
                        <div class="bobina-metragem">
                            📏 ${parseFloat(bobina.metragem_atual).toFixed(2)}m de ${parseFloat(bobina.metragem_inicial).toFixed(2)}m | 
                            ${statusIcon} <span class="badge badge-${statusClass}">${bobina.status}</span>
                        </div>
                        <div class="bobina-data">
                            📅 ${new Date(bobina.data_entrada).toLocaleDateString('pt-BR')} | 
                            💬 ${bobina.observacoes || 'Sem observações'}
                        </div>
                    </div>
                    <div class="bobina-actions">
                        <button class="btn btn-sm btn-secondary" onclick="imprimirEtiquetaBobina('${bobina.codigo_interno}')" title="Imprimir etiqueta">🖨️</button>
                        <button class="btn btn-sm btn-danger" onclick="excluirBobina(${bobina.id})" title="Excluir bobina">🗑️</button>
                    </div>
                </div>
            `;
        }).join('')}
    `;
}

// Imprimir etiqueta de uma bobina específica
async function imprimirEtiquetaBobina(codigoInterno) {
    try {
        const response = await fetch(`/api/bobinas/codigo/${codigoInterno}`);
        const data = await response.json();
        
        if (data.success) {
            bobinaCriada = data.data;
            imprimirEtiqueta();
        } else {
            mostrarAlerta('Bobina não encontrada', 'danger');
        }
        
    } catch (error) {
        console.error('Erro ao buscar bobina:', error);
        mostrarAlerta('Erro ao buscar bobina', 'danger');
    }
}

// Excluir bobina
async function excluirBobina(id) {
    if (!confirm('Tem certeza que deseja excluir esta bobina?')) return;
    
    try {
        const response = await fetch(`/api/bobinas/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('Bobina excluída com sucesso!', 'success');
            carregarEstoque();
        } else {
            mostrarAlerta(data.error || 'Erro ao excluir bobina', 'danger');
        }
        
    } catch (error) {
        console.error('Erro ao excluir bobina:', error);
        mostrarAlerta('Erro ao excluir bobina', 'danger');
    }
}

// === SISTEMA DE FILTROS MULTI-SELECT ===

// Toggle dropdown de filtros
function toggleDropdown(filtroId) {
    const dropdown = document.getElementById(`${filtroId}-dropdown`);
    
    // Fechar outros dropdowns abertos
    document.querySelectorAll('.dropdown-content').forEach(dd => {
        if (dd.id !== `${filtroId}-dropdown`) {
            dd.classList.remove('show');
        }
    });
    
    dropdown.classList.toggle('show');
}

// Fechar dropdowns ao clicar fora
document.addEventListener('click', (e) => {
    if (!e.target.closest('.multi-select-dropdown')) {
        document.querySelectorAll('.dropdown-content').forEach(dd => {
            dd.classList.remove('show');
        });
    }
});

// Toggle "Selecionar Todas" em um filtro
function toggleSelectAll(filtroId) {
    const todasCheckbox = document.getElementById(`${filtroId}-todas`);
    const checkboxes = document.querySelectorAll(`.${filtroId}-checkbox`);
    
    checkboxes.forEach(cb => {
        cb.checked = todasCheckbox.checked;
    });
    
    aplicarFiltrosEstoque(filtroId);
}

// Aplicar filtros de um dropdown específico
function aplicarFiltrosEstoque(filtroId) {
    const todasCheckbox = document.getElementById(`${filtroId}-todas`);
    const checkboxes = document.querySelectorAll(`.${filtroId}-checkbox`);
    const label = document.getElementById(`${filtroId}-label`);
    
    // Verificar quantos itens estão selecionados
    const selecionados = Array.from(checkboxes).filter(cb => cb.checked);
    
    // Atualizar checkbox "todas"
    if (selecionados.length === checkboxes.length) {
        todasCheckbox.checked = true;
    } else {
        todasCheckbox.checked = false;
    }
    
    // Atualizar label do botão
    if (selecionados.length === 0 || selecionados.length === checkboxes.length) {
        const textoTodas = filtroId.includes('loja') || filtroId.includes('cor') || filtroId.includes('gramatura') ? 'Todas' : 'Todos';
        label.textContent = textoTodas;
    } else if (selecionados.length === 1) {
        label.textContent = selecionados[0].nextElementSibling.textContent;
    } else {
        label.textContent = `${selecionados.length} selecionados`;
    }
    
    aplicarTodosFiltrosEstoque();
}

// Aplicar todos os filtros combinados
function aplicarTodosFiltrosEstoque() {
    const termo = document.getElementById('search-estoque').value.toLowerCase();
    
    // Obter valores selecionados de cada filtro
    const lojasSelecionadas = getFiltrosSelecionados('filtro-estoque-loja');
    const statusSelecionados = getFiltrosSelecionados('filtro-estoque-status');
    const coresSelecionadas = getFiltrosSelecionados('filtro-estoque-cor');
    const gramaturasSelecionadas = getFiltrosSelecionados('filtro-estoque-gramatura');
    const fabricantesSelecionados = getFiltrosSelecionados('filtro-estoque-fabricante');
    const tiposSelecionados = getFiltrosSelecionados('filtro-estoque-tipo');
    
    // Filtrar produtos
    const produtosFiltrados = produtosEstoque.filter(produto => {
        // Filtro de busca geral
        const matchBusca = !termo || 
            produto.loja.toLowerCase().includes(termo) ||
            produto.codigo.toLowerCase().includes(termo) ||
            produto.nome_cor.toLowerCase().includes(termo) ||
            produto.gramatura.toLowerCase().includes(termo) ||
            produto.fabricante.toLowerCase().includes(termo);
        
        // Filtros multi-select
        const matchLoja = lojasSelecionadas.length === 0 || lojasSelecionadas.includes(produto.loja);
        const matchCor = coresSelecionadas.length === 0 || coresSelecionadas.includes(produto.nome_cor);
        const matchGramatura = gramaturasSelecionadas.length === 0 || gramaturasSelecionadas.includes(produto.gramatura);
        const matchFabricante = fabricantesSelecionados.length === 0 || fabricantesSelecionados.includes(produto.fabricante);
        const matchTipo = tiposSelecionados.length === 0 || tiposSelecionados.includes(produto.tipo_tecido || 'Normal');
        
        // Note: Status filter will be applied at the bobina level, not product level
        // For now, we'll keep it at product level based on overall stock status
        
        return matchBusca && matchLoja && matchCor && matchGramatura && matchFabricante && matchTipo;
    });
    
    renderizarEstoque(produtosFiltrados);
}

// Obter valores selecionados de um filtro
function getFiltrosSelecionados(filtroId) {
    const checkboxes = document.querySelectorAll(`.${filtroId}-checkbox:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

// Carregar opções dos filtros dinâmicos
function carregarOpcoesFilros() {
    // Extrair valores únicos dos produtos
    const lojas = [...new Set(produtosEstoque.map(p => p.loja))];
    const cores = [...new Set(produtosEstoque.map(p => p.nome_cor))].sort();
    const gramaturas = [...new Set(produtosEstoque.map(p => p.gramatura))].sort();
    const fabricantes = [...new Set(produtosEstoque.map(p => p.fabricante))].sort();
    
    // Popular filtro de loja
    const lojaOpcoes = document.getElementById('filtro-estoque-loja-opcoes');
    lojaOpcoes.innerHTML = lojas.map(loja => `
        <div class="dropdown-item">
            <input type="checkbox" class="filtro-estoque-loja-checkbox" value="${loja}" onchange="aplicarFiltrosEstoque('filtro-estoque-loja')"> 
            <label>${loja}</label>
        </div>
    `).join('');
    
    // Popular filtro de cor
    const corOpcoes = document.getElementById('filtro-estoque-cor-opcoes');
    corOpcoes.innerHTML = cores.map(cor => `
        <div class="dropdown-item">
            <input type="checkbox" class="filtro-estoque-cor-checkbox" value="${cor}" onchange="aplicarFiltrosEstoque('filtro-estoque-cor')"> 
            <label>${cor}</label>
        </div>
    `).join('');
    
    // Popular filtro de gramatura
    const gramaturaOpcoes = document.getElementById('filtro-estoque-gramatura-opcoes');
    gramaturaOpcoes.innerHTML = gramaturas.map(gram => `
        <div class="dropdown-item">
            <input type="checkbox" class="filtro-estoque-gramatura-checkbox" value="${gram}" onchange="aplicarFiltrosEstoque('filtro-estoque-gramatura')"> 
            <label>${gram}</label>
        </div>
    `).join('');
    
    // Popular filtro de fabricante
    const fabricanteOpcoes = document.getElementById('filtro-estoque-fabricante-opcoes');
    fabricanteOpcoes.innerHTML = fabricantes.map(fab => `
        <div class="dropdown-item">
            <input type="checkbox" class="filtro-estoque-fabricante-checkbox" value="${fab}" onchange="aplicarFiltrosEstoque('filtro-estoque-fabricante')"> 
            <label>${fab}</label>
        </div>
    `).join('');
}

// Mostrar alertas
function mostrarAlerta(mensagem, tipo = 'success') {
    const container = document.getElementById('alerta-container');
    const tipoClass = tipo === 'danger' ? 'error' : tipo;
    
    container.innerHTML = `
        <div class="alert alert-${tipoClass}">
            ${mensagem}
        </div>
    `;
    
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}
