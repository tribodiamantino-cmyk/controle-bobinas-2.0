// ======================
// EDIÇÃO INLINE GENÉRICA
// ======================

// Função para ativar modo de edição
function editarCampo(campoId) {
    // Esconder o display e mostrar o input
    const display = document.getElementById(campoId + '-display');
    const edit = document.getElementById(campoId);
    
    if (display && edit) {
        display.style.display = 'none';
        edit.style.display = edit.tagName === 'SELECT' ? 'block' : (edit.tagName === 'DIV' ? 'flex' : 'inline-block');
        
        // Focar no campo (se for input ou select direto)
        if (edit.tagName === 'INPUT') {
            edit.focus();
            edit.select();
        } else if (edit.tagName === 'SELECT') {
            edit.focus();
        } else if (edit.tagName === 'DIV') {
            // Se for div (caso da gramatura), focar no input dentro
            const input = edit.querySelector('input');
            if (input) {
                input.focus();
                input.select();
            }
        }
    }
}

// Função genérica para salvar campo
async function salvarCampo(tipo, id, campo) {
    if (tipo === 'cor') {
        if (campo === 'nome') {
            const inputElement = document.getElementById(`cor-nome-${id}`);
            const displayElement = document.getElementById(`cor-nome-${id}-display`);
            const valor = inputElement.value;
            
            if (!valor.trim()) {
                alert('Nome da cor não pode estar vazio');
                carregarCores();
                return;
            }
            
            // Atualizar display
            displayElement.textContent = valor;
            
            // Salvar no backend
            await atualizarCor(id, { nome_cor: valor });
            
            // Voltar para modo display
            displayElement.style.display = 'inline-block';
            inputElement.style.display = 'none';
        } else if (campo === 'ativo') {
            const selectElement = document.getElementById(`cor-ativo-${id}`);
            const displayElement = document.getElementById(`cor-ativo-${id}-display`);
            const ativoValue = selectElement.value;
            const valor = ativoValue === '1';
            
            // Atualizar display
            displayElement.innerHTML = valor ? 
                '<span class="badge badge-success">Ativo</span>' : 
                '<span class="badge badge-danger">Inativo</span>';
            
            // Salvar no backend
            await atualizarCor(id, { ativo: valor });
            
            // Voltar para modo display
            displayElement.style.display = 'inline-block';
            selectElement.style.display = 'none';
        }
    } else if (tipo === 'gramatura') {
        if (campo === 'numero') {
            const inputElement = document.getElementById(`gramatura-numero-${id}`);
            const displayElement = document.getElementById(`gramatura-numero-${id}-display`);
            const valor = inputElement.value;
            
            if (!valor.trim()) {
                alert('Gramatura não pode estar vazia');
                carregarGramaturas();
                return;
            }
            
            // Atualizar display
            displayElement.innerHTML = `<strong>${valor}</strong>`;
            
            // Salvar no backend
            await atualizarGramatura(id, { gramatura: valor });
            
            // Voltar para modo display
            displayElement.style.display = 'inline-block';
            inputElement.style.display = 'none';
        } else if (campo === 'ativo') {
            const selectElement = document.getElementById(`gramatura-ativo-${id}`);
            const displayElement = document.getElementById(`gramatura-ativo-${id}-display`);
            const ativoValue = selectElement.value;
            const valor = ativoValue === '1';
            
            // Atualizar display
            displayElement.innerHTML = valor ? 
                '<span class="badge badge-success">Ativo</span>' : 
                '<span class="badge badge-danger">Inativo</span>';
            
            // Salvar no backend
            await atualizarGramatura(id, { ativo: valor });
            
            // Voltar para modo display
            displayElement.style.display = 'inline-block';
            selectElement.style.display = 'none';
        }
    }
}

