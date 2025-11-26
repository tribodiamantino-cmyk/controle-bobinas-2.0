const express = require('express');
const router = express.Router();
const db = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

// Endpoint para executar migração do Bando Y
router.post('/migrate-bando-y', async (req, res) => {
    try {
        const sqlPath = path.join(__dirname, '..', 'database', 'alter-produtos-bando-y.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');
        
        // Dividir por ; e executar cada statement
        const statements = sql.split(';').filter(s => s.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await db.query(statement);
                } catch (err) {
                    console.log('Statement error (pode ser ignorado se coluna já existe):', err.message);
                }
            }
        }
        
        res.json({ 
            success: true, 
            message: 'Migração executada com sucesso! Tabela produtos atualizada para suportar Bando Y' 
        });
    } catch (error) {
        console.error('Erro na migração:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint para remover coluna largura_total
router.post('/remove-largura-total', async (req, res) => {
    try {
        // Verificar se a coluna existe antes de tentar remover
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'produtos' 
            AND COLUMN_NAME = 'largura_total'
        `);
        
        if (columns.length > 0) {
            await db.query('ALTER TABLE produtos DROP COLUMN largura_total');
            res.json({ 
                success: true, 
                message: 'Coluna largura_total removida com sucesso!' 
            });
        } else {
            res.json({ 
                success: true, 
                message: 'Coluna largura_total já não existe (migração já foi executada)' 
            });
        }
    } catch (error) {
        console.error('Erro ao remover coluna:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint para adicionar "Sem Bainha" ao ENUM tipo_bainha
router.post('/add-sem-bainha', async (req, res) => {
    try {
        await db.query(`
            ALTER TABLE produtos 
            MODIFY COLUMN tipo_bainha ENUM('Sem Bainha', 'Cano/Cano', 'Cano/Arame', 'Arame/Arame')
        `);
        
        res.json({ 
            success: true, 
            message: 'Opção "Sem Bainha" adicionada com sucesso!' 
        });
    } catch (error) {
        console.error('Erro ao atualizar ENUM:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint para verificar estrutura da tabela produtos
router.get('/check-produtos-table', async (req, res) => {
    try {
        const [columns] = await db.query(`
            SHOW COLUMNS FROM produtos
        `);
        
        res.json({ 
            success: true, 
            columns: columns 
        });
    } catch (error) {
        console.error('Erro ao verificar tabela:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint para adicionar colunas faltantes para Bando Y
router.post('/fix-produtos-columns', async (req, res) => {
    try {
        const operations = [];
        
        // Verificar e adicionar tipo_tecido
        const [tipoTecidoExists] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'produtos' 
            AND COLUMN_NAME = 'tipo_tecido'
        `);
        
        if (tipoTecidoExists.length === 0) {
            await db.query(`
                ALTER TABLE produtos 
                ADD COLUMN tipo_tecido ENUM('Normal', 'Bando Y') DEFAULT 'Normal' AFTER fabricante
            `);
            operations.push('Adicionada coluna tipo_tecido');
        }
        
        // Verificar e adicionar largura_maior
        const [larguraMaiorExists] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'produtos' 
            AND COLUMN_NAME = 'largura_maior'
        `);
        
        if (larguraMaiorExists.length === 0) {
            await db.query(`
                ALTER TABLE produtos 
                ADD COLUMN largura_maior DECIMAL(10,2) NULL AFTER largura_final
            `);
            operations.push('Adicionada coluna largura_maior');
        }
        
        // Verificar e adicionar largura_y
        const [larguraYExists] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'produtos' 
            AND COLUMN_NAME = 'largura_y'
        `);
        
        if (larguraYExists.length === 0) {
            await db.query(`
                ALTER TABLE produtos 
                ADD COLUMN largura_y DECIMAL(10,2) NULL AFTER largura_maior
            `);
            operations.push('Adicionada coluna largura_y');
        }
        
        if (operations.length > 0) {
            res.json({ 
                success: true, 
                message: 'Colunas adicionadas com sucesso!',
                operations: operations
            });
        } else {
            res.json({ 
                success: true, 
                message: 'Todas as colunas já existem (migração já foi executada)'
            });
        }
    } catch (error) {
        console.error('Erro ao adicionar colunas:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint para criar tabela de bobinas
router.post('/create-bobinas-table', async (req, res) => {
    try {
        const sqlPath = path.join(__dirname, '..', 'database', 'create-bobinas-table.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');
        
        await db.query(sql);
        
        res.json({ 
            success: true, 
            message: 'Tabela bobinas criada com sucesso!' 
        });
    } catch (error) {
        console.error('Erro ao criar tabela bobinas:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint para adicionar coluna codigo_interno em bobinas
router.post('/fix-bobinas-codigo-interno', async (req, res) => {
    try {
        // Verificar se a coluna existe
        const [columns] = await db.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'bobinas' 
            AND COLUMN_NAME = 'codigo_interno'
        `);
        
        if (columns.length === 0) {
            // Adicionar coluna
            await db.query(`
                ALTER TABLE bobinas 
                ADD COLUMN codigo_interno VARCHAR(20) UNIQUE NOT NULL AFTER id
            `);
            
            res.json({ 
                success: true, 
                message: 'Coluna codigo_interno adicionada com sucesso!' 
            });
        } else {
            res.json({ 
                success: true, 
                message: 'Coluna codigo_interno já existe' 
            });
        }
    } catch (error) {
        console.error('Erro ao adicionar coluna:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint para verificar estrutura da tabela bobinas
router.get('/check-bobinas-table', async (req, res) => {
    try {
        const [columns] = await db.query(`
            SHOW COLUMNS FROM bobinas
        `);
        
        res.json({ 
            success: true, 
            columns: columns 
        });
    } catch (error) {
        console.error('Erro ao verificar tabela:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint para recriar tabela bobinas completamente
router.post('/recreate-bobinas-table', async (req, res) => {
    try {
        // Desabilitar verificação de chaves estrangeiras temporariamente
        await db.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Dropar tabela se existir
        await db.query('DROP TABLE IF EXISTS bobinas');
        
        // Criar tabela nova
        await db.query(`
            CREATE TABLE bobinas (
                id INT PRIMARY KEY AUTO_INCREMENT,
                codigo_interno VARCHAR(20) UNIQUE NOT NULL COMMENT 'Código único da bobina (ex: CTV-2024-00001)',
                nota_fiscal VARCHAR(50) NOT NULL COMMENT 'Número da nota fiscal',
                loja ENUM('Cortinave', 'BN') NOT NULL COMMENT 'Loja de destino',
                produto_id INT NOT NULL COMMENT 'Referência ao produto',
                metragem_inicial DECIMAL(10,2) NOT NULL COMMENT 'Metragem inicial da bobina em metros',
                metragem_atual DECIMAL(10,2) NOT NULL COMMENT 'Metragem atual após cortes',
                observacoes TEXT COMMENT 'Observações adicionais',
                status ENUM('Disponível', 'Em uso', 'Esgotada') DEFAULT 'Disponível' COMMENT 'Status da bobina',
                data_entrada DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de entrada da bobina',
                FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE RESTRICT,
                INDEX idx_codigo_interno (codigo_interno),
                INDEX idx_loja (loja),
                INDEX idx_produto (produto_id),
                INDEX idx_status (status),
                INDEX idx_data_entrada (data_entrada)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabela de bobinas de lonas'
        `);
        
        // Reabilitar verificação de chaves estrangeiras
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        
        res.json({ 
            success: true, 
            message: 'Tabela bobinas recriada com sucesso!' 
        });
    } catch (error) {
        // Reabilitar verificação de chaves estrangeiras em caso de erro
        await db.query('SET FOREIGN_KEY_CHECKS = 1');
        
        console.error('Erro ao recriar tabela:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Endpoint para popular banco com dados de teste
router.post('/seed-database', async (req, res) => {
    try {
        const fabricantes = ['Propex', 'Textiloeste'];
        const lojas = ['Cortinave', 'BN'];
        const tiposTecido = ['Normal', 'Bando Y'];
        const tiposBainha = ['Sem Bainha', 'Cano/Cano', 'Cano/Arame', 'Arame/Arame'];
        
        const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const randomChoice = (array) => array[randomInt(0, array.length - 1)];
        
        // Buscar cores e gramaturas
        const [coresDb] = await db.query('SELECT id, nome_cor FROM configuracoes_cores WHERE ativo = 1');
        const [gramaturasDb] = await db.query('SELECT id, gramatura FROM configuracoes_gramaturas WHERE ativo = 1');
        
        if (coresDb.length === 0 || gramaturasDb.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Não há cores ou gramaturas cadastradas!' 
            });
        }
        
        const produtosCriados = [];
        
        // Criar 10 produtos
        for (let i = 0; i < 10; i++) {
            const loja = i < 5 ? 'Cortinave' : 'BN';
            const prefixo = loja === 'Cortinave' ? 'CTV' : 'BN';
            const codigo = `${prefixo}-${String(i + 1).padStart(3, '0')}`;
            const fabricante = randomChoice(fabricantes);
            const tipoTecido = randomChoice(tiposTecido);
            const cor = randomChoice(coresDb);
            const gramatura = randomChoice(gramaturasDb);
            
            let larguraSemCostura = null, tipoBainha = null, larguraFinal = null;
            let larguraMaior = null, larguraY = null;
            
            if (tipoTecido === 'Bando Y') {
                larguraMaior = randomInt(300, 400);
                larguraY = randomInt(150, 250);
            } else {
                larguraSemCostura = randomInt(250, 350);
                tipoBainha = randomChoice(tiposBainha);
                larguraFinal = larguraSemCostura - randomInt(1, 5);
            }
            
            const [result] = await db.query(
                `INSERT INTO produtos 
                (loja, codigo, cor_id, gramatura_id, fabricante, tipo_tecido, 
                 largura_sem_costura, tipo_bainha, largura_final, largura_maior, largura_y, ativo) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [loja, codigo, cor.id, gramatura.id, fabricante, tipoTecido,
                 larguraSemCostura, tipoBainha, larguraFinal, larguraMaior, larguraY]
            );
            
            produtosCriados.push({ id: result.insertId, loja, codigo });
        }
        
        // Criar 5 bobinas para cada produto
        let totalBobinas = 0;
        const ano = new Date().getFullYear();
        
        for (const produto of produtosCriados) {
            for (let j = 0; j < 5; j++) {
                const prefixo = produto.loja === 'Cortinave' ? 'CTV' : 'BN';
                const sequencial = totalBobinas + 1;
                const codigoInterno = `${prefixo}-${ano}-${String(sequencial).padStart(5, '0')}`;
                const notaFiscal = `NF-${randomInt(10000, 99999)}`;
                const metragem = randomInt(300, 600);
                const status = randomChoice(['Disponível', 'Disponível', 'Disponível', 'Em uso']);
                
                await db.query(
                    `INSERT INTO bobinas 
                    (codigo_interno, nota_fiscal, loja, produto_id, metragem_inicial, metragem_atual, status, observacoes) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [codigoInterno, notaFiscal, produto.loja, produto.id, metragem, metragem, status,
                     'Bobina de teste gerada automaticamente']
                );
                
                totalBobinas++;
            }
        }
        
        res.json({ 
            success: true, 
            message: 'Dados de teste criados com sucesso!',
            produtos: produtosCriados.length,
            bobinas: totalBobinas
        });
        
    } catch (error) {
        console.error('Erro ao popular banco:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

module.exports = router;
