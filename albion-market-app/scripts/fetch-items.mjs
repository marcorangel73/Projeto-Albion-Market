import fs from 'fs';
import path from 'path';

const ITEMS_URL = 'https://raw.githubusercontent.com/ao-data/ao-bin-dumps/master/formatted/items.json';
const OUTPUT_PATH = path.join(process.cwd(), 'src/data/items.json');

async function fetchAndFilterItems() {
  console.log('Baixando items.json (isso pode demorar um pouco)...');
  
  try {
    const response = await fetch(ITEMS_URL);
    if (!response.ok) throw new Error(`Falha ao baixar: ${response.statusText}`);
    
    const data = await response.json();
    console.log(`Total de itens baixados: ${data.length}`);

    // Filtra itens que possuem nomes localizados e remove duplicatas/lixo
    const filtered = data
      .filter(item => item.LocalizedNames && (item.LocalizedNames['PT-BR'] || item.LocalizedNames['EN-US']))
      .map(item => ({
        id: item.UniqueName,
        namePT: item.LocalizedNames['PT-BR'] || item.LocalizedNames['EN-US'],
        nameEN: item.LocalizedNames['EN-US'] || item.LocalizedNames['PT-BR']
      }));

    console.log(`Itens após filtragem: ${filtered.length}`);

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(filtered, null, 2));
    console.log(`Dados salvos em: ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('Erro ao processar itens:', error);
    process.exit(1);
  }
}

fetchAndFilterItems();
