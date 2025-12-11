const db = require('../config/database');

// Gerar código QR único para retalho (formato: RET-{LOJA}-{SEQUENCIAL})
// Conforme PADRONIZACAO_CODIGOS.md
async function gerarCodigoRetalho(loja, connection = null) {
    const dbConn = connection || db;
    
    try {
        // Determinar prefixo da loja
        const prefixoLoja = loja === 'Cortinave' ? 'PLA' : 'CIA';
        console.log('🔢 Gerando código para loja:', loja, '→ Prefixo:', prefixoLoja);
        
        // Buscar último código RET com LIKE ao invés de REGEXP (mais compatível)
        const [rows] = await dbConn.query(
            `SELECT codigo_retalho FROM retalhos 
             WHERE codigo_retalho LIKE 'RET-%-%'
             AND LENGTH(codigo_retalho) = 14
             ORDER BY id DESC LIMIT 1`
        );
        
        let proximoNumero = 1;
        if (rows.length > 0) {
            const ultimoCodigo = rows[0].codigo_retalho;
            console.log('📋 Último código encontrado:', ultimoCodigo);
            // Formato: RET-XXX-000001, pegar o último grupo de números
            const partes = ultimoCodigo.split('-');
            if (partes.length === 3 && !isNaN(partes[2])) {
                const numeroAtual = parseInt(partes[2]);
                if (numeroAtual > 0) {
                    proximoNumero = numeroAtual + 1;
                }
            }
        }
        
        const novoCodigo = `RET-${prefixoLoja}-${proximoNumero.toString().padStart(6, '0')}`;
        console.log('✅ Novo código gerado:', novoCodigo);
        return novoCodigo;
        
    } catch (error) {
        console.error('❌ Erro ao gerar código de retalho:', error);
        throw error;
    }
}

// Criar retalho manualmente
exports.criarRetalho = async (req, res) => {
    try {
        const { produto_id, metragem, locacao, observacoes } = req.body;
        
        if (!produto_id || !metragem) {
            return res.status(400).json({ 
                success: false, 
                error: 'Produto e metragem são obrigatórios' 
            });
        }
        
        // Buscar loja do produto para gerar código correto
        const [produtos] = await db.query('SELECT loja FROM produtos WHERE id = ?', [produto_id]);
        if (produtos.length === 0) {
            return res.status(404).json({ success: false, error: 'Produto não encontrado' });
        }
        const loja = produtos[0].loja;
        
        // Gerar código único
        const codigo_retalho = await gerarCodigoRetalho(loja);
        
        // Inserir retalho
        const [result] = await db.query(
            `INSERT INTO retalhos 
            (codigo_retalho, produto_id, metragem, locacao, observacoes) 
            VALUES (?, ?, ?, ?, ?)`,
            [codigo_retalho, produto_id, metragem, locacao || null, observacoes || null]
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
    const connection = await db.getConnection();
    
    try {
        const { bobina_id } = req.params;
        console.log('🔄 Iniciando conversão da bobina ID:', bobina_id);
        
        await connection.beginTransaction();
        
        // Buscar dados da bobina COM LOCK
        const [bobinas] = await connection.query(
            `SELECT 
                b.*,
                p.id as produto_id,
                p.codigo,
                p.loja
            FROM bobinas b
            JOIN produtos p ON b.produto_id = p.id
            WHERE b.id = ? FOR UPDATE`,
            [bobina_id]
        );
        
        if (bobinas.length === 0) {
            await connection.rollback();
            console.log('❌ Bobina não encontrada:', bobina_id);
            return res.status(404).json({ 
                success: false, 
                error: 'Bobina não encontrada' 
            });
        }
        
        const bobina = bobinas[0];
        console.log('📦 Bobina encontrada:', bobina.codigo_interno);
        console.log('   Produto ID:', bobina.produto_id);
        console.log('   Metragem:', bobina.metragem_atual);
        console.log('   Metragem Reservada:', bobina.metragem_reservada);
        console.log('   Loja:', bobina.loja);
        
        // Verificar se bobina tem metragem reservada (forma simples de checar se está em uso)
        // Conforme PADRONIZACAO_BANCO.md: metragem_reservada indica uso em planos
        const metragemReservada = parseFloat(bobina.metragem_reservada || 0);
        if (metragemReservada > 0) {
            await connection.rollback();
            console.log('❌ Bobina com metragem reservada:', metragemReservada);
            return res.status(400).json({
                success: false,
                error: `Bobina possui ${metragemReservada.toFixed(2)}m reservados em planos de corte. Finalize ou cancele os planos antes de converter.`
            });
        }
        
        // Gerar código do retalho
        console.log('🏷️ Gerando código de retalho para loja:', bobina.loja);
        const codigo_retalho = await gerarCodigoRetalho(bobina.loja, connection);
        console.log('✅ Código gerado:', codigo_retalho);
        
        // Verificar se coluna placa existe em retalhos
        console.log('🔍 Verificando estrutura da tabela retalhos...');
        const [colunas] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'retalhos' 
            AND COLUMN_NAME = 'placa'
        `);
        
        const temPlaca = colunas.length > 0;
        console.log('   Coluna placa existe?', temPlaca);
        
        // Criar retalho (COM ou SEM placa dependendo do schema)
        console.log('💾 Inserindo retalho no banco...');
        console.log('   Placa da bobina:', bobina.placa || 'Sem placa');
        
        let result;
        if (temPlaca) {
            // INSERT com placa
            [result] = await connection.query(
                `INSERT INTO retalhos 
                (codigo_retalho, produto_id, metragem, bobina_origem_id, placa, observacoes) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    codigo_retalho, 
                    bobina.produto_id, 
                    bobina.metragem_atual,
                    bobina_id,
                    bobina.placa || null, // HERDA PLACA da bobina
                    `Convertido da bobina ${bobina.codigo_interno}`
                ]
            );
        } else {
            // INSERT sem placa (fallback)
            console.log('⚠️ Tabela sem coluna placa, inserindo sem ela');
            [result] = await connection.query(
                `INSERT INTO retalhos 
                (codigo_retalho, produto_id, metragem, bobina_origem_id, observacoes) 
                VALUES (?, ?, ?, ?, ?)`,
                [
                    codigo_retalho, 
                    bobina.produto_id, 
                    bobina.metragem_atual,
                    bobina_id,
                    `Convertido da bobina ${bobina.codigo_interno}`
                ]
            );
        }
        
        const retalho_id = result.insertId;
        console.log('✅ Retalho criado com ID:', retalho_id);
        
        // MARCAR bobina como vazia ao invés de excluir
        // Status ENUM: 'Disponível', 'Em Uso', 'Vazia', 'Bloqueada'
        await connection.query(
            `UPDATE bobinas SET metragem_atual = 0, status = 'Vazia' WHERE id = ?`,
            [bobina_id]
        );
        console.log(`✅ Bobina ${bobina.codigo_interno} marcada como Vazia`);
        
        await connection.commit();
        
        // Buscar retalho criado para retornar
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
            message: 'Bobina convertida em retalho com sucesso!',
            data: {
                codigo_retalho: retalho[0].codigo_retalho,
                retalho: retalho[0]
            }
        });
        
    } catch (error) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('❌ Erro ao fazer rollback:', rollbackError.message);
        }
        
        console.error('❌❌❌ ERRO CRÍTICO AO CONVERTER BOBINA ❌❌❌');
        console.error('Bobina ID:', req.params.bobina_id);
        console.error('Tipo do erro:', error.constructor.name);
        console.error('Mensagem:', error.message);
        console.error('Code:', error.code);
        console.error('errno:', error.errno);
        console.error('sqlState:', error.sqlState);
        console.error('sqlMessage:', error.sqlMessage);
        console.error('sql:', error.sql);
        console.error('Stack completo:', error.stack);
        console.error('❌❌❌ FIM DO ERRO ❌❌❌');
        
        res.status(500).json({ 
            success: false, 
            error: `Erro ao converter bobina: ${error.message}`,
            errorCode: error.code,
            errorType: error.constructor.name,
            sqlState: error.sqlState,
            details: process.env.NODE_ENV === 'production' ? undefined : {
                stack: error.stack,
                sql: error.sql
            }
        });
    } finally {
        try {
            connection.release();
        } catch (releaseError) {
            console.error('❌ Erro ao liberar conexão:', releaseError.message);
        }
    }
};

