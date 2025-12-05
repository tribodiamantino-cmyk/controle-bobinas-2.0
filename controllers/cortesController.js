const db = require('../config/database');

// Gerar código único para corte: COR-2025-00001
async function gerarCodigoCorte() {
    const ano = new Date().getFullYear();
    const prefixo = 'COR';
    
    const [ultimoCodigo] = await db.query(
        `SELECT codigo_corte FROM cortes_realizados 
         WHERE codigo_corte LIKE '${prefixo}-${ano}-%' 
         ORDER BY id DESC LIMIT 1`
    );
    
    let numero = 1;
    if (ultimoCodigo.length > 0) {
        const partes = ultimoCodigo[0].codigo_corte.split('-');
        numero = parseInt(partes[2]) + 1;
    }
    
    return `${prefixo}-${ano}-${String(numero).padStart(5, '0')}`;
}

// Registrar novo corte
exports.registrarCorte = async (req, res) => {
    try {
        const {
            alocacao_id,
            metragem_cortada,
            foto_medidor_url,
            operador_nome,
            observacoes
        } = req.body;
        
        if (!alocacao_id || !metragem_cortada) {
            return res.status(400).json({ 
                success: false, 
                error: 'Alocação e metragem são obrigatórios' 
            });
        }
        
        // Buscar dados da alocação
        const [alocacao] = await db.query(`
            SELECT 
                ac.*,
                ipc.plano_corte_id,
                ipc.produto_id,
                ipc.metragem as metragem_item
            FROM alocacoes_corte ac
            JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
            WHERE ac.id = ?
        `, [alocacao_id]);
        
        if (!alocacao || alocacao.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Alocação não encontrada' 
            });
        }
        
        const aloc = alocacao[0];
        
        // Validar metragem
        const metragemJaCortada = parseFloat(aloc.metragem_cortada || 0);
        const metragemRestante = parseFloat(aloc.metragem_alocada) - metragemJaCortada;
        
        if (parseFloat(metragem_cortada) > metragemRestante) {
            return res.status(400).json({ 
                success: false, 
                error: `Metragem excede o restante (${metragemRestante}m disponíveis)` 
            });
        }
        
        // Gerar código do corte
        const codigo_corte = await gerarCodigoCorte();
        
        // Inserir corte
        const [result] = await db.query(`
            INSERT INTO cortes_realizados (
                codigo_corte,
                plano_corte_id,
                item_plano_corte_id,
                alocacao_corte_id,
                origem_tipo,
                bobina_id,
                retalho_id,
                metragem_cortada,
                produto_id,
                bobina_validada_qr,
                data_validacao_bobina,
                foto_medidor_url,
                foto_medidor_timestamp,
                operador_nome,
                status,
                observacoes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, NOW(), ?, 'concluido', ?)
        `, [
            codigo_corte,
            aloc.plano_corte_id,
            aloc.item_plano_corte_id,
            alocacao_id,
            aloc.tipo_origem,
            aloc.bobina_id,
            aloc.retalho_id,
            metragem_cortada,
            aloc.produto_id,
            true, // bobina_validada_qr (assumindo que validou)
            foto_medidor_url,
            operador_nome,
            observacoes
        ]);
        
        // Atualizar alocação
        const novaMetragemCortada = metragemJaCortada + parseFloat(metragem_cortada);
        const novaMetragemRestante = parseFloat(aloc.metragem_alocada) - novaMetragemCortada;
        const novoStatus = novaMetragemRestante <= 0 ? 'concluido' : 'em_andamento';
        
        await db.query(`
            UPDATE alocacoes_corte
            SET cortes_realizados = cortes_realizados + 1,
                metragem_cortada = ?,
                metragem_restante = ?,
                status_corte = ?
            WHERE id = ?
        `, [novaMetragemCortada, novaMetragemRestante, novoStatus, alocacao_id]);
        
        // Atualizar metragem da origem (bobina ou retalho)
        if (aloc.tipo_origem === 'bobina' && aloc.bobina_id) {
            await db.query(`
                UPDATE bobinas
                SET metragem_atual = metragem_atual - ?
                WHERE id = ?
            `, [metragem_cortada, aloc.bobina_id]);
        } else if (aloc.tipo_origem === 'retalho' && aloc.retalho_id) {
            await db.query(`
                UPDATE retalhos
                SET metragem = metragem - ?
                WHERE id = ?
            `, [metragem_cortada, aloc.retalho_id]);
        }
        
        res.json({ 
            success: true,
            corte: {
                id: result.insertId,
                codigo_corte: codigo_corte
            },
            restante: novaMetragemRestante,
            message: 'Corte registrado com sucesso!'
        });
        
    } catch (error) {
        console.error('Erro ao registrar corte:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Consultar corte por código
exports.consultarCorte = async (req, res) => {
    try {
        const { codigo_corte } = req.params;
        
        const [corte] = await db.query(`
            SELECT 
                cr.*,
                pc.codigo_plano,
                pc.cliente,
                pc.aviario,
                p.codigo as produto_codigo,
                c.nome_cor,
                g.gramatura,
                COALESCE(b.codigo_interno, r.codigo_retalho) as origem_codigo
            FROM cortes_realizados cr
            JOIN planos_corte pc ON pc.id = cr.plano_corte_id
            JOIN produtos p ON p.id = cr.produto_id
            LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
            LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            LEFT JOIN bobinas b ON b.id = cr.bobina_id
            LEFT JOIN retalhos r ON r.id = cr.retalho_id
            WHERE cr.codigo_corte = ?
        `, [codigo_corte]);
        
        if (!corte || corte.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Corte não encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            data: corte[0] 
        });
        
    } catch (error) {
        console.error('Erro ao consultar corte:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Listar cortes de um plano
exports.listarCortesPorPlano = async (req, res) => {
    try {
        const { plano_id } = req.params;
        
        const [cortes] = await db.query(`
            SELECT 
                cr.*,
                p.codigo as produto_codigo,
                c.nome_cor,
                g.gramatura
            FROM cortes_realizados cr
            JOIN produtos p ON p.id = cr.produto_id
            LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
            LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE cr.plano_corte_id = ?
            ORDER BY cr.data_corte DESC
        `, [plano_id]);
        
        res.json({ 
            success: true, 
            data: cortes 
        });
        
    } catch (error) {
        console.error('Erro ao listar cortes:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
