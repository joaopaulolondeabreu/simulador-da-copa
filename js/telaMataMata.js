import { FASES_MATA_MATA } from './dados/mataMata.js';
import {
  getEstado, definirPalpiteMataMata, voltarParaFaseDeGrupos, reiniciarSimulacao, marcarCampeaoMostrado,
} from './estado.js';
import { obterTodosJogosGruposComPalpites } from './jogos.js';
import { calcularClassificacaoGeral, montarChaveamentoCompleto } from './chaveamento.js';
import { criar, blocoPlaceholder, botaoVencedor } from './componentes.js';
import { mostrarCelebracaoCampeao } from './celebracao.js';

export function renderizarMataMata(container, aoMudar) {
  const estado = getEstado();
  const jogosPorGrupo = obterTodosJogosGruposComPalpites(estado);
  const classificacao = calcularClassificacaoGeral(jogosPorGrupo);
  const chaveamento = montarChaveamentoCompleto(classificacao, estado.palpitesMataMata);

  container.appendChild(criar('div', { class: 'cabecalho-secao' }, [
    criar('h2', { texto: 'Chaveamento mata-mata' }),
    criar('p', { class: 'texto-apoio', texto: 'Esses confrontos seguem o chaveamento oficial definido pela FIFA. Escolha o vencedor de cada confronto para liberar a próxima fase.' }),
    criar('div', { class: 'linha-botoes' }, [
      criar('button', {
        class: 'botao-texto',
        texto: 'Voltar e editar a fase de grupos',
        onclick: () => {
          if (window.confirm('Voltar agora apaga os palpites do mata-mata já escolhidos. Continuar?')) {
            voltarParaFaseDeGrupos();
            aoMudar();
          }
        },
      }),
      criar('button', {
        class: 'botao-texto',
        texto: 'Reiniciar simulação',
        onclick: () => {
          if (window.confirm('Isso vai apagar todos os palpites já escolhidos. Quer continuar?')) {
            reiniciarSimulacao();
            aoMudar();
          }
        },
      }),
    ]),
  ]));

  const todasPorId = new Map();
  [...chaveamento.fase32, ...chaveamento.oitavos, ...chaveamento.quartas, ...chaveamento.semis,
    chaveamento.terceiroLugar, chaveamento.final].forEach((r) => todasPorId.set(r.id, r));

  FASES_MATA_MATA.forEach((fase) => {
    const secao = criar('section', { class: 'cartao fase-mata-mata' });
    secao.appendChild(criar('h3', { texto: fase.nome }));
    const grade = criar('div', { class: 'grade-mata-mata' });
    fase.jogos.forEach((jogoTemplate) => {
      const resultado = todasPorId.get(jogoTemplate.id);
      const ehFinal = jogoTemplate.id === 'M104';
      const ehTerceiro = jogoTemplate.id === 'M103';
      grade.appendChild(criarCartaoMataMata(resultado, aoMudar, { ehFinal, ehTerceiro }));
    });
    secao.appendChild(grade);
    container.appendChild(secao);
  });

  if (chaveamento.final.vencedor && chaveamento.final.vencedor !== estado.ultimoCampeaoMostrado) {
    marcarCampeaoMostrado(chaveamento.final.vencedor);
    mostrarCelebracaoCampeao(chaveamento.final.vencedor);
  }
}

function criarCartaoMataMata(resultado, aoMudar, opcoes = {}) {
  const cartao = criar('div', { class: `confronto-mata-mata${opcoes.ehFinal ? ' confronto-final' : ''}${opcoes.ehTerceiro ? ' confronto-terceiro' : ''}` });
  cartao.appendChild(criar('div', { class: 'jogo-meta' }, [
    criar('span', { class: 'jogo-cidade', texto: resultado.cidade }),
  ]));

  if (!resultado.timeA || !resultado.timeB) {
    cartao.appendChild(criar('div', { class: 'jogo-confronto' }, [
      blocoPlaceholder('A definir'),
      criar('span', { class: 'x x-desabilitado', texto: '×' }),
      blocoPlaceholder('A definir'),
    ]));
    return cartao;
  }

  function escolher(lado) {
    definirPalpiteMataMata(resultado.id, lado);
    aoMudar();
  }

  const botaoA = botaoVencedor(resultado.timeA, resultado.escolha === 'A', () => escolher('A'));
  const botaoB = botaoVencedor(resultado.timeB, resultado.escolha === 'B', () => escolher('B'));

  cartao.appendChild(criar('div', { class: 'jogo-confronto' }, [
    botaoA,
    criar('span', { class: 'x', texto: '×' }),
    botaoB,
  ]));

  return cartao;
}
