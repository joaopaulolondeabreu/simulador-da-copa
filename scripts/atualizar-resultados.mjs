// Robô gratuito de atualização de placares: para cada jogo da fase de
// grupos que ainda não tem resultado real, busca o placar no Google
// (o "score box" que aparece ao pesquisar "time A vs time B") e, se
// encontrar um placar definitivo, atualiza js/dados/jogosGrupos.js.
//
// Roda via GitHub Actions (.github/workflows/atualizar-resultados.yml),
// usando o GITHUB_TOKEN padrão do próprio Actions para fazer commit —
// não exige nenhuma chave/API paga nem ação manual do usuário.
//
// Atenção: isto lê a página pública de busca do Google como um navegador
// leria, não uma API oficial. O formato pode mudar e quebrar o parsing;
// quando isso acontecer, o script simplesmente não encontra o placar e
// tenta de novo no próximo ciclo, sem quebrar o site.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CAMINHO_JOGOS = path.join(__dirname, '..', 'js', 'dados', 'jogosGrupos.js');
const CAMINHO_SELECOES = path.join(__dirname, '..', 'js', 'dados', 'selecoes.js');
const ANO_COPA = 2026;

function carregarSelecoes() {
  const texto = readFileSync(CAMINHO_SELECOES, 'utf8');
  const nomesPorId = {};
  const regex = /['"]?([\w-]+)['"]?:\s*\{\s*nome:\s*'([^']+)'/g;
  let m;
  while ((m = regex.exec(texto))) {
    nomesPorId[m[1]] = m[2];
  }
  return nomesPorId;
}

function parseDataBR(dataBR) {
  const [dia, mes] = dataBR.split('/').map(Number);
  return new Date(ANO_COPA, mes - 1, dia);
}

function jogoJaDeveTerAcontecido(jogo) {
  const dataJogo = parseDataBR(jogo.data);
  const hoje = new Date();
  // só considera "deve ter acontecido" um dia depois da data, para dar
  // tempo de o jogo terminar e o placar aparecer no Google.
  dataJogo.setDate(dataJogo.getDate() + 1);
  return hoje >= dataJogo;
}

async function buscarPlacarNoGoogle(nomeCasa, nomeFora) {
  const consulta = `${nomeCasa} vs ${nomeFora} copa do mundo 2026`;
  const url = `https://www.google.com/search?q=${encodeURIComponent(consulta)}&hl=pt-BR`;

  const resposta = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
  });

  if (!resposta.ok) return null;
  const html = await resposta.text();

  // O score box do Google costuma trazer algo como
  // "FT</span> ... 2</span> ... 1</span>" perto dos nomes dos times.
  // Procuramos um par de números pequenos (placar de futebol) que
  // apareça junto com marcadores de "tempo final" (FT, Final, Encerrado).
  const indicaFinalizado = /(\bFT\b|Final|Encerrado|Finalizado)/i.test(html);
  if (!indicaFinalizado) return null;

  const trechoScoreBox = html.match(/<div[^>]*class="[^"]*imso_mh__lr-tm-sc[^>]*>[\s\S]{0,4000}/);
  const trecho = trechoScoreBox ? trechoScoreBox[0] : html;

  const numeros = [...trecho.matchAll(/imso_mh__scr-w">\s*(\d+)\s*</g)].map((x) => Number(x[1]));
  if (numeros.length >= 2) {
    return { golsCasa: numeros[0], golsFora: numeros[1] };
  }
  return null;
}

async function main() {
  const nomesPorId = carregarSelecoes();
  let conteudo = readFileSync(CAMINHO_JOGOS, 'utf8');
  let alterado = false;

  const regexJogo = /\{ id: '(\w+)', grupo: '\w', rodada: \d, data: '[\d/]+', cidade: '[^']*', casa: '([\w-]+)', fora: '([\w-]+)', golsCasa: (null|\d+), golsFora: (null|\d+) \}/g;

  const jogos = [...conteudo.matchAll(regexJogo)];

  for (const m of jogos) {
    const [linhaCompleta, id, casa, fora, golsCasaAtual] = m;
    if (golsCasaAtual !== 'null') continue;

    const dataMatch = linhaCompleta.match(/data: '([\d/]+)'/);
    const jogo = { data: dataMatch[1] };
    if (!jogoJaDeveTerAcontecido(jogo)) continue;

    const nomeCasa = nomesPorId[casa];
    const nomeFora = nomesPorId[fora];
    if (!nomeCasa || !nomeFora) continue;

    let placar;
    try {
      placar = await buscarPlacarNoGoogle(nomeCasa, nomeFora);
    } catch (erro) {
      console.log(`Falha ao buscar ${id} (${nomeCasa} x ${nomeFora}):`, erro.message);
      continue;
    }

    if (!placar) {
      console.log(`Sem placar definitivo ainda para ${id} (${nomeCasa} x ${nomeFora}).`);
      continue;
    }

    const novaLinha = linhaCompleta.replace(
      /golsCasa: null, golsFora: null/,
      `golsCasa: ${placar.golsCasa}, golsFora: ${placar.golsFora}`,
    );
    conteudo = conteudo.replace(linhaCompleta, novaLinha);
    alterado = true;
    console.log(`Atualizado ${id}: ${nomeCasa} ${placar.golsCasa} x ${placar.golsFora} ${nomeFora}`);

    // pequena pausa entre buscas para reduzir risco de bloqueio.
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (alterado) {
    writeFileSync(CAMINHO_JOGOS, conteudo);
    console.log('Arquivo jogosGrupos.js atualizado.');
  } else {
    console.log('Nenhum placar novo encontrado nesta execução.');
  }
}

main();
