/* Renderiza o app e cada tela em Node, com perfil vazio e perfil cheio.
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
  const { Gerenciador } = await vite.ssrLoadModule('/src/editor.jsx');
  const { default: App } = await vite.ssrLoadModule('/src/App.jsx');

  const hoje = D.iso();
  const nada = () => {};
  const acoes = {
    marcar: nada, toggleExtra: nada, setExtra: nada, go: nada, addTx: nada,
    setCampo: nada, setCfg: nada, reiniciarCiclo: nada, apagarPerfil: nada, gerir: nada,
  };

  const vazio = D.novoPerfil('Ana');
  let cheio = D.novoPerfil('Pedro');
  cheio.cicloInicio = D.maisDias(hoje, -11);
  [['gym', 'Fui pra academia'], ['diet', 'Não saí da dieta'], ['fac', 'Assisti as aulas'],
   ['est', 'Bati as 6h'], ['fin', 'Registrei os gastos']].forEach(([pilar, nome]) => {
    cheio = D.comItem(cheio, 'habitos', { pilar, nome, meta: 'detalhe' });
  });
  cheio = D.comItem(cheio, 'refeicoes', { nome: 'Almoço', hora: '12h30', o: 'frango', prot: 48, kcal: 720 });
  cheio = D.comItem(cheio, 'exercicios', { nome: 'Supino', meta: '4 × 8' });
  cheio = D.comItem(cheio, 'materias', { nome: 'Cálculo III', meta: 'seg e qua', nota: 7.5 });
  cheio = D.comItem(cheio, 'entregas', { nome: 'Prova 2', meta: 'sala B204', data: D.maisDias(hoje, 6) });
  cheio = D.comItem(cheio, 'tarefas', { nome: 'Review do PR', meta: '' });
  cheio = D.comItem(cheio, 'metas', { nome: 'Treinar 20x', fase: 'base', tipo: 'habito', habitoId: cheio.listas.habitos[0].id, alvo: 20 });
  cheio = D.comItem(cheio, 'metas', { nome: 'Mês no positivo', fase: 'ritmo', tipo: 'saldo' });
  cheio.dias = { [hoje]: { [cheio.listas.habitos[0].id]: 'sim', [cheio.listas.habitos[1].id]: 'nao' } };
  cheio.extra = { [hoje]: { ['rf' + cheio.listas.refeicoes[0].id]: true, agua: 3, horas: 6.5 } };
  cheio.tx = [{ id: 1, data: hoje, desc: 'Almoço', cat: 'Alimentação', v: -14.5 },
              { id: 2, data: hoje, desc: 'Bolsa', cat: 'Renda', v: 1200 }];

  const fechado = { ...cheio, cicloInicio: D.maisDias(hoje, -95) };
  const telas = Object.entries(TELAS);

  for (const [rotulo, estado] of [['vazio', vazio], ['cheio', cheio], ['ciclo fechado', fechado]]) {
    for (const [nome, Tela] of telas) {
      const html = renderToString(h(Tela, { s: estado, a: acoes }));
      assert.ok(html.length > 100, `tela ${nome} (${rotulo}) renderizou quase nada`);
    }
    console.log(`ok — ${telas.length} telas renderizaram com o perfil ${rotulo}`);
  }

  // o React separa pedaços de texto com <!-- --> no SSR; isso atrapalha a busca
  const texto = html => html.replaceAll('<!-- -->', '');

  // o perfil vazio tem que convidar a cadastrar, não mostrar dado inventado
  const hojeVazio = texto(renderToString(h(TELAS.hoje, { s: vazio, a: acoes })));
  assert.ok(hojeVazio.includes('Bem-vindo, Ana'), 'o perfil vazio devia chamar a pessoa pelo nome');
  assert.ok(hojeVazio.includes('Montar minha rotina'));
  for (const inventado of ['Cálculo III', 'Push B', 'R$ 1.', 'Whey']) {
    assert.ok(!hojeVazio.includes(inventado), `sobrou dado fictício na tela vazia: ${inventado}`);
  }

  // o editor de cada lista
  for (const chave of Object.keys(D.SCHEMAS)) {
    const html = renderToString(h(Gerenciador, {
      s: cheio, chave, titulo: 'Teste', onFechar: nada, onSalvar: nada, onApagar: nada,
    }));
    assert.ok(html.includes('Teste'), `editor de ${chave} não renderizou`);
  }
  console.log(`ok — ${Object.keys(D.SCHEMAS).length} editores renderizaram`);

  // sem perfil escolhido, o app abre perguntando quem é
  const app = texto(renderToString(h(App)));
  for (const trecho of ['Ritmo', 'Quem está usando', 'Pedro', 'Ana']) {
    assert.ok(app.includes(trecho), `a tela de escolha não renderizou "${trecho}"`);
  }
  console.log('ok — o app abre na escolha de perfil');
} finally {
  await vite.close();
}
