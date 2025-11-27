// ========== IMPRESSÃO DE ORDEM DE PRODUÇÃO ==========
async function imprimirOrdemProducao(planoId) {
    try {
        // Buscar detalhes completos do plano
        const API_BASE = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api'
            : 'https://controle-bobinas-20-production.up.railway.app/api';
            
        const response = await fetch(`${API_BASE}/ordens-corte/${planoId}`);
        const data = await response.json();
        
        if (!data.success) {
            showNotification('Erro ao carregar dados da ordem', 'error');
            return;
        }
        
        const plano = data.data;
        gerarPaginaImpressaoOrdem(plano);
        
    } catch (error) {
        console.error('Erro ao imprimir ordem:', error);
        showNotification('Erro ao gerar impressão', 'error');
    }
}

function gerarPaginaImpressaoOrdem(plano) {
    const dataFormatada = new Date(plano.data_criacao).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    const horaFormatada = new Date(plano.data_criacao).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Agrupar itens por produto para melhor visualização
    const itensPorProduto = {};
    plano.itens.forEach(item => {
        const key = `${item.produto_codigo}-${item.nome_cor}-${item.gramatura}`;
        if (!itensPorProduto[key]) {
            itensPorProduto[key] = {
                produto_codigo: item.produto_codigo,
                nome_cor: item.nome_cor,
                gramatura: item.gramatura,
                tipo_tecido: item.tipo_tecido,
                itens: []
            };
        }
        itensPorProduto[key].itens.push(item);
    });
    
    const htmlCompleto = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Ordem de Produção - ${plano.codigo_plano}</title>
            <style>
                @page {
                    size: A4;
                    margin: 15mm;
                }
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: Arial, sans-serif;
                    font-size: 11pt;
                    line-height: 1.4;
                    color: #000;
                }
                
                .header {
                    border-bottom: 3px solid #000;
                    padding-bottom: 10px;
                    margin-bottom: 15px;
                }
                
                .header h1 {
                    font-size: 20pt;
                    margin-bottom: 5px;
                }
                
                .header .info-linha {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 8px;
                    font-size: 10pt;
                }
                
                .section {
                    margin-bottom: 20px;
                }
                
                .section-title {
                    background: #333;
                    color: white;
                    padding: 6px 10px;
                    font-size: 12pt;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-bottom: 15px;
                }
                
                .info-box {
                    border: 1px solid #ccc;
                    padding: 8px;
                }
                
                .info-box label {
                    font-weight: bold;
                    font-size: 9pt;
                    color: #666;
                    display: block;
                    margin-bottom: 3px;
                }
                
                .info-box .valor {
                    font-size: 11pt;
                }
                
                .produto-grupo {
                    border: 2px solid #333;
                    margin-bottom: 15px;
                    page-break-inside: avoid;
                }
                
                .produto-header {
                    background: #f0f0f0;
                    padding: 8px;
                    border-bottom: 1px solid #333;
                    font-weight: bold;
                }
                
                .cortes-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .cortes-table th {
                    background: #e0e0e0;
                    padding: 6px;
                    text-align: left;
                    font-size: 10pt;
                    border-bottom: 1px solid #999;
                }
                
                .cortes-table td {
                    padding: 6px;
                    border-bottom: 1px solid #ddd;
                    font-size: 10pt;
                }
                
                .cortes-table tr:last-child td {
                    border-bottom: none;
                }
                
                .origem-info {
                    font-size: 9pt;
                    color: #444;
                }
                
                .sem-alocacao {
                    color: #d32f2f;
                    font-weight: bold;
                }
                
                .assinatura-section {
                    margin-top: 30px;
                    page-break-inside: avoid;
                }
                
                .assinatura-box {
                    border: 1px solid #333;
                    padding: 15px;
                    margin-bottom: 15px;
                }
                
                .assinatura-box h3 {
                    font-size: 11pt;
                    margin-bottom: 10px;
                    color: #333;
                }
                
                .assinatura-linha {
                    border-top: 1px solid #000;
                    margin-top: 40px;
                    padding-top: 5px;
                    text-align: center;
                    font-size: 10pt;
                }
                
                .localizacao-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                    margin-top: 10px;
                }
                
                .localizacao-item {
                    border: 1px dashed #999;
                    padding: 8px;
                    min-height: 60px;
                }
                
                .localizacao-item label {
                    font-size: 9pt;
                    color: #666;
                    display: block;
                    margin-bottom: 5px;
                }
                
                .localizacao-item .codigo {
                    font-weight: bold;
                    font-size: 10pt;
                    margin-bottom: 3px;
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
            <!-- CABEÇALHO -->
            <div class="header">
                <h1>📋 ORDEM DE PRODUÇÃO</h1>
                <div class="info-linha">
                    <strong>Código: ${plano.codigo_plano}</strong>
                    <span>Data: ${dataFormatada} às ${horaFormatada}</span>
                </div>
            </div>
            
            <!-- INFORMAÇÕES DO PLANO -->
            <div class="section">
                <div class="section-title">📌 Informações do Plano</div>
                <div class="info-grid">
                    <div class="info-box">
                        <label>CLIENTE:</label>
                        <div class="valor">${plano.cliente}</div>
                    </div>
                    <div class="info-box">
                        <label>AVIÁRIO:</label>
                        <div class="valor">${plano.aviario}</div>
                    </div>
                    <div class="info-box">
                        <label>TOTAL DE CORTES:</label>
                        <div class="valor">${plano.total_itens} itens</div>
                    </div>
                    <div class="info-box">
                        <label>METRAGEM TOTAL:</label>
                        <div class="valor">${parseFloat(plano.metragem_total).toFixed(2)} m</div>
                    </div>
                </div>
            </div>
            
            <!-- CORTES POR PRODUTO -->
            <div class="section">
                <div class="section-title">✂️ Cortes a Realizar</div>
                ${Object.values(itensPorProduto).map(grupo => `
                    <div class="produto-grupo">
                        <div class="produto-header">
                            🏷️ ${grupo.produto_codigo} • ${grupo.nome_cor} • ${grupo.gramatura}g/m² • ${grupo.tipo_tecido}
                        </div>
                        <table class="cortes-table">
                            <thead>
                                <tr>
                                    <th style="width: 10%">#</th>
                                    <th style="width: 15%">Metragem</th>
                                    <th style="width: 35%">Origem Alocada</th>
                                    <th style="width: 40%">Observações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${grupo.itens.map((item, idx) => `
                                    <tr>
                                        <td><strong>${idx + 1}</strong></td>
                                        <td><strong>${parseFloat(item.metragem).toFixed(2)} m</strong></td>
                                        <td class="origem-info">
                                            ${item.tipo_origem && item.origem_id 
                                                ? `${item.tipo_origem === 'bobina' ? '🎯 Bobina' : '📐 Retalho'}: ${item.codigo_origem || `ID ${item.origem_id}`}`
                                                : '<span class="sem-alocacao">⚠️ NÃO ALOCADO</span>'}
                                        </td>
                                        <td>${item.observacoes || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `).join('')}
            </div>
            
            <!-- ASSINATURAS E CONTROLE -->
            <div class="assinatura-section">
                <div class="section-title">✅ Controle de Produção</div>
                
                <div class="assinatura-box">
                    <h3>Responsável pela Produção:</h3>
                    <div class="assinatura-linha">Assinatura e Data</div>
                </div>
                
                <div class="assinatura-box">
                    <h3>📍 Localização das Bobinas Finalizadas:</h3>
                    <p style="font-size: 9pt; color: #666; margin-bottom: 10px;">
                        Preencher com a localização onde cada bobina foi armazenada após o corte:
                    </p>
                    <div class="localizacao-grid">
                        ${plano.itens.filter(item => item.tipo_origem === 'bobina').map((item, idx) => `
                            <div class="localizacao-item">
                                <label>Bobina ${idx + 1}:</label>
                                <div class="codigo">${item.codigo_origem || `ID ${item.origem_id}`}</div>
                                <div style="margin-top: 5px; font-size: 9pt;">
                                    Local: _______________
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;
    
    const janela = window.open('', '_blank', 'width=800,height=600');
    
    if (!janela) {
        alert('⚠️ Por favor, permita pop-ups para este site para abrir a página de impressão.');
        return;
    }
    
    janela.document.write(htmlCompleto);
    janela.document.close();
    
    // Aguardar carregar e imprimir automaticamente
    janela.onload = function() {
        setTimeout(() => {
            janela.print();
        }, 500);
    };
}
