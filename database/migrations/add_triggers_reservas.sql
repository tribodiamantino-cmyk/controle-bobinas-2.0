-- ==========================================
-- TRIGGERS PARA GESTÃO AUTOMÁTICA DE RESERVAS
-- ==========================================
-- Este script cria triggers que automaticamente
-- gerenciam as metragens reservadas quando
-- alocações são deletadas ou atualizadas

-- Limpar triggers antigos se existirem
DROP TRIGGER IF EXISTS after_alocacao_delete;
DROP TRIGGER IF EXISTS after_alocacao_update;

-- ==========================================
-- TRIGGER 1: Liberar reserva ao deletar alocação
-- ==========================================
DELIMITER $$

CREATE TRIGGER after_alocacao_delete
AFTER DELETE ON alocacoes_corte
FOR EACH ROW
BEGIN
    DECLARE plano_status VARCHAR(50);
    
    -- Verificar se o plano estava em produção (só libera se estava reservado)
    SELECT pc.status INTO plano_status
    FROM planos_corte pc
    JOIN itens_plano_corte ipc ON ipc.plano_corte_id = pc.id
    WHERE ipc.id = OLD.item_plano_corte_id;
    
    -- Se o plano estava em produção, liberar a reserva
    IF plano_status = 'em_producao' THEN
        IF OLD.tipo_origem = 'bobina' AND OLD.bobina_id IS NOT NULL THEN
            UPDATE bobinas 
            SET metragem_reservada = GREATEST(0, metragem_reservada - OLD.metragem_alocada)
            WHERE id = OLD.bobina_id;
        ELSEIF OLD.tipo_origem = 'retalho' AND OLD.retalho_id IS NOT NULL THEN
            UPDATE retalhos 
            SET metragem_reservada = GREATEST(0, metragem_reservada - OLD.metragem_alocada)
            WHERE id = OLD.retalho_id;
        END IF;
    END IF;
END$$

DELIMITER ;

-- ==========================================
-- TRIGGER 2: Ajustar reserva ao atualizar alocação
-- ==========================================
DELIMITER $$

CREATE TRIGGER after_alocacao_update
AFTER UPDATE ON alocacoes_corte
FOR EACH ROW
BEGIN
    DECLARE plano_status VARCHAR(50);
    
    -- Verificar se o plano está em produção
    SELECT pc.status INTO plano_status
    FROM planos_corte pc
    JOIN itens_plano_corte ipc ON ipc.plano_corte_id = pc.id
    WHERE ipc.id = NEW.item_plano_corte_id;
    
    -- Se o plano está em produção E a origem mudou
    IF plano_status = 'em_producao' THEN
        -- Liberar reserva da origem antiga (se mudou)
        IF (OLD.tipo_origem != NEW.tipo_origem OR OLD.bobina_id != NEW.bobina_id OR OLD.retalho_id != NEW.retalho_id) THEN
            IF OLD.tipo_origem = 'bobina' AND OLD.bobina_id IS NOT NULL THEN
                UPDATE bobinas 
                SET metragem_reservada = GREATEST(0, metragem_reservada - OLD.metragem_alocada)
                WHERE id = OLD.bobina_id;
            ELSEIF OLD.tipo_origem = 'retalho' AND OLD.retalho_id IS NOT NULL THEN
                UPDATE retalhos 
                SET metragem_reservada = GREATEST(0, metragem_reservada - OLD.metragem_alocada)
                WHERE id = OLD.retalho_id;
            END IF;
            
            -- Reservar na nova origem
            IF NEW.tipo_origem = 'bobina' AND NEW.bobina_id IS NOT NULL THEN
                UPDATE bobinas 
                SET metragem_reservada = metragem_reservada + NEW.metragem_alocada
                WHERE id = NEW.bobina_id;
            ELSEIF NEW.tipo_origem = 'retalho' AND NEW.retalho_id IS NOT NULL THEN
                UPDATE retalhos 
                SET metragem_reservada = metragem_reservada + NEW.metragem_alocada
                WHERE id = NEW.retalho_id;
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;

-- ==========================================
-- VERIFICAR SE OS TRIGGERS FORAM CRIADOS
-- ==========================================
SELECT 
    TRIGGER_NAME, 
    EVENT_MANIPULATION, 
    EVENT_OBJECT_TABLE, 
    ACTION_TIMING
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE()
AND TRIGGER_NAME IN ('after_alocacao_delete', 'after_alocacao_update');
