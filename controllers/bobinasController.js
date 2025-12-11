const db = require('../config/database');

// Gerar código QR único para bobina (formato: BOB-0001)
async function gerarCodigoQR() {
    // Buscar último código
    const [rows] = await db.query(
        `SELECT codigo_interno FROM bobinas 
         WHERE codigo_interno LIKE 'BOB-%' 
         ORDER BY id DESC LIMIT 1`
    );
    
    let proximoNumero = 1;
    if (rows.length > 0) {
        const ultimoCodigo = rows[0].codigo_interno;
        const numeroAtual = parseInt(ultimoCodigo.split('-')[1]);
        proximoNumero = numeroAtual + 1;
    }
    
    return `BOB-${proximoNumero.toString().padStart(4, '0')}`;
}

// Manter função legada para compatibilidade (deprecated)
async function gerarCodigoInterno(loja) {
    return await gerarCodigoQR();
}

// Criar nova bobina
exports.criarBobina = async (req, res) => {
    try {
        const { 
            nota_fiscal, 
            loja, 
            produto_id, 
            metragem_inicial, 
            placa,
            observacoes 
        } = req.body;
        
        console.log('📝 Criando bobina:', { nota_fiscal, loja, produto_id, metragem_inicial, placa });
        
        // Validações
        if (!nota_fiscal || !loja || !produto_id || !metragem_inicial) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nota fiscal, loja, produto e metragem são obrigatórios' 
            });
        }
        
        if (metragem_inicial <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Metragem deve ser maior que zero' 
            });
        }
        
        // Validar se a PLACA já existe (se fornecida)
        if (placa) {
            console.log('🔍 Verificando PLACA duplicada:', placa);
            try {
                const [existente] = await db.query(
                    'SELECT id, codigo_interno FROM bobinas WHERE placa = ?',
                    [placa]
                );
                
                if (existente.length > 0) {
                    console.log('❌ PLACA duplicada encontrada:', existente[0].codigo_interno);
                    return res.status(400).json({
                        success: false,
                        error: `PLACA já cadastrada na bobina ${existente[0].codigo_interno}`
                    });
                }
            } catch (placaCheckError) {
                // Se coluna placa não existe, ignorar validação (será criada na migration)
                console.log('⚠️ Validação de PLACA ignorada (coluna não existe ainda)');
            }
        }
        
        // Gerar código interno único
        console.log('🔢 Gerando código interno...');
        const codigo_interno = await gerarCodigoInterno(loja);
        console.log('✓ Código gerado:', codigo_interno);
        
        // Inserir bobina
        console.log('💾 Inserindo bobina no banco...');
        
        // Tentar inserir COM placa (se migration 027 já rodou)
        try {
            const [result] = await db.query(
                `INSERT INTO bobinas 
                (codigo_interno, nota_fiscal, loja, produto_id, metragem_inicial, metragem_atual, placa, observacoes, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Disponível')`,
                [codigo_interno, nota_fiscal, loja, produto_id, metragem_inicial, metragem_inicial, placa || null, observacoes || null]
            );
            console.log('✓ Bobina inserida COM placa, ID:', result.insertId);
            
            // Buscar bobina criada com dados do produto
            const [bobina] = await db.query(
                `SELECT 
                    b.*,
                    p.codigo,
                    p.fabricante,
                    p.tipo_tecido,
                    p.largura_sem_costura,
                    p.tipo_bainha,
                    p.largura_final,
                    p.largura_maior,
                    p.largura_y,
                    c.nome_cor,
                    g.gramatura
                FROM bobinas b
                JOIN produtos p ON b.produto_id = p.id
                JOIN configuracoes_cores c ON p.cor_id = c.id
                JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
                WHERE b.id = ?`,
                [result.insertId]
            );
            
            res.json({ 
                success: true, 
                data: bobina[0],
                message: 'Bobina registrada com sucesso!' 
            });
            
        } catch (insertError) {
            // Se der erro de coluna não existente, tentar SEM placa (fallback)
            if (insertError.message.includes('placa') || insertError.code === 'ER_BAD_FIELD_ERROR') {
                console.log('⚠️ Coluna placa não existe ainda, inserindo SEM placa...');
                
                const [result] = await db.query(
                    `INSERT INTO bobinas 
                    (codigo_interno, nota_fiscal, loja, produto_id, metragem_inicial, metragem_atual, observacoes, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'Disponível')`,
                    [codigo_interno, nota_fiscal, loja, produto_id, metragem_inicial, metragem_inicial, observacoes || null]
                );
                console.log('✓ Bobina inserida SEM placa (fallback), ID:', result.insertId);
                
                // Buscar bobina criada
                const [bobina] = await db.query(
                    `SELECT 
                        b.*,
                        p.codigo,
                        p.fabricante,
                        p.tipo_tecido,
                        p.largura_sem_costura,
                        p.tipo_bainha,
                        p.largura_final,
                        p.largura_maior,
                        p.largura_y,
                        c.nome_cor,
                        g.gramatura
                    FROM bobinas b
                    JOIN produtos p ON b.produto_id = p.id
                    JOIN configuracoes_cores c ON p.cor_id = c.id
                    JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
                    WHERE b.id = ?`,
                    [result.insertId]
                );
                
                res.json({ 
                    success: true, 
                    data: bobina[0],
                    message: 'Bobina registrada com sucesso! (Aguardando migration para campo PLACA)' 
                });
            } else {
                // Se for outro erro, lançar
                throw insertError;
            }
        }
        
    } catch (error) {
        console.error('Erro ao criar bobina:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao criar bobina: ' + error.message 
        });
    }
};

