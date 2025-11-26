const db = require('../config/database');

// Listar todas as cores
exports.listarCores = async (req, res) => {
    try {
        const [cores] = await db.query(
            'SELECT * FROM configuracoes_cores ORDER BY nome_cor ASC'
        );
        res.json(cores);
    } catch (error) {
        console.error('Erro ao listar cores:', error);
        res.status(500).json({ error: 'Erro ao listar cores' });
    }
};

// Criar nova cor
exports.criarCor = async (req, res) => {
    try {
        const { nome_cor } = req.body;
        
        if (!nome_cor) {
            return res.status(400).json({ error: 'Nome da cor é obrigatório' });
        }
        
        const [result] = await db.query(
            'INSERT INTO configuracoes_cores (nome_cor) VALUES (?)',
            [nome_cor]
        );
        
        res.status(201).json({
            message: 'Cor criada com sucesso',
            id: result.insertId
        });
    } catch (error) {
        console.error('Erro ao criar cor:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Cor já existe' });
        }
        res.status(500).json({ error: 'Erro ao criar cor' });
    }
};

// Atualizar cor
exports.atualizarCor = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome_cor, ativo } = req.body;
        
        const [result] = await db.query(
            'UPDATE configuracoes_cores SET nome_cor = ?, ativo = ? WHERE id = ?',
            [nome_cor, ativo, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cor não encontrada' });
        }
        
        res.json({ message: 'Cor atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar cor:', error);
        res.status(500).json({ error: 'Erro ao atualizar cor' });
    }
};

// Desativar cor
exports.desativarCor = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se a cor está em uso
        const [produtos] = await db.query(
            'SELECT COUNT(*) as total FROM produtos WHERE cor_id = ? AND ativo = TRUE',
            [id]
        );
        
        if (produtos[0].total > 0) {
            return res.status(400).json({
                error: 'Não é possível desativar esta cor pois ela está em uso em produtos ativos'
            });
        }
        
        const [result] = await db.query(
            'UPDATE configuracoes_cores SET ativo = FALSE WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Cor não encontrada' });
        }
        
        res.json({ message: 'Cor desativada com sucesso' });
    } catch (error) {
        console.error('Erro ao desativar cor:', error);
        res.status(500).json({ error: 'Erro ao desativar cor' });
    }
};
