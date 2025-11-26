// ======================
// TABS
// ======================
function showTab(tabName) {
    // Esconder todos os conteúdos
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Desativar todos os botões
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Ativar o tab selecionado
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.target.classList.add('active');
    
    // Carregar dados se necessário
    if (tabName === 'cores') {
        carregarCores();
    } else if (tabName === 'gramaturas') {
        carregarGramaturas();
    }
}

// ======================
// CORES
// ======================

// Carregar cores
async function carregarCores() {
    const loading = document.getElementById('loading-cores');
    const table = document.getElementById('table-cores');
    const empty = document.getElementById('empty-cores');
    const tbody = document.getElementById('tbody-cores');
    
    loading.style.display = 'block';
    table.style.display = 'none';
    empty.style.display = 'none';
    
    try {
        const response = await fetch('/api/cores');
        const cores = await response.json();
        
        loading.style.display = 'none';
        
        if (cores.length === 0) {
            empty.style.display = 'block';
        } else {
            table.style.display = 'table';
            tbody.innerHTML = cores.map(cor => `
                <tr>
                    <td>
                        <input type="text" 
                               value="${cor.nome_cor}" 
                               id="cor-nome-${cor.id}"
                               style="border: 1px solid #ddd; padding: 0.5rem; border-radius: 5px; width: 100%;"
                               onchange="atualizarCorInline(${cor.id})">
                    </td>
                    <td>
                        <select id="cor-ativo-${cor.id}" 
                                style="border: 1px solid #ddd; padding: 0.5rem; border-radius: 5px;"
                                onchange="atualizarCorInline(${cor.id})">
                            <option value="1" ${cor.ativo ? 'selected' : ''}>Ativo</option>
                            <option value="0" ${!cor.ativo ? 'selected' : ''}>Inativo</option>
                        </select>
                    </td>
                    <td>${formatarData(cor.data_criacao)}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="excluirCor(${cor.id})">
                            🗑️ Excluir
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        loading.style.display = 'none';
        mostrarAlerta('cores', 'Erro ao carregar cores: ' + error.message, 'danger');
    }
}

// Abrir modal cor
function abrirModalCor(cor = null) {
    const modal = document.getElementById('modal-cor');
    const title = document.getElementById('modal-cor-title');
    const form = document.getElementById('form-cor');
    
    form.reset();
    
    if (cor) {
        title.textContent = 'Editar Cor';
        document.getElementById('cor-id').value = cor.id;
        document.getElementById('cor-nome').value = cor.nome_cor;
        document.getElementById('cor-ativo').checked = cor.ativo;
    } else {
        title.textContent = 'Nova Cor';
        document.getElementById('cor-id').value = '';
    }
    
    modal.classList.add('active');
}

// Fechar modal cor
function fecharModalCor() {
    document.getElementById('modal-cor').classList.remove('active');
}

// Sincronizar color picker com input text - REMOVIDO (não é mais necessário)

// Salvar cor
async function salvarCor(event) {
    event.preventDefault();
    
    const id = document.getElementById('cor-id').value;
    const cor = {
        nome_cor: document.getElementById('cor-nome').value,
        ativo: document.getElementById('cor-ativo').checked
    };
    
    try {
        const url = id ? `/api/cores/${id}` : '/api/cores';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cor)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('cores', id ? 'Cor atualizada com sucesso!' : 'Cor criada com sucesso!', 'success');
            fecharModalCor();
            carregarCores();
        } else {
            mostrarAlerta('cores', data.error || 'Erro ao salvar cor', 'danger');
        }
    } catch (error) {
        mostrarAlerta('cores', 'Erro ao salvar cor: ' + error.message, 'danger');
    }
}

// Atualizar cor inline
async function atualizarCorInline(id) {
    const nome_cor = document.getElementById(`cor-nome-${id}`).value;
    const ativo = document.getElementById(`cor-ativo-${id}`).value === '1';
    
    try {
        const response = await fetch(`/api/cores/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome_cor, ativo })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('cores', 'Cor atualizada com sucesso!', 'success');
        } else {
            mostrarAlerta('cores', data.error || 'Erro ao atualizar cor', 'danger');
            carregarCores(); // Recarregar em caso de erro
        }
    } catch (error) {
        mostrarAlerta('cores', 'Erro ao atualizar cor: ' + error.message, 'danger');
        carregarCores();
    }
}

