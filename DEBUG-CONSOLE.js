// SCRIPT DE DEBUG PARA AUTO-ALOCAR
// Copie e cole este código no CONSOLE DO NAVEGADOR (F12)
// quando estiver na página de Ordens de Corte

async function debugAutoAlocar() {
    console.log('🔍 DEBUG AUTO-ALOCAR - Iniciando análise...\n');
    
    // 1. Buscar planos em planejamento
    const responsePlanos = await fetch(`${API_BASE}/ordens-corte`);
    const dataPlanos = await responsePlanos.json();
    
    const planosEmPlanejamento = dataPlanos.data.filter(p => p.status === 'planejamento');
    
    console.log(`📋 Planos em planejamento: ${planosEmPlanejamento.length}`);
    
    if (planosEmPlanejamento.length === 0) {
        console.log('⚠️  Nenhum plano em planejamento encontrado');
        return;
    }
    
    const plano = planosEmPlanejamento[0];
    console.log(`\n🎯 Analisando plano: ${plano.codigo_plano} (ID: ${plano.id})`);
    
    // 2. Buscar detalhes do plano
    const responseDetalhes = await fetch(`${API_BASE}/ordens-corte/${plano.id}`);
    const dataDetalhes = await responseDetalhes.json();
    
    const itens = dataDetalhes.data.itens;
    console.log(`\n📦 Itens do plano: ${itens.length}`);
    
    itens.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.produto_nome} - ${item.metragem}m`);
        if (item.alocacao) {
            console.log(`      ✅ JÁ ALOCADO: ${item.alocacao.tipo_origem} ${item.alocacao.origem_codigo}`);
        } else {
            console.log(`      ❌ NÃO ALOCADO`);
        }
    });
    
    // 3. Buscar sugestões
    console.log(`\n\n🔍 BUSCANDO SUGESTÕES DE ALOCAÇÃO...`);
    console.log('━'.repeat(80));
    
    const responseSugestoes = await fetch(`${API_BASE}/ordens-corte/${plano.id}/sugestoes`);
    const dataSugestoes = await responseSugestoes.json();
    
    if (!dataSugestoes.success) {
        console.error('❌ Erro ao buscar sugestões:', dataSugestoes.error);
        return;
    }
    
    const sugestoes = dataSugestoes.data;
    console.log(`\n📊 Sugestões retornadas: ${sugestoes.length}`);
    
    sugestoes.forEach((sug, idx) => {
        console.log(`\n${idx + 1}. Item #${sug.item_id} - ${sug.metragem_corte}m`);
        
        if (sug.origem) {
            // TEM ESTOQUE
            const tipo = sug.origem.tipo === 'bobina' ? '🎯' : '📦';
            console.log(`   ${tipo} ORIGEM ENCONTRADA: ${sug.origem.tipo.toUpperCase()} ${sug.origem.codigo}`);
            console.log(`      Metragem disponível: ${sug.origem.metragem_disponivel}m`);
            console.log(`      Metragem total: ${sug.origem.metragem_total}m`);
            console.log(`      Localização: ${sug.origem.localizacao || 'N/A'}`);
            console.log(`      Motivo: ${sug.origem.motivo}`);
            console.log(`      Prioridade: ${sug.origem.prioridade}`);
        } else {
            // SEM ESTOQUE
            console.log(`   ❌ SEM ESTOQUE DISPONÍVEL`);
            if (sug.sugestao) {
                console.log(`      Erro: ${sug.sugestao.erro || 'Desconhecido'}`);
                console.log(`      Metragem solicitada: ${sug.sugestao.metragem_solicitada}m`);
                console.log(`      Máximo disponível: ${sug.sugestao.metragem_maxima_disponivel || 0}m`);
            }
        }
    });
    
    const comEstoque = sugestoes.filter(s => s.origem);
    const semEstoque = sugestoes.filter(s => !s.origem);
    
    console.log(`\n\n📈 RESUMO:`);
    console.log(`   ✅ Com estoque: ${comEstoque.length}`);
    console.log(`   ❌ Sem estoque: ${semEstoque.length}`);
    
    if (semEstoque.length > 0) {
        console.log(`\n⚠️  PROBLEMA IDENTIFICADO: ${semEstoque.length} item(ns) sem estoque`);
        console.log(`\n💡 VERIFIQUE NO CONSOLE DO SERVIDOR:`);
        console.log(`   - Os logs de [DEBUG] mostrarão detalhes do estoque`);
        console.log(`   - Veja se há metragens reservadas órfãs`);
        console.log(`   - Execute Configurações > Manutenção > Limpeza de Reservas`);
    }
    
    console.log(`\n✅ Debug concluído!`);
}

// Executar
debugAutoAlocar();
