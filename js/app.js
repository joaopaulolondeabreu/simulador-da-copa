import { getEstado } from './estado.js';
import { renderizarResultados } from './telaResultados.js';
import { renderizarSimular } from './telaSimular.js';
import { renderizarMataMata } from './telaMataMata.js';
import { renderizarChaveamento } from './telaChaveamento.js';

const ABAS_BASE = [
  { id: 'resultados', rotulo: 'Resultados anteriores' },
  { id: 'simular', rotulo: 'Simule um resultado' },
];

const ABA_CHAVEAMENTO = { id: 'chaveamento', rotulo: 'Visualizar chaveamento' };

let abaAtual = 'resultados';

const navegacao = document.getElementById('navegacao');
const conteudo = document.getElementById('conteudo');

function abasDisponiveis() {
  const estado = getEstado();
  return estado.faseGruposConfirmada ? [...ABAS_BASE, ABA_CHAVEAMENTO] : ABAS_BASE;
}

function renderizarNavegacao() {
  navegacao.innerHTML = '';
  abasDisponiveis().forEach((aba) => {
    const botao = document.createElement('button');
    botao.className = `aba${aba.id === abaAtual ? ' aba-ativa' : ''}`;
    botao.textContent = aba.rotulo;
    botao.addEventListener('click', () => {
      abaAtual = aba.id;
      renderizar();
    });
    navegacao.appendChild(botao);
  });
}

function renderizar() {
  const estado = getEstado();
  if (abaAtual === 'chaveamento' && !estado.faseGruposConfirmada) {
    abaAtual = 'simular';
  }

  renderizarNavegacao();
  conteudo.innerHTML = '';

  if (abaAtual === 'resultados') {
    renderizarResultados(conteudo);
    return;
  }

  if (abaAtual === 'chaveamento') {
    renderizarChaveamento(conteudo);
    return;
  }

  if (!estado.faseGruposConfirmada) {
    renderizarSimular(conteudo, renderizar);
  } else {
    renderizarMataMata(conteudo, renderizar);
  }
}

renderizar();
