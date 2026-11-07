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
    importarPlano: nada, importarDieta: nada,
    setJoelho: nada, setVolta: nada, addTeste: nada,
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

  /* Plano importado: a tela de academia tem um caminho só pra isso.
     Treino em todo dia da semana de propósito, pra não depender do dia em que
     o teste roda; e um perfil de folga todo dia pro outro ramo. */
  const T = await vite.ssrLoadModule('/src/treino.js');
  const { treinos, split } = T.importarOpenGym({
    week: { 1: ['A'], 2: ['A'], 3: ['A'], 4: ['A'], 5: ['A'], 6: ['A'], 7: ['A'] },
    routines: [{ id: 'A', name: 'A · Teste', emoji: '🦵', ex: [
      { id: '0585', sets: 3, reps: 24, side: true, restSec: 60,
        note: 'Nota do exercício. Fase Carga: 4 × 10.' },
      { id: 'bk', mode: 'cardio', sets: 1, min: 5, restOff: true },
    ]}],
    customEx: [{ id: 'bk', n: 'Bike', desc: 'Giro solto.' }],
  });
  const comPlano = { ...cheio, listas: { ...cheio.listas, treinos, split } };
  const folgaSempre = {
    ...cheio,
    listas: { ...cheio.listas, treinos, split: split.map(d => ({ ...d, treinoId: '', meta: 'folga' })) },
  };

  /* dieta importada: refeições com alimentos, substituições e alternativas */
  const Di = await vite.ssrLoadModule('/src/dieta.js');
  const { default: PLANO_DIETA } = await vite.ssrLoadModule('/src/plano-dieta.json');
  const dieta = Di.importarPlanoDieta(PLANO_DIETA);
  const comDieta = {
    ...cheio,
    cfg: { ...cheio.cfg, ...dieta.cfg },
    listas: { ...cheio.listas, refeicoes: dieta.refeicoes },
  };

  /* rotina real importada, nos dois modos de semana */
  const { default: PLANO_ROTINA } = await vite.ssrLoadModule('/src/plano-rotina.json');
  const habitosReais = PLANO_ROTINA.habitos.map((hb, i) => ({ ...hb, id: 'r' + i }));
  const comRotina = { ...cheio, modo: 'aula', listas: { ...cheio.listas, habitos: habitosReais } };
  const deFerias = { ...comRotina, modo: 'ferias' };

  const telas = Object.entries(TELAS);

  for (const [rotulo, estado] of [['vazio', vazio], ['cheio', cheio], ['ciclo fechado', fechado],
                                  ['com plano', comPlano], ['folga todo dia', folgaSempre],
                                  ['com dieta', comDieta], ['com rotina', comRotina],
                                  ['de férias', deFerias]]) {
    for (const [nome, Tela] of telas) {
      const html = renderToString(h(Tela, { s: estado, a: acoes }));
      assert.ok(html.length > 100, `tela ${nome} (${rotulo}) renderizou quase nada`);
    }
    console.log(`ok — ${telas.length} telas renderizaram com o perfil ${rotulo}`);
  }

  // o React separa pedaços de texto com <!-- --> no SSR; isso atrapalha a busca
  const texto = html => html.replaceAll('<!-- -->', '');

  // o treino importado aparece com a prescrição por lado, não com o total
  const gymPlano = texto(renderToString(h(TELAS.academia, { s: comPlano, a: acoes })));
  assert.ok(gymPlano.includes('Teste'), 'a tela devia nomear o treino do dia');
  assert.ok(gymPlano.includes('3 × 12 cada lado'), 'devia mostrar a prescrição por lado');
  assert.ok(!gymPlano.includes('3 × 24'),
    'nunca mostrar o total das duas pernas como se fosse por lado — era o dobro do treino');
  assert.ok(gymPlano.includes('Nota do exercício'), 'a nota do exercício tem que aparecer');
  assert.ok(gymPlano.includes('Bike'), 'exercício nomeado pelo customEx devia aparecer');
  console.log('ok — a academia mostra o plano importado');

  const gymFolga = texto(renderToString(h(TELAS.academia, { s: folgaSempre, a: acoes })));
  assert.ok(gymFolga.includes('Folga hoje'), 'dia sem treino marcado devia dizer folga');
  console.log('ok — dia sem treino marcado vira folga');

  // joelho no vermelho: troca pela recuperação, ou não manda treinar perna
  const vermelho = { ok: true, dor: 7, inchaco: 0, falseou: false };
  const comRec = {
    ...comPlano,
    joelho: { [hoje]: vermelho },
    listas: { ...comPlano.listas, treinos: [...treinos, { id: 'REC', nome: 'Recuperação', emoji: '🩹', ex: [] }] },
  };
  const htmlRec = texto(renderToString(h(TELAS.academia, { s: comRec, a: acoes })));
  assert.ok(htmlRec.includes('Recuperação'), 'no vermelho o treino do dia vira recuperação');
  // a divisão da semana segue mostrando o treino planejado; o que não pode é
  // a prescrição do exercício de perna aparecer como treino de hoje
  assert.ok(!htmlRec.includes('3 × 12 cada lado'),
    'o exercício de perna não pode ser prescrito com o joelho no vermelho');

  const semRec = { ...comPlano, joelho: { [hoje]: vermelho } };
  const htmlSemRec = texto(renderToString(h(TELAS.academia, { s: semRec, a: acoes })));
  assert.ok(htmlSemRec.includes('Joelho no vermelho'), 'sem rotina de recuperação, avisa');
  assert.ok(!htmlSemRec.includes('3 × 12 cada lado'),
    'nunca prescrever exercício de perna com o joelho no vermelho');
  console.log('ok — joelho no vermelho não manda treinar perna');

  // o aviso do reteste vem procurar você na tela Hoje
  const hojeSemTeste = texto(renderToString(h(TELAS.hoje, { s: comPlano, a: acoes })));
  assert.ok(hojeSemTeste.includes('autoteste do joelho'), 'sem teste nenhum, Hoje devia pedir o primeiro');
  const emDia = {
    ...comPlano,
    listas: { ...comPlano.listas, testes: [{ id: 't1', data: hoje, sts: { d: 18, e: 20 }, ponte: { d: 19, e: 20 }, panturrilha: { d: 27, e: 30 } }] },
  };
  const hojeEmDia = texto(renderToString(h(TELAS.hoje, { s: emDia, a: acoes })));
  assert.ok(!hojeEmDia.includes('Autoteste do joelho venceu'), 'teste de hoje não vence hoje');
  const hojeSemPlano = texto(renderToString(h(TELAS.hoje, { s: cheio, a: acoes })));
  assert.ok(!hojeSemPlano.includes('autoteste do joelho'),
    'perfil sem plano de treino não recebe aviso de joelho');
  console.log('ok — o aviso do reteste aparece na tela Hoje');

  // a rotina real: o modo da semana decide quais hábitos existem no dia
  const rotAula = texto(renderToString(h(TELAS.rotina, { s: comRotina, a: acoes })));
  const rotFerias = texto(renderToString(h(TELAS.rotina, { s: deFerias, a: acoes })));
  assert.ok(!rotFerias.includes('Sai pra faculdade'),
    'na semana sem aula o hábito de faculdade não pode aparecer');
  assert.ok(!rotAula.includes('Separa marmita'),
    'na semana com aula o hábito de férias não pode aparecer');
  const naTela = s => D.habitosDoDia(s, hoje).filter(hb => texto(renderToString(
    h(TELAS.rotina, { s, a: acoes }))).includes(hb.nome)).length;
  assert.equal(naTela(comRotina), D.habitosDoDia(comRotina, hoje).length,
    'a tela mostra exatamente os hábitos que valem hoje');
  console.log('ok — a rotina respeita dia da semana e modo');

  // a dieta real: alimentos com grama, substituições e os três lanches num grupo só
  const dietaHtml = texto(renderToString(h(TELAS.dieta, { s: comDieta, a: acoes })));
  assert.ok(dietaHtml.includes('Peito de frango sem pele grelhado'), 'alimento devia aparecer');
  assert.ok(dietaHtml.includes('1,3 filé médio ou 130 g'), 'a quantidade devia aparecer junto');
  assert.ok(dietaHtml.includes('substituições'), 'o alimento com alternativas devia abrir substituições');
  assert.ok(dietaHtml.includes('4 refeições') || dietaHtml.includes('de 4 refeições'),
    'os três lanches contam como um horário só: 4 grupos, não 6 refeições');
  // sem macro por refeição o título conta refeição; "0 g" seria fingir consumo.
  // (substring não serve: "140 g de proteína" da meta contém "0 g de proteína")
  assert.ok(dietaHtml.includes('>0 de 4 refeições<'), 'o título devia contar refeições');
  assert.ok(!dietaHtml.includes('bar-row'),
    'sem macro por refeição não deve desenhar barra de proteína nem de caloria');
  console.log('ok — a dieta importada aparece com gramas e substituições');

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
