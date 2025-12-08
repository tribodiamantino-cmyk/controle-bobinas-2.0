-- ==========================================
-- SCRIPT DE LIMPEZA TOTAL DO BANCO DE DADOS
-- ==========================================
-- 
-- ⚠️ ATENÇÃO: Este script apaga TODOS os dados!
-- Use apenas para resetar o sistema.
--

SET FOREIGN_KEY_CHECKS = 0;

-- Limpeza de carregamentos
DELETE FROM carregamentos_itens;
DELETE FROM carregamentos;

-- Limpeza de locações
DELETE FROM plano_locacoes;
DELETE FROM locacoes;

-- Limpeza de cortes
DELETE FROM cortes_realizados;

-- Limpeza de planos de corte
DELETE FROM alocacoes_corte;
DELETE FROM itens_plano_corte;
DELETE FROM planos_corte;

-- Limpeza de retalhos e bobinas
DELETE FROM retalhos;
DELETE FROM bobinas;

-- Limpeza de produtos
DELETE FROM produtos;

-- Limpeza de obras padrão
DELETE FROM obras_padrao;

-- Resetar AUTO_INCREMENT
ALTER TABLE carregamentos_itens AUTO_INCREMENT = 1;
ALTER TABLE carregamentos AUTO_INCREMENT = 1;
ALTER TABLE plano_locacoes AUTO_INCREMENT = 1;
ALTER TABLE locacoes AUTO_INCREMENT = 1;
ALTER TABLE cortes_realizados AUTO_INCREMENT = 1;
ALTER TABLE alocacoes_corte AUTO_INCREMENT = 1;
ALTER TABLE itens_plano_corte AUTO_INCREMENT = 1;
ALTER TABLE planos_corte AUTO_INCREMENT = 1;
ALTER TABLE retalhos AUTO_INCREMENT = 1;
ALTER TABLE bobinas AUTO_INCREMENT = 1;
ALTER TABLE produtos AUTO_INCREMENT = 1;
ALTER TABLE obras_padrao AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- Verificar resultados
SELECT 'Limpeza concluída!' as Status;
SELECT 'Cores mantidas:' as Info, COUNT(*) as Total FROM configuracoes_cores;
SELECT 'Gramaturas mantidas:' as Info, COUNT(*) as Total FROM configuracoes_gramaturas;
