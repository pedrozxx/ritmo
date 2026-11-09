/* Check das regras do Ritmo: rotina, sequência, ciclo, dieta, estágio,
   dinheiro, metas e o CRUD das listas. `npm run check`. Sem framework. */
import assert from 'node:assert/strict';
import * as D from './store.js';
import * as T from './treino.js';
import * as Di from './dieta.js';
import * as J from './joelho.js';
import * as ICS from './ics.js';

const hoje = D.iso();

/* um perfil de teste com hábitos de id fixo */
const H = [
  { id: 'h1', pilar: 'gym',  nome: 'Treino' },
  { id: 'h2', pilar: 'diet', nome: 'Dieta na linha' },
  { id: 'h3', pilar: 'fac',  nome: 'Aula' },
  { id: 'h4', pilar: 'fin',  nome: 'Gastos' },
];
const perfil = (extra = {}) => {
  const p = D.novoPerfil('Teste');
  return { ...p, ...extra, listas: { ...p.listas, habitos: H, ...(extra.listas || {}) } };
};
const todosSim = Object.fromEntries(H.map(h => [h.id, 'sim']));

/* ---- estrutura ---- */
assert.equal(D.PILARES.length, 5);
assert.equal(D.PERFIS.length, 2);
assert.deepEqual(D.PERFIS.map(p => p.id), ['pedro', 'ana']);
const vazio = D.novoPerfil('Pedro');
assert.equal(vazio.listas.habitos.length, 0, 'perfil novo nasce sem hábito nenhum');
assert.equal(vazio.tx.length, 0, 'perfil novo nasce sem lançamento');
assert.deepEqual(vazio.dias, {}, 'perfil novo nasce sem histórico');
assert.ok(vazio.listas.cats.length > 0, 'categorias genéricas vêm prontas');
assert.equal(vazio.listas.split.length, 7);
assert.equal(vazio.nome, 'Pedro');

/* ---- rotina: só conta hábito que existe hoje ---- */
assert.equal(D.pctDia({ h1: 'sim', h2: 'nao', h3: null, h4: 'sim' }, H), 50);
assert.equal(D.pctDia({ h1: 'sim', apagado: 'sim' }, H), 25, 'hábito apagado não pode inflar o dia');
assert.equal(D.pctDia(undefined, H), 0);
assert.equal(D.pctDia(todosSim, []), 0, 'sem hábito o dia é 0, não divide por zero');
assert.equal(D.contar({ h1: 'sim', h2: 'nao' }, H, 'sim'), 1);
assert.equal(D.pctPilar(todosSim, D.habitosDo(perfil(), 'gym')), 100);
assert.equal(D.pctPilar({}, []), 0);

/* ---- sequência: hoje em aberto não quebra ---- */
const dias = {};
for (let i = 1; i <= 5; i++) dias[D.maisDias(hoje, -i)] = { ...todosSim };
assert.equal(D.sequencia(perfil({ dias })), 5, 'hoje vazio não zera a sequência');
dias[hoje] = { ...todosSim };
assert.equal(D.sequencia(perfil({ dias })), 6, 'hoje completo soma');
dias[D.maisDias(hoje, -3)] = { h1: 'sim' };        // 25% → abaixo dos 70
assert.equal(D.sequencia(perfil({ dias })), 3, 'para no primeiro dia ruim');
assert.equal(D.sequencia(perfil({ dias: {} })), 0);
assert.equal(D.sequencia(D.novoPerfil('x')), 0, 'sem hábito cadastrado não existe sequência');
assert.equal(D.sequencia(perfil({ dias, cfg: { ...D.CFG_PADRAO, metaDia: 20 } })), 6,
  'baixar a meta do dia estica a sequência');

/* ---- semana ---- */
const s7 = D.semana(perfil({ dias }));
assert.equal(s7.length, 7);
assert.equal(s7[0].nome, 'SEG');
assert.equal(s7.filter(d => d.hoje).length, 1);
assert.ok(s7.every((d, i) => i === 0 || d.k > s7[i - 1].k));
assert.equal(D.semanaPilar(perfil({ dias }), 'diet').length, 7);

/* ---- datas ---- */
assert.equal(D.maisDias('2026-03-01', -1), '2026-02-28');
assert.equal(D.maisDias('2024-03-01', -1), '2024-02-29', 'ano bissexto');
assert.equal(D.diasEntre('2026-01-01', '2026-01-31'), 30);
assert.equal(D.dataCurta('2026-11-06'), '06/11');
assert.equal(D.rotuloData(hoje), 'Hoje');
assert.equal(D.rotuloData(D.maisDias(hoje, 1)), 'Amanhã');
assert.equal(D.faltam(hoje).txt, 'hoje');
assert.equal(D.faltam(D.maisDias(hoje, 1)).txt, 'amanhã');
assert.equal(D.faltam(D.maisDias(hoje, 6)).txt, '6 dias');
assert.equal(D.faltam(D.maisDias(hoje, -2)).txt, '2 dias atrás');

/* ---- ciclo de 90 dias ---- */
assert.equal(D.faseDoDia(1).id, 'base');
assert.equal(D.faseDoDia(30).id, 'base');
assert.equal(D.faseDoDia(31).id, 'ritmo');
assert.equal(D.faseDoDia(61).id, 'pico');
assert.equal(D.faseDoDia(90).id, 'pico');

const noCiclo = perfil({ dias, cicloInicio: D.maisDias(hoje, -11) });
const c = D.ciclo(noCiclo);
assert.equal(c.dia, 12);
assert.equal(c.semana, 2);
assert.equal(c.fase.id, 'base');
assert.equal(c.restam, D.CICLO_DIAS - 12);
assert.equal(c.terminou, false);
assert.equal(D.ciclo({ cicloInicio: D.maisDias(hoje, -30) }).fase.id, 'ritmo');
assert.equal(D.ciclo({ cicloInicio: D.maisDias(hoje, -60) }).fase.id, 'pico');
const fechado = D.ciclo({ cicloInicio: D.maisDias(hoje, -95) });
assert.ok(fechado.terminou);
assert.equal(fechado.dia, D.CICLO_DIAS, 'o dia não passa de 90');
assert.equal(fechado.restam, 0);

const ad = D.aderencia(noCiclo);
assert.equal(ad.contados, 12, 'conta só os dias já vividos');
assert.equal(ad.bons, 5);
const ws = D.semanasDoCiclo(noCiclo);
assert.equal(ws.length, 13);
assert.equal(ws.filter(w => w.atual).length, 1);
assert.equal(ws[0].contados, 7);
assert.equal(ws[1].contados, 5, 'a semana atual conta só até hoje');
assert.equal(ws[2].pct, null, 'semana futura não tem número');

/* ---- dieta ---- */
const REF = [
  { id: 'r1', nome: 'Café', prot: 32, kcal: 480 },
  { id: 'r2', nome: 'Almoço', prot: 48, kcal: 720 },
  { id: 'r3', nome: 'Jantar', prot: '', kcal: '' },
];
const comDieta = perfil({
  listas: { refeicoes: REF },
  extra: { [hoje]: { rfr1: true, rfr2: true, agua: 4 } },
});
const m = D.macrosDoDia(comDieta);
assert.equal(m.feitas, 2);
{
  /* o bug do anel da dieta: Almoço 1 e 2 são um almoço só, e marcar
     refeição tem que mexer no anel do pilar e no do dia */
  const alts = [{ id: 'a', grupo: 'cafe', nome: 'Café' }, { id: 'b', grupo: 'alm', nome: 'Almoço 1' },
    { id: 'c', grupo: 'alm', nome: 'Almoço 2' }, { id: 'd', grupo: 'jan', nome: 'Jantar' }];
  const pd = perfil({ listas: { refeicoes: alts } });
  pd.listas.habitos = [{ id: 'hd', pilar: 'diet', nome: 'Dieta na linha' }];
  assert.equal(D.macrosDoDia(pd).total, 3, 'três horários, não quatro opções');
  assert.equal(D.pctPilarNoDia(pd, 'diet'), 0);
  pd.extra = { [hoje]: { rfa: true, rfc: true } };
  assert.equal(D.macrosDoDia(pd).feitas, 2);
  assert.equal(D.pctPilarNoDia(pd, 'diet'), 50, 'café e almoço de 4 itens');
  pd.extra[hoje].rfd = true;
  pd.dias = { [hoje]: { hd: 'sim' } };
  assert.equal(D.pctPilarNoDia(pd, 'diet'), 100);
  assert.equal(D.macrosDoDia(pd).feitas, D.macrosDoDia(pd).total, 'comeu tudo fecha 100%');
  assert.equal(D.primeiroDia({ ...pd, dias: {} }), hoje, 'dia só com refeição marcada já conta como começo');
}
assert.equal(m.total, 3);
assert.equal(m.prot, 80);
assert.equal(m.kcal, 1200);
assert.equal(m.agua, 4);
assert.equal(D.macrosDoDia(perfil()).prot, 0, 'sem refeição cadastrada a proteína é zero');
assert.equal(D.macrosDoDia(perfil({ listas: { refeicoes: [{ id: 'r9', nome: 'x' }] }, extra: { [hoje]: { rfr9: true } } })).prot, 0,
  'refeição sem proteína preenchida não quebra a soma');

const d7 = D.aderenciaPilar(perfil({ dias }), 'diet');
assert.equal(d7.bons, 5);
assert.equal(d7.pct, 71);

/* ---- estágio ---- */
const comHoras = perfil({ extra: { [hoje]: { horas: 6.5 }, [D.maisDias(hoje, -1)]: { horas: 6 } } });
assert.equal(D.horasDoDia(comHoras), 6.5);
assert.equal(D.horasDoDia(perfil()), 0);
assert.equal(D.horasDaSemana(comHoras).length, 7);
assert.ok(D.horasDaSemana(comHoras).reduce((t, d) => t + d.horas, 0) >= 6.5);

/* ---- academia ---- */
assert.equal(D.diasComPilar(perfil({ dias }), 'gym'), Object.keys(dias).filter(k => k.slice(0, 7) === hoje.slice(0, 7)).length,
  'conta os dias do mês em que o pilar teve algum sim');
assert.equal(D.diasComPilar(D.novoPerfil('x'), 'gym'), 0);
const ps = D.porSemana(perfil({ dias }), 'gym');
assert.equal(ps.length, 7);
assert.ok(ps[ps.length - 1] > 0, 'a semana atual tem treino');

