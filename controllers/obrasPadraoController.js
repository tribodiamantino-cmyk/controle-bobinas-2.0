const db = require('../config/database');

// Listar todas as obras padrão
exports.listarObrasPadrao = async (req, res) => {
    try {
        const [obras] = await db.query(`
            SELECT 
                op.*,
                COUNT(opi.id) as total_itens,
                SUM(opi.metragem) as metragem_total,
                GROUP_CONCAT(DISTINCT p.nome SEPARATOR ', ') as produtos
            FROM obras_padrao op
            LEFT JOIN obra_padrao_itens opi ON opi.obra_padrao_id = op.id
            LEFT JOIN produtos p ON p.id = opi.produto_id
            GROUP BY op.id
            ORDER BY op.ultima_utilizacao DESC, op.data_criacao DESC
        `);

        res.json({ success: true, data: obras });
    } catch (error) {
        console.error('Erro ao listar obras padrão:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Buscar detalhes de uma obra padrão
exports.buscarObraPadrao = async (req, res) => {
    try {
        const { id } = req.params;

        const [obras] = await db.query(`
            SELECT * FROM obras_padrao WHERE id = ?
        `, [id]);

        if (obras.length === 0) {
            return res.status(404).json({ success: false, error: 'Obra padrão não encontrada' });
        }

        const obra = obras[0];

        // Buscar itens da obra padrão
        const [itens] = await db.query(`
            SELECT 
                opi.*,
                p.nome as produto_nome,
                p.codigo as produto_codigo,
                p.cor as produto_cor
            FROM obra_padrao_itens opi
            INNER JOIN produtos p ON p.id = opi.produto_id
            WHERE opi.obra_padrao_id = ?
            ORDER BY opi.ordem
        `, [id]);

        obra.itens = itens;

        res.json({ success: true, data: obra });
    } catch (error) {
        console.error('Erro ao buscar obra padrão:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Criar obra padrão a partir de um plano existente
exports.criarObraPadraoDeплano = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { plano_id, nome, descricao } = req.body;

        if (!plano_id || !nome) {
            return res.status(400).json({ 
                success: false, 
                error: 'Plano ID e nome são obrigatórios' 
            });
        }

        // Verificar se plano existe
        const [planos] = await connection.query(`
            SELECT * FROM planos_corte WHERE id = ?
        `, [plano_id]);

        if (planos.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: 'Plano não encontrado' });
        }

        // Criar obra padrão
        const [result] = await connection.query(`
            INSERT INTO obras_padrao (nome, descricao, criado_de_plano_id)
            VALUES (?, ?, ?)
        `, [nome, descricao || null, plano_id]);

        const obraPadraoId = result.insertId;

        // Copiar itens do plano para a obra padrão
        const [itensPlano] = await connection.query(`
            SELECT produto_id, metragem, observacoes, ordem
            FROM itens_plano_corte
            WHERE plano_corte_id = ?
            ORDER BY ordem
        `, [plano_id]);

        for (const item of itensPlano) {
            await connection.query(`
                INSERT INTO obra_padrao_itens (obra_padrao_id, produto_id, metragem, observacoes, ordem)
                VALUES (?, ?, ?, ?, ?)
            `, [obraPadraoId, item.produto_id, item.metragem, item.observacoes, item.ordem]);
        }

        await connection.commit();

        res.json({ 
            success: true, 
            message: 'Obra padrão criada com sucesso',
            data: { id: obraPadraoId }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Erro ao criar obra padrão:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
};

// Criar novo plano a partir de uma obra padrão
exports.criarPlanoDeObraPadrao = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { obra_padrao_id, codigo_plano, cliente, aviario } = req.body;

        if (!obra_padrao_id || !codigo_plano) {
            return res.status(400).json({ 
                success: false, 
                error: 'Obra padrão ID e código do plano são obrigatórios' 
            });
        }

        // Verificar se obra padrão existe
        const [obras] = await connection.query(`
            SELECT * FROM obras_padrao WHERE id = ?
        `, [obra_padrao_id]);

        if (obras.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, error: 'Obra padrão não encontrada' });
        }

        // Criar novo plano
        const [result] = await connection.query(`
            INSERT INTO planos_corte (codigo_plano, cliente, aviario, status, obra_padrao_id)
            VALUES (?, ?, ?, 'planejamento', ?)
        `, [codigo_plano, cliente || null, aviario || null, obra_padrao_id]);

        const planoId = result.insertId;

        // Copiar itens da obra padrão para o novo plano
        const [itensObra] = await connection.query(`
            SELECT produto_id, metragem, observacoes, ordem
            FROM obra_padrao_itens
            WHERE obra_padrao_id = ?
            ORDER BY ordem
        `, [obra_padrao_id]);

        for (const item of itensObra) {
            await connection.query(`
                INSERT INTO itens_plano_corte (plano_corte_id, produto_id, metragem, observacoes, ordem)
                VALUES (?, ?, ?, ?, ?)
            `, [planoId, item.produto_id, item.metragem, item.observacoes, item.ordem]);
        }

        // Atualizar estatísticas da obra padrão
        await connection.query(`
            UPDATE obras_padrao 
            SET vezes_utilizada = vezes_utilizada + 1,
                ultima_utilizacao = NOW()
            WHERE id = ?
        `, [obra_padrao_id]);

        await connection.commit();

        res.json({ 
            success: true, 
            message: 'Plano criado a partir da obra padrão',
            data: { id: planoId }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Erro ao criar plano de obra padrão:', error);
        res.status(500).json({ success: false, error: error.message });
    } finally {
        connection.release();
    }
};

// Excluir obra padrão
exports.excluirObraPadrao = async (req, res) => {
    try {
        const { id } = req.params;

        await db.query(`DELETE FROM obras_padrao WHERE id = ?`, [id]);

        res.json({ 
            success: true, 
            message: 'Obra padrão excluída com sucesso' 
        });

    } catch (error) {
        console.error('Erro ao excluir obra padrão:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;
