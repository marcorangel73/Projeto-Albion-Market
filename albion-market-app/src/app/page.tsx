"use client";

import { useState, useMemo } from "react";
import itemsData from "@/data/items.json";

interface Item {
  id: string;
  namePT: string;
  nameEN: string;
}

interface PriceData {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [tier, setTier] = useState("T4");
  const [enchantment, setEnchantment] = useState(".0");
  const [quality, setQuality] = useState("1");
  const [region, setRegion] = useState("west");
  const [isFocused, setIsFocused] = useState(false);

  // Estados de consulta da API
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Configuração de Imposto (Premium vs Normal)
  const [hasPremium, setHasPremium] = useState(true);
  const taxRate = hasPremium ? 0.04 : 0.08; // 4% tax with Premium, 8% without

  // Filtra itens conforme o usuário digita (limita a 10 resultados para performance)
  const filteredItems = useMemo(() => {
    if (searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase();
    return (itemsData as Item[])
      .filter(
        (item) =>
          item.namePT.toLowerCase().includes(term) ||
          item.nameEN.toLowerCase().includes(term)
      )
      .slice(0, 10);
  }, [searchTerm]);

  // Derivação inteligente do ID do item selecionado com base nas escolhas de Tier e Encantamento
  const derivedItem = useMemo(() => {
    if (!selectedItem) return null;

    const tierMatch = selectedItem.id.match(/^(T[1-8])_/);
    
    let baseId = selectedItem.id;
    // Remove prefixo de Tier e sufixo de encanto
    baseId = baseId.replace(/^(T[1-8])_/, "");
    baseId = baseId.replace(/@([1-4])$/, "");

    // Reconstrói o ID alvo
    let targetId = tierMatch ? `${tier}_${baseId}` : baseId;
    
    const enchantNum = enchantment.replace(".", "");
    if (enchantNum !== "0") {
      targetId += `@${enchantNum}`;
    }

    // Valida se esta variação existe no banco
    const match = (itemsData as Item[]).find((i) => i.id === targetId);
    return {
      id: targetId,
      namePT: match?.namePT || selectedItem.namePT,
      nameEN: match?.nameEN || selectedItem.nameEN,
      isValid: !!match,
    };
  }, [selectedItem, tier, enchantment]);

  // Função para consultar os preços no Proxy
  const fetchPrices = async () => {
    if (!derivedItem || !derivedItem.isValid) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const queryParams = new URLSearchParams({
        itemId: derivedItem.id,
        region: region,
        qualities: quality,
      });

      const response = await fetch(`/api/prices?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Não foi possível carregar os preços.");
      }

      const data: PriceData[] = await response.json();
      setPrices(data);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro desconhecido.");
    } finally {
      setLoading(false);
    }
  };

  // Cálculos de Margem de Lucro e Destaques
  const marketAnalysis = useMemo(() => {
    if (prices.length === 0) return null;

    // Filtra preços válidos (maiores que 0)
    const validPrices = prices.filter(
      (p) => p.sell_price_min > 0 || p.buy_price_max > 0
    );

    if (validPrices.length === 0) return null;

    // Encontra menor preço de venda (onde é mais barato comprar)
    let bestBuy: PriceData | null = null;
    validPrices.forEach((p) => {
      if (p.sell_price_min > 0) {
        if (!bestBuy || p.sell_price_min < bestBuy.sell_price_min) {
          bestBuy = p;
        }
      }
    });

    // Encontra maior preço de compra (onde pagam mais)
    let bestSell: PriceData | null = null;
    validPrices.forEach((p) => {
      if (p.buy_price_max > 0) {
        if (!bestSell || p.buy_price_max > bestSell.buy_price_max) {
          bestSell = p;
        }
      }
    });

    // Calcula margem bruta e líquida
    let marginSilver = 0;
    let marginPercent = 0;
    let netMarginSilver = 0;
    let netMarginPercent = 0;

    if (bestBuy && bestSell) {
      const buyPrice = (bestBuy as PriceData).sell_price_min;
      const sellPrice = (bestSell as PriceData).buy_price_max;

      marginSilver = sellPrice - buyPrice;
      marginPercent = buyPrice > 0 ? (marginSilver / buyPrice) * 100 : 0;

      // Desconta a taxa de venda do mercado de destino
      const tax = sellPrice * taxRate;
      const netSellPrice = sellPrice - tax;
      netMarginSilver = netSellPrice - buyPrice;
      netMarginPercent = buyPrice > 0 ? (netMarginSilver / buyPrice) * 100 : 0;
    }

    return {
      bestBuy,
      bestSell,
      marginSilver,
      marginPercent,
      netMarginSilver,
      netMarginPercent,
    };
  }, [prices, taxRate]);

  // Formata data de atualização
  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr || dateStr.startsWith("0001")) return "Sem dados";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Agora mesmo";
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours} h`;
    return `Há ${diffDays} dias`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* Background Decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-zinc-950 to-zinc-950 -z-10 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
                Albion Market Helper
              </h1>
              <p className="text-xs text-zinc-400">Analise de preços & lucro rápido</p>
            </div>
          </div>
          
          {/* Seletor de Região */}
          <div className="flex bg-zinc-800/80 p-1 rounded-lg border border-zinc-700">
            {[
              { id: "west", label: "Americas (West)" },
              { id: "east", label: "Asia (East)" },
              { id: "europe", label: "Europe" },
            ].map((r) => (
              <button
                key={r.id}
                onClick={() => setRegion(r.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  region === r.id
                    ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-grow w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Painel Lateral - Filtros e Busca */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/70 border border-zinc-800 p-6 rounded-2xl backdrop-blur-sm shadow-xl space-y-6">
            <h2 className="text-lg font-semibold text-amber-300 border-b border-zinc-800 pb-3 flex items-center gap-2">
              <span>🔍</span> Configuração do Item
            </h2>

            {/* Busca de Item */}
            <div className="relative space-y-2">
              <label className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
                Nome do Item
              </label>
              <input
                type="text"
                placeholder="Ex: Espada larga, Sword, Carrot..."
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-950/80 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all placeholder-zinc-600 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              />
              
              {isFocused && filteredItems.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                  {filteredItems.map((item) => (
                    <li
                      key={item.id}
                      className="p-3 hover:bg-zinc-800 cursor-pointer text-xs border-b last:border-0 border-zinc-800/50 transition-colors flex flex-col"
                      onMouseDown={() => {
                        setSelectedItem(item);
                        setSearchTerm(item.namePT);
                      }}
                    >
                      <span className="font-semibold text-zinc-100">{item.namePT}</span>
                      <span className="text-zinc-500 text-[10px] mt-0.5">{item.nameEN}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Grid de Filtros */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase">
                  Tier
                </label>
                <select
                  className="w-full px-2 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs text-zinc-300 focus:border-amber-500 outline-none cursor-pointer"
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                >
                  {["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase">
                  Encanto
                </label>
                <select
                  className="w-full px-2 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs text-zinc-300 focus:border-amber-500 outline-none cursor-pointer"
                  value={enchantment}
                  onChange={(e) => setEnchantment(e.target.value)}
                >
                  {[
                    { val: ".0", label: ".0 (Normal)" },
                    { val: ".1", label: ".1" },
                    { val: ".2", label: ".2" },
                    { val: ".3", label: ".3" },
                    { val: ".4", label: ".4" },
                  ].map((e) => (
                    <option key={e.val} value={e.val}>{e.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase">
                  Qualidade
                </label>
                <select
                  className="w-full px-2 py-2.5 rounded-lg border border-zinc-800 bg-zinc-950 text-xs text-zinc-300 focus:border-amber-500 outline-none cursor-pointer"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                >
                  {[
                    { val: "1", label: "Normal" },
                    { val: "2", label: "Bom" },
                    { val: "3", label: "Excepicional" },
                    { val: "4", label: "Excelente" },
                    { val: "5", label: "Obra-prima" },
                  ].map((q) => (
                    <option key={q.val} value={q.val}>{q.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Detalhes do ID derivado */}
            {derivedItem && (
              <div className={`p-4 rounded-xl border text-xs ${
                derivedItem.isValid 
                  ? "bg-zinc-950/50 border-zinc-800 text-zinc-300"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {derivedItem.isValid ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-zinc-200">Variação Selecionada:</p>
                    <p className="text-amber-400 text-sm font-bold">{derivedItem.namePT}</p>
                    <p className="text-zinc-500 font-mono text-[10px]">{derivedItem.id}</p>
                  </div>
                ) : (
                  <p className="leading-relaxed">
                    ⚠️ A variação <strong>{derivedItem.id}</strong> não foi encontrada nos arquivos locais do jogo. Alguns itens não possuem versões em certos tiers/encantos.
                  </p>
                )}
              </div>
            )}

            {/* Simulação de Impostos */}
            <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/80 space-y-3">
              <span className="text-[11px] font-semibold text-zinc-400 tracking-wider uppercase block">
                Calculadora de Lucro Líquido
              </span>
              <label className="flex items-center gap-3 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={hasPremium}
                  onChange={(e) => setHasPremium(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-0 bg-zinc-950 h-4 w-4"
                />
                <div>
                  <p className="font-medium">Possuo Conta Premium</p>
                  <p className="text-[10px] text-zinc-500">Taxa de mercado reduzida para 4% (normal: 8%)</p>
                </div>
              </label>
            </div>

            <button
              onClick={fetchPrices}
              disabled={!derivedItem || !derivedItem.isValid || loading}
              className={`w-full py-3.5 rounded-xl font-bold transition-all shadow-lg text-sm flex items-center justify-center gap-2 ${
                derivedItem && derivedItem.isValid && !loading
                  ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 shadow-amber-500/10 active:scale-[0.98]"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none"
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-zinc-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Buscando Preços...
                </>
              ) : (
                <>
                  <span>📈</span> Consultar Preços
                </>
              )}
            </button>
          </div>
        </section>

        {/* Dashboard de Preços e Análises */}
        <section className="lg:col-span-8 space-y-6">
          {!hasSearched ? (
            <div className="h-full min-h-[400px] border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-zinc-900/20">
              <span className="text-4xl mb-4">📊</span>
              <h3 className="text-zinc-300 font-semibold text-lg">Pronto para pesquisar</h3>
              <p className="text-zinc-500 text-sm max-w-sm mt-1 leading-relaxed">
                Escolha um item na barra de busca e configure os filtros desejados para consultar dados de mercado atualizados.
              </p>
            </div>
          ) : loading ? (
            <div className="h-full min-h-[400px] border border-zinc-800 rounded-2xl flex flex-col items-center justify-center p-8 bg-zinc-900/40 backdrop-blur-sm">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-zinc-800" />
                <div className="absolute inset-0 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
              </div>
              <p className="text-zinc-400 text-sm mt-6">
                Obtendo informações do Albion Online Data Project...
              </p>
            </div>
          ) : error ? (
            <div className="h-full min-h-[400px] border border-red-500/20 bg-red-500/5 rounded-2xl flex flex-col items-center justify-center p-8 text-center">
              <span className="text-4xl mb-4">❌</span>
              <h3 className="text-red-400 font-semibold text-lg">Falha na Requisição</h3>
              <p className="text-zinc-400 text-sm max-w-sm mt-1 leading-relaxed">
                {error}
              </p>
              <button
                onClick={fetchPrices}
                className="mt-6 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-semibold transition-all text-zinc-300"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Painel de Métricas de Margem */}
              {marketAnalysis ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Card 1 - Melhor Compra */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl shadow-sm">
                    <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider block mb-1">
                      Melhor Preço para Comprar
                    </span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-bold text-emerald-400">
                        {marketAnalysis.bestBuy?.sell_price_min.toLocaleString()}
                        <span className="text-xs font-medium text-zinc-500 ml-1">Silver</span>
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold">
                        {marketAnalysis.bestBuy?.city}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {formatTimeAgo(marketAnalysis.bestBuy?.sell_price_min_date || "")}
                      </span>
                    </div>
                  </div>

                  {/* Card 2 - Melhor Venda */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl shadow-sm">
                    <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider block mb-1">
                      Melhor Preço para Vender
                    </span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-2xl font-bold text-amber-400">
                        {marketAnalysis.bestSell?.buy_price_max.toLocaleString()}
                        <span className="text-xs font-medium text-zinc-500 ml-1">Silver</span>
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 font-semibold">
                        {marketAnalysis.bestSell?.city}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {formatTimeAgo(marketAnalysis.bestSell?.buy_price_max_date || "")}
                      </span>
                    </div>
                  </div>

                  {/* Card 3 - Lucro */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl shadow-sm">
                    <span className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider block mb-1">
                      Lucro Líquido Estimado
                    </span>
                    <div className="flex justify-between items-baseline">
                      <span className={`text-2xl font-bold ${
                        marketAnalysis.netMarginSilver > 0 ? "text-amber-400" : "text-zinc-400"
                      }`}>
                        {marketAnalysis.netMarginSilver > 0 ? "+" : ""}
                        {Math.round(marketAnalysis.netMarginSilver).toLocaleString()}
                        <span className="text-xs font-medium text-zinc-500 ml-1">Silver</span>
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`text-[10px] font-semibold ${
                        marketAnalysis.netMarginPercent > 0 ? "text-emerald-400" : "text-zinc-500"
                      }`}>
                        {marketAnalysis.netMarginPercent > 0 ? "+" : ""}
                        {marketAnalysis.netMarginPercent.toFixed(1)}% de margem
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl text-center text-xs text-zinc-400">
                  Preços não registrados recentemente em nenhuma cidade principal.
                </div>
              )}

              {/* Tabela de Detalhes por Cidade */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/70 flex justify-between items-center">
                  <h3 className="font-semibold text-zinc-200">Comparação por Mercado</h3>
                  <span className="text-[11px] text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-850">
                    Servidor: <strong className="text-amber-400 uppercase">{region}</strong>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-950/50 text-zinc-400 font-semibold select-none">
                        <th className="px-6 py-3.5">Cidade</th>
                        <th className="px-6 py-3.5">Menor Venda (Player vende)</th>
                        <th className="px-6 py-3.5">Maior Compra (Player compra)</th>
                        <th className="px-6 py-3.5">Última Atualização</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {["Lymhurst", "Martlock", "Bridgewatch", "FortSterling", "Thetford", "Caerleon", "Brecilien"].map((cityName) => {
                        // Encontra dados correspondentes a essa cidade
                        const cityPrices = prices.filter(
                          (p) => p.city.replace(" ", "").toLowerCase() === cityName.toLowerCase()
                        );
                        
                        const price = cityPrices[0] || null;

                        const isBestBuy = price && marketAnalysis && price.sell_price_min > 0 && price.sell_price_min === marketAnalysis.bestBuy?.sell_price_min;
                        const isBestSell = price && marketAnalysis && price.buy_price_max > 0 && price.buy_price_max === marketAnalysis.bestSell?.buy_price_max;

                        return (
                          <tr
                            key={cityName}
                            className={`hover:bg-zinc-900/35 transition-colors ${
                              isBestBuy ? "bg-emerald-500/5" : isBestSell ? "bg-amber-500/5" : ""
                            }`}
                          >
                            <td className="px-6 py-4 font-semibold text-zinc-200 flex items-center gap-2">
                              {cityName === "Caerleon" ? "🖤 " : "🏙️ "}
                              {cityName === "FortSterling" ? "Fort Sterling" : cityName}
                            </td>
                            
                            <td className="px-6 py-4">
                              {price && price.sell_price_min > 0 ? (
                                <div className="space-y-0.5">
                                  <span className={`font-bold ${isBestBuy ? "text-emerald-400" : "text-zinc-100"}`}>
                                    {price.sell_price_min.toLocaleString()}
                                  </span>
                                  <span className="text-zinc-500 text-[10px] block">Silver</span>
                                </div>
                              ) : (
                                <span className="text-zinc-600">Sem dados</span>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              {price && price.buy_price_max > 0 ? (
                                <div className="space-y-0.5">
                                  <span className={`font-bold ${isBestSell ? "text-amber-400" : "text-zinc-100"}`}>
                                    {price.buy_price_max.toLocaleString()}
                                  </span>
                                  <span className="text-zinc-500 text-[10px] block">Silver</span>
                                </div>
                              ) : (
                                <span className="text-zinc-600">Sem dados</span>
                              )}
                            </td>

                            <td className="px-6 py-4 text-zinc-500">
                              {price ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 inline-block" />
                                    <span>Venda: {formatTimeAgo(price.sell_price_min_date)}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 inline-block" />
                                    <span>Compra: {formatTimeAgo(price.buy_price_max_date)}</span>
                                  </div>
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-zinc-950/30 border-t border-zinc-800 text-[11px] text-zinc-500 leading-relaxed">
                  💡 <strong>Dica de Mercado:</strong> O Albion Online Data Project é abastecido pela comunidade in-game. Se algum valor parecer desatualizado, você pode executar o "Data Client" do projeto oficial enquanto joga para atualizar os preços na hora.
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 mt-12 text-center text-xs text-zinc-600">
        <p>Projeto independente feito por hobby. Desenvolvido para fins de estudo técnico.</p>
      </footer>
    </div>
  );
}