/* ---- dinheiro ---- */
const tx = [
  { data: hoje, cat: 'Lazer', v: -48 },
  { data: hoje, cat: 'Renda', v: 1200 },
  { data: hoje, cat: 'Lazer', v: -2.5 },
  { data: '2020-01-05', cat: 'Lazer', v: -999 },
];
const cx = D.caixa(D.doMes(tx));
assert.equal(cx.entradas, 1200);
assert.equal(cx.saidas, 50.5);
assert.equal(cx.saldo, 1149.5);
assert.equal(D.doMes(tx).length, 3, 'mês antigo fica fora');
assert.deepEqual(D.porCategoria(D.doMes(tx)), [['Lazer', 50.5]]);
assert.equal(D.valorDigitado('45,90'), 45.9);
assert.equal(D.valorDigitado('1.250,00'), 1250);
assert.ok(Number.isNaN(D.valorDigitado('')));
assert.ok(Number.isNaN(D.valorDigitado('abc')));
assert.ok(Number.isNaN(D.valorDigitado('-5')));

/* ---- metas ---- */
const comTudo = perfil({ dias, tx: D.doMes(tx), listas: { refeicoes: REF }, extra: comDieta.extra });
assert.equal(D.progresso({ tipo: 'saldo' }, comTudo).p, 100);
assert.equal(D.progresso({ tipo: 'saldo' }, perfil({ tx: [{ data: hoje, cat: 'x', v: -10 }] })).p, 0);
assert.equal(D.progresso({ tipo: 'proteina' }, comTudo).p, Math.round(80 / D.CFG_PADRAO.proteina * 100));
/* refeição só conta a partir do primeiro dia em que alguma foi marcada
   (aqui, hoje): os dias anteriores seguem medidos só pelo hábito */
assert.equal(D.progresso({ tipo: 'dieta', alvo: 86 }, comTudo).p, 83);
assert.equal(D.progresso({ tipo: 'manual', valor: 1740, alvo: 3000 }, comTudo).p, 58);
assert.equal(D.progresso({ tipo: 'manual', valor: 99, alvo: 0 }, comTudo).p, 0, 'alvo zero não explode');
assert.equal(D.progresso({ tipo: 'manual', valor: 50, alvo: 10 }, comTudo).p, 100, 'não passa de 100%');
const porHabito = D.progresso({ tipo: 'habito', habitoId: 'h1', alvo: 20 }, comTudo);
assert.ok(porHabito.p > 0 && porHabito.sub.includes('Treino'));
assert.equal(D.progresso({ tipo: 'habito', habitoId: 'sumiu', alvo: 20 }, comTudo).p, 0,
  'meta apontando pra hábito apagado não quebra');

/* ---- CRUD das listas ---- */
let p1 = D.novoPerfil('Pedro');
p1 = D.comItem(p1, 'habitos', { pilar: 'gym', nome: 'Fui pra academia', meta: 'Push B' });
assert.equal(p1.listas.habitos.length, 1);
const criado = p1.listas.habitos[0];
assert.ok(criado.id, 'item novo ganha id');
assert.equal(criado.pilar, 'gym');
p1 = D.comItem(p1, 'habitos', { ...criado, nome: 'Academia de manhã' });
assert.equal(p1.listas.habitos.length, 1, 'editar não duplica');
assert.equal(p1.listas.habitos[0].nome, 'Academia de manhã');
assert.equal(D.habitosDo(p1, 'gym').length, 1);
assert.equal(D.habitosDo(p1, 'fac').length, 0);
p1 = D.semItem(p1, 'habitos', criado.id);
assert.equal(p1.listas.habitos.length, 0);
assert.notEqual(D.novoId(), D.novoId(), 'ids não se repetem');

/* ---- formulário de meta: campos que aparecem conforme o tipo ---- */
const ks = v => D.camposVisiveis('metas', v).map(c => c.k);
assert.ok(ks({ tipo: 'manual' }).includes('valor'));
assert.ok(!ks({ tipo: 'manual' }).includes('habitoId'));
assert.ok(ks({ tipo: 'habito' }).includes('habitoId'));
assert.ok(!ks({ tipo: 'saldo' }).includes('alvo'), 'saldo não precisa de alvo');
assert.ok(ks({ tipo: 'dieta' }).includes('alvo'));
/* a dica do formulário segue o pilar de onde o cadastro foi aberto */
const campoNome = D.SCHEMAS.habitos.campos.find(c => c.k === 'nome');
const campoMeta = D.SCHEMAS.habitos.campos.find(c => c.k === 'meta');
assert.equal(D.dicaDe(campoNome, { pilar: 'fac' }), 'Assisti as aulas do dia');
assert.equal(D.dicaDe(campoNome, { pilar: 'gym' }), 'Fui pra academia');
assert.equal(D.dicaDe(campoNome, { pilar: 'fin' }), 'Registrei os gastos do dia');
assert.equal(D.dicaDe(campoMeta, { pilar: 'est' }), '6 h por dia, das 13h às 19h');
assert.equal(D.dicaDe(campoNome, null), 'O que você responde todo dia',
  'sem filtro vale a dica genérica, nunca a de um pilar qualquer');
assert.equal(D.dicaDe(campoNome, { pilar: 'inexistente' }), 'O que você responde todo dia');
assert.equal(D.dicaDe(campoNome, { fase: 'base' }), 'O que você responde todo dia',
  'filtro de outra chave não acha dica errada');
assert.equal(D.dicaDe({ dica: 'só a genérica' }, { pilar: 'gym' }), 'só a genérica',
  'campo sem dicaPor usa a dica de sempre');
assert.equal(D.dicaDe({}, { pilar: 'gym' }), '');
/* todo pilar tem dica própria: o buraco era justamente faltar uma */
D.PILARES.forEach(p => {
  assert.ok(campoNome.dicaPor.pilar[p.id], `pilar ${p.id} sem dica de nome`);
  assert.ok(campoMeta.dicaPor.pilar[p.id], `pilar ${p.id} sem dica de detalhe`);
  assert.notEqual(D.dicaDe(campoNome, { pilar: p.id }), campoNome.dica,
    `a dica de ${p.id} não pode cair na genérica`);
});

for (const chave of Object.keys(D.SCHEMAS)) {
  assert.ok(D.SCHEMAS[chave].um, `esquema ${chave} sem nome no singular`);
  assert.ok(D.SCHEMAS[chave].campos.length > 0, `esquema ${chave} sem campo`);
}

/* ---- treino: importação do plano de fora ---- */
const plano = {
  opengym_plan: 1,
  week: { 1: ['A'], 2: ['B'], 4: ['C'] },
  routines: [
    { id: 'A', name: 'A · Quadríceps e joelho', emoji: '🦵', prog: 'off', ex: [
      { id: '2138', mode: 'cardio', sets: 1, min: 5, speed: 20, restOff: true, note: 'Giro solto.' },
      { id: '0585', sets: 3, reps: 24, side: true, restSec: 60,
        note: 'Desce em 3 s. Fase Carga: 4 × 10. Fase Potência: 4 × 8 com 2 s parado esticado.' },
      { id: '0417', sets: 3, reps: 15, restSec: 45, prog: 'double', repsMin: 12, note: 'Segura 1 s.' },
      { id: 'vac-copenhagen', mode: 'time', sets: 3, sec: 15, side: true, restSec: 30, prog: 'time' },
    ]},
    { id: 'B', name: 'B · Superior', emoji: '💪', ex: [
      { id: '0294', sets: 3, restSec: 0, sg: 'braco', sgName: 'Braços', sgRest: 60, prog: 'double', reps: 12, repsMin: 10 },
    ]},
    { id: 'C', name: 'C · Posterior', emoji: '🍑', prog: 'off', ex: [] },
  ],
  customEx: [{ id: 'vac-copenhagen', n: 'Prancha Copenhagen', desc: 'De lado, perna de cima no banco.' }],
};
const { treinos, split: splitPlano, avisos } = T.importarOpenGym(plano);

assert.equal(treinos.length, 3);
assert.equal(treinos[0].nome, 'Quadríceps e joelho', 'o prefixo "A · " sai do nome');
assert.equal(treinos[0].emoji, '🦵');

/* nomes: só o que o arquivo traz. O resto fica com o id à mostra. */
const [bike, extensora, panturrilha, copen] = treinos[0].ex;
assert.equal(copen.nome, 'Prancha Copenhagen', 'customEx dá nome');
assert.equal(extensora.nome, '', 'id numérico não ganha nome inventado');
assert.deepEqual(avisos.semNome, ['2138', '0585', '0417', '0294'],
  'todo id sem nome é reportado, uma vez cada');

/* modos: o inglês do arquivo não passa da importação */
assert.equal(copen.modo, 'tempo', 'mode "time" vira "tempo"');
assert.equal(bike.modo, 'cardio');
assert.equal(extensora.modo, 'reps', 'exercício sem mode é reps');
assert.equal(T.prescricao(bike), '5 min');
assert.equal(T.prescricao(copen), '3 × 15 s cada lado');
assert.equal(T.prescricao(extensora), '3 × 12 cada lado',
  'reps com side é o total das duas pernas; a tela mostra por lado');
assert.equal(T.prescricao(panturrilha), '3 × 12–15', 'dupla progressão mostra a faixa');
assert.equal(T.prescricao({ sets: 3, reps: 24, repsMin: 20, lado: true }), '3 × 10–12 cada lado',
  'a faixa da dupla progressão também vira por lado');
assert.equal(T.prescricao({ sets: 3, reps: 15, lado: true }), '3 × 15 cada lado',
  'ímpar não divide: mostra o total em vez de meia repetição');
assert.equal(T.prescricao({ modo: 'tempo', sets: 3, sec: 25, lado: true }), '3 × 25 s cada lado',
  'em tempo o segundo já é por lado, não divide');

/* fases: Carga → Ritmo, Potência → Pico */
assert.deepEqual(extensora.fases, { ritmo: '4 × 10', pico: '4 × 8 com 2 s parado esticado' });
assert.equal(T.prescricao(extensora, 'ritmo'), '4 × 10');
assert.equal(T.prescricao(extensora, 'pico'), '4 × 8 com 2 s parado esticado');
assert.equal(T.prescricao(extensora, 'base'), '3 × 12 cada lado', 'na Base vale a prescrição crua');
assert.deepEqual(T.fasesDaNota('Giro solto.'), {}, 'nota sem fase não inventa fase');
assert.deepEqual(T.fasesDaNota(''), {});
assert.deepEqual(T.fasesDaNota(undefined), {});

/* progressão herdada da rotina, sobreposta pelo exercício */
assert.equal(bike.prog, 'off', 'herda o prog "off" da rotina A');
assert.equal(panturrilha.prog, 'double', 'o do exercício vence o da rotina');
assert.equal(treinos[1].ex[0].prog, 'double', 'rotina sem prog usa o do exercício');

/* descanso */
assert.equal(T.descansoTxt(bike), 'livre', 'restOff vira livre');
assert.equal(T.descansoTxt(extensora), '60 s');
assert.equal(T.descansoTxt(treinos[1].ex[0]), 'emenda', 'restSec 0 com supersérie é emenda');
assert.equal(T.descansoTxt({ descanso: 0 }), 'sem pausa');
assert.equal(treinos[1].ex[0].sgNome, 'Braços');
assert.equal(treinos[1].ex[0].sgDescanso, 60);

