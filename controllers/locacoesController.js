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
        
        // Validação: formato flexível N-X-N (1-4 dígitos em cada parte)
        const mascaraRegex = /^[0-9]{1,4}-[A-Z]-[0-9]{1,4}$/;
        if (!mascaraRegex.test(codigo)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Código deve seguir o formato N-X-N (ex: 1-A-1, 12-B-34, 0001-A-0001)' 
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
        
        // Se forneceu código, validar formato flexível N-X-N (1-4 dígitos)
        if (codigo) {
            const mascaraRegex = /^[0-9]{1,4}-[A-Z]-[0-9]{1,4}$/;
            if (!mascaraRegex.test(codigo)) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Código deve seguir o formato N-X-N (ex: 1-A-1, 12-B-34, 0001-A-0001)' 
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

// Detalhes de locação para MOBILE (com itens armazenados)
exports.detalhesParaMobile = async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('📍 Buscando detalhes da locação ID:', id);
        
        // Buscar dados da locação
        const [locacao] = await db.query(`
            SELECT id, codigo, descricao, ativa
            FROM locacoes 
            WHERE id = ?
        `, [id]);
        
        if (!locacao || locacao.length === 0) {
            console.log('❌ Locação não encontrada:', id);
            return res.status(404).json({ 
                success: false, 
                error: 'Locação não encontrada' 
            });
        }
        
        const loc = locacao[0];
        
        // Buscar bobinas nesta locação (exceto esgotadas)
        const [bobinas] = await db.query(`
            SELECT 
                b.id,
                b.codigo_interno as codigo,
                'bobina' as tipo,
                b.metragem_atual as metragem,
                b.status,
                b.loja,
                p.fabricante,
                c.nome_cor,
                g.gramatura
            FROM bobinas b
            JOIN produtos p ON b.produto_id = p.id
            LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
            LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE b.locacao = ? AND b.status != 'Esgotado'
            ORDER BY b.codigo_interno
        `, [loc.codigo]);
        
        // Buscar retalhos nesta locação (exceto esgotados)
        const [retalhos] = await db.query(`
            SELECT 
                r.id,
                r.codigo_retalho as codigo,
                'retalho' as tipo,
                r.metragem as metragem,
                r.status,
                r.loja,
                p.fabricante,
                c.nome_cor,
                g.gramatura
            FROM retalhos r
            JOIN produtos p ON r.produto_id = p.id
            LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
            LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE r.locacao = ? AND r.status != 'Esgotado'
            ORDER BY r.codigo_retalho
        `, [loc.codigo]);
        
        // Combinar itens
        const itens = [...bobinas, ...retalhos];
        const totalMetragem = itens.reduce((sum, item) => sum + parseFloat(item.metragem || 0), 0);
        
        console.log(`✅ Locação ${loc.codigo}: ${itens.length} item(ns), ${totalMetragem}m total`);
        
        res.json({ 
            success: true, 
            data: {
                id: loc.id,
                codigo: loc.codigo,
                descricao: loc.descricao,
                ativa: loc.ativa,
                vazia: itens.length === 0,
                total_itens: itens.length,
                total_metragem: parseFloat(totalMetragem.toFixed(2)),
                itens
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao buscar detalhes da locação:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

