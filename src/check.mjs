/* Check das regras do Ritmo: rotina, sequência, ciclo, dieta, estágio,
   dinheiro, metas e o CRUD das listas. `npm run check`. Sem framework. */
import assert from 'node:assert/strict';
import * as D from './store.js';

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
for (const chave of Object.keys(D.SCHEMAS)) {
  assert.ok(D.SCHEMAS[chave].um, `esquema ${chave} sem nome no singular`);
  assert.ok(D.SCHEMAS[chave].campos.length > 0, `esquema ${chave} sem campo`);
}

console.log('ok — todas as regras do Ritmo passaram');