// Funções auxiliares para atualizar no backend
async function atualizarCor(id, dados) {
    // Buscar dados atuais para manter o que não foi editado
    const response = await fetch('/api/cores');
    const result = await response.json();
    const cores = result.data || result;
    const corAtual = cores.find(c => c.id === id);
    
    const dadosCompletos = {
        nome_cor: dados.nome_cor !== undefined ? dados.nome_cor : corAtual.nome_cor,
        ativo: dados.ativo !== undefined ? dados.ativo : corAtual.ativo
    };
    
    try {
        const res = await fetch(`/api/cores/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosCompletos)
        });
        
        if (res.ok) {
            mostrarAlerta('cores', 'Atualizado com sucesso!', 'success');
        } else {
            const data = await res.json();
            mostrarAlerta('cores', data.error || 'Erro ao atualizar', 'danger');
            carregarCores();
        }
    } catch (error) {
        mostrarAlerta('cores', 'Erro: ' + error.message, 'danger');
        carregarCores();
    }
}

async function atualizarGramatura(id, dados) {
    // Buscar dados atuais para manter o que não foi editado
    const response = await fetch('/api/gramaturas');
    const result = await response.json();
    const gramaturas = result.data || result;
    const gramaturaAtual = gramaturas.find(g => g.id === id);
    
    const dadosCompletos = {
        gramatura: dados.gramatura !== undefined ? dados.gramatura : gramaturaAtual.gramatura,
        ativo: dados.ativo !== undefined ? dados.ativo : gramaturaAtual.ativo
    };
    
    try {
        const res = await fetch(`/api/gramaturas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosCompletos)
        });
        
        if (res.ok) {
            mostrarAlerta('gramaturas', 'Atualizado com sucesso!', 'success');
        } else {
            const data = await res.json();
            mostrarAlerta('gramaturas', data.error || 'Erro ao atualizar', 'danger');
            carregarGramaturas();
        }
    } catch (error) {
        mostrarAlerta('gramaturas', 'Erro: ' + error.message, 'danger');
        carregarGramaturas();
    }
}

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
    } else if (tabName === 'locacoes') {
        carregarLocacoes();
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
        const result = await response.json();
        const cores = result.data || result; // Suportar ambos os formatos
        
        loading.style.display = 'none';
        
        if (cores.length === 0) {
            empty.style.display = 'block';
        } else {
            table.style.display = 'table';
            tbody.innerHTML = cores.map(cor => `
                <tr>
                    <td onclick="editarCampo('cor-nome-${cor.id}')">
                        <span id="cor-nome-${cor.id}-display" class="campo-display">${cor.nome_cor}</span>
                        <input type="text" 
                               value="${cor.nome_cor}" 
                               id="cor-nome-${cor.id}"
                               class="campo-edit"
                               style="display: none;"
                               onblur="salvarCampo('cor', ${cor.id}, 'nome')"
                               onkeypress="if(event.key==='Enter') this.blur()">
                    </td>
                    <td onclick="editarCampo('cor-ativo-${cor.id}')">
                        <span id="cor-ativo-${cor.id}-display" class="campo-display">
                            ${cor.ativo ? '<span class="badge badge-success">Ativo</span>' : '<span class="badge badge-danger">Inativo</span>'}
                        </span>
                        <select id="cor-ativo-${cor.id}" 
                                class="campo-edit"
                                style="display: none;"
                                onblur="salvarCampo('cor', ${cor.id}, 'ativo')"
                                onchange="this.blur()">
                            <option value="1" ${cor.ativo ? 'selected' : ''}>Ativo</option>
                            <option value="0" ${!cor.ativo ? 'selected' : ''}>Inativo</option>
                        </select>
                    </td>
                    <td>${formatarData(cor.data_criacao)}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="excluirCor(${cor.id})">
                            🗑️
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
        const result = await response.json();
        const gramaturas = result.data || result; // Suportar ambos os formatos
        
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
                    <td onclick="editarCampo('gramatura-numero-${gramatura.id}')">
                        <span id="gramatura-numero-${gramatura.id}-display" class="campo-display">
                            <strong>${gramatura.gramatura}</strong>
                        </span>
                        <div id="gramatura-numero-${gramatura.id}" class="campo-edit" style="display: none; align-items: center; gap: 0.5rem;">
                            <input type="number" 
                                   value="${numero}" 
                                   id="gramatura-numero-${gramatura.id}-input"
                                   style="width: 120px; padding: 0.5rem; border: 2px solid var(--primary-color); border-radius: 5px;"
                                   min="1"
                                   onblur="salvarCampo('gramatura', ${gramatura.id}, 'numero')"
                                   onkeypress="if(event.key==='Enter') this.blur()">
                            <span style="font-weight: bold; color: #666;">g/m²</span>
                        </div>
                    </td>
                    <td onclick="editarCampo('gramatura-ativo-${gramatura.id}')">
                        <span id="gramatura-ativo-${gramatura.id}-display" class="campo-display">
                            ${gramatura.ativo ? '<span class="badge badge-success">Ativo</span>' : '<span class="badge badge-danger">Inativo</span>'}
                        </span>
                        <select id="gramatura-ativo-${gramatura.id}" 
                                class="campo-edit"
                                style="display: none;"
                                onblur="salvarCampo('gramatura', ${gramatura.id}, 'ativo')"
                                onchange="this.blur()">
                            <option value="1" ${gramatura.ativo ? 'selected' : ''}>Ativo</option>
                            <option value="0" ${!gramatura.ativo ? 'selected' : ''}>Inativo</option>
                        </select>
                    </td>
                    <td>${formatarData(gramatura.data_criacao)}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="excluirGramatura(${gramatura.id})">
                            🗑️
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

// ======================
// MANUTENÇÃO
// ======================

// Limpar reservas órfãs
async function limparReservasOrfas() {
    if (!confirm('⚠️ ATENÇÃO!\n\nEsta operação irá:\n\n1. Resetar TODAS as metragens reservadas\n2. Recalcular apenas as reservas de planos em produção\n3. Remover reservas órfãs acumuladas\n\nDeseja continuar?')) {
        return;
    }
    
    const btn = document.getElementById('btn-limpar-reservas');
    const resultado = document.getElementById('resultado-limpeza');
    
    btn.disabled = true;
    btn.textContent = '⏳ Processando...';
    resultado.style.display = 'none';
    
    try {
        const response = await fetch('/api/ordens-corte/admin/limpar-reservas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            resultado.innerHTML = `
                <div class="alert alert-success">
                    <strong>✅ Sucesso!</strong><br>
                    ${data.message}
                </div>
            `;
            resultado.style.display = 'block';
        } else {
            throw new Error(data.error || 'Erro desconhecido');
        }
        
    } catch (error) {
        resultado.innerHTML = `
            <div class="alert alert-danger">
                <strong>❌ Erro!</strong><br>
                ${error.message}
            </div>
        `;
        resultado.style.display = 'block';
        console.error('Erro ao limpar reservas:', error);
    } finally {
        btn.disabled = false;
        btn.textContent = '🧹 Executar Limpeza de Reservas';
    }
}

// ======================
// LOCAÇÕES (Edição Inline igual Cores)
// ======================
let locacoes = [];

async function carregarLocacoes() {
    try {
        document.getElementById('loading-locacoes').style.display = 'block';
        document.getElementById('table-locacoes').style.display = 'none';
        document.getElementById('empty-locacoes').style.display = 'none';

        const response = await fetch('/api/locacoes');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error);
        }

        locacoes = data.data;
        renderizarLocacoes();

    } catch (error) {
        console.error('Erro ao carregar locações:', error);
        document.getElementById('alert-locacoes').innerHTML = `
            <div class="alert alert-error">
                Erro ao carregar locações: ${error.message}
            </div>
        `;
    } finally {
        document.getElementById('loading-locacoes').style.display = 'none';
    }
}

function renderizarLocacoes() {
    const tbody = document.getElementById('tbody-locacoes');
    const emptyState = document.getElementById('empty-locacoes');
    const table = document.getElementById('table-locacoes');

    if (locacoes.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    tbody.innerHTML = locacoes.map(loc => `
        <tr>
            <td onclick="editarCampoLocacao('loc-codigo-${loc.id}')">
                <span id="loc-codigo-${loc.id}-display" class="campo-display" style="font-family: monospace; font-weight: bold;">${loc.codigo}</span>
                <input type="text" 
                       value="${loc.codigo}" 
                       id="loc-codigo-${loc.id}"
                       class="campo-edit"
                       style="display: none; font-family: monospace; font-weight: bold;"
                       maxlength="11"
                       oninput="formatarCodigoLocacao(this)"
                       onblur="salvarCampoLocacao(${loc.id}, 'codigo')"
                       onkeypress="if(event.key==='Enter') this.blur()">
            </td>
            <td onclick="editarCampoLocacao('loc-descricao-${loc.id}')">
                <span id="loc-descricao-${loc.id}-display" class="campo-display">${loc.descricao || '-'}</span>
                <input type="text" 
                       value="${loc.descricao || ''}" 
                       id="loc-descricao-${loc.id}"
                       class="campo-edit"
                       style="display: none;"
                       placeholder="Descrição (opcional)"
                       onblur="salvarCampoLocacao(${loc.id}, 'descricao')"
                       onkeypress="if(event.key==='Enter') this.blur()">
            </td>
            <td onclick="editarCampoLocacao('loc-ativa-${loc.id}')">
                <span id="loc-ativa-${loc.id}-display" class="campo-display">
                    ${loc.ativa ? '<span class="badge badge-success">Ativa</span>' : '<span class="badge badge-danger">Inativa</span>'}
                </span>
                <select id="loc-ativa-${loc.id}" 
                        class="campo-edit"
                        style="display: none;"
                        onblur="salvarCampoLocacao(${loc.id}, 'ativa')"
                        onchange="this.blur()">
                    <option value="1" ${loc.ativa ? 'selected' : ''}>Ativa</option>
                    <option value="0" ${!loc.ativa ? 'selected' : ''}>Inativa</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="excluirLocacao(${loc.id})" title="Excluir">
                    🗑️
                </button>
            </td>
        </tr>
    `).join('');
}

// Editar campo inline de locação
function editarCampoLocacao(campoId) {
    const display = document.getElementById(campoId + '-display');
    const input = document.getElementById(campoId);
    
    if (display && input) {
        display.style.display = 'none';
        input.style.display = 'block';
        input.focus();
        if (input.tagName === 'INPUT') {
            input.select();
        }
    }
}

// Salvar campo inline de locação
async function salvarCampoLocacao(id, campo) {
    const input = document.getElementById(`loc-${campo}-${id}`);
    const display = document.getElementById(`loc-${campo}-${id}-display`);
    
    if (!input || !display) return;
    
    let valor = input.value;
    
    // Validar código com máscara flexível (1-4 dígitos cada parte)
    if (campo === 'codigo') {
        valor = valor.trim().toUpperCase();
        const regex = /^[0-9]{1,4}-[A-Z]-[0-9]{1,4}$/;
        if (!regex.test(valor)) {
            alert('Código inválido! Use o formato N-X-N (ex: 1-A-1, 12-B-34, 0001-A-0001)');
            input.focus();
            return;
        }
    }
    
    // Converter ativa para boolean
    if (campo === 'ativa') {
        valor = valor === '1';
    }
    
    try {
        const body = {};
        body[campo] = campo === 'descricao' ? (valor.trim() || null) : valor;
        
        const response = await fetch(`/api/locacoes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        // Atualizar display
        if (campo === 'codigo') {
            display.textContent = valor;
        } else if (campo === 'descricao') {
            display.textContent = valor.trim() || '-';
        } else if (campo === 'ativa') {
            display.innerHTML = valor 
                ? '<span class="badge badge-success">Ativa</span>' 
                : '<span class="badge badge-danger">Inativa</span>';
        }
        
        // Atualizar array local
        const loc = locacoes.find(l => l.id === id);
        if (loc) {
            loc[campo] = campo === 'descricao' ? (valor.trim() || null) : valor;
        }
        
        // Esconder input, mostrar display
        input.style.display = 'none';
        display.style.display = 'inline';
        
    } catch (error) {
        alert('Erro ao salvar: ' + error.message);
        input.focus();
    }
}

// Excluir locação
async function excluirLocacao(id) {
    if (!confirm('Deseja desativar esta locação?')) return;
    
    try {
        const response = await fetch(`/api/locacoes/${id}`, { method: 'DELETE' });
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        await carregarLocacoes();
        mostrarAlerta('locacoes', 'Locação desativada com sucesso!', 'success');
        
    } catch (error) {
        alert('Erro: ' + error.message);
    }
}

// Mostrar alerta
function mostrarAlerta(area, mensagem, tipo) {
    const alertDiv = document.getElementById(`alert-${area}`);
    if (alertDiv) {
        alertDiv.innerHTML = `<div class="alert alert-${tipo}">${mensagem}</div>`;
        setTimeout(() => { alertDiv.innerHTML = ''; }, 3000);
    }
}

// Abrir modal para NOVA locação
function abrirModalLocacao() {
    document.getElementById('modal-locacao-title').textContent = 'Nova Locação';
    document.getElementById('form-locacao').reset();
    document.getElementById('locacao-id').value = '';
    document.getElementById('modal-locacao').classList.add('show');
}

function fecharModalLocacao() {
    document.getElementById('modal-locacao').classList.remove('show');
}

async function salvarLocacao(event) {
    event.preventDefault();

    const id = document.getElementById('locacao-id').value;
    const codigo = document.getElementById('locacao-codigo').value.trim().toUpperCase();
    const descricao = document.getElementById('locacao-descricao').value.trim();

    // Validar formato da máscara flexível (1-4 dígitos cada parte)
    const regex = /^[0-9]{1,4}-[A-Z]-[0-9]{1,4}$/;
    if (!regex.test(codigo)) {
        alert('Código inválido! Use o formato N-X-N (ex: 1-A-1, 12-B-34, 0001-A-0001)');
        return;
    }

    try {
        const url = id ? `/api/locacoes/${id}` : '/api/locacoes';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                codigo: codigo,
                descricao: descricao || null,
                ativa: true
            })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error);
        }

        document.getElementById('alert-locacoes').innerHTML = `
            <div class="alert alert-success">
                Locação ${id ? 'atualizada' : 'criada'} com sucesso!
            </div>
        `;

        setTimeout(() => {
            document.getElementById('alert-locacoes').innerHTML = '';
        }, 3000);

        fecharModalLocacao();
        await carregarLocacoes();

    } catch (error) {
        alert('Erro ao salvar locação: ' + error.message);
    }
}

