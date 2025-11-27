const db = require('../config/database');

// Gerar código interno único
async function gerarCodigoInterno(loja) {
    const prefixo = loja === 'Cortinave' ? 'CTV' : 'BN';
    const ano = new Date().getFullYear();
    
    // Buscar último código do ano
    const [rows] = await db.query(
        `SELECT codigo_interno FROM bobinas 
         WHERE codigo_interno LIKE ? 
         ORDER BY id DESC LIMIT 1`,
        [`${prefixo}-${ano}-%`]
    );
    
    let proximoNumero = 1;
    if (rows.length > 0) {
        const ultimoCodigo = rows[0].codigo_interno;
        const numeroAtual = parseInt(ultimoCodigo.split('-')[2]);
        proximoNumero = numeroAtual + 1;
    }
    
    return `${prefixo}-${ano}-${proximoNumero.toString().padStart(5, '0')}`;
}

// Criar nova bobina
exports.criarBobina = async (req, res) => {
    try {
        const { 
            nota_fiscal, 
            loja, 
            produto_id, 
            metragem_inicial, 
            observacoes 
        } = req.body;
        
        // Validações
        if (!nota_fiscal || !loja || !produto_id || !metragem_inicial) {
            return res.status(400).json({ 
                success: false, 
                error: 'Nota fiscal, loja, produto e metragem são obrigatórios' 
            });
        }
        
        if (metragem_inicial <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Metragem deve ser maior que zero' 
            });
        }
        
        // Gerar código interno único
        const codigo_interno = await gerarCodigoInterno(loja);
        
        // Inserir bobina
        const [result] = await db.query(
            `INSERT INTO bobinas 
            (codigo_interno, nota_fiscal, loja, produto_id, metragem_inicial, metragem_atual, observacoes, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Disponível')`,
            [codigo_interno, nota_fiscal, loja, produto_id, metragem_inicial, metragem_inicial, observacoes || null]
        );
        
        // Buscar bobina criada com dados do produto
        const [bobina] = await db.query(
            `SELECT 
                b.*,
                p.codigo,
                p.fabricante,
                p.tipo_tecido,
                p.largura_sem_costura,
                p.tipo_bainha,
                p.largura_final,
                p.largura_maior,
                p.largura_y,
                c.nome_cor,
                g.gramatura
            FROM bobinas b
            JOIN produtos p ON b.produto_id = p.id
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE b.id = ?`,
            [result.insertId]
        );
        
        res.json({ 
            success: true, 
            data: bobina[0],
            message: 'Bobina registrada com sucesso!' 
        });
        
    } catch (error) {
        console.error('Erro ao criar bobina:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao criar bobina: ' + error.message 
        });
    }
};

// Listar produtos com total de bobinas (para acordeão)
exports.listarProdutosComBobinas = async (req, res) => {
    try {
        const [produtos] = await db.query(
            `SELECT 
                p.id,
                p.loja,
                p.codigo,
                p.fabricante,
                p.tipo_tecido,
                p.largura_sem_costura,
                p.tipo_bainha,
                p.largura_final,
                p.largura_maior,
                p.largura_y,
                c.nome_cor,
                g.gramatura,
                COUNT(DISTINCT b.id) as total_bobinas,
                COUNT(DISTINCT r.id) as total_retalhos,
                COALESCE(SUM(b.metragem_atual), 0) as metragem_bobinas,
                COALESCE(SUM(r.metragem), 0) as metragem_retalhos,
                COALESCE(SUM(b.metragem_atual), 0) + COALESCE(SUM(r.metragem), 0) as metragem_total,
                COALESCE(SUM(b.metragem_reservada), 0) as reservada_bobinas,
                COALESCE(SUM(r.metragem_reservada), 0) as reservada_retalhos,
                COALESCE(SUM(b.metragem_reservada), 0) + COALESCE(SUM(r.metragem_reservada), 0) as metragem_reservada,
                (COALESCE(SUM(b.metragem_atual), 0) + COALESCE(SUM(r.metragem), 0)) - 
                (COALESCE(SUM(b.metragem_reservada), 0) + COALESCE(SUM(r.metragem_reservada), 0)) as metragem_disponivel
            FROM produtos p
            LEFT JOIN bobinas b ON p.id = b.produto_id AND b.status != 'Esgotada' AND b.convertida_em_retalho = FALSE
            LEFT JOIN retalhos r ON p.id = r.produto_id AND r.status != 'Esgotado'
            LEFT JOIN configuracoes_cores c ON p.cor_id = c.id
            LEFT JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE p.ativo = 1
            GROUP BY p.id
            HAVING (total_bobinas > 0 OR total_retalhos > 0)
            ORDER BY p.loja, p.codigo`
        );
        
        res.json({ success: true, data: produtos });
        
    } catch (error) {
        console.error('Erro ao listar produtos:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao listar produtos: ' + error.message 
        });
    }
};

