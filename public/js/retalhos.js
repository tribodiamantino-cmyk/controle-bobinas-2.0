const API_BASE = '/api';
let retalhosCache = [];
let produtosCache = [];
let retalhoParaImprimir = null;

// ========== TOGGLE FILTROS ==========
function toggleFiltros() {
    const container = document.getElementById('filter-container');
    const btn = document.getElementById('btn-toggle-filters');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        btn.textContent = '🔼 Ocultar Filtros';
    } else {
        container.style.display = 'none';
        btn.textContent = '🔽 Mostrar Filtros';
    }
}

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    carregarRetalhos();
    
    // Event listeners para filtros
    document.getElementById('busca').addEventListener('input', aplicarFiltros);
    document.getElementById('filtroProduto').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroLoja').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroMetragem').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroStatus').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroOrigem').addEventListener('change', aplicarFiltros);
    document.getElementById('ordenacao').addEventListener('change', aplicarFiltros);
    
    // Verificar se veio de conversão de cortes (highlight)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('novos') === 'true') {
        showNotification('📦 Novos retalhos criados! Imprima as etiquetas.', 'info');
    }
});

// ========== CARREGAR DADOS ==========
async function carregarProdutos() {
    try {
        const response = await fetch(`${API_BASE}/produtos`);
        const data = await response.json();
        
        if (data.success) {
            produtosCache = data.data || [];
            popularSelectProdutos();
            popularFiltroProdutos();
        }
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

function popularSelectProdutos() {
    const select = document.getElementById('produtoRetalho');
    select.innerHTML = '<option value="">Selecione...</option>';
    
    produtosCache.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.codigo} - ${p.nome_cor} ${p.gramatura}g/m²`;
        select.appendChild(option);
    });
}

function popularFiltroProdutos() {
    const select = document.getElementById('filtroProduto');
    select.innerHTML = '<option value="">Todos</option>';
    
    produtosCache.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.codigo} - ${p.nome_cor}`;
        select.appendChild(option);
    });
}

async function carregarRetalhos() {
    try {
        const response = await fetch(`${API_BASE}/retalhos`);
        const data = await response.json();
        
        if (data.success) {
            retalhosCache = data.data || [];
            aplicarFiltros();
            atualizarEstatisticas();
        }
    } catch (error) {
        console.error('Erro ao carregar retalhos:', error);
        showNotification('Erro ao carregar retalhos', 'error');
    }
}

// ========== FILTROS ==========
function aplicarFiltros() {
    const busca = document.getElementById('busca').value.toLowerCase();
    const produto = document.getElementById('filtroProduto').value;
    const loja = document.getElementById('filtroLoja').value;
    const metragem = document.getElementById('filtroMetragem').value;
    const status = document.getElementById('filtroStatus').value;
    const origem = document.getElementById('filtroOrigem').value;
    const ordenacao = document.getElementById('ordenacao').value;
    
    let filtrados = retalhosCache.filter(r => {
        // Busca geral (inclui placa)
        if (busca) {
            const termo = busca.toLowerCase();
            const match = 
                (r.codigo_retalho && r.codigo_retalho.toLowerCase().includes(termo)) ||
                (r.qr_code && r.qr_code.toLowerCase().includes(termo)) ||
                (r.codigo && r.codigo.toLowerCase().includes(termo)) ||
                (r.nome_cor && r.nome_cor.toLowerCase().includes(termo)) ||
                (r.localizacao_atual && r.localizacao_atual.toLowerCase().includes(termo)) ||
                (r.placa && r.placa.toLowerCase().includes(termo));
            
            if (!match) return false;
        }
        
        // Filtro de produto
        if (produto && r.produto_id != produto) return false;
        
        // Filtro de loja
        if (loja && r.loja !== loja) return false;
        
        // Filtro de metragem
        if (metragem) {
            const metros = parseFloat(r.metragem || 0);
            if (metragem === '0-10' && metros > 10) return false;
            if (metragem === '10-30' && (metros < 10 || metros > 30)) return false;
            if (metragem === '30-50' && (metros < 30 || metros > 50)) return false;
            if (metragem === '50+' && metros < 50) return false;
        }
        
        // Filtro de status
        if (status && r.status !== status) return false;
        
        // Filtro de origem
        if (origem) {
            if (origem === 'bobina' && !r.bobina_id) return false;
            if (origem === 'corte' && !r.corte_origem_id) return false;
            if (origem === 'manual' && (r.bobina_id || r.corte_origem_id)) return false;
        }
        
        return true;
    });
    
    // Ordenação
    filtrados = ordenarRetalhos(filtrados, ordenacao);
    
    renderizarTabela(filtrados);
}

