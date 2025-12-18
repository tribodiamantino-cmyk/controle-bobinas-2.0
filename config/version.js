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
    version: '2.6.0',
    
    // Data do último deploy (atualizar manualmente)
    buildDate: '18/12/2025',
    
    // Resumo da versão atual
    summary: 'Coluna Entregues & Fotos Persistentes',
    
    // Changelog resumido (últimas 5 mudanças)
    changelog: [
        'Nova coluna "Entregues" no kanban de Ordens',
        'Modal de cortes realizados com foto de contraprova',
        'Railway Volume para uploads persistentes',
        'PDC vai automaticamente para Entregue ao finalizar carregamento',
        'Correções de ENUM e queries de foto'
    ],
    
    // Fase atual do roadmap
    currentPhase: 'Produção - Sistema Completo',
    
    // Status geral
    status: 'stable'
};
