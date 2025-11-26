// Variáveis globais
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://controle-bobinas-20-production.up.railway.app/api';

let planoAtual = null;
let itemAlocarAtual = null;
let produtos = [];
let planosCached = {
    planejamento: [],
    em_producao: [],
    finalizado: []
};

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    carregarPlanos();
});

// ========== CARREGAR DADOS ==========
async function carregarProdutos() {
    try {
        const response = await fetch(`${API_BASE}/produtos`);
        const data = await response.json();
        produtos = data.data || [];
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        showNotification('Erro ao carregar produtos', 'error');
    }
}

async function carregarPlanos() {
    try {
        const response = await fetch(`${API_BASE}/ordens-corte`);
        const data = await response.json();
        
        if (data.success) {
            const planos = data.data || [];
            
            // Organizar por status
            planosCached = {
                planejamento: planos.filter(p => p.status === 'planejamento'),
                em_producao: planos.filter(p => p.status === 'em_producao'),
                finalizado: planos.filter(p => p.status === 'finalizado')
            };
            
            renderizarKanban();
        }
    } catch (error) {
        console.error('Erro ao carregar planos:', error);
        showNotification('Erro ao carregar planos de corte', 'error');
    }
}

function renderizarKanban() {
    // Renderizar cada coluna
    renderizarColuna('planejamento', planosCached.planejamento);
    renderizarColuna('em_producao', planosCached.em_producao);
    renderizarColuna('finalizado', planosCached.finalizado);
    
    // Atualizar contadores
    document.getElementById('count-planejamento').textContent = planosCached.planejamento.length;
    document.getElementById('count-em-producao').textContent = planosCached.em_producao.length;
    document.getElementById('count-finalizado').textContent = planosCached.finalizado.length;
}

function renderizarColuna(status, planos) {
    const statusMap = {
        'planejamento': 'coluna-planejamento',
        'em_producao': 'coluna-em-producao',
        'finalizado': 'coluna-finalizado'
    };
    
    const colunaId = statusMap[status];
    const coluna = document.getElementById(colunaId);
    
    if (!coluna) return;
    
    if (planos.length === 0) {
        coluna.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">Nenhum plano</div>';
        return;
    }
    
    coluna.innerHTML = planos.map(plano => criarCardPlano(plano)).join('');
}

function criarCardPlano(plano) {
    const dataFormatada = new Date(plano.data_criacao).toLocaleDateString('pt-BR');
    const totalItens = plano.total_itens || 0;
    const metragemTotal = parseFloat(plano.metragem_total || 0).toFixed(2);
    
    let acoes = '';
    
    if (plano.status === 'planejamento') {
        acoes = `
            <button class="btn-icon btn-primary-icon" onclick="enviarParaProducao(${plano.id})" title="Enviar para Produção">
                ⚙️
            </button>
            <button class="btn-icon btn-danger-icon" onclick="excluirPlano(${plano.id})" title="Excluir">
                🗑️
            </button>
        `;
    } else if (plano.status === 'em_producao') {
        acoes = `
            <button class="btn-icon btn-success-icon" onclick="abrirModalFinalizacao(${plano.id})" title="Finalizar">
                ✅
            </button>
        `;
    }
    
    return `
        <div class="plano-card" onclick="abrirDetalhesPlano(${plano.id})">
            <div class="plano-card-header">
                <div class="plano-codigo">${plano.codigo_plano}</div>
            </div>
            <div class="plano-card-body">
                <div class="plano-info">
                    <span class="plano-info-label">Cliente:</span>
                    <span>${plano.cliente}</span>
                </div>
                <div class="plano-info">
                    <span class="plano-info-label">Aviário:</span>
                    <span>${plano.aviario}</span>
                </div>
                <div class="plano-info">
                    <span class="plano-info-label">Data:</span>
                    <span>${dataFormatada}</span>
                </div>
            </div>
            <div class="plano-card-footer">
                <div class="plano-stats">
                    <div class="plano-stat">
                        <span>📦</span>
                        <strong>${totalItens}</strong>
                        <span>cortes</span>
                    </div>
                    <div class="plano-stat">
                        <span>📏</span>
                        <strong>${metragemTotal}m</strong>
                    </div>
                </div>
                <div class="plano-actions" onclick="event.stopPropagation()">
                    ${acoes}
                </div>
            </div>
        </div>
    `;
}

