// ========== ESTADO GLOBAL ==========
let scannerAtivo = null;
let scannerTransicao = false; // evita start/stop concorrente
let bobinaAtual = null;
let ordensProducao = [];
let ordemAtual = null;
let itemValidando = null;
let corteAtual = null; // Para função de impressão

// MODO TESTE - detecta ?teste=1 na URL
const MODO_TESTE = new URLSearchParams(window.location.search).get('teste') === '1';
const API_BASE = MODO_TESTE ? '/api/mobile/teste' : '/api/mobile';

// Estado de itens validados no modo teste (persiste na sessão)
let itensValidadosTeste = [];

// Mostra banner de teste se ativo
if (MODO_TESTE) {
    document.addEventListener('DOMContentLoaded', () => {
        const banner = document.createElement('div');
        banner.id = 'teste-banner';
        banner.innerHTML = '🧪 MODO TESTE ATIVO - Nenhuma alteração será salva no banco';
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#ffc107;color:#000;text-align:center;padding:8px;font-weight:bold;z-index:9999;font-size:12px;';
        document.body.prepend(banner);
        document.body.style.paddingTop = '40px';
    });
}

// ========== CHECK API STATUS ==========
async function checkApiStatus() {
    try {
        const response = await fetch('/api/health', { timeout: 5000 });
        const statusEl = document.getElementById('api-status');
        if (response.ok) {
            statusEl.textContent = '🟢';
            statusEl.title = 'API Conectada';
            return true;
        } else {
            statusEl.textContent = '🟡';
            statusEl.title = 'API com problemas';
            return false;
        }
    } catch (error) {
        const statusEl = document.getElementById('api-status');
        statusEl.textContent = '🔴';
        statusEl.title = 'API Offline';
        console.warn('API não acessível:', error);
        return false;
    }
}

// Verificar API status ao carregar e a cada 30s
document.addEventListener('DOMContentLoaded', () => {
    checkApiStatus();
    setInterval(checkApiStatus, 30000);
});

// ========== CONTROLE DO BOTÃO VOLTAR DO ANDROID ==========
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se está em app nativo (Capacitor)
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
        console.log('✅ App nativo detectado - Configurando handler do botão voltar');
        
        // Aguardar Capacitor estar pronto
        window.Capacitor.Plugins.App.addListener('backButton', () => {
            const telaAtual = document.querySelector('.tela.active');
            const telaId = telaAtual ? telaAtual.id : null;
            
            console.log('🔙 Botão voltar pressionado. Tela atual:', telaId);
            
            // Lógica de navegação reversa
            if (telaId === 'tela-menu') {
                // Se está no menu principal, SAIR do app
                window.Capacitor.Plugins.App.exitApp();
            } else {
                // Qualquer outra tela, voltar para o menu
                voltarMenu();
            }
        });
        
        console.log('✅ Handler do botão voltar configurado!');
    }
});

// ========== NAVEGAÇÃO ENTRE TELAS ==========
async function mostrarTela(telaId) {
    // Esconder todas as telas
    document.querySelectorAll('.tela').forEach(tela => {
        tela.classList.remove('active');
    });
    
    // Mostrar tela solicitada
    document.getElementById(telaId).classList.add('active');
    
    // Parar scanner se houver (aguardar)
    await pararScanner();
}

function voltarMenu() {
    mostrarTela('tela-menu');
    bobinaAtual = null;
}

// ========== TELA DE CORTE ==========
async function abrirTelaCorte() {
    await mostrarTela('tela-corte');
    mostrarPasso('passo-scanner-corte');
    iniciarScanner('corte');
}

async function voltarScannerCorte() {
    mostrarPasso('passo-scanner-corte');
    document.getElementById('form-corte').reset();
    bobinaAtual = null;
    await pararScanner();
    iniciarScanner('corte');
}

// ========== TELA DE CONSULTA ==========
async function abrirTelaConsulta() {
    await mostrarTela('tela-consulta');
    mostrarPasso('passo-scanner-consulta');
    iniciarScanner('consulta');
}

async function voltarScannerConsulta() {
    mostrarPasso('passo-scanner-consulta');
    bobinaAtual = null;
    await pararScanner();
    iniciarScanner('consulta');
}

// ========== TELA DE ORDENS EM PRODUÇÃO ==========
async function abrirTelaProducao() {
    await mostrarTela('tela-producao');
    mostrarPasso('passo-lista-ordens');
    carregarOrdensProducao();
}

async function carregarOrdensProducao() {
    mostrarLoading(true);
    
    try {
        // Usa endpoint de teste ou produção conforme o modo
        const endpoint = MODO_TESTE ? '/api/mobile/teste/plano' : '/api/mobile/ordens-producao';
        const response = await fetch(endpoint);
        
        // Verificar se resposta é JSON válido
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Resposta não é JSON:', text.substring(0, 200));
            throw new Error('Servidor retornou resposta inválida (não-JSON)');
        }
        
        const data = await response.json();
        
        if (data.success) {
            ordensProducao = data.data;
            
            // No modo teste, filtrar itens já validados localmente
            if (MODO_TESTE) {
                ordensProducao.forEach(ordem => {
                    if (ordem.itens) {
                        ordem.itens = ordem.itens.filter(item => 
                            !itensValidadosTeste.includes(item.alocacao_id || item.item_id)
                        );
                        ordem.qtd_itens = ordem.itens.length;
                    }
                });
            }
            
            renderizarOrdensProducao();
        } else {
            throw new Error(data.message || 'Erro ao carregar ordens');
        }
    } catch (error) {
        console.error('Erro ao carregar ordens:', error);
        mostrarToast('Erro ao carregar ordens em produção', 'error');
    } finally {
        mostrarLoading(false);
    }
}

