const API_BASE = '/api';
let tipoAtual = null;
let dadosAtual = null;
let html5QrCode = null;

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
    
    // Ir para passo de scanner
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
        'bobina': 'B-',
        'retalho': 'R-',
        'corte': 'COR-',
        'localizacao': 'LOC-'
    };
    
    if (!decodedText.startsWith(prefixos[tipoAtual])) {
        mostrarMensagem(`Código inválido! Escaneie um código ${prefixos[tipoAtual]}`, 'error');
        return;
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

// ========== GERAÇÃO DE PREVIEW ==========

function gerarPreview() {
    const container = document.getElementById('etiqueta-preview');
    
    if (dadosAtual.tipo === 'bobina') {
        gerarPreviewBobina(container);
    } else if (dadosAtual.tipo === 'retalho') {
        gerarPreviewRetalho(container);
    } else if (dadosAtual.tipo === 'corte') {
        gerarPreviewCorte(container);
    } else if (dadosAtual.tipo === 'localizacao') {
        gerarPreviewLocalizacao(container);
    }
}

function gerarPreviewBobina(container) {
    container.innerHTML = `
        <div class="etiqueta-content">
            <div id="qr-code-preview"></div>
            <div class="etiqueta-info">
                <div class="etiqueta-codigo">${dadosAtual.codigo_interno}</div>
                <div class="etiqueta-produto">
                    ${dadosAtual.produto_codigo || ''}<br>
                    ${dadosAtual.nome_cor || ''} ${dadosAtual.gramatura || ''}g/m²
                </div>
                <div class="etiqueta-metragem">${parseFloat(dadosAtual.metragem_atual || 0).toFixed(2)}m</div>
                <div class="etiqueta-detalhe">${dadosAtual.loja || ''} - ${dadosAtual.fabricante || ''}</div>
            </div>
        </div>
    `;
    
    // Gerar QR Code
    QRCode.toCanvas(dadosAtual.qr_code || `B-${dadosAtual.id}`, {
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
                    ${dadosAtual.nome_cor || ''} ${dadosAtual.gramatura || ''}g/m²
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
                    ${dadosAtual.nome_cor || ''} ${dadosAtual.gramatura || ''}g/m²
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

function gerarPreviewLocalizacao(container) {
    container.innerHTML = `
        <div class="etiqueta-content">
            <div id="qr-code-preview"></div>
            <div class="etiqueta-info">
                <div class="etiqueta-codigo">${dadosAtual.codigo_localizacao}</div>
                <div class="etiqueta-localizacao">
                    Corredor: ${dadosAtual.corredor}<br>
                    Coluna: ${dadosAtual.coluna}<br>
                    Altura: ${dadosAtual.altura}
                </div>
                ${dadosAtual.tipo ? `<div class="etiqueta-detalhe">Tipo: ${dadosAtual.tipo}</div>` : ''}
            </div>
        </div>
    `;
    
    QRCode.toCanvas(dadosAtual.qr_code || `LOC-${dadosAtual.id}`, {
        width: 150,
        margin: 1
    }, (error, canvas) => {
        if (!error) {
            document.getElementById('qr-code-preview').appendChild(canvas);
        }
    });
}

// ========== IMPRESSÃO ==========

function imprimirEtiqueta() {
    if (!dadosAtual) return;
    
    const printWindow = window.open('', '', 'width=400,height=600');
    
    let conteudoImpressao = '';
    
    if (dadosAtual.tipo === 'bobina') {
        conteudoImpressao = gerarHTMLImpressaoBobina();
    } else if (dadosAtual.tipo === 'retalho') {
        conteudoImpressao = gerarHTMLImpressaoRetalho();
    } else if (dadosAtual.tipo === 'corte') {
        conteudoImpressao = gerarHTMLImpressaoCorte();
    } else if (dadosAtual.tipo === 'localizacao') {
        conteudoImpressao = gerarHTMLImpressaoLocalizacao();
    }
    
    printWindow.document.write(conteudoImpressao);
    printWindow.document.close();
}

function gerarHTMLImpressaoBobina() {
    return `
        <html>
        <head>
            <title>Etiqueta - ${dadosAtual.codigo_interno}</title>
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
                .detalhe { font-size: 10px; margin-top: 1mm; color: #666; }
            </style>
        </head>
        <body>
            <div id="qrcode" class="qrcode"></div>
            <div class="codigo">${dadosAtual.codigo_interno}</div>
            <div class="produto">${dadosAtual.produto_codigo || ''} - ${dadosAtual.nome_cor || ''} ${dadosAtual.gramatura || ''}g/m²</div>
            <div class="metragem">${parseFloat(dadosAtual.metragem_atual || 0).toFixed(2)}m</div>
            <div class="detalhe">${dadosAtual.loja || ''} - ${dadosAtual.fabricante || ''}</div>
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
            <script>
                QRCode.toCanvas(document.getElementById('qrcode'), '${dadosAtual.qr_code || `B-${dadosAtual.id}`}', {
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

function gerarHTMLImpressaoRetalho() {
    return `
        <html>
        <head>
            <title>Etiqueta - ${dadosAtual.codigo_retalho}</title>
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
                .detalhe { font-size: 10px; margin-top: 1mm; color: #666; }
            </style>
        </head>
        <body>
            <div id="qrcode" class="qrcode"></div>
            <div class="codigo">${dadosAtual.codigo_retalho}</div>
            <div class="produto">${dadosAtual.produto_codigo || ''} - ${dadosAtual.nome_cor || ''} ${dadosAtual.gramatura || ''}g/m²</div>
            <div class="metragem">${parseFloat(dadosAtual.metragem || 0).toFixed(2)}m</div>
            ${dadosAtual.bobina_origem ? `<div class="detalhe">Origem: ${dadosAtual.bobina_origem}</div>` : ''}
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
            <script>
                QRCode.toCanvas(document.getElementById('qrcode'), '${dadosAtual.qr_code || `R-${dadosAtual.id}`}', {
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

function gerarHTMLImpressaoCorte() {
    return `
        <html>
        <head>
            <title>Etiqueta - ${dadosAtual.codigo_corte}</title>
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
                .detalhe { font-size: 10px; margin-top: 1mm; color: #666; }
            </style>
        </head>
        <body>
            <div id="qrcode" class="qrcode"></div>
            <div class="codigo">${dadosAtual.codigo_corte}</div>
            <div class="produto">${dadosAtual.produto_codigo || ''} - ${dadosAtual.nome_cor || ''} ${dadosAtual.gramatura || ''}g/m²</div>
            <div class="metragem">${parseFloat(dadosAtual.metragem_cortada || 0).toFixed(2)}m</div>
            <div class="detalhe">
                Plano: ${dadosAtual.codigo_plano || ''}<br>
                ${dadosAtual.cliente || ''} - ${dadosAtual.aviario || ''}
            </div>
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
            <script>
                QRCode.toCanvas(document.getElementById('qrcode'), '${dadosAtual.codigo_corte}', {
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
