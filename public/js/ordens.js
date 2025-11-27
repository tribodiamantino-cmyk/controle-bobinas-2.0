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
    
    // Indicadores de alocação
    const itensAlocados = plano.itens_alocados || 0;
    const itensNaoAlocados = totalItens - itensAlocados;
    
    let badgeAlocacao = '';
    if (plano.status === 'planejamento' && totalItens > 0) {
        if (itensAlocados === totalItens) {
            badgeAlocacao = '<span class="badge-alocacao badge-completo">✅ Tudo alocado</span>';
        } else if (itensAlocados > 0) {
            badgeAlocacao = `<span class="badge-alocacao badge-parcial">⚠️ ${itensAlocados}/${totalItens} alocados</span>`;
        } else {
            badgeAlocacao = '<span class="badge-alocacao badge-pendente">⏳ Pendente alocação</span>';
        }
    }
    
    let acoes = '';
    
    // Botão de salvar como template (disponível em todos os status)
    const btnTemplate = `
        <button class="btn-kanban btn-kanban-info" onclick="event.stopPropagation(); abrirModalSalvarTemplate(${plano.id})" title="Salvar este plano como obra padrão">
            <span class="btn-kanban-icon">💾</span>
            <span class="btn-kanban-text">Salvar Template</span>
        </button>
    `;
    
    if (plano.status === 'planejamento') {
        acoes = `
            <button class="btn-kanban btn-kanban-primary" onclick="event.stopPropagation(); alocarAutomaticamente(${plano.id})" title="Aloca automaticamente todas as origens">
                <span class="btn-kanban-icon">🤖</span>
                <span class="btn-kanban-text">Auto-Alocar</span>
            </button>
            ${btnTemplate}
            <button class="btn-kanban btn-kanban-success" onclick="event.stopPropagation(); enviarParaProducao(${plano.id})">
                <span class="btn-kanban-icon">▶</span>
                <span class="btn-kanban-text">Produzir</span>
            </button>
            <button class="btn-kanban btn-kanban-danger" onclick="event.stopPropagation(); excluirPlano(${plano.id})">
                <span class="btn-kanban-icon">🗑</span>
                <span class="btn-kanban-text">Excluir</span>
            </button>
        `;
    } else if (plano.status === 'em_producao') {
        acoes = `
            <button class="btn-kanban btn-kanban-info" onclick="event.stopPropagation(); imprimirOrdemProducao(${plano.id})" title="Imprimir ordem de produção">
                <span class="btn-kanban-icon">🖨️</span>
                <span class="btn-kanban-text">Imprimir</span>
            </button>
            <button class="btn-kanban btn-kanban-warning" onclick="event.stopPropagation(); voltarParaPlanejamento(${plano.id})">
                <span class="btn-kanban-icon">◀</span>
                <span class="btn-kanban-text">Voltar</span>
            </button>
            ${btnTemplate}
            <button class="btn-kanban btn-kanban-success" onclick="event.stopPropagation(); abrirModalFinalizacao(${plano.id})">
                <span class="btn-kanban-icon">✓</span>
                <span class="btn-kanban-text">Finalizar</span>
            </button>
        `;
    } else if (plano.status === 'finalizado') {
        acoes = `
            ${btnTemplate}
            <button class="btn-kanban btn-kanban-info" onclick="event.stopPropagation(); arquivarPlano(${plano.id})">
                <span class="btn-kanban-icon">📦</span>
                <span class="btn-kanban-text">Arquivar</span>
            </button>
        `;
    }
    
    return `
        <div class="plano-card" onclick="abrirDetalhesPlano(${plano.id})">
            <div class="plano-card-header">
                <div class="plano-codigo">${plano.codigo_plano}</div>
                ${badgeAlocacao}
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
let cortesAgrupados = {}; // { produto_id: [{ metragem, observacoes }, ...] }
let produtoAtualSelecionado = null;

function abrirModalNovoPlano() {
    document.getElementById('modalNovoPlano').style.display = 'flex';
    document.getElementById('formNovoPlano').reset();
    
    // Resetar estado
    cortesAgrupados = {};
    produtoAtualSelecionado = null;
    
    // Popular select de produtos
    popularSelectProdutos();
    
    // Limpar lista de cortes
    renderizarListaCortes();
    
    // Esconder área de input
    document.getElementById('areaInputCortes').style.display = 'none';
}

function fecharModalNovoPlano() {
    document.getElementById('modalNovoPlano').style.display = 'none';
}

function popularSelectProdutos() {
    const select = document.getElementById('produtoSelecionado');
    
    const optionsProdutos = produtos.map(p => 
        `<option value="${p.id}">${p.codigo} - ${p.nome_cor} - ${p.gramatura}g - ${p.tipo_tecido}</option>`
    ).join('');
    
    select.innerHTML = `<option value="">Selecione um produto...</option>${optionsProdutos}`;
}

function selecionarProduto() {
    const selectProduto = document.getElementById('produtoSelecionado');
    const produtoId = selectProduto.value;
    const areaInput = document.getElementById('areaInputCortes');
    
    if (produtoId) {
        produtoAtualSelecionado = parseInt(produtoId);
        areaInput.style.display = 'block';
        
        // Limpar campos
        document.getElementById('inputMetragem').value = '';
        document.getElementById('inputObservacoes').value = '';
        
        // Focar no campo de metragem
        setTimeout(() => {
            document.getElementById('inputMetragem').focus();
        }, 100);
    } else {
        areaInput.style.display = 'none';
        produtoAtualSelecionado = null;
    }
}

function handleEnterMetragem(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('inputObservacoes').focus();
    }
}

function handleEnterObservacoes(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        adicionarCorteAtual();
    }
}

function adicionarCorteAtual() {
    const metragem = parseFloat(document.getElementById('inputMetragem').value);
    const observacoes = document.getElementById('inputObservacoes').value.trim();
    
    if (!metragem || metragem <= 0) {
        showNotification('Informe uma metragem válida', 'warning');
        document.getElementById('inputMetragem').focus();
        return;
    }
    
    if (!produtoAtualSelecionado) {
        showNotification('Selecione um produto primeiro', 'warning');
        return;
    }
    
    // Adicionar corte ao grupo do produto
    if (!cortesAgrupados[produtoAtualSelecionado]) {
        cortesAgrupados[produtoAtualSelecionado] = [];
    }
    
    cortesAgrupados[produtoAtualSelecionado].push({
        metragem: metragem,
        observacoes: observacoes || null
    });
    
    // Limpar campos
    document.getElementById('inputMetragem').value = '';
    document.getElementById('inputObservacoes').value = '';
    
    // Renderizar lista atualizada
    renderizarListaCortes();
    
    // Focar novamente no campo de metragem
    document.getElementById('inputMetragem').focus();
}

function renderizarListaCortes() {
    const container = document.getElementById('listaCortesPlano');
    
    const totalCortes = Object.values(cortesAgrupados).reduce((sum, cortes) => sum + cortes.length, 0);
    
    if (totalCortes === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                Selecione um produto e adicione cortes acima
            </div>
        `;
        return;
    }
    
    let html = '';
    
    for (const produtoId in cortesAgrupados) {
        const produto = produtos.find(p => p.id == produtoId);
        if (!produto) continue;
        
        const cortes = cortesAgrupados[produtoId];
        const metragemTotal = cortes.reduce((sum, c) => sum + c.metragem, 0);
        
        html += `
            <div class="grupo-produto">
                <div class="grupo-produto-header">
                    <div>
                        <div class="grupo-produto-titulo">${produto.codigo}</div>
                        <div class="grupo-produto-info">${produto.nome_cor} • ${produto.gramatura}g • ${produto.tipo_tecido}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div class="grupo-produto-badge">${cortes.length} corte${cortes.length > 1 ? 's' : ''}</div>
                        <div style="font-weight: 600; color: #333;">Total: ${metragemTotal.toFixed(2)}m</div>
                        <button type="button" class="btn-remover-mini" onclick="removerProduto(${produtoId})" title="Remover todos os cortes deste produto">
                            🗑️
                        </button>
                    </div>
                </div>
                <div>
                    ${cortes.map((corte, index) => `
                        <div class="corte-mini-item">
                            <div class="corte-mini-info">
                                <div class="corte-mini-metragem">📏 ${corte.metragem.toFixed(2)}m</div>
                                ${corte.observacoes ? `<div class="corte-mini-obs">💬 ${corte.observacoes}</div>` : ''}
                            </div>
                            <button type="button" class="btn-remover-mini" onclick="removerCorte(${produtoId}, ${index})" title="Remover este corte">
                                ✕
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function removerCorte(produtoId, corteIndex) {
    if (!cortesAgrupados[produtoId]) return;
    
    cortesAgrupados[produtoId].splice(corteIndex, 1);
    
    // Se não sobrou nenhum corte do produto, remover o produto
    if (cortesAgrupados[produtoId].length === 0) {
        delete cortesAgrupados[produtoId];
    }
    
    renderizarListaCortes();
}

function removerProduto(produtoId) {
    if (!confirm('Deseja remover TODOS os cortes deste produto?')) {
        return;
    }
    
    delete cortesAgrupados[produtoId];
    renderizarListaCortes();
}

// Submeter formulário de novo plano
document.getElementById('formNovoPlano').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cliente = document.getElementById('clientePlano').value.trim();
    const aviario = document.getElementById('aviarioPlano').value.trim();
    
    // Converter cortesAgrupados para array de itens
    const itens = [];
    
    for (const produtoId in cortesAgrupados) {
        const cortes = cortesAgrupados[produtoId];
        cortes.forEach(corte => {
            itens.push({
                produto_id: parseInt(produtoId),
                metragem: corte.metragem,
                observacoes: corte.observacoes
            });
        });
    }
    
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
            
            // Se estiver em planejamento, buscar sugestões de estoque
            if (planoAtual.status === 'planejamento') {
                try {
                    const sugestoesResponse = await fetch(`${API_BASE}/ordens-corte/${planoId}/sugestoes`);
                    const sugestoesData = await sugestoesResponse.json();
                    
                    if (sugestoesData.success) {
                        // Criar um mapa de disponibilidade por item_id
                        const disponibilidade = {};
                        sugestoesData.data.forEach(sug => {
                            disponibilidade[sug.item_id] = {
                                temEstoque: !!sug.origem,
                                erro: sug.erro
                            };
                        });
                        planoAtual.disponibilidade = disponibilidade;
                    }
                } catch (error) {
                    console.warn('Erro ao buscar sugestões:', error);
                }
            }
            
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
    
    // Mostrar botão de edição se estiver em planejamento
    let botoesAdicionais = '';
    if (plano.status === 'planejamento') {
        botoesAdicionais = `
            <button class="btn btn-primary" onclick="ativarModoEdicao()" style="margin-right: auto;">
                ✏️ Editar Plano
            </button>
        `;
    }
    
    let conteudoHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            ${botoesAdicionais}
        </div>
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
        const disp = plano.disponibilidade ? plano.disponibilidade[item.id] : null;
        
        let origemTexto = '<span style="color: #999;">Não alocada</span>';
        let classeLinha = '';
        
        // Verificar disponibilidade de estoque
        if (plano.status === 'planejamento' && disp) {
            if (!disp.temEstoque && !origem) {
                classeLinha = 'linha-sem-estoque';
                origemTexto = `<span style="color: #dc3545; font-weight: 600;">❌ SEM ESTOQUE</span><br>
                              <small style="color: #666;">${disp.erro || 'Produto indisponível'}</small>`;
            } else if (disp.temEstoque && !origem) {
                origemTexto = '<span style="color: #28a745; font-weight: 600;">✅ Disponível</span>';
            }
        }
        
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
            <tr class="${classeLinha}">
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
    document.getElementById('modoVisualizacao').style.display = 'block';
    document.getElementById('modoEdicao').style.display = 'none';
}

