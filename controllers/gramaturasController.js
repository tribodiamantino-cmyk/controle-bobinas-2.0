const db = require('../config/database');

// Listar todas as gramaturas
exports.listarGramaturas = async (req, res) => {
    try {
        const [gramaturas] = await db.query(
            'SELECT * FROM configuracoes_gramaturas WHERE ativo = 1 ORDER BY CAST(SUBSTRING_INDEX(gramatura, " ", 1) AS UNSIGNED) ASC'
        );
        res.json({ success: true, data: gramaturas });
    } catch (error) {
        console.error('Erro ao listar gramaturas:', error);
        res.status(500).json({ success: false, error: 'Erro ao listar gramaturas' });
    }
};

// Criar nova gramatura
exports.criarGramatura = async (req, res) => {
    try {
        const { gramatura } = req.body;
        
        if (!gramatura) {
            return res.status(400).json({ success: false, error: 'Gramatura é obrigatória' });
        }
        
        const [result] = await db.query(
            'INSERT INTO configuracoes_gramaturas (gramatura) VALUES (?)',
            [gramatura]
        );
        
        res.status(201).json({
            success: true,
            message: 'Gramatura criada com sucesso',
            id: result.insertId
        });
    } catch (error) {
        console.error('Erro ao criar gramatura:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, error: 'Gramatura já existe' });
        }
        res.status(500).json({ success: false, error: 'Erro ao criar gramatura' });
    }
};

// Atualizar gramatura
exports.atualizarGramatura = async (req, res) => {
    try {
        const { id } = req.params;
        const { gramatura, ativo } = req.body;
        
        const [result] = await db.query(
            'UPDATE configuracoes_gramaturas SET gramatura = ?, ativo = ? WHERE id = ?',
            [gramatura, ativo, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Gramatura não encontrada' });
        }
        
        res.json({ success: true, message: 'Gramatura atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar gramatura:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar gramatura' });
    }
};

// Desativar gramatura
exports.desativarGramatura = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se a gramatura está em uso
        const [produtos] = await db.query(
            'SELECT COUNT(*) as total FROM produtos WHERE gramatura_id = ? AND ativo = TRUE',
            [id]
        );
        
        if (produtos[0].total > 0) {
            return res.status(400).json({
                success: false,
                error: 'Não é possível desativar esta gramatura pois ela está em uso em produtos ativos'
            });
        }
        
        const [result] = await db.query(
            'UPDATE configuracoes_gramaturas SET ativo = FALSE WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Gramatura não encontrada' });
        }
        
        res.json({ success: true, message: 'Gramatura desativada com sucesso' });
    } catch (error) {
        console.error('Erro ao desativar gramatura:', error);
        res.status(500).json({ success: false, error: 'Erro ao desativar gramatura' });
    }
};
