/**
 * 📌 VERSÃO DO SISTEMA - FONTE ÚNICA DE VERDADE
 * 
 * Atualizar AQUI antes de cada deploy!
 * 
 * REGRAS DE VERSIONAMENTO (SemVer):
 * - MAJOR (X.0.0): Mudanças que quebram compatibilidade ou redesign significativo
 * - MINOR (0.X.0): Novas funcionalidades (sem quebrar o existente)
 * - PATCH (0.0.X): Correções de bugs e pequenos ajustes
 * 
 * EXEMPLOS:
 * - Fix de bug no fabricante → PATCH (2.4.0 → 2.4.1)
 * - Nova Central de Etiquetas → MINOR (2.3.0 → 2.4.0)
 * - Redesign total da UI → MAJOR (2.x.x → 3.0.0)
 */

module.exports = {
    // Versão atual do sistema
    version: '2.4.0',
    
    // Data do último deploy (atualizar manualmente)
    buildDate: '11/12/2025',
    
    // Resumo da versão atual
    summary: 'Padronização do Banco de Dados',
    
    // Changelog resumido (últimas 5 mudanças)
    changelog: [
        'Padronização do campo locacao (VARCHAR)',
        'Documentação completa do schema',
        'Regras de fabricante/loja definidas',
        'Central de Etiquetas unificada',
        'Histórico de Movimentações'
    ],
    
    // Fase atual do roadmap
    currentPhase: 'Testes de Produção',
    
    // Status geral
    status: 'stable'
};
