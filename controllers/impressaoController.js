/**
 * Controller: Fila de Impressão de Etiquetas
 * 
 * Gerencia a fila de impressão, permitindo:
 * - Adicionar etiquetas à fila
 * - Listar pendentes por loja
 * - Marcar como impressa
 * - Gerar preview da etiqueta
 */

const db = require('../config/database');

/**
 * Adicionar etiqueta à fila de impressão
 * POST /api/impressao/adicionar
 */
const adicionar = async (req, res) => {
    try {
        const { 
            tipo_etiqueta, 
            entidade_id, 
            quantidade = 1,
            prioridade = 5,
            solicitado_por = null
        } = req.body;

        // Validações
        if (!tipo_etiqueta || !entidade_id) {
            return res.json({ 
                success: false, 
                error: 'Tipo de etiqueta e ID da entidade são obrigatórios' 
            });
        }

        const tiposValidos = ['bobina', 'retalho', 'corte', 'locacao'];
        if (!tiposValidos.includes(tipo_etiqueta)) {
            return res.json({ 
                success: false, 
                error: `Tipo inválido. Usar: ${tiposValidos.join(', ')}` 
            });
        }

        // Buscar dados da entidade para montar a etiqueta
        const dadosEtiqueta = await buscarDadosEtiqueta(tipo_etiqueta, entidade_id);
        
        if (!dadosEtiqueta) {
            return res.json({ 
                success: false, 
                error: `${tipo_etiqueta} com ID ${entidade_id} não encontrado` 
            });
        }

        // Converter loja para formato da fila_impressao (PLA/CIA)
        const lojaConvertida = converterLojaParaFila(dadosEtiqueta.loja);

        // Inserir na fila
        const [result] = await db.query(`
            INSERT INTO fila_impressao 
            (tipo_etiqueta, entidade_id, dados_etiqueta, codigo_etiqueta, quantidade, prioridade, loja, solicitado_por)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            tipo_etiqueta,
            entidade_id,
            JSON.stringify(dadosEtiqueta),
            dadosEtiqueta.codigo,
            quantidade,
            prioridade,
            lojaConvertida,
            solicitado_por
        ]);

        console.log(`✅ Etiqueta adicionada à fila: ${dadosEtiqueta.codigo} (${quantidade}x)`);

        res.json({
            success: true,
            data: {
                id: result.insertId,
                codigo: dadosEtiqueta.codigo,
                tipo: tipo_etiqueta,
                quantidade,
                dados: dadosEtiqueta
            }
        });

    } catch (error) {
        console.error('❌ Erro ao adicionar à fila:', error);
        res.json({ success: false, error: error.message });
    }
};

/**
 * Listar etiquetas pendentes
 * GET /api/impressao/pendentes
 * Query params: ?loja=PLA ou ?loja=CIA
 */
const listarPendentes = async (req, res) => {
    try {
        const { loja } = req.query;

        let sql = `
            SELECT 
                id,
                tipo_etiqueta,
                entidade_id,
                codigo_etiqueta,
                dados_etiqueta,
                quantidade,
                prioridade,
                loja,
                solicitado_por,
                created_at
            FROM fila_impressao
            WHERE status = 'pendente'
        `;
        const params = [];

        if (loja && ['PLA', 'CIA'].includes(loja)) {
            sql += ' AND loja = ?';
            params.push(loja);
        }

        sql += ' ORDER BY prioridade ASC, created_at ASC';

        const [rows] = await db.query(sql, params);

        // Parse JSON dos dados
        const etiquetas = rows.map(row => ({
            ...row,
            dados_etiqueta: typeof row.dados_etiqueta === 'string' 
                ? JSON.parse(row.dados_etiqueta) 
                : row.dados_etiqueta
        }));

        res.json({
            success: true,
            data: etiquetas,
            total: etiquetas.length
        });

    } catch (error) {
        console.error('❌ Erro ao listar pendentes:', error);
        res.json({ success: false, error: error.message });
    }
};

/**
 * Marcar etiqueta como impressa
 * PUT /api/impressao/:id/impressa
 */
const marcarImpressa = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(`
            UPDATE fila_impressao 
            SET status = 'impressa', impresso_em = NOW()
            WHERE id = ? AND status = 'pendente'
        `, [id]);

        if (result.affectedRows === 0) {
            return res.json({ 
                success: false, 
                error: 'Etiqueta não encontrada ou já processada' 
            });
        }

        console.log(`✅ Etiqueta #${id} marcada como impressa`);

        res.json({ success: true, message: 'Etiqueta marcada como impressa' });

    } catch (error) {
        console.error('❌ Erro ao marcar impressa:', error);
        res.json({ success: false, error: error.message });
    }
};

/**
 * Marcar múltiplas etiquetas como impressas
 * PUT /api/impressao/impressas
 * Body: { ids: [1, 2, 3] }
 */
const marcarMultiplasImpressas = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.json({ 
                success: false, 
                error: 'Array de IDs é obrigatório' 
            });
        }

        const placeholders = ids.map(() => '?').join(',');
        const [result] = await db.query(`
            UPDATE fila_impressao 
            SET status = 'impressa', impresso_em = NOW()
            WHERE id IN (${placeholders}) AND status = 'pendente'
        `, ids);

        console.log(`✅ ${result.affectedRows} etiquetas marcadas como impressas`);

        res.json({ 
            success: true, 
            message: `${result.affectedRows} etiquetas marcadas como impressas` 
        });

    } catch (error) {
        console.error('❌ Erro ao marcar múltiplas:', error);
        res.json({ success: false, error: error.message });
    }
};