/* semana: 1 = SEG, dia sem treino é folga */
assert.equal(splitPlano.length, 7);
assert.deepEqual(splitPlano.map(d => d.treinoId), ['A', 'B', '', 'C', '', '', '']);
assert.equal(splitPlano[0].meta, '🦵 Quadríceps e joelho');
assert.equal(splitPlano[2].meta, 'folga');
assert.deepEqual(splitPlano.map(d => d.id), D.DIAS_SEMANA.map(d => d.toLowerCase()));

/* treino do dia: 2026-11-09 é uma segunda */
const listasPlano = { treinos, split: splitPlano };
assert.equal(new Date('2026-11-09T12:00:00').getDay(), 1, 'a fixture assume segunda');
assert.equal(T.treinoDoDia(listasPlano, '2026-11-09').id, 'A');
assert.equal(T.treinoDoDia(listasPlano, '2026-11-10').id, 'B');
assert.equal(T.treinoDoDia(listasPlano, '2026-11-11'), null, 'quarta é folga');
assert.equal(T.treinoDoDia({ split: [], treinos: [] }, '2026-11-09'), null);
assert.equal(T.treinoDoDia({}, '2026-11-09'), null, 'perfil sem treino não quebra');
assert.equal(T.treinoDoDia(D.novoPerfil('x').listas, '2026-11-09'), null,
  'perfil novo nasce sem treino e sem quebrar');

/* preencher nomes depois, sem tocar no resto */
const comNome = T.comNomes(treinos, { '0585': 'Cadeira extensora' });
assert.equal(comNome[0].ex[1].nome, 'Cadeira extensora');
assert.equal(comNome[0].ex[1].fases.ritmo, '4 × 10', 'preencher nome não mexe no resto');
assert.equal(comNome[0].ex[3].nome, 'Prancha Copenhagen', 'quem já tinha nome fica');
assert.equal(T.comNomes(treinos, {})[0].ex[1].nome, '', 'mapa vazio não inventa nada');

/* arquivo vazio ou torto não explode */
assert.deepEqual(T.importarOpenGym({}).treinos, []);
assert.equal(T.importarOpenGym({}).split.length, 7);
assert.deepEqual(T.importarOpenGym({}).avisos.semNome, []);

/* ---- dieta: plano de fora, com alternativas no mesmo horário ---- */
const planoDieta = {
  totaisDoDia: { prot: 140.4, kcal: 1503 },
  refeicoes: [
    { grupo: 'cafe', nome: 'Café da manhã', hora: '07:20', prot: null, kcal: null,
      itens: [{ nome: 'Ovo de galinha', qtd: '2 unidades ou 100 g', subs: [] }] },
    { grupo: 'lanche', nome: 'Lanche 1', hora: '16:00', obs: 'Fazer um patê.',
      itens: [{ nome: 'Pão de forma', qtd: '2 fatias ou 50 g',
        subs: [{ nome: 'Atum em conserva em óleo', qtd: '3,4 colheres (55,9 g)' }] }] },
    { grupo: 'lanche', nome: 'Lanche 2', hora: '16:00', itens: [] },
    { grupo: 'lanche', nome: 'Lanche 3', hora: '16:00', itens: [] },
  ],
};
const dieta = Di.importarPlanoDieta(planoDieta);
assert.equal(dieta.refeicoes.length, 4);
assert.equal(dieta.refeicoes[0].prot, '', 'macro ausente vira vazio, nunca número inventado');
assert.equal(dieta.refeicoes[0].kcal, '');
assert.equal(dieta.refeicoes[0].o, 'Ovo de galinha', 'o resumo de texto sai dos itens');
assert.equal(dieta.refeicoes[1].itens[0].subs[0].nome, 'Atum em conserva em óleo');
assert.equal(dieta.refeicoes[1].obs, 'Fazer um patê.');
assert.deepEqual(dieta.cfg, { proteina: 140, kcal: 1503 }, 'o total do dia vira meta dos Ajustes');
assert.deepEqual(Di.importarPlanoDieta({}).refeicoes, [], 'arquivo vazio não explode');
assert.deepEqual(Di.importarPlanoDieta({}).cfg, {}, 'sem total do dia, não mexe na meta');

/* ordem: o dia se lê no relógio, e as alternativas pelo número do nome */
const fora = Di.gruposDeRefeicao([
  { grupo: 'jantar', nome: 'Jantar 2', hora: '22:00', itens: [] },
  { grupo: 'cafe', nome: 'Café', hora: '07:20', itens: [] },
  { grupo: 'jantar', nome: 'Jantar 10', hora: '22:00', itens: [] },
  { grupo: 'lanche', nome: 'Lanche', hora: '16:00', itens: [] },
  { grupo: 'jantar', nome: 'Jantar 1', hora: '22:00', itens: [] },
]);
assert.deepEqual(fora.map(g => g.hora), ['07:20', '16:00', '22:00'],
  'os horários saem na ordem do relógio, não na do arquivo');
assert.deepEqual(fora.find(g => g.grupo === 'jantar').opcoes.map(o => o.nome),
  ['Jantar 1', 'Jantar 2', 'Jantar 10'],
  'as alternativas vão pelo número, e 10 não cai no meio como cairia por texto');
const semHora = Di.gruposDeRefeicao([
  { grupo: 'b', nome: 'B', itens: [] }, { grupo: 'a', nome: 'A', itens: [] },
]);
assert.deepEqual(semHora.map(g => g.grupo), ['b', 'a'], 'sem horário vale a ordem de chegada');

const grupos = Di.gruposDeRefeicao(dieta.refeicoes);
assert.equal(grupos.length, 2, 'os três lanches viram um grupo só');
assert.equal(grupos[0].nome, 'Café da manhã', 'grupo de uma opção mantém o nome');
assert.equal(grupos[1].nome, 'Lanche', 'grupo de várias perde o número do fim');
assert.equal(grupos[1].opcoes.length, 3);
assert.equal(grupos[1].hora, '16:00');
assert.deepEqual(Di.gruposDeRefeicao([]), []);

/* marcar uma alternativa já resolve o grupo — não precisa comer as três */
const ids = dieta.refeicoes.map(r => r.id);
assert.deepEqual(Di.gruposFeitos(grupos, {}), { feitos: 0, total: 2 });
assert.deepEqual(Di.gruposFeitos(grupos, { ['rf' + ids[2]]: true }), { feitos: 1, total: 2 },
  'marcar o Lanche 2 fecha o grupo do lanche');
assert.deepEqual(Di.gruposFeitos(grupos, { ['rf' + ids[1]]: true, ['rf' + ids[2]]: true }),
  { feitos: 1, total: 2 }, 'marcar duas alternativas não conta duas vezes');
assert.deepEqual(Di.gruposFeitos(grupos, { ['rf' + ids[0]]: true, ['rf' + ids[3]]: true }),
  { feitos: 2, total: 2 });

/* ---- hábito com dia da semana e modo de semana ---- */
const HS = [
  { id: 'f1', pilar: 'fac', nome: 'Sai pra faculdade', dias: [0, 1, 2, 3, 4], modo: 'aula' },
  { id: 'd1', pilar: 'diet', nome: 'Lanche', dias: [0, 1, 2, 3, 4] },
  { id: 'g1', pilar: 'gym', nome: 'Pesagem', dias: [5] },
  { id: 'x1', pilar: 'diet', nome: 'Marmita', dias: [], modo: 'ferias' },
  { id: 'y1', pilar: 'fin', nome: 'Gastos' },               // sem dias nem modo: todo dia
];
const comDias = (extra = {}) => ({ ...D.novoPerfil('Pedro'), modo: 'aula', ...extra,
  listas: { ...D.novoPerfil('Pedro').listas, habitos: HS } });

const seg = '2026-11-09', sab = '2026-11-14', dom = '2026-11-15';
assert.equal(D.diaIdx(seg), 0, 'segunda é o índice 0, igual ao split');
assert.equal(D.diaIdx(sab), 5);
assert.equal(D.diaIdx(dom), 6);

const pAula = comDias();
assert.deepEqual(D.habitosDoDia(pAula, seg).map(h => h.id), ['f1', 'd1', 'y1'],
  'segunda com aula: faculdade, lanche e o de todo dia');
assert.deepEqual(D.habitosDoDia(pAula, sab).map(h => h.id), ['g1', 'y1'], 'sábado: pesagem e o de todo dia');
assert.deepEqual(D.habitosDoDia(pAula, dom).map(h => h.id), ['y1'], 'domingo: só o de todo dia');

const pFerias = comDias({ modo: 'ferias' });
assert.deepEqual(D.habitosDoDia(pFerias, seg).map(h => h.id), ['d1', 'x1', 'y1'],
  'sem aula: cai a faculdade e entra a marmita');
assert.ok(D.valeNoDia({ }, pAula, seg), 'hábito sem dias nem modo vale sempre');

/* o ponto da história: o dia divide só pelos hábitos do dia */
const dAula = { ...comDias(), dias: { [sab]: { g1: 'sim', y1: 'sim' } } };
assert.equal(D.pctDoDia(dAula, sab), 100,
  'sábado com os dois hábitos do dia feitos é 100%, não 40% dos cinco cadastrados');

/* dia sem hábito nenhum não soma na sequência nem a quebra */
const soSegunda = { ...D.novoPerfil('Pedro'), modo: 'aula',
  listas: { ...D.novoPerfil('Pedro').listas, habitos: [{ id: 'a', pilar: 'gym', nome: 'Treino', dias: [0] }] } };
assert.equal(D.diaPassou(soSegunda, sab), null, 'sábado não tem hábito: nem passou nem falhou');
assert.equal(D.diaPassou({ ...soSegunda, dias: { [seg]: { a: 'sim' } } }, seg), true);
const atravessa = { ...soSegunda, dias: { '2026-11-02': { a: 'sim' }, [seg]: { a: 'sim' } } };
assert.equal(D.sequencia(atravessa, seg), 2,
  'duas segundas seguidas contam 2: os dias vazios no meio não quebram');

/* ---- joelho: semáforo, autotestes e volta ao campo ---- */
assert.equal(J.luzDo({ ok: true, dor: 0, inchaco: 0 }), 'verde');
assert.equal(J.luzDo({ ok: true, dor: 3, inchaco: 0 }), 'amarelo', 'dor 3 já é amarelo');
assert.equal(J.luzDo({ ok: true, dor: 0, inchaco: 1 }), 'amarelo');
assert.equal(J.luzDo({ ok: true, dor: 5, inchaco: 0 }), 'vermelho', 'dor 5 é vermelho');
assert.equal(J.luzDo({ ok: true, dor: 0, inchaco: 2 }), 'vermelho');
assert.equal(J.luzDo({ ok: true, dor: 0, inchaco: 0, falseou: true }), 'vermelho', 'falseou é vermelho direto');
assert.equal(J.luzDo({ ok: false }), null, 'sem check não inventa cor');
assert.equal(J.luzDo(undefined), null);

