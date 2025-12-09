/**
 * Script para criar coluna PLACA diretamente no banco Railway
 * Execute: node fix-placa-railway.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixPlaca() {
    console.log('🔧 Conectando ao Railway MySQL...\n');
    
    // Usar variáveis do Railway
    const connection = await mysql.createConnection({
        host: process.env.MYSQLHOST || process.env.DB_HOST,
        port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
        user: process.env.MYSQLUSER || process.env.DB_USER,
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
        database: process.env.MYSQLDATABASE || process.env.DB_NAME
    });

    try {
        console.log('✅ Conectado ao Railway!\n');
        
        // 1. Verificar se coluna já existe
        console.log('1️⃣  Verificando se coluna placa existe...');
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'bobinas' 
            AND COLUMN_NAME = 'placa'
        `);
        
        if (columns.length > 0) {
            console.log('✅ Coluna placa JÁ EXISTE! Pulando criação...\n');
        } else {
            console.log('⚠️  Coluna placa NÃO EXISTE. Criando...\n');
            
            // 2. Criar coluna
            console.log('2️⃣  Criando coluna placa...');
            await connection.query(`
                ALTER TABLE bobinas 
                ADD COLUMN placa VARCHAR(100) DEFAULT NULL 
                COMMENT 'Código único do fabricante (vinculado à garantia)'
            `);
            console.log('✅ Coluna placa criada!\n');
        }
        
        // 3. Verificar se índice já existe
        console.log('3️⃣  Verificando se índice existe...');
        const [indexes] = await connection.query(`
            SELECT INDEX_NAME 
            FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'bobinas' 
            AND INDEX_NAME = 'idx_bobinas_placa'
        `);
        
        if (indexes.length > 0) {
            console.log('✅ Índice idx_bobinas_placa JÁ EXISTE!\n');
        } else {
            console.log('⚠️  Índice NÃO EXISTE. Criando...\n');
            
            // 4. Criar índice
            console.log('4️⃣  Criando índice...');
            await connection.query(`
                CREATE INDEX idx_bobinas_placa ON bobinas(placa)
            `);
            console.log('✅ Índice idx_bobinas_placa criado!\n');
        }
        
        // 5. Registrar migrations como executadas
        console.log('5️⃣  Registrando migrations...');
        
        const migrations = [
            '027_add_placa_to_bobinas.js',
            '028_add_placa_fallback.js'
        ];
        
        for (const migration of migrations) {
            const [exists] = await connection.query(
                'SELECT * FROM migrations WHERE name = ?',
                [migration]
            );
            
            if (exists.length === 0) {
                await connection.query(
                    'INSERT INTO migrations (name) VALUES (?)',
                    [migration]
                );
                console.log(`   ✅ ${migration} registrada`);
            } else {
                console.log(`   ⏭️  ${migration} já estava registrada`);
            }
        }
        
        console.log('\n🎉 PLACA configurada com sucesso no Railway!\n');
        console.log('📋 Próximos passos:');
        console.log('   1. Descomentar b.placa em routes/mobile.js');
        console.log('   2. Commitar e fazer push');
        console.log('   3. Testar no app - PLACA deve aparecer!\n');
        
    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        console.error('   Code:', error.code);
        console.error('   SQL State:', error.sqlState);
        process.exit(1);
    } finally {
        await connection.end();
        console.log('🔌 Conexão fechada.\n');
    }
}

// Executar
fixPlaca().catch(console.error);