/**
 * Cancelar etiqueta da fila
 * PUT /api/impressao/:id/cancelar
 */
const cancelar = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(`
            UPDATE fila_impressao 
            SET status = 'cancelada'
            WHERE id = ? AND status = 'pendente'
        `, [id]);

        if (result.affectedRows === 0) {
            return res.json({ 
                success: false, 
                error: 'Etiqueta não encontrada ou já processada' 
            });
        }

        console.log(`⚠️ Etiqueta #${id} cancelada`);

        res.json({ success: true, message: 'Etiqueta cancelada' });

    } catch (error) {
        console.error('❌ Erro ao cancelar:', error);
        res.json({ success: false, error: error.message });
    }
};

/**
 * Obter dados de uma etiqueta específica
 * GET /api/impressao/:id
 */
const obterEtiqueta = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT * FROM fila_impressao WHERE id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.json({ 
                success: false, 
                error: 'Etiqueta não encontrada' 
            });
        }

        const etiqueta = rows[0];
        etiqueta.dados_etiqueta = typeof etiqueta.dados_etiqueta === 'string'
            ? JSON.parse(etiqueta.dados_etiqueta)
            : etiqueta.dados_etiqueta;

        res.json({ success: true, data: etiqueta });

    } catch (error) {
        console.error('❌ Erro ao obter etiqueta:', error);
        res.json({ success: false, error: error.message });
    }
};

/**
 * Histórico de impressões (últimas 100)
 * GET /api/impressao/historico
 */
