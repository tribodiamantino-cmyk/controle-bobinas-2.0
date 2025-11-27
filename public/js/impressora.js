// ===============================================
// SISTEMA DE IMPRESSÃO DE ETIQUETAS
// Elgin L42 PRO Full - 60mm x 30mm
// ===============================================

// Funções auxiliares para uso no sistema
async function imprimirEtiquetaBobina(bobina) {
    try {
        const conteudo = gerarConteudoEtiquetaBobina(bobina);
        abrirPaginaEtiquetas(conteudo);
        return true;
    } catch (error) {
        console.error('Erro ao imprimir etiqueta:', error);
        mostrarNotificacao('Erro ao imprimir: ' + error.message, 'error');
        return false;
    }
}

async function imprimirEtiquetaRetalho(retalho) {
    try {
        const conteudo = gerarConteudoEtiquetaRetalho(retalho);
        abrirPaginaEtiquetas(conteudo);
        return true;
    } catch (error) {
        console.error('Erro ao imprimir etiqueta:', error);
        mostrarNotificacao('Erro ao imprimir: ' + error.message, 'error');
        return false;
    }
}

// Imprimir múltiplas etiquetas de bobinas
async function imprimirEtiquetasBobinas(bobinas) {
    try {
        const etiquetas = bobinas.map(b => gerarConteudoEtiquetaBobina(b));
        abrirPaginaEtiquetas(etiquetas);
        return true;
    } catch (error) {
        console.error('Erro ao imprimir etiquetas:', error);
        mostrarNotificacao('Erro ao imprimir: ' + error.message, 'error');
        return false;
    }
}

// Imprimir múltiplas etiquetas de retalhos
async function imprimirEtiquetasRetalhos(retalhos) {
    try {
        const etiquetas = retalhos.map(r => gerarConteudoEtiquetaRetalho(r));
        abrirPaginaEtiquetas(etiquetas);
        return true;
    } catch (error) {
        console.error('Erro ao imprimir etiquetas:', error);
        mostrarNotificacao('Erro ao imprimir: ' + error.message, 'error');
        return false;
    }
}

// Gerar HTML para conteúdo da etiqueta de bobina (só o conteúdo, sem página completa)
function gerarConteudoEtiquetaBobina(bobina) {
    const idBobina = bobina.codigo_interno || `BOB-${bobina.id}`;
    const linhaProduto = `${bobina.produto_codigo} • ${bobina.nome_cor || ''}`;
    const gramatura = bobina.gramatura || '';
    
    let largura = '';
    if (bobina.tipo_tecido === 'Bando Y' && bobina.largura_maior && bobina.largura_y) {
        largura = `${bobina.largura_maior}+${bobina.largura_y}+${bobina.largura_y}cm`;
    } else if (bobina.largura_final) {
        largura = `L: ${bobina.largura_final}cm`;
    }
    
    const metragem = parseFloat(bobina.metragem_inicial || bobina.metragem_atual || 0).toFixed(2);
    
    return `
        <div class="linha-1">${idBobina}</div>
        <div class="linha-2">${linhaProduto}</div>
        <div class="linha-3">${gramatura} • ${largura}</div>
        <div class="linha-4">METRAGEM: ${metragem}m</div>
    `;
}

// Gerar HTML para conteúdo da etiqueta de retalho (só o conteúdo, sem página completa)
function gerarConteudoEtiquetaRetalho(retalho) {
    const idRetalho = retalho.codigo_retalho || `RET-${retalho.id}`;
    const linhaProduto = `${retalho.produto_codigo} • ${retalho.nome_cor || ''}`;
    const gramatura = retalho.gramatura || '';
    
    let largura = '';
    if (retalho.tipo_tecido === 'Bando Y' && retalho.largura_maior && retalho.largura_y) {
        largura = `${retalho.largura_maior}+${retalho.largura_y}+${retalho.largura_y}cm`;
    } else if (retalho.largura_final) {
        largura = `L: ${retalho.largura_final}cm`;
    }
    
    const metragem = parseFloat(retalho.metragem || 0).toFixed(2);
    
    return `
        <div class="linha-1">${idRetalho}</div>
        <div class="linha-2">${linhaProduto}</div>
        <div class="linha-3">${gramatura} • ${largura}</div>
        <div class="linha-4">METRAGEM: ${metragem}m</div>
    `;
}

