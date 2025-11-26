const db = require('../config/database');

// Listar produtos
exports.listarProdutos = async (req, res) => {
    try {
        const [produtos] = await db.query(
            `SELECT p.*, 
                    c.nome_cor, 
                    g.gramatura
             FROM produtos p
             LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
             LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
             WHERE p.ativo = 1
             ORDER BY p.loja, p.codigo`
        );
        res.json({ success: true, data: produtos });
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Criar produto
exports.criarProduto = async (req, res) => {
    const { 
        loja, 
        codigo, 
        cor_id, 
        gramatura_id, 
        fabricante,
        tipo_tecido,
        largura_sem_costura, 
        tipo_bainha, 
        largura_final,
        largura_maior,
        largura_y
    } = req.body;

    if (!loja || !codigo || !cor_id || !gramatura_id || !fabricante) {
        return res.status(400).json({ success: false, error: 'Campos obrigatórios: loja, código, cor, gramatura e fabricante' });
    }

    // Validar campos específicos do tipo de tecido
    if (tipo_tecido === 'Bando Y') {
        if (!largura_maior || !largura_y) {
            return res.status(400).json({ success: false, error: 'Para Bando Y é necessário informar: Largura Maior e Largura Y' });
        }
    } else {
        if (!largura_sem_costura || !tipo_bainha || !largura_final) {
            return res.status(400).json({ success: false, error: 'Para tecido normal é necessário informar: Largura sem costura, Tipo de bainha e Largura final' });
        }
    }

    try {
        // Verificar se já existe um produto com mesmo código e loja
        const [existing] = await db.query(
            'SELECT id FROM produtos WHERE loja = ? AND codigo = ? AND ativo = 1',
            [loja, codigo]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'Já existe um produto com este código nesta loja' });
        }

        const [result] = await db.query(
            `INSERT INTO produtos (
                loja, codigo, cor_id, gramatura_id, fabricante, tipo_tecido,
                largura_sem_costura, tipo_bainha, largura_final,
                largura_maior, largura_y
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                loja, codigo, cor_id, gramatura_id, fabricante, tipo_tecido || 'Normal',
                largura_sem_costura || null, tipo_bainha || null, largura_final || null,
                largura_maior || null, largura_y || null
            ]
        );

        res.json({ success: true, message: 'Produto criado com sucesso', id: result.insertId });
    } catch (error) {
        console.error('Erro ao criar produto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Atualizar produto
exports.atualizarProduto = async (req, res) => {
    const { id } = req.params;
    const { 
        loja, 
        codigo, 
        cor_id, 
        gramatura_id, 
        fabricante,
        tipo_tecido,
        largura_sem_costura, 
        tipo_bainha, 
        largura_final,
        largura_maior,
        largura_y,
        ativo 
    } = req.body;

    try {
        // Verificar se já existe outro produto com mesmo código e loja
        const [existing] = await db.query(
            'SELECT id FROM produtos WHERE loja = ? AND codigo = ? AND id != ? AND ativo = 1',
            [loja, codigo, id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, error: 'Já existe outro produto com este código nesta loja' });
        }

        const [result] = await db.query(
            `UPDATE produtos 
             SET loja = ?, codigo = ?, cor_id = ?, gramatura_id = ?, fabricante = ?, tipo_tecido = ?,
                 largura_sem_costura = ?, tipo_bainha = ?, largura_final = ?,
                 largura_maior = ?, largura_y = ?, ativo = ?
             WHERE id = ?`,
            [
                loja, codigo, cor_id, gramatura_id, fabricante, tipo_tecido || 'Normal',
                largura_sem_costura || null, tipo_bainha || null, largura_final || null,
                largura_maior || null, largura_y || null,
                ativo !== undefined ? ativo : 1, id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Produto não encontrado' });
        }

        res.json({ success: true, message: 'Produto atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Desativar produto
exports.desativarProduto = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query(
            'UPDATE produtos SET ativo = 0 WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Produto não encontrado' });
        }

        res.json({ success: true, message: 'Produto desativado com sucesso' });
    } catch (error) {
        console.error('Erro ao desativar produto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
