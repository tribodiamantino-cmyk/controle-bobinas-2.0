// API_BASE agora usa configuração global (api-config.js)
const API_BASE = window.API_CONFIG ? window.API_CONFIG.FULL_API : '/api';
let tipoAtual = null;
let dadosAtual = null;
let html5QrCode = null;
let bluetoothPrinter = null; // Instância do printer Bluetooth
let isNativeApp = false; // Flag para detectar se está rodando em Capacitor

// ========== INICIALIZAÇÃO ==========

// Detectar se está rodando em app nativo (Capacitor)
async function inicializarApp() {
    try {
        // Verificar se Capacitor está disponível
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
            isNativeApp = true;
            console.log('✅ App Nativo detectado');
            
            // Aguardar bluetoothPrinter estar disponível (carregado de bluetooth-printer.js)
            let tentativas = 0;
            while (!window.bluetoothPrinter && tentativas < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                tentativas++;
            }
            
            if (window.bluetoothPrinter) {
                bluetoothPrinter = window.bluetoothPrinter;
                await bluetoothPrinter.init();
                console.log('✅ Bluetooth Printer inicializado');
            } else {
                console.warn('⚠️ bluetoothPrinter não encontrado');
            }
        } else {
            console.log('ℹ️ Rodando em PWA - Impressão via navegador');
            isNativeApp = false;
        }
    } catch (error) {
        console.error('Erro ao inicializar app:', error);
        isNativeApp = false;
    }
}

// Executar inicialização
inicializarApp();

// ========== MENSAGENS (TOAST) ==========

function mostrarMensagem(mensagem, tipo = 'info') {
    // Criar toast se não existir
    let toast = document.getElementById('toast-impressao');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-impressao';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            display: none;
        `;
        document.body.appendChild(toast);
    }
    
    // Cores por tipo
    const cores = {
        'success': '#10b981',
        'error': '#ef4444',
        'info': '#3b82f6',
        'warning': '#f59e0b'
    };
    
    toast.style.background = cores[tipo] || cores.info;
    toast.textContent = mensagem;
    toast.style.display = 'block';
    
    // Remover após 3 segundos
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// ========== FLUXO PRINCIPAL ==========

function selecionarTipo(tipo) {
    tipoAtual = tipo;
    
    const nomes = {
        'bobina': 'da Bobina',
        'retalho': 'do Retalho',
        'corte': 'do Corte',
        'localizacao': 'da Localização'
    };
    
    document.getElementById('tipo-selecionado').textContent = nomes[tipo];
    
    // LOCALIZAÇÃO: Pular scanner, ir direto para input de código
    if (tipo === 'localizacao') {
        mostrarPasso('passo-scanner');
        // Não inicia scanner, apenas mostra instrução para digitar código
        document.getElementById('scanner-instrucao').innerHTML = 
            '📍 Digite o código da localização<br>(Exemplo: 1234-A-5678)';
        return;
    }
    
    // Outros tipos: Ir para passo de scanner
    mostrarPasso('passo-scanner');
    iniciarScanner();
}

function voltarParaTipos() {
    pararScanner();
    mostrarPasso('passo-tipo');
    tipoAtual = null;
}

function voltarParaScanner() {
    mostrarPasso('passo-scanner');
    iniciarScanner();
}

function mostrarPasso(passoId) {
    document.querySelectorAll('.passo').forEach(p => p.classList.remove('active'));
    document.getElementById(passoId).classList.add('active');
}

// ========== SCANNER ==========

function iniciarScanner() {
    html5QrCode = new Html5Qrcode("reader");
    
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
    };
    
    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSucesso,
        onScanErro
    ).catch(err => {
        console.error('Erro ao iniciar câmera:', err);
        mostrarMensagem('Erro ao acessar câmera: ' + err, 'error');
    });
}

function pararScanner() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            html5QrCode.clear();
        }).catch(err => {
            console.error('Erro ao parar scanner:', err);
        });
    }
}

async function onScanSucesso(decodedText, decodedResult) {
    console.log('QR Code lido:', decodedText);
    
    // Validar se o código corresponde ao tipo selecionado
    const prefixos = {
        'bobina': 'BOB-',
        'retalho': 'RET-',
        'corte': 'COR-',
        'plano': 'PLA-',
        'localizacao': /^\d+-[A-Z]+-\d+$/ // regex para formato 0001-A-0001
    };
    
    // Validação especial para localização (aceita regex)
    if (tipoAtual === 'localizacao') {
        if (!decodedText.match(prefixos[tipoAtual])) {
            mostrarMensagem('Código inválido! Escaneie uma localização (ex: 0001-A-0001)', 'error');
            return;
        }
    } else {
        if (!decodedText.startsWith(prefixos[tipoAtual])) {
            mostrarMensagem(`Código inválido! Escaneie um código ${prefixos[tipoAtual]}`, 'error');
            return;
        }
    }
    
    // Parar scanner
    pararScanner();
    
    // Buscar dados do código
    try {
        const response = await fetch(`${API_BASE}/mobile/imprimir/buscar-codigo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo: decodedText })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Código não encontrado');
        }
        
        dadosAtual = data.data;
        
        // Gerar preview
        gerarPreview();
        
        // Ir para passo de preview
        mostrarPasso('passo-preview');
        
    } catch (error) {
        console.error('Erro ao buscar código:', error);
        mostrarMensagem('Erro: ' + error.message, 'error');
        voltarParaScanner();
    }
}

