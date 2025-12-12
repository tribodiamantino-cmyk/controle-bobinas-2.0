# 🗺️ ROADMAP - Sistema de Controle de Bobinas 2.0
## Cortinave & BN - Lonas para Aviários

**Última atualização:** 12/12/2025 | **Versão atual:** 2.5.0

---

## ✅ VERSÃO 2.5.0 - MOBILE V2.0 COMPLETO (12/12/2025)

### 🎉 MARCO IMPORTANTE: Reconstrução Total do Mobile

**Motivação:** Mudança na lógica de impressão (server-side) + adoção de Code 128

#### Frontend Completo (3.500+ linhas)
- ✅ Arquitetura base: Vanilla JS + Capacitor 7 + Bootstrap 5
- ✅ Módulo CONSULTAS (741 linhas)
- ✅ Módulo PDC - Produção (986 linhas)
- ✅ Módulo CARREGAMENTO (622 linhas)
- ✅ 30+ funções utilitárias compartilhadas
- ✅ Scanner ML Kit (Code 128)
- ✅ Camera HD (1280x720, contraprova de cortes)

#### Backend (617 linhas)
- ✅ 10 novos endpoints mobile
- ✅ Validação de códigos
- ✅ Agrupamento de origens por PDC
- ✅ Validação de cortes em carregamento
- ✅ Upload multipart de fotos

#### Capacitor Setup
- ✅ Plugins instalados: ML Kit + Camera
- ✅ Configurações Android
- ✅ Assets sincronizados
- ✅ Pronto para build APK

#### Documentação
- ✅ Especificação completa (1.126 linhas)
- ✅ Guia de testes (28 cenários)
- ✅ Setup Capacitor completo
- ✅ API documentation

**Status:** DESENVOLVIMENTO 100% COMPLETO | AGUARDANDO TESTES

---

## 📊 VISÃO GERAL DO SISTEMA

### Conceitos Principais:
- **PRODUTO**: Metro linear do tecido (conceito abstrato)
- **BOBINA**: Recipiente físico que contém o produto (objeto concreto com metragem)
- **ORDEM DE CORTE**: Documento que especifica cortes a serem feitos, deduzindo material das bobinas

---

## 🏗️ ESTRUTURA DO BANCO DE DADOS

### Tabelas Principais:

#### 1. **configuracoes_cores**
- id
- nome_cor
- codigo_hex (opcional, para visualização)
- ativo (sim/não)
- data_criacao

#### 2. **configuracoes_gramaturas**
- id
- gramatura (ex: 180g/m², 200g/m²)
- ativo (sim/não)
- data_criacao

#### 3. **produtos**
- id
- loja (Cortinave | BN)
- codigo_produto (código no sistema da loja)
- cor_id (FK → configuracoes_cores)
- gramatura_id (FK → configuracoes_gramaturas)
- fabricante (Propex | Textiloeste)
- largura_sem_costura (cm)
- tipo_bainha (Cano/Cano | Cano/Arame | Arame/Arame)
- largura_final (cm, com bainha)
- ativo (sim/não)
- data_criacao

#### 4. **bobinas**
- id
- produto_id (FK → produtos)
- id_interno (identificação única da bobina)
- metragem_inicial (metros)
- metragem_atual (metros - atualizada a cada corte)
- locacao (formato: 0000-XXXX-0000)
- status (Disponível | Em Uso | Vazia | Bloqueada)
- data_entrada
- data_criacao
- ultima_movimentacao

#### 5. **ordens_corte**
- id
- numero_ordem (gerado automaticamente)
- data_criacao
- criado_por (usuário - futuro)
- status (Pendente | Em Andamento | Concluída | Cancelada)
- observacoes
- data_conclusao

#### 6. **itens_ordem_corte**
- id
- ordem_corte_id (FK → ordens_corte)
- bobina_id (FK → bobinas)
- produto_id (FK → produtos - para referência)
- metragem_cortada (metros)
- data_corte
- observacoes

---

## 🎯 FASES DE DESENVOLVIMENTO

---

## **FASE 1 - FUNDAÇÃO** ✅ (1-2 semanas)
**Status: Infraestrutura pronta!**

- [x] Configuração do projeto Node.js + Express
- [x] Banco de dados MySQL no Railway
- [x] Deploy automático GitHub → Railway
- [x] Estrutura de pastas (MVC)
- [ ] Sistema de autenticação básico (futuro)

---

## **FASE 2 - CONFIGURAÇÕES** 🎨 (3-5 dias)

### 2.1 - Página de Configurações
- [ ] Criar interface de configurações
- [ ] CRUD de Cores
  - Adicionar nova cor
  - Listar cores
  - Editar cor
  - Desativar/Ativar cor
  - Validação (não permitir excluir se em uso)
  
