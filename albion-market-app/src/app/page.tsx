"use client";

import { useState, useMemo } from "react";
import itemsData from "@/data/items.json";

interface Item {
  id: string;
  namePT: string;
  nameEN: string;
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [tier, setTier] = useState("T4");
  const [enchantment, setEnchantment] = useState(".0");
  const [quality, setQuality] = useState("1");

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

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-zinc-950">
      <main className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            Albion Market Helper 🛡️
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Encontre as melhores oportunidades de lucro no Albion Online.
          </p>
        </header>

        <section className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Busca de Item */}
            <div className="relative space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Buscar Item
              </label>
              <input
                type="text"
                placeholder="Ex: Espada larga, Sword..."
                className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              {filteredItems.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden">
                  {filteredItems.map((item) => (
                    <li
                      key={item.id}
                      className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer text-sm border-b last:border-0 border-zinc-100 dark:border-zinc-700"
                      onClick={() => {
                        setSelectedItem(item);
                        setSearchTerm(item.namePT);
                      }}
                    >
                      <span className="font-medium">{item.namePT}</span>
                      <span className="text-xs text-zinc-500 ml-2">({item.nameEN})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tier</label>
                <select
                  className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                >
                  {["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Encanto</label>
                <select
                  className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={enchantment}
                  onChange={(e) => setEnchantment(e.target.value)}
                >
                  {[".0", ".1", ".2", ".3", ".4"].map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Qualidade</label>
                <select
                  className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none"
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                >
                  {[
                    { val: "1", label: "Normal" },
                    { val: "2", label: "Bom" },
                    { val: "3", label: "Excepcional" },
                    { val: "4", label: "Excelente" },
                    { val: "5", label: "Obra-prima" },
                  ].map((q) => (
                    <option key={q.val} value={q.val}>{q.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {selectedItem && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-bold">Item Selecionado:</span> {selectedItem.namePT} ({selectedItem.id})
                <br />
                <span className="font-bold">Configuração:</span> {tier}{enchantment} | Qualidade {quality}
              </p>
            </div>
          )}

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-blue-500/20">
            Consultar Preços no Mercado
          </button>
        </section>

        {/* Placeholder para Resultados */}
        <section className="text-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          <p className="text-zinc-500">Configure os filtros e clique em consultar para ver os preços.</p>
        </section>
      </main>
    </div>
  );
}
