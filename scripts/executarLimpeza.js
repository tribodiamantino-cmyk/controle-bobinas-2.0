/**
 * Script simples para executar limpeza do banco via SQL
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function executarLimpeza() {
    let connection;
    
    try {
        console.log('\n' + '⚠️ '.repeat(35));
        console.log('⚠️  LIMPEZA TOTAL DO BANCO DE DADOS  ⚠️');
        console.log('⚠️ '.repeat(35) + '\n');
        
        console.log('🔌 Conectando ao banco...');
        
        connection = await mysql.createConnection({
            host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
            user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
            password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
            database: process.env.MYSQL_DATABASE || process.env.MYSQLDATABASE || 'controle_bobinas',
            port: process.env.MYSQLPORT || 3306,
            multipleStatements: true
        });
        
        console.log('✅ Conectado!\n');
        
        // Ler arquivo SQL
        const sqlPath = path.join(__dirname, 'limpar-dados.sql');
        const sql = await fs.readFile(sqlPath, 'utf-8');
        
        console.log('🗑️  Executando limpeza...\n');
        
        // Executar SQL
        await connection.query(sql);
        
        console.log('✅ Limpeza concluída com sucesso!\n');
        
        // Verificar o que sobrou
        const [cores] = await connection.query('SELECT COUNT(*) as total FROM configuracoes_cores');
        const [gramaturas] = await connection.query('SELECT COUNT(*) as total FROM configuracoes_gramaturas');
        const [produtos] = await connection.query('SELECT COUNT(*) as total FROM produtos');
        const [bobinas] = await connection.query('SELECT COUNT(*) as total FROM bobinas');
        
        console.log('📊 Resumo:');
        console.log(`  ✓ ${cores[0].total} cores mantidas`);
        console.log(`  ✓ ${gramaturas[0].total} gramaturas mantidas`);
        console.log(`  ✓ ${produtos[0].total} produtos (deve ser 0)`);
        console.log(`  ✓ ${bobinas[0].total} bobinas (deve ser 0)`);
        
        console.log('\n🎯 Pronto para adicionar dados realistas!\n');
        
    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

executarLimpeza();
