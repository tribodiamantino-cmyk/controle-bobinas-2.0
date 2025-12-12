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
    version: '2.5.0',
    
    // Data do último deploy (atualizar manualmente)
    buildDate: '12/12/2025',
    
    // Resumo da versão atual
    summary: 'Mobile v2.0 - Reconstrução Completa',
    
    // Changelog resumido (últimas 5 mudanças)
    changelog: [
        'Novo Mobile: 3 módulos completos (CONSULTAS, PDC, CARREGAMENTO)',
        'Scanner ML Kit Code 128 (substitui QR)',
        'Camera HD para contraprova de cortes',
        '10 novos endpoints mobile',
        'Capacitor 7 + 2 plugins configurados'
    ],
    
    // Fase atual do roadmap
    currentPhase: 'Mobile v2.0 - Aguardando Testes',
    
    // Status geral
    status: 'stable'
};