- [ ] CRUD de Gramaturas
  - Adicionar gramatura
  - Listar gramaturas
  - Editar gramatura
  - Desativar/Ativar gramatura
  - Validação (não permitir excluir se em uso)

### 2.2 - Banco de Dados
- [ ] Criar tabelas: configuracoes_cores, configuracoes_gramaturas
- [ ] Popular com dados iniciais

---

## **FASE 3 - CADASTRO DE PRODUTOS** 📦 (1 semana)

### 3.1 - CRUD de Produtos
- [ ] Criar tabela produtos
- [ ] Interface de cadastro de produto
  - Formulário com todas as variáveis
  - Dropdowns dinâmicos (cores, gramaturas do banco)
  - Validações
  
- [ ] Listar produtos
  - Tabela/cards com filtros
  - Busca por código, loja, cor, etc
  
- [ ] Editar produto
- [ ] Desativar produto (não deletar)
- [ ] Ver detalhes do produto
  - Mostrar todas as bobinas desse produto
  - Total de metragem disponível

---

## **FASE 4 - GESTÃO DE BOBINAS** 🎯 (1-2 semanas)

### 4.1 - Entrada de Bobinas
- [ ] Criar tabela bobinas
- [ ] Interface de entrada de nova bobina
  - Selecionar produto existente
  - Informar: ID interno, metragem inicial, locação
  - Validar formato da locação (0000-XXXX-0000)
  - Gerar QR Code/Código de barras automático
  
- [ ] Listar bobinas
  - Filtros por produto, status, localização
  - Ordenação
  - Cards/Tabela com informações resumidas

### 4.2 - Gestão de Locação
- [ ] Sistema de validação de locação
- [ ] Busca por locação
- [ ] Mapa visual de locações (futuro)

---

## **FASE 5 - SISTEMA DE ESTOQUE** 📊 (1 semana)

### 5.1 - Visão de Estoque por Produto
- [ ] Interface principal de estoque
- [ ] Agrupamento por PRODUTO
  - Card/Linha mostrando: Produto + Total de metragem
  - Click para expandir → lista todas as bobinas
  
- [ ] Filtros em Cascata
  - Loja → Cor → Gramatura → Fabricante → Tipo Bainha → Largura
  - Filtros dinâmicos baseados nas seleções anteriores
  
- [ ] Indicadores visuais
  - Cores de status
  - Alertas de estoque baixo
  - Bobinas vazias ou quase vazias

### 5.2 - Dashboard
- [ ] Total geral de metragem em estoque
- [ ] Estoque por loja
- [ ] Produtos com estoque baixo
- [ ] Últimas movimentações
- [ ] Gráficos (Chart.js ou similar)

---

## **FASE 6 - ORDENS DE CORTE** ✂️ (2 semanas)

### 6.1 - Criação de Ordens
- [ ] Criar tabelas: ordens_corte, itens_ordem_corte
- [ ] Interface de criação de ordem
  - Adicionar múltiplos produtos
  - Adicionar múltiplas bobinas
  - Especificar metragem por item
  - Visualização em tempo real do que será cortado
  
- [ ] Validações
  - Verificar se há metragem suficiente
  - Alertar sobre bobinas em locações diferentes
  - Impedir corte de metragem maior que disponível

### 6.2 - Processamento de Ordens
- [ ] Confirmar ordem de corte
- [ ] Deduzir automaticamente da metragem_atual das bobinas
- [ ] Atualizar status das bobinas
- [ ] Registrar histórico de movimentação
- [ ] Marcar bobinas como "Vazia" quando metragem = 0

### 6.3 - Gestão de Ordens
- [ ] Listar ordens de corte
  - Filtros por data, status, produto
  - Busca por número da ordem
  
- [ ] Ver detalhes da ordem
  - Todos os itens
  - Bobinas utilizadas
  - Metragens cortadas
  - Histórico de status
  
- [ ] Editar ordem (se pendente)
- [ ] Cancelar ordem (reverter metragens)
- [ ] Concluir ordem

---

## **FASE 7 - IMPRESSÃO E RELATÓRIOS** 🖨️ (1 semana)

### 7.1 - Impressão de Ordens
- [ ] Template de impressão de ordem de corte
  - Cabeçalho com número da ordem, data
  - Lista de produtos e metragens
  - Bobinas a serem utilizadas com locações
  - QR Code/Código de barras da ordem
  - Espaço para assinaturas
  
- [ ] Gerar PDF para impressão
- [ ] Imprimir direto do navegador