function fecharModalDetalhes() {
    document.getElementById('modalDetalhesPlano').style.display = 'none';
}

// ========== MODO DE EDIÇÃO ==========
let cortesEdicao = {};
let produtoEdicaoSelecionado = null;

function ativarModoEdicao() {
    if (!planoAtual) return;
    
    // Carregar cortes atuais para edição
    cortesEdicao = {};
    
    planoAtual.itens.forEach(item => {
        if (!cortesEdicao[item.produto_id]) {
            cortesEdicao[item.produto_id] = [];
        }
        cortesEdicao[item.produto_id].push({
            id: item.id, // ID do item para poder excluir no backend
            metragem: parseFloat(item.metragem),
            observacoes: item.observacoes,
            existente: true // Marca como item já existente
        });
    });
    
    // Popular select de produtos para adicionar novos
    const select = document.getElementById('produtoSelecionadoEdicao');
    const optionsProdutos = produtos.map(p => 
        `<option value="${p.id}">${p.codigo} - ${p.nome_cor} - ${p.gramatura}g - ${p.tipo_tecido}</option>`
    ).join('');
    select.innerHTML = `<option value="">Selecione um produto para adicionar...</option>${optionsProdutos}`;
    
    // Renderizar lista de cortes em modo edição
    renderizarListaCortesEdicao();
    
    // Alternar para modo edição
    document.getElementById('modoVisualizacao').style.display = 'none';
    document.getElementById('modoEdicao').style.display = 'block';
    document.getElementById('areaInputCortesEdicao').style.display = 'none';
}

