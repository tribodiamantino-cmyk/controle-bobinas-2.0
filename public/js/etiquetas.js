/**
 * Central de Etiquetas - JavaScript
 * 
 * Gerencia a tela de impressão em lote de etiquetas
 */

const API_BASE = window.location.origin + '/api';

// Estado da aplicação
let tipoAtual = 'bobinas';
let dadosAtuais = [];
let selecionados = new Set();
let locacoesLista = [];

// =============================================================================
// INICIALIZAÇÃO
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🏷️ Central de Etiquetas iniciada');
    
    // Carregar contadores
    await carregarContadores();
    
    // Carregar dados iniciais (bobinas)
    await buscar();
    
    // Carregar fila pendente
    await atualizarContadorFila();
    
    // Configurar modo teste toggle
    configurarModoTeste();
    
    // Carregar planos para filtro de cortes
    await carregarPlanos();
});

// =============================================================================
// CONTADORES
// =============================================================================

async function carregarContadores() {
    try {
        // Bobinas
        const resBobinas = await fetch(`${API_BASE}/bobinas`);
        const dataBobinas = await resBobinas.json();
        if (dataBobinas.success) {
            document.getElementById('countBobinas').textContent = dataBobinas.data.length;
        }
        
        // Retalhos
        const resRetalhos = await fetch(`${API_BASE}/retalhos`);
        const dataRetalhos = await resRetalhos.json();
        if (dataRetalhos.success) {
            document.getElementById('countRetalhos').textContent = dataRetalhos.data.length;
        }
        
        // Cortes
        const resCortes = await fetch(`${API_BASE}/cortes`);
        const dataCortes = await resCortes.json();
        if (dataCortes.success) {
            document.getElementById('countCortes').textContent = dataCortes.data.length;
        }
        
    } catch (error) {
        console.error('Erro ao carregar contadores:', error);
    }
}

async function atualizarContadorFila() {
    try {
        const response = await fetch(`${API_BASE}/impressao/pendentes`);
        const data = await response.json();
        if (data.success) {
            document.getElementById('filaCount').textContent = data.data.length;
        }
    } catch (error) {
        console.error('Erro ao carregar fila:', error);
    }
}

// =============================================================================
// SELEÇÃO DE TIPO
// =============================================================================

function selecionarTipo(tipo) {
    tipoAtual = tipo;
    
    // Atualizar cards
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.toggle('active', card.dataset.tipo === tipo);
    });
    
    // Atualizar título do painel
    const titulos = {
        bobinas: '<i class="bi bi-box-seam me-2"></i>Bobinas',
        retalhos: '<i class="bi bi-scissors me-2"></i>Retalhos',
        cortes: '<i class="bi bi-rulers me-2"></i>Cortes',
        locacoes: '<i class="bi bi-geo-alt me-2"></i>Locações',
        historico: '<i class="bi bi-clock-history me-2"></i>Histórico de Impressão'
    };
    document.getElementById('panelTitle').innerHTML = titulos[tipo];
    
    // Mostrar/ocultar seções
    const isLocacoes = tipo === 'locacoes';
    const isHistorico = tipo === 'historico';
    document.getElementById('filtersSection').style.display = (isLocacoes || isHistorico) ? 'none' : 'block';
    document.getElementById('tableContainer').style.display = (isLocacoes || isHistorico) ? 'none' : 'block';
    document.getElementById('locacoesSection').style.display = isLocacoes ? 'block' : 'none';
    document.getElementById('historicoSection').style.display = isHistorico ? 'block' : 'none';
    document.getElementById('batchActions').classList.remove('visible');
    document.getElementById('emptyState').style.display = 'none';
    
    // Ajustar filtros específicos
    document.getElementById('filtroStatusGroup').style.display = 
        (tipo === 'bobinas' || tipo === 'retalhos') ? 'block' : 'none';
    document.getElementById('filtroPlanoGroup').style.display = 
        tipo === 'cortes' ? 'block' : 'none';
    
    // Limpar seleção
    selecionados.clear();
    document.getElementById('selectAll').checked = false;
    
    // Buscar dados conforme tipo
    if (isLocacoes) {
        document.getElementById('resultCount').textContent = 'Digite códigos para impressão';
        renderizarLocacoes();
    } else if (isHistorico) {
        document.getElementById('resultCount').textContent = '';
        carregarHistorico();
    } else {
        buscar();
    }
}