function onScanErro(error) {
    // Ignorar erros de leitura (muito verboso)
}

// ========== BUSCAR POR CÓDIGO DIGITADO ==========

async function buscarPorCodigoDigitado() {
    const input = document.getElementById('input-codigo');
    const codigo = input.value.trim().toUpperCase();
    
    if (!codigo) {
        mostrarMensagem('Digite um código!', 'error');
        return;
    }
    
    // Validar formato básico do código
    const prefixos = {
        'bobina': 'B-',
        'retalho': 'RET-',
        'corte': 'COR-',
        'plano': 'PLA-',
        'localizacao': 'LOC-'
    };
    
    // Detectar tipo pelo prefixo se não estiver selecionado
    let tipoDetectado = tipoAtual;
    
    if (!tipoDetectado) {
        if (codigo.startsWith('BOB-')) tipoDetectado = 'bobina';
        else if (codigo.startsWith('RET-')) tipoDetectado = 'retalho';
        else if (codigo.startsWith('COR-')) tipoDetectado = 'corte';
        else if (codigo.startsWith('PLA-')) tipoDetectado = 'plano';
        else if (codigo.match(/^\d+-[A-Z]+-\d+$/)) tipoDetectado = 'localizacao';
    }
    
    if (!tipoDetectado) {
        mostrarMensagem('Código inválido! Use formato: BOB-0001, RET-0001, COR-0001-PLA-0123, PLA-0001 ou 0001-A-0001', 'error');
        return;
    }
    
    console.log('Buscando código digitado:', codigo, 'Tipo:', tipoDetectado);
    
    // Parar scanner se estiver ativo
    pararScanner();
    
    // ========== LOCALIZAÇÃO: Criação livre, SEM buscar no banco ==========
    if (tipoDetectado === 'localizacao') {
        // Criar dados mock para localização (não precisa buscar no banco)
        dadosAtual = {
            tipo: 'localizacao',
            codigo_locacao: codigo,
            qr_code: codigo,
            corredor: codigo.split('-')[0] || '',
            coluna: codigo.split('-')[1] || '',
            altura: codigo.split('-')[2] || ''
        };
        
        tipoAtual = tipoDetectado;
        
        console.log('✅ Localização criada:', dadosAtual);
        
        // Gerar preview
        gerarPreview();
        
        // Ir para passo de preview
        mostrarPasso('passo-preview');
        
        // Limpar input
        input.value = '';
        
        return; // Não buscar no banco
    }
    
    // ========== OUTROS TIPOS: Buscar no banco ==========
    // Buscar dados do código
    try {
        const response = await fetch(`${API_BASE}/mobile/imprimir/buscar-codigo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo: codigo })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Código não encontrado');
        }
        
        dadosAtual = data.data;
        tipoAtual = tipoDetectado;
        
        // Gerar preview
        gerarPreview();
        
        // Ir para passo de preview
        mostrarPasso('passo-preview');
        
        // Limpar input
        input.value = '';
        
    } catch (error) {
        console.error('Erro ao buscar código:', error);
        mostrarMensagem('Erro: ' + error.message, 'error');
    }
}

// Permitir Enter no input
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('input-codigo');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                buscarPorCodigoDigitado();
            }
        });
        
        // Auto-uppercase E hífen automático
        input.addEventListener('input', (e) => {
            let value = e.target.value.toUpperCase().replace(/-/g, ''); // Remove hífens existentes
            
            // BOB-0001, RET-0001 (formato: XXX-0000)
            if (value.length > 3 && /^[A-Z]{3}[0-9]/.test(value)) {
                value = value.slice(0, 3) + '-' + value.slice(3);
            }
            // COR-2025-00001 (formato: XXX-YYYY-00000)
            else if (value.length > 3 && value.startsWith('COR')) {
                if (value.length <= 7) {
                    // COR-2025
                    value = value.slice(0, 3) + '-' + value.slice(3);
                } else {
                    // COR-2025-00001
                    value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
                }
            }
            // LOCALIZAÇÃO: 0000-X-0000 (números-letra-números)
            // Exemplo: 1234-A-5678 ou 12-B-34
            else if (value.length > 0 && /^[0-9]/.test(value)) {
                // Separar números e letras
                const matches = value.match(/^([0-9]{1,4})([A-Z]?)([0-9]{0,4})$/);
                
                if (matches) {
                    const [, num1, letra, num2] = matches;
                    
                    if (letra && num2) {
                        // Formato completo: 0000-X-0000
                        value = num1 + '-' + letra + '-' + num2;
                    } else if (letra) {
                        // Tem letra mas não tem segundo número: 0000-X
                        value = num1 + '-' + letra;
                    } else {
                        // Só primeiro número (sem hífen ainda)
                        value = num1;
                    }
                } else {
                    // Se não corresponde ao padrão, limita a 4 dígitos iniciais
                    value = value.slice(0, 4);
                }
            }
            
            e.target.value = value;
        });
    }
});

// ========== GERAÇÃO DE PREVIEW ==========

function gerarPreview() {
    const container = document.getElementById('etiqueta-preview');
    
    if (dadosAtual.tipo === 'bobina') {
        gerarPreviewBobina(container);
    } else if (dadosAtual.tipo === 'retalho') {
        gerarPreviewRetalho(container);
    } else if (dadosAtual.tipo === 'corte') {
        gerarPreviewCorte(container);
    } else if (dadosAtual.tipo === 'plano') {
        gerarPreviewPlano(container);
    } else if (dadosAtual.tipo === 'localizacao') {
        gerarPreviewLocalizacao(container);
    }
}

function gerarPreviewBobina(container) {
    // Priorizar metragem_inicial (metragem original da bobina)
    const metragem = parseFloat(dadosAtual.metragem_inicial || dadosAtual.metragem_atual || 0).toFixed(2);
    const largura = dadosAtual.largura_final || dadosAtual.largura_sem_costura || null;
    const bainha = dadosAtual.tipo_bainha || null;
    const placa = dadosAtual.placa || null;
    
    container.innerHTML = `
        <div class="etiqueta-content">
            <div id="qr-code-preview"></div>
            <div class="etiqueta-info">
                <div class="etiqueta-codigo">${dadosAtual.codigo_interno}</div>
                <div class="etiqueta-produto">
                    ${dadosAtual.produto_codigo || ''}<br>
                    ${dadosAtual.nome_cor || ''} ${dadosAtual.gramatura || ''}G
                </div>
                <div class="etiqueta-metragem">${metragem}m</div>
                ${largura ? `<div class="etiqueta-detalhe">Largura: ${largura}m</div>` : ''}
                ${bainha ? `<div class="etiqueta-detalhe">Bainha: ${bainha}</div>` : ''}
                ${placa ? `<div class="etiqueta-detalhe" style="background: #fef3c7; padding: 4px; margin: 4px 0; border-radius: 4px;"><strong>🏷️ PLACA:</strong> ${placa}</div>` : ''}
                <div class="etiqueta-detalhe">${dadosAtual.loja || ''} - ${dadosAtual.fabricante || ''}</div>
            </div>
        </div>
    `;
    
    // Gerar QR Code usando codigo_interno (BOB-0001)
    QRCode.toCanvas(dadosAtual.codigo_interno, {
        width: 150,
        margin: 1
    }, (error, canvas) => {
        if (!error) {
            document.getElementById('qr-code-preview').appendChild(canvas);
        }
    });
}

function gerarPreviewRetalho(container) {
    container.innerHTML = `
        <div class="etiqueta-content">
            <div id="qr-code-preview"></div>
            <div class="etiqueta-info">
                <div class="etiqueta-codigo">${dadosAtual.codigo_retalho}</div>
                <div class="etiqueta-produto">
                    ${dadosAtual.produto_codigo || ''}<br>
                    ${dadosAtual.nome_cor || ''} ${dadosAtual.gramatura || ''}G
                </div>
                <div class="etiqueta-metragem">${parseFloat(dadosAtual.metragem || 0).toFixed(2)}m</div>
                ${dadosAtual.bobina_origem ? `<div class="etiqueta-detalhe">Origem: ${dadosAtual.bobina_origem}</div>` : ''}
            </div>
        </div>
    `;
    
    QRCode.toCanvas(dadosAtual.qr_code || `R-${dadosAtual.id}`, {
        width: 150,
        margin: 1
    }, (error, canvas) => {
        if (!error) {
            document.getElementById('qr-code-preview').appendChild(canvas);
        }
    });
}

function gerarPreviewCorte(container) {
    container.innerHTML = `
        <div class="etiqueta-content">
            <div id="qr-code-preview"></div>
            <div class="etiqueta-info">
                <div class="etiqueta-codigo">${dadosAtual.codigo_corte}</div>
                <div class="etiqueta-produto">
                    ${dadosAtual.produto_codigo || ''}<br>
                    ${dadosAtual.nome_cor || ''} ${dadosAtual.gramatura || ''}G
                </div>
                <div class="etiqueta-metragem">${parseFloat(dadosAtual.metragem_cortada || 0).toFixed(2)}m</div>
                <div class="etiqueta-detalhe">
                    Plano: ${dadosAtual.codigo_plano || ''}<br>
                    ${dadosAtual.cliente || ''} - ${dadosAtual.aviario || ''}
                </div>
            </div>
        </div>
    `;
    
    QRCode.toCanvas(dadosAtual.codigo_corte, {
        width: 150,
        margin: 1
    }, (error, canvas) => {
        if (!error) {
            document.getElementById('qr-code-preview').appendChild(canvas);
        }
    });
}

function gerarPreviewPlano(container) {
    container.innerHTML = `
        <div class="etiqueta-content">
            <div id="qr-code-preview"></div>
            <div class="etiqueta-info">
                <div class="etiqueta-codigo">${dadosAtual.codigo_plano}</div>
                <div class="etiqueta-produto">
                    ${dadosAtual.cliente || ''}<br>
                    ${dadosAtual.aviario || ''}
                </div>
                <div class="etiqueta-detalhe">
                    ${dadosAtual.total_itens || 0} itens<br>
                    Total: ${parseFloat(dadosAtual.metragem_total || 0).toFixed(2)}m
                </div>
            </div>
        </div>
    `;
    
    QRCode.toCanvas(dadosAtual.codigo_plano, {
        width: 150,
        margin: 1
    }, (error, canvas) => {
        if (!error) {
            document.getElementById('qr-code-preview').appendChild(canvas);
        }
    });
}

function gerarPreviewLocalizacao(container) {
    container.innerHTML = `
        <div class="etiqueta-content">
            <div id="qr-code-preview"></div>
            <div class="etiqueta-info">
                <div class="etiqueta-codigo">${dadosAtual.codigo_locacao || dadosAtual.codigo_localizacao}</div>
                <div class="etiqueta-localizacao">
                    Corredor: ${dadosAtual.corredor || 'N/A'}<br>
                    Coluna: ${dadosAtual.coluna || 'N/A'}<br>
                    Altura: ${dadosAtual.altura || 'N/A'}
                </div>
            </div>
        </div>
    `;
    
    // Usar o código digitado para o QR Code
    QRCode.toCanvas(dadosAtual.codigo_locacao || dadosAtual.qr_code || `LOC-${dadosAtual.id}`, {
        width: 150,
        margin: 1
    }, (error, canvas) => {
        if (!error) {
            document.getElementById('qr-code-preview').appendChild(canvas);
        }
    });
}

// ========== IMPRESSÃO ==========

async function imprimirEtiqueta() {
    if (!dadosAtual) return;
    
    // ========== MODO APP NATIVO - BLUETOOTH ==========
    if (isNativeApp && bluetoothPrinter) {
        try {
            // REMOVIDO: mostrarMensagem('Preparando impressão...', 'info');
            
            console.log('🔧 Verificando impressora salva...');
            
            // Verificar se há impressora conectada (nome correto: printer_address)
            const printerAddress = localStorage.getItem('printer_address');
            const printerName = localStorage.getItem('printer_name');
            
            console.log('🔧 Impressora salva:', printerName, printerAddress);
            
            if (!printerAddress) {
                console.warn('⚠️ Nenhuma impressora configurada');
                mostrarMensagem('Configure uma impressora primeiro!', 'error');
                setTimeout(() => {
                    window.location.href = '/mobile/configurar-impressora.html';
                }, 2000);
                return;
            }
            
            console.log('✅ Impressora configurada:', printerName);
            
            // Conectar se não estiver conectado (SEM mostrar mensagem de conexão)
            if (!bluetoothPrinter.isConnected) {
                console.log('🔧 Conectando à impressora...');
                await bluetoothPrinter.connect(printerAddress);
                console.log('✅ Conectado!');
            }
            
            // Imprimir via Bluetooth conforme o tipo
            if (dadosAtual.tipo === 'bobina') {
                await bluetoothPrinter.imprimirBobina({
                    codigo: dadosAtual.codigo_interno,
                    produto: `${dadosAtual.produto_codigo || ''} - ${dadosAtual.nome_cor || ''} ${dadosAtual.gramatura || ''}G`,
                    metragem: parseFloat(dadosAtual.metragem_inicial || dadosAtual.metragem_atual || 0).toFixed(2),
                    largura: dadosAtual.largura_final || dadosAtual.largura_sem_costura || null,
                    bainha: dadosAtual.tipo_bainha || null,
                    placa: dadosAtual.placa || null,
                    detalhes: `${dadosAtual.loja || ''} - ${dadosAtual.fabricante || ''}`
                });
            } else if (dadosAtual.tipo === 'retalho') {
                await bluetoothPrinter.imprimirRetalho({
                    codigo: dadosAtual.codigo_retalho,
                    produto: `${dadosAtual.produto_codigo || ''} - ${dadosAtual.nome_cor || ''} ${dadosAtual.gramatura || ''}G`,
                    metragem: parseFloat(dadosAtual.metragem || 0).toFixed(2),
                    detalhes: `Origem: ${dadosAtual.codigo_bobina_origem || ''}`
                });
            } else if (dadosAtual.tipo === 'corte') {
                await bluetoothPrinter.imprimirCorte({
                    codigo: dadosAtual.codigo_corte,
                    plano: dadosAtual.numero_plano || '',
                    item: dadosAtual.item_descricao || '',
                    metragem: parseFloat(dadosAtual.metragem || 0).toFixed(2),
                    operador: dadosAtual.operador || '',
                    data: dadosAtual.data_corte || ''
                });
            } else if (dadosAtual.tipo === 'localizacao') {
                await bluetoothPrinter.imprimirLocalizacao({
                    codigo: dadosAtual.codigo_locacao,
                    corredor: dadosAtual.corredor || 'N/A',
                    coluna: dadosAtual.coluna || 'N/A',
                    altura: dadosAtual.altura || 'N/A'
                });
            }
            
            mostrarMensagem('✅ Impressão enviada!', 'success');
            
            // Voltar após 2 segundos
            setTimeout(() => {
                voltarParaScanner();
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao imprimir via Bluetooth:', error);
            mostrarMensagem('Erro: ' + error.message, 'error');
        }
        return;
    }
    
    // ========== MODO PWA - IMPRESSÃO NAVEGADOR ==========
    let conteudoImpressao = '';
    
    if (dadosAtual.tipo === 'bobina') {
        conteudoImpressao = gerarHTMLImpressaoBobina();
    } else if (dadosAtual.tipo === 'retalho') {
        conteudoImpressao = gerarHTMLImpressaoRetalho();
    } else if (dadosAtual.tipo === 'corte') {
        conteudoImpressao = gerarHTMLImpressaoCorte();
    } else if (dadosAtual.tipo === 'plano') {
        conteudoImpressao = gerarHTMLImpressaoPlano();
    } else if (dadosAtual.tipo === 'localizacao') {
        conteudoImpressao = gerarHTMLImpressaoLocalizacao();
    }
    
    // Abrir nova janela para impressão
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(conteudoImpressao);
    printWindow.document.close();
}

function gerarHTMLImpressaoBobina() {
    // Usar metragem_inicial (metragem original da bobina)
    const metragem = parseFloat(dadosAtual.metragem_inicial || dadosAtual.metragem_atual || 0).toFixed(2);
    const codigoQR = dadosAtual.codigo_interno; // BOB-0001
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Etiqueta - ${dadosAtual.codigo_interno}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                @media print {
                    @page { 
                        margin: 0; 
                        size: 57mm auto; 
                    }
                    body { 
                        margin: 0; 
                        padding: 0; 
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 5mm;
                    width: 57mm;
                    background: white;
                }
                .qrcode { 
                    margin: 3mm auto; 
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .codigo { font-size: 14px; font-weight: bold; margin-top: 2mm; }
                .produto { font-size: 11px; margin-top: 1mm; }
                .metragem { font-size: 16px; font-weight: bold; margin-top: 2mm; }
                .detalhe { font-size: 10px; margin-top: 1mm; color: #666; }
            </style>
        </head>
        <body>
            <div id="qrcode" class="qrcode"></div>
            <div class="codigo">${dadosAtual.codigo_interno}</div>
            <div class="produto">${dadosAtual.produto_codigo || ''} - ${dadosAtual.nome_cor || ''} ${dadosAtual.gramatura || ''}G</div>
            <div class="metragem">${metragem}m</div>
            ${dadosAtual.largura_final || dadosAtual.largura_sem_costura ? `<div class="detalhe">Largura: ${dadosAtual.largura_final || dadosAtual.largura_sem_costura}m</div>` : ''}
            ${dadosAtual.tipo_bainha ? `<div class="detalhe">Bainha: ${dadosAtual.tipo_bainha}</div>` : ''}
            ${dadosAtual.placa ? `<div class="detalhe" style="background: #fef3c7; padding: 2px; margin: 2px 0;"><strong>🏷️ PLACA:</strong> ${dadosAtual.placa}</div>` : ''}
            <div class="detalhe">${dadosAtual.loja || ''} - ${dadosAtual.fabricante || ''}</div>
            
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
            <script>
                // Gerar QR Code e aguardar completar antes de imprimir
                QRCode.toCanvas('${codigoQR}', {
                    width: 120,
                    margin: 1,
                    errorCorrectionLevel: 'M'
                }, function(error, canvas) {
                    if (error) {
                        console.error('Erro ao gerar QR Code:', error);
                        alert('Erro ao gerar QR Code');
                        return;
                    }
                    
                    // Adicionar canvas ao DOM
                    document.getElementById('qrcode').appendChild(canvas);
                    
                    // Aguardar renderização completa antes de imprimir
                    setTimeout(function() {
                        window.print();
                        // Não fechar automaticamente no mobile para permitir re-impressão
                        // window.close();
                    }, 500);
                });
            </script>
        </body>
        </html>
    `;
}

function gerarHTMLImpressaoRetalho() {
    const codigoQR = dadosAtual.codigo_retalho; // RET-0001
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Etiqueta - ${dadosAtual.codigo_retalho}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                @media print {
                    @page { 
                        margin: 0; 
                        size: 57mm auto; 
                    }
                    body { 
                        margin: 0; 
                        padding: 0; 
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 5mm;
                    width: 57mm;
                    background: white;
                }
                .qrcode { 
                    margin: 3mm auto; 
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .codigo { font-size: 14px; font-weight: bold; margin-top: 2mm; }
                .produto { font-size: 11px; margin-top: 1mm; }
                .metragem { font-size: 16px; font-weight: bold; margin-top: 2mm; }
                .detalhe { font-size: 10px; margin-top: 1mm; color: #666; }
            </style>
        </head>
        <body>
            <div id="qrcode" class="qrcode"></div>
            <div class="codigo">${dadosAtual.codigo_retalho}</div>
            <div class="produto">${dadosAtual.produto_codigo || ''} - ${dadosAtual.nome_cor || ''} ${dadosAtual.gramatura || ''}G</div>
            <div class="metragem">${parseFloat(dadosAtual.metragem || 0).toFixed(2)}m</div>
            ${dadosAtual.bobina_origem ? `<div class="detalhe">Origem: ${dadosAtual.bobina_origem}</div>` : ''}
            
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
            <script>
                QRCode.toCanvas('${codigoQR}', {
                    width: 120,
                    margin: 1,
                    errorCorrectionLevel: 'M'
                }, function(error, canvas) {
                    if (error) {
                        console.error('Erro ao gerar QR Code:', error);
                        alert('Erro ao gerar QR Code');
                        return;
                    }
                    
                    document.getElementById('qrcode').appendChild(canvas);
                    
                    setTimeout(function() {
                        window.print();
                    }, 500);
                });
            </script>
        </body>
        </html>
    `;
}

function gerarHTMLImpressaoCorte() {
    const codigoQR = dadosAtual.codigo_corte; // COR-2025-00001
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Etiqueta - ${dadosAtual.codigo_corte}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                @media print {
                    @page { 
                        margin: 0; 
                        size: 57mm auto; 
                    }
                    body { 
                        margin: 0; 
                        padding: 0; 
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 5mm;
                    width: 57mm;
                    background: white;
                }
                .qrcode { 
                    margin: 3mm auto; 
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .codigo { font-size: 14px; font-weight: bold; margin-top: 2mm; }
                .produto { font-size: 11px; margin-top: 1mm; }
                .metragem { font-size: 16px; font-weight: bold; margin-top: 2mm; }
                .detalhe { font-size: 10px; margin-top: 1mm; color: #666; }
            </style>
        </head>
        <body>
            <div id="qrcode" class="qrcode"></div>
            <div class="codigo">${dadosAtual.codigo_corte}</div>
            <div class="produto">${dadosAtual.produto_codigo || ''} - ${dadosAtual.nome_cor || ''} ${dadosAtual.gramatura || ''}G</div>
            <div class="metragem">${parseFloat(dadosAtual.metragem_cortada || 0).toFixed(2)}m</div>
            <div class="detalhe">
                Plano: ${dadosAtual.codigo_plano || ''}<br>
                ${dadosAtual.cliente || ''} - ${dadosAtual.aviario || ''}
            </div>
            
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
            <script>
                QRCode.toCanvas('${codigoQR}', {
                    width: 120,
                    margin: 1,
                    errorCorrectionLevel: 'M'
                }, function(error, canvas) {
                    if (error) {
                        console.error('Erro ao gerar QR Code:', error);
                        alert('Erro ao gerar QR Code');
                        return;
                    }
                    
                    document.getElementById('qrcode').appendChild(canvas);
                    
                    setTimeout(function() {
                        window.print();
                    }, 500);
                });
            </script>
        </body>
        </html>
    `;
}

function gerarHTMLImpressaoPlano() {
    return `
        <html>
        <head>
            <title>Etiqueta - ${dadosAtual.codigo_plano}</title>
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
                .codigo { font-size: 16px; font-weight: bold; margin-top: 2mm; }
                .cliente { font-size: 12px; margin-top: 2mm; }
                .metragem { font-size: 14px; font-weight: bold; margin-top: 2mm; }
                .detalhe { font-size: 10px; margin-top: 1mm; color: #666; }
            </style>
        </head>
        <body>
            <div id="qrcode" class="qrcode"></div>
            <div class="codigo">${dadosAtual.codigo_plano}</div>
            <div class="cliente">${dadosAtual.cliente || ''}<br>${dadosAtual.aviario || ''}</div>
            <div class="metragem">${dadosAtual.total_itens || 0} itens - ${parseFloat(dadosAtual.metragem_total || 0).toFixed(2)}m</div>
            <div class="detalhe">Status: ${dadosAtual.status || 'Planejamento'}</div>
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
            <script>
                QRCode.toCanvas(document.getElementById('qrcode'), '${dadosAtual.codigo_plano}', {
                    width: 120,
                    margin: 1
                }, function() {
                    window.print();
                    window.close();
                });
            </script>
        </body>
        </html>
    `;
}

function gerarHTMLImpressaoLocalizacao() {
    return `
        <html>
        <head>
            <title>Etiqueta - ${dadosAtual.codigo_localizacao}</title>
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
                .codigo { font-size: 16px; font-weight: bold; margin-top: 2mm; }
                .localizacao { font-size: 12px; margin-top: 2mm; }
                .detalhe { font-size: 10px; margin-top: 1mm; color: #666; }
            </style>
        </head>
        <body>
            <div id="qrcode" class="qrcode"></div>
            <div class="codigo">${dadosAtual.codigo_localizacao}</div>
            <div class="localizacao">
                Corredor: ${dadosAtual.corredor}<br>
                Coluna: ${dadosAtual.coluna}<br>
                Altura: ${dadosAtual.altura}
            </div>
            ${dadosAtual.tipo ? `<div class="detalhe">Tipo: ${dadosAtual.tipo}</div>` : ''}
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
            <script>
                QRCode.toCanvas(document.getElementById('qrcode'), '${dadosAtual.qr_code || `LOC-${dadosAtual.id}`}', {
                    width: 120,
                    margin: 1
                }, function() {
                    window.print();
                    window.close();
                });
            </script>
        </body>
        </html>
    `;
}

// ========== UTILITÁRIOS ==========

function mostrarMensagem(mensagem, tipo = 'info') {
    alert(mensagem); // Simplificado para mobile
}
