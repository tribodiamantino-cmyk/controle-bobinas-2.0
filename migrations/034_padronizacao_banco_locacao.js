/**
 * Migration 034: Padronização do Banco de Dados
 * 
 * Ref: docs/PADRONIZACAO_BANCO.md
 * 
 * Alterações:
 * 1. bobinas: locacao_id (FK) → locacao (VARCHAR)
 * 2. retalhos: localizacao_atual → locacao (VARCHAR)
 * 3. Dropar tabela locacoes e dependências
 * 4. Dropar tabela plano_locacoes
 * 5. Dropar tabela corte_locacoes (se existir)
 */

exports.up = async function(db) {
    console.log('🔄 Migration 034: Padronização do Banco de Dados');
    console.log('📋 Ref: docs/PADRONIZACAO_BANCO.md\n');

    // ============================================
    // FASE 1: Adicionar novas colunas
    // ============================================
    console.log('📍 FASE 1: Preparando novas colunas...');

    // 1.1 Adicionar bobinas.locacao (VARCHAR)
    const [bobinasLocacaoCol] = await db.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'bobinas' 
        AND COLUMN_NAME = 'locacao'
    `);

    if (bobinasLocacaoCol.length === 0) {
        await db.query(`
            ALTER TABLE bobinas 
            ADD COLUMN locacao VARCHAR(12) NULL 
            COMMENT 'Localização física (formato: 0000-X-0000)'
            AFTER placa
        `);
        console.log('  ✅ bobinas.locacao criada');
    } else {
        console.log('  ⏭️  bobinas.locacao já existe');
    }

    // 1.2 Verificar se retalhos tem locacao ou localizacao_atual
    const [retalhosLocacaoCol] = await db.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'retalhos' 
        AND COLUMN_NAME = 'locacao'
    `);

    const [retalhosLocalizacaoCol] = await db.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'retalhos' 
        AND COLUMN_NAME = 'localizacao_atual'
    `);

    if (retalhosLocacaoCol.length === 0) {
        await db.query(`
            ALTER TABLE retalhos 
            ADD COLUMN locacao VARCHAR(12) NULL 
            COMMENT 'Localização física (formato: 0000-X-0000)'
        `);
        console.log('  ✅ retalhos.locacao criada');
    } else {
        console.log('  ⏭️  retalhos.locacao já existe');
    }

    // ============================================
    // FASE 2: Migrar dados existentes
    // ============================================
    console.log('\n📍 FASE 2: Migrando dados existentes...');

    // 2.1 Migrar bobinas.locacao_id → bobinas.locacao
    const [bobinasLocacaoIdCol] = await db.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'bobinas' 
        AND COLUMN_NAME = 'locacao_id'
    `);

    if (bobinasLocacaoIdCol.length > 0) {
        // Verificar se tabela locacoes existe para migrar dados
        const [locacoesTable] = await db.query(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'locacoes'
        `);

        if (locacoesTable.length > 0) {
            // Tentar migrar dados - buscar código da locação
            try {
                const [migrated] = await db.query(`
                    UPDATE bobinas b
                    JOIN locacoes l ON b.locacao_id = l.id
                    SET b.locacao = l.codigo
                    WHERE b.locacao_id IS NOT NULL AND b.locacao IS NULL
                `);
                console.log(`  ✅ ${migrated.affectedRows} bobinas migradas de locacao_id`);
            } catch (e) {
                console.log('  ⚠️  Erro ao migrar locacao_id (dados podem não existir)');
            }
        }
    }

    // 2.2 Migrar retalhos.localizacao_atual → retalhos.locacao
    if (retalhosLocalizacaoCol.length > 0 && retalhosLocacaoCol.length === 0) {
        // Copiar dados
        try {
            const [migrated] = await db.query(`
                UPDATE retalhos 
                SET locacao = localizacao_atual 
                WHERE localizacao_atual IS NOT NULL AND locacao IS NULL
            `);
            console.log(`  ✅ ${migrated.affectedRows} retalhos migrados de localizacao_atual`);
        } catch (e) {
            console.log('  ⚠️  Erro ao migrar localizacao_atual');
        }
    }

    // ============================================
    // FASE 3: Remover FKs e colunas antigas
    // ============================================
    console.log('\n📍 FASE 3: Removendo colunas antigas...');

    // 3.1 Remover FK de bobinas.locacao_id
    if (bobinasLocacaoIdCol.length > 0) {
        // Listar FKs
        const [fks] = await db.query(`
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'bobinas'
            AND COLUMN_NAME = 'locacao_id'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);

        for (const fk of fks) {
            try {
                await db.query(`ALTER TABLE bobinas DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
                console.log(`  ✅ FK ${fk.CONSTRAINT_NAME} removida de bobinas`);
            } catch (e) {
                console.log(`  ⚠️  FK ${fk.CONSTRAINT_NAME} já não existe`);
            }
        }

        // Dropar coluna
        await db.query(`ALTER TABLE bobinas DROP COLUMN locacao_id`);
        console.log('  ✅ bobinas.locacao_id removida');
    }

    // 3.2 Remover retalhos.localizacao_atual (se locacao já existe)
    if (retalhosLocalizacaoCol.length > 0) {
        await db.query(`ALTER TABLE retalhos DROP COLUMN localizacao_atual`);
        console.log('  ✅ retalhos.localizacao_atual removida');
    }

    // ============================================
    // FASE 4: Dropar tabelas obsoletas
    // ============================================
    console.log('\n📍 FASE 4: Removendo tabelas obsoletas...');

    // 4.1 Dropar corte_locacoes (depende de locacoes)
    const [corteLocacoesTable] = await db.query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'corte_locacoes'
    `);

    if (corteLocacoesTable.length > 0) {
        await db.query(`DROP TABLE corte_locacoes`);
        console.log('  ✅ Tabela corte_locacoes removida');
    }

    // 4.2 Dropar plano_locacoes (depende de locacoes)
    const [planoLocacoesTable] = await db.query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'plano_locacoes'
    `);

    if (planoLocacoesTable.length > 0) {
        await db.query(`DROP TABLE plano_locacoes`);
        console.log('  ✅ Tabela plano_locacoes removida');
    }

    // 4.3 Dropar retalhos.locacao_id (se existir FK para locacoes)
    const [retalhosLocacaoIdCol] = await db.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'retalhos' 
        AND COLUMN_NAME = 'locacao_id'
    `);

    if (retalhosLocacaoIdCol.length > 0) {
        // Remover FK primeiro
        const [fks] = await db.query(`
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'retalhos'
            AND COLUMN_NAME = 'locacao_id'
            AND REFERENCED_TABLE_NAME IS NOT NULL
        `);

        for (const fk of fks) {
            try {
                await db.query(`ALTER TABLE retalhos DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
                console.log(`  ✅ FK ${fk.CONSTRAINT_NAME} removida de retalhos`);
            } catch (e) {
                console.log(`  ⚠️  FK ${fk.CONSTRAINT_NAME} já não existe`);
            }
        }

        await db.query(`ALTER TABLE retalhos DROP COLUMN locacao_id`);
        console.log('  ✅ retalhos.locacao_id removida');
    }

    // 4.4 Dropar tabela locacoes
    const [locacoesTable] = await db.query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'locacoes'
    `);

    if (locacoesTable.length > 0) {
        await db.query(`DROP TABLE locacoes`);
        console.log('  ✅ Tabela locacoes removida');
    }

    // ============================================
    // FASE 5: Adicionar índices
    // ============================================
    console.log('\n📍 FASE 5: Criando índices...');

    // Índice em bobinas.locacao
    try {
        await db.query(`CREATE INDEX idx_bobinas_locacao ON bobinas(locacao)`);
        console.log('  ✅ Índice idx_bobinas_locacao criado');
    } catch (e) {
        if (e.code === 'ER_DUP_KEYNAME') {
            console.log('  ⏭️  Índice idx_bobinas_locacao já existe');
        } else {
            console.log('  ⚠️  Erro ao criar índice:', e.message);
        }
    }

    // Índice em retalhos.locacao
    try {
        await db.query(`CREATE INDEX idx_retalhos_locacao ON retalhos(locacao)`);
        console.log('  ✅ Índice idx_retalhos_locacao criado');
    } catch (e) {
        if (e.code === 'ER_DUP_KEYNAME') {
            console.log('  ⏭️  Índice idx_retalhos_locacao já existe');
        } else {
            console.log('  ⚠️  Erro ao criar índice:', e.message);
        }
    }

    console.log('\n✅ Migration 034 concluída: Banco padronizado!');
    console.log('📋 Padrão locacao: VARCHAR(12), formato 0000-X-0000');
};

exports.down = async function(db) {
    console.log('⚠️  Migration 034 DOWN: Não é possível reverter automaticamente');
    console.log('   - Tabelas locacoes, plano_locacoes, corte_locacoes foram removidas');
    console.log('   - Dados de locacao_id foram perdidos');
    console.log('   - Para reverter, restaure backup do banco');
};