const historico = async (req, res) => {
    try {
        const { loja, status } = req.query;

        let sql = `
            SELECT 
                id,
                tipo_etiqueta,
                codigo_etiqueta,
                quantidade,
                loja,
                status,
                created_at,
                impresso_em
            FROM fila_impressao
        `;
        const params = [];
        const conditions = [];

        // Filtrar por status se especificado
        if (status && ['pendente', 'impressa', 'cancelada'].includes(status)) {
            conditions.push('status = ?');
            params.push(status);
        }

        if (loja && ['PLA', 'CIA'].includes(loja)) {
            conditions.push('loja = ?');
            params.push(loja);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' ORDER BY created_at DESC LIMIT 100';

        const [rows] = await db.query(sql, params);

        res.json({
            success: true,
            data: rows,
            total: rows.length
        });

    } catch (error) {
        console.error('❌ Erro ao buscar histórico:', error);
        res.json({ success: false, error: error.message });
    }
};

/**
 * Estatísticas da fila
 * GET /api/impressao/stats
 */
const estatisticas = async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT 
                status,
                loja,
                COUNT(*) as total,
                SUM(quantidade) as qtd_etiquetas
            FROM fila_impressao
            GROUP BY status, loja
        `);

        const [hoje] = await db.query(`
            SELECT 
                COUNT(*) as impressas_hoje,
                SUM(quantidade) as qtd_hoje
            FROM fila_impressao
            WHERE status = 'impressa' 
            AND DATE(impresso_em) = CURDATE()
        `);

        res.json({
            success: true,
            data: {
                por_status_loja: stats,
                hoje: hoje[0]
            }
        });

    } catch (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        res.json({ success: false, error: error.message });
    }
};

/**
 * Preview de etiqueta (sem adicionar à fila)
 * GET /api/impressao/preview/:tipo/:id
 */
const preview = async (req, res) => {
    try {
        const { tipo, id } = req.params;

        const tiposValidos = ['bobina', 'retalho', 'corte', 'locacao'];
        if (!tiposValidos.includes(tipo)) {
            return res.json({ 
                success: false, 
                error: `Tipo inválido. Usar: ${tiposValidos.join(', ')}` 
            });
        }

        const dados = await buscarDadosEtiqueta(tipo, id);
        
        if (!dados) {
            return res.json({ 
                success: false, 
                error: `${tipo} com ID ${id} não encontrado` 
            });
        }

        res.json({ success: true, data: dados });

    } catch (error) {
        console.error('❌ Erro ao gerar preview:', error);
        res.json({ success: false, error: error.message });
    }
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Busca dados formatados para etiqueta baseado no tipo
 */
async function buscarDadosEtiqueta(tipo, id) {
    switch (tipo) {
        case 'bobina':
            return await buscarDadosBobina(id);
        case 'retalho':
            return await buscarDadosRetalho(id);
        case 'corte':
            return await buscarDadosCorte(id);
        case 'locacao':
            return await buscarDadosLocacao(id);
        default:
            return null;
    }
}

/**
 * Dados para etiqueta de Bobina
 */
async function buscarDadosBobina(id) {
    const [rows] = await db.query(`
        SELECT 
            b.id,
            b.codigo_interno,
            b.metragem_atual,
            p.fabricante,
            b.placa,
            b.loja,
            p.codigo as produto_codigo,
            p.tipo_tecido,
            p.largura_final as largura,
            p.tipo_bainha as bainha,
            p.largura_maior,
            p.largura_y,
            c.nome_cor as cores,
            g.gramatura
        FROM bobinas b
        LEFT JOIN produtos p ON b.produto_id = p.id
        LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
        LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
        WHERE b.id = ?
    `, [id]);

    if (rows.length === 0) return null;

    const b = rows[0];
    
    // ✅ USAR O CÓDIGO DO BANCO - NUNCA GERAR NA ETIQUETA
    // O código no banco é a fonte da verdade
    const codigo = b.codigo_interno;
    
    // Extrair loja do código para uso na fila de impressão
    const lojaPrefix = converterLojaParaFila(b.loja);

    // Linha do produto
    let linhaProduto;
    const isBandoY = b.tipo_tecido === 'Bando Y' && b.largura_maior && b.largura_y;
    
    if (isBandoY) {
        // Bando Y: Cor(es) LMxLYxLYcm Gramatura
        linhaProduto = `${b.cores || 'S/C'} ${b.largura_maior}x${b.largura_y}x${b.largura_y}cm ${b.gramatura || ''}`;
    } else {
        // Normal: Cor(es) Largura Bainha Gramatura
        linhaProduto = `${b.cores || 'S/C'} ${b.largura || ''}cm ${b.bainha || ''} ${b.gramatura || ''}`;
    }

    // Linha de detalhes: Fabricante | Placa? | Metragem
    let linhaDetalhes;
    if (b.placa) {
        linhaDetalhes = `${b.fabricante || 'S/F'} | ${b.placa} | ${formatarMetragem(b.metragem_atual)}`;
    } else {
        linhaDetalhes = `${b.fabricante || 'S/F'} | ${formatarMetragem(b.metragem_atual)}`;
    }

    return {
        tipo: 'bobina',
        codigo,
        loja: lojaPrefix,
        linha1: codigo,
        linha2_barcode: codigo,
        linha3: linhaProduto.trim(),
        linha4: linhaDetalhes,
        // Dados brutos para referência
        raw: {
            id: b.id,
            metragem: b.metragem_atual,
            fabricante: b.fabricante,
            placa: b.placa,
            produto: b.produto_codigo,
            cores: b.cores,
            largura: b.largura,
            gramatura: b.gramatura,
            bainha: b.bainha,
            tipo_tecido: b.tipo_tecido,
            largura_maior: b.largura_maior,
            largura_y: b.largura_y
        }
    };
}

/**
 * Dados para etiqueta de Retalho
 */
async function buscarDadosRetalho(id) {
    const [rows] = await db.query(`
        SELECT 
            r.id,
            r.codigo_retalho,
            r.metragem,
            p.fabricante,
            p.loja,
            p.codigo as produto_codigo,
            p.tipo_tecido,
            p.largura_final as largura,
            p.tipo_bainha as bainha,
            p.largura_maior,
            p.largura_y,
            c.nome_cor as cores,
            g.gramatura
        FROM retalhos r
        LEFT JOIN produtos p ON r.produto_id = p.id
        LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
        LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
        WHERE r.id = ?
    `, [id]);

    if (rows.length === 0) return null;

    const r = rows[0];
    
    // ✅ USAR O CÓDIGO DO BANCO - NUNCA GERAR NA ETIQUETA
    // O código no banco é a fonte da verdade
    const codigo = r.codigo_retalho;
    
    // Extrair loja do código para uso na fila de impressão
    const lojaPrefix = converterLojaParaFila(r.loja);

    // Linha do produto (herdada da bobina)
    let linhaProduto;
    const isBandoY = r.tipo_tecido === 'Bando Y' && r.largura_maior && r.largura_y;
    
    if (isBandoY) {
        linhaProduto = `${r.cores || 'S/C'} ${r.largura_maior}x${r.largura_y}x${r.largura_y}cm ${r.gramatura || ''}`;
    } else {
        linhaProduto = `${r.cores || 'S/C'} ${r.largura || ''}cm ${r.bainha || ''} ${r.gramatura || ''}`;
    }

    // Retalho não tem placa, só fabricante e metragem
    const linhaDetalhes = `${r.fabricante || 'S/F'} | ${formatarMetragem(r.metragem)}`;

    return {
        tipo: 'retalho',
        codigo,
        loja: lojaPrefix,
        linha1: codigo,
        linha2_barcode: codigo,
        linha3: linhaProduto.trim(),
        linha4: linhaDetalhes,
        raw: {
            id: r.id,
            metragem: r.metragem,
            fabricante: r.fabricante,
            produto: r.produto_codigo,
            cores: r.cores,
            largura: r.largura,
            gramatura: r.gramatura
        }
    };
}

/**
 * Dados para etiqueta de Corte
 */
async function buscarDadosCorte(id) {
    const [rows] = await db.query(`
        SELECT 
            cr.id,
            cr.codigo_corte,
            cr.metragem_cortada,
            cr.created_at,
            ipc.metragem as metragem_solicitada,
            pc.codigo_plano as plano_codigo,
            pc.cliente,
            pc.obra,
            p.codigo as produto_codigo,
            p.largura_final as largura,
            g.gramatura,
            pc.loja
        FROM cortes_realizados cr
        LEFT JOIN itens_plano_corte ipc ON cr.item_plano_id = ipc.id
        LEFT JOIN planos_corte pc ON ipc.plano_corte_id = pc.id
        LEFT JOIN produtos p ON ipc.produto_id = p.id
        LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
        WHERE cr.id = ?
    `, [id]);

    if (rows.length === 0) return null;

    const c = rows[0];
    
    // ✅ USAR O CÓDIGO DO BANCO - NUNCA GERAR NA ETIQUETA
    // O campo codigo_corte é a fonte da verdade (formato: COR-YYYY-XXXXX)
    const codigo = c.codigo_corte;
    
    // Extrair loja para uso na fila de impressão
    const lojaPrefix = converterLojaParaFila(c.loja);

    // Linha 3: Produto resumido
    const linhaProduto = `${c.produto_codigo || 'Produto'} ${c.largura || ''}cm`;

    // Linha 4: Cliente | Obra | Metragem
    let linhaDetalhes = `${c.cliente || 'Cliente'} | ${c.obra || 'Obra'}`;
    linhaDetalhes += ` | ${formatarMetragem(c.metragem_cortada)}`;

    return {
        tipo: 'corte',
        codigo,
        loja: lojaPrefix,
        linha1: codigo,
        linha2_barcode: codigo,
        linha3: linhaProduto,
        linha4: linhaDetalhes,
        raw: {
            id: c.id,
            plano: c.plano_codigo,
            cliente: c.cliente,
            obra: c.obra,
            metragem: c.metragem_cortada,
            produto: c.produto_codigo
        }
    };
}

/**
 * Dados para etiqueta de Locação
 * Layout simplificado: só código + barcode grande
 */
async function buscarDadosLocacao(id) {
    const [rows] = await db.query(`
        SELECT 
            id,
            codigo,
            corredor,
            coluna,
            andar,
            descricao,
            loja
        FROM locacoes
        WHERE id = ?
    `, [id]);

    if (rows.length === 0) return null;

    const l = rows[0];
    const loja = l.loja || 'PLA';
    
    // Código da locação no banco: {0000}-{X}-{0000}
    // Formato: CCCC-A-NNNN (Corredor-Andar-Coluna)
    const codigoBanco = l.codigo || `${String(l.corredor || 0).padStart(4, '0')}-${l.andar || 'A'}-${String(l.coluna || 0).padStart(4, '0')}`;
    
    // QR Code impresso: LOC-{codigo} (adiciona prefixo)
    const codigoQR = `LOC-${codigoBanco}`;

    return {
        tipo: 'locacao',
        codigo: codigoQR, // QR com prefixo LOC-
        loja,
        linha1: codigoQR, // Display na etiqueta com prefixo
        linha2_barcode: codigoQR, // Barcode com prefixo
        // Locação tem layout 50/50 (código grande + barcode grande)
        layout: '50-50',
        raw: {
            id: l.id,
            codigo_banco: codigoBanco, // Código sem prefixo (para referência)
            corredor: l.corredor,
            coluna: l.coluna,
            andar: l.andar,
            descricao: l.descricao
        }
    };
}

/**
 * Converte o formato de loja da tabela bobinas/produtos para a fila_impressao
 * bobinas.loja: 'Cortinave' ou 'BN'
 * fila_impressao.loja: 'PLA' ou 'CIA'
 */
function converterLojaParaFila(loja) {
    if (!loja) return 'PLA';
    
    const lojaUpper = String(loja).toUpperCase();
    
    // Se já está no formato correto
    if (lojaUpper === 'PLA' || lojaUpper === 'CIA') {
        return lojaUpper;
    }
    
    // Converter formato legado
    if (lojaUpper === 'CORTINAVE' || lojaUpper === 'PALOTINA') {
        return 'PLA';
    }
    if (lojaUpper === 'BN' || lojaUpper === 'CIANORTE') {
        return 'CIA';
    }
    
    // Default
    return 'PLA';
}

/**
 * Converte o formato de loja para usar no código da etiqueta
 * Retorna o prefixo correto: PLA ou CIA
 * Usado nos códigos: BOB-PLA-000001, RET-CIA-000042
 */
function converterLojaParaCodigo(loja) {
    // Reutiliza a mesma lógica de conversão
    return converterLojaParaFila(loja);
}

/**
 * Formata metragem para exibição: 150,00m
 */
function formatarMetragem(valor) {
    if (!valor && valor !== 0) return '0,00m';
    const num = parseFloat(valor);
    return num.toFixed(2).replace('.', ',') + 'm';
}

module.exports = {
    adicionar,
    listarPendentes,
    marcarImpressa,
    marcarMultiplasImpressas,
    cancelar,
    obterEtiqueta,
    historico,
    estatisticas,
    preview
};
