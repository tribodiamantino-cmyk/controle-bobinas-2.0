const db = require('../config/database');

// Listar todas as locações (ativas e inativas)
exports.listarLocacoes = async (req, res) => {
    try {
        const [locacoes] = await db.query(`
            SELECT id, codigo, descricao, capacidade, ativa, created_at, updated_at
            FROM locacoes 
            ORDER BY codigo
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

// Buscar locação por ID
exports.buscarLocacao = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [locacao] = await db.query(`
            SELECT id, codigo, descricao, capacidade, ativa, created_at, updated_at
            FROM locacoes 
            WHERE id = ?
        `, [id]);
        
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
        const { codigo, descricao, capacidade } = req.body;
        
        // Validação: código obrigatório
        if (!codigo) {
            return res.status(400).json({ 
                success: false, 
                error: 'Código da locação é obrigatório' 
            });
        }
        
        // Validação: formato da máscara 0000-X-0000
        const mascaraRegex = /^[0-9]{4}-[A-Z]{1}-[0-9]{4}$/;
        if (!mascaraRegex.test(codigo)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Código deve seguir o formato 0000-X-0000 (ex: 0001-A-0001)' 
            });
        }
        
        const [result] = await db.query(`
            INSERT INTO locacoes (codigo, descricao, capacidade, ativa)
            VALUES (?, ?, ?, TRUE)
        `, [codigo, descricao || null, capacidade || null]);
        
        res.json({ 
            success: true, 
            data: {
                id: result.insertId,
                codigo,
                descricao,
                capacidade
            },
            message: 'Locação criada com sucesso!' 
        });
        
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false, 
                error: 'Código de locação já existe' 
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
        const { codigo, descricao, capacidade, ativa } = req.body;
        
        // Se forneceu código, validar formato
        if (codigo) {
            const mascaraRegex = /^[0-9]{4}-[A-Z]{1}-[0-9]{4}$/;
            if (!mascaraRegex.test(codigo)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Código deve seguir o formato 0000-X-0000 (ex: 0001-A-0001)' 
                });
            }
        }
        
        await db.query(`
            UPDATE locacoes
            SET codigo = COALESCE(?, codigo),
                descricao = COALESCE(?, descricao),
                capacidade = COALESCE(?, capacidade),
                ativa = COALESCE(?, ativa),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [codigo, descricao, capacidade, ativa, id]);
        
        res.json({ 
            success: true, 
            message: 'Locação atualizada com sucesso!' 
        });
        
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false, 
                error: 'Código de locação já existe' 
            });
        }
        console.error('Erro ao atualizar locação:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Desativar locação (soft delete)
exports.desativarLocacao = async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.query(`
            UPDATE locacoes
            SET ativa = FALSE,
                updated_at = CURRENT_TIMESTAMP
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

// Reativar locação
exports.reativarLocacao = async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.query(`
            UPDATE locacoes
            SET ativa = TRUE,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [id]);
        
        res.json({ 
            success: true, 
            message: 'Locação reativada com sucesso!' 
        });
        
    } catch (error) {
        console.error('Erro ao reativar locação:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
