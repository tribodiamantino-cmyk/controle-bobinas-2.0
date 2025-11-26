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
        document.getElementById('largura_total').setAttribute('required', 'required');
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
        document.getElementById('largura_total').removeAttribute('required');
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
            renderizarProdutos(produtos);
        } else {
            mostrarAlerta(data.error || 'Erro ao carregar produtos', 'danger');
        }
    } catch (error) {
        mostrarAlerta('Erro ao carregar produtos: ' + error.message, 'danger');
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
        // Montar informações de medidas conforme o tipo
        let medidas = '';
        if (produto.tipo_tecido === 'Bando Y') {
            medidas = `Maior: ${produto.largura_maior || '-'} cm<br>Y: ${produto.largura_y || '-'} cm<br>Total: ${produto.largura_total || '-'} cm`;
        } else {
            medidas = `S/Costura: ${produto.largura_sem_costura || '-'} cm<br>${produto.tipo_bainha || '-'}<br>Final: ${produto.largura_final || '-'} cm`;
        }
        
        return `
        <tr>
            <td>${produto.loja}</td>
            <td>${produto.codigo}</td>
            <td>${produto.nome_cor}</td>
            <td>${produto.gramatura}</td>
            <td>${produto.fabricante}</td>
            <td>${produto.tipo_tecido || 'Normal'}</td>
            <td style="font-size: 0.85rem;">${medidas}</td>
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
        produto.largura_total = parseFloat(document.getElementById('largura_total').value);
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
        
        if (response.ok) {
            mostrarAlerta('Produto cadastrado com sucesso!', 'success');
            document.getElementById('form-produto').reset();
            toggleCamposTecido(); // Reset campos dinâmicos
            carregarProdutos();
        } else {
            mostrarAlerta(data.error || 'Erro ao cadastrar produto', 'danger');
        }
    } catch (error) {
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

// Filtrar produtos
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