// Listar produtos com total de bobinas (para acordeão)
exports.listarProdutosComBobinas = async (req, res) => {
    try {
        const [produtos] = await db.query(
            `SELECT 
                p.id,
                p.loja,
                p.codigo,
                p.fabricante,
                p.tipo_tecido,
                p.largura_sem_costura,
                p.tipo_bainha,
                p.largura_final,
                p.largura_maior,
                p.largura_y,
                c.nome_cor,
                g.gramatura,
                COUNT(DISTINCT b.id) as total_bobinas,
                COUNT(DISTINCT r.id) as total_retalhos,
                COALESCE(SUM(b.metragem_atual), 0) as metragem_bobinas,
                COALESCE(SUM(r.metragem), 0) as metragem_retalhos,
                COALESCE(SUM(b.metragem_atual), 0) + COALESCE(SUM(r.metragem), 0) as metragem_total,
                COALESCE(SUM(b.metragem_reservada), 0) as reservada_bobinas,
                COALESCE(SUM(r.metragem_reservada), 0) as reservada_retalhos,
                COALESCE(SUM(b.metragem_reservada), 0) + COALESCE(SUM(r.metragem_reservada), 0) as metragem_reservada,
                (COALESCE(SUM(b.metragem_atual), 0) + COALESCE(SUM(r.metragem), 0)) - 
                (COALESCE(SUM(b.metragem_reservada), 0) + COALESCE(SUM(r.metragem_reservada), 0)) as metragem_disponivel
            FROM produtos p
            LEFT JOIN bobinas b ON p.id = b.produto_id AND (b.status IS NULL OR b.status != 'Esgotado') AND b.metragem_atual > 0
            LEFT JOIN retalhos r ON p.id = r.produto_id AND (r.status IS NULL OR r.status != 'Esgotado') AND r.metragem > 0
            LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
            LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE p.ativo = 1
            GROUP BY p.id
            HAVING (total_bobinas > 0 OR total_retalhos > 0)
            ORDER BY p.loja, p.codigo`
        );
        
        res.json({ success: true, data: produtos });
        
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao listar produtos: ' + error.message 
        });
    }
};

// Listar bobinas de um produto específico
exports.listarBobinasPorProduto = async (req, res) => {
    try {
        const { produto_id } = req.params;
        
        const [bobinas] = await db.query(
            `SELECT 
                b.*,
                p.codigo,
                p.fabricante,
                c.nome_cor,
                g.gramatura
            FROM bobinas b
            JOIN produtos p ON b.produto_id = p.id
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE b.produto_id = ? 
              AND (b.status IS NULL OR b.status != 'Esgotado') 
              AND b.metragem_atual > 0
            ORDER BY b.data_entrada DESC`,
            [produto_id]
        );
        
        res.json({ success: true, data: bobinas });
        
    } catch (error) {
        console.error('Erro ao listar bobinas:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao listar bobinas: ' + error.message 
        });
    }
};

