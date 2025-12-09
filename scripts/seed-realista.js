const db = require('../config/database');

/**
 * Script para popular banco com dados REALISTAS
 * 
 * Cria:
 * - 2 cores (Preto, Azul)
 * - 2 gramaturas (280g/m², 320g/m²)
 * - 4 produtos (2 para Cortinave, 2 para BN)
 * - 8 bobinas (2 por produto, com metragens variadas)
 */

async function seedRealista() {
    try {
        console.log('🌱 Iniciando seed realista...\n');
        
        // ========== 1. CORES ==========
        console.log('🎨 Criando cores...');
        const cores = [
            { nome: 'Preto', hex: '#000000' },
            { nome: 'Azul', hex: '#0000FF' }
        ];
        
        const coresIds = [];
        for (const cor of cores) {
            const [existing] = await db.query(
                'SELECT id FROM configuracoes_cores WHERE nome_cor = ?',
                [cor.nome]
            );
            
            if (existing.length > 0) {
                coresIds.push(existing[0].id);
                console.log(`  ✓ Cor "${cor.nome}" já existe (ID: ${existing[0].id})`);
            } else {
                const [result] = await db.query(
                    'INSERT INTO configuracoes_cores (nome_cor, codigo_hex) VALUES (?, ?)',
                    [cor.nome, cor.hex]
                );
                coresIds.push(result.insertId);
                console.log(`  ✓ Cor "${cor.nome}" criada (ID: ${result.insertId})`);
            }
        }
        
        // ========== 2. GRAMATURAS ==========
        console.log('\n📏 Criando gramaturas...');
        const gramaturas = [280, 320];
        const gramaturasIds = [];
        
        for (const gram of gramaturas) {
            const [existing] = await db.query(
                'SELECT id FROM configuracoes_gramaturas WHERE gramatura = ?',
                [gram]
            );
            
            if (existing.length > 0) {
                gramaturasIds.push(existing[0].id);
                console.log(`  ✓ Gramatura ${gram}g/m² já existe (ID: ${existing[0].id})`);
            } else {
                const [result] = await db.query(
                    'INSERT INTO configuracoes_gramaturas (gramatura) VALUES (?)',
                    [gram]
                );
                gramaturasIds.push(result.insertId);
                console.log(`  ✓ Gramatura ${gram}g/m² criada (ID: ${result.insertId})`);
            }
        }
        
        // ========== 3. PRODUTOS ==========
        console.log('\n📦 Criando produtos...');
        const produtos = [
            {
                loja: 'Cortinave',
                codigo: 'CTV-0001',
                fabricante: 'Propex',
                cor_id: coresIds[0], // Preto
                gramatura_id: gramaturasIds[0], // 280g
                tipo_tecido: 'Normal',
                largura_sem_costura: 300,
                tipo_bainha: 'Cano/Cano',
                largura_final: 280
            },
            {
                loja: 'Cortinave',
                codigo: 'CTV-0002',
                fabricante: 'Textiloeste',
                cor_id: coresIds[1], // Azul
                gramatura_id: gramaturasIds[1], // 320g
                tipo_tecido: 'Bando Y',
                largura_maior: 350,
                largura_y: 200
            },
            {
                loja: 'BN',
                codigo: 'BN-0001',
                fabricante: 'Propex',
                cor_id: coresIds[0], // Preto
                gramatura_id: gramaturasIds[0], // 280g
                tipo_tecido: 'Normal',
                largura_sem_costura: 280,
                tipo_bainha: 'Arame/Arame',
                largura_final: 260
            },
            {
                loja: 'BN',
                codigo: 'BN-0002',
                fabricante: 'Textiloeste',
                cor_id: coresIds[1], // Azul
                gramatura_id: gramaturasIds[1], // 320g
                tipo_tecido: 'Normal',
                largura_sem_costura: 300,
                tipo_bainha: 'Cano/Arame',
                largura_final: 285
            }
        ];
        
        const produtosIds = [];
        for (const prod of produtos) {
            const [existing] = await db.query(
                'SELECT id FROM produtos WHERE codigo = ?',
                [prod.codigo]
            );
            
            if (existing.length > 0) {
                produtosIds.push(existing[0].id);
                console.log(`  ✓ Produto ${prod.codigo} já existe (ID: ${existing[0].id})`);
            } else {
                const [result] = await db.query(
                    `INSERT INTO produtos 
                    (loja, codigo, cor_id, gramatura_id, fabricante, tipo_tecido, 
                     largura_sem_costura, tipo_bainha, largura_final, largura_maior, largura_y, metragem_confiavel)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        prod.loja, prod.codigo, prod.cor_id, prod.gramatura_id,
                        prod.fabricante, prod.tipo_tecido,
                        prod.largura_sem_costura || null,
                        prod.tipo_bainha || null,
                        prod.largura_final || null,
                        prod.largura_maior || null,
                        prod.largura_y || null,
                        1 // metragem_confiavel = true
                    ]
                );
                produtosIds.push(result.insertId);
                console.log(`  ✓ Produto ${prod.codigo} criado (ID: ${result.insertId})`);
            }
        }
        
        // ========== 4. BOBINAS ==========
        console.log('\n🎯 Criando bobinas...');
        const bobinas = [
            // Cortinave - CTV-0001 (Preto 280g)
            { produto_idx: 0, metragem: 500.00, nota: 'NF-2025-001' },
            { produto_idx: 0, metragem: 450.50, nota: 'NF-2025-002' },
            
            // Cortinave - CTV-0002 (Azul 320g Bando Y)
            { produto_idx: 1, metragem: 600.00, nota: 'NF-2025-003' },
            { produto_idx: 1, metragem: 380.25, nota: 'NF-2025-004' },
            
            // BN - BN-0001 (Preto 280g)
            { produto_idx: 2, metragem: 420.00, nota: 'NF-2025-101' },
            { produto_idx: 2, metragem: 550.75, nota: 'NF-2025-102' },
            
            // BN - BN-0002 (Azul 320g)
            { produto_idx: 3, metragem: 480.00, nota: 'NF-2025-103' },
            { produto_idx: 3, metragem: 390.50, nota: 'NF-2025-104' }
        ];
        
        // Buscar último código BOB para continuar sequência
        const [ultimaBobina] = await db.query(
            `SELECT codigo_interno FROM bobinas 
             WHERE codigo_interno LIKE 'BOB-%' 
             ORDER BY id DESC LIMIT 1`
        );
        
        let proximoNumero = 1;
        if (ultimaBobina.length > 0) {
            const numeroAtual = parseInt(ultimaBobina[0].codigo_interno.split('-')[1]);
            proximoNumero = numeroAtual + 1;
        }
        
        const bobinasData = [];
        for (const bob of bobinas) {
            const codigo = `BOB-${proximoNumero.toString().padStart(4, '0')}`;
            const produto = produtos[bob.produto_idx];
            const produtoId = produtosIds[bob.produto_idx];
            
            const [result] = await db.query(
                `INSERT INTO bobinas 
                (codigo_interno, nota_fiscal, loja, produto_id, metragem_inicial, metragem_atual, status)
                VALUES (?, ?, ?, ?, ?, ?, 'Disponível')`,
                [codigo, bob.nota, produto.loja, produtoId, bob.metragem, bob.metragem]
            );
            
            bobinasData.push({
                id: result.insertId,
                codigo,
                produto: produto.codigo,
                metragem: bob.metragem,
                nota: bob.nota
            });
            
            console.log(`  ✓ Bobina ${codigo} - ${produto.codigo} - ${bob.metragem}m (NF: ${bob.nota})`);
            proximoNumero++;
        }
        
        // ========== RESUMO ==========
        console.log('\n' + '='.repeat(60));
        console.log('✅ SEED REALISTA CONCLUÍDO!');
        console.log('='.repeat(60));
        console.log(`📊 Cores criadas: ${cores.length}`);
        console.log(`📏 Gramaturas criadas: ${gramaturas.length}`);
        console.log(`📦 Produtos criados: ${produtos.length}`);
        console.log(`🎯 Bobinas criadas: ${bobinas.length}`);
        console.log('\n📋 BOBINAS DISPONÍVEIS PARA TESTE:');
        console.log('─'.repeat(60));
        bobinasData.forEach(b => {
            console.log(`   ${b.codigo} | ${b.produto.padEnd(10)} | ${b.metragem.toFixed(2)}m | ${b.nota}`);
        });
        console.log('─'.repeat(60));
        console.log('\n🖨️  Use qualquer código BOB-XXXX para testar impressão!');
        console.log('');
        
    } catch (error) {
        console.error('❌ Erro no seed:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

// Executar
seedRealista();