// =============================================================================
// FILTROS E BUSCA
// =============================================================================

async function buscar() {
    mostrarLoading(true);
    
    try {
        const nf = document.getElementById('filtroNF').value.trim();
        const loja = document.getElementById('filtroLoja').value;
        const status = document.getElementById('filtroStatus').value;
        const plano = document.getElementById('filtroPlano').value;
        
        let endpoint = '';
        let params = new URLSearchParams();
        
        switch (tipoAtual) {
            case 'bobinas':
                endpoint = '/bobinas';
                if (loja) params.append('loja', loja);
                if (status) params.append('status', status);
                break;
            case 'retalhos':
                endpoint = '/retalhos';
                if (loja) params.append('loja', loja);
                if (status) params.append('status', status);
                break;
            case 'cortes':
                endpoint = '/cortes';
                if (plano) params.append('plano_id', plano);
                break;
        }
        
        const url = `${API_BASE}${endpoint}${params.toString() ? '?' + params : ''}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            dadosAtuais = data.data;
            
            // Filtrar por NF se informado (filtro client-side)
            if (nf) {
                dadosAtuais = dadosAtuais.filter(item => 
                    (item.nota_fiscal && item.nota_fiscal.includes(nf)) ||
                    (item.nf && item.nf.includes(nf))
                );
            }
            
            renderizarTabela();
            document.getElementById('resultCount').textContent = 
                `${dadosAtuais.length} registro(s) encontrado(s)`;
        } else {
            throw new Error(data.error);
        }
        
    } catch (error) {
        console.error('Erro ao buscar:', error);
        dadosAtuais = [];
        renderizarTabela();
        document.getElementById('resultCount').textContent = 'Erro ao carregar dados';
    }
    
    mostrarLoading(false);
}

function limparFiltros() {
    document.getElementById('filtroNF').value = '';
    document.getElementById('filtroLoja').value = '';
    document.getElementById('filtroStatus').value = '';
    document.getElementById('filtroPlano').value = '';
    buscar();
}

async function carregarPlanos() {
    try {
        const response = await fetch(`${API_BASE}/ordens-corte`);
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('filtroPlano');
            select.innerHTML = '<option value="">Todos</option>';
            
            data.data.forEach(plano => {
                const option = document.createElement('option');
                option.value = plano.id;
                option.textContent = `${plano.codigo || 'PDC-' + plano.id} - ${plano.cliente || 'Sem cliente'}`;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar planos:', error);
    }
}

// =============================================================================
// RENDERIZAÇÃO DA TABELA
// =============================================================================

function renderizarTabela() {
    const tbody = document.getElementById('tableBody');
    const emptyState = document.getElementById('emptyState');
    const tableContainer = document.getElementById('tableContainer');
    
    if (dadosAtuais.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        tableContainer.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    tableContainer.style.display = 'block';
    
    // Ajustar colunas da tabela conforme tipo
    atualizarColunas();
    
    // Renderizar linhas
    tbody.innerHTML = dadosAtuais.map(item => gerarLinhaTabela(item)).join('');
    
    // Atualizar estado dos checkboxes
    atualizarEstadoSelecao();
}

function atualizarColunas() {
    const thead = document.querySelector('#dataTable thead tr');
    
    const colunas = {
        bobinas: `
            <th style="width: 40px;">
                <input type="checkbox" class="form-check-input" id="selectAll" onchange="toggleSelectAll()">
            </th>
            <th>Código</th>
            <th>Produto</th>
            <th>Metragem</th>
            <th>Status</th>
            <th>NF</th>
            <th style="width: 100px;">Ações</th>
        `,
        retalhos: `
            <th style="width: 40px;">
                <input type="checkbox" class="form-check-input" id="selectAll" onchange="toggleSelectAll()">
            </th>
            <th>Código</th>
            <th>Produto</th>
            <th>Metragem</th>
            <th>Status</th>
            <th>Bobina Origem</th>
            <th style="width: 100px;">Ações</th>
        `,
        cortes: `
            <th style="width: 40px;">
                <input type="checkbox" class="form-check-input" id="selectAll" onchange="toggleSelectAll()">
            </th>
            <th>Código</th>
            <th>Produto</th>
            <th>Metragem</th>
            <th>Cliente</th>
            <th>Plano</th>
            <th style="width: 100px;">Ações</th>
        `
    };
    
    thead.innerHTML = colunas[tipoAtual] || colunas.bobinas;
}

function gerarLinhaTabela(item) {
    const id = item.id;
    const isSelected = selecionados.has(id);
    const tipoSingular = tipoAtual.slice(0, -1); // bobinas -> bobina
    
    // Mapear código conforme tipo
    const codigo = item.codigo_interno || item.codigo || item.codigo_barras || `#${id}`;
    
    // Descrição do produto
    const produto = item.produto_descricao || item.descricao_produto || 
                   item.produto || item.descricao || '-';
    
    // Metragem
    const metragem = item.metragem_atual || item.metragem || item.metros || 0;
    const metrosFormatado = Number(metragem).toFixed(2).replace('.', ',') + 'm';
    
    // Status (bobinas/retalhos)
    let statusHtml = '';
    if (tipoAtual === 'bobinas' || tipoAtual === 'retalhos') {
        const status = item.status || 'ativa';
        const statusClass = `status-${status}`;
        statusHtml = `<span class="status-badge ${statusClass}">${status}</span>`;
    }
    
    // Coluna específica por tipo
    let colunaEspecifica = '';
    if (tipoAtual === 'bobinas') {
        colunaEspecifica = item.nota_fiscal || '-';
    } else if (tipoAtual === 'retalhos') {
        colunaEspecifica = item.bobina_codigo || item.bobina_origem || '-';
    } else if (tipoAtual === 'cortes') {
        colunaEspecifica = item.cliente || '-';
    }
    
    // Coluna extra para cortes (plano)
    let colunaExtra = '';
    if (tipoAtual === 'cortes') {
        colunaExtra = `<td>${item.plano_codigo || item.plano_id || '-'}</td>`;
    }
    
    return `
        <tr class="${isSelected ? 'selected' : ''}" data-id="${id}">
            <td>
                <input type="checkbox" class="form-check-input item-checkbox" 
                       data-id="${id}" ${isSelected ? 'checked' : ''}
                       onchange="toggleItem(${id})">
            </td>
            <td><span class="codigo-badge">${codigo}</span></td>
            <td>${produto}</td>
            <td><strong>${metrosFormatado}</strong></td>
            ${tipoAtual !== 'cortes' ? `<td>${statusHtml}</td>` : `<td>${colunaEspecifica}</td>`}
            ${tipoAtual === 'cortes' ? colunaExtra : `<td>${colunaEspecifica}</td>`}
            <td>
                <button class="btn btn-sm btn-outline-secondary" 
                        onclick="ImpressaoEtiquetas.abrirModal('${tipoSingular}', ${id})"
                        title="Preview e imprimir">
                    <i class="bi bi-printer"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary" 
                        onclick="adicionarAFila('${tipoSingular}', ${id})"
                        title="Adicionar à fila">
                    <i class="bi bi-plus-lg"></i>
                </button>
            </td>
        </tr>
    `;
}

// =============================================================================
// SELEÇÃO DE ITENS
// =============================================================================

function toggleItem(id) {
    if (selecionados.has(id)) {
        selecionados.delete(id);
    } else {
        selecionados.add(id);
    }
    atualizarEstadoSelecao();
}

function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    
    if (selectAll.checked) {
        dadosAtuais.forEach(item => selecionados.add(item.id));
    } else {
        selecionados.clear();
    }
    
    atualizarEstadoSelecao();
    
    // Atualizar checkboxes individuais
    document.querySelectorAll('.item-checkbox').forEach(cb => {
        cb.checked = selectAll.checked;
    });
    
    // Atualizar classes das linhas
    document.querySelectorAll('#tableBody tr').forEach(tr => {
        tr.classList.toggle('selected', selectAll.checked);
    });
}

