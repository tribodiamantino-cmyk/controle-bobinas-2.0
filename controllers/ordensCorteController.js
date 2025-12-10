const db = require('../config/database');
const { validarECorrigirReservas } = require('../middleware/validarReservas');

// Gerar código QR único para plano de corte (formato: PLA-0001)
async function gerarCodigoPlano() {
    const [rows] = await db.query(
        `SELECT codigo_plano FROM planos_corte 
         WHERE codigo_plano LIKE 'PLA-%' 
         ORDER BY id DESC LIMIT 1`
    );
    
    let proximoNumero = 1;
    if (rows.length > 0) {
        const ultimoCodigo = rows[0].codigo_plano;
        const numeroAtual = parseInt(ultimoCodigo.split('-')[1]);
        proximoNumero = numeroAtual + 1;
    }
    
    return `PLA-${proximoNumero.toString().padStart(4, '0')}`;
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
                COUNT(DISTINCT CASE WHEN ac.id IS NOT NULL THEN ipc.id END) as itens_alocados,
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
        } else {
            // Por padrão, não mostrar planos arquivados
            query += ` WHERE pc.status != 'arquivado'`;
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
                CONCAT(p.codigo, ' - ', c.nome_cor, ' ', g.gramatura, 'g/m²') as produto_nome,
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
        
        // AGRUPAR CORTES POR PRODUTO (otimização: priorizar mesma bobina)
        const cortesPorProduto = {};
        itens.forEach(item => {
            if (!cortesPorProduto[item.produto_id]) {
                cortesPorProduto[item.produto_id] = [];
            }
            cortesPorProduto[item.produto_id].push(item);
        });
        
        const sugestoes = [];
        const debugInfo = []; // Para mostrar no console do navegador
        
        // Processar cada grupo de produto
        for (const produtoId in cortesPorProduto) {
            const cortesGrupo = cortesPorProduto[produtoId];
            
            debugInfo.push(`🔍 Processando ${cortesGrupo.length} cortes do produto ${produtoId}`);
            cortesGrupo.forEach(c => debugInfo.push(`   - Item ${c.id}: ${c.metragem}m`));
            
            // Tentar alocar todos os cortes do mesmo produto em UMA bobina
            const sugestoesGrupo = await sugerirOrigemParaGrupo(produtoId, cortesGrupo, debugInfo);
            sugestoes.push(...sugestoesGrupo);
        }
        
        // Adicionar debug info na resposta
        console.log('\n' + debugInfo.join('\n') + '\n');
        
        res.json({ 
            success: true, 
            data: sugestoes,
            debug: debugInfo // Enviar para o navegador também
        });
        
    } catch (error) {
        console.error('Erro ao sugerir alocações:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Função auxiliar: sugerir origens para um GRUPO de cortes do mesmo produto
// PRIORIZA: 1º Retalhos individuais, 2º Bobina única, 3º Bobinas individuais
async function sugerirOrigemParaGrupo(produtoId, cortesGrupo, debugInfo = []) {
    const metragemTotal = cortesGrupo.reduce((sum, item) => sum + parseFloat(item.metragem), 0);
    
    // ETAPA 1: Verificar se TODOS os cortes podem ser atendidos por RETALHOS
    // IMPORTANTE: Rastrear alocações temporárias para evitar duplicação
    // OTIMIZAÇÃO: Processar do MAIOR para o MENOR para minimizar desperdício!
    const alocacoesTemporariasEtapa1 = {};
    const sugestoesComRetalhos = [];
    let todosTemRetalho = true;
    
    // ORDENAR cortes do MAIOR para o MENOR (otimiza aproveitamento de retalhos)
    const cortesOrdenados = [...cortesGrupo].sort((a, b) => parseFloat(b.metragem) - parseFloat(a.metragem));
    
    debugInfo.push(`\n🔍 [ETAPA1] Verificando ${cortesOrdenados.length} cortes do produto ${produtoId}:`);
    debugInfo.push(`   📏 Ordem de processamento (MAIOR → MENOR para otimizar):`);
    cortesOrdenados.forEach(c => debugInfo.push(`      - Item ${c.id}: ${c.metragem}m`));
    
    for (const item of cortesOrdenados) {
        debugInfo.push(`\n   🔎 [ETAPA1] Processando item ${item.id} (${item.metragem}m)...`);
        const [retalhos] = await db.query(`
            SELECT 
                r.*,
                (r.metragem - COALESCE(r.metragem_reservada, 0)) as metragem_disponivel
            FROM retalhos r
            WHERE r.produto_id = ?
                AND r.status = 'Disponível'
                AND (r.metragem - COALESCE(r.metragem_reservada, 0)) >= ?
            ORDER BY r.metragem ASC
        `, [produtoId, item.metragem]);
        
        // Verificar CADA retalho descontando alocações temporárias
        debugInfo.push(`   📦 [ETAPA1] Query retornou ${retalhos.length} retalho(s) com >= ${item.metragem}m (ordenados do MENOR para o MAIOR)`);
        
        // Mostrar todos os candidatos antes de escolher
        if (retalhos.length > 0) {
            debugInfo.push(`   📋 [ETAPA1] Candidatos disponíveis:`);
            retalhos.slice(0, 5).forEach(r => {
                const disponivel = parseFloat(r.metragem_disponivel);
                const desperdicio = disponivel - parseFloat(item.metragem);
                debugInfo.push(`      - ${r.codigo_retalho}: ${disponivel}m (desperdício: ${desperdicio.toFixed(2)}m)`);
            });
            if (retalhos.length > 5) debugInfo.push(`      ... e mais ${retalhos.length - 5} retalho(s)`);
        }
        
        let retalhoEncontrado = false;
        for (const retalho of retalhos) {
            const chave = `retalho-${retalho.id}`;
            const metragemJaAlocada = alocacoesTemporariasEtapa1[chave] || 0;
            const metragemRealDisponivel = parseFloat(retalho.metragem_disponivel) - metragemJaAlocada;
            
            debugInfo.push(`      � [ETAPA1] Testando ${retalho.codigo_retalho} (ID:${retalho.id}): ${retalho.metragem_disponivel}m banco - ${metragemJaAlocada}m temp = ${metragemRealDisponivel.toFixed(2)}m real`);
            
            if (metragemRealDisponivel >= parseFloat(item.metragem)) {
                // Retalho OK! Registrar alocação temporária
                alocacoesTemporariasEtapa1[chave] = metragemJaAlocada + parseFloat(item.metragem);
                debugInfo.push(`      ✅ [ETAPA1] Retalho ${retalho.codigo_retalho} ALOCADO para item ${item.id} (${item.metragem}m) - Nova temp: ${alocacoesTemporariasEtapa1[chave]}m`);
                
                sugestoesComRetalhos.push({
                    item_id: item.id,
                    produto_id: item.produto_id,
                    metragem_corte: parseFloat(item.metragem),
                    origem: {
                        tipo: 'retalho',
                        id: retalho.id,
                        codigo: retalho.codigo_retalho,
                        metragem_total: parseFloat(retalho.metragem),
                        metragem_disponivel: metragemRealDisponivel,
                        localizacao: retalho.localizacao_atual,
                        motivo: '📦 Retalho disponível (prioridade)',
                        prioridade: 'alta',
                        estrategia: 'retalho_individual'
                    }
                });
                retalhoEncontrado = true;
                break; // Encontrou retalho para este item, próximo!
            }
        }
        
        if (!retalhoEncontrado) {
            todosTemRetalho = false;
            debugInfo.push(`      ❌ [ETAPA1] SEM retalho suficiente para item ${item.id} (precisa ${item.metragem}m)`);
            // NÃO quebra mais! Continua processando para tentar retalhos nos outros itens
        }
    }
    
    debugInfo.push(`\n   📋 [ETAPA1] Resultado: todosTemRetalho=${todosTemRetalho}, sugestoes=${sugestoesComRetalhos.length}/${cortesGrupo.length}`);
    
    // MUDANÇA CRÍTICA: Priorizar retalhos SEMPRE!
    // Se TODOS têm retalhos, ótimo! Se ALGUNS têm retalhos, usa os retalhos e completa com bobinas
    if (sugestoesComRetalhos.length > 0) {
        if (todosTemRetalho) {
            debugInfo.push(`   ✅ [ETAPA1] PERFEITO! Usando ${sugestoesComRetalhos.length} retalho(s) para TODOS os cortes\n`);
            return sugestoesComRetalhos;
        } else {
            debugInfo.push(`   ⚠️  [ETAPA1] PARCIAL: ${sugestoesComRetalhos.length}/${cortesGrupo.length} com retalhos. Complementando com bobinas...`);
            // Continua para alocar os itens restantes individualmente (ETAPA 3)
        }
    } else {
        debugInfo.push(`   ⚠️  [ETAPA1] Nenhum retalho disponível. Tentando bobina única...`);
    }
    
    // ETAPA 2: Tentar encontrar UMA BOBINA que atenda TODOS os cortes (só se NÃO tiver retalhos parciais)
    if (sugestoesComRetalhos.length === 0) {
        const [bobinaUnica] = await db.query(`
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
    `, [produtoId, metragemTotal]);
    
        if (bobinaUnica.length > 0) {
            console.log(`   ✅ Usando bobina única ${bobinaUnica[0].codigo_interno} para ${cortesGrupo.length} cortes do produto ${produtoId}`);
            // SUCESSO: Alocar todos os cortes na MESMA bobina
            return cortesGrupo.map(item => ({
                item_id: item.id,
                produto_id: item.produto_id,
                metragem_corte: parseFloat(item.metragem),
                origem: {
                    tipo: 'bobina',
                    id: bobinaUnica[0].id,
                    codigo: bobinaUnica[0].codigo_interno,
                    metragem_total: parseFloat(bobinaUnica[0].metragem_atual),
                    metragem_disponivel: parseFloat(bobinaUnica[0].metragem_disponivel),
                    nota_fiscal: bobinaUnica[0].nota_fiscal,
                    localizacao: bobinaUnica[0].localizacao_atual,
                    motivo: '✨ MESMA BOBINA para todos os cortes (sem retalhos disponíveis)',
                    prioridade: 'media',
                    estrategia: 'bobina_unica'
                }
            }));
        }
    } // Fecha o if (sugestoesComRetalhos.length === 0)
    
    console.log(`   ⚠️  Sem bobina única. Alocando individualmente...`);
    
    // ETAPA 3: Alocar individualmente (fallback - tenta retalho, senão bobina individual)
    // IMPORTANTE: Rastrear alocações temporárias para evitar duplicação
    // Se já tem retalhos parciais da ETAPA1, começa com eles!
    const alocacoesTemporarias = {}; // { 'retalho-123': metragem_alocada, 'bobina-456': metragem_alocada }
    
    // Registrar retalhos já alocados na ETAPA1
    for (const sugestaoRetalho of sugestoesComRetalhos) {
        const chave = `${sugestaoRetalho.origem.tipo}-${sugestaoRetalho.origem.id}`;
        alocacoesTemporarias[chave] = (alocacoesTemporarias[chave] || 0) + parseFloat(sugestaoRetalho.metragem_corte);
    }
    
    const sugestoes = [...sugestoesComRetalhos]; // Começa com os retalhos da ETAPA1
    
    // Identificar quais itens ainda precisam de alocação
    const idsJaAlocados = new Set(sugestoesComRetalhos.map(s => s.item_id));
    const itensRestantes = cortesGrupo.filter(item => !idsJaAlocados.has(item.id));
    
    debugInfo.push(`\n   🔧 [ETAPA3] Alocando ${itensRestantes.length} itens restantes individualmente...`);
    
    for (const item of itensRestantes) {
        const origem = await sugerirOrigemParaCorte(item.produto_id, item.metragem, alocacoesTemporarias);
        
        // Registrar alocação temporária
        if (origem) {
            const chave = `${origem.tipo}-${origem.id}`;
            alocacoesTemporarias[chave] = (alocacoesTemporarias[chave] || 0) + parseFloat(item.metragem);
            console.log(`   📝 Alocação temporária: ${chave} += ${item.metragem}m (total: ${alocacoesTemporarias[chave]}m)`);
        }
        
        sugestoes.push({
            item_id: item.id,
            produto_id: item.produto_id,
            metragem_corte: parseFloat(item.metragem),
            origem: origem  // ← MUDADO de "sugestao" para "origem"
        });
    }
    
    return sugestoes;
}

// Função auxiliar: sugerir melhor origem para um corte
async function sugerirOrigemParaCorte(produtoId, metragem, alocacoesTemporarias = {}) {
    console.log(`\n🔍 [DEBUG] Buscando origem para produto ${produtoId}, metragem ${metragem}m`);
    
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
    `, [produtoId, metragem, metragem]);
    
    console.log(`   📦 Retalhos encontrados: ${retalhos.length}`);
    
    // Verificar se retalho tem metragem disponível DESCONTANDO alocações temporárias
    for (const retalho of retalhos) {
        const chave = `retalho-${retalho.id}`;
        const metragemJaAlocada = alocacoesTemporarias[chave] || 0;
        const metragemRealDisponivel = parseFloat(retalho.metragem_disponivel) - metragemJaAlocada;
        
        console.log(`   📊 ${retalho.codigo_retalho}: ${retalho.metragem_disponivel}m banco - ${metragemJaAlocada}m temp = ${metragemRealDisponivel}m real`);
        
        if (metragemRealDisponivel >= parseFloat(metragem)) {
            console.log(`   ✅ Retalho selecionado: ${retalho.codigo_retalho} - Disponível REAL: ${metragemRealDisponivel}m`);
            return {
                tipo: 'retalho',
                id: retalho.id,
                codigo: retalho.codigo_retalho,
                metragem_total: parseFloat(retalho.metragem),
                metragem_disponivel: metragemRealDisponivel,
                localizacao: retalho.localizacao_atual,
                motivo: 'Retalho com tamanho próximo',
                prioridade: 'alta'
            };
        } else {
            console.log(`   ⚠️  ${retalho.codigo_retalho} insuficiente (precisa ${metragem}m, tem ${metragemRealDisponivel}m)`);
        }
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
    `, [produtoId, metragem]);
    
    console.log(`   🎯 Bobinas encontradas: ${bobinas.length}`);
    
    // Verificar bobinas DESCONTANDO alocações temporárias
    for (const bobina of bobinas) {
        const chave = `bobina-${bobina.id}`;
        const metragemJaAlocada = alocacoesTemporarias[chave] || 0;
        const metragemRealDisponivel = parseFloat(bobina.metragem_disponivel) - metragemJaAlocada;
        
        console.log(`   📊 ${bobina.codigo_interno}: ${bobina.metragem_disponivel}m banco - ${metragemJaAlocada}m temp = ${metragemRealDisponivel}m real`);
        
        if (metragemRealDisponivel >= parseFloat(metragem)) {
            console.log(`   ✅ Bobina selecionada: ${bobina.codigo_interno} - Disponível REAL: ${metragemRealDisponivel}m`);
            return {
                tipo: 'bobina',
                id: bobina.id,
                codigo: bobina.codigo_interno,
                metragem_total: parseFloat(bobina.metragem_atual),
                metragem_disponivel: metragemRealDisponivel,
                nota_fiscal: bobina.nota_fiscal,
                localizacao: bobina.localizacao_atual,
                motivo: 'Bobina menor disponível',
                prioridade: 'media'
            };
        } else {
            console.log(`   ⚠️  ${bobina.codigo_interno} insuficiente (precisa ${metragem}m, tem ${metragemRealDisponivel}m)`);
        }
    }
    
    // 3. SEM ESTOQUE SUFICIENTE - INVESTIGAR
    console.log(`   ❌ Nenhuma origem encontrada. Investigando estoque total...`);
    
    // Buscar TODOS os retalhos e bobinas deste produto para debug
    const [todosRetalhos] = await db.query(`
        SELECT 
            codigo_retalho,
            metragem,
            metragem_reservada,
            (metragem - COALESCE(metragem_reservada, 0)) as disponivel,
            status
        FROM retalhos 
        WHERE produto_id = ?
        ORDER BY disponivel DESC
    `, [produtoId]);
    
    const [todasBobinas] = await db.query(`
        SELECT 
            codigo_interno,
            metragem_atual,
            metragem_reservada,
            (metragem_atual - COALESCE(metragem_reservada, 0)) as disponivel,
            status,
            convertida_em_retalho
        FROM bobinas 
        WHERE produto_id = ?
        ORDER BY disponivel DESC
    `, [produtoId]);
    
    console.log(`\n   📊 DEBUG - Estoque completo do produto ${produtoId}:`);
    console.log(`   📦 Retalhos (${todosRetalhos.length} total):`);
    todosRetalhos.forEach(r => {
        console.log(`      - ${r.codigo_retalho}: ${r.metragem}m total, ${r.metragem_reservada || 0}m reservada, ${r.disponivel}m disponível [${r.status}]`);
    });
    console.log(`   🎯 Bobinas (${todasBobinas.length} total):`);
    todasBobinas.forEach(b => {
        console.log(`      - ${b.codigo_interno}: ${b.metragem_atual}m total, ${b.metragem_reservada || 0}m reservada, ${b.disponivel}m disponível [${b.status}] ${b.convertida_em_retalho ? '(convertida)' : ''}`);
    });
    console.log(`   ⚠️  Metragem solicitada: ${metragem}m\n`);
    
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
            SELECT * FROM alocacoes_corte WHERE item_plano_corte_id = ?
        `, [item_id]);
        
        if (alocacoesExistentes.length > 0) {
            // IMPORTANTE: Se está trocando origem, precisa liberar reserva da origem antiga
            const alocacaoAntiga = alocacoesExistentes[0];
            
            // Verificar se o plano está em produção (se sim, a metragem está reservada)
            const [planoStatus] = await db.query(`
                SELECT pc.status 
                FROM planos_corte pc
                JOIN itens_plano_corte ipc ON ipc.plano_corte_id = pc.id
                WHERE ipc.id = ?
            `, [item_id]);
            
            const planoEmProducao = planoStatus.length > 0 && planoStatus[0].status === 'em_producao';
            
            // Se o plano está em produção, liberar reserva da origem antiga
            if (planoEmProducao) {
                if (alocacaoAntiga.tipo_origem === 'bobina' && alocacaoAntiga.bobina_id) {
                    await db.query(`
                        UPDATE bobinas 
                        SET metragem_reservada = GREATEST(0, metragem_reservada - ?)
                        WHERE id = ?
                    `, [alocacaoAntiga.metragem_alocada, alocacaoAntiga.bobina_id]);
                } else if (alocacaoAntiga.tipo_origem === 'retalho' && alocacaoAntiga.retalho_id) {
                    await db.query(`
                        UPDATE retalhos 
                        SET metragem_reservada = GREATEST(0, metragem_reservada - ?)
                        WHERE id = ?
                    `, [alocacaoAntiga.metragem_alocada, alocacaoAntiga.retalho_id]);
                }
                
                // Reservar metragem na nova origem
                if (tipo_origem === 'bobina') {
                    await db.query(`
                        UPDATE bobinas 
                        SET metragem_reservada = metragem_reservada + ?
                        WHERE id = ?
                    `, [item.metragem, origem_id]);
                } else {
                    await db.query(`
                        UPDATE retalhos 
                        SET metragem_reservada = metragem_reservada + ?
                        WHERE id = ?
                    `, [item.metragem, origem_id]);
                }
            }
            
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
        
        // VALIDAR RESERVAS ANTES DE ENVIAR PARA PRODUÇÃO
        console.log('🔍 Validando reservas antes de enviar plano para produção...');
        await validarECorrigirReservas();
        
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
        
        // VALIDAÇÃO CRÍTICA: Verificar se todas as origens têm metragem disponível
        for (const alocacao of alocacoes) {
            let metragemDisponivel = 0;
            let origemNome = '';
            
            if (alocacao.tipo_origem === 'bobina') {
                const [bobinas] = await db.query(`
                    SELECT 
                        codigo_interno,
                        (metragem_atual - COALESCE(metragem_reservada, 0)) as disponivel
                    FROM bobinas WHERE id = ?
                `, [alocacao.bobina_id]);
                
                if (bobinas.length === 0) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Bobina alocada não encontrada' 
                    });
                }
                
                metragemDisponivel = parseFloat(bobinas[0].disponivel);
                origemNome = bobinas[0].codigo_interno;
            } else {
                const [retalhos] = await db.query(`
                    SELECT 
                        codigo_retalho,
                        (metragem - COALESCE(metragem_reservada, 0)) as disponivel
                    FROM retalhos WHERE id = ?
                `, [alocacao.retalho_id]);
                
                if (retalhos.length === 0) {
                    return res.status(400).json({ 
                        success: false, 
                        error: 'Retalho alocado não encontrado' 
                    });
                }
                
                metragemDisponivel = parseFloat(retalhos[0].disponivel);
                origemNome = retalhos[0].codigo_retalho;
            }
            
            // Validar se há metragem suficiente
            if (metragemDisponivel < parseFloat(alocacao.metragem_alocada)) {
                return res.status(400).json({ 
                    success: false, 
                    error: `Erro: A origem "${origemNome}" não possui metragem disponível suficiente. ` +
                           `Disponível: ${metragemDisponivel.toFixed(2)}m, Necessário: ${parseFloat(alocacao.metragem_alocada).toFixed(2)}m. ` +
                           `Provavelmente já foi reservada em outro plano. Por favor, realoque este corte.`
                });
            }
        }
        
        // Reservar metragens (só chega aqui se passou todas as validações)
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

// Voltar plano para planejamento (liberar reservas)
exports.voltarParaPlanejamento = async (req, res) => {
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
        
        if (plano.status !== 'em_producao') {
            return res.status(400).json({ 
                success: false, 
                error: 'Apenas planos em produção podem voltar para planejamento' 
            });
        }
        
        // Buscar alocações
        const [alocacoes] = await db.query(`
            SELECT ac.*
            FROM alocacoes_corte ac
            JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
            WHERE ipc.plano_corte_id = ?
        `, [id]);
        
        // Liberar reservas
        for (const alocacao of alocacoes) {
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
        }
        
        // Atualizar status do plano
        await db.query(`
            UPDATE planos_corte SET status = 'planejamento' WHERE id = ?
        `, [id]);
        
        // VALIDAR RESERVAS APÓS VOLTAR PARA PLANEJAMENTO
        console.log('🔍 Validando reservas após voltar plano para planejamento...');
        await validarECorrigirReservas();
        
        res.json({ 
            success: true, 
            message: 'Plano voltou para planejamento. Reservas liberadas!' 
        });
        
    } catch (error) {
        console.error('Erro ao voltar para planejamento:', error);
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
        
        // IMPORTANTE: Liberar reservas de metragem antes de excluir
        // Buscar todas as alocações deste plano
        const [alocacoes] = await db.query(`
            SELECT ac.*, ac.tipo_origem, ac.bobina_id, ac.retalho_id, ac.metragem_alocada
            FROM alocacoes_corte ac
            JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
            WHERE ipc.plano_corte_id = ?
        `, [id]);
        
        // Liberar metragem reservada de cada origem
        for (const alocacao of alocacoes) {
            if (alocacao.tipo_origem === 'bobina' && alocacao.bobina_id) {
                await db.query(`
                    UPDATE bobinas 
                    SET metragem_reservada = GREATEST(0, metragem_reservada - ?)
                    WHERE id = ?
                `, [alocacao.metragem_alocada, alocacao.bobina_id]);
            } else if (alocacao.tipo_origem === 'retalho' && alocacao.retalho_id) {
                await db.query(`
                    UPDATE retalhos 
                    SET metragem_reservada = GREATEST(0, metragem_reservada - ?)
                    WHERE id = ?
                `, [alocacao.metragem_alocada, alocacao.retalho_id]);
            }
        }
        
        // Excluir plano (cascata exclui itens e alocações)
        await db.query(`DELETE FROM planos_corte WHERE id = ?`, [id]);
        
        res.json({ 
            success: true, 
            message: `Plano excluído com sucesso! ${alocacoes.length} reserva(s) liberada(s).` 
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

// Arquivar plano finalizado
exports.arquivarPlano = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se plano existe e está finalizado
        const [planos] = await db.query(`
            SELECT * FROM planos_corte WHERE id = ?
        `, [id]);
        
        if (planos.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Plano de corte não encontrado' 
            });
        }
        
        if (planos[0].status !== 'finalizado') {
            return res.status(400).json({ 
                success: false, 
                error: 'Apenas planos finalizados podem ser arquivados' 
            });
        }
        
        // Adicionar campo arquivado (se não existir, usar soft delete ou apenas marcar)
        // Por enquanto vamos apenas mudar o status para um valor especial
        await db.query(`
            UPDATE planos_corte 
            SET status = 'arquivado'
            WHERE id = ?
        `, [id]);
        
        res.json({ 
            success: true, 
            message: 'Plano arquivado com sucesso!' 
        });
        
    } catch (error) {
        console.error('Erro ao arquivar plano:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// UTILIDADE: Limpar reservas órfãs (metragens reservadas sem alocação ativa)
exports.limparReservasOrfas = async (req, res) => {
    try {
        // Buscar todas as alocações ativas em planos que estão em produção
        const [alocacoesAtivas] = await db.query(`
            SELECT ac.tipo_origem, ac.bobina_id, ac.retalho_id, ac.metragem_alocada
            FROM alocacoes_corte ac
            JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
            JOIN planos_corte pc ON pc.id = ipc.plano_corte_id
            WHERE pc.status = 'em_producao'
        `);
        
        // Resetar todas as metragens reservadas
        await db.query(`UPDATE bobinas SET metragem_reservada = 0`);
        await db.query(`UPDATE retalhos SET metragem_reservada = 0`);
        
        // Recalcular apenas as reservas ativas
        for (const alocacao of alocacoesAtivas) {
            if (alocacao.tipo_origem === 'bobina' && alocacao.bobina_id) {
                await db.query(`
                    UPDATE bobinas 
                    SET metragem_reservada = metragem_reservada + ?
                    WHERE id = ?
                `, [alocacao.metragem_alocada, alocacao.bobina_id]);
            } else if (alocacao.tipo_origem === 'retalho' && alocacao.retalho_id) {
                await db.query(`
                    UPDATE retalhos 
                    SET metragem_reservada = metragem_reservada + ?
                    WHERE id = ?
                `, [alocacao.metragem_alocada, alocacao.retalho_id]);
            }
        }
        
        res.json({ 
            success: true, 
            message: `Reservas recalculadas com sucesso! ${alocacoesAtivas.length} alocação(ões) ativa(s) reprocessada(s).` 
        });
        
    } catch (error) {
        console.error('Erro ao limpar reservas órfãs:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Buscar histórico do plano (eventos, mudanças de status, alocações, cortes)
exports.buscarHistoricoPlano = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Buscar info do plano
        const [planos] = await db.query(`
            SELECT codigo_plano, status, data_criacao, data_finalizacao 
            FROM planos_corte WHERE id = ?
        `, [id]);
        
        if (planos.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Plano não encontrado' 
            });
        }
        
        const plano = planos[0];
        const eventos = [];
        
        // Evento 1: Criação do plano
        eventos.push({
            tipo: 'criacao',
            data: plano.data_criacao,
            descricao: `Plano ${plano.codigo_plano} criado`,
            icone: '📝'
        });
        
        // Evento 2: Alocações (quando foram alocadas)
        const [alocacoes] = await db.query(`
            SELECT 
                ac.created_at as data_alocacao,
                ac.tipo_origem,
                COALESCE(b.codigo_interno, r.codigo_retalho) as codigo_origem,
                ac.metragem_alocada,
                p.codigo as produto_codigo
            FROM alocacoes_corte ac
            JOIN itens_plano_corte ipc ON ac.item_plano_corte_id = ipc.id
            JOIN produtos p ON ipc.produto_id = p.id
            LEFT JOIN bobinas b ON ac.bobina_id = b.id
            LEFT JOIN retalhos r ON ac.retalho_id = r.id
            WHERE ipc.plano_corte_id = ?
            ORDER BY ac.created_at ASC
        `, [id]);
        
        alocacoes.forEach(a => {
            eventos.push({
                tipo: 'alocacao',
                data: a.data_alocacao,
                descricao: `${a.tipo_origem === 'bobina' ? '📦' : '♻️'} ${a.codigo_origem} alocado para ${a.produto_codigo} (${a.metragem_alocada}m)`,
                icone: '🔗'
            });
        });
        
        // Evento 3: Início de produção (quando status mudou para em_producao)
        // Não temos log de mudanças de status, então vamos inferir pela primeira confirmação de corte
        const [primeiroCorte] = await db.query(`
            SELECT MIN(ac.data_confirmacao) as primeira_confirmacao
            FROM alocacoes_corte ac
            JOIN itens_plano_corte ipc ON ac.item_plano_corte_id = ipc.id
            WHERE ipc.plano_corte_id = ? AND ac.status_confirmacao = 'confirmado'
        `, [id]);
        
        if (primeiroCorte[0].primeira_confirmacao) {
            eventos.push({
                tipo: 'inicio_producao',
                data: primeiroCorte[0].primeira_confirmacao,
                descricao: 'Produção iniciada (primeiro corte confirmado)',
                icone: '▶️'
            });
        }
        
        // Evento 4: Cortes confirmados
        const [cortes] = await db.query(`
            SELECT 
                ac.data_confirmacao,
                COALESCE(b.codigo_interno, r.codigo_retalho) as codigo_origem,
                ac.metragem_alocada,
                p.codigo as produto_codigo
            FROM alocacoes_corte ac
            JOIN itens_plano_corte ipc ON ac.item_plano_corte_id = ipc.id
            JOIN produtos p ON ipc.produto_id = p.id
            LEFT JOIN bobinas b ON ac.bobina_id = b.id
            LEFT JOIN retalhos r ON ac.retalho_id = r.id
            WHERE ipc.plano_corte_id = ? AND ac.status_confirmacao = 'confirmado'
            ORDER BY ac.data_confirmacao ASC
        `, [id]);
        
        cortes.forEach(c => {
            eventos.push({
                tipo: 'corte',
                data: c.data_confirmacao,
                descricao: `✂️ Corte confirmado: ${c.produto_codigo} - ${c.metragem_alocada}m de ${c.codigo_origem}`,
                icone: '✅'
            });
        });
        
        // Evento 5: Finalização
        if (plano.data_finalizacao) {
            eventos.push({
                tipo: 'finalizacao',
                data: plano.data_finalizacao,
                descricao: 'Plano finalizado',
                icone: '🏁'
            });
            
            // Buscar retalhos gerados
            const [retalhos] = await db.query(`
                SELECT codigo_retalho, metragem
                FROM retalhos
                WHERE observacoes LIKE ?
                ORDER BY id ASC
            `, [`%plano ${plano.codigo_plano}%`]);
            
            if (retalhos.length > 0) {
                eventos.push({
                    tipo: 'retalhos',
                    data: plano.data_finalizacao,
                    descricao: `♻️ ${retalhos.length} retalho(s) gerado(s): ${retalhos.map(r => `${r.codigo_retalho} (${r.metragem}m)`).join(', ')}`,
                    icone: '📦'
                });
            }
        }
        
        // Ordenar eventos por data
        eventos.sort((a, b) => new Date(a.data) - new Date(b.data));
        
        res.json({ 
            success: true, 
            data: eventos
        });
        
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};
