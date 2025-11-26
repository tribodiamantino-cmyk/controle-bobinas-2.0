const db = require('../config/database');

// Gerar código único para plano de corte: PC-2025-00001
async function gerarCodigoPlano() {
    const ano = new Date().getFullYear();
    const prefixo = 'PC';
    
    const [ultimoCodigo] = await db.query(
        `SELECT codigo_plano FROM planos_corte 
         WHERE codigo_plano LIKE '${prefixo}-${ano}-%' 
         ORDER BY id DESC LIMIT 1`
    );
    
    let numero = 1;
    if (ultimoCodigo.length > 0) {
        const partes = ultimoCodigo[0].codigo_plano.split('-');
        numero = parseInt(partes[2]) + 1;
    }
    
    return `${prefixo}-${ano}-${String(numero).padStart(5, '0')}`;
}

// Criar novo plano de corte
exports.criarPlano = async (req, res) => {
    try {
        const { cliente, aviario, itens } = req.body;
        
        if (!cliente || !aviario || !itens || itens.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Cliente, aviário e itens são obrigatórios' 
            });
        }
        
        // Gerar código único
        const codigo_plano = await gerarCodigoPlano();
        
        // Inserir plano de corte
        const [resultPlano] = await db.query(
            `INSERT INTO planos_corte (codigo_plano, cliente, aviario) 
             VALUES (?, ?, ?)`,
            [codigo_plano, cliente, aviario]
        );
        
        const planoId = resultPlano.insertId;
        
        // Inserir itens do plano
        for (let i = 0; i < itens.length; i++) {
            const item = itens[i];
            
            // Validar metragem disponível
            const [estoque] = await db.query(`
                SELECT 
                    COALESCE(SUM(b.metragem_atual - COALESCE(b.metragem_reservada, 0)), 0) +
                    COALESCE(SUM(r.metragem - COALESCE(r.metragem_reservada, 0)), 0) as metragem_disponivel
                FROM produtos p
                LEFT JOIN bobinas b ON b.produto_id = p.id AND b.status = 'Disponível' AND b.convertida_em_retalho = FALSE
                LEFT JOIN retalhos r ON r.produto_id = p.id AND r.status = 'Disponível'
                WHERE p.id = ?
            `, [item.produto_id]);
            
            if (estoque[0].metragem_disponivel < item.metragem) {
                return res.status(400).json({ 
                    success: false, 
                    error: `Estoque insuficiente para o produto ${item.produto_id}. Disponível: ${estoque[0].metragem_disponivel}m, Necessário: ${item.metragem}m` 
                });
            }
            
            await db.query(
                `INSERT INTO itens_plano_corte (plano_corte_id, produto_id, metragem, observacoes, ordem) 
                 VALUES (?, ?, ?, ?, ?)`,
                [planoId, item.produto_id, item.metragem, item.observacoes || null, i + 1]
            );
        }
        
        // Buscar plano criado com dados completos
        const [plano] = await db.query(`
            SELECT 
                pc.*,
                COUNT(ipc.id) as total_itens,
                SUM(ipc.metragem) as metragem_total
            FROM planos_corte pc
            LEFT JOIN itens_plano_corte ipc ON ipc.plano_corte_id = pc.id
            WHERE pc.id = ?
            GROUP BY pc.id
        `, [planoId]);
        
        res.json({ 
            success: true, 
            data: plano[0],
            message: `Plano de corte ${codigo_plano} criado com sucesso!` 
        });
        
    } catch (error) {
        console.error('Erro ao criar plano de corte:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Listar planos de corte (com filtro por status)
exports.listarPlanos = async (req, res) => {
    try {
        const { status } = req.query;
        
        let query = `
            SELECT 
                pc.*,
                COUNT(DISTINCT ipc.id) as total_itens,
                SUM(ipc.metragem) as metragem_total,
                COUNT(DISTINCT ac.id) as total_alocacoes,
                SUM(CASE WHEN ac.confirmado = TRUE THEN 1 ELSE 0 END) as alocacoes_confirmadas
            FROM planos_corte pc
            LEFT JOIN itens_plano_corte ipc ON ipc.plano_corte_id = pc.id
            LEFT JOIN alocacoes_corte ac ON ac.item_plano_corte_id = ipc.id
        `;
        
        const params = [];
        
        if (status) {
            query += ` WHERE pc.status = ?`;
            params.push(status);
        }
        
        query += ` GROUP BY pc.id ORDER BY pc.data_criacao DESC`;
        
        const [planos] = await db.query(query, params);
        
        res.json({ 
            success: true, 
            data: planos 
        });
        
    } catch (error) {
        console.error('Erro ao listar planos:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Buscar plano de corte por ID (com itens e alocações)
exports.buscarPlanoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar plano
        const [planos] = await db.query(`
            SELECT * FROM planos_corte WHERE id = ?
        `, [id]);
        
        if (planos.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Plano de corte não encontrado' 
            });
        }
        
        const plano = planos[0];
        
        // Buscar itens com dados do produto
        const [itens] = await db.query(`
            SELECT 
                ipc.*,
                p.codigo,
                p.loja,
                c.nome_cor,
                g.gramatura,
                p.tipo_tecido
            FROM itens_plano_corte ipc
            JOIN produtos p ON p.id = ipc.produto_id
            JOIN configuracoes_cores c ON c.id = p.cor_id
            JOIN configuracoes_gramaturas g ON g.id = p.gramatura_id
            WHERE ipc.plano_corte_id = ?
            ORDER BY ipc.ordem
        `, [id]);
        
        // Para cada item, buscar alocação se existir
        for (let item of itens) {
            const [alocacoes] = await db.query(`
                SELECT 
                    ac.*,
                    CASE 
                        WHEN ac.tipo_origem = 'bobina' THEN b.codigo_interno
                        WHEN ac.tipo_origem = 'retalho' THEN r.codigo_retalho
                    END as codigo_origem,
                    CASE 
                        WHEN ac.tipo_origem = 'bobina' THEN b.metragem_atual
                        WHEN ac.tipo_origem = 'retalho' THEN r.metragem
                    END as metragem_origem,
                    CASE 
                        WHEN ac.tipo_origem = 'bobina' THEN b.localizacao_atual
                        WHEN ac.tipo_origem = 'retalho' THEN r.localizacao_atual
                    END as localizacao_origem,
                    CASE 
                        WHEN ac.tipo_origem = 'bobina' THEN b.nota_fiscal
                        ELSE NULL
                    END as nota_fiscal
                FROM alocacoes_corte ac
                LEFT JOIN bobinas b ON b.id = ac.bobina_id
                LEFT JOIN retalhos r ON r.id = ac.retalho_id
                WHERE ac.item_plano_corte_id = ?
            `, [item.id]);
            
            item.alocacao = alocacoes[0] || null;
        }
        
        plano.itens = itens;
        
        res.json({ 
            success: true, 
            data: plano 
        });
        
    } catch (error) {
        console.error('Erro ao buscar plano:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Sugerir origens automaticamente para todos os cortes
exports.sugerirAlocacoes = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar itens do plano
        const [itens] = await db.query(`
            SELECT * FROM itens_plano_corte WHERE plano_corte_id = ? ORDER BY ordem
        `, [id]);
        
        const sugestoes = [];
        
        for (const item of itens) {
            const sugestao = await sugerirOrigemParaCorte(item.produto_id, item.metragem);
            sugestoes.push({
                item_id: item.id,
                produto_id: item.produto_id,
                metragem_corte: item.metragem,
                sugestao: sugestao
            });
        }
        
        res.json({ 
            success: true, 
            data: sugestoes 
        });
        
    } catch (error) {
        console.error('Erro ao sugerir alocações:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Função auxiliar: sugerir melhor origem para um corte
async function sugerirOrigemParaCorte(produtoId, metragem) {
    // 1. PRIORIDADE: RETALHOS (aproveitar sobras)
    const [retalhos] = await db.query(`
        SELECT 
            r.*,
            'retalho' as tipo_origem,
            (r.metragem - COALESCE(r.metragem_reservada, 0)) as metragem_disponivel
        FROM retalhos r
        WHERE r.produto_id = ?
            AND r.status = 'Disponível'
            AND (r.metragem - COALESCE(r.metragem_reservada, 0)) >= ?
        ORDER BY (r.metragem - ?) ASC
        LIMIT 1
    `, [produtoId, metragem, metragem]);
    
    if (retalhos.length > 0) {
        return {
            tipo: 'retalho',
            id: retalhos[0].id,
            codigo: retalhos[0].codigo_retalho,
            metragem_total: parseFloat(retalhos[0].metragem),
            metragem_disponivel: parseFloat(retalhos[0].metragem_disponivel),
            localizacao: retalhos[0].localizacao_atual,
            motivo: 'Retalho com tamanho próximo',
            prioridade: 'alta'
        };
    }
    
    // 2. BOBINAS MENORES (preservar bobinas grandes)
    const [bobinas] = await db.query(`
        SELECT 
            b.*,
            'bobina' as tipo_origem,
            (b.metragem_atual - COALESCE(b.metragem_reservada, 0)) as metragem_disponivel
        FROM bobinas b
        WHERE b.produto_id = ?
            AND b.status = 'Disponível'
            AND b.convertida_em_retalho = FALSE
            AND (b.metragem_atual - COALESCE(b.metragem_reservada, 0)) >= ?
        ORDER BY b.metragem_atual ASC
        LIMIT 1
    `, [produtoId, metragem]);
    
    if (bobinas.length > 0) {
        return {
            tipo: 'bobina',
            id: bobinas[0].id,
            codigo: bobinas[0].codigo_interno,
            metragem_total: parseFloat(bobinas[0].metragem_atual),
            metragem_disponivel: parseFloat(bobinas[0].metragem_disponivel),
            nota_fiscal: bobinas[0].nota_fiscal,
            localizacao: bobinas[0].localizacao_atual,
            motivo: 'Bobina menor disponível',
            prioridade: 'media'
        };
    }
    
    // 3. SEM ESTOQUE SUFICIENTE
    const [maxDisponivel] = await db.query(`
        SELECT MAX(metragem_disponivel) as max_metragem
        FROM (
            SELECT (metragem - COALESCE(metragem_reservada, 0)) as metragem_disponivel
            FROM retalhos WHERE produto_id = ? AND status = 'Disponível'
            UNION ALL
            SELECT (metragem_atual - COALESCE(metragem_reservada, 0)) as metragem_disponivel
            FROM bobinas WHERE produto_id = ? AND status = 'Disponível' AND convertida_em_retalho = FALSE
        ) as disponiveis
    `, [produtoId, produtoId]);
    
    return {
        tipo: null,
        erro: 'Estoque insuficiente',
        metragem_solicitada: parseFloat(metragem),
        metragem_maxima_disponivel: parseFloat(maxDisponivel[0].max_metragem || 0),
        prioridade: 'critica'
    };
}

// Alocar origem para um corte
exports.alocarOrigem = async (req, res) => {
    try {
        const { item_id, tipo_origem, origem_id } = req.body;
        
        if (!item_id || !tipo_origem || !origem_id) {
            return res.status(400).json({ 
                success: false, 
                error: 'Item, tipo de origem e ID da origem são obrigatórios' 
            });
        }
        
        // Buscar item
        const [itens] = await db.query(`
            SELECT * FROM itens_plano_corte WHERE id = ?
        `, [item_id]);
        
        if (itens.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Item não encontrado' 
            });
        }
        
        const item = itens[0];
        
        // Verificar se origem tem metragem disponível
        let metragemDisponivel = 0;
        
        if (tipo_origem === 'bobina') {
            const [bobinas] = await db.query(`
                SELECT (metragem_atual - COALESCE(metragem_reservada, 0)) as disponivel
                FROM bobinas WHERE id = ?
            `, [origem_id]);
            
            if (bobinas.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Bobina não encontrada' 
                });
            }
            
            metragemDisponivel = bobinas[0].disponivel;
        } else {
            const [retalhos] = await db.query(`
                SELECT (metragem - COALESCE(metragem_reservada, 0)) as disponivel
                FROM retalhos WHERE id = ?
            `, [origem_id]);
            
            if (retalhos.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    error: 'Retalho não encontrado' 
                });
            }
            
            metragemDisponivel = retalhos[0].disponivel;
        }
        
        if (metragemDisponivel < item.metragem) {
            return res.status(400).json({ 
                success: false, 
                error: `Metragem insuficiente na origem selecionada. Disponível: ${metragemDisponivel}m, Necessário: ${item.metragem}m` 
            });
        }
        
        // Verificar se já existe alocação
        const [alocacoesExistentes] = await db.query(`
            SELECT id FROM alocacoes_corte WHERE item_plano_corte_id = ?
        `, [item_id]);
        
        if (alocacoesExistentes.length > 0) {
            // Atualizar alocação existente
            await db.query(`
                UPDATE alocacoes_corte 
                SET tipo_origem = ?, 
                    bobina_id = ?, 
                    retalho_id = ?,
                    metragem_alocada = ?
                WHERE item_plano_corte_id = ?
            `, [
                tipo_origem,
                tipo_origem === 'bobina' ? origem_id : null,
                tipo_origem === 'retalho' ? origem_id : null,
                item.metragem,
                item_id
            ]);
        } else {
            // Criar nova alocação
            await db.query(`
                INSERT INTO alocacoes_corte 
                (item_plano_corte_id, tipo_origem, bobina_id, retalho_id, metragem_alocada)
                VALUES (?, ?, ?, ?, ?)
            `, [
                item_id,
                tipo_origem,
                tipo_origem === 'bobina' ? origem_id : null,
                tipo_origem === 'retalho' ? origem_id : null,
                item.metragem
            ]);
        }
        
        res.json({ 
            success: true, 
            message: 'Origem alocada com sucesso!' 
        });
        
    } catch (error) {
        console.error('Erro ao alocar origem:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Enviar plano para produção (reservar metragens)
exports.enviarParaProducao = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se plano existe
        const [planos] = await db.query(`
            SELECT * FROM planos_corte WHERE id = ?
        `, [id]);
        
        if (planos.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Plano de corte não encontrado' 
            });
        }
        
        const plano = planos[0];
        
        if (plano.status !== 'planejamento') {
            return res.status(400).json({ 
                success: false, 
                error: 'Plano já foi enviado para produção' 
            });
        }
        
        // Verificar se todos os itens têm alocação
        const [itensNaoAlocados] = await db.query(`
            SELECT ipc.id
            FROM itens_plano_corte ipc
            LEFT JOIN alocacoes_corte ac ON ac.item_plano_corte_id = ipc.id
            WHERE ipc.plano_corte_id = ? AND ac.id IS NULL
        `, [id]);
        
        if (itensNaoAlocados.length > 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Todos os cortes devem ter uma origem alocada antes de enviar para produção' 
            });
        }
        
        // Buscar alocações
        const [alocacoes] = await db.query(`
            SELECT ac.*, ipc.plano_corte_id
            FROM alocacoes_corte ac
            JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
            WHERE ipc.plano_corte_id = ?
        `, [id]);
        
        // Reservar metragens
        for (const alocacao of alocacoes) {
            if (alocacao.tipo_origem === 'bobina') {
                await db.query(`
                    UPDATE bobinas 
                    SET metragem_reservada = metragem_reservada + ?
                    WHERE id = ?
                `, [alocacao.metragem_alocada, alocacao.bobina_id]);
            } else {
                await db.query(`
                    UPDATE retalhos 
                    SET metragem_reservada = metragem_reservada + ?
                    WHERE id = ?
                `, [alocacao.metragem_alocada, alocacao.retalho_id]);
            }
        }
        
        // Atualizar status do plano
        await db.query(`
            UPDATE planos_corte SET status = 'em_producao' WHERE id = ?
        `, [id]);
        
        res.json({ 
            success: true, 
            message: 'Plano enviado para produção com sucesso!' 
        });
        
    } catch (error) {
        console.error('Erro ao enviar para produção:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Finalizar plano de corte (dar baixa definitiva)
exports.finalizarPlano = async (req, res) => {
    try {
        const { id } = req.params;
        const { confirmacoes } = req.body; // Array de { item_id, manter_origem: true/false, nova_origem: {...} }
        
        // Buscar plano
        const [planos] = await db.query(`
            SELECT * FROM planos_corte WHERE id = ?
        `, [id]);
        
        if (planos.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Plano de corte não encontrado' 
            });
        }
        
        const plano = planos[0];
        
        if (plano.status !== 'em_producao') {
            return res.status(400).json({ 
                success: false, 
                error: 'Apenas planos em produção podem ser finalizados' 
            });
        }
        
        // Processar cada confirmação
        for (const confirmacao of confirmacoes) {
            const [alocacoes] = await db.query(`
                SELECT ac.*
                FROM alocacoes_corte ac
                WHERE ac.item_plano_corte_id = ?
            `, [confirmacao.item_id]);
            
            if (alocacoes.length === 0) continue;
            
            const alocacao = alocacoes[0];
            
            // Se usuário trocou a origem, atualizar alocação
            if (!confirmacao.manter_origem && confirmacao.nova_origem) {
                // Liberar reserva da origem antiga
                if (alocacao.tipo_origem === 'bobina') {
                    await db.query(`
                        UPDATE bobinas 
                        SET metragem_reservada = metragem_reservada - ?
                        WHERE id = ?
                    `, [alocacao.metragem_alocada, alocacao.bobina_id]);
                } else {
                    await db.query(`
                        UPDATE retalhos 
                        SET metragem_reservada = metragem_reservada - ?
                        WHERE id = ?
                    `, [alocacao.metragem_alocada, alocacao.retalho_id]);
                }
                
                // Atualizar alocação com nova origem
                await db.query(`
                    UPDATE alocacoes_corte 
                    SET tipo_origem = ?, bobina_id = ?, retalho_id = ?
                    WHERE id = ?
                `, [
                    confirmacao.nova_origem.tipo,
                    confirmacao.nova_origem.tipo === 'bobina' ? confirmacao.nova_origem.id : null,
                    confirmacao.nova_origem.tipo === 'retalho' ? confirmacao.nova_origem.id : null,
                    alocacao.id
                ]);
                
                // Reservar na nova origem
                if (confirmacao.nova_origem.tipo === 'bobina') {
                    await db.query(`
                        UPDATE bobinas 
                        SET metragem_reservada = metragem_reservada + ?
                        WHERE id = ?
                    `, [alocacao.metragem_alocada, confirmacao.nova_origem.id]);
                } else {
                    await db.query(`
                        UPDATE retalhos 
                        SET metragem_reservada = metragem_reservada + ?
                        WHERE id = ?
                    `, [alocacao.metragem_alocada, confirmacao.nova_origem.id]);
                }
                
                // Atualizar referência para dar baixa correta
                alocacao.tipo_origem = confirmacao.nova_origem.tipo;
                alocacao.bobina_id = confirmacao.nova_origem.tipo === 'bobina' ? confirmacao.nova_origem.id : null;
                alocacao.retalho_id = confirmacao.nova_origem.tipo === 'retalho' ? confirmacao.nova_origem.id : null;
            }
            
            // DAR BAIXA definitiva na metragem
            if (alocacao.tipo_origem === 'bobina') {
                await db.query(`
                    UPDATE bobinas 
                    SET metragem_atual = metragem_atual - ?,
                        metragem_reservada = metragem_reservada - ?
                    WHERE id = ?
                `, [alocacao.metragem_alocada, alocacao.metragem_alocada, alocacao.bobina_id]);
                
                // Atualizar status se esgotada
                await db.query(`
                    UPDATE bobinas 
                    SET status = CASE 
                        WHEN metragem_atual <= 0 THEN 'Esgotada'
                        ELSE status
                    END
                    WHERE id = ?
                `, [alocacao.bobina_id]);
                
            } else {
                await db.query(`
                    UPDATE retalhos 
                    SET metragem = metragem - ?,
                        metragem_reservada = metragem_reservada - ?
                    WHERE id = ?
                `, [alocacao.metragem_alocada, alocacao.metragem_alocada, alocacao.retalho_id]);
                
                // Excluir retalho se zerou
                const [retalho] = await db.query(`
                    SELECT metragem FROM retalhos WHERE id = ?
                `, [alocacao.retalho_id]);
                
                if (retalho[0].metragem <= 0) {
                    await db.query(`DELETE FROM retalhos WHERE id = ?`, [alocacao.retalho_id]);
                }
            }
            
            // Marcar alocação como confirmada
            await db.query(`
                UPDATE alocacoes_corte SET confirmado = TRUE WHERE id = ?
            `, [alocacao.id]);
        }
        
        // Finalizar plano
        await db.query(`
            UPDATE planos_corte 
            SET status = 'finalizado', data_finalizacao = NOW()
            WHERE id = ?
        `, [id]);
        
        res.json({ 
            success: true, 
            message: 'Plano de corte finalizado com sucesso!' 
        });
        
    } catch (error) {
        console.error('Erro ao finalizar plano:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Excluir plano de corte (apenas se estiver em planejamento)
exports.excluirPlano = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [planos] = await db.query(`
            SELECT status FROM planos_corte WHERE id = ?
        `, [id]);
        
        if (planos.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Plano não encontrado' 
            });
        }
        
        if (planos[0].status !== 'planejamento') {
            return res.status(400).json({ 
                success: false, 
                error: 'Apenas planos em planejamento podem ser excluídos' 
            });
        }
        
        // Excluir plano (cascata exclui itens e alocações)
        await db.query(`DELETE FROM planos_corte WHERE id = ?`, [id]);
        
        res.json({ 
            success: true, 
            message: 'Plano excluído com sucesso!' 
        });
        
    } catch (error) {
        console.error('Erro ao excluir plano:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Listar origens disponíveis para um corte (para trocar origem)
exports.listarOrigensDisponiveis = async (req, res) => {
    try {
        const { produto_id, metragem } = req.query;
        
        if (!produto_id || !metragem) {
            return res.status(400).json({ 
                success: false, 
                error: 'Produto ID e metragem são obrigatórios' 
            });
        }
        
        // Buscar retalhos
        const [retalhos] = await db.query(`
            SELECT 
                r.id,
                r.codigo_retalho as codigo,
                'retalho' as tipo,
                r.metragem as metragem_total,
                (r.metragem - COALESCE(r.metragem_reservada, 0)) as metragem_disponivel,
                r.localizacao_atual,
                r.observacoes
            FROM retalhos r
            WHERE r.produto_id = ?
                AND r.status = 'Disponível'
                AND (r.metragem - COALESCE(r.metragem_reservada, 0)) >= ?
            ORDER BY r.metragem ASC
        `, [produto_id, metragem]);
        
        // Buscar bobinas
        const [bobinas] = await db.query(`
            SELECT 
                b.id,
                b.codigo_interno as codigo,
                'bobina' as tipo,
                b.metragem_atual as metragem_total,
                (b.metragem_atual - COALESCE(b.metragem_reservada, 0)) as metragem_disponivel,
                b.localizacao_atual,
                b.nota_fiscal,
                b.observacoes
            FROM bobinas b
            WHERE b.produto_id = ?
                AND b.status = 'Disponível'
                AND b.convertida_em_retalho = FALSE
                AND (b.metragem_atual - COALESCE(b.metragem_reservada, 0)) >= ?
            ORDER BY b.metragem_atual ASC
        `, [produto_id, metragem]);
        
        res.json({ 
            success: true, 
            data: {
                retalhos: retalhos,
                bobinas: bobinas
            }
        });
        
    } catch (error) {
        console.error('Erro ao listar origens:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Adicionar novos itens a um plano existente
exports.adicionarItensPlano = async (req, res) => {
    try {
        const { id } = req.params;
        const { itens } = req.body;
        
        if (!itens || itens.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Informe os itens a adicionar' 
            });
        }
        
        // Verificar se plano existe e está em planejamento
        const [planos] = await db.query(
            `SELECT status FROM planos_corte WHERE id = ?`,
            [id]
        );
        
        if (planos.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Plano não encontrado' 
            });
        }
        
        if (planos[0].status !== 'planejamento') {
            return res.status(400).json({ 
                success: false, 
                error: 'Apenas planos em planejamento podem ser editados' 
            });
        }
        
        // Buscar maior ordem atual
        const [maxOrdem] = await db.query(
            `SELECT MAX(ordem) as max_ordem FROM itens_plano_corte WHERE plano_corte_id = ?`,
            [id]
        );
        
        let ordem = (maxOrdem[0].max_ordem || 0) + 1;
        
        // Inserir novos itens
        for (const item of itens) {
            await db.query(
                `INSERT INTO itens_plano_corte (plano_corte_id, produto_id, metragem, observacoes, ordem) 
                 VALUES (?, ?, ?, ?, ?)`,
                [id, item.produto_id, item.metragem, item.observacoes || null, ordem]
            );
            ordem++;
        }
        
        res.json({ 
            success: true, 
            message: `${itens.length} item(ns) adicionado(s) ao plano` 
        });
        
    } catch (error) {
        console.error('Erro ao adicionar itens:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Remover um item do plano
exports.removerItemPlano = async (req, res) => {
    try {
        const { itemId } = req.params;
        
        // Buscar item e verificar status do plano
        const [itens] = await db.query(
            `SELECT ipc.*, pc.status 
             FROM itens_plano_corte ipc
             JOIN planos_corte pc ON pc.id = ipc.plano_corte_id
             WHERE ipc.id = ?`,
            [itemId]
        );
        
        if (itens.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Item não encontrado' 
            });
        }
        
        if (itens[0].status !== 'planejamento') {
            return res.status(400).json({ 
                success: false, 
                error: 'Apenas itens de planos em planejamento podem ser removidos' 
            });
        }
        
        // Verificar se tem alocação
        const [alocacoes] = await db.query(
            `SELECT id FROM alocacoes_corte WHERE item_plano_corte_id = ?`,
            [itemId]
        );
        
        // Se tem alocação, excluir primeiro (CASCADE vai fazer isso automaticamente)
        
        // Excluir item
        await db.query(`DELETE FROM itens_plano_corte WHERE id = ?`, [itemId]);
        
        res.json({ 
            success: true, 
            message: 'Item removido do plano' 
        });
        
    } catch (error) {
        console.error('Erro ao remover item:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