function selecionarProdutoEdicao() {
    const selectProduto = document.getElementById('produtoSelecionadoEdicao');
    const produtoId = selectProduto.value;
    const areaInput = document.getElementById('areaInputCortesEdicao');
    
    if (produtoId) {
        produtoEdicaoSelecionado = parseInt(produtoId);
        areaInput.style.display = 'block';
        
        document.getElementById('inputMetragemEdicao').value = '';
        document.getElementById('inputObservacoesEdicao').value = '';
        
        setTimeout(() => {
            document.getElementById('inputMetragemEdicao').focus();
        }, 100);
    } else {
        areaInput.style.display = 'none';
        produtoEdicaoSelecionado = null;
    }
}

function handleEnterMetragemEdicao(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('inputObservacoesEdicao').focus();
    }
}

function handleEnterObservacoesEdicao(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        adicionarCorteEdicao();
    }
}

function adicionarCorteEdicao() {
    const metragem = parseFloat(document.getElementById('inputMetragemEdicao').value);
    const observacoes = document.getElementById('inputObservacoesEdicao').value.trim();
    
    if (!metragem || metragem <= 0) {
        showNotification('Informe uma metragem válida', 'warning');
        document.getElementById('inputMetragemEdicao').focus();
        return;
    }
    
    if (!produtoEdicaoSelecionado) {
        showNotification('Selecione um produto primeiro', 'warning');
        return;
    }
    
    if (!cortesEdicao[produtoEdicaoSelecionado]) {
        cortesEdicao[produtoEdicaoSelecionado] = [];
    }
    
    cortesEdicao[produtoEdicaoSelecionado].push({
        metragem: metragem,
        observacoes: observacoes || null,
        existente: false // Novo corte
    });
    
    document.getElementById('inputMetragemEdicao').value = '';
    document.getElementById('inputObservacoesEdicao').value = '';
    
    renderizarListaCortesEdicao();
    
    document.getElementById('inputMetragemEdicao').focus();
}

