# Roteiro de Desenvolvimento: App Albion Market Helper

Este roteiro detalha as etapas para a criação do app, focando em autenticação, filtros de itens e comparação de preços entre mercados.

## Fase 1: Configuração e Base de Dados
1.  **Inicialização do Projeto:** [CONCLUÍDO]
    *   Setup com Next.js (TypeScript) e Tailwind CSS.
    *   Configuração do Git para controle de versão.
2.  **Processamento de Metadados:** [CONCLUÍDO]
    *   Script para baixar e filtrar o `items.json`.
    *   Criação de um sistema de busca/autocomplete para localizar itens pelo nome em Português/Inglês.

## Fase 2: Autenticação (Requisito 1)
1.  **Setup do Banco de Dados:**
    *   Integração com Supabase ou Firebase para gerenciamento de usuários.
2.  **Fluxo de Acesso:**
    *   Criação das telas de Login e Cadastro.
    *   Proteção de rotas (apenas usuários logados acessam o dashboard).

## Fase 3: Interface de Filtros (Requisito 2)
1.  **Componente de Busca de Item:**
    *   Campo de pesquisa com sugestões dinâmicas.
2.  **Seletores de Atributos:**
    *   Dropdowns para:
        *   **Nível (Tier):** T1 a T8.
        *   **Encantamento:** .0 a .4.
        *   **Qualidade:** Normal a Obra-Prima.

## Fase 4: Integração e Lógica de Preços (Requisito 3)
1.  **Desenvolvimento do Proxy (API Routes):**
    *   Endpoint interno para consultar a API do Albion Data Project.
    *   Implementação de compressão Gzip e tratamento de erros.
2.  **Processamento de Dados de Mercado:**
    *   Consulta simultânea para Cidades Reais e Mercado Negro (Caerleon).
    *   **Lógica de Destaque:**
        *   Cálculo do **Menor Valor de Venda** (onde é mais barato comprar).
        *   Cálculo do **Maior Valor de Compra** (onde pagam mais pelo seu item).
3.  **Interface de Resultados:**
    *   Tabela comparativa ou Grid de cards destacando visualmente as melhores oportunidades de lucro.

## Fase 5: Refinamento e Deploy
1.  **Otimização:**
    *   Adição de cache para evitar excesso de requisições.
2.  **Hospedagem:**
    *   Deploy na Vercel.

---
**Status Atual:** Base de dados de itens (`src/data/items.json`) preparada.
**Próximo Passo sugerido:** Setup da Autenticação (Fase 2) ou pular para a Interface de Busca (Fase 3) para testar a funcionalidade principal primeiro?