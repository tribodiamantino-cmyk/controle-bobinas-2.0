/**
 * Script de diagnóstico: Verificar PLACA no banco
 * Execute: node debug-placa.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugPlaca() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQLHOST || process.env.DB_HOST,
        port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
        user: process.env.MYSQLUSER || process.env.DB_USER,
        password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
        database: process.env.MYSQLDATABASE || process.env.DB_NAME
    });

    try {
        console.log('🔍 Buscando BOB-0001...\n');
        
        // Buscar bobina
        const [bobinas] = await connection.query(`
            SELECT 
                b.id,
                b.codigo_interno,
                b.placa,
                b.nota_fiscal,
                b.metragem_inicial,
                b.produto_id
            FROM bobinas b
            WHERE b.codigo_interno = 'BOB-0001'
        `);
        
        if (bobinas.length === 0) {
            console.log('❌ BOB-0001 não encontrada no banco!');
            process.exit(1);
        }
        
        const bobina = bobinas[0];
        
        console.log('📦 Bobina encontrada:');
        console.log('   ID:', bobina.id);
        console.log('   Código:', bobina.codigo_interno);
        console.log('   PLACA:', bobina.placa || '❌ NULL/VAZIO');
        console.log('   Nota Fiscal:', bobina.nota_fiscal);
        console.log('   Metragem:', bobina.metragem_inicial);
        console.log('   Produto ID:', bobina.produto_id);
        console.log('');
        
        if (!bobina.placa) {
            console.log('⚠️  PROBLEMA IDENTIFICADO: PLACA está NULL no banco!');
            console.log('');
            console.log('📋 Soluções:');
            console.log('   1. A bobina foi cadastrada ANTES da coluna placa existir');
            console.log('   2. O campo placa não foi enviado no POST /api/bobinas');
            console.log('   3. Houve erro no controller ao salvar a PLACA');
            console.log('');
            console.log('🔧 Para corrigir, execute:');
            console.log(`   UPDATE bobinas SET placa = 'SUA-PLACA-AQUI' WHERE codigo_interno = 'BOB-0001';`);
        } else {
            console.log('✅ PLACA existe no banco! Problema deve estar no frontend.');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

debugPlaca().catch(console.error);
