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
    
    // Fechar dropdowns ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.multi-select-dropdown')) {
            document.querySelectorAll('.dropdown-content').forEach(dropdown => {
                dropdown.classList.remove('show');
            });
        }
    });
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
    
    // Popular filtro de lojas
    popularFiltroMultiplo('filtro-loja', lojas);
    
    // Popular filtro de cores
    popularFiltroMultiplo('filtro-cor', coresUnicas);
    
    // Popular filtro de gramaturas
    popularFiltroMultiplo('filtro-gramatura', gramaturasUnicas);
    
    // Popular filtro de fabricantes
    popularFiltroMultiplo('filtro-fabricante', fabricantes);
}

// Popular um filtro multi-select
function popularFiltroMultiplo(filtroId, opcoes) {
    const container = document.getElementById(`${filtroId}-opcoes`);
    if (!container) return;
    
    container.innerHTML = opcoes.map((opcao, index) => `
        <div class="dropdown-item">
            <input type="checkbox" class="${filtroId}-checkbox" id="${filtroId}-${index}" value="${opcao}" onchange="aplicarFiltrosMultiplos('${filtroId}')"> 
            <label for="${filtroId}-${index}">${opcao}</label>
        </div>
    `).join('');
}

// Toggle dropdown de filtro
function toggleDropdown(filtroId) {
    event.stopPropagation();
    const dropdown = document.getElementById(`${filtroId}-dropdown`);
    
    // Fechar outros dropdowns
    document.querySelectorAll('.dropdown-content').forEach(d => {
        if (d.id !== `${filtroId}-dropdown`) {
            d.classList.remove('show');
        }
    });
    
    // Toggle atual
    dropdown.classList.toggle('show');
}

// Toggle "Selecionar todas"
function toggleSelectAll(filtroId) {
    const todasCheckbox = document.getElementById(`${filtroId}-todas`);
    const checkboxes = document.querySelectorAll(`.${filtroId}-checkbox`);
    
    if (todasCheckbox.checked) {
        checkboxes.forEach(cb => {
            cb.checked = false;
        });
    }
    
    aplicarFiltrosMultiplos(filtroId);
}

// Aplicar filtros com seleção múltipla
function aplicarFiltrosMultiplos(filtroId) {
    const todasCheckbox = document.getElementById(`${filtroId}-todas`);
    const checkboxes = document.querySelectorAll(`.${filtroId}-checkbox`);
    const checkedValues = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    // Atualizar label do botão
    const label = document.getElementById(`${filtroId}-label`);
    if (checkedValues.length === 0) {
        todasCheckbox.checked = true;
        label.textContent = filtroId.includes('fabricante') || filtroId.includes('status') || filtroId.includes('tipo') ? 'Todos' : 'Todas';
    } else {
        todasCheckbox.checked = false;
        label.textContent = checkedValues.length === 1 ? checkedValues[0] : `${checkedValues.length} selecionados`;
    }
    
    aplicarFiltros();
}

