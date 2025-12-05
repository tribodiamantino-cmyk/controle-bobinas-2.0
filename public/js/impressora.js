// ===============================================
// SISTEMA DE IMPRESSÃO DE ETIQUETAS
// Impressora Térmica 57mm - Rolo Contínuo
// ===============================================

// Funções auxiliares para uso no sistema
async function imprimirEtiquetaBobina(bobina) {
    try {
        const htmlEtiqueta = gerarHTMLEtiquetaBobina(bobina);
        abrirJanelaImpressao(htmlEtiqueta);
        return true;
    } catch (error) {
        console.error('Erro ao imprimir etiqueta:', error);
        mostrarNotificacao('Erro ao imprimir: ' + error.message, 'error');
        return false;
    }
}

async function imprimirEtiquetaRetalho(retalho) {
    try {
        const htmlEtiqueta = gerarHTMLEtiquetaRetalho(retalho);
        abrirJanelaImpressao(htmlEtiqueta);
        return true;
    } catch (error) {
        console.error('Erro ao imprimir etiqueta:', error);
        mostrarNotificacao('Erro ao imprimir: ' + error.message, 'error');
        return false;
    }
}

// Gerar HTML completo para etiqueta de bobina (57mm largura, altura contínua)
function gerarHTMLEtiquetaBobina(bobina) {
    const idBobina = bobina.codigo_interno || `BOB-${bobina.id}`;
    const produto = bobina.produto_codigo || '';
    const cor = bobina.nome_cor || '';
    const gramatura = bobina.gramatura || '';
    
    let largura = '';
    if (bobina.tipo_tecido === 'Bando Y' && bobina.largura_maior && bobina.largura_y) {
        largura = `${bobina.largura_maior}+${bobina.largura_y}+${bobina.largura_y}`;
    } else if (bobina.largura_final) {
        largura = `${bobina.largura_final}cm`;
    }
    
    const metragem = parseFloat(bobina.metragem_inicial || bobina.metragem_atual || 0).toFixed(2);
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Etiqueta ${idBobina}</title>
            <style>
                @page {
                    size: 57mm auto;
                    margin: 0;
                }
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Arial', sans-serif;
                    font-weight: bold;
                    width: 57mm;
                    padding: 3mm;
                    background: white;
                }
                .etiqueta {
                    border: 2px solid #000;
                    padding: 2mm;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 2mm;
                    margin-bottom: 2mm;
                }
                .tipo {
                    font-size: 10pt;
                    color: #000;
                }
                .codigo {
                    font-size: 14pt;
                    font-family: 'Courier New', monospace;
                    letter-spacing: 0.5px;
                }
                .metragem-box {
                    text-align: center;
                    background: white;
                    border: 2px solid #000;
                    padding: 2mm;
                    margin: 2mm 0;
                }
                .metragem-label {
                    font-size: 8pt;
                    color: #000;
                }
                .metragem-value {
                    font-size: 18pt;
                    font-family: 'Courier New', monospace;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 9pt;
                    padding: 1mm 0;
                    border-bottom: 1px dotted #000;
                }
                .info-row:last-child {
                    border-bottom: none;
                }
                .info-label {
                    color: #000;
                }
                .info-value {
                    font-weight: bold;
                    text-align: right;
                    max-width: 55%;
                }
                .footer {
                    text-align: center;
                    border-top: 2px solid #000;
                    margin-top: 2mm;
                    padding-top: 1mm;
                    font-size: 7pt;
                    color: #000;
                }
                .cut-line {
                    border: none;
                    border-top: 1px dashed #000;
                    margin-top: 2mm;
                }
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            <div class="etiqueta">
                <div class="header">
                    <div class="tipo">📦 BOBINA</div>
                    <div class="codigo">${idBobina}</div>
                </div>
                
                <div class="metragem-box">
                    <div class="metragem-label">METRAGEM</div>
                    <div class="metragem-value">${metragem}m</div>
                </div>
                
                <div class="info-row">
                    <span class="info-label">PRODUTO:</span>
                    <span class="info-value">${produto}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">COR:</span>
                    <span class="info-value">${cor}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">GRAMATURA:</span>
                    <span class="info-value">${gramatura}g</span>
                </div>
                <div class="info-row">
                    <span class="info-label">LARGURA:</span>
                    <span class="info-value">${largura}</span>
                </div>
                
                <div class="footer">Cortinave & BN</div>
            </div>
            <hr class="cut-line">
        </body>
        </html>
    `;
}

// Gerar HTML completo para etiqueta de retalho (57mm largura, altura contínua)
function gerarHTMLEtiquetaRetalho(retalho) {
    const idRetalho = retalho.codigo_retalho || `RET-${retalho.id}`;
    const produto = retalho.produto_codigo || '';
    const cor = retalho.nome_cor || '';
    const gramatura = retalho.gramatura || '';
    
    let largura = '';
    if (retalho.tipo_tecido === 'Bando Y' && retalho.largura_maior && retalho.largura_y) {
        largura = `${retalho.largura_maior}+${retalho.largura_y}+${retalho.largura_y}`;
    } else if (retalho.largura_final) {
        largura = `${retalho.largura_final}cm`;
    }
    
    const metragem = parseFloat(retalho.metragem || 0).toFixed(2);
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Etiqueta ${idRetalho}</title>
            <style>
                @page {
                    size: 57mm auto;
                    margin: 0;
                }
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Arial', sans-serif;
                    font-weight: bold;
                    width: 57mm;
                    padding: 3mm;
                    background: white;
                }
                .etiqueta {
                    border: 2px solid #000;
                    padding: 2mm;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 2mm;
                    margin-bottom: 2mm;
                }
                .tipo {
                    font-size: 10pt;
                    color: #000;
                }
                .codigo {
                    font-size: 14pt;
                    font-family: 'Courier New', monospace;
                    letter-spacing: 0.5px;
                }
                .metragem-box {
                    text-align: center;
                    background: white;
                    border: 2px solid #000;
                    padding: 2mm;
                    margin: 2mm 0;
                }
                .metragem-label {
                    font-size: 8pt;
                    color: #000;
                }
                .metragem-value {
                    font-size: 18pt;
                    font-family: 'Courier New', monospace;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 9pt;
                    padding: 1mm 0;
                    border-bottom: 1px dotted #000;
                }
                .info-row:last-child {
                    border-bottom: none;
                }
                .info-label {
                    color: #000;
                }
                .info-value {
                    font-weight: bold;
                    text-align: right;
                    max-width: 55%;
                }
                .footer {
                    text-align: center;
                    border-top: 2px solid #000;
                    margin-top: 2mm;
                    padding-top: 1mm;
                    font-size: 7pt;
                    color: #000;
                }
                .cut-line {
                    border: none;
                    border-top: 1px dashed #000;
                    margin-top: 2mm;
                }
                @media print {
                    body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                }
            </style>
        </head>
        <body>
            <div class="etiqueta">
                <div class="header">
                    <div class="tipo">🧵 RETALHO</div>
                    <div class="codigo">${idRetalho}</div>
                </div>
                
                <div class="metragem-box">
                    <div class="metragem-label">METRAGEM</div>
                    <div class="metragem-value">${metragem}m</div>
                </div>
                
                <div class="info-row">
                    <span class="info-label">PRODUTO:</span>
                    <span class="info-value">${produto}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">COR:</span>
                    <span class="info-value">${cor}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">GRAMATURA:</span>
                    <span class="info-value">${gramatura}g</span>
                </div>
                <div class="info-row">
                    <span class="info-label">LARGURA:</span>
                    <span class="info-value">${largura}</span>
                </div>
                
                <div class="footer">Cortinave & BN</div>
            </div>
            <hr class="cut-line">
        </body>
        </html>
    `;
}

// Abrir janela de impressão simples
function abrirJanelaImpressao(htmlContent) {
    const janela = window.open('', '_blank', 'width=400,height=300');
    
    if (!janela) {
        alert('⚠️ Por favor, permita pop-ups para este site para abrir a página de impressão.');
        return;
    }
    
    janela.document.write(htmlContent);
    janela.document.close();
    
    // Aguardar carregar e imprimir automaticamente
    janela.onload = function() {
        setTimeout(() => {
            janela.print();
        }, 250);
    };
}
