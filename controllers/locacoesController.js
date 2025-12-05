const db = require('../config/database');

// Listar todas as locações
exports.listarLocacoes = async (req, res) => {
    try {
        const [locacoes] = await db.query(`
            SELECT * FROM locacoes 
            WHERE ativo = TRUE
            ORDER BY codigo_locacao
        `);
        
        res.json({ 
            success: true, 
            data: locacoes 
        });
        
    } catch (error) {
        console.error('Erro ao listar locações:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Buscar locação por código
exports.buscarLocacao = async (req, res) => {
    try {
        const { codigo_locacao } = req.params;
        
        const [locacao] = await db.query(`
            SELECT * FROM locacoes 
            WHERE codigo_locacao = ?
        `, [codigo_locacao]);
        
        if (!locacao || locacao.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Locação não encontrada' 
            });
        }
        
        res.json({ 
            success: true, 
            data: locacao[0] 
        });
        
    } catch (error) {
        console.error('Erro ao buscar locação:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Criar nova locação
exports.criarLocacao = async (req, res) => {
    try {
        const { codigo_locacao, descricao, corredor, prateleira, posicao } = req.body;
        
        if (!codigo_locacao) {
            return res.status(400).json({ 
                success: false, 
                error: 'Código da locação é obrigatório' 
            });
        }
        
        const [result] = await db.query(`
            INSERT INTO locacoes (codigo_locacao, descricao, corredor, prateleira, posicao)
            VALUES (?, ?, ?, ?, ?)
        `, [codigo_locacao, descricao, corredor, prateleira, posicao]);
        
        res.json({ 
            success: true, 
            data: {
                id: result.insertId,
                codigo_locacao
            },
            message: 'Locação criada com sucesso!' 
        });
        
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false, 
                error: 'Locação já existe' 
            });
        }
        console.error('Erro ao criar locação:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Atualizar locação
exports.atualizarLocacao = async (req, res) => {
    try {
        const { id } = req.params;
        const { descricao, corredor, prateleira, posicao, ativo } = req.body;
        
        await db.query(`
            UPDATE locacoes
            SET descricao = COALESCE(?, descricao),
                corredor = COALESCE(?, corredor),
                prateleira = COALESCE(?, prateleira),
                posicao = COALESCE(?, posicao),
                ativo = COALESCE(?, ativo)
            WHERE id = ?
        `, [descricao, corredor, prateleira, posicao, ativo, id]);
        
        res.json({ 
            success: true, 
            message: 'Locação atualizada com sucesso!' 
        });
        
    } catch (error) {
        console.error('Erro ao atualizar locação:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Desativar locação
exports.desativarLocacao = async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.query(`
            UPDATE locacoes
            SET ativo = FALSE
            WHERE id = ?
        `, [id]);
        
        res.json({ 
            success: true, 
            message: 'Locação desativada com sucesso!' 
        });
        
    } catch (error) {
        console.error('Erro ao desativar locação:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