// Aplicar filtros em cascata
function aplicarFiltros() {
    // Filtros de texto
    const filtroCodigo = document.getElementById('filtro-codigo').value.toLowerCase();
    const filtroLargSemCostura = document.getElementById('filtro-larg-sem-costura').value.toLowerCase();
    const filtroLargFinal = document.getElementById('filtro-larg-final').value.toLowerCase();
    const filtroLargMaior = document.getElementById('filtro-larg-maior').value.toLowerCase();
    const filtroLargY = document.getElementById('filtro-larg-y').value.toLowerCase();
    
    // Filtros multi-select
    const lojasCheckboxes = document.querySelectorAll('.filtro-loja-checkbox:checked');
    const lojaSelecionadas = Array.from(lojasCheckboxes).map(cb => cb.value.toLowerCase());
    
    const coresCheckboxes = document.querySelectorAll('.filtro-cor-checkbox:checked');
    const coresSelecionadas = Array.from(coresCheckboxes).map(cb => cb.value.toLowerCase());
    
    const gramaturasCheckboxes = document.querySelectorAll('.filtro-gramatura-checkbox:checked');
    const gramaturasSelecionadas = Array.from(gramaturasCheckboxes).map(cb => cb.value.toLowerCase());
    
    const fabricantesCheckboxes = document.querySelectorAll('.filtro-fabricante-checkbox:checked');
    const fabricantesSelecionados = Array.from(fabricantesCheckboxes).map(cb => cb.value.toLowerCase());
    
    const tiposCheckboxes = document.querySelectorAll('.filtro-tipo-checkbox:checked');
    const tiposSelecionados = Array.from(tiposCheckboxes).map(cb => cb.value);
    
    const bainhasCheckboxes = document.querySelectorAll('.filtro-bainha-checkbox:checked');
    const bainhasSelecionadas = Array.from(bainhasCheckboxes).map(cb => cb.value.toLowerCase());
    
    const statusCheckboxes = document.querySelectorAll('.filtro-status-checkbox:checked');
    const statusSelecionados = Array.from(statusCheckboxes).map(cb => cb.value);
    
    let produtosFiltrados = produtos.filter(produto => {
        // Filtro de loja (multi-select)
        if (lojaSelecionadas.length > 0 && !lojaSelecionadas.includes(produto.loja.toLowerCase())) return false;
        
        // Filtro de código (texto)
        if (filtroCodigo && !produto.codigo.toLowerCase().includes(filtroCodigo)) return false;
        
        // Filtro de cor (multi-select)
        if (coresSelecionadas.length > 0 && !coresSelecionadas.includes(produto.nome_cor.toLowerCase())) return false;
        
        // Filtro de gramatura (multi-select)
        if (gramaturasSelecionadas.length > 0 && !gramaturasSelecionadas.includes(produto.gramatura.toLowerCase())) return false;
        
        // Filtro de fabricante (multi-select)
        if (fabricantesSelecionados.length > 0 && !fabricantesSelecionados.includes(produto.fabricante.toLowerCase())) return false;
        
        // Filtro de tipo (multi-select)
        if (tiposSelecionados.length > 0 && !tiposSelecionados.includes(produto.tipo_tecido)) return false;
        
        // Filtro de largura sem costura (texto)
        if (filtroLargSemCostura && produto.largura_sem_costura) {
            if (!produto.largura_sem_costura.toString().includes(filtroLargSemCostura)) return false;
        }
        
        // Filtro de tipo bainha (multi-select)
        if (bainhasSelecionadas.length > 0 && produto.tipo_bainha) {
            if (!bainhasSelecionadas.includes(produto.tipo_bainha.toLowerCase())) return false;
        }
        
        // Filtro de largura final (texto)
        if (filtroLargFinal && produto.largura_final) {
            if (!produto.largura_final.toString().includes(filtroLargFinal)) return false;
        }
        
        // Filtro de largura maior (texto)
        if (filtroLargMaior && produto.largura_maior) {
            if (!produto.largura_maior.toString().includes(filtroLargMaior)) return false;
        }
        
        // Filtro de largura Y (texto)
        if (filtroLargY && produto.largura_y) {
            if (!produto.largura_y.toString().includes(filtroLargY)) return false;
        }
        
        // Filtro de status (multi-select)
        if (statusSelecionados.length > 0 && !statusSelecionados.includes(produto.ativo.toString())) return false;
        
        return true;
    });
    
    renderizarProdutos(produtosFiltrados);
}

// Atualizar opções dos filtros baseado nos produtos filtrados (removido - não precisa mais em cascata)
function atualizarFiltrosCascata(produtosFiltrados) {
    // Função mantida para compatibilidade, mas não faz nada
    // Os filtros agora são independentes
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
        
        // Indicador de metragem confiável
        const badgeConfiavel = produto.metragem_confiavel ? 
            '<span class="badge badge-info" title="Metragens precisas do fornecedor">✓ Precisa</span>' : '';
        
        return `
        <tr>
            <td>${produto.loja}</td>
            <td>${produto.codigo}</td>
            <td>${produto.nome_cor}</td>
            <td>${produto.gramatura}</td>
            <td>${produto.fabricante} ${badgeConfiavel}</td>
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
        tipo_tecido: tipoTecido,
        metragem_confiavel: document.getElementById('metragem_confiavel').checked
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
        metragem_confiavel: produto.metragem_confiavel,
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