// Formatar código da locação enquanto digita (máscara 0000-X-0000)
// Formato: [1-4 números]-[1 letra]-[1-4 números]
function formatarCodigoLocacao(input) {
    const cursorPos = input.selectionStart;
    let valor = input.value.toUpperCase();
    
    // Estado: onde estamos na máscara
    // Parte 1: números (1-4 dígitos)
    // Parte 2: letra (1 caractere)
    // Parte 3: números (1-4 dígitos)
    
    let parte1 = '';
    let letra = '';
    let parte2 = '';
    let fase = 1; // 1 = números iniciais, 2 = letra, 3 = números finais
    
    for (let i = 0; i < valor.length; i++) {
        const char = valor[i];
        
        if (char === '-') {
            // Hífen avança para próxima fase
            if (fase === 1 && parte1.length > 0) {
                fase = 2;
            } else if (fase === 2 && letra.length > 0) {
                fase = 3;
            }
            continue;
        }
        
        if (fase === 1) {
            // Fase 1: aceita apenas números (máx 4)
            if (/[0-9]/.test(char) && parte1.length < 4) {
                parte1 += char;
            } else if (/[A-Z]/.test(char) && parte1.length > 0) {
                // Se digitou letra e já tem números, avança para fase 2
                fase = 2;
                letra = char;
                fase = 3; // Já pegou a letra, vai para fase 3
            }
        } else if (fase === 2) {
            // Fase 2: aceita apenas 1 letra
            if (/[A-Z]/.test(char) && letra.length === 0) {
                letra = char;
                fase = 3;
            }
        } else if (fase === 3) {
            // Fase 3: aceita apenas números (máx 4)
            if (/[0-9]/.test(char) && parte2.length < 4) {
                parte2 += char;
            }
        }
    }
    
    // Montar resultado
    let resultado = parte1;
    if (letra) {
        resultado += '-' + letra;
        if (parte2) {
            resultado += '-' + parte2;
        }
    }
    
    input.value = resultado;
    
    // Manter cursor no final ou na posição apropriada
    const novoPos = Math.min(cursorPos, resultado.length);
    setTimeout(() => {
        input.setSelectionRange(resultado.length, resultado.length);
    }, 0);
}

// ======================
// IMPRESSÃO DE ETIQUETAS
// ======================
function abrirImpressaoLocacoes() {
    window.open('/impressao/etiquetas-locacoes.html', '_blank', 'width=1200,height=800');
}

// Carregar dados ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    carregarCores();
});
