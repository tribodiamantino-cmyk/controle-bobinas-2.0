// Estado global
let templates = [];
let templateSelecionado = null;

// Carregar templates ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    carregarTemplates();
});

// Carregar todos os templates
async function carregarTemplates() {
    const loading = document.getElementById('loading-templates');
    const lista = document.getElementById('lista-templates');
    const empty = document.getElementById('empty-templates');
    
    loading.style.display = 'block';
    lista.style.display = 'none';
    empty.style.display = 'none';
    
    try {
        const response = await fetch('/api/obras-padrao');
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao carregar templates');
        }
        
        templates = data.data;
        loading.style.display = 'none';
        
        if (templates.length === 0) {
            empty.style.display = 'block';
        } else {
            lista.style.display = 'grid';
            renderizarTemplates();
            atualizarEstatisticas();
        }
        
    } catch (error) {
        loading.style.display = 'none';
        empty.style.display = 'block';
        mostrarNotificacao('Erro ao carregar templates: ' + error.message, 'error');
        console.error(error);
    }
}

// Renderizar lista de templates
function renderizarTemplates() {
    const lista = document.getElementById('lista-templates');
    
    lista.innerHTML = templates.map(template => {
        const dataCriacao = new Date(template.data_criacao).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        const ultimoUso = template.ultima_utilizacao ? 
            new Date(template.ultima_utilizacao).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }) : 'Nunca usado';
        
        return `
            <div class="template-card-wrapper">
                <div class="template-card" onclick="abrirDetalhesTemplate(${template.id})">
                    <div class="template-card-header">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <h3 class="template-titulo">📋 ${template.nome}</h3>
                            <div class="template-badge">
                                ${template.vezes_utilizada > 0 ? 
                                    `<span class="badge badge-success">🔥 ${template.vezes_utilizada}x usado</span>` : 
                                    `<span class="badge badge-secondary">Novo</span>`
                                }
                            </div>
                        </div>
                        ${template.descricao ? `<p class="template-descricao">${template.descricao}</p>` : ''}
                    </div>
                    
                    <div class="template-card-body">
                        <div class="template-stats">
                            <div class="template-stat">
                                <span class="template-stat-icon">📦</span>
                                <div>
                                    <strong>${template.total_itens || 0}</strong>
                                    <small>cortes</small>
                                </div>
                            </div>
                            <div class="template-stat">
                                <span class="template-stat-icon">📏</span>
                                <div>
                                    <strong>${parseFloat(template.metragem_total || 0).toFixed(2)}m</strong>
                                    <small>total</small>
                                </div>
                            </div>
                        </div>
                        
                        ${template.produtos ? `
                            <div class="template-produtos">
                                <small style="color: #666;">Produtos:</small>
                                <div style="margin-top: 4px; font-size: 13px; color: #444;">
                                    ${template.produtos}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="template-info-footer">
                            <small>Criado em: ${dataCriacao}</small>
                            <small>Último uso: ${ultimoUso}</small>
                        </div>
                    </div>
                    
                    <div class="template-card-footer" onclick="event.stopPropagation()">
                        <button class="btn btn-sm btn-primary" onclick="abrirModalCriarPlano(${template.id})" title="Criar plano com este template">
                            ✨ Usar Template
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="abrirDetalhesTemplate(${template.id})" title="Ver detalhes">
                            👁️ Detalhes
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="excluirTemplate(${template.id})" title="Excluir template">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Atualizar estatísticas
function atualizarEstatisticas() {
    const totalTemplates = templates.length;
    const totalMetragem = templates.reduce((sum, t) => sum + parseFloat(t.metragem_total || 0), 0);
    const totalUsos = templates.reduce((sum, t) => sum + parseInt(t.vezes_utilizada || 0), 0);
    
    // Template mais usado
    const maisUsado = templates.reduce((max, t) => 
        (t.vezes_utilizada || 0) > (max.vezes_utilizada || 0) ? t : max, 
        { vezes_utilizada: 0, nome: '-' }
    );
    
    // Estimativa: cada template economiza ~5 minutos de digitação
    const tempoEconomizado = totalUsos * 5;
    
    document.getElementById('stat-total').textContent = totalTemplates;
    document.getElementById('stat-mais-usado').textContent = maisUsado.nome;
    document.getElementById('stat-metragem-total').textContent = totalMetragem.toFixed(2) + 'm';
    document.getElementById('stat-tempo-economizado').textContent = tempoEconomizado + 'min';
}

// Abrir detalhes do template
async function abrirDetalhesTemplate(templateId) {
    try {
        const response = await fetch(`/api/obras-padrao/${templateId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao carregar detalhes');
        }
        
        const template = data.data;
        templateSelecionado = template;
        
        const conteudo = document.getElementById('conteudo-detalhes-template');
        document.getElementById('modal-template-titulo').textContent = `📋 ${template.nome}`;
        
        conteudo.innerHTML = `
            <div style="margin-bottom: 20px;">
                ${template.descricao ? `
                    <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <strong>Descrição:</strong>
                        <p style="margin: 8px 0 0 0;">${template.descricao}</p>
                    </div>
                ` : ''}
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px;">
                    <div class="info-box">
                        <small style="color: #666;">Total de Cortes</small>
                        <strong style="font-size: 18px; color: var(--primary-color);">${template.itens.length}</strong>
                    </div>
                    <div class="info-box">
                        <small style="color: #666;">Metragem Total</small>
                        <strong style="font-size: 18px; color: var(--success-color);">${parseFloat(template.metragem_total || 0).toFixed(2)}m</strong>
                    </div>
                    <div class="info-box">
                        <small style="color: #666;">Vezes Utilizado</small>
                        <strong style="font-size: 18px; color: var(--warning-color);">${template.vezes_utilizada || 0}x</strong>
                    </div>
                </div>
            </div>
            
            <h3 style="margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px;">Lista de Cortes</h3>
            
            <div class="cortes-lista">
                ${template.itens.map((item, index) => `
                    <div class="corte-item-detalhes">
                        <div class="corte-numero">#${index + 1}</div>
                        <div class="corte-info">
                            <div class="corte-produto">
                                <strong>${item.produto_nome}</strong>
                                <small style="color: #666;">${item.produto_codigo}</small>
                            </div>
                            <div class="corte-metragem">
                                <span class="badge badge-info">${parseFloat(item.metragem).toFixed(2)}m</span>
                            </div>
                        </div>
                        ${item.observacoes ? `
                            <div class="corte-obs">
                                💬 ${item.observacoes}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        
        document.getElementById('modalDetalhesTemplate').style.display = 'flex';
        
    } catch (error) {
        mostrarNotificacao('Erro ao carregar detalhes: ' + error.message, 'error');
        console.error(error);
    }
}

function fecharModalDetalhes() {
    document.getElementById('modalDetalhesTemplate').style.display = 'none';
    templateSelecionado = null;
}

function usarTemplateAtual() {
    if (templateSelecionado) {
        fecharModalDetalhes();
        abrirModalCriarPlano(templateSelecionado.id);
    }
}

// Abrir modal de criar plano
function abrirModalCriarPlano(templateId) {
    templateSelecionado = templates.find(t => t.id === templateId);
    document.getElementById('modalCriarPlano').style.display = 'flex';
    document.getElementById('formCriarPlano').reset();
}

function fecharModalCriarPlano() {
    document.getElementById('modalCriarPlano').style.display = 'none';
    templateSelecionado = null;
}

// Criar plano a partir do template
document.getElementById('formCriarPlano')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const cliente = document.getElementById('cliente-template').value;
    const aviario = document.getElementById('aviario-template').value;
    
    if (!templateSelecionado) {
        mostrarNotificacao('Nenhum template selecionado', 'error');
        return;
    }
    
    const codigoPlano = `${cliente}-${aviario}-${Date.now()}`;
    
    try {
        const response = await fetch('/api/obras-padrao/criar-plano', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                obra_padrao_id: templateSelecionado.id,
                codigo_plano: codigoPlano,
                cliente: cliente,
                aviario: aviario
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erro ao criar plano');
        }
        
        mostrarNotificacao('✨ Plano criado com sucesso! Redirecionando...', 'success');
        
        setTimeout(() => {
            window.location.href = '/ordens.html';
        }, 1500);
        
    } catch (error) {
        mostrarNotificacao('Erro ao criar plano: ' + error.message, 'error');
        console.error(error);
    }
});

// Excluir template
async function excluirTemplate(templateId) {
    const template = templates.find(t => t.id === templateId);
    
    if (!confirm(`Tem certeza que deseja excluir o template "${template.nome}"?`)) {
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
        
        mostrarNotificacao('Template excluído com sucesso', 'success');
        await carregarTemplates();
        
    } catch (error) {
        mostrarNotificacao('Erro ao excluir template: ' + error.message, 'error');
        console.error(error);
    }
}

// Notificações
function mostrarNotificacao(message, type = 'info') {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
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
        max-width: 350px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