function ordenarRetalhos(retalhos, tipo) {
    return [...retalhos].sort((a, b) => {
        switch (tipo) {
            case 'recentes':
                return new Date(b.data_entrada || 0) - new Date(a.data_entrada || 0);
            case 'antigos':
                return new Date(a.data_entrada || 0) - new Date(b.data_entrada || 0);
            case 'maior-metragem':
                return parseFloat(b.metragem || 0) - parseFloat(a.metragem || 0);
            case 'menor-metragem':
                return parseFloat(a.metragem || 0) - parseFloat(b.metragem || 0);
            case 'codigo':
                return (a.codigo_retalho || '').localeCompare(b.codigo_retalho || '');
            default:
                return 0;
        }
    });
}

function limparFiltros() {
    document.getElementById('busca').value = '';
    document.getElementById('filtroProduto').value = '';
    document.getElementById('filtroLoja').value = '';
    document.getElementById('filtroMetragem').value = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroOrigem').value = '';
    document.getElementById('ordenacao').value = 'recentes';
    aplicarFiltros();
}

// ========== RENDERIZAÇÃO ==========
function renderizarTabela(retalhos) {
    const tbody = document.getElementById('tabelaRetalhos');
    
    if (retalhos.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px; color: #999;">
                    Nenhum retalho encontrado
                </td>
            </tr>
        `;
        return;
    }
    
    // Verificar se é recente (últimas 24h)
    const agora = new Date();
    const umDiaAtras = new Date(agora - 24 * 60 * 60 * 1000);
    
    tbody.innerHTML = retalhos.map(r => {
        const dataEntrada = new Date(r.data_entrada);
        const isRecente = dataEntrada > umDiaAtras;
        const rowStyle = isRecente ? 'background: #fff3cd;' : '';
        
        return `
        <tr style="${rowStyle}">
            <td>
                <strong>${r.codigo_retalho || '-'}</strong>
                ${isRecente ? '<span style="color: #856404; font-size: 0.8em;"><br>🆕 Novo</span>' : ''}
            </td>
            <td>
                <div style="font-weight: 600;">${r.codigo || '-'}</div>
                <div style="font-size: 0.85em; color: #666;">
                    ${r.nome_cor || '-'} ${r.gramatura || '-'}g/m²
                </div>
            </td>
            <td>
                <span style="color: #28a745; font-weight: 600; font-size: 1.1em;">
                    ${parseFloat(r.metragem || 0).toFixed(2)}m
                </span>
            </td>
            <td>
                ${r.metragem_reservada > 0 
                    ? `<span style="color: #dc3545; font-weight: 600;">${parseFloat(r.metragem_reservada).toFixed(2)}m</span>`
                    : '<span style="color: #999;">-</span>'
                }
            </td>
            <td>
                ${r.placa 
                    ? `<span style="background: #e9ecef; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${r.placa}</span>`
                    : '<span style="color: #999;">-</span>'
                }
            </td>
            <td>${r.localizacao_atual || '-'}</td>
            <td>${formatarOrigem(r)}</td>
            <td>${formatarStatus(r.status)}</td>
            <td>${formatarData(r.data_entrada)}</td>
            <td>
                <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <button class="btn btn-sm btn-info" onclick="abrirModalImprimirEtiqueta(${r.id})" title="Imprimir etiqueta">
                        🖨️
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="abrirModalEditarRetalho(${r.id})" title="Editar">
                        ✏️
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="excluirRetalho(${r.id})" title="Excluir">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
}

function formatarOrigem(r) {
    if (r.corte_origem_id) {
        return `<span style="background: #d4edda; color: #155724; padding: 2px 8px; border-radius: 12px; font-size: 0.85em;">
            ✂️ Corte
        </span>`;
    }
    if (r.bobina_id || r.bobina_codigo) {
        return `<span style="background: #cce5ff; color: #004085; padding: 2px 8px; border-radius: 12px; font-size: 0.85em;" 
                title="Bobina: ${r.bobina_codigo || r.bobina_id}">
            📦 Bobina
        </span>`;
    }
    return `<span style="background: #e9ecef; color: #495057; padding: 2px 8px; border-radius: 12px; font-size: 0.85em;">
        ✍️ Manual
    </span>`;
}

function formatarStatus(status) {
    const badges = {
        'Disponível': '<span class="badge badge-success">Disponível</span>',
        'Reservado': '<span class="badge badge-warning">Reservado</span>',
        'Usado': '<span class="badge badge-secondary">Usado</span>'
    };
    return badges[status] || `<span class="badge">${status || '-'}</span>`;
}

function formatarData(data) {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
}

function atualizarEstatisticas() {
    const total = retalhosCache.length;
    const metragemTotal = retalhosCache.reduce((acc, r) => acc + parseFloat(r.metragem || 0), 0);
    const disponiveis = retalhosCache.filter(r => r.status === 'disponivel').length;
    const reservados = retalhosCache.filter(r => r.status === 'reservado').length;
    
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statMetragem').textContent = `${metragemTotal.toFixed(2)}m`;
    document.getElementById('statDisponiveis').textContent = disponiveis;
    document.getElementById('statReservados').textContent = reservados;
}

// ========== MODAL: NOVO RETALHO ==========
function abrirModalNovoRetalho() {
    document.getElementById('modalNovoRetalho').style.display = 'flex';
    document.getElementById('formNovoRetalho').reset();
}

function fecharModalNovoRetalho() {
    document.getElementById('modalNovoRetalho').style.display = 'none';
}

async function salvarNovoRetalho() {
    const produto_id = document.getElementById('produtoRetalho').value;
    const metragem = document.getElementById('metragemRetalho').value;
    const localizacao_atual = document.getElementById('localizacaoRetalho').value;
    const observacoes = document.getElementById('observacoesRetalho').value;
    
    try {
        const response = await fetch(`${API_BASE}/retalhos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                produto_id,
                metragem,
                localizacao_atual,
                observacoes
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Erro ao criar retalho');
        }
        
        showNotification('✅ Retalho criado com sucesso!', 'success');
        fecharModalNovoRetalho();
        carregarRetalhos();
        
    } catch (error) {
        console.error('Erro ao salvar retalho:', error);
        showNotification('Erro: ' + error.message, 'error');
    }
}

// ========== MODAL: EDITAR RETALHO ==========
function abrirModalEditarRetalho(retalhoId) {
    const retalho = retalhosCache.find(r => r.id === retalhoId);
    
    if (!retalho) {
        showNotification('Retalho não encontrado', 'error');
        return;
    }
    
    document.getElementById('editRetalhoId').value = retalho.id;
    document.getElementById('editCodigo').value = retalho.codigo_retalho || '';
    document.getElementById('editMetragem').value = retalho.metragem || '';
    document.getElementById('editLocalizacao').value = retalho.localizacao_atual || '';
    document.getElementById('editObservacoes').value = retalho.observacoes || '';
    
    document.getElementById('modalEditarRetalho').style.display = 'flex';
}

function fecharModalEditarRetalho() {
    document.getElementById('modalEditarRetalho').style.display = 'none';
}

async function salvarEdicaoRetalho() {
    const id = document.getElementById('editRetalhoId').value;
    const metragem = document.getElementById('editMetragem').value;
    const localizacao_atual = document.getElementById('editLocalizacao').value;
    const observacoes = document.getElementById('editObservacoes').value;
    
    try {
        const response = await fetch(`${API_BASE}/retalhos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                metragem,
                localizacao_atual,
                observacoes
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Erro ao atualizar retalho');
        }
        
        showNotification('✅ Retalho atualizado com sucesso!', 'success');
        fecharModalEditarRetalho();
        carregarRetalhos();
        
    } catch (error) {
        console.error('Erro ao atualizar retalho:', error);
        showNotification('Erro: ' + error.message, 'error');
    }
}

// ========== EXCLUIR RETALHO ==========
async function excluirRetalho(retalhoId) {
    const retalho = retalhosCache.find(r => r.id === retalhoId);
    
    if (!retalho) {
        showNotification('Retalho não encontrado', 'error');
        return;
    }
    
    if (!confirm(`Confirma a exclusão do retalho ${retalho.codigo_retalho}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/retalhos/${retalhoId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Erro ao excluir retalho');
        }
        
        showNotification('✅ Retalho excluído com sucesso!', 'success');
        carregarRetalhos();
        
    } catch (error) {
        console.error('Erro ao excluir retalho:', error);
        showNotification('Erro: ' + error.message, 'error');
    }
}

// ========== IMPRIMIR ETIQUETA ==========
// Usa o módulo ImpressaoEtiquetas (impressao-etiquetas.js)
// Especificações: docs/ESPECIFICACAO_ETIQUETAS.md
function abrirModalImprimirEtiqueta(retalhoId) {
    ImpressaoEtiquetas.abrirModal('retalho', retalhoId);
}

// ========== NOTIFICAÇÕES ==========
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
