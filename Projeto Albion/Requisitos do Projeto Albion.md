# Requisitos do Projeto: App Web para Albion Online Data

Para desenvolver um app Web que utilize os dados do **Albion Online Data Project (AODP)**, é necessário estruturar o projeto para lidar com a API externa, processar metadados do jogo e apresentar as informações de forma filtrável.

## 1. Requisitos de Dados e API
*   **Endpoints do AODP:** Integração com os hosts específicos do servidor:
    *   **Américas (West):** `https://west.albion-online-data.com`
    *   **Ásia (East):** `https://east.albion-online-data.com`
    *   **Europa:** `https://europe.albion-online-data.com`
*   **Identificadores de Itens (Item IDs):** A API utiliza IDs internos (ex: `T4_MAIN_SWORD`). É necessário mapear os nomes dos itens usando o arquivo `items.json` do repositório [ao-bin-dumps](https://github.com/ao-data/ao-bin-dumps).
*   **Localização e Qualidade:** Lista de IDs de cidades e níveis de qualidade (1 a 5) para refinamento de buscas.

## 2. Arquitetura Técnica (Backend/Proxy)
O AODP **não suporta CORS** nativamente. Chamadas diretas do navegador falharão.
*   **Backend Proxy ou Serverless Function:** Necessário para intermediar as requisições, adicionando os headers de CORS necessários. Pode ser feito com Node.js/Express, Python/FastAPI ou Vercel Functions.
*   **Cache Local:** Recomendado para salvar preços por alguns minutos, evitando chamadas repetitivas e melhorando a performance.

## 3. Requisitos de Frontend
*   **Framework Moderno:** React, Vue.js ou Angular para gerenciar o estado dos filtros (Tier, Encantamento, Cidade).
*   **Visualização de Dados:**
    *   **Tabelas Dinâmicas:** Bibliotecas como `TanStack Table` ou `AG-Grid` para ordenação por lucro ou volume.
    *   **Gráficos:** `Chart.js` ou `Recharts` para visualizar a demanda histórica (endpoint `/history/`).
*   **Tradução/Localização:** Uso de um dicionário para exibir nomes em Português a partir dos IDs técnicos.

## 4. Lógica de Negócio e "Demanda"
*   **Cálculo de Demanda:** Baseado no `item_count` retornado pelo histórico.
*   **Filtros de URL:** A API tem limite de **4096 caracteres**. Implementar "batching" se precisar consultar muitos itens simultaneamente.

## 5. Boas Práticas (Obrigatório)
*   **Gzip Compression:** Exigido pelo projeto para economizar banda do servidor.
*   **Atualização de Dados:** Os dados dependem de usuários rodando o "Data Client". Preços podem estar defasados se não houver consultas recentes no mercado in-game.

---
**Stack Recomendada:**
- **Frontend/API:** Next.js (já possui API Routes para o Proxy).
- **Estilização:** Tailwind CSS.
- **Hospedagem:** Vercel ou Netlify.