// Abrir página de visualização de etiquetas
function abrirPaginaEtiquetas(etiquetas) {
    // etiquetas pode ser um array ou objeto único
    const listaEtiquetas = Array.isArray(etiquetas) ? etiquetas : [etiquetas];
    
    const htmlCompleto = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Impressão de Etiquetas</title>
            <style>
                /* Estilos para visualização na tela */
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: Arial, sans-serif;
                    background: #f5f5f5;
                    padding: 20px;
                }
                
                .controles {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .controles h2 {
                    color: #333;
                    font-size: 20px;
                }
                
                .controles .info {
                    color: #666;
                    font-size: 14px;
                }
                
                .btn-container {
                    display: flex;
                    gap: 10px;
                }
                
                button {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 6px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                
                .btn-imprimir {
                    background: #4CAF50;
                    color: white;
                }
                
                .btn-imprimir:hover {
                    background: #45a049;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
                }
                
                .btn-cancelar {
                    background: #f44336;
                    color: white;
                }
                
                .btn-cancelar:hover {
                    background: #da190b;
                }
                
                .preview-container {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 20px;
                }
                
                .etiqueta-preview {
                    background: white;
                    border: 2px dashed #ccc;
                    border-radius: 8px;
                    padding: 15px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .etiqueta-preview h3 {
                    color: #666;
                    font-size: 12px;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .etiqueta-conteudo {
                    background: #fafafa;
                    padding: 10px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                }
                
                .etiqueta-conteudo .linha-1 {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 8px;
                    color: #000;
                }
                
                .etiqueta-conteudo .linha-2,
                .etiqueta-conteudo .linha-3 {
                    font-size: 12px;
                    margin-bottom: 6px;
                    color: #333;
                }
                
                .etiqueta-conteudo .linha-4 {
                    font-size: 14px;
                    font-weight: bold;
                    margin-top: 8px;
                    color: #000;
                }
                
                /* Estilos para impressão */
                @media print {
                    body {
                        background: white;
                        padding: 0;
                    }
                    
                    .controles {
                        display: none !important;
                    }
                    
                    .preview-container {
                        display: block;
                    }
                    
                    .etiqueta-preview {
                        page-break-inside: avoid;
                        page-break-after: always;
                        border: none;
                        box-shadow: none;
                        padding: 0;
                        margin: 0;
                    }
                    
                    .etiqueta-preview h3 {
                        display: none;
                    }
                    
                    .etiqueta-conteudo {
                        background: white;
                        padding: 2mm;
                        width: 60mm;
                        height: 30mm;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                    }
                    
                    @page {
                        size: 60mm 30mm;
                        margin: 0;
                    }
                }
            </style>
        </head>
        <body>
            <div class="controles">
                <div>
                    <h2>📄 Visualização de Etiquetas</h2>
                    <p class="info">${listaEtiquetas.length} etiqueta(s) pronta(s) para impressão</p>
                </div>
                <div class="btn-container">
                    <button class="btn-cancelar" onclick="window.close()">✕ Cancelar</button>
                    <button class="btn-imprimir" onclick="window.print()">🖨️ Imprimir Etiquetas</button>
                </div>
            </div>
            
            <div class="preview-container">
                ${listaEtiquetas.map((etiqueta, index) => `
                    <div class="etiqueta-preview">
                        <h3>Etiqueta ${index + 1} de ${listaEtiquetas.length}</h3>
                        <div class="etiqueta-conteudo">
                            ${etiqueta}
                        </div>
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `;
    
    const janela = window.open('', '_blank', 'width=1000,height=700');
    janela.document.write(htmlCompleto);
    janela.document.close();
}

// Preview da etiqueta (mostra como vai ficar)
function mostrarPreviewEtiqueta(tipo, dados) {
    let html = '<div style="font-family: monospace; border: 2px dashed #ccc; padding: 10px; background: white; max-width: 300px;">';
    
    if (tipo === 'bobina') {
        const idBobina = dados.codigo || `BOB-${dados.id}`;
        const linhaProduto = `${dados.produto_codigo} • ${dados.nome_cor || ''}`;
        const gramatura = dados.gramatura || '';
        
        let largura = '';
        if (dados.tipo_tecido === 'Bando Y' && dados.largura_maior && dados.largura_y) {
            largura = `${dados.largura_maior}+${dados.largura_y}+${dados.largura_y}cm`;
        } else if (dados.largura_final) {
            largura = `L: ${dados.largura_final}cm`;
        }
        
        const metragem = parseFloat(dados.metragem || 0).toFixed(2);
        
        html += `
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${idBobina}</div>
            <div style="font-size: 14px; margin-bottom: 3px;">${linhaProduto}</div>
            <div style="font-size: 14px; margin-bottom: 3px;">${gramatura} • ${largura}</div>
            <div style="font-size: 16px; font-weight: bold;">METRAGEM: ${metragem}m</div>
        `;
        
    } else if (tipo === 'retalho') {
        const idRetalho = dados.codigo || `RET-${dados.id}`;
        const linhaProduto = `${dados.produto_codigo} • ${dados.nome_cor || ''}`;
        const gramatura = dados.gramatura || '';
        
        let largura = '';
        if (dados.tipo_tecido === 'Bando Y' && dados.largura_maior && dados.largura_y) {
            largura = `${dados.largura_maior}+${dados.largura_y}+${dados.largura_y}cm`;
        } else if (dados.largura_final) {
            largura = `L: ${dados.largura_final}cm`;
        }
        
        const metragem = parseFloat(dados.metragem || 0).toFixed(2);
        
        html += `
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${idRetalho}</div>
            <div style="font-size: 14px; margin-bottom: 3px;">${linhaProduto}</div>
            <div style="font-size: 14px; margin-bottom: 3px;">${gramatura} • ${largura}</div>
            <div style="font-size: 16px; font-weight: bold;">METRAGEM: ${metragem}m</div>
        `;
    }
    
    html += '</div>';
    return html;
}