function renderizarOrdensProducao() {
    const container = document.getElementById('ordens-container');
    
    if (ordensProducao.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <p>Nenhuma ordem em produção no momento</p>
                <small style="color: var(--text-light);">Ordens com status "Em Andamento" ou "Pendente" aparecerão aqui</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = ordensProducao.map(ordem => {
        const temItensPendentes = ordem.qtd_itens > 0;
        return `
            <div class="ordem-card ${!temItensPendentes ? 'ordem-sem-itens' : ''}" onclick="${temItensPendentes ? `abrirOrdem(${ordem.id})` : 'mostrarToast(\"Todos os itens desta ordem já foram concluídos\", \"info\")'}">
                <div class="ordem-header">
                    <span class="ordem-numero">${ordem.numero_ordem}</span>
                    <span class="ordem-status status-${ordem.status.toLowerCase().replace(' ', '-')}">${ordem.status}</span>
                </div>
                <div class="ordem-info">
                    <span>📦 ${ordem.qtd_itens}/${ordem.qtd_total || ordem.qtd_itens} ${ordem.qtd_itens === 1 ? 'item pendente' : 'itens pendentes'}</span>
                    <span>📅 ${formatarData(ordem.data_criacao)}</span>
                </div>
                ${ordem.observacoes ? `<div class="ordem-obs">${ordem.observacoes}</div>` : ''}
                ${!temItensPendentes ? '<div class="ordem-completa">✅ Todos itens concluídos</div>' : ''}
            </div>
        `;
    }).join('');
}

function abrirOrdem(ordemId) {
    ordemAtual = ordensProducao.find(o => o.id === ordemId);
    if (!ordemAtual) return;
    
    renderizarDetalhesOrdem();
    mostrarPasso('passo-ordem-detalhes');
}

function renderizarDetalhesOrdem() {
    const container = document.getElementById('ordem-detalhes-container');
    
    // Filtrar itens que têm origem alocada (bobina ou retalho)
    let itensComOrigem = ordemAtual.itens.filter(item => item.origem_id !== null && item.origem_id !== undefined);
    const itensSemOrigem = ordemAtual.itens.filter(item => item.origem_id === null || item.origem_id === undefined);
    
    // No modo teste, filtrar itens já validados
    if (MODO_TESTE) {
        itensComOrigem = itensComOrigem.filter(item => {
            const itemId = item.alocacao_id || item.item_id;
            return !itensValidadosTeste.includes(itemId);
        });
    }
    
    // Verificar se todos os itens foram concluídos (modo teste)
    const todosItensConcluidos = MODO_TESTE && itensComOrigem.length === 0 && itensSemOrigem.length === 0 && itensValidadosTeste.length > 0;
    
    container.innerHTML = `
        <div class="ordem-detalhes-header">
            <h3>${ordemAtual.numero_ordem}</h3>
            <span class="ordem-status status-${ordemAtual.status.toLowerCase().replace(' ', '-')}">${ordemAtual.status}</span>
        </div>
        
        ${ordemAtual.observacoes ? `<div class="ordem-cliente">${ordemAtual.observacoes}</div>` : ''}
        
        ${ordemAtual.localizacoes && ordemAtual.localizacoes.length > 0 ? `
            <div style="background: #e0f2fe; border-left: 4px solid #0ea5e9; padding: 12px; margin-bottom: 1rem; border-radius: 4px;">
                <div style="font-weight: bold; color: #0c4a6e; margin-bottom: 5px; font-size: 14px;">
                    📍 Armazenado em:
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${ordemAtual.localizacoes.map(loc => `
                        <span style="background: white; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; color: #0369a1; border: 1px solid #bae6fd;">
                            ${loc.codigo_locacao}
                        </span>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        
        ${todosItensConcluidos ? `
            <div style="background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; text-align: center;">
                <div style="font-size: 2rem; margin-bottom: 0.5rem;">🎉</div>
                <h4 style="color: #047857; margin-bottom: 0.5rem;">Todos os ${itensValidadosTeste.length} cortes concluídos!</h4>
                <p style="color: #065f46; font-size: 0.875rem;">Agora escaneie os QR codes das locações para finalizar o plano.</p>
                <button class="btn btn-primary" onclick="abrirFinalizarPlano()" style="margin-top: 1rem; width: 100%;">
                    📍 Finalizar Plano com Locações
                </button>
            </div>
        ` : ''}
        
        ${MODO_TESTE && itensValidadosTeste.length > 0 && !todosItensConcluidos ? `
            <div style="background: #dbeafe; border-radius: 8px; padding: 0.75rem; margin-bottom: 1rem;">
                <span style="color: #1d4ed8;">✅ ${itensValidadosTeste.length} corte(s) validado(s) | ${itensComOrigem.length} restante(s)</span>
            </div>
        ` : ''}
        
        <div class="itens-lista">
            ${!todosItensConcluidos ? '<h4>📦 Bobinas para Cortar</h4>' : ''}
            ${itensComOrigem.length === 0 && !todosItensConcluidos ? 
                '<p style="color: var(--text-light);">Nenhum item com origem alocada</p>' :
                renderizarItensAgrupados(itensComOrigem)
            }
            
            ${itensSemOrigem.length > 0 ? `
                <h4 style="margin-top: 1.5rem;">⏳ Aguardando Alocação</h4>
                ${itensSemOrigem.map(item => `
                    <div class="item-card item-pendente" style="opacity: 0.7; background: #f3f4f6;">
                        <div class="item-header">
                            <span class="item-bobina" style="color: #6b7280;">Sem origem</span>
                            <span class="item-metragem">${item.metragem_alocada}m</span>
                        </div>
                        <div class="item-info">
                            <span>${item.produto_codigo || ''} ${item.nome_cor ? '- ' + item.nome_cor : ''}</span>
                        </div>
                        <div style="color: #9ca3af; font-size: 0.875rem;">
                            ⚠️ Aguardando alocação no desktop
                        </div>
                    </div>
                `).join('')}
            ` : ''}
        </div>
        
        <button class="btn btn-secondary" onclick="voltarListaOrdens()" style="margin-top: 1rem;">
            ← Voltar para Lista
        </button>
    `;
}

// Agrupar itens pela mesma bobina/retalho
function renderizarItensAgrupados(itens) {
    const grupos = {};
    
    // Agrupar por origem_id + tipo
    itens.forEach(item => {
        const chave = `${item.tipo || 'bobina'}-${item.origem_id}`;
        if (!grupos[chave]) {
            grupos[chave] = {
                tipo: item.tipo || 'bobina',
                origem_id: item.origem_id,
                origem_codigo: item.origem_codigo,
                localizacao_atual: item.localizacao_atual,
                metragem_atual: item.metragem_atual,
                produto_codigo: item.produto_codigo,
                nome_cor: item.nome_cor,
                itens: []
            };
        }
        grupos[chave].itens.push(item);
    });
    
    // Renderizar cada grupo
    return Object.values(grupos).map(grupo => {
        const tipoIcon = grupo.tipo === 'retalho' ? '🧵' : '📦';
        const tipoLabel = grupo.tipo === 'retalho' ? 'Retalho' : 'Bobina';
        const totalMetragem = grupo.itens.reduce((sum, i) => sum + parseFloat(i.metragem_alocada), 0);
        
        return `
        <div class="item-card item-grupo" onclick="iniciarValidacaoGrupo('${grupo.tipo}', ${grupo.origem_id})" style="cursor: pointer; border: 2px solid #e5e7eb;">
            <div class="item-header">
                <span class="item-bobina">${tipoIcon} ${grupo.origem_codigo || tipoLabel + ' #' + grupo.origem_id}</span>
                <span class="item-metragem" style="background: #3b82f6; color: white; padding: 4px 8px; border-radius: 4px;">
                    ${grupo.itens.length} corte${grupo.itens.length > 1 ? 's' : ''}
                </span>
            </div>
            <div class="item-info">
                <span>${grupo.produto_codigo || ''} ${grupo.nome_cor ? '- ' + grupo.nome_cor : ''}</span>
                <span>📍 ${grupo.localizacao_atual || 'N/A'}</span>
            </div>
            <div class="item-disponivel">
                Total a cortar: <strong>${totalMetragem.toFixed(1)}m</strong> | Disponível: <strong>${grupo.metragem_atual}m</strong>
            </div>
            
            <!-- Lista de cortes -->
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px dashed #d1d5db;">
                ${grupo.itens.map((item, idx) => `
                    <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 0.875rem;">
                        <span style="color: #6b7280;">Corte ${idx + 1}</span>
                        <span style="font-weight: 600;">${item.metragem_alocada}m</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="item-action" style="margin-top: 10px; background: #dbeafe; color: #1e40af; padding: 8px; border-radius: 4px; text-align: center;">
                👆 Toque para iniciar cortes
            </div>
        </div>
        `;
    }).join('');
}

function voltarListaOrdens() {
    ordemAtual = null;
    itemValidando = null;
    bobinaAtual = null;
    mostrarPasso('passo-lista-ordens');
}

let itensGrupoAtual = [];
let indiceItemAtual = 0;

async function iniciarValidacaoGrupo(tipo, origemId) {
    // Filtrar todos os itens desta bobina/retalho
    itensGrupoAtual = ordemAtual.itens.filter(i => 
        (i.tipo || 'bobina') === tipo && i.origem_id === origemId
    );
    
    if (itensGrupoAtual.length === 0) return;
    
    indiceItemAtual = 0;
    console.log(`📦 Iniciando grupo de ${itensGrupoAtual.length} cortes da mesma origem`);
    
    // Iniciar com o primeiro item
    await validarProximoItemGrupo();
}

async function validarProximoItemGrupo() {
    if (indiceItemAtual >= itensGrupoAtual.length) {
        console.log('✅ Todos os itens do grupo foram cortados!');
        return;
    }
    
    itemValidando = itensGrupoAtual[indiceItemAtual];
    
    const tipoIcon = itemValidando.tipo === 'retalho' ? '🧵' : '📦';
    const tipoLabel = itemValidando.tipo === 'retalho' ? 'retalho' : 'bobina';
    
    // Atualizar instrução do scanner
    document.getElementById('instrucao-validacao').innerHTML = `
        📱 Escaneie ${tipoLabel === 'retalho' ? 'o' : 'a'} ${tipoLabel} <strong>${itemValidando.origem_codigo || '#' + itemValidando.origem_id}</strong>
        <br><small style="color: #6b7280;">Corte ${indiceItemAtual + 1} de ${itensGrupoAtual.length}</small>
    `;
    
    mostrarPasso('passo-scanner-validacao');
    await pararScanner();
    iniciarScanner('validacao');
}

async function iniciarValidacaoItem(alocacaoId) {
    itemValidando = ordemAtual.itens.find(i => (i.alocacao_id || i.item_id) === alocacaoId);
    if (!itemValidando) return;
    
    const tipoIcon = itemValidando.tipo === 'retalho' ? '🧵' : '📦';
    const tipoLabel = itemValidando.tipo === 'retalho' ? 'retalho' : 'bobina';
    
    // Atualizar instrução do scanner
    document.getElementById('instrucao-validacao').innerHTML = `
        📱 Escaneie ${tipoLabel === 'retalho' ? 'o' : 'a'} ${tipoLabel} <strong>${itemValidando.origem_codigo || '#' + itemValidando.origem_id}</strong>
    `;
    
    mostrarPasso('passo-scanner-validacao');
    await pararScanner();
    iniciarScanner('validacao');
}

function cancelarValidacao() {
    pararScanner();
    itemValidando = null;
    renderizarDetalhesOrdem();
    mostrarPasso('passo-ordem-detalhes');
}

// ========== PROCESSAMENTO DA VALIDAÇÃO ==========
async function processarValidacao(origemId) {
    // Verificar se origem escaneada corresponde ao item (bobina_id ou retalho_id)
    const idEsperado = itemValidando.origem_id || itemValidando.bobina_id || itemValidando.retalho_id;
    
    if (idEsperado != origemId) {
        const tipoLabel = itemValidando.tipo === 'retalho' ? 'retalho' : 'bobina';
        mostrarToast('❌ ' + tipoLabel.charAt(0).toUpperCase() + tipoLabel.slice(1) + ' incorreta! Escaneie ' + (itemValidando.origem_codigo || '#' + idEsperado), 'error');
        // Reiniciar scanner para tentar novamente
        setTimeout(() => iniciarScanner('validacao'), 1500);
        return;
    }
    
    // Origem correta - buscar dados atualizados
    mostrarLoading(true);
    
    try {
        // Determinar endpoint baseado no tipo E no modo teste - usar apiUrl()
        let endpoint;
        if (itemValidando.tipo === 'retalho') {
            const path = MODO_TESTE ? `api/mobile/teste/retalho/${origemId}` : `api/mobile/retalho/${origemId}`;
            endpoint = apiUrl(path);
        } else {
            const path = MODO_TESTE ? `api/mobile/teste/bobina/${origemId}` : `api/mobile/bobina/${origemId}`;
            endpoint = apiUrl(path);
        }
        
        console.log('🔧 Buscando origem:', endpoint);
            
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.success) {
            bobinaAtual = data.data;
            bobinaAtual.tipo_origem = itemValidando.tipo || 'bobina';
            mostrarConfirmacaoCorte();
        } else {
            throw new Error(data.message || 'Erro ao carregar origem');
        }
    } catch (error) {
        console.error('Erro ao carregar origem:', error);
        mostrarToast('Erro ao carregar dados', 'error');
        cancelarValidacao();
    } finally {
        mostrarLoading(false);
    }
}

function mostrarConfirmacaoCorte() {
    const container = document.getElementById('confirma-corte-container');
    
    const metragemReservada = Number(bobinaAtual.metragem_reservada || 0);
    const metragemSolicitada = Number(itemValidando.metragem_alocada || itemValidando.metragem_solicitada || 0);
    const metragemAtual = Number(bobinaAtual.metragem_atual || bobinaAtual.metragem || 0);
    
    const isRetalho = bobinaAtual.tipo_origem === 'retalho';
    const tipoIcon = isRetalho ? '🧵' : '📦';
    const tipoLabel = isRetalho ? 'Retalho' : 'Bobina';
    const codigoOrigem = bobinaAtual.codigo_interno || bobinaAtual.codigo_retalho;
    
    container.innerHTML = `
        <div class="confirma-header">
            <h3>✅ ${tipoLabel} Verificado</h3>
            <p>Confirme o corte do item</p>
        </div>
        
        <div class="confirma-ordem">
            <strong>Ordem:</strong> ${ordemAtual.numero_ordem}
        </div>
        
        <div class="bobina-info" style="margin: 1rem 0; ${isRetalho ? 'background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);' : ''}">
            <div class="bobina-info-codigo">${tipoIcon} ${codigoOrigem}</div>
            <div class="bobina-info-grid">
                <div class="bobina-info-item">
                    <strong>Tipo:</strong><br>${tipoLabel}
                </div>
                <div class="bobina-info-item">
                    <strong>Produto:</strong><br>${bobinaAtual.codigo || bobinaAtual.produto_codigo || 'N/A'}
                </div>
                <div class="bobina-info-item">
                    <strong>Cor:</strong><br>${bobinaAtual.nome_cor || 'N/A'}
                </div>
                <div class="bobina-info-item">
                    <strong>Metragem Atual:</strong><br>${metragemAtual}m
                </div>
                <div class="bobina-info-item">
                    <strong>Localização:</strong><br>${bobinaAtual.localizacao_atual || 'N/A'}
                </div>
                ${metragemReservada > 0 ? `
                    <div class="bobina-info-item" style="background: #fef3c7; border-left: 3px solid #f59e0b;">
                        <strong>⚠️ Reservada:</strong><br>${metragemReservada.toFixed(2)}m
                    </div>
                ` : ''}
            </div>
        </div>
        
        <form id="form-validacao" onsubmit="confirmarValidacao(event)">
            <div class="form-group">
                <label for="metragem-validacao">Metragem a Cortar (metros) - Exata</label>
                <input type="number" id="metragem-validacao" step="0.01" min="0.01" 
                       value="${metragemSolicitada}" 
                       readonly
                       style="background-color: #f0f0f0; cursor: not-allowed;"
                       required>
                <small style="color: var(--primary); font-weight: bold;">
                    ⚠️ Metragem fixa: ${metragemSolicitada}m (conforme plano de corte)
                </small>
                <small style="color: var(--text-light); display: block; margin-top: 5px;">
                    Disponível na bobina: ${metragemAtual}m
                </small>
            </div>

            <div class="form-group">
                <label>📸 Foto do Medidor (contraprova) *</label>
                <input type="file" id="foto-medidor-validacao" accept="image/*" capture="environment" style="display: none;">
                <button type="button" id="btn-tirar-foto" class="btn btn-secondary" onclick="document.getElementById('foto-medidor-validacao').click()" style="width: 100%; padding: 15px; font-size: 16px;">
                    📷 Tirar Foto do Medidor
                </button>
                <div id="preview-foto-validacao" class="hidden" style="margin-top: 10px;">
                    <img id="preview-img-validacao" style="max-width: 100%; border-radius: 8px; border: 2px solid var(--primary);">
                    <button type="button" class="btn btn-secondary btn-sm" onclick="removerFotoValidacao()" style="margin-top: 5px;">🗑️ Tirar Outra Foto</button>
                </div>
            </div>

            <div class="form-group">
                <label for="observacoes-validacao">Observações (opcional)</label>
                <textarea id="observacoes-validacao" rows="2"></textarea>
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="cancelarValidacao()">Cancelar</button>
                <button type="submit" class="btn btn-primary">✅ Confirmar Corte</button>
            </div>
        </form>
    `;
    
    // Configurar preview da foto
    const fotoInputValidacao = document.getElementById('foto-medidor-validacao');
    if (fotoInputValidacao) {
        fotoInputValidacao.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('preview-img-validacao').src = event.target.result;
                    document.getElementById('preview-foto-validacao').classList.remove('hidden');
                    document.getElementById('btn-tirar-foto').style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    mostrarPasso('passo-confirma-corte');
}

// Remover foto do formulário de validação
function removerFotoValidacao() {
    const fotoInput = document.getElementById('foto-medidor-validacao');
    if (fotoInput) fotoInput.value = '';
    const preview = document.getElementById('preview-foto-validacao');
    if (preview) preview.classList.add('hidden');
    const img = document.getElementById('preview-img-validacao');
    if (img) img.src = '';
    const btn = document.getElementById('btn-tirar-foto');
    if (btn) btn.style.display = 'block';
}

async function confirmarValidacao(event) {
    event.preventDefault();
    
    console.log('📋 confirmarValidacao chamado');
    console.log('📋 bobinaAtual:', bobinaAtual);
    console.log('📋 itemValidando:', itemValidando);
    
    // Validar se temos bobina atual
    if (!bobinaAtual) {
        console.error('❌ bobinaAtual é null/undefined');
        mostrarToast('❌ Erro: Bobina não identificada. Escaneie novamente.', 'error');
        voltarParaItens();
        return;
    }
    
    const metragemCortadaInput = document.getElementById('metragem-validacao');
    if (!metragemCortadaInput) {
        console.error('❌ Campo metragem-validacao não encontrado');
        mostrarToast('❌ Erro no formulário. Tente novamente.', 'error');
        return;
    }
    
    const metragemCortada = parseFloat(metragemCortadaInput.value);
    const observacoes = document.getElementById('observacoes-validacao')?.value || '';
    const fotoInput = document.getElementById('foto-medidor-validacao');
    const metragemAtual = Number(bobinaAtual.metragem_atual || bobinaAtual.metragem || 0);
    
    console.log('📊 Metragem cortada:', metragemCortada);
    console.log('📊 Metragem atual bobina:', metragemAtual);
    
    // Validar foto obrigatória
    if (!fotoInput || !fotoInput.files[0]) {
        mostrarToast('📸 Por favor, tire uma foto do medidor', 'error');
        return;
    }
    
    // Validar metragem
    if (metragemCortada > metragemAtual) {
        mostrarToast('Metragem cortada não pode ser maior que a disponível', 'error');
        return;
    }
    
    if (metragemCortada <= 0) {
        mostrarToast('Metragem deve ser maior que zero', 'error');
        return;
    }
    
    mostrarLoading(true);
    
    try {
        let fotoPath = null;
        
        // Upload da foto (apenas no modo real)
        if (!MODO_TESTE) {
            const formData = new FormData();
            formData.append('foto', fotoInput.files[0]);
            
            const uploadResponse = await fetch('/api/mobile/upload-foto-medidor', {
                method: 'POST',
                body: formData
            });
            
            if (!uploadResponse.ok) {
                throw new Error(`Erro HTTP: ${uploadResponse.status}`);
            }
            
            const uploadData = await uploadResponse.json();
            console.log('📤 Upload response:', uploadData);
            
            if (!uploadData.success) {
                throw new Error(uploadData.error || 'Erro ao fazer upload da foto');
            }
            
            // Verificar se data existe e tem filePath
            if (!uploadData.data || !uploadData.data.filePath) {
                console.error('❌ Upload data inválido:', uploadData);
                throw new Error('Resposta de upload inválida');
            }
            
            fotoPath = uploadData.data.filePath;
            console.log('✅ Foto enviada:', fotoPath);
        } else {
            // No modo teste, simular path da foto
            fotoPath = '/uploads/teste/foto-simulada.jpg';
            console.log('🧪 [TESTE] Foto simulada:', fotoPath);
        }
        
        // Usa endpoint de teste ou produção conforme o modo
        const endpoint = MODO_TESTE ? '/api/mobile/teste/validar-item' : '/api/mobile/validar-item';
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                item_id: itemValidando.alocacao_id || itemValidando.item_id,
                origem_id: bobinaAtual.id,
                tipo_origem: bobinaAtual.tipo_origem || 'bobina',
                metragem_cortada: metragemCortada,
                foto_medidor: fotoPath,
                observacoes: observacoes || null
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // No modo teste, marcar item como validado localmente
            if (MODO_TESTE) {
                const itemId = itemValidando.alocacao_id || itemValidando.item_id;
                itensValidadosTeste.push(itemId);
                console.log('🧪 [TESTE] Item marcado como validado:', itemId);
                console.log('🧪 [TESTE] Total validados:', itensValidadosTeste.length);
            }
            
            mostrarToast('✅ Corte validado!', 'success');
            
            // Se retornou dados do corte, oferecer impressão
            if (data.data && data.data.corte) {
                console.log('🖨️ Dados do corte recebidos:', data.data.corte);
                await oferecerImpressaoCorte(data.data.corte);
            }
            
            // Limpar foto
            removerFotoValidacao();
            
            // Verificar se estamos em um grupo de cortes
            if (itensGrupoAtual.length > 0) {
                indiceItemAtual++;
                console.log(`📊 Progresso: ${indiceItemAtual}/${itensGrupoAtual.length} cortes concluídos`);
                
                // Se ainda tem itens no grupo, continuar com o próximo
                if (indiceItemAtual < itensGrupoAtual.length) {
                    mostrarToast(`✅ Próximo corte: ${itensGrupoAtual[indiceItemAtual].metragem_alocada}m`, 'info');
                    // Pequeno delay para mostrar o toast
                    setTimeout(async () => {
                        await validarProximoItemGrupo();
                    }, 1000);
                    return;
                }
                
                // Acabaram todos os cortes deste grupo/bobina
                console.log('📦 Todos os cortes desta bobina foram concluídos!');
                
                // Guardar ID da bobina que precisa ser guardada
                const bobinaParaGuardar = {
                    id: bobinaAtual.id,
                    codigo: bobinaAtual.codigo_interno,
                    tipo: bobinaAtual.tipo_origem || 'bobina'
                };
                
                // Limpar estado do grupo
                itensGrupoAtual = [];
                indiceItemAtual = 0;
                itemValidando = null;
                
                // Pedir para guardar bobina e escanear locação
                await solicitarLocalizacaoBobina(bobinaParaGuardar);
                return;
            }
            
            // Fluxo antigo (caso não esteja em grupo) - verificar bobina_concluida
            if (data.data.bobina_concluida) {
                console.log('📦 Todos os cortes desta bobina foram concluídos!');
                console.log('📍 Bobina ID:', bobinaAtual.id);
                
                // Guardar ID da bobina que precisa ser guardada
                const bobinaParaGuardar = {
                    id: bobinaAtual.id,
                    codigo: bobinaAtual.codigo_interno,
                    tipo: bobinaAtual.tipo_origem || 'bobina'
                };
                
                // Limpar estado do corte
                itemValidando = null;
                
                // Pedir para guardar bobina e escanear locação
                await solicitarLocalizacaoBobina(bobinaParaGuardar);
                return; // Não continua o fluxo normal até guardar
            }
            
            // Verificar se PLANO foi totalmente finalizado
            if (data.data.plano_completo) {
                console.log('🎉 Plano completamente finalizado!');
                
                // Limpar estado
                bobinaAtual = null;
                itemValidando = null;
                
                // Solicitar alocação de localizações
                await solicitarAlocacaoPlano(ordemAtual.id, ordemAtual.numero_ordem || ordemAtual.id);
                return; // Não continua até alocar localizações
            }
            
            // Limpar estado e foto
            const itemIdValidado = itemValidando.alocacao_id || itemValidando.item_id;
            bobinaAtual = null;
            itemValidando = null;
            
            // Recarregar ordens e voltar para lista
            await carregarOrdensProducao();
            
            // Verificar se ordem foi concluída
            const ordemConcluida = data.data.ordem_concluida || (MODO_TESTE && (!ordemAtual || ordemAtual.itens.length === 0));
            
            if (ordemConcluida) {
                mostrarPasso('passo-lista-ordens');
            } else {
                // Atualizar ordem atual com dados atualizados
                ordemAtual = ordensProducao.find(o => o.id === ordemAtual.id);
                if (ordemAtual && ordemAtual.itens.length > 0) {
                    renderizarDetalhesOrdem();
                    mostrarPasso('passo-ordem-detalhes');
                } else {
                    mostrarPasso('passo-lista-ordens');
                }
            }
        } else {
            throw new Error(data.message || 'Erro ao validar item');
        }
    } catch (error) {
        console.error('Erro ao validar item:', error);
        mostrarToast(error.message || 'Erro ao validar item', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// ========== OFERECER IMPRESSÃO APÓS CORTE ==========
async function oferecerImpressaoCorte(corte) {
    return new Promise((resolve) => {
        // Criar modal de impressão
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 25px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        `;
        
        // Preview da etiqueta
        const previewHTML = `
            <h3 style="margin: 0 0 20px 0; text-align: center; color: #333;">
                🖨️ Imprimir Etiqueta?
            </h3>
            <div style="border: 2px solid #000; padding: 20px; background: white; text-align: center; margin-bottom: 20px;">
                <div id="qrcode-preview-corte" style="display: flex; justify-content: center; margin-bottom: 15px;"></div>
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">
                    ${corte.codigo_corte}
                </div>
                <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px;">
                    ${corte.metragem_cortada}m
                </div>
                <div style="font-size: 14px; color: #666; margin-bottom: 5px;">
                    ${corte.produto_codigo}
                </div>
                <div style="font-size: 12px; color: #666;">
                    ${corte.nome_cor || ''} ${corte.gramatura ? corte.gramatura + 'g' : ''}
                </div>
                ${corte.codigo_plano ? `
                    <div style="font-size: 11px; color: #999; margin-top: 10px;">
                        Plano: ${corte.codigo_plano}
                    </div>
                ` : ''}
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="btn-pular-impressao" style="flex: 1; padding: 12px; background: #6c757d; color: white; border: none; border-radius: 8px; font-size: 16px;">
                    Agora Não
                </button>
                <button id="btn-imprimir-agora" style="flex: 1; padding: 12px; background: #28a745; color: white; border: none; border-radius: 8px; font-size: 16px;">
                    🖨️ Imprimir
                </button>
            </div>
        `;
        
        modalContent.innerHTML = previewHTML;
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Gerar QR Code no preview
        setTimeout(() => {
            const qrContainer = document.getElementById('qrcode-preview-corte');
            if (qrContainer && typeof QRCode !== 'undefined') {
                new QRCode(qrContainer, {
                    text: corte.codigo_corte,
                    width: 120,
                    height: 120
                });
            }
        }, 100);
        
        // Botão Pular
        document.getElementById('btn-pular-impressao').onclick = () => {
            document.body.removeChild(modal);
            resolve();
        };
        
        // Botão Imprimir
        document.getElementById('btn-imprimir-agora').onclick = () => {
            imprimirEtiquetaCorte(corte);
            document.body.removeChild(modal);
            resolve();
        };
    });
}

function imprimirEtiquetaCorte(corte) {
    const htmlImpressao = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Etiqueta Corte - ${corte.codigo_corte}</title>
            <style>
                @media print {
                    @page {
                        size: 57mm auto;
                        margin: 2mm;
                    }
                }
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: Arial, sans-serif;
                    width: 57mm;
                    padding: 3mm;
                    background: white;
                }
                .etiqueta {
                    text-align: center;
                    border: 2px solid #000;
                    padding: 3mm;
                }
                .qrcode {
                    margin: 3mm auto;
                }
                .codigo {
                    font-size: 14px;
                    font-weight: bold;
                    margin: 2mm 0;
                }
                .metragem {
                    font-size: 18px;
                    font-weight: bold;
                    margin: 2mm 0;
                }
                .produto {
                    font-size: 12px;
                    margin: 1mm 0;
                }
                .detalhes {
                    font-size: 10px;
                    color: #333;
                    margin: 1mm 0;
                }
                .plano {
                    font-size: 9px;
                    color: #666;
                    margin-top: 2mm;
                }
            </style>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
        </head>
        <body>
            <div class="etiqueta">
                <div id="qrcode" class="qrcode"></div>
                <div class="codigo">${corte.codigo_corte}</div>
                <div class="metragem">${corte.metragem_cortada}m</div>
                <div class="produto">${corte.produto_codigo}</div>
                <div class="detalhes">${corte.nome_cor || ''} ${corte.gramatura ? corte.gramatura + 'g' : ''}</div>
                ${corte.codigo_plano ? `<div class="plano">Plano: ${corte.codigo_plano}</div>` : ''}
            </div>
            <script>
                new QRCode(document.getElementById("qrcode"), {
                    text: "${corte.codigo_corte}",
                    width: 100,
                    height: 100
                });
                setTimeout(() => {
                    window.print();
                    setTimeout(() => window.close(), 500);
                }, 500);
            </script>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlImpressao);
        printWindow.document.close();
    } else {
        mostrarToast('❌ Erro ao abrir janela de impressão', 'error');
    }
}

