/**
 * Migration: Corrige códigos de corte para o formato padrão
 * 
 * Formatos anteriores (errados): 
 *   - COR-000001, COR-000002
 *   - COR-Cortinave-006-01
 * 
 * Formato correto: COR-{LOJA}-{PLANO}-{SEQUENCIAL}
 * Exemplo: COR-PLA-001-01, COR-PLA-001-02, COR-CIA-002-01
 * 
 * O sequencial reinicia para cada PDC (01, 02, 03... por plano)
 */

/**
 * Converte nome da loja para prefixo de 3 letras
 */
function getLojaPrefixo(loja) {
    if (!loja) return 'PLA';
    
    const lojaUpper = loja.toUpperCase();
    
    // Se já é um prefixo válido, retorna ele mesmo
    if (lojaUpper === 'PLA' || lojaUpper === 'CIA') {
        return lojaUpper;
    }
    
    // Mapeamento de nomes para prefixos
    const mapeamento = {
        'CORTINAVE': 'PLA',
        'PALOTINA': 'PLA',
        'BN': 'CIA',
        'CIANORTE': 'CIA'
    };
    
    return mapeamento[lojaUpper] || 'PLA';
}

exports.up = async function(db) {
    console.log('🔄 Migration 042: Corrigindo códigos de corte...');
    
    try {
        // Buscar todos os cortes que NÃO estão no formato correto
        // Formato correto: COR-XXX-NNN-NN (ex: COR-PLA-001-01)
        const [cortes] = await db.query(`
            SELECT 
                cr.id,
                cr.codigo_corte,
                cr.plano_corte_id,
                pc.loja
            FROM cortes_realizados cr
            LEFT JOIN planos_corte pc ON cr.plano_corte_id = pc.id
            WHERE cr.codigo_corte NOT REGEXP '^COR-[A-Z]{3}-[0-9]{3}-[0-9]{2}$'
            ORDER BY cr.plano_corte_id, cr.id
        `);
        
        if (cortes.length === 0) {
            console.log('✅ Nenhum corte precisa ser corrigido. Todos já estão no formato correto.');
            return;
        }
        
        console.log(`📝 Encontrados ${cortes.length} cortes para corrigir`);
        
        // Agrupar por plano para gerar sequencial correto
        const cortesPorPlano = {};
        for (const corte of cortes) {
            const planoId = corte.plano_corte_id || 0;
            if (!cortesPorPlano[planoId]) {
                cortesPorPlano[planoId] = {
                    loja: corte.loja || 'PLA',
                    cortes: []
                };
            }
            cortesPorPlano[planoId].cortes.push(corte);
        }
        
        // Para cada plano, buscar o último sequencial existente (no formato correto)
        // e gerar novos códigos para os que estão no formato errado
        let totalCorrigidos = 0;
        
        for (const planoId of Object.keys(cortesPorPlano)) {
            const { loja, cortes: cortesDoPlano } = cortesPorPlano[planoId];
            
            // Buscar último sequencial correto do plano
            const [ultimoCorreto] = await db.query(`
                SELECT codigo_corte 
                FROM cortes_realizados 
                WHERE plano_corte_id = ? 
                  AND codigo_corte REGEXP '^COR-[A-Z]{3}-[0-9]{3}-[0-9]{2}$'
                ORDER BY codigo_corte DESC 
                LIMIT 1
            `, [planoId]);
            
            let sequencial = 1;
            if (ultimoCorreto.length > 0) {
                const partes = ultimoCorreto[0].codigo_corte.split('-');
                if (partes.length >= 4) {
                    sequencial = parseInt(partes[3]) + 1;
                }
            }
            
            // Atualizar cada corte do plano
            for (const corte of cortesDoPlano) {
                // Converter loja para prefixo de 3 letras
                const lojaPrefixo = getLojaPrefixo(loja);
                const planoStr = String(planoId).padStart(3, '0');
                const seqStr = String(sequencial).padStart(2, '0');
                const novoCodigo = `COR-${lojaPrefixo}-${planoStr}-${seqStr}`;
                
                await db.query(
                    'UPDATE cortes_realizados SET codigo_corte = ? WHERE id = ?',
                    [novoCodigo, corte.id]
                );
                
                console.log(`   ${corte.codigo_corte} → ${novoCodigo}`);
                sequencial++;
                totalCorrigidos++;
            }
        }
        
        console.log(`✅ Migration 042: ${totalCorrigidos} códigos de corte corrigidos com sucesso!`);
        
    } catch (error) {
        console.error('❌ Erro na migration 042:', error.message);
        throw error;
    }
};

exports.down = async function(db) {
    // Não é possível reverter pois não sabemos o código original
    console.log('⚠️ Migration 042: Não é possível reverter (códigos originais não armazenados)');
};