// Excluir cor
async function excluirCor(id) {
    if (!confirm('Deseja realmente excluir esta cor?')) return;
    
    try {
        const response = await fetch(`/api/cores/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('cores', 'Cor excluída com sucesso!', 'success');
            carregarCores();
        } else {
            mostrarAlerta('cores', data.error || 'Erro ao excluir cor', 'danger');
        }
    } catch (error) {
        mostrarAlerta('cores', 'Erro ao excluir cor: ' + error.message, 'danger');
    }
}

// ======================
// GRAMATURAS
// ======================

// Carregar gramaturas
async function carregarGramaturas() {
    const loading = document.getElementById('loading-gramaturas');
    const table = document.getElementById('table-gramaturas');
    const empty = document.getElementById('empty-gramaturas');
    const tbody = document.getElementById('tbody-gramaturas');
    
    loading.style.display = 'block';
    table.style.display = 'none';
    empty.style.display = 'none';
    
    try {
        const response = await fetch('/api/gramaturas');
        const gramaturas = await response.json();
        
        loading.style.display = 'none';
        
        if (gramaturas.length === 0) {
            empty.style.display = 'block';
        } else {
            table.style.display = 'table';
            tbody.innerHTML = gramaturas.map(gramatura => {
                // Extrair apenas o número da gramatura
                const numero = gramatura.gramatura.replace(/[^\d]/g, '');
                
                return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <input type="number" 
                                   value="${numero}" 
                                   id="gramatura-numero-${gramatura.id}"
                                   style="border: 1px solid #ddd; padding: 0.5rem; border-radius: 5px; width: 120px;"
                                   min="1"
                                   onchange="atualizarGramaturaInline(${gramatura.id})">
                            <span style="font-weight: bold; color: #666;">g/m²</span>
                        </div>
                    </td>
                    <td>
                        <select id="gramatura-ativo-${gramatura.id}" 
                                style="border: 1px solid #ddd; padding: 0.5rem; border-radius: 5px;"
                                onchange="atualizarGramaturaInline(${gramatura.id})">
                            <option value="1" ${gramatura.ativo ? 'selected' : ''}>Ativo</option>
                            <option value="0" ${!gramatura.ativo ? 'selected' : ''}>Inativo</option>
                        </select>
                    </td>
                    <td>${formatarData(gramatura.data_criacao)}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="excluirGramatura(${gramatura.id})">
                            🗑️ Excluir
                        </button>
                    </td>
                </tr>
            `}).join('');
        }
    } catch (error) {
        loading.style.display = 'none';
        mostrarAlerta('gramaturas', 'Erro ao carregar gramaturas: ' + error.message, 'danger');
    }
}

// Abrir modal gramatura
function abrirModalGramatura(gramatura = null) {
    const modal = document.getElementById('modal-gramatura');
    const title = document.getElementById('modal-gramatura-title');
    const form = document.getElementById('form-gramatura');
    
    form.reset();
    
    if (gramatura) {
        title.textContent = 'Editar Gramatura';
        document.getElementById('gramatura-id').value = gramatura.id;
        // Extrair apenas o número
        const numero = gramatura.gramatura.replace(/[^\d]/g, '');
        document.getElementById('gramatura-valor').value = numero;
        document.getElementById('gramatura-ativo').checked = gramatura.ativo;
    } else {
        title.textContent = 'Nova Gramatura';
        document.getElementById('gramatura-id').value = '';
    }
    
    modal.classList.add('active');
}

// Fechar modal gramatura
function fecharModalGramatura() {
    document.getElementById('modal-gramatura').classList.remove('active');
}

// Salvar gramatura
async function salvarGramatura(event) {
    event.preventDefault();
    
    const id = document.getElementById('gramatura-id').value;
    const numero = document.getElementById('gramatura-valor').value;
    const gramatura = {
        gramatura: numero + ' g/m²', // Adicionar unidade automaticamente
        ativo: document.getElementById('gramatura-ativo').checked
    };
    
    try {
        const url = id ? `/api/gramaturas/${id}` : '/api/gramaturas';
        const method = id ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(gramatura)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('gramaturas', id ? 'Gramatura atualizada com sucesso!' : 'Gramatura criada com sucesso!', 'success');
            fecharModalGramatura();
            carregarGramaturas();
        } else {
            mostrarAlerta('gramaturas', data.error || 'Erro ao salvar gramatura', 'danger');
        }
    } catch (error) {
        mostrarAlerta('gramaturas', 'Erro ao salvar gramatura: ' + error.message, 'danger');
    }
}

// Atualizar gramatura inline
async function atualizarGramaturaInline(id) {
    const numero = document.getElementById(`gramatura-numero-${id}`).value;
    const gramatura = numero + ' g/m²';
    const ativo = document.getElementById(`gramatura-ativo-${id}`).value === '1';
    
    try {
        const response = await fetch(`/api/gramaturas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gramatura, ativo })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('gramaturas', 'Gramatura atualizada com sucesso!', 'success');
        } else {
            mostrarAlerta('gramaturas', data.error || 'Erro ao atualizar gramatura', 'danger');
            carregarGramaturas(); // Recarregar em caso de erro
        }
    } catch (error) {
        mostrarAlerta('gramaturas', 'Erro ao atualizar gramatura: ' + error.message, 'danger');
        carregarGramaturas();
    }
}

// Excluir gramatura
async function excluirGramatura(id) {
    if (!confirm('Deseja realmente excluir esta gramatura?')) return;
    
    try {
        const response = await fetch(`/api/gramaturas/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('gramaturas', 'Gramatura excluída com sucesso!', 'success');
            carregarGramaturas();
        } else {
            mostrarAlerta('gramaturas', data.error || 'Erro ao excluir gramatura', 'danger');
        }
    } catch (error) {
        mostrarAlerta('gramaturas', 'Erro ao excluir gramatura: ' + error.message, 'danger');
    }
}

// ======================
// UTILS
// ======================

function mostrarAlerta(tipo, mensagem, classe) {
    const alertDiv = document.getElementById(`alert-${tipo}`);
    alertDiv.innerHTML = `
        <div class="alert alert-${classe}">
            ${mensagem}
        </div>
    `;
    
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 5000);
}

function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR');
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// Carregar dados ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    carregarCores();
});