assert.equal(J.lsi(36, 40), 90);
assert.equal(J.lsi(30, 40), 75);
assert.equal(J.lsi(10, 0), null, 'esquerda zero não divide por zero');

const tOk = { data: '2026-11-01', sts: { d: 18, e: 20 }, ponte: { d: 19, e: 20 }, panturrilha: { d: 27, e: 30 } };
const tRuim = { data: '2026-11-02', sts: { d: 14, e: 20 }, ponte: { d: 19, e: 20 }, panturrilha: { d: 27, e: 30 } };
assert.equal(J.simetriaOk([tOk]), true, '90, 95 e 90 por cento passam');
assert.equal(J.simetriaOk([tRuim]), false, 'um teste a 70% reprova o conjunto');
assert.equal(J.simetriaOk([tOk, tRuim]), false, 'vale o último teste, não o melhor');
assert.equal(J.simetriaOk([]), false);
assert.equal(J.simetriaOk([{ data: '2026-11-01', sts: { d: 18, e: 20 } }]), false,
  'teste incompleto não passa');
assert.equal(J.ultimoTeste([tRuim, tOk]).data, '2026-11-02', 'o último é por data, não por ordem na lista');
assert.equal(J.linhasDoTeste(tOk).length, 3);
assert.equal(J.linhasDoTeste(tOk)[0].lsi, 90);
assert.equal(J.linhasDoTeste(tOk)[0].ok, true);
assert.deepEqual(J.linhasDoTeste(null), []);

/* reteste a cada 28 dias */
const rtNunca = J.reteste([], '2026-11-07');
assert.equal(rtNunca.nunca, true);
assert.equal(rtNunca.devido, true, 'sem teste nenhum já está devendo o primeiro');
const rtNovo = J.reteste([{ ...tOk, data: '2026-11-01' }], '2026-11-07');
assert.equal(rtNovo.prox, '2026-11-29');
assert.equal(rtNovo.faltam, 22);
assert.equal(rtNovo.devido, false);
const rtHoje = J.reteste([{ ...tOk, data: '2026-10-10' }], '2026-11-07');
assert.equal(rtHoje.prox, '2026-11-07', '10/10 mais 28 dias cai em 07/11');
assert.equal(rtHoje.faltam, 0);
assert.equal(rtHoje.devido, true, 'no próprio dia já vence');
assert.equal(J.reteste([{ ...tOk, data: '2026-10-10' }], '2026-11-06').devido, false,
  'na véspera ainda não venceu');
const rtAtrasado = J.reteste([{ ...tOk, data: '2026-10-01' }], '2026-11-07');
assert.equal(rtAtrasado.faltam, -9, 'atrasado conta em dias negativos');
assert.equal(rtAtrasado.devido, true);

assert.equal(J.voltaAoCampo({}, []).feitos, 0);
assert.equal(J.voltaAoCampo({}, []).total, 8);
assert.equal(J.voltaAoCampo({}, [tOk]).feitos, 1, 'os autotestes marcam o critério sozinhos');
const todos = Object.fromEntries(J.CRITERIOS.filter(c => !c.auto).map(c => [c.k, true]));
assert.equal(J.voltaAoCampo(todos, []).liberado, false, 'falta o automático');
assert.equal(J.voltaAoCampo(todos, [tOk]).liberado, true);

/* joelho no vermelho troca o treino do dia pela recuperação */
const comRec = { treinos: [...treinos, { id: 'REC', nome: 'Recuperação', emoji: '🩹', ex: [] }], split: splitPlano };
assert.equal(T.treinoDoDia(comRec, '2026-11-09').id, 'A', 'sem check, o treino do dia');
assert.equal(T.treinoDoDia(comRec, '2026-11-09', 'verde').id, 'A');
assert.equal(T.treinoDoDia(comRec, '2026-11-09', 'amarelo').id, 'A', 'amarelo treina igual, mais leve');
assert.equal(T.treinoDoDia(comRec, '2026-11-09', 'vermelho').id, 'REC', 'vermelho vira recuperação');
assert.equal(T.treinoDoDia(comRec, '2026-11-11', 'vermelho').id, 'REC', 'vale até no dia de folga');
assert.equal(T.treinoDoDia(listasPlano, '2026-11-09', 'vermelho'), null,
  'plano sem rotina de recuperação devolve nada, nunca o treino de perna');
assert.equal(T.recuperacao([{ id: 'z', nome: 'Dia de recuperação' }]).id, 'z', 'acha pelo nome também');

/* ---- registro de carga e dupla progressão ---- */
const exDouble = { ord: 0, modo: 'reps', sets: 3, reps: 15, repsMin: 12, prog: 'double' };
const exLado = { ord: 1, modo: 'reps', sets: 3, reps: 24, lado: true, prog: 'double', repsMin: 20 };
assert.equal(T.alvoDeReps(exDouble), 15);
assert.equal(T.alvoDeReps(exLado), 12, 'unilateral: o alvo é por lado');
assert.equal(T.alvoDeReps({ modo: 'tempo', sets: 3, sec: 30 }), null);
assert.equal(T.fechouAFaixa(exDouble, { s: [15, 15, 15] }), true, 'topo da faixa nas três: sobe');
assert.equal(T.fechouAFaixa(exDouble, { s: [15, 15, 13] }), false, 'uma série abaixo não sobe');
assert.equal(T.fechouAFaixa(exDouble, { s: [15, 15] }), false, 'faltou série não sobe');
assert.equal(T.fechouAFaixa({ ...exDouble, prog: 'off' }, { s: [15, 15, 15] }), false,
  'exercício sem dupla progressão nunca manda subir');
assert.equal(T.fechouAFaixa(exDouble, null), false);
assert.equal(T.fechouAFaixa(exLado, { s: [12, 12, 12] }), true, 'por lado também fecha');

const tA = { id: 'A' };
assert.equal(T.chaveFeito(tA, exDouble), 'txA-0');
assert.equal(T.chaveLog(tA, exDouble), 'tlA-0');
assert.deepEqual(T.logDe({}, tA, exDouble), { kg: '', s: [] });
assert.deepEqual(T.logDe({ 'tlA-0': { kg: 30, s: [12] } }, tA, exDouble), { kg: 30, s: [12] });

const extraHist = {
  '2026-11-01': { 'tlA-0': { kg: 28, s: [12, 12, 11] } },
  '2026-11-05': { 'tlA-0': { kg: 30, s: [13, 12, 12] } },
  '2026-11-06': { 'tlA-0': { kg: '', s: [] } },
};
assert.equal(T.ultimoLog(extraHist, tA, exDouble, '2026-11-08').kg, 30,
  'pega o último registro de verdade, pulando o dia em branco');
assert.equal(T.ultimoLog(extraHist, tA, exDouble, '2026-11-08').data, '2026-11-05');
assert.equal(T.ultimoLog({}, tA, exDouble, '2026-11-08'), null);
assert.equal(T.ultimoLog(extraHist, tA, exDouble, '2026-11-08', 1), null, 'não enxerga além da janela');

/* ---- peso, água e backup ---- */
const comPeso = { ...D.novoPerfil('Pedro'),
  extra: { '2026-11-01': { peso: 80 }, '2026-11-08': { peso: 78.4, cintura: 86 } } };
assert.equal(D.ultimaPesagem(comPeso).peso, 78.4, 'vale a pesagem mais nova');
assert.equal(D.pesagens(comPeso).length, 2);
assert.equal(D.pesagens(comPeso)[0].cintura, 86);
assert.equal(D.pesoDoDia(comPeso, '2026-11-01'), 80);
assert.equal(D.pesoDoDia(comPeso, '2026-11-02'), null);
const agua = D.metaAgua(comPeso);
assert.equal(agua.doPeso, true);
assert.equal(agua.ml, Math.round(78.4 * 45), 'a meta sai de ml por quilo');
assert.equal(agua.garrafas, Math.round(78.4 * 45 / 500));
const semPeso = D.metaAgua(D.novoPerfil('Ana'));
assert.equal(semPeso.doPeso, false, 'sem pesagem cai no número fixo');
assert.equal(semPeso.ml, D.CFG_PADRAO.garrafas * D.CFG_PADRAO.mlGarrafa);

let pBk = D.novoPerfil('Pedro');
pBk = D.comItem(pBk, 'habitos', { pilar: 'gym', nome: 'Treino' });
pBk.dias = { '2026-11-07': { x: 'sim' } };
pBk.tx = [{ id: 't', data: '2026-11-07', desc: 'Almoço', cat: 'Alimentação', v: -14.5 }];
const arquivo = D.paraBackup(pBk, 'pedro');
assert.equal(arquivo.ritmo_backup, D.VERSAO_BACKUP);
assert.equal(arquivo.perfil, 'pedro');
const voltou = D.deBackup(JSON.parse(JSON.stringify(arquivo)));
assert.equal(voltou.listas.habitos.length, 1, 'o backup volta inteiro');
assert.deepEqual(voltou.dias, pBk.dias);
assert.equal(voltou.tx[0].v, -14.5);
assert.equal(voltou.cfg.metaDia, pBk.cfg.metaDia);
assert.equal(D.deBackup(null), null);
assert.equal(D.deBackup({}), null, 'arquivo sem a marca não é backup');
assert.equal(D.deBackup({ ritmo_backup: 99, estado: {} }), null, 'versão desconhecida não entra');
assert.ok(D.deBackup({ ritmo_backup: 1, estado: { nome: 'X' } }).listas.habitos,
  'backup de versão antiga ganha as listas novas vazias, não quebra');

/* ---- cofres: objetivos de guardar dinheiro ---- */
const txCofre = [
  { id: '1', data: '2026-11-01', cat: 'Poupança', v: -500, cofre: 'c1' },
  { id: '2', data: '2026-11-05', cat: 'Poupança', v: -300, cofre: 'c1' },
  { id: '3', data: '2026-11-06', cat: 'Poupança', v: 100, cofre: 'c1' },   // tirou
  { id: '4', data: '2026-11-06', cat: 'Lazer', v: -50 },
];
assert.equal(D.guardado(txCofre, 'c1'), 700, 'guardar soma, tirar desconta');
assert.equal(D.guardado(txCofre, 'inexistente'), 0);
const c1 = D.cofre({ id: 'c1', nome: 'Reserva', alvo: 3000 }, txCofre, '2026-11-08');
assert.equal(c1.tem, 700);
assert.equal(c1.falta, 2300);
assert.equal(c1.pct, 23);
assert.equal(c1.porMes, undefined, 'sem prazo não calcula parcela');
const c2 = D.cofre({ id: 'c1', nome: 'Reserva', alvo: 3000, ate: '2026-12-08' }, txCofre, '2026-11-08');
assert.equal(c2.dias, 30);
assert.equal(c2.porMes, 2300, 'um mês pela frente: precisa guardar o que falta');
assert.equal(D.cofre({ id: 'x', alvo: 0 }, [], '2026-11-08').pct, 0, 'alvo zero não divide por zero');
assert.equal(D.cofre({ id: 'c1', alvo: 500 }, txCofre, '2026-11-08').pct, 100, 'não passa de 100%');
assert.equal(D.cofre({ id: 'c1', alvo: 3000, ate: '2026-10-01' }, txCofre, '2026-11-08').venceu, true);