// ========== SOLICITAR LOCALIZAÇÃO APÓS CORTAR BOBINA ==========
let bobinaAguardandoLocalizacao = null;

async function solicitarLocalizacaoBobina(bobina) {
    bobinaAguardandoLocalizacao = bobina;
    
    // Mostrar instrução
    const container = document.getElementById('container-guardar-bobina');
    container.innerHTML = `
        <div class="card" style="text-align: center; padding: 30px;">
            <h2 style="margin: 0 0 20px 0;">📦 Guardar Bobina</h2>
            <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="font-size: 18px; margin: 0 0 10px 0;">
                    <strong>${bobina.codigo}</strong>
                </p>
                <p style="margin: 0; color: #666;">
                    Todos os cortes desta bobina foram concluídos
                </p>
            </div>
            
            <div class="alert alert-info" style="margin-bottom: 20px;">
                <strong>📍 Próximo passo:</strong><br>
                Guarde a bobina em uma localização e escaneie o QR code da locação
            </div>
            
            <button class="btn btn-primary" onclick="iniciarScannerLocalizacao()">
                📱 Escanear Localização
            </button>
        </div>
    `;
    
    mostrarPasso('passo-guardar-bobina');
}

async function iniciarScannerLocalizacao() {
    document.getElementById('instrucao-scanner-localizacao').innerHTML = `
        📱 Escaneie o QR code da <strong>localização</strong> onde guardou a bobina
    `;
    
    mostrarPasso('passo-scanner-localizacao');
    await pararScanner();
    iniciarScanner('localizacao');
}

