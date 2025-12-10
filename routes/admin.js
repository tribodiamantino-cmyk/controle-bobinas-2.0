const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * ROTA ADMINISTRATIVA - LIMPEZA DE DADOS
 * 
 * ⚠️ ATENÇÃO: Use apenas em desenvolvimento ou para resetar dados de teste!
 * 
 * POST /api/admin/limpar-dados
 * 
 * Apaga TODOS os dados inseridos no sistema.
 * Mantém: cores, gramaturas, estrutura do banco
 */

router.post('/limpar-dados', async (req, res) => {
    try {
        console.log('🗑️  Iniciando limpeza de dados via API...');
        
        // Desabilitar FK checks
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        
        const tabelasParaLimpar = [
            'carregamentos_itens',
            'carregamentos',
            'cortes_realizados',
            'plano_locacoes',
            'alocacoes_corte',
            'itens_plano_corte',
            'planos_corte',
            'retalhos',
            'bobinas',
            'produtos',
            'obras_padrao',
            'locacoes'
        ];
        
        const relatorio = [];
        let totalApagado = 0;
        
        for (const tabela of tabelasParaLimpar) {
            try {
                // Contar registros
                const [count] = await db.query(`SELECT COUNT(*) as total FROM ${tabela}`);
                const registros = count[0].total;
                
                if (registros > 0) {
                    // Deletar
                    await db.query(`DELETE FROM ${tabela}`);
                    await db.query(`ALTER TABLE ${tabela} AUTO_INCREMENT = 1`);
                    
                    relatorio.push({ tabela, registros, status: 'apagado' });
                    totalApagado += registros;
                    console.log(`  ✅ ${tabela}: ${registros} registro(s) apagado(s)`);
                } else {
                    relatorio.push({ tabela, registros: 0, status: 'vazia' });
                }
            } catch (error) {
                if (error.code === 'ER_NO_SUCH_TABLE') {
                    relatorio.push({ tabela, registros: 0, status: 'não existe' });
                } else {
                    throw error;
                }
            }
        }
        
        // Reabilitar FK checks
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        
        // Contar o que sobrou
        const [cores] = await db.query('SELECT COUNT(*) as total FROM configuracoes_cores');
        const [gramaturas] = await db.query('SELECT COUNT(*) as total FROM configuracoes_gramaturas');
        
        console.log('✅ Limpeza concluída!');
        
        res.json({
            success: true,
            message: 'Dados limpos com sucesso',
            totalApagado,
            relatorio,
            mantido: {
                cores: cores[0].total,
                gramaturas: gramaturas[0].total
            }
        });
        
    } catch (error) {
        console.error('❌ Erro ao limpar dados:', error);
        
        // Tentar reabilitar FK checks mesmo em caso de erro
        try {
            await db.query('SET FOREIGN_KEY_CHECKS = 1');
        } catch (e) {
            console.error('Erro ao reabilitar FK checks:', e);
        }
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * ROTA ADMIN: Fix PLACA
 * Cria coluna placa se não existir
 * Acesse: GET /api/admin/fix-placa
 */
router.get('/fix-placa', async (req, res) => {
    try {
        const results = [];
        
        // 1. Verificar se coluna existe
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'bobinas' 
            AND COLUMN_NAME = 'placa'
        `);
        
        if (columns.length > 0) {
            results.push('✅ Coluna placa JÁ EXISTE');
        } else {
            // Criar coluna
            await db.query(`
                ALTER TABLE bobinas 
                ADD COLUMN placa VARCHAR(100) DEFAULT NULL 
                COMMENT 'Código único do fabricante'
            `);
            results.push('✅ Coluna placa CRIADA');
        }
        
        // 2. Verificar índice
        const [indexes] = await db.query(`
            SELECT INDEX_NAME 
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'bobinas' 
            AND INDEX_NAME = 'idx_bobinas_placa'
        `);
        
        if (indexes.length > 0) {
            results.push('✅ Índice idx_bobinas_placa JÁ EXISTE');
        } else {
            await db.query(`
                CREATE INDEX idx_bobinas_placa ON bobinas(placa)
            `);
            results.push('✅ Índice idx_bobinas_placa CRIADO');
        }
        
        // 3. Registrar migrations
        const migrations = ['027_add_placa_to_bobinas.js', '028_add_placa_fallback.js'];
        
        for (const migration of migrations) {
            const [exists] = await db.query(
                'SELECT * FROM migrations WHERE name = ?',
                [migration]
            );
            
            if (exists.length === 0) {
                await db.query('INSERT INTO migrations (name) VALUES (?)', [migration]);
                results.push(`✅ Migration ${migration} REGISTRADA`);
            } else {
                results.push(`⏭️  Migration ${migration} já estava registrada`);
            }
        }
        
        // Retornar HTML com resultado
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Fix PLACA - Admin</title>
                <style>
                    body { font-family: monospace; padding: 40px; background: #1e1e1e; color: #00ff00; }
                    h1 { color: #00ff00; }
                    .result { background: #2d2d2d; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .success { color: #00ff00; }
                    .skip { color: #ffaa00; }
                </style>
            </head>
            <body>
                <h1>🔧 Fix PLACA - Executado com Sucesso!</h1>
                <div class="result">
                    ${results.map(r => `<div class="${r.includes('JÁ') ? 'skip' : 'success'}">${r}</div>`).join('')}
                </div>
                <p>✅ Agora você pode usar o campo PLACA normalmente no app!</p>
            </body>
            </html>
        `);
        
    } catch (error) {
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Erro - Fix PLACA</title></head>
            <body style="font-family: monospace; padding: 40px; background: #1e1e1e; color: #ff0000;">
                <h1>❌ Erro ao criar PLACA</h1>
                <pre>${error.message}</pre>
                <pre>Code: ${error.code}</pre>
                <pre>SQL State: ${error.sqlState}</pre>
            </body>
            </html>
        `);
    }
});

/**
 * ROTA DEBUG: Verificar PLACA de uma bobina
 * Acesse: GET /api/admin/debug-placa?codigo=BOB-0001
 */
router.get('/debug-placa', async (req, res) => {
    try {
        const { codigo } = req.query;
        
        if (!codigo) {
            return res.status(400).json({ error: 'Código é obrigatório. Use: ?codigo=BOB-0001' });
        }
        
        // Buscar bobina
        const [bobinas] = await db.query(`
            SELECT 
                b.id,
                b.codigo_interno,
                b.placa,
                b.nota_fiscal,
                b.metragem_inicial,
                b.metragem_atual,
                b.produto_id,
                b.loja,
                b.data_entrada,
                p.codigo as produto_codigo,
                p.fabricante,
                c.nome_cor,
                g.gramatura
            FROM bobinas b
            LEFT JOIN produtos p ON b.produto_id = p.id
            LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
            LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE b.codigo_interno = ?
        `, [codigo]);
        
        if (bobinas.length === 0) {
            return res.json({
                success: false,
                message: `❌ Bobina ${codigo} não encontrada no banco!`
            });
        }
        
        const bobina = bobinas[0];
        
        // Retornar HTML com resultado
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Debug PLACA - ${codigo}</title>
                <style>
                    body { font-family: monospace; padding: 40px; background: #1e1e1e; color: #00ff00; }
                    h1 { color: #00ff00; }
                    .info { background: #2d2d2d; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .label { color: #888; display: inline-block; width: 180px; }
                    .value { color: #00ff00; font-weight: bold; }
                    .null { color: #ff0000; font-weight: bold; }
                    .warning { color: #ffaa00; background: #3d2d00; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .success { color: #00ff00; background: #003d00; padding: 15px; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <h1>🔍 Debug PLACA - ${codigo}</h1>
                
                <div class="info">
                    <div><span class="label">ID:</span> <span class="value">${bobina.id}</span></div>
                    <div><span class="label">Código Interno:</span> <span class="value">${bobina.codigo_interno}</span></div>
                    <div><span class="label">PLACA:</span> <span class="${bobina.placa ? 'value' : 'null'}">${bobina.placa || '❌ NULL/VAZIO'}</span></div>
                    <div><span class="label">Nota Fiscal:</span> <span class="value">${bobina.nota_fiscal}</span></div>
                    <div><span class="label">Loja:</span> <span class="value">${bobina.loja}</span></div>
                    <div><span class="label">Metragem Inicial:</span> <span class="value">${bobina.metragem_inicial}m</span></div>
                    <div><span class="label">Metragem Atual:</span> <span class="value">${bobina.metragem_atual}m</span></div>
                    <div><span class="label">Produto:</span> <span class="value">${bobina.produto_codigo}</span></div>
                    <div><span class="label">Fabricante:</span> <span class="value">${bobina.fabricante}</span></div>
                    <div><span class="label">Cor:</span> <span class="value">${bobina.nome_cor}</span></div>
                    <div><span class="label">Gramatura:</span> <span class="value">${bobina.gramatura}G</span></div>
                    <div><span class="label">Data Entrada:</span> <span class="value">${new Date(bobina.data_entrada).toLocaleString('pt-BR')}</span></div>
                </div>
                
                ${!bobina.placa ? `
                    <div class="warning">
                        <h2>⚠️ PROBLEMA IDENTIFICADO</h2>
                        <p>A coluna PLACA existe no banco, mas está NULL para esta bobina!</p>
                        <p><strong>Possíveis causas:</strong></p>
                        <ul>
                            <li>Bobina foi cadastrada ANTES da coluna placa ser criada</li>
                            <li>Campo PLACA não foi preenchido no cadastro</li>
                            <li>Erro no controller ao salvar (placa não chegou no INSERT)</li>
                        </ul>
                        <p><strong>Solução:</strong></p>
                        <p>Para adicionar PLACA agora, acesse o sistema web → Editar bobina (se houver essa função)</p>
                        <p>OU execute SQL manualmente no Railway:</p>
                        <code style="background: #000; padding: 10px; display: block; margin: 10px 0;">
                            UPDATE bobinas SET placa = 'SUA-PLACA-AQUI' WHERE codigo_interno = '${codigo}';
                        </code>
                    </div>
                ` : `
                    <div class="success">
                        <h2>✅ PLACA ENCONTRADA NO BANCO!</h2>
                        <p>Valor: <strong>${bobina.placa}</strong></p>
                        <p>Se não está aparecendo no frontend, o problema é na query ou renderização!</p>
                        <p><strong>Próximos passos:</strong></p>
                        <ul>
                            <li>Verificar se a query em routes/mobile.js retorna b.placa</li>
                            <li>Verificar logs do backend (console.log da bobina)</li>
                            <li>Verificar se o app mobile está usando cache antigo</li>
                        </ul>
                    </div>
                `}
                
                <h2>📋 Query Completa (JSON)</h2>
                <pre style="background: #000; padding: 20px; border-radius: 5px; overflow: auto;">${JSON.stringify(bobina, null, 2)}</pre>
            </body>
            </html>
        `);
        
    } catch (error) {
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Erro - Debug PLACA</title></head>
            <body style="font-family: monospace; padding: 40px; background: #1e1e1e; color: #ff0000;">
                <h1>❌ Erro ao buscar bobina</h1>
                <pre>${error.message}</pre>
                <pre>Stack: ${error.stack}</pre>
            </body>
            </html>
        `);
    }
});

module.exports = router;