function atualizarEstadoSelecao() {
    const count = selecionados.size;
    document.getElementById('selectedCount').textContent = count;
    
    const batchActions = document.getElementById('batchActions');
    batchActions.classList.toggle('visible', count > 0);
    
    // Atualizar estado do selectAll
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.checked = count === dadosAtuais.length && count > 0;
        selectAll.indeterminate = count > 0 && count < dadosAtuais.length;
    }
}

function limparSelecao() {
    selecionados.clear();
    document.getElementById('selectAll').checked = false;
    document.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = false);
    document.querySelectorAll('#tableBody tr').forEach(tr => tr.classList.remove('selected'));
    atualizarEstadoSelecao();
}

// =============================================================================
// AÇÕES DE IMPRESSÃO
// =============================================================================

async function adicionarAFila(tipo, id) {
    try {
        await ImpressaoEtiquetas.adicionar(tipo, id);
        atualizarContadorFila();
    } catch (error) {
        console.error('Erro ao adicionar à fila:', error);
    }
}

async function imprimirSelecionados() {
    if (selecionados.size === 0) {
        alert('Nenhum item selecionado');
        return;
    }
    
    const ids = Array.from(selecionados);
    const tipoSingular = tipoAtual.slice(0, -1);
    
    try {
        await ImpressaoEtiquetas.imprimirLote(tipoSingular, ids);
        limparSelecao();
    } catch (error) {
        console.error('Erro ao imprimir:', error);
        alert('Erro ao imprimir etiquetas');
    }
}