// ========== MODAL: NOVO PLANO ==========
function abrirModalNovoPlano() {
    document.getElementById('modalNovoPlano').style.display = 'flex';
    document.getElementById('formNovoPlano').reset();
    document.getElementById('listaCortesPlano').innerHTML = '';
    
    // Adicionar primeiro corte automaticamente
    adicionarCorte();
}

function fecharModalNovoPlano() {
    document.getElementById('modalNovoPlano').style.display = 'none';
}

let contadorCortes = 0;

function adicionarCorte() {
    contadorCortes++;
    const lista = document.getElementById('listaCortesPlano');
    
    const selectProdutos = produtos.map(p => 
        `<option value="${p.id}">${p.codigo} - ${p.nome_cor} - ${p.gramatura}g</option>`
    ).join('');
    
    const corteHTML = `
        <div class="corte-item" id="corte-${contadorCortes}">
            <div class="corte-item-header">
                <span class="corte-numero">Corte #${contadorCortes}</span>
                <button type="button" class="btn-remover-corte" onclick="removerCorte(${contadorCortes})">
                    ✕ Remover
                </button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Produto *</label>
                    <select class="form-control corte-produto" required>
                        <option value="">Selecione...</option>
                        ${selectProdutos}
                    </select>
                </div>
                <div class="form-group">
                    <label>Metragem (m) *</label>
                    <input type="number" step="0.01" min="0.01" class="form-control corte-metragem" required>
                </div>
            </div>
            <div class="form-group">
                <label>Observações</label>
                <textarea class="form-control corte-observacoes" rows="2"></textarea>
            </div>
        </div>
    `;
    
    lista.insertAdjacentHTML('beforeend', corteHTML);
}

function removerCorte(id) {
    const elemento = document.getElementById(`corte-${id}`);
    if (elemento) {
        elemento.remove();
    }
}

// Submeter formulário de novo plano
document.getElementById('formNovoPlano').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cliente = document.getElementById('clientePlano').value.trim();
    const aviario = document.getElementById('aviarioPlano').value.trim();
    
    // Coletar cortes
    const cortesElements = document.querySelectorAll('.corte-item');
    const itens = [];
    
    cortesElements.forEach((corte, index) => {
        const produto_id = parseInt(corte.querySelector('.corte-produto').value);
        const metragem = parseFloat(corte.querySelector('.corte-metragem').value);
        const observacoes = corte.querySelector('.corte-observacoes').value.trim();
        
        if (produto_id && metragem > 0) {
            itens.push({
                produto_id,
                metragem,
                observacoes: observacoes || null
            });
        }
    });
    
    if (itens.length === 0) {
        showNotification('Adicione pelo menos um corte', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/ordens-corte`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cliente, aviario, itens })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            fecharModalNovoPlano();
            
            // Buscar sugestões automaticamente
            await buscarSugestoesPlano(data.data.id);
            
            // Recarregar planos
            carregarPlanos();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('Erro ao criar plano:', error);
        showNotification('Erro ao criar plano de corte', 'error');
    }
});

// ========== SUGESTÕES AUTOMÁTICAS ==========
async function buscarSugestoesPlano(planoId) {
    try {
        const response = await fetch(`${API_BASE}/ordens-corte/${planoId}/sugestoes`);
        const data = await response.json();
        
        if (data.success) {
            const sugestoes = data.data;
            
            // Para cada sugestão válida, alocar automaticamente
            for (const sug of sugestoes) {
                if (sug.sugestao && sug.sugestao.tipo && sug.sugestao.id) {
                    await alocarOrigem(sug.item_id, sug.sugestao.tipo, sug.sugestao.id);
                }
            }
            
            showNotification('Origens sugeridas e alocadas automaticamente!', 'success');
        }
    } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
    }
}

async function alocarOrigem(itemId, tipoOrigem, origemId) {
    try {
        const response = await fetch(`${API_BASE}/ordens-corte/alocar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                item_id: itemId,
                tipo_origem: tipoOrigem,
                origem_id: origemId
            })
        });
        
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Erro ao alocar origem:', error);
        return false;
    }
}

