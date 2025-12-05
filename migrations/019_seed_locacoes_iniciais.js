exports.up = async function(db) {
    console.log('📦 Inserindo locações iniciais...');
    
    const locacoes = [
        // Corredor A - Prateleira 1
        ['A1-B1-C1', 'Corredor A - Prateleira 1 - Posição B1-C1', 'A', '1', 'B1-C1'],
        ['A1-B1-C2', 'Corredor A - Prateleira 1 - Posição B1-C2', 'A', '1', 'B1-C2'],
        ['A1-B1-C3', 'Corredor A - Prateleira 1 - Posição B1-C3', 'A', '1', 'B1-C3'],
        ['A1-B2-C1', 'Corredor A - Prateleira 1 - Posição B2-C1', 'A', '1', 'B2-C1'],
        ['A1-B2-C2', 'Corredor A - Prateleira 1 - Posição B2-C2', 'A', '1', 'B2-C2'],
        ['A1-B2-C3', 'Corredor A - Prateleira 1 - Posição B2-C3', 'A', '1', 'B2-C3'],
        ['A1-B2-C4', 'Corredor A - Prateleira 1 - Posição B2-C4', 'A', '1', 'B2-C4'],
        
        // Corredor A - Prateleira 2
        ['A2-B1-C1', 'Corredor A - Prateleira 2 - Posição B1-C1', 'A', '2', 'B1-C1'],
        ['A2-B1-C2', 'Corredor A - Prateleira 2 - Posição B1-C2', 'A', '2', 'B1-C2'],
        ['A2-B2-C1', 'Corredor A - Prateleira 2 - Posição B2-C1', 'A', '2', 'B2-C1'],
        ['A2-B2-C2', 'Corredor A - Prateleira 2 - Posição B2-C2', 'A', '2', 'B2-C2'],
        
        // Corredor B - Prateleira 1
        ['B1-B1-C1', 'Corredor B - Prateleira 1 - Posição B1-C1', 'B', '1', 'B1-C1'],
        ['B1-B1-C2', 'Corredor B - Prateleira 1 - Posição B1-C2', 'B', '1', 'B1-C2'],
        ['B1-B2-C1', 'Corredor B - Prateleira 1 - Posição B2-C1', 'B', '1', 'B2-C1'],
        ['B1-B2-C2', 'Corredor B - Prateleira 1 - Posição B2-C2', 'B', '1', 'B2-C2'],
        
        // Corredor B - Prateleira 2
        ['B2-B1-C1', 'Corredor B - Prateleira 2 - Posição B1-C1', 'B', '2', 'B1-C1'],
        ['B2-B2-C1', 'Corredor B - Prateleira 2 - Posição B2-C1', 'B', '2', 'B2-C1'],
    ];
    
    for (const [codigo, descricao, corredor, prateleira, posicao] of locacoes) {
        await db.query(`
            INSERT INTO locacoes (codigo_locacao, descricao, corredor, prateleira, posicao)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE descricao = VALUES(descricao)
        `, [codigo, descricao, corredor, prateleira, posicao]);
    }
    
    console.log(`✓ ${locacoes.length} locações inseridas com sucesso`);
};

exports.down = async function(db) {
    await db.query('DELETE FROM locacoes WHERE corredor IN ("A", "B")');
    console.log('✓ Locações iniciais removidas');
};