// Listar bobinas de um produto específico
exports.listarBobinasPorProduto = async (req, res) => {
    try {
        const { produto_id } = req.params;
        
        const [bobinas] = await db.query(
            `SELECT 
                b.*,
                p.codigo,
                p.fabricante,
                c.nome_cor,
                g.gramatura,
                b.localizacao_atual
            FROM bobinas b
            JOIN produtos p ON b.produto_id = p.id
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE b.produto_id = ? AND b.convertida_em_retalho = FALSE
            ORDER BY b.data_entrada DESC`,
            [produto_id]
        );
        
        res.json({ success: true, data: bobinas });
        
    } catch (error) {
        console.error('Erro ao listar bobinas:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao listar bobinas: ' + error.message 
        });
    }
};

// Buscar bobina por código interno (para etiqueta)
exports.buscarBobinaPorCodigo = async (req, res) => {
    try {
        const { codigo_interno } = req.params;
        
        const [bobina] = await db.query(
            `SELECT 
                b.*,
                p.codigo,
                p.fabricante,
                p.tipo_tecido,
                p.largura_sem_costura,
                p.tipo_bainha,
                p.largura_final,
                p.largura_maior,
                p.largura_y,
                c.nome_cor,
                g.gramatura,
                b.localizacao_atual
            FROM bobinas b
            JOIN produtos p ON b.produto_id = p.id
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE b.codigo_interno = ?`,
            [codigo_interno]
        );
        
        if (bobina.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Bobina não encontrada' 
            });
        }
        
        res.json({ success: true, data: bobina[0] });
        
    } catch (error) {
        console.error('Erro ao buscar bobina:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar bobina: ' + error.message 
        });
    }
};

// Buscar produto por loja + fabricante + código
exports.buscarProduto = async (req, res) => {
    try {
        const { loja, fabricante, codigo } = req.query;
        
        if (!loja || !fabricante || !codigo) {
            return res.status(400).json({ 
                success: false, 
                error: 'Loja, fabricante e código são obrigatórios' 
            });
        }
        
        const [produto] = await db.query(
            `SELECT 
                p.*,
                c.nome_cor,
                g.gramatura
            FROM produtos p
            JOIN configuracoes_cores c ON p.cor_id = c.id
            JOIN configuracoes_gramaturas g ON p.gramatura_id = g.id
            WHERE p.loja = ? AND p.fabricante = ? AND p.codigo = ? AND p.ativo = 1`,
            [loja, fabricante, codigo]
        );
        
        if (produto.length === 0) {
            return res.json({ 
                success: true, 
                found: false,
                message: 'Produto não encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            found: true,
            data: produto[0] 
        });
        
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao buscar produto: ' + error.message 
        });
    }
};

// Excluir bobina
exports.excluirBobina = async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.query('DELETE FROM bobinas WHERE id = ?', [id]);
        
        res.json({ 
            success: true, 
            message: 'Bobina excluída com sucesso!' 
        });
        
    } catch (error) {
        console.error('Erro ao excluir bobina:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao excluir bobina: ' + error.message 
        });
    }
};