// Buscar bobina por código interno (para etiqueta)
exports.buscarBobinaPorCodigo = async (req, res) => {
    try {
        const { codigo_interno } = req.params;
        
        const [bobina] = await db.query(
            `SELECT 
                b.*,
                p.codigo,
                p.fabricante,
                p.tipo_tecido,
                p.largura_sem_costura,
                p.tipo_bainha,
                p.largura_final,
                p.largura_maior,
                p.largura_y,
                c.nome_cor,
                g.gramatura
            FROM bobinas b
            JOIN produtos p ON b.produto_id = p.id
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE b.codigo_interno = ?`,
            [codigo_interno]
        );
        
        if (bobina.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Bobina não encontrada' 
            });
        }
        
        res.json({ success: true, data: bobina[0] });
        
    } catch (error) {
        console.error('Erro ao buscar bobina:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar bobina: ' + error.message 
        });
    }
};

// Buscar produto por loja + fabricante + código
exports.buscarProduto = async (req, res) => {
    try {
        const { loja, codigo } = req.query;
        
        if (!loja || !codigo) {
            return res.status(400).json({ 
                success: false, 
                error: 'Loja e código são obrigatórios' 
            });
        }
        
        const [produto] = await db.query(
            `SELECT 
                p.*,
                c.nome_cor,
                g.gramatura
            FROM produtos p
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE p.loja = ? AND p.codigo = ? AND p.ativo = 1`,
            [loja, codigo]
        );
        
        if (produto.length === 0) {
            return res.json({ 
                success: true, 
                found: false,
                message: 'Produto não encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            found: true,
            data: produto[0] 
        });
        
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar produto: ' + error.message 
        });
    }
};

// Excluir bobina
exports.excluirBobina = async (req, res) => {
    try {
        const { id } = req.params;
        const { forcado } = req.query;
        
        // Se for exclusão forçada, excluir dependências primeiro
        if (forcado === 'true') {
            console.log(`⚠️ Exclusão forçada da bobina ID ${id} - removendo dependências...`);
            
            // 1. Excluir retalhos vinculados
            const [retalhosExcluidos] = await db.query(
                'DELETE FROM retalhos WHERE bobina_origem_id = ?',
                [id]
            );
            console.log(`✓ ${retalhosExcluidos.affectedRows} retalho(s) excluído(s)`);
            
            // 2. Excluir alocações em planos de corte
            const [alocacoesExcluidas] = await db.query(
                'DELETE FROM alocacoes_corte WHERE bobina_id = ?',
                [id]
            );
            console.log(`✓ ${alocacoesExcluidas.affectedRows} alocação(ões) excluída(s)`);
            
            // 3. Excluir a bobina
            await db.query('DELETE FROM bobinas WHERE id = ?', [id]);
            console.log(`✓ Bobina ID ${id} excluída com sucesso`);
            
            return res.json({ 
                success: true, 
                message: `Bobina e ${retalhosExcluidos.affectedRows} dependência(s) excluídas com sucesso!` 
            });
        }
        
        // Exclusão normal - verificar dependências
        
        // Verificar se existem retalhos vinculados
        const [retalhos] = await db.query(
            'SELECT COUNT(*) as total FROM retalhos WHERE bobina_origem_id = ?',
            [id]
        );
        
        if (retalhos[0].total > 0) {
            return res.status(400).json({
                success: false,
                error: `Não é possível excluir esta bobina pois existem ${retalhos[0].total} retalho(s) vinculado(s) a ela.`
            });
        }
        
        // Verificar se existem alocações em planos de corte
        const [alocacoes] = await db.query(
            'SELECT COUNT(*) as total FROM alocacoes_corte WHERE bobina_id = ?',
            [id]
        );
        
        if (alocacoes[0].total > 0) {
            return res.status(400).json({
                success: false,
                error: 'Não é possível excluir esta bobina pois ela está alocada em planos de corte. Remova as alocações primeiro.'
            });
        }
        
        // Se passou pelas validações, pode excluir
        await db.query('DELETE FROM bobinas WHERE id = ?', [id]);
        
        res.json({ 
            success: true, 
            message: 'Bobina excluída com sucesso!' 
        });
        
    } catch (error) {
        console.error('Erro ao excluir bobina:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao excluir bobina: ' + error.message 
        });
    }
};
