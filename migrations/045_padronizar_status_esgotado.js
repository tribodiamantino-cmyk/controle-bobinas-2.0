/**
 * Migration 045: Padroniza status 'Vazia' para 'Esgotado'
 * 
 * Problema: Código usava 'Vazia' em alguns lugares, mas convenção é 'Esgotado'
 * Solução: Converter todos os dados e remover 'Vazia' do ENUM
 * 
 * Convenção do sistema:
 * - 'Esgotado' = item com metragem zerada (mantido para histórico)
 * - NÃO usar 'Vazia' (legado)
 */

exports.up = async function(db) {
    console.log('🔄 Migration 045: Padronizando status Vazia → Esgotado...');
    
    try {
        // 1. Converter bobinas com status 'Vazia' para 'Esgotado'
        const [bobinasVazias] = await db.query(`
            SELECT COUNT(*) as total FROM bobinas WHERE status = 'Vazia'
        `);
        
        if (bobinasVazias[0].total > 0) {
            await db.query(`UPDATE bobinas SET status = 'Esgotado' WHERE status = 'Vazia'`);
            console.log(`  ✅ ${bobinasVazias[0].total} bobinas convertidas de 'Vazia' para 'Esgotado'`);
        } else {
            console.log('  ⏭️  Nenhuma bobina com status Vazia');
        }
        
        // 2. Converter retalhos com status 'Vazia' para 'Esgotado' (se houver)
        const [retalhosVazios] = await db.query(`
            SELECT COUNT(*) as total FROM retalhos WHERE status = 'Vazia'
        `);
        
        if (retalhosVazios[0].total > 0) {
            await db.query(`UPDATE retalhos SET status = 'Esgotado' WHERE status = 'Vazia'`);
            console.log(`  ✅ ${retalhosVazios[0].total} retalhos convertidos de 'Vazia' para 'Esgotado'`);
        } else {
            console.log('  ⏭️  Nenhum retalho com status Vazia');
        }
        
        // 3. Atualizar ENUM de bobinas para remover 'Vazia'
        await db.query(`
            ALTER TABLE bobinas 
            MODIFY COLUMN status ENUM('Disponível', 'Em Uso', 'Bloqueada', 'Esgotado') 
            DEFAULT 'Disponível'
        `);
        console.log('  ✅ ENUM de bobinas atualizado (removido Vazia)');
        
        // 4. Verificar e atualizar ENUM de retalhos
        const [retalhosEnum] = await db.query(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'retalhos' 
            AND COLUMN_NAME = 'status'
        `);
        
        if (retalhosEnum.length > 0 && retalhosEnum[0].COLUMN_TYPE.includes('Vazia')) {
            await db.query(`
                ALTER TABLE retalhos 
                MODIFY COLUMN status ENUM('Disponível', 'Reservado', 'Esgotado') 
                DEFAULT 'Disponível'
            `);
            console.log('  ✅ ENUM de retalhos atualizado (removido Vazia)');
        }
        
        console.log('✅ Migration 045 concluída - Status padronizado para Esgotado');
        
    } catch (error) {
        console.error('❌ Erro na migration 045:', error.message);
        throw error;
    }
};

exports.down = async function(db) {
    // Reverter não faz sentido neste caso - 'Esgotado' é o correto
    console.log('⚠️  Migration 045 não pode ser revertida (padronização é definitiva)');
};