async function adicionarSelecionadosAFila() {
    if (selecionados.size === 0) {
        alert('Nenhum item selecionado');
        return;
    }
    
    const ids = Array.from(selecionados);
    const tipoSingular = tipoAtual.slice(0, -1);
    
    try {
        await ImpressaoEtiquetas.adicionarLote(tipoSingular, ids);
        atualizarContadorFila();
        limparSelecao();
    } catch (error) {
        console.error('Erro ao adicionar à fila:', error);
        alert('Erro ao adicionar etiquetas à fila');
    }
}

// =============================================================================
// LOCAÇÕES
// =============================================================================

function adicionarLocacao() {
    const input = document.getElementById('locacaoInput');
    const codigo = input.value.trim().toUpperCase();
    
    if (!codigo) {
        input.focus();
        return;
    }
    
    // Validar formato básico
    if (!validarFormatoLocacao(codigo)) {
        alert('Formato inválido. Use: 0001-A-0001 (SETOR-CORREDOR-POSIÇÃO)');
        input.select();
        return;
    }
    
    // Verificar duplicata
    if (locacoesLista.includes(codigo)) {
        alert('Esta locação já está na lista');
        input.select();
        return;
    }
    
    locacoesLista.push(codigo);
    input.value = '';
    input.focus();
    
    renderizarLocacoes();
}

function validarFormatoLocacao(codigo) {
    // Formato flexível: N-X-N (de 1-A-1 até 9999-Z-9999)
    const regex = /^\d{1,4}-[A-Z]-\d{1,4}$/;
    return regex.test(codigo);
}

function removerLocacao(index) {
    locacoesLista.splice(index, 1);
    renderizarLocacoes();
}

function limparLocacoes() {
    if (locacoesLista.length === 0) return;
    
    if (confirm(`Remover todas as ${locacoesLista.length} locações da lista?`)) {
        locacoesLista = [];
        renderizarLocacoes();
    }
}