async function processarLocalizacao(codigoLocalizacao) {
    if (!bobinaAguardandoLocalizacao) {
        mostrarToast('❌ Erro: bobina não identificada', 'error');
        voltarParaItens();
        return;
    }
    
    mostrarLoading(true);
    
    try {
        // Validar formato da localização (N-X-N)
        if (!/^\d+-[A-Z]-\d+$/.test(codigoLocalizacao)) {
            mostrarToast('❌ Código de localização inválido. Use formato: 1-A-1', 'error');
            setTimeout(() => iniciarScanner('localizacao'), 1500);
            return;
        }
        
        // Atualizar localização da bobina no banco
        const endpoint = bobinaAguardandoLocalizacao.tipo === 'retalho' 
            ? '/api/mobile/atualizar-localizacao-retalho'
            : '/api/mobile/atualizar-localizacao-bobina';
            
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: bobinaAguardandoLocalizacao.id,
                localizacao: codigoLocalizacao
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarToast(`✅ Bobina guardada em ${codigoLocalizacao}`, 'success');
            
            // Limpar estado
            bobinaAtual = null;
            bobinaAguardandoLocalizacao = null;
            
            // Recarregar ordens
            await carregarOrdensProducao();
            
            // Verificar se ainda tem itens pendentes
            ordemAtual = ordensProducao.find(o => o.id === ordemAtual.id);
            if (ordemAtual && ordemAtual.itens.length > 0) {
                renderizarDetalhesOrdem();
                mostrarPasso('passo-ordem-detalhes');
            } else {
                // Plano concluído
                mostrarPasso('passo-lista-ordens');
            }
        } else {
            throw new Error(data.message || 'Erro ao atualizar localização');
        }
    } catch (error) {
        console.error('Erro ao processar localização:', error);
        mostrarToast(error.message || 'Erro ao guardar bobina', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// ========== ALOCAR PLANO EM LOCALIZAÇÕES ==========
let planoAguardandoAlocacao = null;
let locacoesEscaneadas = [];

async function solicitarAlocacaoPlano(planoId, codigoPlano) {
    planoAguardandoAlocacao = { id: planoId, codigo: codigoPlano };
    locacoesEscaneadas = [];
    
    // Mostrar interface
    const container = document.getElementById('container-alocar-plano');
    container.innerHTML = `
        <div class="card" style="text-align: center; padding: 30px;">
            <h2 style="margin: 0 0 20px 0;">🎉 Plano Finalizado!</h2>
            <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 2px solid #4caf50;">
                <p style="font-size: 18px; margin: 0 0 10px 0; font-weight: bold;">
                    ${codigoPlano}
                </p>
                <p style="margin: 0; color: #2e7d32;">
                    Todos os cortes foram realizados!
                </p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #ffc107;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #856404;">
                    📍 Escaneie as localizações de armazenamento
                </p>
                <p style="margin: 0; font-size: 14px; color: #856404;">
                    Pode escanear múltiplas localizações se necessário
                </p>
            </div>
            
            <div id="lista-locacoes-escaneadas" style="margin-bottom: 20px;">
                <!-- Localizações escaneadas aparecerão aqui -->
            </div>
            
            <div style="display: flex; gap: 10px; flex-direction: column;">
                <button class="btn btn-primary" onclick="iniciarScannerAlocacao()" style="font-size: 18px; padding: 15px;">
                    📱 Escanear Localização
                </button>
                <button class="btn btn-success" onclick="finalizarAlocacaoPlano()" id="btn-finalizar-alocacao" disabled style="font-size: 16px; padding: 12px;">
                    ✅ Confirmar (${locacoesEscaneadas.length})
                </button>
                <button class="btn btn-secondary" onclick="cancelarAlocacaoPlano()" style="font-size: 14px; padding: 10px;">
                    Cancelar
                </button>
            </div>
        </div>
    `;
    
    mostrarPasso('passo-alocar-plano');
}

function iniciarScannerAlocacao() {
    const scanner = new Html5Qrcode("reader-localizacao");
    
    scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
            console.log('📱 QR escaneado:', decodedText);
            
            // Parar scanner
            await scanner.stop();
            
            // Processar localização
            await adicionarLocalizacaoAoPlano(decodedText);
        }
    ).catch(err => {
        console.error('Erro ao iniciar scanner:', err);
        mostrarToast('Erro ao acessar câmera', 'error');
    });
    
    // Mostrar passo do scanner
    document.getElementById('instrucao-scanner-localizacao').textContent = 
        '📱 Escaneie QR da localização de armazenamento';
    mostrarPasso('passo-scanner-localizacao');
}

async function adicionarLocalizacaoAoPlano(codigoQR) {
    try {
        // Verificar se é código de localização válido
        if (!codigoQR.startsWith('LOC-') && !codigoQR.match(/^\d+-[A-Z]+-\d+$/)) {
            mostrarToast('❌ QR inválido! Escaneie uma localização', 'error');
            mostrarPasso('passo-alocar-plano');
            return;
        }
        
        // Verificar se já foi escaneada
        const jaEscaneada = locacoesEscaneadas.find(l => l.codigo === codigoQR);
        if (jaEscaneada) {
            mostrarToast('⚠️ Localização já escaneada!', 'warning');
            mostrarPasso('passo-alocar-plano');
            return;
        }
        
        // Adicionar à lista
        locacoesEscaneadas.push({ codigo: codigoQR });
        
        mostrarToast(`✅ Localização adicionada: ${codigoQR}`, 'success');
        
        // Atualizar interface
        atualizarListaLocacoes();
        
        // Voltar para tela de alocação
        mostrarPasso('passo-alocar-plano');
        
    } catch (error) {
        console.error('Erro ao adicionar localização:', error);
        mostrarToast('Erro ao processar localização', 'error');
        mostrarPasso('passo-alocar-plano');
    }
}