// ========== DETALHES DO PLANO ==========
async function abrirDetalhesPlano(planoId) {
    try {
        const response = await fetch(`${API_BASE}/ordens-corte/${planoId}`);
        const data = await response.json();
        
        if (data.success) {
            planoAtual = data.data;
            renderizarDetalhesPlano(planoAtual);
            document.getElementById('modalDetalhesPlano').style.display = 'flex';
        }
    } catch (error) {
        console.error('Erro ao buscar detalhes:', error);
        showNotification('Erro ao carregar detalhes do plano', 'error');
    }
}

function renderizarDetalhesPlano(plano) {
    document.getElementById('tituloDetalhes').textContent = plano.codigo_plano;
    document.getElementById('infoDetalhes').textContent = 
        `${plano.cliente} • ${plano.aviario} • ${new Date(plano.data_criacao).toLocaleDateString('pt-BR')}`;
    
    let conteudoHTML = `
        <table class="tabela-itens">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Produto</th>
                    <th>Metragem</th>
                    <th>Origem Alocada</th>
                    <th>Observações</th>
                    ${plano.status === 'planejamento' ? '<th>Ações</th>' : ''}
                </tr>
            </thead>
            <tbody>
    `;
    
    plano.itens.forEach((item, index) => {
        const origem = item.alocacao;
        let origemTexto = '<span style="color: #999;">Não alocada</span>';
        
        if (origem) {
            const badge = origem.tipo_origem === 'retalho' 
                ? '<span class="badge-prioridade alta">RETALHO</span>'
                : '<span class="badge-prioridade media">BOBINA</span>';
            
            origemTexto = `
                ${badge}<br>
                <div class="origem-info-mini">
                    ${origem.codigo_origem} • ${parseFloat(origem.metragem_origem).toFixed(2)}m<br>
                    ${origem.localizacao_origem || 'Sem localização'}
                </div>
            `;
        }
        
        const acoes = plano.status === 'planejamento' 
            ? `<button class="btn btn-secondary btn-sm" onclick="abrirModalAlocacao(${item.id}, ${item.produto_id}, ${item.metragem})">
                   Trocar Origem
               </button>`
            : '';
        
        conteudoHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <strong>${item.codigo}</strong><br>
                    <small>${item.nome_cor} • ${item.gramatura}g • ${item.tipo_tecido}</small>
                </td>
                <td><strong>${parseFloat(item.metragem).toFixed(2)}m</strong></td>
                <td>${origemTexto}</td>
                <td>${item.observacoes || '-'}</td>
                ${plano.status === 'planejamento' ? `<td>${acoes}</td>` : ''}
            </tr>
        `;
    });
    
    conteudoHTML += `
            </tbody>
        </table>
    `;
    
    document.getElementById('conteudoDetalhes').innerHTML = conteudoHTML;
}

function fecharModalDetalhes() {
    document.getElementById('modalDetalhesPlano').style.display = 'none';
}

// ========== MODAL: ALOCAÇÃO ==========
async function abrirModalAlocacao(itemId, produtoId, metragem) {
    itemAlocarAtual = { itemId, produtoId, metragem };
    
    try {
        const response = await fetch(`${API_BASE}/ordens-corte/origens/disponiveis?produto_id=${produtoId}&metragem=${metragem}`);
        const data = await response.json();
        
        if (data.success) {
            renderizarOpcoesOrigem(data.data);
            document.getElementById('modalAlocacao').style.display = 'flex';
        }
    } catch (error) {
        console.error('Erro ao buscar origens:', error);
        showNotification('Erro ao buscar origens disponíveis', 'error');
    }
}

function renderizarOpcoesOrigem(origens) {
    let html = '';
    
    if (origens.retalhos.length > 0) {
        html += '<h4 style="margin-bottom: 15px;">🟢 Retalhos Disponíveis</h4>';
        origens.retalhos.forEach(r => {
            html += criarCardOrigem(r, 'retalho');
        });
    }
    
    if (origens.bobinas.length > 0) {
        html += '<h4 style="margin: 20px 0 15px 0;">🟡 Bobinas Disponíveis</h4>';
        origens.bobinas.forEach(b => {
            html += criarCardOrigem(b, 'bobina');
        });
    }
    
    if (origens.retalhos.length === 0 && origens.bobinas.length === 0) {
        html = '<div class="alert alert-danger">❌ Nenhuma origem disponível com metragem suficiente</div>';
    }
    
    document.getElementById('conteudoAlocacao').innerHTML = html;
}

function criarCardOrigem(origem, tipo) {
    const metragemDisp = parseFloat(origem.metragem_disponivel).toFixed(2);
    const metragemTotal = parseFloat(origem.metragem_total).toFixed(2);
    
    return `
        <div class="origem-sugestao">
            <div class="origem-header">
                <div class="origem-codigo">${origem.codigo}</div>
                <span class="badge-prioridade ${tipo === 'retalho' ? 'alta' : 'media'}">
                    ${tipo.toUpperCase()}
                </span>
            </div>
            <div class="origem-info">
                <div class="origem-info-item">
                    <span class="origem-info-label">Metragem Total:</span>
                    <span>${metragemTotal}m</span>
                </div>
                <div class="origem-info-item">
                    <span class="origem-info-label">Disponível:</span>
                    <span><strong>${metragemDisp}m</strong></span>
                </div>
                ${origem.localizacao_atual ? `
                <div class="origem-info-item">
                    <span class="origem-info-label">Localização:</span>
                    <span>${origem.localizacao_atual}</span>
                </div>
                ` : ''}
                ${origem.nota_fiscal ? `
                <div class="origem-info-item">
                    <span class="origem-info-label">NF:</span>
                    <span>${origem.nota_fiscal}</span>
                </div>
                ` : ''}
            </div>
            <div class="origem-actions">
                <button class="btn btn-primary" onclick="confirmarAlocacao(${origem.id}, '${tipo}')">
                    ✅ Selecionar Esta Origem
                </button>
            </div>
        </div>
    `;
}

async function confirmarAlocacao(origemId, tipoOrigem) {
    const sucesso = await alocarOrigem(itemAlocarAtual.itemId, tipoOrigem, origemId);
    
    if (sucesso) {
        showNotification('Origem alocada com sucesso!', 'success');
        fecharModalAlocacao();
        
        // Atualizar detalhes do plano se estiver aberto
        if (planoAtual) {
            abrirDetalhesPlano(planoAtual.id);
        }
    } else {
        showNotification('Erro ao alocar origem', 'error');
    }
}

function fecharModalAlocacao() {
    document.getElementById('modalAlocacao').style.display = 'none';
}

// ========== ENVIAR PARA PRODUÇÃO ==========
async function enviarParaProducao(planoId) {
    if (!confirm('Deseja enviar este plano para produção? As metragens serão reservadas.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/ordens-corte/${planoId}/enviar-producao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            carregarPlanos();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('Erro ao enviar para produção:', error);
        showNotification('Erro ao enviar para produção', 'error');
    }
}

// ========== FINALIZAÇÃO ==========
async function abrirModalFinalizacao(planoId) {
    try {
        const response = await fetch(`${API_BASE}/ordens-corte/${planoId}`);
        const data = await response.json();
        
        if (data.success) {
            planoAtual = data.data;
            renderizarFinalizacao(planoAtual);
            document.getElementById('modalFinalizacao').style.display = 'flex';
        }
    } catch (error) {
        console.error('Erro ao buscar plano:', error);
        showNotification('Erro ao carregar dados para finalização', 'error');
    }
}

function renderizarFinalizacao(plano) {
    let html = `
        <table class="tabela-itens">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Produto</th>
                    <th>Metragem</th>
                    <th>Origem Alocada</th>
                    <th>Ação</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    plano.itens.forEach((item, index) => {
        const origem = item.alocacao;
        const badge = origem.tipo_origem === 'retalho' 
            ? '<span class="badge-prioridade alta">RETALHO</span>'
            : '<span class="badge-prioridade media">BOBINA</span>';
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <strong>${item.codigo}</strong><br>
                    <small>${item.nome_cor} • ${item.gramatura}g</small>
                </td>
                <td><strong>${parseFloat(item.metragem).toFixed(2)}m</strong></td>
                <td>
                    ${badge}<br>
                    <div class="origem-info-mini">
                        ${origem.codigo_origem} • ${parseFloat(origem.metragem_origem).toFixed(2)}m
                    </div>
                </td>
                <td>
                    <input type="checkbox" id="confirmar-${item.id}" checked>
                    <label for="confirmar-${item.id}">Manter origem</label><br>
                    <button class="btn btn-secondary btn-sm" style="margin-top: 8px;" 
                            onclick="trocarOrigemFinalizacao(${item.id}, ${item.produto_id}, ${item.metragem})">
                        Trocar
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
            <button class="btn btn-secondary" onclick="fecharModalFinalizacao()">Cancelar</button>
            <button class="btn btn-success" onclick="confirmarFinalizacao()">✅ Finalizar e Dar Baixa</button>
        </div>
    `;
    
    document.getElementById('conteudoFinalizacao').innerHTML = html;
}

async function trocarOrigemFinalizacao(itemId, produtoId, metragem) {
    itemAlocarAtual = { itemId, produtoId, metragem };
    
    try {
        const response = await fetch(`${API_BASE}/ordens-corte/origens/disponiveis?produto_id=${produtoId}&metragem=${metragem}`);
        const data = await response.json();
        
        if (data.success) {
            renderizarOpcoesOrigem(data.data);
            document.getElementById('modalAlocacao').style.display = 'flex';
        }
    } catch (error) {
        console.error('Erro ao buscar origens:', error);
        showNotification('Erro ao buscar origens disponíveis', 'error');
    }
}

async function confirmarFinalizacao() {
    if (!confirm('ATENÇÃO: A metragem será definitivamente baixada do estoque. Confirmar?')) {
        return;
    }
    
    // Coletar confirmações
    const confirmacoes = planoAtual.itens.map(item => {
        const checkbox = document.getElementById(`confirmar-${item.id}`);
        return {
            item_id: item.id,
            manter_origem: checkbox ? checkbox.checked : true
        };
    });
    
    try {
        const response = await fetch(`${API_BASE}/ordens-corte/${planoAtual.id}/finalizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ confirmacoes })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            fecharModalFinalizacao();
            carregarPlanos();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('Erro ao finalizar plano:', error);
        showNotification('Erro ao finalizar plano', 'error');
    }
}

function fecharModalFinalizacao() {
    document.getElementById('modalFinalizacao').style.display = 'none';
}

// ========== EXCLUIR PLANO ==========
async function excluirPlano(planoId) {
    if (!confirm('Deseja realmente excluir este plano de corte? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/ordens-corte/${planoId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            carregarPlanos();
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir plano:', error);
        showNotification('Erro ao excluir plano', 'error');
    }
}

// ========== NOTIFICAÇÕES ==========
function showNotification(message, type = 'info') {
    // Implementação simples de notificação
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196F3'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
