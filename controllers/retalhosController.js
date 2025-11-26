const db = require('../config/database');

// Gerar código único para retalho: RET-2025-00001
async function gerarCodigoRetalho() {
    const ano = new Date().getFullYear();
    const prefixo = 'RET';
    
    const [ultimoCodigo] = await db.query(
        `SELECT codigo_retalho FROM retalhos 
         WHERE codigo_retalho LIKE '${prefixo}-${ano}-%' 
         ORDER BY id DESC LIMIT 1`
    );
    
    let numero = 1;
    if (ultimoCodigo.length > 0) {
        const partes = ultimoCodigo[0].codigo_retalho.split('-');
        numero = parseInt(partes[2]) + 1;
    }
    
    return `${prefixo}-${ano}-${String(numero).padStart(5, '0')}`;
}

// Criar retalho manualmente
exports.criarRetalho = async (req, res) => {
    try {
        const { produto_id, metragem, localizacao_atual, observacoes } = req.body;
        
        if (!produto_id || !metragem) {
            return res.status(400).json({ 
                success: false, 
                error: 'Produto e metragem são obrigatórios' 
            });
        }
        
        // Gerar código único
        const codigo_retalho = await gerarCodigoRetalho();
        
        // Inserir retalho
        const [result] = await db.query(
            `INSERT INTO retalhos 
            (codigo_retalho, produto_id, metragem, localizacao_atual, observacoes) 
            VALUES (?, ?, ?, ?, ?)`,
            [codigo_retalho, produto_id, metragem, localizacao_atual || null, observacoes || null]
        );
        
        // Buscar retalho criado com dados do produto
        const [retalho] = await db.query(
            `SELECT 
                r.*,
                p.codigo,
                p.loja,
                p.fabricante,
                c.nome_cor,
                g.gramatura
            FROM retalhos r
            JOIN produtos p ON r.produto_id = p.id
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE r.id = ?`,
            [result.insertId]
        );
        
        res.json({ 
            success: true, 
            message: 'Retalho criado com sucesso!',
            data: retalho[0]
        });
        
    } catch (error) {
        console.error('Erro ao criar retalho:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Converter bobina em retalho
exports.converterBobinaEmRetalho = async (req, res) => {
    try {
        const { bobina_id } = req.params;
        
        // Buscar dados da bobina
        const [bobinas] = await db.query(
            `SELECT 
                b.*,
                p.id as produto_id,
                p.codigo,
                p.loja,
                p.fabricante,
                c.nome_cor,
                g.gramatura
            FROM bobinas b
            JOIN produtos p ON b.produto_id = p.id
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE b.id = ? AND b.convertida_em_retalho = FALSE`,
            [bobina_id]
        );
        
        if (bobinas.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Bobina não encontrada ou já foi convertida' 
            });
        }
        
        const bobina = bobinas[0];
        
        // Gerar código do retalho
        const codigo_retalho = await gerarCodigoRetalho();
        
        // Criar retalho com a metragem atual da bobina
        const [result] = await db.query(
            `INSERT INTO retalhos 
            (codigo_retalho, produto_id, metragem, bobina_origem_id, observacoes) 
            VALUES (?, ?, ?, ?, ?)`,
            [
                codigo_retalho, 
                bobina.produto_id, 
                bobina.metragem_atual,
                bobina_id,
                `Convertido da bobina ${bobina.codigo_interno}`
            ]
        );
        
        const retalho_id = result.insertId;
        
        // Marcar bobina como convertida
        await db.query(
            `UPDATE bobinas 
            SET convertida_em_retalho = TRUE, retalho_id = ? 
            WHERE id = ?`,
            [retalho_id, bobina_id]
        );
        
        // Buscar retalho criado
        const [retalho] = await db.query(
            `SELECT 
                r.*,
                p.codigo,
                p.loja,
                p.fabricante,
                c.nome_cor,
                g.gramatura
            FROM retalhos r
            JOIN produtos p ON r.produto_id = p.id
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE r.id = ?`,
            [retalho_id]
        );
        
        res.json({ 
            success: true, 
            message: 'Bobina convertida em retalho com sucesso!',
            data: {
                bobina: bobina.codigo_interno,
                retalho: retalho[0]
            }
        });
        
    } catch (error) {
        console.error('Erro ao converter bobina:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Listar retalhos de um produto
exports.listarRetalhosPorProduto = async (req, res) => {
    try {
        const { produto_id } = req.params;
        
        const [retalhos] = await db.query(
            `SELECT 
                r.*,
                p.codigo,
                p.fabricante,
                c.nome_cor,
                g.gramatura
            FROM retalhos r
            JOIN produtos p ON r.produto_id = p.id
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE r.produto_id = ?
            ORDER BY r.data_entrada DESC`,
            [produto_id]
        );
        
        res.json({ success: true, data: retalhos });
        
    } catch (error) {
        console.error('Erro ao listar retalhos:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Buscar retalho por código
exports.buscarRetalhoPorCodigo = async (req, res) => {
    try {
        const { codigo_retalho } = req.params;
        
        const [retalho] = await db.query(
            `SELECT 
                r.*,
                p.codigo,
                p.loja,
                p.fabricante,
                p.tipo_tecido,
                p.largura_sem_costura,
                p.tipo_bainha,
                p.largura_final,
                p.largura_maior,
                p.largura_y,
                c.nome_cor,
                g.gramatura
            FROM retalhos r
            JOIN produtos p ON r.produto_id = p.id
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE r.codigo_retalho = ?`,
            [codigo_retalho]
        );
        
        if (retalho.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Retalho não encontrado' 
            });
        }
        
        res.json({ success: true, data: retalho[0] });
        
    } catch (error) {
        console.error('Erro ao buscar retalho:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

// Excluir retalho
exports.excluirRetalho = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se retalho existe
        const [retalhos] = await db.query(
            'SELECT bobina_origem_id FROM retalhos WHERE id = ?',
            [id]
        );
        
        if (retalhos.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Retalho não encontrado' 
            });
        }
        
        const bobina_origem_id = retalhos[0].bobina_origem_id;
        
        // Se veio de uma bobina, reverter o status da bobina
        if (bobina_origem_id) {
            await db.query(
                `UPDATE bobinas 
                SET convertida_em_retalho = FALSE, retalho_id = NULL 
                WHERE id = ?`,
                [bobina_origem_id]
            );
        }
        
        // Excluir retalho
        await db.query('DELETE FROM retalhos WHERE id = ?', [id]);
        
        res.json({ 
            success: true, 
            message: 'Retalho excluído com sucesso!' 
        });
        
    } catch (error) {
        console.error('Erro ao excluir retalho:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};

module.exports = {
    criarRetalho,
    converterBobinaEmRetalho,
    listarRetalhosPorProduto,
    buscarRetalhoPorCodigo,
    excluirRetalho
};
