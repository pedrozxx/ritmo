/* Renderiza o app e cada uma das 8 telas em Node, com o estado cheio e o vazio.
   Pega erro de render (prop faltando, acesso a undefined) sem abrir navegador.
   React vem do node direto; o Vite externaliza as deps no SSR, então os dois
   lados usam a mesma instância. */
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'warn' });

try {
  const D = await vite.ssrLoadModule('/src/store.js');
  const { TELAS } = await vite.ssrLoadModule('/src/screens.jsx');
  const { default: App } = await vite.ssrLoadModule('/src/App.jsx');

  const nada = () => {};
  const acoes = {
    marcar: nada, toggle: nada, toggleExtra: nada, setExtra: nada, go: nada, addTx: nada,
    setTema: nada, setAnim: nada, limparExemplo: nada, apagarTudo: nada, reiniciarCiclo: nada,
  };
  const telas = Object.entries(TELAS);
  const fimDoCiclo = { ...D.semente(), cicloInicio: D.maisDias(D.iso(), -95) };

  for (const [rotulo, estado] of [['cheio', D.semente()], ['vazio', D.vazio()], ['ciclo fechado', fimDoCiclo]]) {
    for (const [nome, Tela] of telas) {
      const html = renderToString(h(Tela, { s: estado, a: acoes }));
      assert.ok(html.length > 120, `tela ${nome} (${rotulo}) renderizou quase nada`);
    }
    console.log(`ok — ${telas.length} telas renderizaram com o estado ${rotulo}`);
  }

  // o app inteiro: casca, menu e a tela Hoje
  const app = renderToString(h(App));
  for (const trecho of ['Ritmo 0.1', 'Dieta de hoje', 'Financeiro', 'fase', 'Sim', 'Não']) {
    assert.ok(app.includes(trecho), `o app não renderizou "${trecho}"`);
  }
  assert.equal((app.match(/class="nav-item"/g) || []).length, telas.length,
    `o menu lateral tem que ter ${telas.length} itens`);
  console.log('ok — o app inteiro renderizou');
} finally {
  await vite.close();
}