/* ---- quanto tenho agora ---- */
const semBase = D.novoPerfil('Pedro');
assert.equal(D.dinheiroAgora(semBase), null, 'sem conferência não inventa saldo');
const comBase = {
  ...semBase,
  cfg: { ...semBase.cfg, saldoBase: 1200, saldoBaseEm: '2026-11-01' },
  tx: [
    { id: '1', data: '2026-10-28', cat: 'Lazer', v: -90 },   // antes da conferência
    { id: '2', data: '2026-11-02', cat: 'Lazer', v: -45.5 },
    { id: '3', data: '2026-11-05', cat: 'Renda', v: 300 },
  ],
};
const dn = D.dinheiroAgora(comBase);
assert.equal(dn.base, 1200);
assert.equal(dn.mexido, 254.5, 'só o que veio depois da conferência mexe no saldo');
assert.equal(dn.agora, 1454.5);
assert.equal(D.dinheiroAgora({ ...comBase, cfg: { ...comBase.cfg, saldoBase: 0 } }).agora, 254.5,
  'base zero é um valor legítimo, não ausência de base');

/* ---- chamados de TI ---- */
const comCh = { ...D.novoPerfil('Pedro'), extra: { [hoje]: { chamados: 7 } } };
assert.equal(D.chamadosDoDia(comCh), 7);
assert.equal(D.chamadosDoDia(D.novoPerfil('x')), 0);
assert.equal(D.chamadosDaSemana(comCh).length, 7);
assert.equal(D.chamadosDaSemana(comCh).reduce((t, d) => t + d.chamados, 0), 7);

/* ---- horário de aula e o reagendamento da rotina ---- */
assert.equal(D.emMinutos('19:10'), 19 * 60 + 10);
assert.equal(D.emMinutos('19h10'), 19 * 60 + 10);
assert.equal(D.emMinutos('7h'), 7 * 60);
assert.equal(D.emMinutos('24:00'), null);
assert.equal(D.emMinutos('noite'), null);
assert.equal(D.emHora(19 * 60 + 10), '19:10');
assert.equal(D.emHora(null), '');

const MAT = [
  { id: 'm1', nome: 'Sistemas Operacionais', dias: [0, 2], inicio: '19:10', fim: '22:30' },
  { id: 'm2', nome: 'Sociologia', dias: [0], inicio: '18:00', fim: '19:00' },
  { id: 'm3', nome: 'Sem horário', dias: [4] },
];
const jSeg = D.janelaDeAula(MAT, 0);
assert.equal(jSeg.de, 18 * 60, 'a janela começa na primeira aula do dia');
assert.equal(jSeg.ate, 22 * 60 + 30, 'e vai até o fim da última');
assert.equal(jSeg.aulas.length, 2);
assert.equal(jSeg.aulas[0].nome, 'Sociologia', 'as aulas saem em ordem de horário');
assert.equal(D.janelaDeAula(MAT, 1), null, 'dia sem aula não tem janela');
assert.equal(D.janelaDeAula(MAT, 4), null, 'matéria sem horário não cria janela');
assert.equal(D.janelaDeAula([], 0), null);

const comAula = {
  ...D.novoPerfil('Pedro'), modo: 'aula',
  listas: {
    ...D.novoPerfil('Pedro').listas,
    materias: MAT,
    habitos: [
      { id: 'h1', pilar: 'gym', nome: 'Treino', dias: [0, 2], hora: '19:45' },   // dentro da aula
      { id: 'h2', pilar: 'gym', nome: 'Trocar roupa', dias: [0], hora: '19:30' },// dentro
      { id: 'h3', pilar: 'diet', nome: 'Lanche', dias: [0], hora: '16:00' },     // antes, fica
      { id: 'h4', pilar: 'fin', nome: 'Gastos', dias: [0], hora: '23:00' },      // depois, fica
      { id: 'h5', pilar: 'fac', nome: 'Sem hora', dias: [0] },
      { id: 'h6', pilar: 'gym', nome: 'Só férias', dias: [0], hora: '20:00', modo: 'ferias' },
    ],
  },
};
const conf = D.conflitosComAula(comAula);
const idsConf = [...new Set(conf.map(c => c.habito.id))].sort();
assert.deepEqual(idsConf, ['h1', 'h2'], 'só o que cai dentro da aula é movido');
assert.ok(!conf.some(c => c.habito.id === 'h6'), 'hábito de outro modo de semana não entra');
assert.equal(conf.find(c => c.habito.id === 'h2' && c.dia === 0).para, '22:45',
  'o primeiro vai pro fim da aula mais a folga de 15 min');
assert.equal(conf.find(c => c.habito.id === 'h1' && c.dia === 0).para, '23:00',
  'o seguinte mantém os 15 min de distância que tinha do anterior');
assert.equal(conf.filter(c => c.habito.id === 'h1').length, 2, 'treino conflita na segunda e na quarta');

const ajustados = D.comHorariosAjustados(comAula.listas.habitos, conf);
assert.equal(ajustados.find(h => h.id === 'h1').hora, '23:00');
assert.equal(ajustados.find(h => h.id === 'h3').hora, '16:00', 'quem não conflita não é tocado');
assert.equal(ajustados.find(h => h.id === 'h5').hora, undefined);
assert.equal(ajustados.length, comAula.listas.habitos.length, 'não perde nem duplica hábito');
assert.deepEqual(D.conflitosComAula(D.novoPerfil('x')), [], 'sem matéria não há conflito');

/* grupos de refeição disponíveis pro cadastro de alternativa */
const comRef = { listas: { refeicoes: [
  { id: 'r1', grupo: 'lanche', nome: 'Lanche 1', hora: '16:00' },
  { id: 'r2', grupo: 'lanche', nome: 'Lanche 2', hora: '16:00' },
  { id: 'r3', grupo: 'almoco', nome: 'Almoço 1', hora: '12:00' },
  { id: 'r4', nome: 'Avulsa' },
] } };
assert.deepEqual(D.gruposExistentes(comRef), [['lanche', 'Lanche · 16:00'], ['almoco', 'Almoço · 12:00']],
  'um item por horário, sem o número da alternativa e sem os avulsos');
assert.deepEqual(D.gruposExistentes({ listas: {} }), []);

/* ---- avisos no calendário (.ics) ---- */
assert.equal(ICS.horaIcs('08:00'), '080000');
assert.equal(ICS.horaIcs('8h05'), '080500');
assert.equal(ICS.horaIcs('20:55'), '205500');
assert.equal(ICS.horaIcs('9h'), '090000');
assert.equal(ICS.horaIcs('25:00'), null, 'hora impossível não vira evento');
assert.equal(ICS.horaIcs('12:99'), null);
assert.equal(ICS.horaIcs('manhã'), null);
assert.equal(ICS.horaIcs(''), null);
assert.equal(ICS.horaIcs(undefined), null);

assert.equal(ICS.escapar('a,b;c\\d'), 'a\\,b\\;c\\\\d', 'os especiais do iCalendar saem escapados');
assert.equal(ICS.escapar('uma\nduas'), 'uma\\nduas');
const bytes = t => new TextEncoder().encode(t).length;
assert.deepEqual(ICS.dobrar('curta'), ['curta']);
const longa = 'X'.repeat(200);
const dobrada = ICS.dobrar(longa);
assert.ok(dobrada.length > 1, 'linha longa é dobrada');
assert.ok(dobrada.every(l => bytes(l) <= 75), 'nenhum pedaço passa de 75 octetos');
assert.equal(dobrada.slice(1).every(l => l.startsWith(' ')), true, 'a continuação começa com espaço');
assert.equal(dobrada.join('').replace(/ /g, ''), longa, 'juntando de volta dá o original');
/* acento ocupa dois octetos: contar caractere deixaria a linha longa demais */
const acentuada = 'ã'.repeat(100);
const dAcent = ICS.dobrar(acentuada);
assert.ok(dAcent.every(l => bytes(l) <= 75), 'com acento também respeita o limite em bytes');
assert.ok(dAcent.some(l => l.length < 75), 'em bytes, cabe menos caractere por linha');
assert.equal(dAcent.map((l, i) => (i ? l.slice(1) : l)).join(''), acentuada,
  'nenhum caractere foi cortado no meio');

