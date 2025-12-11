const db = require('../config/database');

// Gerar código QR único para retalho (formato: RET-0001)
async function gerarCodigoRetalho() {
    const [rows] = await db.query(
        `SELECT codigo_retalho FROM retalhos 
         WHERE codigo_retalho LIKE 'RET-%' 
         ORDER BY id DESC LIMIT 1`
    );
    
    let proximoNumero = 1;
    if (rows.length > 0) {
        const ultimoCodigo = rows[0].codigo_retalho;
        const numeroAtual = parseInt(ultimoCodigo.split('-')[1]);
        proximoNumero = numeroAtual + 1;
    }
    
    return `RET-${proximoNumero.toString().padStart(4, '0')}`;
}

// Criar retalho manualmente
exports.criarRetalho = async (req, res) => {
    try {
        const { produto_id, metragem, localizacao_atual, observacoes } = req.body;
        
        if (!produto_id || !metragem) {
            return res.status(400).json({ 
                success: false, 
                error: 'Produto e metragem são obrigatórios' 
            });
        }
        
        // Gerar código único
        const codigo_retalho = await gerarCodigoRetalho();
        
        // Inserir retalho
        const [result] = await db.query(
            `INSERT INTO retalhos 
            (codigo_retalho, produto_id, metragem, localizacao_atual, observacoes) 
            VALUES (?, ?, ?, ?, ?)`,
            [codigo_retalho, produto_id, metragem, localizacao_atual || null, observacoes || null]
        );
        
        // Buscar retalho criado com dados do produto
        const [retalho] = await db.query(
            `SELECT 
                r.*,
                p.codigo,
                p.loja,
                p.fabricante,
                c.nome_cor,
                g.gramatura
            FROM retalhos r
            JOIN produtos p ON r.produto_id = p.id
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE r.id = ?`,
            [result.insertId]
        );
        
        res.json({ 
            success: true, 
            message: 'Retalho criado com sucesso!',
            data: retalho[0]
        });
        
    } catch (error) {
        console.error('Erro ao criar retalho:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};


// Converter bobina em retalho
exports.converterBobinaEmRetalho = async (req, res) => {
    try {
        const { bobina_id } = req.params;
        
        // Buscar dados da bobina
        const [bobinas] = await db.query(
            `SELECT 
                b.*,
                p.id as produto_id,
                p.codigo,
                p.loja,
                p.fabricante,
                c.nome_cor,
                g.gramatura
            FROM bobinas b
            JOIN produtos p ON b.produto_id = p.id
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE b.id = ?`,
            [bobina_id]
        );
        
        if (bobinas.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Bobina não encontrada' 
            });
        }
        
        const bobina = bobinas[0];
        
        // Verificar se bobina tem alocações em planos em produção
        const [alocacoes] = await db.query(
            `SELECT COUNT(*) as count FROM alocacoes_corte ac
             JOIN planos_corte pc ON ac.plano_id = pc.id
             WHERE ac.bobina_id = ? AND pc.status = 'em_producao'`,
            [bobina_id]
        );
        
        if (alocacoes[0].count > 0) {
            return res.status(400).json({
                success: false,
                error: 'Bobina possui alocações em planos de corte ativos. Finalize ou cancele os planos antes de converter.'
            });
        }
        
        // Gerar código do retalho
        const codigo_retalho = await gerarCodigoRetalho();
        
        // Criar retalho com a metragem atual da bobina (herdando placa)
        // Nota: bobinas não tem localizacao_atual, então fica NULL
        const [result] = await db.query(
            `INSERT INTO retalhos 
            (codigo_retalho, produto_id, metragem, bobina_origem_id, placa, localizacao_atual, observacoes) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                codigo_retalho, 
                bobina.produto_id, 
                bobina.metragem_atual,
                bobina_id,
                bobina.placa || null, // Herdar placa da bobina
                null, // bobina não tem localizacao_atual
                `Convertido da bobina ${bobina.codigo_interno}`
            ]
        );
        
        const retalho_id = result.insertId;
        
        // EXCLUIR a bobina (ao invés de apenas marcar como convertida)
        await db.query(`DELETE FROM bobinas WHERE id = ?`, [bobina_id]);
        console.log(`✅ Bobina ${bobina.codigo_interno} convertida e excluída`);
        
        // Buscar retalho criado
        const [retalho] = await db.query(
            `SELECT 
                r.*,
                p.codigo,
                p.loja,
                p.fabricante,
                c.nome_cor,
                g.gramatura
            FROM retalhos r
            JOIN produtos p ON r.produto_id = p.id
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE r.id = ?`,
            [retalho_id]
        );
        
        res.json({ 
            success: true, 
            message: 'Bobina convertida em retalho e excluída com sucesso!',
            data: {
                bobina_excluida: bobina.codigo_interno,
                codigo_retalho: retalho[0].codigo_retalho,
                retalho: retalho[0]
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao converter bobina:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Listar todos os retalhos
exports.listarRetalhos = async (req, res) => {
    try {
        // Query que funciona com ou sem as colunas novas (placa, corte_origem_id)
        // IMPORTANTE: Não retornar retalhos com metragem zerada
        let query = `
            SELECT 
                r.id,
                r.codigo_retalho,
                r.qr_code,
                r.produto_id,
                r.metragem,
                r.metragem_reservada,
                r.localizacao_atual,
                r.status,
                r.observacoes,
                r.data_entrada,
                r.bobina_origem_id,
                p.codigo,
                p.loja,
                p.fabricante,
                c.nome_cor,
                g.gramatura,
                b.codigo_interno as bobina_codigo
            FROM retalhos r
            JOIN produtos p ON r.produto_id = p.id
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            LEFT JOIN bobinas b ON r.bobina_origem_id = b.id
            WHERE r.metragem > 0
            ORDER BY r.data_entrada DESC
        `;
        
        let [retalhos] = await db.query(query);
        
        // Tentar adicionar campos novos se existirem
        try {
            const [retalhosComNovosCampos] = await db.query(`
                SELECT 
                    r.id,
                    r.codigo_retalho,
                    r.qr_code,
                    r.produto_id,
                    r.metragem,
                    r.metragem_reservada,
                    r.localizacao_atual,
                    r.status,
                    r.observacoes,
                    r.data_entrada,
                    r.bobina_origem_id,
                    r.placa,
                    r.corte_origem_id,
                    p.codigo,
                    p.loja,
                    p.fabricante,
                    c.nome_cor,
                    g.gramatura,
                    b.codigo_interno as bobina_codigo
                FROM retalhos r
                JOIN produtos p ON r.produto_id = p.id
                JOIN configuracoes_cores c ON p.cor_id = c.id
                JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
                LEFT JOIN bobinas b ON r.bobina_origem_id = b.id
                WHERE r.metragem > 0
                ORDER BY r.data_entrada DESC
            `);
            retalhos = retalhosComNovosCampos;
        } catch (e) {
            // Colunas novas não existem ainda, usar query básica
            console.log('⚠️ Colunas placa/corte_origem_id não existem ainda');
        }
        
        res.json({ success: true, data: retalhos });
        
    } catch (error) {
        console.error('Erro ao listar retalhos:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Listar retalhos de um produto
exports.listarRetalhosPorProduto = async (req, res) => {
    try {
        const { produto_id } = req.params;
        
        const [retalhos] = await db.query(
            `SELECT 
                r.*,
                p.codigo,
                p.fabricante,
                c.nome_cor,
                g.gramatura
            FROM retalhos r
            JOIN produtos p ON r.produto_id = p.id
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE r.produto_id = ? AND r.metragem > 0
            ORDER BY r.data_entrada DESC`,
            [produto_id]
        );
        
        res.json({ success: true, data: retalhos });
        
    } catch (error) {
        console.error('Erro ao listar retalhos:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Buscar retalho por código
exports.buscarRetalhoPorCodigo = async (req, res) => {
    try {
        const { codigo_retalho } = req.params;
        
        const [retalho] = await db.query(
            `SELECT 
                r.*,
                p.codigo,
                p.loja,
                p.fabricante,
                p.tipo_tecido,
                p.largura_sem_costura,
                p.tipo_bainha,
                p.largura_final,
                p.largura_maior,
                p.largura_y,
                c.nome_cor,
                g.gramatura
            FROM retalhos r
            JOIN produtos p ON r.produto_id = p.id
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE r.codigo_retalho = ?`,
            [codigo_retalho]
        );
        
        if (retalho.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Retalho não encontrado' 
            });
        }
        
        res.json({ success: true, data: retalho[0] });
        
    } catch (error) {
        console.error('Erro ao buscar retalho:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Atualizar retalho (localização, metragem, observações)
exports.atualizarRetalho = async (req, res) => {
    try {
        const { id } = req.params;
        const { localizacao_atual, metragem, observacoes } = req.body;
        
        // Verificar se retalho existe
        const [retalhos] = await db.query(
            'SELECT localizacao_atual FROM retalhos WHERE id = ?',
            [id]
        );
        
        if (retalhos.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Retalho não encontrado' 
            });
        }
        
        const localizacaoAnterior = retalhos[0].localizacao_atual;
        
        // Atualizar retalho
        const updates = [];
        const values = [];
        
        if (localizacao_atual !== undefined) {
            updates.push('localizacao_atual = ?');
            values.push(localizacao_atual);
            
            // Registrar no histórico se localização mudou
            if (localizacaoAnterior !== localizacao_atual) {
                await db.query(
                    `INSERT INTO historico_localizacao_retalhos 
                    (retalho_id, localizacao) VALUES (?, ?)`,
                    [id, localizacao_atual]
                );
            }
        }
        
        if (metragem !== undefined) {
            if (parseFloat(metragem) <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Metragem deve ser maior que zero' 
                });
            }
            updates.push('metragem = ?');
            values.push(parseFloat(metragem));
        }
        
        if (observacoes !== undefined) {
            updates.push('observacoes = ?');
            values.push(observacoes);
        }
        
        if (updates.length > 0) {
            values.push(id);
            await db.query(
                `UPDATE retalhos SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }
        
        res.json({ 
            success: true, 
            message: 'Retalho atualizado com sucesso!' 
        });
        
    } catch (error) {
        console.error('Erro ao atualizar retalho:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Obter histórico de localização
exports.obterHistoricoLocalizacao = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [historico] = await db.query(
            `SELECT localizacao, data_movimento 
            FROM historico_localizacao_retalhos 
            WHERE retalho_id = ? 
            ORDER BY data_movimento DESC`,
            [id]
        );
        
        res.json({ 
            success: true, 
            data: historico 
        });
        
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Excluir retalho
exports.excluirRetalho = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se retalho existe
        const [retalhos] = await db.query(
            'SELECT bobina_origem_id FROM retalhos WHERE id = ?',
            [id]
        );
        
        if (retalhos.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Retalho não encontrado' 
            });
        }
        
        const bobina_origem_id = retalhos[0].bobina_origem_id;
        
        // Se veio de uma bobina, reverter o status da bobina
        if (bobina_origem_id) {
            await db.query(
                `UPDATE bobinas 
                SET convertida_em_retalho = FALSE, retalho_id = NULL 
                WHERE id = ?`,
                [bobina_origem_id]
            );
        }
        
        // Excluir retalho
        await db.query('DELETE FROM retalhos WHERE id = ?', [id]);
        
        res.json({ 
            success: true, 
            message: 'Retalho excluído com sucesso!' 
        });
        
    } catch (error) {
        console.error('Erro ao excluir retalho:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// ========== FUNÇÕES AUXILIARES EXPORTADAS ==========

/**
 * Gerar código de retalho (exportado para uso em outros controllers)
 */
exports.gerarCodigoRetalho = gerarCodigoRetalho;

/**
 * Converter um corte realizado em retalho
 * Usado quando plano ou item é excluído e já tinha cortes realizados
 * @param {number} corteId - ID do corte a converter
 * @returns {Object} - Dados do retalho criado
 */
exports.converterCorteEmRetalho = async function(corteId) {
    // Buscar dados do corte
    const [cortes] = await db.query(`
        SELECT 
            cr.*,
            p.id as produto_id,
            p.codigo as produto_codigo
        FROM cortes_realizados cr
        JOIN produtos p ON cr.produto_id = p.id
        WHERE cr.id = ?
    `, [corteId]);
    
    if (cortes.length === 0) {
        throw new Error(`Corte ID ${corteId} não encontrado`);
    }
    
    const corte = cortes[0];
    
    // Gerar código do retalho
    const codigo_retalho = await gerarCodigoRetalho();
    
    // Verificar se tabela retalhos tem as colunas novas (placa, corte_origem_id)
    // Tentar inserir com todas as colunas, se falhar, inserir sem elas
    let result;
    try {
        [result] = await db.query(`
            INSERT INTO retalhos 
            (codigo_retalho, produto_id, metragem, placa, corte_origem_id, observacoes) 
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            codigo_retalho,
            corte.produto_id,
            corte.metragem_cortada,
            corte.placa_origem || null,
            corteId,
            `Convertido do corte ${corte.codigo_corte}`
        ]);
    } catch (err) {
        // Se falhar (colunas não existem ainda), inserir sem elas
        if (err.code === 'ER_BAD_FIELD_ERROR') {
            console.log('⚠️ Colunas placa/corte_origem_id não existem ainda, inserindo sem elas');
            [result] = await db.query(`
                INSERT INTO retalhos 
                (codigo_retalho, produto_id, metragem, observacoes) 
                VALUES (?, ?, ?, ?)
            `, [
                codigo_retalho,
                corte.produto_id,
                corte.metragem_cortada,
                `Convertido do corte ${corte.codigo_corte}`
            ]);
        } else {
            throw err;
        }
    }
    
    console.log(`✅ Corte ${corte.codigo_corte} convertido em retalho ${codigo_retalho}`);
    
    return {
        id: result.insertId,
        codigo_retalho: codigo_retalho,
        metragem: corte.metragem_cortada,
        placa: corte.placa_origem || null,
        corte_origem: corte.codigo_corte
    };
};

