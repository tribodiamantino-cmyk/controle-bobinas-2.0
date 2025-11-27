// ========== ESTADO GLOBAL ==========
let scannerAtivo = null;
let scannerTransicao = false; // evita start/stop concorrente
let bobinaAtual = null;
let ordensProducao = [];
let ordemAtual = null;
let itemValidando = null;

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
        const response = await fetch('/api/mobile/ordens-producao');
        const data = await response.json();
        
        if (data.success) {
            ordensProducao = data.data;
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
    
    // Filtrar itens que têm bobina alocada
    const itensComBobina = ordemAtual.itens.filter(item => item.bobina_id !== null);
    const itensSemBobina = ordemAtual.itens.filter(item => item.bobina_id === null);
    
    container.innerHTML = `
        <div class="ordem-detalhes-header">
            <h3>${ordemAtual.numero_ordem}</h3>
            <span class="ordem-status status-${ordemAtual.status.toLowerCase().replace(' ', '-')}">${ordemAtual.status}</span>
        </div>
        
        ${ordemAtual.observacoes ? `<div class="ordem-cliente">${ordemAtual.observacoes}</div>` : ''}
        
        <div class="itens-lista">
            <h4>📦 Itens Prontos para Corte</h4>
            ${itensComBobina.length === 0 ? 
                '<p style="color: var(--text-light);">Nenhum item com bobina alocada</p>' :
                itensComBobina.map(item => `
                    <div class="item-card" onclick="iniciarValidacaoItem(${item.alocacao_id || item.item_id})">
                        <div class="item-header">
                            <span class="item-bobina">${item.bobina_codigo || 'Bobina #' + item.bobina_id}</span>
                            <span class="item-metragem">${item.metragem_alocada || item.metragem_solicitada}m</span>
                        </div>
                        <div class="item-info">
                            <span>${item.produto_codigo || ''} ${item.nome_cor ? '- ' + item.nome_cor : ''}</span>
                            <span>📍 ${item.localizacao_atual || 'N/A'}</span>
                        </div>
                        <div class="item-disponivel">
                            Disponível: <strong>${item.metragem_atual}m</strong>
                        </div>
                        <div class="item-action">
                            👆 Toque para validar corte
                        </div>
                    </div>
                `).join('')
            }
            
            ${itensSemBobina.length > 0 ? `
                <h4 style="margin-top: 1.5rem;">⏳ Aguardando Alocação de Bobina</h4>
                ${itensSemBobina.map(item => `
                    <div class="item-card item-pendente" style="opacity: 0.7; background: #f3f4f6;">
                        <div class="item-header">
                            <span class="item-bobina" style="color: #6b7280;">Sem bobina</span>
                            <span class="item-metragem">${item.metragem_alocada || item.metragem_solicitada}m</span>
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

function voltarListaOrdens() {
    ordemAtual = null;
    itemValidando = null;
    mostrarPasso('passo-lista-ordens');
}

async function iniciarValidacaoItem(alocacaoId) {
    itemValidando = ordemAtual.itens.find(i => (i.alocacao_id || i.item_id) === alocacaoId);
    if (!itemValidando) return;
    
    // Atualizar instrução do scanner
    document.getElementById('instrucao-validacao').innerHTML = `
        📱 Escaneie a bobina <strong>${itemValidando.bobina_codigo || '#' + itemValidando.bobina_id}</strong>
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
async function processarValidacao(bobinaId) {
    // Verificar se bobina escaneada corresponde ao item
    if (itemValidando.bobina_id != bobinaId) {
        mostrarToast('❌ Bobina incorreta! Escaneie a bobina ' + (itemValidando.bobina_codigo || '#' + itemValidando.bobina_id), 'error');
        // Reiniciar scanner para tentar novamente
        setTimeout(() => iniciarScanner('validacao'), 1500);
        return;
    }
    
    // Bobina correta - buscar dados atualizados
    mostrarLoading(true);
    
    try {
        const response = await fetch(`/api/mobile/bobina/${bobinaId}`);
        const data = await response.json();
        
        if (data.success) {
            bobinaAtual = data.data;
            mostrarConfirmacaoCorte();
        } else {
            throw new Error(data.message || 'Erro ao carregar bobina');
        }
    } catch (error) {
        console.error('Erro ao carregar bobina:', error);
        mostrarToast('Erro ao carregar dados da bobina', 'error');
        cancelarValidacao();
    } finally {
        mostrarLoading(false);
    }
}

function mostrarConfirmacaoCorte() {
    const container = document.getElementById('confirma-corte-container');
    
    const metragemReservada = Number(bobinaAtual.metragem_reservada || 0);
    const metragemSolicitada = Number(itemValidando.metragem_alocada || itemValidando.metragem_solicitada || 0);
    
    container.innerHTML = `
        <div class="confirma-header">
            <h3>✅ Bobina Verificada</h3>
            <p>Confirme o corte do item</p>
        </div>
        
        <div class="confirma-ordem">
            <strong>Ordem:</strong> ${ordemAtual.numero_ordem}
        </div>
        
        <div class="bobina-info" style="margin: 1rem 0;">
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
                ${metragemReservada > 0 ? `
                    <div class="bobina-info-item" style="background: #fef3c7; border-left: 3px solid #f59e0b;">
                        <strong>⚠️ Reservada:</strong><br>${metragemReservada.toFixed(2)}m
                    </div>
                ` : ''}
            </div>
        </div>
        
        <form id="form-validacao" onsubmit="confirmarValidacao(event)">
            <div class="form-group">
                <label for="metragem-validacao">Metragem Cortada (metros)</label>
                <input type="number" id="metragem-validacao" step="0.01" min="0.01" 
                       value="${metragemSolicitada}" 
                       max="${bobinaAtual.metragem_atual}" required>
                <small style="color: var(--text-light);">Solicitado: ${metragemSolicitada}m</small>
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
    
    mostrarPasso('passo-confirma-corte');
}

async function confirmarValidacao(event) {
    event.preventDefault();
    
    const metragemCortada = parseFloat(document.getElementById('metragem-validacao').value);
    const observacoes = document.getElementById('observacoes-validacao').value;
    
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
        const response = await fetch('/api/mobile/validar-item', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                item_id: itemValidando.alocacao_id || itemValidando.item_id,
                bobina_id: bobinaAtual.id,
                metragem_cortada: metragemCortada,
                observacoes: observacoes || null
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.data.ordem_concluida) {
                mostrarToast('✅ Item validado! Ordem concluída!', 'success');
            } else {
                mostrarToast('✅ Item validado com sucesso!', 'success');
            }
            
            // Limpar estado
            bobinaAtual = null;
            itemValidando = null;
            
            // Recarregar ordens e voltar para lista
            await carregarOrdensProducao();
            
            // Se ordem foi concluída ou não tem mais itens, voltar para lista
            if (data.data.ordem_concluida) {
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
        
        // Novo formato simplificado: B-123 ou R-456
        let bobinaId = null;
        let tipoBobina = null;
        
        if (qrData.startsWith('B-')) {
            tipoBobina = 'bobina';
            bobinaId = qrData.substring(2); // Remove "B-"
            console.log('✅ Formato bobina detectado. ID:', bobinaId);
        } else if (qrData.startsWith('R-')) {
            tipoBobina = 'retalho';
            bobinaId = qrData.substring(2); // Remove "R-"
            console.log('✅ Formato retalho detectado. ID:', bobinaId);
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
                mostrarToast('⚠️ Retalhos não são usados em ordens de corte', 'warning');
                cancelarValidacao();
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
        const response = await fetch(`/api/mobile/bobina/${bobinaId}`);
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

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Bobinas App carregado!');
    
    // Registrar Service Worker para PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/mobile/service-worker.js')
            .then(reg => console.log('✅ Service Worker registrado'))
            .catch(err => console.error('❌ Erro ao registrar Service Worker:', err));
    }
});