function gerarRange() {
    const setor = document.getElementById('rangeSetor').value.padStart(4, '0');
    const corredor = document.getElementById('rangeCorredor').value.toUpperCase();
    const de = parseInt(document.getElementById('rangeDe').value) || 1;
    const ate = parseInt(document.getElementById('rangeAte').value) || 1;
    
    if (!setor || !corredor || de > ate) {
        alert('Preencha todos os campos corretamente');
        return;
    }
    
    if (ate - de > 100) {
        if (!confirm(`Isso vai gerar ${ate - de + 1} locações. Continuar?`)) {
            return;
        }
    }
    
    let adicionados = 0;
    for (let i = de; i <= ate; i++) {
        const codigo = `${setor}-${corredor}-${String(i).padStart(4, '0')}`;
        if (!locacoesLista.includes(codigo)) {
            locacoesLista.push(codigo);
            adicionados++;
        }
    }
    
    renderizarLocacoes();
    
    // Feedback
    ImpressaoEtiquetas.notificar('sucesso', `${adicionados} locação(ões) adicionadas`);
    
    // Limpar campos
    document.getElementById('rangeDe').value = '';
    document.getElementById('rangeAte').value = '';
}

function renderizarLocacoes() {
    const container = document.getElementById('locacoesList');
    const countEl = document.getElementById('locacoesCount');
    const btnImprimir = document.getElementById('btnImprimirLocacoes');
    
    countEl.textContent = locacoesLista.length;
    btnImprimir.disabled = locacoesLista.length === 0;
    
    if (locacoesLista.length === 0) {
        container.innerHTML = `
            <div class="empty-state py-4">
                <i class="bi bi-inbox"></i>
                <p class="mb-0">Nenhuma locação adicionada</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = locacoesLista.map((codigo, index) => `
        <div class="locacao-item">
            <span>${codigo}</span>
            <button class="btn btn-sm btn-outline-danger" onclick="removerLocacao(${index})" title="Remover">
                <i class="bi bi-x-lg"></i>
            </button>
        </div>
    `).join('');
}

async function imprimirLocacoes() {
    if (locacoesLista.length === 0) {
        alert('Nenhuma locação na lista');
        return;
    }
    
    // Para locações, precisamos gerar preview manualmente (não têm ID no banco)
    const etiquetas = locacoesLista.map(codigo => ({
        tipo: 'locacao',
        codigo: codigo,
        linha1: codigo,
        linha2_barcode: codigo.replace(/-/g, '') // Remove hífens para barcode
    }));
    
    // Usar função de lote do módulo
    ImpressaoEtiquetas.abrirJanelaImpressaoLote(etiquetas);
    
    // Perguntar se quer limpar a lista
    setTimeout(() => {
        if (confirm('Deseja limpar a lista de locações?')) {
            locacoesLista = [];
            renderizarLocacoes();
        }
    }, 500);
}

// =============================================================================
// MODO TESTE
// =============================================================================

function configurarModoTeste() {
    const toggle = document.getElementById('toggleModoTeste');
    const banner = document.getElementById('modoTesteBanner');
    
    // Verificar estado salvo
    const modoTesteSalvo = localStorage.getItem('etiquetas_modo_teste') === 'true';
    toggle.checked = modoTesteSalvo;
    ImpressaoEtiquetas.MODO_TESTE = modoTesteSalvo;
    banner.classList.toggle('visible', modoTesteSalvo);
    
    // Listener
    toggle.addEventListener('change', () => {
        ImpressaoEtiquetas.MODO_TESTE = toggle.checked;
        localStorage.setItem('etiquetas_modo_teste', toggle.checked);
        banner.classList.toggle('visible', toggle.checked);
        
        console.log(`🧪 Modo Teste: ${toggle.checked ? 'ATIVADO' : 'DESATIVADO'}`);
    });
}

// =============================================================================
// UTILITÁRIOS
// =============================================================================

function mostrarLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('visible', show);
}

// =============================================================================
// HISTÓRICO DE IMPRESSÃO
// =============================================================================

let historicoFiltro = 'todos';
let historicoData = [];

async function carregarHistorico() {
    try {
        const response = await fetch(`${API_BASE}/impressao/historico`);
        const data = await response.json();
        
        if (data.success) {
            historicoData = data.data || [];
            
            // Atualizar contador
            document.getElementById('countHistorico').textContent = historicoData.length;
            
            renderizarHistorico();
        }
    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        document.getElementById('historicoBody').innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger py-4">
                    <i class="bi bi-exclamation-circle fs-1 d-block mb-2"></i>
                    Erro ao carregar histórico
                </td>
            </tr>
        `;
    }
}