### 7.2 - Etiquetas e Códigos
- [ ] Gerar QR Code para cada bobina
  - Informações: ID interno, produto, metragem
  
- [ ] Gerar código de barras
- [ ] Template de etiqueta para impressão
  - Formato adequado para etiquetas adesivas
  
- [ ] Sistema de leitura via celular
  - Página mobile otimizada
  - Scanner de QR Code/Código de barras
  - Mostrar informações da bobina
  - Permitir dar baixa direto pelo celular (futuro)

### 7.3 - Relatórios
- [ ] Relatório de movimentação de estoque
- [ ] Relatório de ordens por período
- [ ] Relatório de consumo por produto
- [ ] Relatório de perdas/sobras
- [ ] Exportar para Excel/PDF

---

## **FASE 8 - OTIMIZAÇÃO DE CORTE** 🤖 (2-3 semanas)

### 8.1 - Algoritmo de Sugestão
- [ ] Desenvolver algoritmo de otimização
  - Input: Lista de metragens necessárias
  - Output: Melhor combinação de bobinas
  - Objetivo: Minimizar perdas
  
- [ ] Considerar fatores:
  - Proximidade de localização
  - Minimizar sobras
  - Priorizar bobinas com menos metragem
  - Mesmo produto/especificação

### 8.2 - Interface de Sugestão
- [ ] Tela de planejamento de corte
- [ ] Inserir múltiplas metragens necessárias
- [ ] Sistema sugere melhores bobinas
- [ ] Mostrar perdas estimadas
- [ ] Permitir ajustes manuais
- [ ] Gerar ordem automaticamente após aprovação

---

## **FASE 9 - MOBILE E CAMPO** 📱 (2 semanas)

### 9.1 - Interface Mobile
- [ ] Design responsivo para todas as telas
- [ ] PWA (Progressive Web App)
  - Instalar no celular
  - Funcionar offline (básico)
  - Notificações

### 9.2 - Funcionalidades para Setor de Cortes
- [ ] Scanner de QR Code/Código de barras
- [ ] Visualizar ordem de corte no celular
- [ ] Marcar item como cortado
- [ ] Registrar observações
- [ ] Tirar fotos (registro de problemas)
- [ ] Finalizar ordem pelo celular

---

## **FASE 10 - MELHORIAS E FEATURES AVANÇADAS** 🚀 (Contínuo)

### 10.1 - Sistema de Usuários
- [ ] Cadastro de usuários
- [ ] Níveis de acesso (Admin, Projetos, Cortes)
- [ ] Log de ações por usuário
- [ ] Auditoria completa

### 10.2 - Notificações
- [ ] Alertas de estoque baixo
- [ ] Ordens pendentes
- [ ] Bobinas paradas há muito tempo

### 10.3 - Integrações
- [ ] Integração com sistema da Cortinave
- [ ] Integração com sistema da BN
- [ ] API para outros sistemas

### 10.4 - Analytics
- [ ] Dashboard avançado
- [ ] Previsão de estoque
- [ ] Análise de consumo
- [ ] Sugestões de compra

### 10.5 - Backup e Segurança
- [ ] Backup automático diário
- [ ] Exportação completa de dados
- [ ] Criptografia de dados sensíveis

---

## 📱 TECNOLOGIAS E FERRAMENTAS

### Já em uso:
- ✅ Node.js + Express (Backend)
- ✅ MySQL (Banco de dados)
- ✅ Railway (Hospedagem)
- ✅ GitHub (Controle de versão)

### A implementar:
- [ ] **Frontend**: HTML5 + CSS3 + JavaScript (puro ou framework leve)
- [ ] **QR Code**: qrcode.js ou similar
- [ ] **Código de Barras**: JsBarcode
- [ ] **Scanner Mobile**: html5-qrcode
- [ ] **PDF**: jsPDF ou PDFKit
- [ ] **Gráficos**: Chart.js
- [ ] **Excel**: ExcelJS ou xlsx
- [ ] **Autenticação**: JWT (JSON Web Tokens)

---

## ⏱️ CRONOGRAMA ESTIMADO

| Fase | Descrição | Tempo Estimado | Prioridade |
|------|-----------|----------------|------------|
| 1 | Fundação | ✅ CONCLUÍDO | 🔴 Crítica |
| 2 | Configurações | 3-5 dias | 🔴 Crítica |
| 3 | Cadastro Produtos | 1 semana | 🔴 Crítica |
| 4 | Gestão Bobinas | 1-2 semanas | 🔴 Crítica |
| 5 | Sistema Estoque | 1 semana | 🔴 Crítica |
| 6 | Ordens de Corte | 2 semanas | 🔴 Crítica |
| 7 | Impressão/Relatórios | 1 semana | 🟡 Alta |
| 8 | Otimização | 2-3 semanas | 🟢 Média |
| 9 | Mobile | 2 semanas | 🟡 Alta |
| 10 | Melhorias | Contínuo | 🔵 Baixa |

