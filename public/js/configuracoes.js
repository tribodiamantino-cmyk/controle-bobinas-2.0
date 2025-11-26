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
                        <span class="color-preview" style="background-color: ${cor.codigo_hex}"></span>
                        ${cor.codigo_hex}
                    </td>
                    <td><strong>${cor.nome_cor}</strong></td>
                    <td>
                        ${cor.ativo ? 
                            '<span class="badge badge-success">Ativo</span>' : 
                            '<span class="badge badge-danger">Inativo</span>'
                        }
                    </td>
                    <td>${formatarData(cor.data_criacao)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick='editarCor(${JSON.stringify(cor)})'>
                            ✏️ Editar
                        </button>
                        ${cor.ativo ? 
                            `<button class="btn btn-sm btn-warning" onclick="desativarCor(${cor.id})">
                                🚫 Desativar
                            </button>` :
                            `<button class="btn btn-sm btn-success" onclick="ativarCor(${cor.id})">
                                ✅ Ativar
                            </button>`
                        }
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
        document.getElementById('cor-codigo').value = cor.codigo_hex;
        document.getElementById('cor-codigo-text').value = cor.codigo_hex;
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

// Sincronizar color picker com input text
document.addEventListener('DOMContentLoaded', () => {
    const colorPicker = document.getElementById('cor-codigo');
    const colorText = document.getElementById('cor-codigo-text');
    
    if (colorPicker && colorText) {
        colorPicker.addEventListener('input', (e) => {
            colorText.value = e.target.value.toUpperCase();
        });
        
        colorText.addEventListener('input', (e) => {
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                colorPicker.value = e.target.value;
            }
        });
    }
});

// Salvar cor
async function salvarCor(event) {
    event.preventDefault();
    
    const id = document.getElementById('cor-id').value;
    const cor = {
        nome_cor: document.getElementById('cor-nome').value,
        codigo_hex: document.getElementById('cor-codigo-text').value,
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

// Editar cor
function editarCor(cor) {
    abrirModalCor(cor);
}

// Desativar cor
async function desativarCor(id) {
    if (!confirm('Deseja realmente desativar esta cor?')) return;
    
    try {
        const response = await fetch(`/api/cores/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('cores', 'Cor desativada com sucesso!', 'success');
            carregarCores();
        } else {
            mostrarAlerta('cores', data.error || 'Erro ao desativar cor', 'danger');
        }
    } catch (error) {
        mostrarAlerta('cores', 'Erro ao desativar cor: ' + error.message, 'danger');
    }
}

// Ativar cor
async function ativarCor(id) {
    try {
        const response = await fetch(`/api/cores/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ativo: true })
        });
        
        if (response.ok) {
            mostrarAlerta('cores', 'Cor ativada com sucesso!', 'success');
            carregarCores();
        } else {
            mostrarAlerta('cores', 'Erro ao ativar cor', 'danger');
        }
    } catch (error) {
        mostrarAlerta('cores', 'Erro ao ativar cor: ' + error.message, 'danger');
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
            tbody.innerHTML = gramaturas.map(gramatura => `
                <tr>
                    <td><strong>${gramatura.gramatura}</strong></td>
                    <td>
                        ${gramatura.ativo ? 
                            '<span class="badge badge-success">Ativo</span>' : 
                            '<span class="badge badge-danger">Inativo</span>'
                        }
                    </td>
                    <td>${formatarData(gramatura.data_criacao)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick='editarGramatura(${JSON.stringify(gramatura)})'>
                            ✏️ Editar
                        </button>
                        ${gramatura.ativo ? 
                            `<button class="btn btn-sm btn-warning" onclick="desativarGramatura(${gramatura.id})">
                                🚫 Desativar
                            </button>` :
                            `<button class="btn btn-sm btn-success" onclick="ativarGramatura(${gramatura.id})">
                                ✅ Ativar
                            </button>`
                        }
                    </td>
                </tr>
            `).join('');
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
        document.getElementById('gramatura-valor').value = gramatura.gramatura;
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
    const gramatura = {
        gramatura: document.getElementById('gramatura-valor').value,
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

// Editar gramatura
function editarGramatura(gramatura) {
    abrirModalGramatura(gramatura);
}

// Desativar gramatura
async function desativarGramatura(id) {
    if (!confirm('Deseja realmente desativar esta gramatura?')) return;
    
    try {
        const response = await fetch(`/api/gramaturas/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarAlerta('gramaturas', 'Gramatura desativada com sucesso!', 'success');
            carregarGramaturas();
        } else {
            mostrarAlerta('gramaturas', data.error || 'Erro ao desativar gramatura', 'danger');
        }
    } catch (error) {
        mostrarAlerta('gramaturas', 'Erro ao desativar gramatura: ' + error.message, 'danger');
    }
}

// Ativar gramatura
async function ativarGramatura(id) {
    try {
        const response = await fetch(`/api/gramaturas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ativo: true })
        });
        
        if (response.ok) {
            mostrarAlerta('gramaturas', 'Gramatura ativada com sucesso!', 'success');
            carregarGramaturas();
        } else {
            mostrarAlerta('gramaturas', 'Erro ao ativar gramatura', 'danger');
        }
    } catch (error) {
        mostrarAlerta('gramaturas', 'Erro ao ativar gramatura: ' + error.message, 'danger');
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