// Listar todos os retalhos
exports.listarRetalhos = async (req, res) => {
    try {
        // Query com campos padronizados
        // IMPORTANTE: Não retornar retalhos esgotados (metragem zerada ou status Esgotado)
        let query = `
            SELECT 
                r.id,
                r.codigo_retalho,
                r.qr_code,
                r.produto_id,
                r.metragem,
                r.metragem_reservada,
                r.locacao,
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
            WHERE r.metragem > 0 AND (r.status IS NULL OR r.status != 'Esgotado')
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
                    r.locacao,
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
                WHERE r.metragem > 0 AND (r.status IS NULL OR r.status != 'Esgotado')
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
        const { locacao, metragem, observacoes } = req.body;
        
        // Verificar se retalho existe
        const [retalhos] = await db.query(
            'SELECT locacao FROM retalhos WHERE id = ?',
            [id]
        );
        
        if (retalhos.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Retalho não encontrado' 
            });
        }
        
        const locacaoAnterior = retalhos[0].locacao;
        
        // Atualizar retalho
        const updates = [];
        const values = [];
        
        if (locacao !== undefined) {
            updates.push('locacao = ?');
            values.push(locacao);
            
            // Registrar no histórico se localização mudou
            if (locacaoAnterior !== locacao) {
                try {
                    await db.query(
                        `INSERT INTO historico_localizacao_retalhos 
                        (retalho_id, localizacao) VALUES (?, ?)`,
                        [id, locacao]
                    );
                } catch (e) {
                    // Tabela de histórico pode não existir
                    console.log('⚠️ historico_localizacao_retalhos não existe');
                }
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
        
        // Nota: Se o retalho veio de uma bobina convertida, a bobina foi EXCLUÍDA
        // Não é possível reverter, apenas excluir o retalho
        
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
    
    // Buscar loja do produto
    const [produtos] = await db.query('SELECT loja FROM produtos WHERE id = ?', [corte.produto_id]);
    const loja = produtos[0]?.loja || 'Cortinave';
    
    // Gerar código do retalho
    const codigo_retalho = await gerarCodigoRetalho(loja);
    
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

