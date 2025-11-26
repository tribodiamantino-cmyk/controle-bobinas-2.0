// Estado global
let produtos = [];
let cores = [];
let gramaturas = [];

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarCores();
    carregarGramaturas();
    carregarProdutos();
    
    document.getElementById('form-produto').addEventListener('submit', cadastrarProduto);
});

// Validar largura final
function validarLarguraFinal() {
    const larguraSemCostura = parseFloat(document.getElementById('largura_sem_costura').value);
    const larguraFinal = parseFloat(document.getElementById('largura_final').value);
    const erroMsg = document.getElementById('erro-largura-final');
    
    if (larguraFinal && larguraSemCostura && larguraFinal > larguraSemCostura) {
        erroMsg.style.display = 'block';
        document.getElementById('largura_final').style.borderColor = 'red';
        return false;
    } else {
        erroMsg.style.display = 'none';
        document.getElementById('largura_final').style.borderColor = '';
        return true;
    }
}

// Alternar campos conforme tipo de tecido
function toggleCamposTecido() {
    const tipoTecido = document.getElementById('tipo_tecido').value;
    const camposNormal = document.getElementById('campos-normal');
    const camposBandoY = document.getElementById('campos-bando-y');
    
    if (tipoTecido === 'Bando Y') {
        camposNormal.style.display = 'none';
        camposBandoY.style.display = 'grid';
        
        // Remover required dos campos normais
        document.getElementById('largura_sem_costura').removeAttribute('required');
        document.getElementById('tipo_bainha').removeAttribute('required');
        document.getElementById('largura_final').removeAttribute('required');
        
        // Adicionar required aos campos Bando Y
        document.getElementById('largura_maior').setAttribute('required', 'required');
        document.getElementById('largura_y').setAttribute('required', 'required');
    } else {
        camposNormal.style.display = 'grid';
        camposBandoY.style.display = 'none';
        
        // Adicionar required aos campos normais
        document.getElementById('largura_sem_costura').setAttribute('required', 'required');
        document.getElementById('tipo_bainha').setAttribute('required', 'required');
        document.getElementById('largura_final').setAttribute('required', 'required');
        
        // Remover required dos campos Bando Y
        document.getElementById('largura_maior').removeAttribute('required');
        document.getElementById('largura_y').removeAttribute('required');
    }
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

// Carregar cores para o select
async function carregarCores() {
    try {
        const response = await fetch('/api/cores');
        const data = await response.json();
        
        if (data.success) {
            cores = data.data;
            const select = document.getElementById('cor_id');
            select.innerHTML = '<option value="">Selecione...</option>' +
                cores.map(cor => `<option value="${cor.id}">${cor.nome_cor}</option>`).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar cores:', error);
    }
}

// Carregar gramaturas para o select
async function carregarGramaturas() {
    try {
        const response = await fetch('/api/gramaturas');
        const data = await response.json();
        
        if (data.success) {
            gramaturas = data.data;
            const select = document.getElementById('gramatura_id');
            select.innerHTML = '<option value="">Selecione...</option>' +
                gramaturas.map(g => `<option value="${g.id}">${g.gramatura}</option>`).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar gramaturas:', error);
    }
}

// Carregar produtos
async function carregarProdutos() {
    try {
        const response = await fetch('/api/produtos');
        const data = await response.json();
        
        if (data.success) {
            produtos = data.data;
            popularFiltros();
            renderizarProdutos(produtos);
        } else {
            mostrarAlerta(data.error || 'Erro ao carregar produtos', 'danger');
        }
    } catch (error) {
        mostrarAlerta('Erro ao carregar produtos: ' + error.message, 'danger');
    }
}

// Popular filtros com valores únicos
function popularFiltros() {
    // Extrair valores únicos
    const lojas = [...new Set(produtos.map(p => p.loja))].sort();
    const coresUnicas = [...new Set(produtos.map(p => p.nome_cor))].sort();
    const gramaturasUnicas = [...new Set(produtos.map(p => p.gramatura))].sort();
    const fabricantes = [...new Set(produtos.map(p => p.fabricante))].sort();
    
    // Popular select de lojas
    const filtroLoja = document.getElementById('filtro-loja');
    filtroLoja.innerHTML = '<option value="">Todas</option>' +
        lojas.map(loja => `<option value="${loja}">${loja}</option>`).join('');
    
    // Popular select de cores
    const filtroCor = document.getElementById('filtro-cor');
    filtroCor.innerHTML = '<option value="">Todas</option>' +
        coresUnicas.map(cor => `<option value="${cor}">${cor}</option>`).join('');
    
    // Popular select de gramaturas
    const filtroGramatura = document.getElementById('filtro-gramatura');
    filtroGramatura.innerHTML = '<option value="">Todas</option>' +
        gramaturasUnicas.map(g => `<option value="${g}">${g}</option>`).join('');
    
    // Popular select de fabricantes
    const filtroFabricante = document.getElementById('filtro-fabricante');
    filtroFabricante.innerHTML = '<option value="">Todos</option>' +
        fabricantes.map(f => `<option value="${f}">${f}</option>`).join('');
}

// Aplicar filtros em cascata
function aplicarFiltros() {
    const filtroLoja = document.getElementById('filtro-loja').value.toLowerCase();
    const filtroCodigo = document.getElementById('filtro-codigo').value.toLowerCase();
    const filtroCor = document.getElementById('filtro-cor').value.toLowerCase();
    const filtroGramatura = document.getElementById('filtro-gramatura').value.toLowerCase();
    const filtroFabricante = document.getElementById('filtro-fabricante').value.toLowerCase();
    const filtroTipo = document.getElementById('filtro-tipo').value;
    const filtroStatus = document.getElementById('filtro-status').value;
    
    let produtosFiltrados = produtos.filter(produto => {
        // Filtro de loja
        if (filtroLoja && produto.loja.toLowerCase() !== filtroLoja) return false;
        
        // Filtro de código
        if (filtroCodigo && !produto.codigo.toLowerCase().includes(filtroCodigo)) return false;
        
        // Filtro de cor
        if (filtroCor && produto.nome_cor.toLowerCase() !== filtroCor) return false;
        
        // Filtro de gramatura
        if (filtroGramatura && produto.gramatura.toLowerCase() !== filtroGramatura) return false;
        
        // Filtro de fabricante
        if (filtroFabricante && produto.fabricante.toLowerCase() !== filtroFabricante) return false;
        
        // Filtro de tipo
        if (filtroTipo && produto.tipo_tecido !== filtroTipo) return false;
        
        // Filtro de status
        if (filtroStatus !== '' && produto.ativo !== parseInt(filtroStatus)) return false;
        
        return true;
    });
    
    renderizarProdutos(produtosFiltrados);
    
    // Atualizar opções em cascata
    atualizarFiltrosCascata(produtosFiltrados);
}

// Atualizar opções dos filtros baseado nos produtos filtrados
function atualizarFiltrosCascata(produtosFiltrados) {
    const filtroLojaAtual = document.getElementById('filtro-loja').value;
    const filtroCorAtual = document.getElementById('filtro-cor').value;
    const filtroGramaturaAtual = document.getElementById('filtro-gramatura').value;
    const filtroFabricanteAtual = document.getElementById('filtro-fabricante').value;
    
    // Se houver loja selecionada, atualizar outras opções
    if (filtroLojaAtual) {
        const coresDisponiveis = [...new Set(produtosFiltrados.map(p => p.nome_cor))].sort();
        const gramaturasDisponiveis = [...new Set(produtosFiltrados.map(p => p.gramatura))].sort();
        const fabricantesDisponiveis = [...new Set(produtosFiltrados.map(p => p.fabricante))].sort();
        
        // Atualizar cores
        const filtroCor = document.getElementById('filtro-cor');
        const corSelecionada = filtroCor.value;
        filtroCor.innerHTML = '<option value="">Todas</option>' +
            coresDisponiveis.map(cor => `<option value="${cor}" ${cor === corSelecionada ? 'selected' : ''}>${cor}</option>`).join('');
        
        // Atualizar gramaturas
        const filtroGramatura = document.getElementById('filtro-gramatura');
        const gramaturaSelecionada = filtroGramatura.value;
        filtroGramatura.innerHTML = '<option value="">Todas</option>' +
            gramaturasDisponiveis.map(g => `<option value="${g}" ${g === gramaturaSelecionada ? 'selected' : ''}>${g}</option>`).join('');
        
        // Atualizar fabricantes
        const filtroFabricante = document.getElementById('filtro-fabricante');
        const fabricanteSelecionado = filtroFabricante.value;
        filtroFabricante.innerHTML = '<option value="">Todos</option>' +
            fabricantesDisponiveis.map(f => `<option value="${f}" ${f === fabricanteSelecionado ? 'selected' : ''}>${f}</option>`).join('');
    }
}

// Renderizar tabela de produtos
function renderizarProdutos(listaProdutos) {
    const tbody = document.getElementById('lista-produtos');
    const emptyState = document.getElementById('empty-produtos');
    const table = document.getElementById('tabela-produtos');
    
    if (listaProdutos.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
    
    tbody.innerHTML = listaProdutos.map(produto => {
        // Valores para cada coluna de medida
        const largSemCostura = produto.tipo_tecido === 'Normal' ? (produto.largura_sem_costura || '-') : '-';
        const tipoBainha = produto.tipo_tecido === 'Normal' ? (produto.tipo_bainha || '-') : '-';
        const largFinal = produto.tipo_tecido === 'Normal' ? (produto.largura_final || '-') : '-';
        const largMaior = produto.tipo_tecido === 'Bando Y' ? (produto.largura_maior || '-') : '-';
        const largY = produto.tipo_tecido === 'Bando Y' ? (produto.largura_y || '-') : '-';
        
        return `
        <tr>
            <td>${produto.loja}</td>
            <td>${produto.codigo}</td>
            <td>${produto.nome_cor}</td>
            <td>${produto.gramatura}</td>
            <td>${produto.fabricante}</td>
            <td>${produto.tipo_tecido || 'Normal'}</td>
            <td>${largSemCostura}</td>
            <td>${tipoBainha}</td>
            <td>${largFinal}</td>
            <td>${largMaior}</td>
            <td>${largY}</td>
            <td>
                <span class="badge ${produto.ativo ? 'badge-success' : 'badge-danger'}">
                    ${produto.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="excluirProduto(${produto.id})">🗑️</button>
            </td>
        </tr>
    `}).join('');
}

// Cadastrar novo produto
async function cadastrarProduto(e) {
    e.preventDefault();
    
    const tipoTecido = document.getElementById('tipo_tecido').value;
    
    // Validar largura final se for tecido normal
    if (tipoTecido !== 'Bando Y' && !validarLarguraFinal()) {
        mostrarAlerta('Largura final não pode ser maior que largura sem costura', 'danger');
        return;
    }
    
    const produto = {
        loja: document.getElementById('loja').value,
        codigo: document.getElementById('codigo').value,
        cor_id: parseInt(document.getElementById('cor_id').value),
        gramatura_id: parseInt(document.getElementById('gramatura_id').value),
        fabricante: document.getElementById('fabricante').value,
        tipo_tecido: tipoTecido
    };
    
    // Adicionar campos específicos conforme o tipo
    if (tipoTecido === 'Bando Y') {
        produto.largura_maior = parseFloat(document.getElementById('largura_maior').value);
        produto.largura_y = parseFloat(document.getElementById('largura_y').value);
    } else {
        produto.largura_sem_costura = parseFloat(document.getElementById('largura_sem_costura').value);
        produto.tipo_bainha = document.getElementById('tipo_bainha').value;
        produto.largura_final = parseFloat(document.getElementById('largura_final').value);
    }
    
    try {
        const response = await fetch('/api/produtos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produto)
        });
        
        const data = await response.json();
        
        console.log('Resposta do servidor:', response.status, data);
        
        if (response.ok) {
            mostrarAlerta('Produto cadastrado com sucesso!', 'success');
            
            // Limpar formulário completamente
            document.getElementById('form-produto').reset();
            
            // Resetar tipo de tecido para Normal e mostrar campos corretos
            document.getElementById('tipo_tecido').value = 'Normal';
            toggleCamposTecido();
            
            // Recarregar lista de produtos
            carregarProdutos();
        } else {
            console.error('Erro detalhado:', data);
            mostrarAlerta(data.error || 'Erro ao cadastrar produto', 'danger');
        }
    } catch (error) {
        console.error('Erro na requisição:', error);
        mostrarAlerta('Erro ao cadastrar produto: ' + error.message, 'danger');
    }
}

// Editar campo (click-to-edit pattern)
function editarCampo(id, campo) {
    const display = document.getElementById(`display-${campo}-${id}`);
    const edit = document.getElementById(`edit-${campo}-${id}`);
    
    if (display && edit) {
        display.style.display = 'none';
        edit.style.display = 'inline-block';
        edit.focus();
    }
}

// Cancelar edição
function cancelarEdicao(id, campo) {
    const display = document.getElementById(`display-${campo}-${id}`);
    const edit = document.getElementById(`edit-${campo}-${id}`);
    
    if (display && edit) {
        display.style.display = 'inline';
        edit.style.display = 'none';
        carregarProdutos(); // Recarregar para reverter mudanças
    }
}

// Salvar campo editado
async function salvarCampo(id, campo) {
    const edit = document.getElementById(`edit-${campo}-${id}`);
    let novoValor = edit.value;
    
    // Encontrar produto atual
    const produto = produtos.find(p => p.id === id);
    if (!produto) return;
    
    // Preparar dados para atualização
    const dadosAtualizacao = {
        loja: produto.loja,
        codigo: produto.codigo,
        cor_id: produto.cor_id,
        gramatura_id: produto.gramatura_id,
        fabricante: produto.fabricante,
        largura_sem_costura: produto.largura_sem_costura,
        tipo_bainha: produto.tipo_bainha,
        largura_final: produto.largura_final,
        ativo: produto.ativo
    };
    
    // Atualizar campo específico
    if (campo === 'cor_id' || campo === 'gramatura_id') {
        dadosAtualizacao[campo] = parseInt(novoValor);
    } else if (campo === 'largura_sem_costura' || campo === 'largura_final') {
        dadosAtualizacao[campo] = parseFloat(novoValor);
    } else {
        dadosAtualizacao[campo] = novoValor;
    }
    
    try {
        const response = await fetch(`/api/produtos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosAtualizacao)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('Produto atualizado com sucesso!', 'success');
            carregarProdutos();
        } else {
            mostrarAlerta(data.error || 'Erro ao atualizar produto', 'danger');
            carregarProdutos(); // Recarregar em caso de erro
        }
    } catch (error) {
        mostrarAlerta('Erro ao atualizar produto: ' + error.message, 'danger');
        carregarProdutos();
    }
}

// Excluir produto
async function excluirProduto(id) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/produtos/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('Produto excluído com sucesso!', 'success');
            carregarProdutos();
        } else {
            mostrarAlerta(data.error || 'Erro ao excluir produto', 'danger');
        }
    } catch (error) {
        mostrarAlerta('Erro ao excluir produto: ' + error.message, 'danger');
    }
}

// Filtrar produtos (mantido para compatibilidade com search box)
function filtrarProdutos() {
    const termo = document.getElementById('search-produtos').value.toLowerCase();
    
    const produtosFiltrados = produtos.filter(produto => 
        produto.loja.toLowerCase().includes(termo) ||
        produto.codigo.toLowerCase().includes(termo) ||
        produto.nome_cor.toLowerCase().includes(termo) ||
        produto.gramatura.toLowerCase().includes(termo) ||
        produto.fabricante.toLowerCase().includes(termo)
    );
    
    renderizarProdutos(produtosFiltrados);
}