function renderizarListaCortesEdicao() {
    const container = document.getElementById('listaCortesEdicao');
    
    const totalCortes = Object.values(cortesEdicao).reduce((sum, cortes) => sum + cortes.length, 0);
    
    if (totalCortes === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                Nenhum corte no plano
            </div>
        `;
        return;
    }
    
    let html = '';
    
    for (const produtoId in cortesEdicao) {
        const produto = produtos.find(p => p.id == produtoId);
        if (!produto) continue;
        
        const cortes = cortesEdicao[produtoId];
        if (cortes.length === 0) continue;
        
        const metragemTotal = cortes.reduce((sum, c) => sum + c.metragem, 0);
        
        html += `
            <div class="grupo-produto">
                <div class="grupo-produto-header">
                    <div>
                        <div class="grupo-produto-titulo">${produto.codigo}</div>
                        <div class="grupo-produto-info">${produto.nome_cor} • ${produto.gramatura}g • ${produto.tipo_tecido}</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div class="grupo-produto-badge">${cortes.length} corte${cortes.length > 1 ? 's' : ''}</div>
                        <div style="font-weight: 600; color: #333;">Total: ${metragemTotal.toFixed(2)}m</div>
                    </div>
                </div>
                <div>
                    ${cortes.map((corte, index) => `
                        <div class="corte-mini-item">
                            <div class="corte-mini-info">
                                <div class="corte-mini-metragem">
                                    📏 ${corte.metragem.toFixed(2)}m
                                    ${corte.existente ? '<span class="badge-prioridade media" style="font-size: 0.7rem; margin-left: 8px;">EXISTENTE</span>' : '<span class="badge-prioridade alta" style="font-size: 0.7rem; margin-left: 8px;">NOVO</span>'}
                                </div>
                                ${corte.observacoes ? `<div class="corte-mini-obs">💬 ${corte.observacoes}</div>` : ''}
                            </div>
                            <button type="button" class="btn-remover-mini" onclick="removerCorteEdicao(${produtoId}, ${index})" title="Remover este corte">
                                ✕
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

function removerCorteEdicao(produtoId, corteIndex) {
    if (!cortesEdicao[produtoId]) return;
    
    const corte = cortesEdicao[produtoId][corteIndex];
    
    if (corte.existente) {
        if (!confirm('Este corte já existe no plano. Deseja realmente removê-lo?')) {
            return;
        }
    }
    
    cortesEdicao[produtoId].splice(corteIndex, 1);
    
    if (cortesEdicao[produtoId].length === 0) {
        delete cortesEdicao[produtoId];
    }
    
    renderizarListaCortesEdicao();
}

function cancelarEdicao() {
    if (!confirm('Descartar todas as alterações?')) {
        return;
    }
    
    renderizarDetalhesPlano(planoAtual);
}

async function salvarEdicao() {
    if (!confirm('Salvar as alterações no plano?')) {
        return;
    }
    
    // Preparar dados: itens para excluir e itens para adicionar
    const itensExcluir = [];
    const itensAdicionar = [];
    
    // Verificar quais itens existentes foram removidos
    planoAtual.itens.forEach(item => {
        const produtoCortes = cortesEdicao[item.produto_id] || [];
        const aindaExiste = produtoCortes.find(c => c.id === item.id);
        
        if (!aindaExiste) {
            itensExcluir.push(item.id);
        }
    });
    
    // Coletar novos itens
    for (const produtoId in cortesEdicao) {
        const cortes = cortesEdicao[produtoId];
        cortes.forEach(corte => {
            if (!corte.existente) {
                itensAdicionar.push({
                    produto_id: parseInt(produtoId),
                    metragem: corte.metragem,
                    observacoes: corte.observacoes
                });
            }
        });
    }
    
    try {
        // Excluir itens removidos
        for (const itemId of itensExcluir) {
            await fetch(`${API_BASE}/ordens-corte/item/${itemId}`, {
                method: 'DELETE'
            });
        }
        
        // Adicionar novos itens
        if (itensAdicionar.length > 0) {
            await fetch(`${API_BASE}/ordens-corte/${planoAtual.id}/itens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itens: itensAdicionar })
            });
        }
        
        showNotification('Plano atualizado com sucesso!', 'success');
        
        // Recarregar plano
        await abrirDetalhesPlano(planoAtual.id);
        
        // Recarregar lista do Kanban
        carregarPlanos();
        
    } catch (error) {
        console.error('Erro ao salvar edição:', error);
        showNotification('Erro ao salvar alterações', 'error');
    }
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
    const metragemReservada = metragemTotal - metragemDisp;
    const temReserva = metragemReservada > 0;
    
    return `
        <div class="origem-sugestao ${temReserva ? 'origem-com-reserva' : ''}">
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
                <div class="origem-info-item ${temReserva ? 'destaque-disponivel' : ''}">
                    <span class="origem-info-label">Disponível:</span>
                    <span><strong>${metragemDisp}m</strong></span>
                </div>
                ${temReserva ? `
                <div class="origem-info-item origem-info-reservada">
                    <span class="origem-info-label">⚠️ Reservada:</span>
                    <span><strong>${metragemReservada.toFixed(2)}m</strong></span>
                </div>
                ` : ''}
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
            ${temReserva ? `
                <div class="alert alert-warning" style="margin-top: 0.5rem; font-size: 0.85rem;">
                    ⚠️ Esta origem possui ${metragemReservada.toFixed(2)}m reservada em outro plano
                </div>
            ` : ''}
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

// ========== ALOCAÇÃO AUTOMÁTICA ==========
async function alocarAutomaticamente(planoId) {
    try {
        // Buscar sugestões primeiro para verificar disponibilidade
        const response = await fetch(`${API_BASE}/ordens-corte/${planoId}/sugestoes`);
        const data = await response.json();
        
        if (!data.success) {
            showNotification('Erro ao buscar sugestões: ' + data.error, 'error');
            return;
        }
        
        const sugestoes = data.data;
        const comEstoque = sugestoes.filter(s => s.origem && s.origem.tipo);
        const semEstoque = sugestoes.filter(s => !s.origem || !s.origem.tipo);
        
        // Se não houver NENHUM item com estoque, avisar
        if (comEstoque.length === 0) {
            showNotification(`❌ Nenhum corte tem estoque disponível. Total sem estoque: ${semEstoque.length}`, 'error');
            return;
        }
        
        // Montar mensagem de confirmação com detalhes
        let mensagem = 'Alocar automaticamente as origens disponíveis?\n\n';
        mensagem += `✅ ${comEstoque.length} corte(s) serão alocados\n`;
        if (semEstoque.length > 0) {
            mensagem += `⚠️ ${semEstoque.length} corte(s) ficarão pendentes (sem estoque)\n`;
        }
        mensagem += '\nO sistema irá:\n✓ Priorizar retalhos\n✓ Escolher as menores bobinas disponíveis\n✓ Deixar marcados os itens sem estoque';
        
        if (!confirm(mensagem)) {
            return;
        }
        
        // Mostrar loading
        showNotification('Alocando origens disponíveis...', 'info');
        
        let sucessos = 0;
        let erros = 0;
        let errosDetalhes = [];
        
        // Alocar cada sugestão que tem origem disponível
        for (const sugestao of comEstoque) {
            try {
                const alocResponse = await fetch(`${API_BASE}/ordens-corte/alocar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        item_id: sugestao.item_id,
                        tipo_origem: sugestao.origem.tipo,
                        origem_id: sugestao.origem.id
                    })
                });
                
                const alocData = await alocResponse.json();
                
                if (alocData.success) {
                    sucessos++;
                } else {
                    erros++;
                    errosDetalhes.push(`Item ${sugestao.item_id}: ${alocData.error}`);
                }
            } catch (error) {
                erros++;
                errosDetalhes.push(`Item ${sugestao.item_id}: Erro ao alocar`);
            }
        }
        
        // Mostrar resultado detalhado
        if (sucessos > 0 && erros === 0 && semEstoque.length === 0) {
            showNotification(`✅ Todos os ${sucessos} corte(s) foram alocados com sucesso!`, 'success');
        } else if (sucessos > 0 && semEstoque.length === 0) {
            showNotification(`⚠️ ${sucessos} alocado(s), mas ${erros} tiveram erro. Veja o console.`, 'warning');
            if (errosDetalhes.length > 0) console.warn('Erros de alocação:', errosDetalhes);
        } else if (sucessos > 0 && semEstoque.length > 0) {
            showNotification(`✅ ${sucessos} corte(s) alocados. ${semEstoque.length} ficaram pendentes (sem estoque). Abra os detalhes para ver.`, 'success');
            if (errosDetalhes.length > 0) console.warn('Erros de alocação:', errosDetalhes);
        } else {
            showNotification(`❌ Erro ao alocar. Veja os detalhes no console.`, 'error');
            console.error('Erros de alocação:', errosDetalhes);
        }
        
        // Recarregar planos
        carregarPlanos();
        
        // Se o modal de detalhes estiver aberto, atualizar
        if (planoAtual && planoAtual.id === planoId) {
            abrirDetalhesPlano(planoId);
        }
        
    } catch (error) {
        console.error('Erro na alocação automática:', error);
        showNotification('Erro na alocação automática', 'error');
    }
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

