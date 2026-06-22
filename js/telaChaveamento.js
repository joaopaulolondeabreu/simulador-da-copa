import { getEstado } from './estado.js';
import { obterTodosJogosGruposComPalpites } from './jogos.js';
import { calcularClassificacaoGeral, montarChaveamentoCompleto } from './chaveamento.js';
import { criar, blocoTime, blocoPlaceholder } from './componentes.js';

// Cada metade do chaveamento, da fase de 32 até a semifinal, na ordem em
// que essas chaves alimentam a semifinal correspondente (M101 ou M102).
const LADO_ESQUERDO = {
  fase32: ['M73', 'M74', 'M75', 'M76', 'M79', 'M80', 'M83', 'M84'],
  oitavos: ['M89', 'M90', 'M93', 'M94'],
  quartas: ['M97', 'M98'],
  semi: ['M101'],
};

const LADO_DIREITO = {
  fase32: ['M77', 'M78', 'M81', 'M82', 'M85', 'M86', 'M87', 'M88'],
  oitavos: ['M91', 'M92', 'M95', 'M96'],
  quartas: ['M99', 'M100'],
  semi: ['M102'],
};

const FASES_ORDEM = ['fase32', 'oitavos', 'quartas', 'semi'];

export function renderizarChaveamento(container) {
  const estado = getEstado();
  const jogosPorGrupo = obterTodosJogosGruposComPalpites(estado);
  const classificacao = calcularClassificacaoGeral(jogosPorGrupo);
  const chaveamento = montarChaveamentoCompleto(classificacao, estado.palpitesMataMata);

  const todasPorId = new Map();
  [...chaveamento.fase32, ...chaveamento.oitavos, ...chaveamento.quartas, ...chaveamento.semis,
    chaveamento.terceiroLugar, chaveamento.final].forEach((r) => todasPorId.set(r.id, r));

  container.appendChild(criar('div', { class: 'cabecalho-secao' }, [
    criar('h2', { texto: 'Visualizar chaveamento' }),
    criar('p', { class: 'texto-apoio', texto: 'Esta é a árvore completa do mata-mata, da fase de 32 até a final, com os times conforme avançam na sua simulação.' }),
  ]));

  const arvore = criar('div', { class: 'chaveamento-arvore' });
  arvore.appendChild(criarLado(LADO_ESQUERDO, todasPorId, 'esquerda'));
  arvore.appendChild(criarCentro(chaveamento, todasPorId));
  arvore.appendChild(criarLado(LADO_DIREITO, todasPorId, 'direita'));

  const moldura = criar('div', { class: 'chaveamento-rolagem' }, [arvore]);
  container.appendChild(moldura);
}

function criarLado(lado, todasPorId, orientacao) {
  const ordemFases = orientacao === 'direita' ? [...FASES_ORDEM].reverse() : FASES_ORDEM;
  const coluna = criar('div', { class: `chaveamento-lado chaveamento-lado-${orientacao}` });
  ordemFases.forEach((fase) => {
    const idsJogos = lado[fase];
    const colunaFase = criar('div', { class: 'chaveamento-coluna-fase', 'data-fase': fase });
    idsJogos.forEach((id) => {
      colunaFase.appendChild(criarJogoArvore(todasPorId.get(id), fase));
    });
    coluna.appendChild(colunaFase);
  });
  return coluna;
}

function criarCentro(chaveamento, todasPorId) {
  const centro = criar('div', { class: 'chaveamento-centro' });
  centro.appendChild(criar('div', { class: 'chaveamento-rotulo-fase', texto: 'Disputa do 3º lugar' }));
  centro.appendChild(criarJogoArvore(chaveamento.terceiroLugar, 'terceiro'));
  centro.appendChild(criar('div', { class: 'chaveamento-rotulo-fase', texto: 'Final' }));
  centro.appendChild(criarJogoArvore(chaveamento.final, 'final'));

  const campeao = chaveamento.final.vencedor;
  centro.appendChild(criar('div', { class: 'chaveamento-campeao' }, [
    criar('span', { class: 'chaveamento-rotulo-fase', texto: 'Campeão' }),
    campeao ? blocoTime(campeao, 48) : blocoPlaceholder('A definir'),
  ]));
  return centro;
}

function criarJogoArvore(resultado, fase) {
  const jogo = criar('div', { class: `chaveamento-jogo chaveamento-jogo-${fase}` });
  jogo.appendChild(criarLinhaTime(resultado, resultado.timeA, resultado.vencedor));
  jogo.appendChild(criarLinhaTime(resultado, resultado.timeB, resultado.vencedor));
  return jogo;
}

function criarLinhaTime(resultado, idTime, vencedor) {
  const classes = ['chaveamento-time'];
  if (idTime && vencedor && idTime === vencedor) classes.push('chaveamento-time-vencedor');
  const conteudo = idTime ? blocoTime(idTime, 24) : blocoPlaceholder('A definir');
  return criar('div', { class: classes.join(' ') }, [conteudo]);
}