function filtrarHistorico(filtro) {
    historicoFiltro = filtro;
    
    // Atualizar botões
    document.getElementById('btnHistTodos').classList.toggle('active', filtro === 'todos');
    document.getElementById('btnHistImpresso').classList.toggle('active', filtro === 'impresso');
    document.getElementById('btnHistPendente').classList.toggle('active', filtro === 'pendente');
    document.getElementById('btnHistErro').classList.toggle('active', filtro === 'erro');
    
    renderizarHistorico();
}

function renderizarHistorico() {
    const tbody = document.getElementById('historicoBody');
    
    // Filtrar dados
    let dadosFiltrados = historicoData;
    if (historicoFiltro !== 'todos') {
        dadosFiltrados = historicoData.filter(item => item.status === historicoFiltro);
    }
    
    if (dadosFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    Nenhum registro ${historicoFiltro !== 'todos' ? 'com este status' : 'no histórico'}
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = dadosFiltrados.map(item => {
        const statusBadge = getStatusBadge(item.status);
        const dataFormatada = new Date(item.created_at).toLocaleString('pt-BR');
        const tipoIcon = getTipoIcon(item.tipo_etiqueta);
        
        return `
            <tr>
                <td><span class="codigo-badge">${item.codigo || '-'}</span></td>
                <td>${tipoIcon} ${item.tipo_etiqueta}</td>
                <td class="small">${item.descricao || '-'}</td>
                <td class="small text-muted">${dataFormatada}</td>
                <td>${statusBadge}</td>
                <td>
                    ${item.status === 'erro' || item.status === 'pendente' ? `
                        <button class="btn btn-sm btn-outline-primary" onclick="reimprimirItem(${item.id})" title="Reimprimir">
                            <i class="bi bi-printer"></i>
                        </button>
                    ` : ''}
                    <button class="btn btn-sm btn-outline-danger" onclick="removerDoHistorico(${item.id})" title="Remover">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function getStatusBadge(status) {
    const badges = {
        'pendente': '<span class="badge bg-warning text-dark">⏳ Pendente</span>',
        'impresso': '<span class="badge bg-success">✅ Impresso</span>',
        'erro': '<span class="badge bg-danger">❌ Erro</span>'
    };
    return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

function getTipoIcon(tipo) {
    const icons = {
        'bobina': '<i class="bi bi-box-seam text-primary"></i>',
        'retalho': '<i class="bi bi-scissors text-success"></i>',
        'corte': '<i class="bi bi-rulers text-warning"></i>',
        'locacao': '<i class="bi bi-geo-alt text-info"></i>'
    };
    return icons[tipo] || '<i class="bi bi-tag"></i>';
}

async function reimprimirItem(id) {
    try {
        const response = await fetch(`${API_BASE}/impressao/reimprimir/${id}`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            ImpressaoEtiquetas.notificar('sucesso', 'Etiqueta reenviada para impressão');
            carregarHistorico();
        } else {
            ImpressaoEtiquetas.notificar('erro', data.error || 'Erro ao reimprimir');
        }
    } catch (error) {
        console.error('Erro ao reimprimir:', error);
        ImpressaoEtiquetas.notificar('erro', 'Erro ao reimprimir');
    }
}

async function removerDoHistorico(id) {
    if (!confirm('Remover este item do histórico?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/impressao/fila/${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
            ImpressaoEtiquetas.notificar('sucesso', 'Item removido');
            carregarHistorico();
        } else {
            ImpressaoEtiquetas.notificar('erro', data.error || 'Erro ao remover');
        }
    } catch (error) {
        console.error('Erro ao remover:', error);
        ImpressaoEtiquetas.notificar('erro', 'Erro ao remover');
    }
}

// Expor função de atualização de fila globalmente
window.atualizarContadorFila = atualizarContadorFila;

// Função para mostrar a fila de impressão (vai para histórico com filtro pendentes)
function mostrarFila() {
    // Selecionar o tipo histórico
    selecionarTipo('historico');
    // Aplicar filtro de pendentes
    setTimeout(() => {
        filtrarHistorico('pendente');
    }, 300);
}