// ========== VOLTAR PARA PLANEJAMENTO ==========
async function voltarParaPlanejamento(planoId) {
    if (!confirm('Deseja voltar este plano para a fase de planejamento? As reservas de metragem serão liberadas.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/ordens-corte/${planoId}/voltar-planejamento`, {
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
        console.error('Erro ao voltar para planejamento:', error);
        showNotification('Erro ao voltar para planejamento', 'error');
    }
}

// ========== ARQUIVAR PLANO ==========
async function arquivarPlano(planoId) {
    if (!confirm('Deseja arquivar este plano finalizado? Ele será removido da visualização.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/ordens-corte/${planoId}/arquivar`, {
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
        console.error('Erro ao arquivar plano:', error);
        showNotification('Erro ao arquivar plano', 'error');
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

// ========== OBRAS PADRÃO / TEMPLATES ==========

async function abrirModalTemplates() {
    document.getElementById('modalTemplates').style.display = 'flex';
    await carregarTemplates();
}

function fecharModalTemplates() {
    document.getElementById('modalTemplates').style.display = 'none';
}

async function carregarTemplates() {
    try {
        const response = await fetch('/api/obras-padrao');
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao carregar templates');
        }
        
        const templates = data.data;
        const container = document.getElementById('listaTemplates');
        
        if (templates.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <p style="font-size: 48px; margin-bottom: 10px;">📋</p>
                    <p>Nenhuma obra padrão salva ainda.</p>
                    <p style="font-size: 14px; margin-top: 10px;">Crie um plano e salve como template para reutilizar depois!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = templates.map(template => `
            <div class="template-card" style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; cursor: pointer; transition: all 0.2s;" 
                 onclick="usarTemplate(${template.id})"
                 onmouseenter="this.style.borderColor='var(--primary-color)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'"
                 onmouseleave="this.style.borderColor='#ddd'; this.style.boxShadow='none'">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: var(--primary-color);">📋 ${template.nome}</h3>
                    <button class="btn btn-sm btn-danger" onclick="event.stopPropagation(); excluirTemplate(${template.id})" title="Excluir template">🗑️</button>
                </div>
                ${template.descricao ? `<p style="color: #666; margin: 8px 0;">${template.descricao}</p>` : ''}
                <div style="display: flex; gap: 20px; margin-top: 12px; font-size: 14px; color: #666;">
                    <span>📦 <strong>${template.total_itens || 0}</strong> cortes</span>
                    <span>📏 <strong>${parseFloat(template.metragem_total || 0).toFixed(2)}m</strong> total</span>
                    ${template.vezes_utilizada > 0 ? `<span>🔄 Usado <strong>${template.vezes_utilizada}x</strong></span>` : ''}
                </div>
                ${template.produtos ? `<div style="margin-top: 10px; font-size: 13px; color: #888;">Produtos: ${template.produtos}</div>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        showNotification('Erro ao carregar templates: ' + error.message, 'error');
        console.error(error);
    }
}

async function usarTemplate(templateId) {
    // Armazenar o ID do template e abrir modal para pedir cliente e aviário
    window.templateSelecionadoId = templateId;
    document.getElementById('modalCriarPlanoTemplate').style.display = 'flex';
    document.getElementById('formCriarPlanoTemplate').reset();
    
    // Focar no primeiro campo
    setTimeout(() => {
        document.getElementById('clientePlanoTemplate').focus();
    }, 100);
}

function fecharModalCriarPlanoTemplate() {
    document.getElementById('modalCriarPlanoTemplate').style.display = 'none';
    window.templateSelecionadoId = null;
}

async function confirmarCriarPlanoTemplate() {
    try {
        const cliente = document.getElementById('clientePlanoTemplate').value.trim();
        const aviario = document.getElementById('aviarioPlanoTemplate').value.trim();
        
        if (!cliente || !aviario) {
            showNotification('Preencha Cliente e Aviário', 'warning');
            return;
        }
        
        const templateId = window.templateSelecionadoId;
        if (!templateId) {
            showNotification('Template não selecionado', 'error');
            return;
        }
        
        // Criar código do plano
        const timestamp = Date.now();
        const codigoPlano = `${cliente.substring(0, 3).toUpperCase()}-${aviario.substring(0, 3).toUpperCase()}-${timestamp}`;
        
        showNotification('Criando plano a partir do template...', 'info');
        
        const response = await fetch(`${API_BASE}/obras-padrao/criar-plano`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                obra_padrao_id: templateId,
                codigo_plano: codigoPlano,
                cliente: cliente,
                aviario: aviario
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao criar plano do template');
        }
        
        showNotification('✨ Plano criado a partir do template com sucesso!', 'success');
        fecharModalCriarPlanoTemplate();
        fecharModalTemplates();
        await carregarPlanos();
        
    } catch (error) {
        showNotification('Erro ao criar plano: ' + error.message, 'error');
        console.error(error);
    }
}

async function excluirTemplate(templateId) {
    if (!confirm('Tem certeza que deseja excluir esta obra padrão?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/obras-padrao/${templateId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao excluir template');
        }
        
        showNotification('Template excluído com sucesso', 'success');
        await carregarTemplates();
        
    } catch (error) {
        showNotification('Erro ao excluir template: ' + error.message, 'error');
        console.error(error);
    }
}

let planoParaSalvarComoTemplate = null;

function abrirModalSalvarTemplate(planoId) {
    planoParaSalvarComoTemplate = planoId;
    const modal = document.getElementById('modalSalvarTemplate');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('formSalvarTemplate').reset();
        console.log('Modal aberto para plano:', planoId);
    } else {
        console.error('Modal modalSalvarTemplate não encontrado');
        showNotification('Erro ao abrir modal de template', 'error');
    }
}

function fecharModalSalvarTemplate() {
    const modal = document.getElementById('modalSalvarTemplate');
    if (modal) {
        modal.style.display = 'none';
    }
    planoParaSalvarComoTemplate = null;
}

// Listener para formulário de salvar template
window.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formSalvarTemplate');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nome = document.getElementById('nomeTemplate').value;
            const descricao = document.getElementById('descricaoTemplate').value;
            
            if (!planoParaSalvarComoTemplate) {
                showNotification('Nenhum plano selecionado', 'error');
                return;
            }
            
            console.log('Salvando template do plano:', planoParaSalvarComoTemplate);
            
            try {
                const response = await fetch('/api/obras-padrao/criar-de-plano', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        plano_id: planoParaSalvarComoTemplate,
                        nome: nome,
                        descricao: descricao
                    })
                });
                
                const data = await response.json();
                
                console.log('Resposta da API:', data);
                
                if (!response.ok) {
                    throw new Error(data.error || 'Erro ao salvar template');
                }
                
                showNotification('💾 Obra padrão salva com sucesso!', 'success');
                fecharModalSalvarTemplate();
                
            } catch (error) {
                showNotification('Erro ao salvar template: ' + error.message, 'error');
                console.error('Erro detalhado:', error);
            }
        });
    } else {
        console.error('Formulário formSalvarTemplate não encontrado');
    }
});
