// ========== ESTADO GLOBAL ==========
let scannerAtivo = null;
let bobinaAtual = null;

// ========== NAVEGAÇÃO ENTRE TELAS ==========
function mostrarTela(telaId) {
    // Esconder todas as telas
    document.querySelectorAll('.tela').forEach(tela => {
        tela.classList.remove('active');
    });
    
    // Mostrar tela solicitada
    document.getElementById(telaId).classList.add('active');
    
    // Parar scanner se houver
    pararScanner();
}

function voltarMenu() {
    mostrarTela('tela-menu');
    bobinaAtual = null;
}

// ========== TELA DE CORTE ==========
function abrirTelaCorte() {
    mostrarTela('tela-corte');
    mostrarPasso('passo-scanner-corte');
    iniciarScanner('corte');
}

function voltarScannerCorte() {
    mostrarPasso('passo-scanner-corte');
    document.getElementById('form-corte').reset();
    bobinaAtual = null;
    iniciarScanner('corte');
}

// ========== TELA DE CONSULTA ==========
function abrirTelaConsulta() {
    mostrarTela('tela-consulta');
    mostrarPasso('passo-scanner-consulta');
    iniciarScanner('consulta');
}

function voltarScannerConsulta() {
    mostrarPasso('passo-scanner-consulta');
    bobinaAtual = null;
    iniciarScanner('consulta');
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
    const readerId = tipo === 'corte' ? 'reader-corte' : 'reader-consulta';
    
    scannerAtivo = new Html5Qrcode(readerId);
    
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };
    
    scannerAtivo.start(
        { facingMode: "environment" },
        config,
        (decodedText) => onScanSucesso(decodedText, tipo),
        (errorMessage) => {
            // Ignorar erros contínuos de scan
        }
    ).catch(err => {
        console.error('Erro ao iniciar scanner:', err);
        mostrarToast('Erro ao acessar câmera. Verifique as permissões.', 'error');
    });
}

function pararScanner() {
    if (scannerAtivo) {
        scannerAtivo.stop().then(() => {
            scannerAtivo = null;
        }).catch(err => {
            console.error('Erro ao parar scanner:', err);
        });
    }
}

function cancelarScanner(tipo) {
    pararScanner();
    voltarMenu();
}

async function onScanSucesso(qrData, tipo) {
    // Parar scanner
    pararScanner();
    
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
            await carregarBobina(bobinaId, tipo);
        } else if (tipoBobina === 'retalho') {
            mostrarToast('Retalhos ainda não suportados no app mobile', 'warning');
            if (tipo === 'corte') {
                voltarScannerCorte();
            } else {
                voltarScannerConsulta();
            }
        }
    } catch (error) {
        console.error('❌ Erro ao processar QR Code:', error);
        console.error('❌ Dados recebidos:', qrData);
        mostrarToast('QR Code inválido: ' + qrData, 'error');
        if (tipo === 'corte') {
            voltarScannerCorte();
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

// ========== MOSTRAR FORMULÁRIO DE CORTE ==========
function mostrarFormCorte() {
    const container = document.getElementById('bobina-info-corte');
    
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
                bobinaAtual.historico.map(h => `
                    <div class="historico-item">
                        <div class="historico-tipo">${h.tipo}</div>
                        <div class="historico-data">${formatarData(h.data_movimentacao)}</div>
                        ${h.metragem ? `<div class="historico-metragem">${h.metragem}m</div>` : ''}
                        ${h.observacoes ? `<div style="font-size: 0.875rem; color: var(--text-light);">${h.observacoes}</div>` : ''}
                    </div>
                `).join('') 
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
