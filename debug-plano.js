const db = require('./config/database');

async function debugPlano() {
    try {
        // 1. Buscar plano em planejamento
        const [planos] = await db.query(`
            SELECT * FROM planos_corte WHERE status = 'planejamento'
        `);
        
        console.log('\n📋 PLANOS EM PLANEJAMENTO:', planos.length);
        console.log(JSON.stringify(planos, null, 2));
        
        if (planos.length === 0) {
            console.log('\n⚠️  Nenhum plano em planejamento encontrado');
            process.exit(0);
        }
        
        const planoId = planos[0].id;
        console.log(`\n🔍 Analisando plano ID ${planoId}: ${planos[0].codigo_plano}`);
        
        // 2. Buscar itens do plano
        const [itens] = await db.query(`
            SELECT ipc.*, p.codigo as produto_codigo, p.nome as produto_nome
            FROM itens_plano_corte ipc
            JOIN produtos p ON p.id = ipc.produto_id
            WHERE ipc.plano_corte_id = ?
            ORDER BY ipc.ordem
        `, [planoId]);
        
        console.log(`\n📦 ITENS DO PLANO (${itens.length} total):`);
        itens.forEach((item, idx) => {
            console.log(`\n   ${idx + 1}. Item #${item.id} - ${item.produto_nome} (ID: ${item.produto_id})`);
            console.log(`      Metragem solicitada: ${item.metragem}m`);
        });
        
        // 3. Para cada item, verificar estoque disponível
        for (const item of itens) {
            console.log(`\n\n🔎 ANALISANDO ESTOQUE PARA: ${item.produto_nome} (${item.metragem}m)`);
            console.log('━'.repeat(80));
            
            // Retalhos
            const [retalhos] = await db.query(`
                SELECT 
                    codigo_retalho,
                    metragem,
                    metragem_reservada,
                    (metragem - COALESCE(metragem_reservada, 0)) as disponivel,
                    status
                FROM retalhos 
                WHERE produto_id = ?
                ORDER BY disponivel DESC
            `, [item.produto_id]);
            
            console.log(`\n📦 RETALHOS (${retalhos.length} total):`);
            if (retalhos.length === 0) {
                console.log('   (nenhum retalho encontrado)');
            } else {
                retalhos.forEach(r => {
                    const suficiente = r.disponivel >= item.metragem ? '✅' : '❌';
                    console.log(`   ${suficiente} ${r.codigo_retalho}: ${r.metragem}m total, ${r.metragem_reservada || 0}m reservada, ${r.disponivel}m disponível [${r.status}]`);
                });
            }
            
            // Bobinas
            const [bobinas] = await db.query(`
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
            `, [item.produto_id]);
            
            console.log(`\n🎯 BOBINAS (${bobinas.length} total):`);
            if (bobinas.length === 0) {
                console.log('   (nenhuma bobina encontrada)');
            } else {
                bobinas.forEach(b => {
                    const suficiente = b.disponivel >= item.metragem ? '✅' : '❌';
                    const convertida = b.convertida_em_retalho ? '(CONVERTIDA)' : '';
                    console.log(`   ${suficiente} ${b.codigo_interno}: ${b.metragem_atual}m total, ${b.metragem_reservada || 0}m reservada, ${b.disponivel}m disponível [${b.status}] ${convertida}`);
                });
            }
            
            // Verificar alocações existentes
            const [alocacoes] = await db.query(`
                SELECT * FROM alocacoes_corte WHERE item_plano_corte_id = ?
            `, [item.id]);
            
            if (alocacoes.length > 0) {
                console.log(`\n⚠️  ITEM JÁ TEM ALOCAÇÃO:`);
                console.log(JSON.stringify(alocacoes, null, 2));
            }
        }
        
        // 4. Verificar se há metragens reservadas órfãs
        console.log('\n\n🔍 VERIFICANDO RESERVAS ÓRFÃS...');
        console.log('━'.repeat(80));
        
        const [reservasOrfas] = await db.query(`
            SELECT 'bobina' as tipo, b.codigo_interno as codigo, b.metragem_reservada
            FROM bobinas b
            WHERE b.metragem_reservada > 0
                AND b.id NOT IN (
                    SELECT DISTINCT bobina_id 
                    FROM alocacoes_corte ac
                    JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
                    JOIN planos_corte pc ON pc.id = ipc.plano_corte_id
                    WHERE ac.bobina_id IS NOT NULL
                        AND pc.status = 'em_producao'
                )
            UNION ALL
            SELECT 'retalho' as tipo, r.codigo_retalho as codigo, r.metragem_reservada
            FROM retalhos r
            WHERE r.metragem_reservada > 0
                AND r.id NOT IN (
                    SELECT DISTINCT retalho_id 
                    FROM alocacoes_corte ac
                    JOIN itens_plano_corte ipc ON ipc.id = ac.item_plano_corte_id
                    JOIN planos_corte pc ON pc.id = ipc.plano_corte_id
                    WHERE ac.retalho_id IS NOT NULL
                        AND pc.status = 'em_producao'
                )
        `);
        
        if (reservasOrfas.length > 0) {
            console.log(`\n❌ ENCONTRADAS ${reservasOrfas.length} RESERVAS ÓRFÃS:`);
            reservasOrfas.forEach(r => {
                console.log(`   - ${r.tipo.toUpperCase()} ${r.codigo}: ${r.metragem_reservada}m reservada (ÓRFÃ!)`);
            });
            console.log('\n💡 Execute a limpeza de reservas em Configurações > Manutenção');
        } else {
            console.log('✅ Nenhuma reserva órfã encontrada');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
    }
    
    process.exit(0);
}

debugPlano();
