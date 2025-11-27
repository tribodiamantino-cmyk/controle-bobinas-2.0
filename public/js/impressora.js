// ===============================================
// SISTEMA DE IMPRESSÃO DE ETIQUETAS
// Elgin L42 PRO Full - 60mm x 28mm
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

// Gerar HTML completo para etiqueta de bobina (60mm x 28mm)
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
                    size: 60mm 28mm;
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
                    width: 60mm;
                    height: 28mm;
                    padding: 2mm 3mm;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    background: white;
                }
                .linha-1 {
                    font-size: 20pt;
                    line-height: 1;
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 1mm;
                }
                .linha-2 {
                    font-size: 11pt;
                    line-height: 1.1;
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5mm 0;
                }
                .linha-3 {
                    font-size: 11pt;
                    line-height: 1.1;
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5mm 0;
                }
                .linha-4 {
                    font-size: 16pt;
                    line-height: 1;
                    text-align: center;
                    border-top: 2px solid #000;
                    padding-top: 1mm;
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
            <div class="linha-1">${idBobina}</div>
            <div class="linha-2">
                <span>PROD: ${produto}</span>
                <span>COR: ${cor}</span>
            </div>
            <div class="linha-3">
                <span>GRAM: ${gramatura}</span>
                <span>LARG: ${largura}</span>
            </div>
            <div class="linha-4">${metragem}m</div>
        </body>
        </html>
    `;
}

// Gerar HTML completo para etiqueta de retalho (60mm x 28mm)
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
                    size: 60mm 28mm;
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
                    width: 60mm;
                    height: 28mm;
                    padding: 2mm 3mm;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    background: white;
                }
                .linha-1 {
                    font-size: 20pt;
                    line-height: 1;
                    text-align: center;
                    border-bottom: 2px solid #000;
                    padding-bottom: 1mm;
                }
                .linha-2 {
                    font-size: 11pt;
                    line-height: 1.1;
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5mm 0;
                }
                .linha-3 {
                    font-size: 11pt;
                    line-height: 1.1;
                    display: flex;
                    justify-content: space-between;
                    padding: 0.5mm 0;
                }
                .linha-4 {
                    font-size: 16pt;
                    line-height: 1;
                    text-align: center;
                    border-top: 2px solid #000;
                    padding-top: 1mm;
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
            <div class="linha-1">${idRetalho}</div>
            <div class="linha-2">
                <span>PROD: ${produto}</span>
                <span>COR: ${cor}</span>
            </div>
            <div class="linha-3">
                <span>GRAM: ${gramatura}</span>
                <span>LARG: ${largura}</span>
            </div>
            <div class="linha-4">${metragem}m</div>
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