**Tempo total para MVP (Fases 2-6)**: 5-7 semanas
**Tempo total para sistema completo (Fases 2-9)**: 10-14 semanas

---

## 🎯 MVP (Mínimo Produto Viável)

Para ter um sistema funcional BÁSICO, precisamos das **Fases 2 a 6**:

1. ✅ Cadastrar cores e gramaturas
2. ✅ Cadastrar produtos
3. ✅ Dar entrada em bobinas
4. ✅ Visualizar estoque
5. ✅ Criar ordens de corte
6. ✅ Deduzir material

Com isso, já dá para usar no dia a dia!

---

## 📝 PRÓXIMAS AÇÕES IMEDIATAS

1. **Revisar este roadmap** - Você concorda? Falta algo? Mudaria alguma prioridade?
2. **Começar Fase 2** - Criar as tabelas de configuração
3. **Desenvolver interface básica** - Definir o visual do sistema

---

## 🤝 OBSERVAÇÕES

- Cada fase pode ser dividida em sprints menores
- Podemos ajustar prioridades conforme necessidade
- Vamos testar cada fase antes de avançar
- Feedback constante é essencial!

---

## 🔧 TECH DEBT (Dívidas Técnicas)

> **Instruções para AI Agents:** Sempre que o usuário sugerir algo e pedir para "deixar pra depois", adicione aqui com status `[ ]`. Quando resolver, marque como `[x]`.

### Banco de Dados
- [ ] **Renumerar migrations 028** - Existem duas: `028_add_origem_cortes.js` e `028_add_placa_fallback.js` (ambas já rodaram, apenas organização)
- [ ] **Atualizar schema.sql** - Arquivo `database/schema.sql` não reflete o estado atual do banco (migrations são a fonte de verdade)
- [ ] **Padronizar status 'Vazia' → 'Esgotado'** - Trigger usa 'Vazia', mas convenção é 'Esgotado' para items zerados

### Código
- [ ] **Adicionar TypeScript** (opcional futuro) - Melhor tipagem e menos bugs

### Documentação
- [x] **Criar PADRONIZACAO_BANCO.md** - Documentação completa do schema (v2.4.0)
- [x] **Corrigir copilot-instructions.md** - Arquivo estava corrompido
- [x] **Modal de Cadastro Rápido de Produto (Estoque)** - Permitir cadastrar produto novo durante entrada de bobina
- [ ] **Clonar Modal de Cadastro Rápido para Retalhos** - Mesma funcionalidade na aba Retalhos (aguardando validação do Estoque)

---

## 📋 BACKLOG DE IDEIAS

> **Instruções para AI Agents:** Quando o usuário mencionar funcionalidades futuras ou ideias que não são prioridade agora, registre aqui.

### Sistema de Fotos de Contraprova
- [ ] **Migração para dispositivo de produção** - Atualmente fotos armazenadas em `uploads/cortes/` no servidor. Avaliar migração para S3/Cloudinary ou outro serviço especializado de armazenamento
- [ ] **Afinamento da função de foto** - Otimizar resolução, compressão e qualidade das fotos de medidor (atualmente HD 1280x720, Sharp 85%)
- [ ] **Galeria de fotos por PDC** - Interface para visualizar todas as fotos de contraprova de um plano de corte
- [ ] **OCR em fotos de medidor** - Leitura automática da medição para comparar com metragem informada

### Sistema de Carregamento
- [ ] **Relatório A4 de Carregamento** - Gerar relatório completo em A4 do PDC carregado (lista de cortes, metragens, fotos, assinaturas) via servidor de impressão para impressoras A4 (diferente da térmica de etiquetas)
- [ ] **Múltiplas impressoras no servidor** - Suportar impressora térmica (etiquetas) + impressora A4 (relatórios) no mesmo servidor de impressão
- [ ] **Template de relatório personalizável** - Permitir customizar layout do relatório de carregamento por empresa (Cortinave/BN)

### Outras Funcionalidades
- [ ] **Página de Histórico** - Criar `/historico.html` para visualizar movimentações (API já existe em `/api/historico`)
- [ ] Sistema de autenticação com níveis de acesso
- [ ] Mapa visual de locações no armazém
- [ ] App PWA completo para chão de fábrica
- [ ] Relatórios de produtividade por operador
- [ ] Integração com ERP (se houver)

---

**Vamos nessa? 🚀**