const hSeg = { id: 'h1', nome: 'Sai pra faculdade', hora: '08:00', meta: 'trajeto', dias: [0, 1, 2, 3, 4], modo: 'aula' };
const evSeg = ICS.eventoDoHabito(hSeg, '2026-11-11');   // quarta
assert.equal(evSeg.rrule, 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
assert.equal(evSeg.inicio, '20261109T080000', 'ancora na segunda desta semana, que é o 1º dia escolhido');
assert.ok(evSeg.desc.includes('Só na semana com aula.'));
const evSab = ICS.eventoDoHabito({ id: 'h2', nome: 'Pesagem', hora: '08:05', dias: [5] }, '2026-11-11');
assert.equal(evSab.rrule, 'FREQ=WEEKLY;BYDAY=SA');
assert.equal(evSab.inicio, '20261114T080500', 'sábado da mesma semana');
assert.equal(ICS.eventoDoHabito({ id: 'h3', nome: 'Sem hora' }, '2026-11-11'), null,
  'hábito sem horário não vira evento, e não ganha um inventado');
assert.equal(ICS.eventoDoHabito({ id: 'h4', nome: 'Todo dia', hora: '07:00' }, '2026-11-11').rrule,
  'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU', 'sem dias marcados, vale a semana inteira');

const evRe = ICS.eventoDoReteste([{ data: '2026-11-01' }], '2026-11-07');
assert.equal(evRe.rrule, 'FREQ=DAILY;INTERVAL=28');
assert.equal(evRe.inicio, '20261129T090000', 'cai 28 dias depois do último teste');
assert.equal(ICS.eventoDoReteste([], '2026-11-07').inicio, '20261107T090000',
  'sem teste nenhum, começa hoje');

const perfilIcs = { nome: 'Pedro', modo: 'aula',
  listas: { habitos: [hSeg, { id: 'h5', nome: 'Só férias', hora: '07:00', modo: 'ferias' },
    { id: 'h6', nome: 'Sem hora', dias: [0] }], treinos: [{ id: 'A' }], testes: [] } };
const saida = ICS.avisosDoPerfil(perfilIcs, '2026-11-11');
assert.equal(saida.eventos.length, 2, 'o hábito com hora do modo atual, mais o reteste');
assert.equal(saida.semHora, 1, 'o hábito sem horário é contado, não escondido');
assert.ok(!saida.texto.includes('Só férias'), 'hábito de outro modo não entra');
assert.ok(saida.texto.startsWith('BEGIN:VCALENDAR\r\n'));
assert.ok(saida.texto.endsWith('END:VCALENDAR\r\n'));
assert.equal(saida.texto.split('BEGIN:VEVENT').length - 1, 2);
assert.equal(saida.texto.split('BEGIN:VALARM').length - 1, 2, 'todo evento leva alarme');
assert.ok(saida.texto.includes('X-WR-CALNAME:Ritmo · Pedro · com aula'));
assert.ok(saida.texto.split('\r\n').every(l => l.length <= 75), 'nenhuma linha passa de 75 octetos');
const semTreino = ICS.avisosDoPerfil({ ...perfilIcs, listas: { ...perfilIcs.listas, treinos: [] } }, '2026-11-11');
assert.equal(semTreino.eventos.length, 1, 'sem plano de treino não exporta reteste');
assert.equal(ICS.avisosDoPerfil({ nome: 'Ana', listas: {} }, '2026-11-11').eventos.length, 0,
  'perfil vazio gera calendário vazio, sem quebrar');


/* ---- rotina hora a hora ---- */
{
  const p = D.novoPerfil('Linha');
  p.cfg.acorda = '07:00';
  p.listas.habitos = [
    { id: 'a', pilar: 'gym', nome: 'Treino', hora: '19:45' },
    { id: 'b', pilar: 'diet', nome: 'Lanche', hora: '16:00' },
    { id: 'c', pilar: 'fin', nome: 'Gastos' },
    { id: 'd', pilar: 'est', nome: 'Madrugada', hora: '00:30' },
  ];
  p.listas.materias = [{ id: 'm', nome: 'SO', dias: [0, 1, 2, 3, 4, 5, 6], inicio: '08:30', fim: '11:00' }];
  const grupos = Di.gruposDeRefeicao([{ id: 'r1', grupo: 'alm', nome: 'Almoço 1', hora: '12:00' },
    { id: 'r2', grupo: 'alm', nome: 'Almoço 2', hora: '12:00' }]);
  const { itens, semHora } = D.linhaDoDia(p, hoje, grupos);
  assert.deepEqual(itens.map(i => i.nome), ['Acorda', 'SO', 'Almoço', 'Lanche', 'Treino', 'Madrugada', 'Dorme'],
    'o dia vai de acordar a dormir, e a madrugada fica no fim, não no começo');
  assert.equal(itens.at(-1).hora, '23:00', 'dorme 8 horas antes de acordar');
  assert.deepEqual(semHora.map(h => h.nome), ['Gastos'], 'hábito sem hora vai pra fora da linha');
  assert.equal(D.linhaDoDia({ ...p, modo: 'ferias' }, hoje, grupos).itens.some(i => i.tipo === 'aula'), false,
    'semana sem aula não mostra aula');
  assert.equal(D.emHora(D.dormeMin({ cfg: { acorda: '05:30' } })), '21:30');
  assert.equal(D.acordaMin({ cfg: {} }), 7 * 60, 'perfil antigo sem acorda cai no padrão');
  const em = (h, m) => { const d = new Date(); d.setHours(h, m, 0, 0); return d; };
  assert.equal(itens[D.itemDeAgora(p, itens, em(16, 10))].nome, 'Lanche');
  assert.equal(itens[D.itemDeAgora(p, itens, em(7, 2))].nome, 'Acorda');
  assert.equal(itens[D.itemDeAgora(p, itens, em(23, 30))].nome, 'Dorme');
  assert.equal(itens[D.itemDeAgora(p, itens, em(1, 0))].nome, 'Dorme', 'madrugada ainda é a noite de ontem');
}

/* ---- progresso ---- */
{
  const p = D.novoPerfil('Prog');
  p.cfg.metaDia = 70;
  p.listas.habitos = [{ id: 'x', pilar: 'gym', nome: 'X' }, { id: 'y', pilar: 'diet', nome: 'Y' }];
  assert.equal(D.primeiroDia(p), null);
  assert.equal(D.melhorSequencia(p), 0);
  assert.deepEqual(D.placarHabitos(p), [], 'sem histórico não inventa placar');
  const k = n => D.maisDias(hoje, -n);
  p.dias = {
    [k(6)]: { x: 'sim', y: 'sim' }, [k(5)]: { x: 'sim', y: 'sim' }, [k(4)]: { x: 'sim', y: 'sim' },
    [k(3)]: { x: 'sim', y: 'nao' },  // 50%: quebra
    /* k(2) em branco: conta como zero */
    [k(1)]: { x: 'sim', y: 'sim' },
  };
  assert.equal(D.primeiroDia(p), k(6));
  assert.equal(D.pctHistorico(p, k(7)), null, 'antes do primeiro dia não conta');
  assert.equal(D.pctHistorico(p, k(2)), 0, 'dia em branco depois de começar é zero');
  assert.equal(D.melhorSequencia(p), 3);
  const r = D.resumoDias(p, 7);
  assert.equal(r.contados, 6, 'hoje em aberto fica de fora');
  assert.equal(r.bons, 4);
  assert.equal(r.media, Math.round((100 * 4 + 50 + 0) / 6));
  const pl = D.placarHabitos(p, 7);
  assert.equal(pl[0].h.id, 'y', 'o mais furado vem primeiro');
  assert.deepEqual([pl[0].sim, pl[0].vale], [4, 6]);
  assert.deepEqual([pl[1].sim, pl[1].vale], [5, 6]);
}


/* ---- aula e estágio mandam na rotina ---- */
{
  const p = D.novoPerfil('Blocos');
  p.modo = 'aula';
  const sai = { id: 's', pilar: 'fac', nome: 'Sai pra faculdade', hora: '08:00', dias: [0, 1, 2, 3, 4], modo: 'aula', ancora: 'aula', antes: 30 };
  const treino = { id: 't', pilar: 'gym', nome: 'Treino', hora: '15:00', dias: [] };
  const lanche = { id: 'l', pilar: 'diet', nome: 'Lanche', hora: '16:00', dias: [] };
  p.listas.habitos = [sai, treino, lanche];

  // sem horário de aula em lugar nenhum: vale o fixo de antes
  assert.equal(D.horaDoHabito(sai, p, 0).min, 8 * 60, 'sem aula cadastrada, fica o 08:00');

  // aula só terça à tarde
  p.listas.materias = [{ id: 'm', nome: 'Redes', dias: [1], inicio: '14:00', fim: '17:30' }];
  assert.equal(D.horaDoHabito(sai, p, 0), null, 'segunda sem aula: não sai pra faculdade');
  assert.equal(D.emHora(D.horaDoHabito(sai, p, 1).min), '13:30', 'terça: 30 min antes da aula das 14:00');
  assert.equal(D.horaDoHabito(sai, { ...p, modo: 'ferias' }, 1), null, 'semana sem aula: não sai');
  assert.equal(D.horaDoHabito({ ...sai, antes: '' }, p, 1).min, 14 * 60 - D.ANTES_PADRAO, 'antes em branco usa o padrão');

  // estágio 12 às 18, seg a sex
  p.listas.turnos = [{ id: 'e', nome: 'Estágio', dias: [0, 1, 2, 3, 4], inicio: '12:00', fim: '18:00' }];
  const seg = D.maisDias(hoje, -D.diaIdx(hoje));
  const ter = D.maisDias(seg, 1);
  const linhaSeg = D.linhaDoDia(p, seg).itens;
  assert.ok(linhaSeg.some(i => i.tipo === 'estagio' && i.hora === '12:00'), 'o estágio entra na linha');
  assert.ok(!linhaSeg.some(i => i.nome === 'Sai pra faculdade'), 'segunda não tem "sai pra faculdade"');
  assert.equal(linhaSeg.find(i => i.id === 't').choque.tipo, 'estagio', 'treino às 15:00 cai no estágio');
  assert.equal(linhaSeg.find(i => i.id === 'l').choque, null, 'comer no estágio não é choque');
  const linhaTer = D.linhaDoDia(p, ter).itens;
  assert.equal(linhaTer.find(i => i.nome === 'Sai pra faculdade').hora, '13:30');
  assert.ok(linhaTer.find(i => i.tipo === 'estagio').choque, 'aula e estágio no mesmo horário aparecem como choque');
  assert.ok(linhaTer.find(i => i.tipo === 'aula').choque);
  assert.equal(D.habitosDoDia(p, seg).some(h => h.id === 's'), false, 'e não conta no % da segunda');

  // calendário: um evento por dia que tem aula, na hora daquele dia
  const ics = ICS.avisosDoPerfil(p, hoje);
  const ev = ics.eventos.filter(e => e.titulo === 'Sai pra faculdade');
  assert.equal(ev.length, 1);
  assert.equal(ev[0].rrule, 'FREQ=WEEKLY;BYDAY=TU');
  assert.ok(ev[0].inicio.endsWith('T133000'));

  // ajuste automático da aula não reescreve hábito preso à aula
  assert.ok(!D.conflitosComAula({ ...p, listas: { ...p.listas, habitos: [{ ...sai, hora: '15:00', dias: [1] }] } }).length);

  // perfil antigo com o plano aplicado ganha a âncora sozinho
  const mig = D.migrarListas({ habitos: [{ id: 'x', pilar: 'fac', nome: 'Sai pra faculdade', hora: '08:00' },
    { id: 'y', pilar: 'fac', nome: 'Sai pra faculdade', hora: '08:00', ancora: '' }] });
  assert.equal(mig.habitos[0].ancora, 'aula');
  assert.equal(mig.habitos[1].ancora, '', 'quem escolheu horário fixo continua com ele');

  // o formulário só pede minutos quando há âncora, e só pede hora quando não há
  const ks = v => D.camposVisiveis('habitos', v).map(c => c.k);
  assert.ok(ks({ ancora: 'aula' }).includes('antes') && !ks({ ancora: 'aula' }).includes('hora'));
  assert.ok(ks({}).includes('hora') && !ks({}).includes('antes'));
}


/* ---- acordar em cima da hora do estágio ---- */
{
  const p = D.novoPerfil('Cedo');
  p.cfg.acorda = '07:00';
  p.listas.turnos = [{ id: 'a', nome: 'Estágio', dias: [1], inicio: '07:00', fim: '13:00' },
    { id: 'b', nome: 'Estágio', dias: [0], inicio: '12:00', fim: '18:00' }];
  const seg = D.maisDias(hoje, -D.diaIdx(hoje));
  const ter = D.maisDias(seg, 1);
  assert.equal(D.linhaDoDia(p, ter).itens[0].cedo.de, 7 * 60, 'terça: estágio às 7, acorda às 7');
  assert.equal(D.linhaDoDia(p, seg).itens[0].cedo, null, 'segunda: dá tempo');
  const plano = (await import('./plano-rotina.json', { with: { type: 'json' } })).default;
  const doDia = d => plano.turnos.filter(t => t.dias.includes(d)).map(t => `${t.inicio}-${t.fim}`);
  assert.deepEqual([0, 1, 2, 3, 4].map(doDia), [['12:00-18:00'], ['07:00-13:00'], ['12:00-18:00'], ['12:00-18:00'], ['08:00-13:00']]);
}


/* ---- acordar às 6 no perfil do Pedro, uma vez só ---- */
{
  const antigo = { ...D.novoPerfil('Pedro'), cfg: { ...D.CFG_PADRAO, acorda: '07:00' } };
  const um = D.aplicarPedidos('pedro', antigo);
  assert.equal(um.cfg.acorda, '06:00');
  assert.equal(D.emHora(D.dormeMin(um)), '22:00');
  const mudouDepois = { ...um, cfg: { ...um.cfg, acorda: '06:30' } };
  assert.equal(D.aplicarPedidos('pedro', mudouDepois).cfg.acorda, '06:30', 'não volta pra 6 se mudar depois');
  assert.equal(D.aplicarPedidos('ana', antigo).cfg.acorda, '07:00', 'a Ana não é mexida');
}


/* ---- terça e sexta: estágio de manhã, café lá, almoço na faculdade ---- */
{
  const p = D.novoPerfil('Pedro');
  p.modo = 'aula';
  p.cfg.acorda = '06:00';
  p.cfg.trajetoEstagio = 50;
  p.listas.turnos = [
    { id: 'a', nome: 'Estágio', dias: [0, 2, 3], inicio: '12:00', fim: '18:00' },
    { id: 'b', nome: 'Estágio', dias: [1], inicio: '07:00', fim: '13:00' },
    { id: 'c', nome: 'Estágio', dias: [4], inicio: '08:00', fim: '13:00' },
  ];
  p.listas.materias = [{ id: 'm', nome: 'Redes', dias: [1, 4], inicio: '14:00', fim: '17:30' }];
  p.listas.habitos = [{ id: 's', pilar: 'fac', nome: 'Sai pra faculdade', hora: '08:00', dias: [0, 1, 2, 3, 4], modo: 'aula', ancora: 'aula', antes: 30 }];
  const { refeicoes } = Di.importarPlanoDieta({ refeicoes: [
    { grupo: 'cafe', nome: 'Café da manhã', hora: '07:20', ondeAula: 'estagio' },
    { grupo: 'almoco', nome: 'Almoço 1', hora: '12:00', ondeAula: 'faculdade' },
    { grupo: 'almoco', nome: 'Almoço 2', hora: '12:00', ondeAula: 'faculdade' },
    { grupo: 'jantar', nome: 'Jantar', hora: '22:00' },
  ] });
  p.listas.refeicoes = refeicoes;
  const g = Di.gruposDeRefeicao(refeicoes);
  const seg = D.maisDias(hoje, -D.diaIdx(hoje));
  const linha = d => D.linhaDoDia(p, D.maisDias(seg, d), g).itens;
  const ach = (l, nome) => l.find(i => i.nome === nome);

  const ter = linha(1);
  assert.equal(ach(ter, 'Café da manhã').hora, '07:30');
  assert.equal(ach(ter, 'Café da manhã').onde, 'no estágio');
  assert.equal(ach(ter, 'Sai pra faculdade').hora, '13:00', 'sai direto do estágio');
  assert.ok(ach(ter, 'Sai pra faculdade').direto);
  assert.equal(ach(ter, 'Sai pra faculdade').choque, null, 'sair na hora que o estágio acaba não é choque');
  assert.equal(ach(ter, 'Almoço').hora, '13:30');
  assert.equal(ach(ter, 'Almoço').onde, 'na faculdade');
  assert.deepEqual(ter.map(i => i.nome).slice(0, 7),
    ['Acorda', 'Sai pro estágio', 'Estágio', 'Café da manhã', 'Sai pra faculdade', 'Almoço', 'Redes']);
  assert.equal(ach(ter, 'Sai pro estágio').hora, '06:10', 'ônibus de 50 min pro estágio das 7h');
  assert.equal(D.emHora(ter[0].cedo.sugestao), '05:25', 'terça: acordar às 6 não dá, sugere 5h25');

  const sex = linha(4);
  assert.equal(ach(sex, 'Café da manhã').hora, '08:30');
  assert.equal(ach(sex, 'Almoço').hora, '13:30');
  assert.equal(ach(sex, 'Sai pro estágio').hora, '07:10');
  assert.equal(sex[0].cedo, null, 'sexta: sai 7h10, acordando às 6 dá tempo');
  assert.equal(ach(linha(0), 'Sai pro estágio').hora, '11:10');
  const comHabito = { ...p, listas: { ...p.listas, habitos: [...p.listas.habitos,
    { id: 'se', pilar: 'est', nome: 'Peguei o ônibus', ancora: 'estagio', antes: 55 }] } };
  assert.ok(!ach(D.linhaDoDia(comHabito, D.maisDias(seg, 2), g).itens, 'Sai pro estágio'),
    'hábito preso ao estágio substitui a saída automática');

  const qua = linha(2);
  assert.equal(ach(qua, 'Café da manhã').hora, '07:20', 'dia sem aula: horário de sempre');
  assert.equal(ach(qua, 'Café da manhã').onde, null);
  assert.equal(ach(qua, 'Almoço').hora, '12:00');
  assert.ok(!ach(qua, 'Sai pra faculdade'));

  // o pedido chega no perfil já salvo, sem desfazer o que foi escolhido na mão
  const salvo = { ...D.novoPerfil('Pedro'), aplicados: ['acorda-0600'],
    listas: { ...p.listas, refeicoes: refeicoes.map(r => (r.grupo === 'almoco' ? r : { ...r, ondeAula: undefined }))
      .map(({ ondeAula, ...r }) => (r.grupo === 'jantar' ? { ...r, ondeAula: '' } : r)) } };
  const mig = D.aplicarPedidos('pedro', salvo);
  assert.equal(mig.listas.refeicoes.find(r => r.grupo === 'cafe').ondeAula, 'estagio');
  assert.equal(mig.listas.refeicoes.find(r => r.grupo === 'jantar').ondeAula, '');
}


/* ---- 10 min até o ponto + 50 de ônibus ---- */
{
  const ja50 = { ...D.novoPerfil('Pedro'), aplicados: ['acorda-0600', 'trajeto-onibus', 'refeicoes-dia-de-aula'],
    cfg: { ...D.CFG_PADRAO, acorda: '06:00', trajetoEstagio: 50 } };
  const p = D.aplicarPedidos('pedro', ja50);
  assert.equal(p.cfg.trajetoEstagio, 60);
  p.listas.turnos = [{ id: 'b', nome: 'Estágio', dias: [1], inicio: '07:00', fim: '13:00' },
    { id: 'c', nome: 'Estágio', dias: [4], inicio: '08:00', fim: '13:00' }];
  const seg = D.maisDias(hoje, -D.diaIdx(hoje));
  const ter = D.linhaDoDia({ ...p, acordaDia: {} }, D.maisDias(seg, 1)).itens;
  assert.equal(ter.find(i => i.tipo === 'saida').hora, '06:00');
  assert.equal(D.emHora(ter[0].cedo.sugestao), '05:15', 'acordando 6h na terça, avisa e sugere 5h15');
  const sex = D.linhaDoDia(p, D.maisDias(seg, 4)).itens;
  assert.equal(sex.find(i => i.tipo === 'saida').hora, '07:00');
  assert.equal(sex[0].cedo, null, 'sexta: acorda 6h, sai 7h, dá tempo');
}


/* ---- faculdade na cidade de casa: estágio → faculdade é o ônibus de volta ---- */
{
  const p = D.aplicarPedidos('pedro', { ...D.novoPerfil('Pedro'),
    aplicados: ['acorda-0600', 'trajeto-onibus', 'refeicoes-dia-de-aula', 'trajeto-ate-o-ponto'] });
  assert.equal(p.cfg.trajetoEstagioFac, 60);
  p.modo = 'aula';
  p.listas.turnos = [{ id: 'b', nome: 'Estágio', dias: [1], inicio: '07:00', fim: '13:00' }];
  p.listas.habitos = [{ id: 's', pilar: 'fac', nome: 'Sai pra faculdade', dias: [], ancora: 'aula', antes: 30 }];
  const { refeicoes } = Di.importarPlanoDieta({ refeicoes: [
    { grupo: 'almoco', nome: 'Almoço', hora: '12:00', ondeAula: 'faculdade' }] });
  const g = Di.gruposDeRefeicao(refeicoes);
  const ter = D.maisDias(D.maisDias(hoje, -D.diaIdx(hoje)), 1);
  const com = aula => {
    p.listas.materias = [{ id: 'm', nome: 'Redes', dias: [1], inicio: aula, fim: '17:30' }];
    const it = D.linhaDoDia(p, ter, g).itens;
    return { sai: it.find(i => i.nome === 'Sai pra faculdade'), alm: it.find(i => i.nome === 'Almoço') };
  };
  let r = com('14:00');
  assert.equal(r.sai.hora, '13:00');
  assert.equal(D.emHora(r.sai.chegada), '14:00');
  assert.equal(r.sai.atraso, false, 'chega na hora exata');
  assert.equal(r.alm.hora, '14:00');
  assert.ok(r.alm.aperto, 'chega às 14h com aula às 14h: não dá pra almoçar lá');
  r = com('13:30');
  assert.equal(r.sai.atraso, true, 'aula 13h30 e chega 14h: atrasado');
  r = com('14:30');
  assert.equal(r.alm.aperto, null, 'meia hora de folga dá pra almoçar');
  // em branco (ou zerado em Ajustes) usa o trajeto de casa
  assert.equal(D.trajetoEstagioFac({ cfg: { trajetoEstagioFac: '', trajetoFaculdade: 25 } }), 25);
  assert.equal(D.trajetoEstagioFac({ cfg: { trajetoEstagioFac: 0, trajetoFaculdade: 25 } }), 25);
}


/* ---- lanche da manhã no estágio, terça e sexta ---- */
{
  const antes = { ...D.novoPerfil('Pedro'), aplicados: ['acorda-0600', 'trajeto-onibus', 'refeicoes-dia-de-aula',
    'trajeto-ate-o-ponto', 'faculdade-na-minha-cidade'] };
  antes.listas.habitos = [{ id: 'x', pilar: 'diet', nome: 'Lanche da tarde', hora: '16:00' }];
  const p = D.aplicarPedidos('pedro', antes);
  const l = p.listas.habitos.find(h => h.nome === 'Lanche da manhã no estágio');
  assert.ok(l && l.id, 'entra com id');
  assert.deepEqual(l.dias, [1, 4]);
  assert.equal(p.listas.habitos.length, 2, 'não mexe nos outros');
  assert.equal(D.aplicarPedidos('pedro', p), p, 'roda uma vez só');
  const seg = D.maisDias(hoje, -D.diaIdx(hoje));
  assert.ok(D.habitosDoDia(p, D.maisDias(seg, 1)).includes(l));
  assert.ok(!D.habitosDoDia(p, D.maisDias(seg, 2)).includes(l), 'quarta não tem');
  const jaTinha = { ...antes, listas: { ...antes.listas, habitos: [{ id: 'y', pilar: 'diet', nome: 'Lanche da manhã no estágio', hora: '10:00' }] } };
  assert.equal(D.aplicarPedidos('pedro', jaTinha).listas.habitos.length, 1, 'não duplica');
}


/* ---- acordar diferente na terça ---- */
{
  const p = D.aplicarPedidos('pedro', { ...D.novoPerfil('Pedro'),
    aplicados: ['acorda-0600', 'trajeto-onibus', 'refeicoes-dia-de-aula', 'trajeto-ate-o-ponto',
      'faculdade-na-minha-cidade', 'lanche-manha-estagio'],
    cfg: { ...D.CFG_PADRAO, acorda: '06:00', trajetoEstagio: 60 } });
  assert.deepEqual(p.acordaDia, { 1: '05:15' });
  const seg = D.maisDias(hoje, -D.diaIdx(hoje));
  const ter = D.maisDias(seg, 1), qua = D.maisDias(seg, 2);
  assert.equal(D.emHora(D.acordaMin(p, ter)), '05:15');
  assert.equal(D.emHora(D.acordaMin(p, qua)), '06:00');
  assert.equal(D.emHora(D.dormeMin(p, seg)), '21:15', 'segunda dorme cedo pra terça');
  assert.equal(D.emHora(D.dormeMin(p, ter)), '22:00');
  assert.equal(D.emHora(D.acordaMin(p)), '06:00', 'sem dia, vale o de todo dia');
  p.listas.turnos = [{ id: 'b', nome: 'Estágio', dias: [1], inicio: '07:00', fim: '13:00' }];
  const lt = D.linhaDoDia(p, ter).itens;
  assert.equal(lt[0].hora, '05:15');
  assert.equal(lt[0].cedo, null, 'acordando 5h15 sobram 45 min até sair às 6h');
  assert.equal(D.linhaDoDia(p, seg).itens.at(-1).hora, '21:15');
  // agora: terça 5h30 é depois de acordar, não madrugada de segunda
  const as530 = new Date(ter + 'T05:30:00');
  assert.equal(lt[D.itemDeAgora(p, lt, as530)].nome, 'Acorda');
}


/* ---- revisão: correções ---- */
{
  // 1. começar a marcar refeição não derruba a sequência de antes
  const p = D.novoPerfil('Seq');
  p.listas.habitos = [{ id: 'a', pilar: 'gym', nome: 'A' }, { id: 'b', pilar: 'fac', nome: 'B' }];
  p.listas.refeicoes = [{ id: 'r1', grupo: 'cafe', nome: 'Café' }, { id: 'r2', grupo: 'alm', nome: 'Almoço' }];
  p.dias = {};
  for (let i = 1; i <= 10; i++) p.dias[D.maisDias(hoje, -i)] = { a: 'sim', b: 'sim' };
  assert.equal(D.sequencia(p), 10, 'sem refeição marcada nunca, só hábito conta');
  p.extra = { [D.maisDias(hoje, -1)]: { rfr1: true, rfr2: true } };
  assert.equal(D.sequencia(p), 10, 'passar a marcar refeição ontem não apaga os 9 dias antes');
  p.extra = { [D.maisDias(hoje, -1)]: { rfr1: true } };   // ontem: 2 hábitos + 1 de 2 refeições = 75%
  assert.equal(D.sequencia(p), 10);
  assert.equal(D.refeicoesDesde(p), D.maisDias(hoje, -1));
  assert.equal(D.contaveisDoDia(p, D.maisDias(hoje, -2)).itens.length, 2, 'antes do primeiro dia de refeição');
  assert.equal(D.contaveisDoDia(p, hoje).itens.length, 4);

  // 2. apagar o perfil não traz os pedidos de volta na próxima abertura
  const zerado = D.perfilApagado('pedro', 'Pedro');
  assert.equal(D.aplicarPedidos('pedro', zerado), zerado);
  assert.equal(zerado.listas.habitos.length, 0);

  // 6. backup antigo restaurado passa pela mesma migração
  const velho = { ritmo_backup: D.VERSAO_BACKUP, perfil: 'ana', nome: 'Ana',
    estado: { nome: 'Ana', listas: { habitos: [{ id: 'f', pilar: 'fac', nome: 'Sai pra faculdade', hora: '08:00' }] } } };
  const rest = D.deBackup(velho);
  assert.equal(rest.listas.habitos[0].ancora, 'aula');
  assert.deepEqual(rest.acordaDia, {});
  assert.ok(Array.isArray(rest.listas.turnos));

  // 4. refeição sem horário aparece pra marcar
  const ps = D.novoPerfil('SemHora');
  const g = Di.gruposDeRefeicao([{ id: 'x', grupo: 'ceia', nome: 'Ceia' }]);
  assert.equal(D.linhaDoDia(ps, hoje, g).refeicoesSemHora.length, 1);

  // 5. a saída que o aviso usa é a do hábito que já marca a saída
  const pc = D.novoPerfil('Saida');
  pc.cfg.acorda = '13:00';
  pc.cfg.trajetoFaculdade = 50;
  pc.listas.materias = [{ id: 'm', nome: 'Redes', dias: [0, 1, 2, 3, 4, 5, 6], inicio: '14:00', fim: '17:00' }];
  pc.listas.habitos = [{ id: 's', pilar: 'fac', nome: 'Sai pra faculdade', ancora: 'aula', antes: 30, dias: [] }];
  const l = D.linhaDoDia(pc, hoje).itens;
  assert.equal(l.find(i => i.id === 's').hora, '13:30');
  assert.equal(D.emHora(l[0].cedo.saida), '13:30', 'o aviso usa 13:30, não 13:10');

  // 7. trajeto em branco usa o padrão, não zero
  assert.equal(D.trajeto({ cfg: { trajetoEstagio: '' } }, 'estagio'), 30);
  assert.ok(D.CFG_OPCIONAL.includes('trajetoEstagioFac'));

  // 8. o cache dos blocos acompanha a lista e o modo
  const pb = D.novoPerfil('Cache');
  pb.listas.materias = [{ id: 'm', nome: 'X', dias: [0], inicio: '08:00', fim: '10:00' }];
  assert.equal(D.blocosDoDia(pb, 0).length, 1);
  assert.equal(D.blocosDoDia({ ...pb, modo: 'ferias' }, 0).length, 0, 'mudar o modo não reaproveita o cache');
  const pb2 = D.comItem(pb, 'materias', { nome: 'Y', dias: [0], inicio: '10:00', fim: '11:00' });
  assert.equal(D.blocosDoDia(pb2, 0).length, 2, 'lista nova, conta nova');
}


/* ---- hora real e hora do toque ---- */
{
  const agora = new Date(hoje + 'T10:42:00');
  let ex = D.comMarcaDeHora({}, hoje, 'h1', true, agora);
  assert.equal(ex[hoje].t.h1, '10:42', 'toque de hoje guarda a hora');
  assert.equal(D.comMarcaDeHora(ex, D.maisDias(hoje, -1), 'h1', true, agora), ex, 'dia passado não inventa hora');
  ex = D.comMarcaDeHora(ex, hoje, 'h1', false, agora);
  assert.equal(ex[hoje].t.h1, undefined, 'desmarcar apaga a hora');

  const p = D.novoPerfil('Hora');
  p.extra = D.comHoraReal({}, hoje, 'acorda', '6:12', 6 * 60);
  assert.deepEqual(D.horaReal(p, hoje, 'acorda'), { real: '06:12', plano: '06:00' });
  assert.equal(D.desvio({ real: '00:30', plano: '22:00' }), 150, 'dormir depois da meia-noite');
  assert.equal(D.desvio({ real: '21:50', plano: '22:00' }), -10);
  p.extra = D.comHoraReal(p.extra, D.maisDias(hoje, -1), 'acorda', '06:05', 6 * 60);
  p.extra = D.comHoraReal(p.extra, D.maisDias(hoje, -2), 'acorda', '06:40', 6 * 60);
  const r = D.resumoHoras(p, 'acorda');
  assert.deepEqual([r.anotados, r.noHorario, r.medio], [3, 1, Math.round((12 + 5 + 40) / 3)]);
  assert.equal(D.resumoHoras(p, 'dorme'), null, 'sem anotação, sem resumo');
  p.extra = D.comHoraReal(p.extra, hoje, 'acorda', null, 0);
  assert.equal(D.horaReal(p, hoje, 'acorda'), null, 'apagar a hora tira o registro');
  // marcar refeição continua contando com o mapa de horas no mesmo dia
  p.listas.refeicoes = [{ id: 'r', grupo: 'c', nome: 'Café' }];
  p.extra[hoje] = { ...p.extra[hoje], rfr: true, t: { rfr: '07:30' } };
  assert.equal(D.macrosDoDia(p).feitas, 1);
  assert.equal(D.marcadoAs(p, hoje, 'rfr'), '07:30');

  const pe = D.novoPerfil('Saida');
  pe.cfg.trajetoEstagio = 60;
  pe.listas.turnos = [{ id: 'e', nome: 'E', dias: [0, 1, 2, 3, 4, 5, 6], inicio: '07:00', fim: '13:00' }];
  assert.equal(D.emHora(D.saidaPlanejada(pe, hoje)), '06:00');
}


/* ---- boneco de cada exercício do plano ---- */
{
  const { FIGURES, figSvg } = await import('./figuras.js');
  const FIG = (await import('./figuras-opengym.json', { with: { type: 'json' } })).default;
  const NOMES = (await import('./nomes-opengym.json', { with: { type: 'json' } })).default;
  for (const [id, k] of Object.entries(FIG)) {
    if (id === '_') continue;
    assert.ok(FIGURES[k], `${id} aponta pra um boneco que existe (${k})`);
    assert.ok(NOMES[id] || id.startsWith('vac-'), `${id} é um exercício conhecido`);
    assert.ok(figSvg(k).startsWith('<svg'), `${k} desenha`);
  }
  const plano = (await import('./plano-treino.json', { with: { type: 'json' } })).default;
  const ids = new Set(plano.routines.flatMap(r => r.ex.map(e => e.id)));
  const sem = [...ids].filter(id => !FIG[id]);
  assert.deepEqual(sem, ['2188'], 'só o tríceps francês fica sem boneco');
  assert.ok(figSvg('squat').includes('<animate'), 'anima');
  assert.ok(!figSvg('squat', true).includes('<animate'), 'parado não anima');
}

console.log('ok — todas as regras do Ritmo passaram');
