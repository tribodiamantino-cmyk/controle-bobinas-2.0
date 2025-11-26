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

// Mostrar alertas
function mostrarAlerta(mensagem, tipo = 'success') {
    const container = document.getElementById('alerta-container');
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo}`;
    alerta.textContent = mensagem;
    
    container.innerHTML = '';
    container.appendChild(alerta);
    
    setTimeout(() => alerta.remove(), 5000);
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
    
    if (listaProdutos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">Nenhum produto encontrado</td></tr>';
        return;
    }
    
    tbody.innerHTML = listaProdutos.map(produto => `
        <tr>
            <td>
                <span class="campo-display" id="display-loja-${produto.id}">${produto.loja}</span>
                <select class="campo-edit" id="edit-loja-${produto.id}" style="display: none;" 
                        onblur="salvarCampo(${produto.id}, 'loja')"
                        onkeydown="if(event.key==='Escape') cancelarEdicao(${produto.id}, 'loja')">
                    <option value="Cortinave" ${produto.loja === 'Cortinave' ? 'selected' : ''}>Cortinave</option>
                    <option value="BN" ${produto.loja === 'BN' ? 'selected' : ''}>BN</option>
                </select>
                <button class="btn-edit" onclick="editarCampo(${produto.id}, 'loja')">✏️</button>
            </td>
            <td>
                <span class="campo-display" id="display-codigo-${produto.id}">${produto.codigo}</span>
                <input type="text" class="campo-edit" id="edit-codigo-${produto.id}" 
                       value="${produto.codigo}" style="display: none;"
                       onblur="salvarCampo(${produto.id}, 'codigo')"
                       onkeydown="if(event.key==='Enter') salvarCampo(${produto.id}, 'codigo'); if(event.key==='Escape') cancelarEdicao(${produto.id}, 'codigo')">
                <button class="btn-edit" onclick="editarCampo(${produto.id}, 'codigo')">✏️</button>
            </td>
            <td>
                <span class="campo-display" id="display-cor_id-${produto.id}">${produto.nome_cor}</span>
                <select class="campo-edit" id="edit-cor_id-${produto.id}" style="display: none;"
                        onblur="salvarCampo(${produto.id}, 'cor_id')"
                        onkeydown="if(event.key==='Escape') cancelarEdicao(${produto.id}, 'cor_id')">
                    ${cores.map(cor => `<option value="${cor.id}" ${produto.cor_id === cor.id ? 'selected' : ''}>${cor.nome_cor}</option>`).join('')}
                </select>
                <button class="btn-edit" onclick="editarCampo(${produto.id}, 'cor_id')">✏️</button>
            </td>
            <td>
                <span class="campo-display" id="display-gramatura_id-${produto.id}">${produto.gramatura}</span>
                <select class="campo-edit" id="edit-gramatura_id-${produto.id}" style="display: none;"
                        onblur="salvarCampo(${produto.id}, 'gramatura_id')"
                        onkeydown="if(event.key==='Escape') cancelarEdicao(${produto.id}, 'gramatura_id')">
                    ${gramaturas.map(g => `<option value="${g.id}" ${produto.gramatura_id === g.id ? 'selected' : ''}>${g.gramatura}</option>`).join('')}
                </select>
                <button class="btn-edit" onclick="editarCampo(${produto.id}, 'gramatura_id')">✏️</button>
            </td>
            <td>
                <span class="campo-display" id="display-fabricante-${produto.id}">${produto.fabricante}</span>
                <select class="campo-edit" id="edit-fabricante-${produto.id}" style="display: none;"
                        onblur="salvarCampo(${produto.id}, 'fabricante')"
                        onkeydown="if(event.key==='Escape') cancelarEdicao(${produto.id}, 'fabricante')">
                    <option value="Propex" ${produto.fabricante === 'Propex' ? 'selected' : ''}>Propex</option>
                    <option value="Textiloeste" ${produto.fabricante === 'Textiloeste' ? 'selected' : ''}>Textiloeste</option>
                </select>
                <button class="btn-edit" onclick="editarCampo(${produto.id}, 'fabricante')">✏️</button>
            </td>
            <td>
                <span class="campo-display" id="display-largura_sem_costura-${produto.id}">${produto.largura_sem_costura} cm</span>
                <input type="number" class="campo-edit" id="edit-largura_sem_costura-${produto.id}" 
                       value="${produto.largura_sem_costura}" style="display: none;" step="0.01"
                       onblur="salvarCampo(${produto.id}, 'largura_sem_costura')"
                       onkeydown="if(event.key==='Enter') salvarCampo(${produto.id}, 'largura_sem_costura'); if(event.key==='Escape') cancelarEdicao(${produto.id}, 'largura_sem_costura')">
                <button class="btn-edit" onclick="editarCampo(${produto.id}, 'largura_sem_costura')">✏️</button>
            </td>
            <td>
                <span class="campo-display" id="display-tipo_bainha-${produto.id}">${produto.tipo_bainha}</span>
                <select class="campo-edit" id="edit-tipo_bainha-${produto.id}" style="display: none;"
                        onblur="salvarCampo(${produto.id}, 'tipo_bainha')"
                        onkeydown="if(event.key==='Escape') cancelarEdicao(${produto.id}, 'tipo_bainha')">
                    <option value="Cano/Cano" ${produto.tipo_bainha === 'Cano/Cano' ? 'selected' : ''}>Cano/Cano</option>
                    <option value="Cano/Arame" ${produto.tipo_bainha === 'Cano/Arame' ? 'selected' : ''}>Cano/Arame</option>
                    <option value="Arame/Arame" ${produto.tipo_bainha === 'Arame/Arame' ? 'selected' : ''}>Arame/Arame</option>
                </select>
                <button class="btn-edit" onclick="editarCampo(${produto.id}, 'tipo_bainha')">✏️</button>
            </td>
            <td>
                <span class="campo-display" id="display-largura_final-${produto.id}">${produto.largura_final} cm</span>
                <input type="number" class="campo-edit" id="edit-largura_final-${produto.id}" 
                       value="${produto.largura_final}" style="display: none;" step="0.01"
                       onblur="salvarCampo(${produto.id}, 'largura_final')"
                       onkeydown="if(event.key==='Enter') salvarCampo(${produto.id}, 'largura_final'); if(event.key==='Escape') cancelarEdicao(${produto.id}, 'largura_final')">
                <button class="btn-edit" onclick="editarCampo(${produto.id}, 'largura_final')">✏️</button>
            </td>
            <td>
                <span class="badge ${produto.ativo ? 'badge-success' : 'badge-danger'}">
                    ${produto.ativo ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="excluirProduto(${produto.id})">🗑️</button>
            </td>
        </tr>
    `).join('');
}

// Cadastrar novo produto
async function cadastrarProduto(e) {
    e.preventDefault();
    
    const produto = {
        loja: document.getElementById('loja').value,
        codigo: document.getElementById('codigo').value,
        cor_id: parseInt(document.getElementById('cor_id').value),
        gramatura_id: parseInt(document.getElementById('gramatura_id').value),
        fabricante: document.getElementById('fabricante').value,
        largura_sem_costura: parseFloat(document.getElementById('largura_sem_costura').value),
        tipo_bainha: document.getElementById('tipo_bainha').value,
        largura_final: parseFloat(document.getElementById('largura_final').value)
    };
    
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