function atualizarListaLocacoes() {
    const lista = document.getElementById('lista-locacoes-escaneadas');
    const btnFinalizar = document.getElementById('btn-finalizar-alocacao');
    
    if (locacoesEscaneadas.length === 0) {
        lista.innerHTML = `
            <p style="color: #999; font-size: 14px; margin: 0;">
                Nenhuma localização escaneada
            </p>
        `;
        btnFinalizar.disabled = true;
        btnFinalizar.textContent = 'Confirmar (0)';
    } else {
        lista.innerHTML = `
            <div style="background: #f5f5f5; border-radius: 8px; padding: 15px;">
                <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 14px;">
                    Localizações escaneadas:
                </p>
                ${locacoesEscaneadas.map((loc, i) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: white; border-radius: 4px; margin-bottom: 5px;">
                        <span style="font-weight: bold;">📍 ${loc.codigo}</span>
                        <button onclick="removerLocalizacao(${i})" style="background: #dc3545; color: white; border: none; border-radius: 4px; padding: 5px 10px; font-size: 12px;">
                            ✕
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        btnFinalizar.disabled = false;
        btnFinalizar.textContent = `✅ Confirmar (${locacoesEscaneadas.length})`;
    }
}

function removerLocalizacao(indice) {
    locacoesEscaneadas.splice(indice, 1);
    atualizarListaLocacoes();
    mostrarToast('Localização removida', 'info');
}

async function finalizarAlocacaoPlano() {
    if (locacoesEscaneadas.length === 0) {
        mostrarToast('❌ Escaneie pelo menos uma localização', 'error');
        return;
    }
    
    try {
        mostrarLoading(true);
        
        const response = await fetch('/api/mobile/plano/alocar-localizacoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                plano_id: planoAguardandoAlocacao.id,
                localizacoes: locacoesEscaneadas
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarToast(`✅ Plano guardado em ${locacoesEscaneadas.length} localização(ões)!`, 'success');
            
            // Limpar estado
            planoAguardandoAlocacao = null;
            locacoesEscaneadas = [];
            ordemAtual = null;
            
            // Recarregar ordens e voltar
            await carregarOrdensProducao();
            mostrarPasso('passo-lista-ordens');
        } else {
            throw new Error(data.error || 'Erro ao alocar localizações');
        }
    } catch (error) {
        console.error('Erro ao finalizar alocação:', error);
        mostrarToast(error.message || 'Erro ao alocar plano', 'error');
    } finally {
        mostrarLoading(false);
    }
}

function cancelarAlocacaoPlano() {
    if (confirm('Cancelar alocação? As localizações escaneadas serão perdidas.')) {
        planoAguardandoAlocacao = null;
        locacoesEscaneadas = [];
        mostrarPasso('passo-lista-ordens');
    }
}

// ========== CONTROLE DE PASSOS ==========
function mostrarPasso(passoId) {
    // Encontrar container pai
    const tela = document.getElementById(passoId).closest('.tela');
    
    // Esconder todos os passos da tela
    tela.querySelectorAll('.passo').forEach(passo => {
        passo.classList.remove('active');
    });
    
    // Mostrar passo solicitado
    document.getElementById(passoId).classList.add('active');
}

// ========== SCANNER QR CODE ==========
function iniciarScanner(tipo) {
    let readerId;
    if (tipo === 'corte') {
        readerId = 'reader-corte';
    } else if (tipo === 'consulta') {
        readerId = 'reader-consulta';
    } else if (tipo === 'validacao') {
        readerId = 'reader-validacao';
    } else if (tipo === 'localizacao') {
        readerId = 'reader-localizacao';
    }
    
    if (scannerTransicao || scannerAtivo) {
        // já em execução ou em transição; evita start duplicado
        return;
    }
    
    scannerAtivo = new Html5Qrcode(readerId);
    
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };
    
    scannerTransicao = true;
    scannerAtivo.start(
        { facingMode: "environment" },
        config,
        (decodedText) => onScanSucesso(decodedText, tipo),
        (errorMessage) => {
            // Ignorar erros contínuos de scan
        }
    ).then(() => {
        scannerTransicao = false;
    }).catch(err => {
        console.error('Erro ao iniciar scanner:', err);
        mostrarToast('Erro ao acessar câmera. Verifique as permissões.', 'error');
        scannerTransicao = false;
    });
}

function pararScanner() {
    return new Promise((resolve) => {
        if (!scannerAtivo) return resolve();
        if (scannerTransicao) {
            // aguardar finalização atual
            const wait = setInterval(() => {
                if (!scannerTransicao) {
                    clearInterval(wait);
                    resolve();
                }
            }, 50);
            return;
        }
        scannerTransicao = true;
        scannerAtivo.stop().then(() => {
            scannerAtivo = null;
            scannerTransicao = false;
            resolve();
        }).catch(err => {
            console.error('Erro ao parar scanner:', err);
            scannerAtivo = null;
            scannerTransicao = false;
            resolve();
        });
    });
}

function cancelarScanner(tipo) {
    pararScanner();
    voltarMenu();
}

async function onScanSucesso(qrData, tipo) {
    // Parar scanner e aguardar para evitar estado inconsistente
    await pararScanner();
    
    // Vibrar (se suportado)
    if (navigator.vibrate) {
        navigator.vibrate(200);
    }
    
    console.log('🔍 QR Code lido:', qrData);
    
    try {
        // Limpar espaços em branco
        qrData = qrData.trim();
        
        // Se está escaneando localização (formato N-X-N como 1-A-1)
        if (tipo === 'localizacao') {
            console.log('📍 Processando localização:', qrData);
            await processarLocalizacao(qrData);
            return;
        }
        
        // Novo formato simplificado: BOB-0001 ou RET-0001
        let bobinaId = null;
        let tipoBobina = null;
        
        if (qrData.startsWith('BOB-')) {
            tipoBobina = 'bobina';
            bobinaId = qrData.substring(4); // Remove "BOB-"
            console.log('✅ Formato bobina detectado. Código:', qrData);
        } else if (qrData.startsWith('RET-')) {
            tipoBobina = 'retalho';
            bobinaId = qrData.substring(4); // Remove "RET-"
            console.log('✅ Formato retalho detectado. Código:', qrData);
        } else if (qrData.startsWith('B-')) {
            // Formato legado (compatibilidade)
            tipoBobina = 'bobina';
            bobinaId = qrData.substring(2);
            console.log('⚠️ Formato legado B- detectado. ID:', bobinaId);
        } else if (qrData.startsWith('R-')) {
            // Formato legado (compatibilidade)
            tipoBobina = 'retalho';
            bobinaId = qrData.substring(2);
            console.log('⚠️ Formato legado R- detectado. ID:', bobinaId);
        } else {
            // Tentar formato antigo (JSON)
            console.log('⚠️ Formato não reconhecido. Tentando JSON...');
            try {
                const dados = JSON.parse(qrData);
                tipoBobina = dados.tipo;
                bobinaId = dados.id;
                console.log('✅ JSON parseado:', dados);
            } catch (e) {
                console.error('❌ Não é JSON válido:', e);
                throw new Error('QR Code inválido - formato desconhecido');
            }
        }
        
        if (tipoBobina === 'bobina') {
            console.log('📦 Carregando bobina ID:', bobinaId);
            
            if (tipo === 'validacao') {
                // Validar se é a bobina correta do item
                await processarValidacao(bobinaId);
            } else {
                await carregarBobina(bobinaId, tipo);
            }
        } else if (tipoBobina === 'retalho') {
            console.log('🧵 Carregando retalho ID:', bobinaId);
            
            if (tipo === 'consulta') {
                // Retalhos podem ser consultados
                await carregarRetalho(bobinaId);
            } else if (tipo === 'corte') {
                mostrarToast('⚠️ Para cortar retalho, use a tela de consulta', 'warning');
                voltarScannerCorte();
            } else if (tipo === 'validacao') {
                // Retalhos SÃO usados em ordens de corte - processar validação
                await processarValidacao(bobinaId);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao processar QR Code:', error);
        console.error('❌ Dados recebidos:', qrData);
        mostrarToast('QR Code inválido: ' + qrData, 'error');
        if (tipo === 'corte') {
            voltarScannerCorte();
        } else if (tipo === 'validacao') {
            cancelarValidacao();
        } else {
            voltarScannerConsulta();
        }
    }
}

// ========== CARREGAR DADOS DA BOBINA ==========
async function carregarBobina(bobinaId, tipo) {
    mostrarLoading(true);
    
    try {
        // Usa endpoint de teste ou produção conforme o modo
        const endpoint = MODO_TESTE ? `/api/mobile/teste/bobina/${bobinaId}` : `/api/mobile/bobina/${bobinaId}`;
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.success) {
            bobinaAtual = data.data;
            
            if (tipo === 'corte') {
                mostrarFormCorte();
            } else {
                mostrarDetalhesBobina();
            }
        } else {
            throw new Error(data.message || 'Erro ao carregar bobina');
        }
    } catch (error) {
        console.error('Erro ao carregar bobina:', error);
        mostrarToast('Erro ao carregar dados da bobina', 'error');
        if (tipo === 'corte') {
            voltarScannerCorte();
        } else {
            voltarScannerConsulta();
        }
    } finally {
        mostrarLoading(false);
    }
}

// ========== CARREGAR DADOS DO RETALHO ==========
let retalhoAtual = null;

async function carregarRetalho(retalhoId) {
    mostrarLoading(true);
    
    try {
        const response = await fetch(`/api/mobile/retalho/${retalhoId}`);
        const data = await response.json();
        
        if (data.success) {
            retalhoAtual = data.data;
            mostrarDetalhesRetalho();
        } else {
            throw new Error(data.message || 'Erro ao carregar retalho');
        }
    } catch (error) {
        console.error('Erro ao carregar retalho:', error);
        mostrarToast('Erro ao carregar dados do retalho', 'error');
        voltarScannerConsulta();
    } finally {
        mostrarLoading(false);
    }
}

function mostrarDetalhesRetalho() {
    const container = document.getElementById('bobina-detalhes');
    
    container.innerHTML = `
        <div class="bobina-detalhes-header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
            <div class="detalhes-codigo">🧵 ${retalhoAtual.codigo_retalho}</div>
            <div class="detalhes-grid">
                <div class="detalhes-item">
                    <strong>Tipo:</strong>
                    RETALHO
                </div>
                <div class="detalhes-item">
                    <strong>Status:</strong>
                    ${retalhoAtual.status}
                </div>
                <div class="detalhes-item">
                    <strong>Produto:</strong>
                    ${retalhoAtual.produto_codigo || 'N/A'}
                </div>
                <div class="detalhes-item">
                    <strong>Cor:</strong>
                    ${retalhoAtual.nome_cor || 'N/A'}
                </div>
                <div class="detalhes-item">
                    <strong>Gramatura:</strong>
                    ${retalhoAtual.gramatura || 'N/A'}
                </div>
                <div class="detalhes-item">
                    <strong>Fabricante:</strong>
                    ${retalhoAtual.fabricante || 'N/A'}
                </div>
                <div class="detalhes-item">
                    <strong>Metragem:</strong>
                    <span style="font-size: 1.25rem; color: #fff;">${retalhoAtual.metragem}m</span>
                </div>
                <div class="detalhes-item">
                    <strong>Localização:</strong>
                    ${retalhoAtual.localizacao_atual || 'N/A'}
                </div>
                ${retalhoAtual.bobina_codigo ? `
                <div class="detalhes-item">
                    <strong>Origem:</strong>
                    Bobina ${retalhoAtual.bobina_codigo}
                </div>
                ` : ''}
                <div class="detalhes-item">
                    <strong>Data Criação:</strong>
                    ${formatarData(retalhoAtual.data_entrada)}
                </div>
            </div>
        </div>
        
        ${retalhoAtual.observacoes ? `
        <div class="historico-section">
            <h3>📝 Observações</h3>
            <p>${retalhoAtual.observacoes}</p>
        </div>
        ` : ''}
    `;
    
    mostrarPasso('passo-detalhes');
}

// ========== MOSTRAR FORMULÁRIO DE CORTE ==========
function mostrarFormCorte() {
    const container = document.getElementById('bobina-info-corte');
    const metragemReservada = Number(bobinaAtual.metragem_reservada || 0);
    const metragemLivre = Number(bobinaAtual.metragem_atual) - metragemReservada;
    
    let reservadoHtml = '';
    if (metragemReservada > 0) {
        reservadoHtml = `
            <div class="bobina-info-item" style="background: #fef3c7; border-left: 3px solid #f59e0b;">
                <strong>⚠️ Reservada:</strong><br>${metragemReservada.toFixed(2)}m
            </div>
            <div class="bobina-info-item" style="background: #d1fae5; border-left: 3px solid #10b981;">
                <strong>Livre:</strong><br>${metragemLivre.toFixed(2)}m
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="bobina-info-title">Bobina Escaneada</div>
        <div class="bobina-info-codigo">${bobinaAtual.codigo_interno}</div>
        <div class="bobina-info-grid">
            <div class="bobina-info-item">
                <strong>Produto:</strong><br>${bobinaAtual.codigo}
            </div>
            <div class="bobina-info-item">
                <strong>Cor:</strong><br>${bobinaAtual.nome_cor}
            </div>
            <div class="bobina-info-item">
                <strong>Metragem Atual:</strong><br>${bobinaAtual.metragem_atual}m
            </div>
            <div class="bobina-info-item">
                <strong>Localização:</strong><br>${bobinaAtual.localizacao_atual || 'N/A'}
            </div>
            ${reservadoHtml}
        </div>
    `;
    
    // Definir max do input como metragem atual
    document.getElementById('metragem-cortada').setAttribute('max', bobinaAtual.metragem_atual);
    
    mostrarPasso('passo-form-corte');
}

// ========== SALVAR CORTE ==========
async function salvarCorte(event) {
    event.preventDefault();
    
    const metragemCortada = parseFloat(document.getElementById('metragem-cortada').value);
    const observacoes = document.getElementById('observacoes-corte').value;
    
    // Validar metragem
    if (metragemCortada > bobinaAtual.metragem_atual) {
        mostrarToast('Metragem cortada não pode ser maior que a disponível', 'error');
        return;
    }
    
    if (metragemCortada <= 0) {
        mostrarToast('Metragem deve ser maior que zero', 'error');
        return;
    }
    
    mostrarLoading(true);
    
    try {
        const response = await fetch('/api/mobile/corte', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bobina_id: bobinaAtual.id,
                metragem_cortada: metragemCortada,
                observacoes: observacoes || null
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarToast('✅ Corte registrado com sucesso!', 'success');
            document.getElementById('form-corte').reset();
            
            // Voltar ao menu após 2 segundos
            setTimeout(() => {
                voltarMenu();
            }, 2000);
        } else {
            throw new Error(data.message || 'Erro ao salvar corte');
        }
    } catch (error) {
        console.error('Erro ao salvar corte:', error);
        mostrarToast('Erro ao salvar corte', 'error');
    } finally {
        mostrarLoading(false);
    }
}

// ========== MOSTRAR DETALHES DA BOBINA ==========
function mostrarDetalhesBobina() {
    const container = document.getElementById('bobina-detalhes');
    
    // Calcular total cortado
    const totalCortado = bobinaAtual.historico
        .filter(h => h.tipo === 'CORTE')
        .reduce((sum, h) => sum + parseFloat(h.metragem || 0), 0);
    
    const metragemReservada = Number(bobinaAtual.metragem_reservada || 0);
    const metragemLivre = Number(bobinaAtual.metragem_atual) - metragemReservada;
    
    let reservadoHtml = '';
    if (metragemReservada > 0) {
        reservadoHtml = `
            <div class="detalhes-item" style="background: #fef3c7; border-left: 3px solid #f59e0b; padding: 8px;">
                <strong>⚠️ Reservada:</strong>
                <span style="font-size: 1.1rem; color: #b45309;">${metragemReservada.toFixed(2)}m</span>
            </div>
            <div class="detalhes-item" style="background: #d1fae5; border-left: 3px solid #10b981; padding: 8px;">
                <strong>Livre p/ Corte:</strong>
                <span style="font-size: 1.1rem; color: #059669;">${metragemLivre.toFixed(2)}m</span>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="bobina-detalhes-header">
            <div class="detalhes-codigo">${bobinaAtual.codigo_interno}</div>
            <div class="detalhes-grid">
                <div class="detalhes-item">
                    <strong>Loja:</strong>
                    ${bobinaAtual.loja}
                </div>
                <div class="detalhes-item">
                    <strong>Fabricante:</strong>
                    ${bobinaAtual.fabricante}
                </div>
                <div class="detalhes-item">
                    <strong>Código:</strong>
                    ${bobinaAtual.codigo}
                </div>
                <div class="detalhes-item">
                    <strong>Cor:</strong>
                    ${bobinaAtual.nome_cor}
                </div>
                <div class="detalhes-item">
                    <strong>Gramatura:</strong>
                    ${bobinaAtual.gramatura}
                </div>
                <div class="detalhes-item">
                    <strong>NF:</strong>
                    ${bobinaAtual.nota_fiscal}
                </div>
                <div class="detalhes-item">
                    <strong>Metragem Inicial:</strong>
                    ${bobinaAtual.metragem_inicial}m
                </div>
                <div class="detalhes-item">
                    <strong>Metragem Atual:</strong>
                    <span style="font-size: 1.25rem; color: #10b981;">${bobinaAtual.metragem_atual}m</span>
                </div>
                ${reservadoHtml}
                <div class="detalhes-item">
                    <strong>Total Cortado:</strong>
                    ${totalCortado.toFixed(2)}m
                </div>
                <div class="detalhes-item">
                    <strong>Localização:</strong>
                    ${bobinaAtual.localizacao_atual || 'N/A'}
                </div>
            </div>
        </div>
        
        <div class="historico-section">
            <h3>📜 Histórico de Movimentações</h3>
            ${bobinaAtual.historico.length > 0 ? 
                bobinaAtual.historico.map(h => {
                    let icone = '📥';
                    if (h.tipo === 'CORTE') icone = '✂️';
                    else if (h.tipo === 'RESERVA') icone = '🔒';
                    else if (h.tipo === 'ENTRADA') icone = '📥';
                    
                    return `
                        <div class="historico-item ${h.tipo.toLowerCase()}">
                            <div class="historico-tipo">${icone} ${h.tipo}</div>
                            <div class="historico-data">${formatarData(h.data_movimentacao)}</div>
                            ${h.metragem ? `<div class="historico-metragem">${h.tipo === 'CORTE' || h.tipo === 'RESERVA' ? '-' : '+'}${h.metragem}m</div>` : ''}
                            ${h.observacoes ? `<div style="font-size: 0.875rem; color: var(--text-light);">${h.observacoes}</div>` : ''}
                        </div>
                    `;
                }).join('') 
                : '<p style="color: var(--text-light);">Nenhuma movimentação registrada</p>'
            }
        </div>
    `;
    
    mostrarPasso('passo-detalhes');
}

// ========== UTILIDADES ==========
function mostrarToast(mensagem, tipo = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = mensagem;
    toast.className = `toast ${tipo}`;
    toast.classList.add('show');
    
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function mostrarLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
        loading.classList.add('show');
    } else {
        loading.classList.remove('show');
    }
}

function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// =================================================
// SISTEMA DE CORTES COM QR - NOVAS FUNÇÕES
// =================================================

// Estado para sistema de cortes
let planoAtual = null;
let itemAtual = null;
let alocacaoAtual = null;
let carregamentoAtual = null;
let cortesValidados = [];

// ========== NAVEGAÇÃO CONSULTAS ==========
async function abrirTelaConsultas() {
    await mostrarTela('tela-consultas');
}

function voltarConsultas() {
    mostrarTela('tela-consultas');
}

async function abrirConsultaBobina() {
    await mostrarTela('tela-consulta');
    mostrarPasso('passo-scanner-consulta');
    iniciarScanner('consulta');
}

async function abrirConsultaCorte() {
    await mostrarTela('tela-consultar-corte-qr');
    mostrarPasso('passo-scanner-corte-consulta');
    iniciarScanner('consulta-corte');
}

// ========== NAVEGAÇÃO CARREGAMENTO ==========
async function abrirTelaCarregamento() {
    await mostrarTela('tela-carregamento');
    await carregarPlanosFinalizados();
}

// ========== VALIDAR BOBINA ORIGEM ==========
async function abrirValidarBobina(planoId, itemId, alocacaoId) {
    planoAtual = planoId;
    itemAtual = itemId;
    alocacaoAtual = alocacaoId;
    
    await mostrarTela('tela-validar-bobina');
    
    // Buscar info do item
    try {
        mostrarLoading(true);
        const response = await fetch(`/api/mobile/plano/${planoId}`);
        const data = await response.json();
        
        if (!data.success) throw new Error(data.error);
        
        const item = data.data.itens.find(i => i.item_id === itemId);
        const alocacao = item.alocacoes.find(a => a.id === alocacaoId);
        
        document.getElementById('item-validacao-info').innerHTML = `
            <strong>${item.cor} - ${item.gramatura}g/m² - ${item.largura}cm</strong><br>
            Metragem a cortar: ${alocacao.metragem_alocada}m<br>
            Origem esperada: ${alocacao.origem_tipo === 'bobina' ? 'Bobina' : 'Retalho'} #${alocacao.origem_id}
        `;
        
        iniciarScanner('validar-bobina');
    } catch (error) {
        mostrarToast('Erro ao carregar item: ' + error.message, 'error');
        voltarProducao();
    } finally {
        mostrarLoading(false);
    }
}

function voltarProducao() {
    mostrarTela('tela-producao');
    mostrarPasso('passo-ordem-detalhes');
}

// ========== PROCESSAR VALIDAÇÃO QR BOBINA ==========
async function processarValidacaoBobina(qrData) {
    await pararScanner();
    
    try {
        mostrarLoading(true);
        
        const response = await fetch('/api/mobile/validar-qr-bobina', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                qr_data: qrData,
                alocacao_id: alocacaoAtual
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Validação OK - ir para tela de registro de corte
            document.getElementById('validacao-resultado').innerHTML = `
                <div class="success-box">
                    <div class="success-icon">✅</div>
                    <div class="success-title">Origem Validada!</div>
                    <p>${data.data.origem_tipo === 'bobina' ? 'Bobina' : 'Retalho'} #${data.data.origem_id} confirmada</p>
                </div>
                <button class="btn btn-primary" onclick="irParaRegistrarCorte()">➡️ Registrar Corte</button>
            `;
            document.getElementById('validacao-resultado').classList.remove('hidden', 'erro');
            document.getElementById('validacao-resultado').classList.add('sucesso');
        } else {
            // Validação FALHOU
            document.getElementById('validacao-resultado').innerHTML = `
                <div class="info-box info-warning">
                    <strong>❌ Origem Incorreta</strong>
                    <p>${data.error}</p>
                    <p>Esperado: ${data.data?.origem_esperada || 'N/A'}</p>
                    <p>Escaneado: ${data.data?.origem_escaneada || 'N/A'}</p>
                </div>
                <button class="btn btn-secondary" onclick="reescanearBobina()">🔄 Escanear Novamente</button>
            `;
            document.getElementById('validacao-resultado').classList.remove('hidden', 'sucesso');
            document.getElementById('validacao-resultado').classList.add('erro');
        }
    } catch (error) {
        mostrarToast('Erro na validação: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

async function reescanearBobina() {
    document.getElementById('validacao-resultado').classList.add('hidden');
    iniciarScanner('validar-bobina');
}

async function irParaRegistrarCorte() {
    await mostrarTela('tela-registrar-corte');
    
    // Buscar info da alocação
    try {
        const response = await fetch(`/api/mobile/plano/${planoAtual}`);
        const data = await response.json();
        const item = data.data.itens.find(i => i.item_id === itemAtual);
        const alocacao = item.alocacoes.find(a => a.id === alocacaoAtual);
        
        document.getElementById('bobina-info-registro').innerHTML = `
            <div class="bobina-card">
                <h3>${item.cor} - ${item.gramatura}g/m² - ${item.largura}cm</h3>
                <p><strong>Origem:</strong> ${alocacao.origem_tipo === 'bobina' ? 'Bobina' : 'Retalho'} #${alocacao.origem_id}</p>
                <p><strong>Metragem alocada:</strong> ${alocacao.metragem_alocada}m</p>
                <p><strong>Já cortado:</strong> ${alocacao.metragem_cortada || 0}m</p>
            </div>
        `;
        
        const restante = alocacao.metragem_alocada - (alocacao.metragem_cortada || 0);
        document.getElementById('metragem-restante-display').textContent = restante.toFixed(2);
        document.getElementById('metragem-corte').max = restante;
        
    } catch (error) {
        mostrarToast('Erro ao carregar dados: ' + error.message, 'error');
    }
}

function cancelarRegistroCorte() {
    voltarProducao();
    document.getElementById('form-registrar-corte').reset();
    removerFoto();
}

// ========== UPLOAD FOTO MEDIDOR ==========
document.addEventListener('DOMContentLoaded', () => {
    const fotoInput = document.getElementById('foto-medidor');
    if (fotoInput) {
        fotoInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('preview-img').src = event.target.result;
                    document.getElementById('preview-foto').classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

function removerFoto() {
    document.getElementById('foto-medidor').value = '';
    document.getElementById('preview-foto').classList.add('hidden');
    document.getElementById('preview-img').src = '';
}

// ========== SALVAR NOVO CORTE ==========
async function salvarNovoCorte(event) {
    event.preventDefault();
    
    const metragem = parseFloat(document.getElementById('metragem-corte').value);
    const observacoes = document.getElementById('observacoes-registro').value;
    const fotoInput = document.getElementById('foto-medidor');
    
    if (!fotoInput.files[0]) {
        mostrarToast('Por favor, tire uma foto do medidor', 'error');
        return;
    }
    
    try {
        mostrarLoading(true);
        
        // 1. Upload da foto
        const formData = new FormData();
        formData.append('foto', fotoInput.files[0]);
        
        const uploadResponse = await fetch('/api/mobile/upload-foto-medidor', {
            method: 'POST',
            body: formData
        });
        
        const uploadData = await uploadResponse.json();
        if (!uploadData.success) throw new Error(uploadData.error);
        
        // 2. Registrar corte
        const corteResponse = await fetch('/api/mobile/registrar-corte', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                alocacao_id: alocacaoAtual,
                metragem_cortada: metragem,
                foto_medidor: uploadData.data.filePath,
                observacoes: observacoes || null
            })
        });
        
        const corteData = await corteResponse.json();
        if (!corteData.success) throw new Error(corteData.error);
        
        // 3. Buscar QR do corte
        const qrResponse = await fetch(`/api/qrcodes/corte/${corteData.data.corte.codigo_corte}`);
        const qrData = await qrResponse.json();
        
        // 4. Mostrar tela de sucesso
        await mostrarTela('tela-qr-corte-gerado');
        document.getElementById('codigo-corte-display').textContent = corteData.data.corte.codigo_corte;
        document.getElementById('qr-corte-img').src = qrData.data.qr;
        
        // 5. Mostrar progresso do item
        const progressoHtml = `
            <p><strong>Progresso do Item:</strong></p>
            <p>Metragem total: ${corteData.data.alocacao.metragem_alocada}m</p>
            <p>Já cortado: ${corteData.data.alocacao.metragem_cortada}m</p>
            <p>Restante: ${(corteData.data.alocacao.metragem_alocada - corteData.data.alocacao.metragem_cortada).toFixed(2)}m</p>
            <p><strong>Status:</strong> ${corteData.data.alocacao.status_corte}</p>
        `;
        document.getElementById('info-progresso-item').innerHTML = progressoHtml;
        
        // Limpar form
        document.getElementById('form-registrar-corte').reset();
        removerFoto();
        
    } catch (error) {
        mostrarToast('Erro ao salvar corte: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

async function registrarOutroCorte() {
    // Voltar para validar bobina (mesmo item)
    await abrirValidarBobina(planoAtual, itemAtual, alocacaoAtual);
}

async function finalizarItemCorte() {
    // Voltar para detalhes do plano
    voltarProducao();
    // Recarregar ordem para atualizar status
    if (ordemAtual) {
        abrirOrdem(ordemAtual.id);
    }
}

// ========== FINALIZAR PLANO (ESCANEAR LOCAÇÕES) ==========
async function abrirFinalizarPlano(planoId) {
    planoAtual = planoId;
    locacoesEscaneadas = [];
    
    await mostrarTela('tela-finalizar-plano');
    
    // Buscar info do plano
    try {
        const endpoint = MODO_TESTE ? `/api/mobile/teste/plano/${planoId}` : `/api/mobile/plano/${planoId}`;
        const response = await fetch(endpoint);
        const data = await response.json();
        
        document.getElementById('plano-info-finalizar').innerHTML = `
            <div class="info-row">
                <span class="label">Plano:</span>
                <span class="value">#${data.data.id}</span>
            </div>
            <div class="info-row">
                <span class="label">Cliente:</span>
                <span class="value">${data.data.cliente}</span>
            </div>
            <div class="info-row">
                <span class="label">Total de Itens:</span>
                <span class="value">${data.data.itens.length}</span>
            </div>
        `;
        
        renderizarLocacoesEscaneadas();
        iniciarScanner('locacao');
        
    } catch (error) {
        mostrarToast('Erro ao carregar plano: ' + error.message, 'error');
    }
}

async function processarScanLocacao(qrData) {
    try {
        // Verificar se é QR de locação válido
        // Formato aceito: N-X-N (ex: 1-A-1, 12-B-34, etc.)
        const regexLocacao = /^\d{1,4}-[A-Za-z]-\d{1,4}$/;
        
        if (!regexLocacao.test(qrData)) {
            mostrarToast('QR Code inválido. Escaneie uma locação (formato: N-X-N).', 'error');
            return;
        }
        
        const codigoLocacao = qrData.toUpperCase();
        
        // Verificar se já foi escaneada
        if (locacoesEscaneadas.some(loc => loc.codigo === codigoLocacao)) {
            mostrarToast('Locação já escaneada!', 'warning');
            return;
        }
        
        // Buscar info da locação (endpoint de teste ou real)
        const endpoint = MODO_TESTE 
            ? `/api/mobile/teste/locacao/${encodeURIComponent(codigoLocacao)}` 
            : `/api/locacoes/codigo/${encodeURIComponent(codigoLocacao)}`;
        const response = await fetch(endpoint);
        const data = await response.json();
        
        if (data.success) {
            locacoesEscaneadas.push(data.data);
            renderizarLocacoesEscaneadas();
            mostrarToast(`Locação ${data.data.codigo} adicionada!`, 'success');
            
            // Habilitar botão de confirmar se pelo menos 1 locação
            if (locacoesEscaneadas.length > 0) {
                document.getElementById('btn-confirmar-finalizacao').disabled = false;
            }
        } else {
            mostrarToast(data.message || 'Locação não encontrada', 'error');
        }
    } catch (error) {
        mostrarToast('Erro ao processar locação: ' + error.message, 'error');
    }
}

function renderizarLocacoesEscaneadas() {
    const container = document.getElementById('lista-locacoes');
    
    if (locacoesEscaneadas.length === 0) {
        container.innerHTML = '<p class="text-muted">Nenhuma locação escaneada ainda...</p>';
        return;
    }
    
    container.innerHTML = locacoesEscaneadas.map(loc => `
        <div class="locacao-item">
            <div class="icon">📍</div>
            <div class="info">
                <div class="codigo">${loc.codigo}</div>
                <div class="descricao">${loc.descricao || 'Sem descrição'}</div>
            </div>
        </div>
    `).join('');
}

async function confirmarFinalizacao() {
    if (locacoesEscaneadas.length === 0) {
        mostrarToast('Escaneie pelo menos uma locação', 'error');
        return;
    }
    
    try {
        mostrarLoading(true);
        await pararScanner();
        
        const endpoint = MODO_TESTE 
            ? `/api/mobile/teste/plano/${planoAtual}/finalizar` 
            : `/api/mobile/plano/${planoAtual}/finalizar`;
            
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                locacoes_ids: locacoesEscaneadas.map(loc => loc.id)
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarToast('Plano finalizado com sucesso!', 'success');
            voltarMenu();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        mostrarToast('Erro ao finalizar: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

function cancelarFinalizacao() {
    locacoesEscaneadas = [];
    voltarProducao();
}

// ========== CONSULTAR CORTE VIA QR ==========
async function processarConsultaCorte(qrData) {
    await pararScanner();
    
    try {
        mostrarLoading(true);
        
        const codigoCorte = qrData.replace('CORTE-', '');
        const response = await fetch(`/api/mobile/corte/${codigoCorte}`);
        const data = await response.json();
        
        if (!data.success) throw new Error(data.error);
        
        const corte = data.data;
        corteAtual = corte; // Armazenar para função de impressão
        
        // Renderizar detalhes
        document.getElementById('corte-detalhes-container').innerHTML = `
            <div class="success-box">
                <div class="success-icon">✂️</div>
                <div class="success-title">Corte Encontrado</div>
                <div class="codigo-display">${corte.codigo_corte}</div>
            </div>
            
            <div class="info-box">
                <h3>Informações do Corte</h3>
                <div class="info-row">
                    <span class="label">Metragem:</span>
                    <span class="value">${corte.metragem_cortada}m</span>
                </div>
                <div class="info-row">
                    <span class="label">Data:</span>
                    <span class="value">${formatarData(corte.created_at)}</span>
                </div>
                <div class="info-row">
                    <span class="label">Plano:</span>
                    <span class="value">#${corte.plano_id}</span>
                </div>
                <div class="info-row">
                    <span class="label">Origem:</span>
                    <span class="value">${corte.origem_tipo} #${corte.origem_id}</span>
                </div>
                ${corte.observacoes ? `<p><strong>Obs:</strong> ${corte.observacoes}</p>` : ''}
            </div>
            
            ${corte.foto_medidor ? `
                <div class="foto-preview">
                    <img src="${corte.foto_medidor}" alt="Foto do Medidor">
                    <p class="qr-instrucao">Foto de Contraprova</p>
                </div>
            ` : ''}
        `;
        
        mostrarPasso('passo-detalhes-corte');
        
    } catch (error) {
        mostrarToast('Erro ao consultar corte: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

async function escanearOutroCorte() {
    mostrarPasso('passo-scanner-corte-consulta');
    iniciarScanner('consulta-corte');
}

function imprimirEtiquetaCorte() {
    if (!corteAtual) {
        mostrarToast('Erro: nenhum corte selecionado', 'error');
        return;
    }
    
    // Abrir página de impressão em nova janela
    const url = `/impressao/etiqueta-corte.html?codigo=${corteAtual.codigo_corte}`;
    window.open(url, '_blank', 'width=800,height=600');
}

// ========== CARREGAMENTO - LISTAR PLANOS ==========
async function carregarPlanosFinalizados() {
    try {
        mostrarLoading(true);
        
        const response = await fetch('/api/mobile/planos-finalizados');
        const data = await response.json();
        
        if (!data.success) throw new Error(data.error);
        
        const container = document.getElementById('lista-planos-finalizados');
        
        if (data.data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <p>Nenhum plano finalizado</p>
                    <small style="color: var(--text-light);">Finalize planos de corte para que apareçam aqui</small>
                </div>
            `;
            return;
        }
        
        container.innerHTML = data.data.map(plano => {
            const locacoesTexto = plano.localizacoes && plano.localizacoes.length > 0
                ? plano.localizacoes.map(l => l.codigo_locacao).join(', ')
                : 'Sem localização';
            
            const temCarregamento = plano.carregamento !== null;
            const carregamentoConcluido = temCarregamento && plano.carregamento.status === 'concluido';
            
            return `
                <div class="ordem-card ${carregamentoConcluido ? 'ordem-sem-itens' : ''}" 
                     onclick="${!carregamentoConcluido ? `iniciarNovoCarregamento(${plano.id}, '${plano.codigo_plano}', ${plano.total_cortes})` : ''}">
                    <div class="ordem-header">
                        <span class="ordem-numero">${plano.codigo_plano}</span>
                        <span class="ordem-status ${carregamentoConcluido ? 'status-concluida' : 'status-finalizado'}">
                            ${carregamentoConcluido ? '✅ Carregado' : 'Finalizado'}
                        </span>
                    </div>
                    <div class="ordem-info">
                        <span>📦 ${plano.total_cortes} cortes realizados</span>
                        <span>📍 ${locacoesTexto}</span>
                    </div>
                    ${plano.cliente || plano.aviario ? `
                        <div class="ordem-obs">
                            ${plano.cliente || ''} ${plano.aviario ? '- ' + plano.aviario : ''}
                        </div>
                    ` : ''}
                    ${temCarregamento ? `
                        <div style="background: ${carregamentoConcluido ? '#d1fae5' : '#fef3c7'}; padding: 8px; border-radius: 4px; margin-top: 8px; font-size: 13px;">
                            ${carregamentoConcluido 
                                ? `✅ ${plano.carregamento.codigo_carregamento} - ${plano.carregamento.cortes_carregados} cortes`
                                : `⏳ ${plano.carregamento.codigo_carregamento} em andamento (${plano.carregamento.cortes_carregados}/${plano.carregamento.total_cortes})`
                            }
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar planos:', error);
        mostrarToast('Erro ao carregar planos: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

// ========== CARREGAMENTO - INICIAR ==========
let carregamentoEmAndamento = null;
let scannerCarregamento = null;

async function iniciarNovoCarregamento(planoId, codigoPlano, totalCortes) {
    try {
        mostrarLoading(true);
        
        const response = await fetch('/api/mobile/carregamento/iniciar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                plano_id: planoId,
                operador_nome: 'Operador Mobile' // Pode pedir nome depois
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            // Se já existe carregamento em andamento, continuar com ele
            if (data.carregamento_id) {
                mostrarToast('Continuando carregamento em andamento...', 'info');
                // Aqui poderia buscar dados do carregamento existente
                // Por ora, apenas mostra mensagem
                return;
            }
            throw new Error(data.error);
        }
        
        carregamentoEmAndamento = data.data;
        cortesValidados = [];
        
        // Exibir tela de validação
        await mostrarTela('tela-validacao-carregamento');
        
        // Renderizar info do carregamento
        document.getElementById('carregamento-info').innerHTML = `
            <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #0c4a6e;">
                    ${carregamentoEmAndamento.codigo_carregamento}
                </h3>
                <div style="font-size: 14px; color: #075985;">
                    <div>📋 Plano: <strong>${carregamentoEmAndamento.codigo_plano}</strong></div>
                    <div>📦 Total de cortes: <strong>${carregamentoEmAndamento.total_cortes}</strong></div>
                </div>
            </div>
        `;
        
        atualizarProgressoCarregamento();
        iniciarScannerCarregamento();
        
    } catch (error) {
        console.error('Erro ao iniciar carregamento:', error);
        mostrarToast('Erro: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

function iniciarScannerCarregamento() {
    const readerElement = document.getElementById('reader-carregamento');
    
    if (!readerElement) {
        console.error('Elemento reader-carregamento não encontrado');
        return;
    }
    
    scannerCarregamento = new Html5Qrcode("reader-carregamento");
    
    scannerCarregamento.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
            console.log('📱 QR escaneado no carregamento:', decodedText);
            await processarScanCarregamento(decodedText);
        }
    ).catch(err => {
        console.error('Erro ao iniciar scanner de carregamento:', err);
        mostrarToast('Erro ao acessar câmera', 'error');
    });
}

async function processarScanCarregamento(codigoCorte) {
    try {
        const feedbackDiv = document.getElementById('feedback-scan');
        
        // Validar corte no backend
        const response = await fetch('/api/mobile/carregamento/validar-corte', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                carregamento_id: carregamentoEmAndamento.id,
                codigo_corte: codigoCorte
            })
        });
        
        const data = await response.json();
        
        // Feedback visual
        feedbackDiv.classList.remove('hidden');
        
        if (data.success && data.validacao === 'valido') {
            // VERDE - Corte válido
            feedbackDiv.style.background = '#10b981';
            feedbackDiv.style.color = 'white';
            feedbackDiv.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 8px;">✅</div>
                <div style="font-size: 16px; font-weight: bold;">${data.data.corte.codigo_corte}</div>
                <div style="font-size: 14px;">${data.data.corte.metragem_cortada}m - ${data.data.corte.produto_codigo}</div>
                <div style="font-size: 12px; margin-top: 5px; opacity: 0.9;">
                    Corte ${data.data.ordem_scan} | ${data.data.progresso.percentual}% completo
                </div>
            `;
            
            // Adicionar à lista local
            cortesValidados.push(data.data.corte);
            renderizarCortesValidados();
            atualizarProgressoCarregamento();
            
            // Atualizar contador do carregamento
            carregamentoEmAndamento.cortes_carregados = data.data.progresso.carregados;
            
            // Verificar se completo
            if (data.data.completo) {
                setTimeout(() => {
                    if (confirm('✅ Todos os cortes foram validados! Finalizar carregamento?')) {
                        finalizarCarregamentoAtual();
                    }
                }, 1000);
            }
            
        } else if (data.validacao === 'duplicado') {
            // AMARELO - Já escaneado
            feedbackDiv.style.background = '#f59e0b';
            feedbackDiv.style.color = 'white';
            feedbackDiv.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 8px;">⚠️</div>
                <div style="font-size: 14px;">${data.error}</div>
            `;
            
        } else if (data.validacao === 'plano_errado') {
            // LARANJA - Plano errado
            feedbackDiv.style.background = '#f97316';
            feedbackDiv.style.color = 'white';
            feedbackDiv.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 8px;">❌</div>
                <div style="font-size: 14px;">Corte de outro plano!</div>
                <div style="font-size: 12px; margin-top: 5px;">${codigoCorte}</div>
            `;
            
        } else {
            // VERMELHO - Inválido
            feedbackDiv.style.background = '#ef4444';
            feedbackDiv.style.color = 'white';
            feedbackDiv.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 8px;">❌</div>
                <div style="font-size: 14px;">${data.error || 'Corte não encontrado'}</div>
            `;
        }
        
        // Remover feedback após 2 segundos
        setTimeout(() => {
            feedbackDiv.classList.add('hidden');
        }, 2000);
        
    } catch (error) {
        console.error('Erro ao processar scan:', error);
        mostrarToast('Erro ao validar corte', 'error');
    }
}

function renderizarCortesValidados() {
    const container = document.getElementById('lista-validados');
    
    if (cortesValidados.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Nenhum corte validado</p>';
        return;
    }
    
    container.innerHTML = cortesValidados.map((corte, index) => `
        <div style="display: flex; align-items: center; padding: 10px; background: white; border-radius: 8px; margin-bottom: 8px; border: 1px solid #e5e7eb;">
            <div style="font-size: 20px; margin-right: 12px;">✅</div>
            <div style="flex: 1;">
                <div style="font-weight: bold; font-size: 14px;">${corte.codigo_corte}</div>
                <div style="font-size: 12px; color: #666;">
                    ${corte.metragem_cortada}m - ${corte.produto_codigo}
                </div>
            </div>
            <div style="color: #999; font-size: 12px;">
                #${index + 1}
            </div>
        </div>
    `).join('');
}

function atualizarProgressoCarregamento() {
    const total = carregamentoEmAndamento.total_cortes;
    const validados = cortesValidados.length;
    const percentual = total > 0 ? (validados / total) * 100 : 0;
    
    document.getElementById('progresso-texto').textContent = `${validados} / ${total}`;
    document.getElementById('progresso-fill').style.width = `${percentual}%`;
    
    // Habilitar botão finalizar se todos validados
    const btnFinalizar = document.getElementById('btn-finalizar-carregamento');
    if (btnFinalizar) {
        btnFinalizar.disabled = validados < total;
    }
}

async function finalizarCarregamentoAtual() {
    try {
        mostrarLoading(true);
        
        // Parar scanner
        if (scannerCarregamento) {
            try {
                await scannerCarregamento.stop();
                scannerCarregamento = null;
            } catch (err) {
                console.log('Scanner já estava parado');
            }
        }
        
        const response = await fetch('/api/mobile/carregamento/finalizar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                carregamento_id: carregamentoEmAndamento.id
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarToast(`✅ ${data.data.codigo_carregamento} finalizado!`, 'success');
            
            // Limpar estado
            carregamentoEmAndamento = null;
            cortesValidados = [];
            
            // Voltar para lista de planos
            await abrirTelaCarregamento();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Erro ao finalizar carregamento:', error);
        mostrarToast('Erro: ' + error.message, 'error');
    } finally {
        mostrarLoading(false);
    }
}

async function cancelarCarregamento() {
    if (carregamentoEmAndamento && cortesValidados.length > 0) {
        if (!confirm('Cancelar carregamento? Os cortes já validados serão perdidos.')) {
            return;
        }
    }
    
    // Parar scanner
    if (scannerCarregamento) {
        try {
            await scannerCarregamento.stop();
            scannerCarregamento = null;
        } catch (err) {
            console.log('Scanner já estava parado');
        }
    }
    
    carregamentoEmAndamento = null;
    cortesValidados = [];
    
    await abrirTelaCarregamento();
}

// ========== ATUALIZAR HANDLER DE SCANNER ==========
// Modificar a função onScanSucesso existente para incluir novos tipos
const onScanSucessoOriginal = window.onScanSucesso;

window.onScanSucesso = async function(qrData, tipo) {
    if (tipo === 'validar-bobina') {
        await processarValidacaoBobina(qrData);
    } else if (tipo === 'locacao') {
        await processarScanLocacao(qrData);
    } else if (tipo === 'consulta-corte') {
        await processarConsultaCorte(qrData);
    } else if (tipo === 'carregamento') {
        await processarScanCarregamento(qrData);
    } else if (onScanSucessoOriginal) {
        await onScanSucessoOriginal(qrData, tipo);
    }
};

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Bobinas App carregado!');
    
    // HANDLER BOTÃO VOLTAR DO ANDROID
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
        document.addEventListener('backbutton', (e) => {
            e.preventDefault();
            
            // Se está no menu principal, minimiza o app (não fecha)
            const menuPrincipal = document.getElementById('menu-principal');
            if (menuPrincipal && menuPrincipal.classList.contains('tela-ativa')) {
                // Minimizar app ao invés de fechar
                if (window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
                    window.Capacitor.Plugins.App.minimizeApp();
                }
                return;
            }
            
            // Se está em outra tela, volta pro menu
            voltarMenu();
        });
        
        console.log('✅ Back button handler registrado');
    }
    
    // Registrar Service Worker para PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/mobile/service-worker.js')
            .then(reg => console.log('✅ Service Worker registrado'))
            .catch(err => console.error('❌ Erro ao registrar Service Worker:', err));
    }
});

