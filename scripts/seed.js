const db = require('../config/database');

// Dados de exemplo
const cores = ['Branca', 'Azul', 'Verde', 'Preta', 'Amarela'];
const gramaturas = ['150 g/m²', '200 g/m²', '250 g/m²', '300 g/m²'];
const fabricantes = ['Propex', 'Textiloeste'];
const lojas = ['Cortinave', 'BN'];
const tiposTecido = ['Normal', 'Bando Y'];
const tiposBainha = ['Sem Bainha', 'Cano/Cano', 'Cano/Arame', 'Arame/Arame'];

// Função auxiliar para gerar número aleatório
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Função auxiliar para escolher item aleatório
function randomChoice(array) {
    return array[randomInt(0, array.length - 1)];
}

// Função auxiliar para gerar código único
function gerarCodigo(loja, index) {
    const prefixo = loja === 'Cortinave' ? 'CTV' : 'BN';
    return `${prefixo}-${String(index).padStart(3, '0')}`;
}

// Função principal de seed
async function seedDatabase() {
    try {
        console.log('🌱 Iniciando seed do banco de dados...\n');
        
        // 1. Buscar IDs de cores e gramaturas existentes
        console.log('📊 Buscando cores e gramaturas...');
        const [coresDb] = await db.query('SELECT id, nome_cor FROM configuracoes_cores WHERE ativo = 1');
        const [gramaturasDb] = await db.query('SELECT id, gramatura FROM configuracoes_gramaturas WHERE ativo = 1');
        
        if (coresDb.length === 0 || gramaturasDb.length === 0) {
            console.log('❌ Erro: Não há cores ou gramaturas cadastradas!');
            console.log('   Execute primeiro o setup das configurações.');
            return;
        }
        
        console.log(`✅ Encontradas ${coresDb.length} cores e ${gramaturasDb.length} gramaturas\n`);
        
        // 2. Criar 10 produtos (5 para cada loja)
        console.log('📦 Criando produtos...');
        const produtosCriados = [];
        
        for (let i = 0; i < 10; i++) {
            const loja = i < 5 ? 'Cortinave' : 'BN';
            const codigo = gerarCodigo(loja, i + 1);
            const fabricante = randomChoice(fabricantes);
            const tipoTecido = randomChoice(tiposTecido);
            const cor = randomChoice(coresDb);
            const gramatura = randomChoice(gramaturasDb);
            
            let produto = {
                loja,
                codigo,
                fabricante,
                cor_id: cor.id,
                gramatura_id: gramatura.id,
                tipo_tecido: tipoTecido
            };
            
            // Adicionar medidas conforme o tipo
            if (tipoTecido === 'Bando Y') {
                produto.largura_maior = randomInt(300, 400);
                produto.largura_y = randomInt(150, 250);
            } else {
                produto.largura_sem_costura = randomInt(250, 350);
                produto.tipo_bainha = randomChoice(tiposBainha);
                produto.largura_final = produto.largura_sem_costura - randomInt(1, 5);
            }
            
            // Inserir produto
            const [result] = await db.query(
                `INSERT INTO produtos 
                (loja, codigo, cor_id, gramatura_id, fabricante, tipo_tecido, 
                 largura_sem_costura, tipo_bainha, largura_final, largura_maior, largura_y, ativo) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [
                    produto.loja,
                    produto.codigo,
                    produto.cor_id,
                    produto.gramatura_id,
                    produto.fabricante,
                    produto.tipo_tecido,
                    produto.largura_sem_costura || null,
                    produto.tipo_bainha || null,
                    produto.largura_final || null,
                    produto.largura_maior || null,
                    produto.largura_y || null
                ]
            );
            
            produtosCriados.push({
                id: result.insertId,
                loja: produto.loja,
                codigo: produto.codigo,
                cor: cor.nome_cor,
                gramatura: gramatura.gramatura,
                tipo: produto.tipo_tecido
            });
            
            console.log(`  ✅ Produto ${i + 1}/10: ${produto.loja} - ${produto.codigo} (${cor.nome_cor} • ${gramatura.gramatura} • ${produto.tipo_tecido})`);
        }
        
        console.log(`\n✅ ${produtosCriados.length} produtos criados!\n`);
        
        // 3. Criar 5 bobinas para cada produto (50 bobinas no total)
        console.log('🎯 Criando bobinas...');
        let totalBobinas = 0;
        
        for (const produto of produtosCriados) {
            for (let j = 0; j < 5; j++) {
                // Gerar código interno único
                const ano = new Date().getFullYear();
                const prefixo = produto.loja === 'Cortinave' ? 'CTV' : 'BN';
                const sequencial = totalBobinas + 1;
                const codigoInterno = `${prefixo}-${ano}-${String(sequencial).padStart(5, '0')}`;
                
                const notaFiscal = `NF-${randomInt(10000, 99999)}`;
                const metragem = randomInt(300, 600);
                const status = randomChoice(['Disponível', 'Disponível', 'Disponível', 'Em uso']); // 75% disponível
                
                await db.query(
                    `INSERT INTO bobinas 
                    (codigo_interno, nota_fiscal, loja, produto_id, metragem_inicial, metragem_atual, status, observacoes) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        codigoInterno,
                        notaFiscal,
                        produto.loja,
                        produto.id,
                        metragem,
                        metragem, // Inicial = atual (bobinas novas)
                        status,
                        `Bobina de teste gerada automaticamente`
                    ]
                );
                
                totalBobinas++;
                
                if (totalBobinas % 10 === 0) {
                    console.log(`  📊 ${totalBobinas} bobinas criadas...`);
                }
            }
        }
        
        console.log(`\n✅ ${totalBobinas} bobinas criadas!\n`);
        
        // 4. Resumo final
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ SEED CONCLUÍDO COM SUCESSO!');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`📦 Produtos criados: ${produtosCriados.length}`);
        console.log(`   • Cortinave: 5 produtos`);
        console.log(`   • BN: 5 produtos`);
        console.log(`🎯 Bobinas criadas: ${totalBobinas}`);
        console.log(`   • 5 bobinas por produto`);
        console.log(`   • Metragem média: 450m`);
        console.log('═══════════════════════════════════════════════════════\n');
        
        // Mostrar alguns exemplos
        console.log('📋 Exemplos de produtos criados:');
        produtosCriados.slice(0, 3).forEach(p => {
            console.log(`   • ${p.loja} - ${p.codigo}: ${p.cor} • ${p.gramatura} • ${p.tipo}`);
        });
        
        console.log('\n🚀 Acesse o sistema e veja os dados no estoque!');
        console.log('   URL: https://controle-bobinas-20-production.up.railway.app/estoque.html\n');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erro ao executar seed:', error);
        process.exit(1);
    }
}

// Executar seed
seedDatabase();
