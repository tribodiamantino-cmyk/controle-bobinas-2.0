/**
 * Migration 036: Atualizar códigos de retalhos para novo formato
 * 
 * Formato antigo: RET-0001
 * Formato novo:   RET-{LOJA}-000001 (ex: RET-PLA-000001, RET-CIA-000001)
 * 
 * Conforme PADRONIZACAO_CODIGOS.md
 */

exports.up = async function(db) {
    try {
        console.log('🔄 Migration 036: Atualizando códigos de retalhos...');
        
        // Verificar se existem retalhos com formato antigo
        const [retalhos] = await db.query(`
            SELECT r.id, r.codigo_retalho, p.loja
            FROM retalhos r
            LEFT JOIN produtos p ON r.produto_id = p.id
            WHERE r.codigo_retalho LIKE 'RET-%'
            AND r.codigo_retalho NOT LIKE 'RET-___-______'
        `);
        
        if (retalhos.length === 0) {
            console.log('✅ Migration 036: Nenhum retalho com formato antigo encontrado');
            return;
        }
        
        console.log(`📋 Migration 036: Encontrados ${retalhos.length} retalhos para atualizar`);
        
        // Atualizar cada retalho
        for (const retalho of retalhos) {
            const loja = retalho.loja || 'Cortinave';
            const prefixoLoja = loja === 'Cortinave' ? 'PLA' : 'CIA';
            
            // Extrair número do código antigo (RET-0001 → 0001)
            const numeroAntigo = retalho.codigo_retalho.split('-')[1];
            
            // Gerar novo código com 6 dígitos
            const novoCodigo = `RET-${prefixoLoja}-${numeroAntigo.padStart(6, '0')}`;
            
            await db.query(
                'UPDATE retalhos SET codigo_retalho = ? WHERE id = ?',
                [novoCodigo, retalho.id]
            );
            
            console.log(`  ✓ ${retalho.codigo_retalho} → ${novoCodigo}`);
        }
        
        console.log('✅ Migration 036: Códigos de retalhos atualizados com sucesso');
        
    } catch (error) {
        console.error('❌ Migration 036: Erro ao atualizar códigos de retalhos:', error.message);
        throw error;
    }
};

exports.down = async function(db) {
    try {
        // Reverter para formato antigo (apenas para desenvolvimento)
        const [retalhos] = await db.query(`
            SELECT id, codigo_retalho
            FROM retalhos
            WHERE codigo_retalho LIKE 'RET-___-______'
        `);
        
        for (const retalho of retalhos) {
            // RET-PLA-000001 → RET-0001
            const partes = retalho.codigo_retalho.split('-');
            const numeroAntigo = `RET-${parseInt(partes[2])}`;
            
            await db.query(
                'UPDATE retalhos SET codigo_retalho = ? WHERE id = ?',
                [numeroAntigo, retalho.id]
            );
        }
        
        console.log('✅ Migration 036 DOWN: Revertido para formato antigo');
    } catch (error) {
        console.error('❌ Migration 036 DOWN: Erro:', error.message);
    }
};
