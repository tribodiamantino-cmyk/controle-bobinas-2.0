const API_BASE = '/api';
let retalhosCache = [];
let produtosCache = [];
let retalhoParaImprimir = null;

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    carregarProdutos();
    carregarRetalhos();
    
    // Event listeners para filtros
    document.getElementById('busca').addEventListener('input', aplicarFiltros);
    document.getElementById('filtroLoja').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroMetragem').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroStatus').addEventListener('change', aplicarFiltros);
});

// ========== CARREGAR DADOS ==========
async function carregarProdutos() {
    try {
        const response = await fetch(`${API_BASE}/produtos`);
        const data = await response.json();
        
        if (data.success) {
            produtosCache = data.data || [];
            popularSelectProdutos();
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
    const loja = document.getElementById('filtroLoja').value;
    const metragem = document.getElementById('filtroMetragem').value;
    const status = document.getElementById('filtroStatus').value;
    
    const filtrados = retalhosCache.filter(r => {
        // Busca geral
        if (busca) {
            const termo = busca.toLowerCase();
            const match = 
                (r.codigo_retalho && r.codigo_retalho.toLowerCase().includes(termo)) ||
                (r.qr_code && r.qr_code.toLowerCase().includes(termo)) ||
                (r.codigo && r.codigo.toLowerCase().includes(termo)) ||
                (r.nome_cor && r.nome_cor.toLowerCase().includes(termo)) ||
                (r.localizacao_atual && r.localizacao_atual.toLowerCase().includes(termo));
            
            if (!match) return false;
        }
        
        // Filtro de loja
        if (loja && r.loja !== loja) return false;
        
        // Filtro de metragem
        if (metragem) {
            const metros = parseFloat(r.metragem || 0);
            if (metragem === '10-30' && (metros < 10 || metros > 30)) return false;
            if (metragem === '30-50' && (metros < 30 || metros > 50)) return false;
            if (metragem === '50+' && metros < 50) return false;
        }
        
        // Filtro de status
        if (status && r.status !== status) return false;
        
        return true;
    });
    
    renderizarTabela(filtrados);
}

function limparFiltros() {
    document.getElementById('busca').value = '';
    document.getElementById('filtroLoja').value = '';
    document.getElementById('filtroMetragem').value = '';
    document.getElementById('filtroStatus').value = '';
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
    
    tbody.innerHTML = retalhos.map(r => `
        <tr>
            <td><strong>${r.codigo_retalho || '-'}</strong></td>
            <td>
                ${r.qr_code ? `<code style="font-size: 0.9em;">${r.qr_code}</code>` : '-'}
            </td>
            <td>
                <div style="font-weight: 600;">${r.codigo || '-'}</div>
                <div style="font-size: 0.85em; color: #666;">
                    ${r.nome_cor || '-'} ${r.gramatura || '-'}g/m²
                </div>
            </td>
            <td>
                <span style="color: #28a745; font-weight: 600;">
                    ${parseFloat(r.metragem || 0).toFixed(2)}m
                </span>
            </td>
            <td>
                ${r.metragem_reservada > 0 
                    ? `<span style="color: #dc3545;">${parseFloat(r.metragem_reservada).toFixed(2)}m</span>`
                    : '-'
                }
            </td>
            <td>${r.localizacao_atual || '-'}</td>
            <td>
                ${r.bobina_codigo 
                    ? `<span title="Gerado da bobina ${r.bobina_codigo}">📦 ${r.bobina_codigo}</span>`
                    : '<span style="color: #999;">Manual</span>'
                }
            </td>
            <td>${formatarStatus(r.status)}</td>
            <td>${formatarData(r.data_entrada)}</td>
            <td>
                <div style="display: flex; gap: 5px;">
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
    `).join('');
}

function formatarStatus(status) {
    const badges = {
        'disponivel': '<span class="badge badge-success">Disponível</span>',
        'reservado': '<span class="badge badge-warning">Reservado</span>',
        'usado': '<span class="badge badge-secondary">Usado</span>'
    };
    return badges[status] || status;
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
function abrirModalImprimirEtiqueta(retalhoId) {
    const retalho = retalhosCache.find(r => r.id === retalhoId);
    
    if (!retalho) {
        showNotification('Retalho não encontrado', 'error');
        return;
    }
    
    retalhoParaImprimir = retalho;
    
    // Gerar preview da etiqueta
    const preview = document.getElementById('previewEtiqueta');
    preview.innerHTML = `
        <div style="text-align: center; font-family: Arial, sans-serif;">
            <div id="qrcodePreview" style="margin: 10px auto;"></div>
            <div style="font-size: 14px; font-weight: bold; margin-top: 10px;">
                ${retalho.codigo_retalho || '-'}
            </div>
            <div style="font-size: 12px; margin-top: 5px;">
                ${retalho.codigo || ''} - ${retalho.nome_cor || ''} ${retalho.gramatura || ''}g/m²
            </div>
            <div style="font-size: 16px; font-weight: bold; margin-top: 5px;">
                ${parseFloat(retalho.metragem || 0).toFixed(2)}m
            </div>
        </div>
    `;
    
    // Gerar QR Code
    const qrDiv = document.getElementById('qrcodePreview');
    qrDiv.innerHTML = '';
    QRCode.toCanvas(retalho.qr_code || `R-${retalho.id}`, {
        width: 150,
        margin: 1
    }, (error, canvas) => {
        if (error) {
            console.error('Erro ao gerar QR Code:', error);
            qrDiv.innerHTML = '<p style="color: red;">Erro ao gerar QR Code</p>';
        } else {
            qrDiv.appendChild(canvas);
        }
    });
    
    document.getElementById('modalImprimirEtiqueta').style.display = 'flex';
}

function fecharModalImprimirEtiqueta() {
    document.getElementById('modalImprimirEtiqueta').style.display = 'none';
    retalhoParaImprimir = null;
}

function confirmarImpressaoEtiqueta() {
    if (!retalhoParaImprimir) return;
    
    // Criar janela de impressão
    const printWindow = window.open('', '', 'width=400,height=600');
    
    const r = retalhoParaImprimir;
    
    printWindow.document.write(`
        <html>
        <head>
            <title>Etiqueta - ${r.codigo_retalho}</title>
            <style>
                @media print {
                    @page { margin: 0; size: 57mm auto; }
                    body { margin: 0; padding: 0; }
                }
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 5mm;
                    width: 57mm;
                }
                .qrcode { margin: 3mm auto; }
                .codigo { font-size: 14px; font-weight: bold; margin-top: 2mm; }
                .produto { font-size: 11px; margin-top: 1mm; }
                .metragem { font-size: 16px; font-weight: bold; margin-top: 2mm; }
            </style>
        </head>
        <body>
            <div id="qrcode" class="qrcode"></div>
            <div class="codigo">${r.codigo_retalho || '-'}</div>
            <div class="produto">${r.codigo || ''} - ${r.nome_cor || ''} ${r.gramatura || ''}g/m²</div>
            <div class="metragem">${parseFloat(r.metragem || 0).toFixed(2)}m</div>
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
            <script>
                QRCode.toCanvas(document.getElementById('qrcode'), '${r.qr_code || `R-${r.id}`}', {
                    width: 120,
                    margin: 1
                }, function() {
                    window.print();
                    window.close();
                });
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    fecharModalImprimirEtiqueta();
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
