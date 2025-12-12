/**
 * Script de diagnóstico para investigar retalhos no banco
 * Verifica dados reais e formato dos códigos
 */

const db = require('../config/database');

async function debugRetalhos() {
    try {
        console.log('🔍 DIAGNÓSTICO DE RETALHOS\n');
        console.log('=' .repeat(60));
        
        // 1. Verificar estrutura da tabela
        console.log('\n📋 ESTRUTURA DA TABELA retalhos:');
        const [colunas] = await db.query('DESCRIBE retalhos');
        console.table(colunas);
        
        // 2. Buscar RET-CIA-000013 especificamente
        console.log('\n🎯 BUSCANDO RET-CIA-000013:');
        const [retalho13] = await db.query(
            'SELECT * FROM retalhos WHERE codigo_retalho = ?',
            ['RET-CIA-000013']
        );
        console.log('Resultado:', retalho13.length > 0 ? 'ENCONTRADO ✅' : 'NÃO ENCONTRADO ❌');
        if (retalho13.length > 0) {
            console.table(retalho13);
        }
        
        // 3. Buscar variações (case insensitive, espaços, etc)
        console.log('\n🔍 BUSCANDO VARIAÇÕES DO CÓDIGO:');
        const [variacoes] = await db.query(`
            SELECT id, codigo_retalho, metragem, status 
            FROM retalhos 
            WHERE codigo_retalho LIKE '%CIA%000013%'
               OR codigo_retalho LIKE '%cia%000013%'
               OR id = 13
        `);
        console.log(`Encontrados: ${variacoes.length} registros`);
        console.table(variacoes);
        
        // 4. Listar TODOS os retalhos
        console.log('\n📊 TODOS OS RETALHOS NO BANCO:');
        const [todos] = await db.query(`
            SELECT 
                id, 
                codigo_retalho,
                metragem,
                status,
                produto_id,
                CHAR_LENGTH(codigo_retalho) as tamanho_codigo,
                HEX(codigo_retalho) as hex_codigo
            FROM retalhos 
            ORDER BY id DESC
            LIMIT 20
        `);
        console.table(todos);
        
        // 5. Estatísticas
        console.log('\n📈 ESTATÍSTICAS:');
        const [[stats]] = await db.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'Disponível' THEN 1 END) as disponiveis,
                COUNT(CASE WHEN status = 'Esgotado' THEN 1 END) as esgotados,
                COUNT(CASE WHEN codigo_retalho LIKE 'RET-CIA-%' THEN 1 END) as loja_cia,
                COUNT(CASE WHEN codigo_retalho LIKE 'RET-PLA-%' THEN 1 END) as loja_pla,
                COUNT(CASE WHEN codigo_retalho IS NULL OR codigo_retalho = '' THEN 1 END) as sem_codigo
            FROM retalhos
        `);
        console.table([stats]);
        
        // 6. Verificar se existe algum problema de encoding
        console.log('\n🔤 VERIFICAÇÃO DE ENCODING:');
        const [encoding] = await db.query(`
            SELECT 
                codigo_retalho,
                LENGTH(codigo_retalho) as bytes,
                CHAR_LENGTH(codigo_retalho) as caracteres,
                CAST(codigo_retalho AS BINARY) as binary_value
            FROM retalhos 
            WHERE id <= 20
        `);
        console.table(encoding);
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ Diagnóstico concluído!\n');
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error);
    } finally {
        process.exit(0);
    }
}

// Executar
debugRetalhos();
