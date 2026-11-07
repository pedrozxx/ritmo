/* Check mínimo das regras do Ritmo: rotina, sequência, ciclo de 90 dias,
   dieta e dinheiro. Roda com `npm run check`. Sem framework de propósito. */
import assert from 'node:assert/strict';
import {
  pctDia, pctPilar, sequencia, semana, semanaPilar, aderenciaPilar,
  ciclo, faseDoDia, aderencia, semanasDoCiclo, CICLO_DIAS,
  macrosDoDia, REFEICOES, caixa, porCategoria, doMes, valorDigitado, progresso,
  maisDias, diasEntre, iso, rotuloData, dataCurta,
  HABITOS, PILARES, pilar, semente, vazio,
} from './store.js';

const hoje = iso();
const todosSim = Object.fromEntries(HABITOS.map(h => [h.id, 'sim']));

/* estrutura: ids de hábito têm que ser únicos, senão o registro do dia se atropela */
assert.equal(PILARES.length, 5);
assert.equal(HABITOS.length, 12);
assert.equal(new Set(HABITOS.map(h => h.id)).size, HABITOS.length, 'id de hábito repetido');
assert.ok(PILARES.every(p => p.itens.length > 0));

/* pctDia só conta "sim" — "nao" e pendente valem zero */
assert.equal(pctDia({ a: 'sim', b: 'nao', c: null, d: 'sim' }, 4), 50);
assert.equal(pctDia(undefined), 0);
assert.equal(pctDia(todosSim), 100);
assert.equal(pctPilar(todosSim, PILARES[0]), 100);
assert.equal(pctPilar({ aulas: 'sim', estudo: 'nao' }, PILARES[0]), 33);
assert.equal(pctPilar(undefined, PILARES[0]), 0);

/* sequência: hoje em aberto não quebra, mas um dia ruim atrás quebra */
const dias = {};
for (let i = 1; i <= 5; i++) dias[maisDias(hoje, -i)] = { ...todosSim };
assert.equal(sequencia(dias, 70, hoje), 5, 'hoje vazio não deve zerar a sequência');
dias[hoje] = { ...todosSim };
assert.equal(sequencia(dias, 70, hoje), 6, 'hoje completo soma');
dias[maisDias(hoje, -3)] = { aulas: 'sim' };            // 8% → abaixo da meta
assert.equal(sequencia(dias, 70, hoje), 3, 'a sequência para no primeiro dia ruim');
assert.equal(sequencia({}, 70, hoje), 0);

/* semana: 7 dias, segunda primeiro, um só "hoje" */
const s7 = semana(dias, hoje);
assert.equal(s7.length, 7);
assert.equal(s7.filter(d => d.hoje).length, 1);
assert.equal(s7[0].nome, 'SEG');
assert.ok(s7.every((d, i) => i === 0 || d.k > s7[i - 1].k), 'dias em ordem');
assert.ok(!s7.find(d => d.hoje).futuro);
assert.equal(semanaPilar(dias, pilar('diet'), hoje).length, 7);

/* datas atravessando mês e ano */
assert.equal(maisDias('2026-03-01', -1), '2026-02-28');
assert.equal(maisDias('2026-01-01', -1), '2025-12-31');
assert.equal(maisDias('2024-03-01', -1), '2024-02-29', 'ano bissexto');
assert.equal(diasEntre('2026-01-01', '2026-01-31'), 30);
assert.equal(diasEntre('2026-02-28', '2026-03-01'), 1);
assert.equal(dataCurta('2026-11-06'), '06/11');
assert.equal(rotuloData(hoje, hoje), 'Hoje');
assert.equal(rotuloData(maisDias(hoje, -1), hoje), 'Ontem');

/* ---- ciclo de 90 dias ---- */
assert.equal(faseDoDia(1).id, 'base');
assert.equal(faseDoDia(30).id, 'base');
assert.equal(faseDoDia(31).id, 'ritmo');
assert.equal(faseDoDia(60).id, 'ritmo');
assert.equal(faseDoDia(61).id, 'pico');
assert.equal(faseDoDia(90).id, 'pico');

const noCiclo = { ...semente(), cicloInicio: maisDias(hoje, -11), dias };
const c = ciclo(noCiclo, hoje);
assert.equal(c.dia, 12, 'começou 11 dias atrás → hoje é o dia 12');
assert.equal(c.semana, 2);
assert.equal(c.fase.id, 'base');
assert.equal(c.restam, CICLO_DIAS - 12);
assert.equal(c.terminou, false);
assert.equal(ciclo({ cicloInicio: maisDias(hoje, -30) }, hoje).fase.id, 'ritmo');
assert.equal(ciclo({ cicloInicio: maisDias(hoje, -60) }, hoje).fase.id, 'pico');

const fechado = ciclo({ cicloInicio: maisDias(hoje, -95) }, hoje);
assert.ok(fechado.terminou, 'passado de 90 dias o ciclo fecha');
assert.equal(fechado.dia, CICLO_DIAS, 'o dia não passa de 90');
assert.equal(fechado.restam, 0);
assert.equal(ciclo({ cicloInicio: maisDias(hoje, 5) }, hoje).dia, 1, 'ciclo no futuro mostra o dia 1');

/* aderência: só os dias já vividos entram na conta */
const ad = aderencia(noCiclo, hoje);
assert.equal(ad.contados, 12);
assert.equal(ad.bons, 5, 'hoje, -1, -2, -4 e -5 bateram a meta');
assert.equal(ad.pct, 42);
assert.equal(aderencia({ cicloInicio: hoje, dias: {} }, hoje).pct, 0);

const ws = semanasDoCiclo(noCiclo, hoje);
assert.equal(ws.length, 13);
assert.equal(ws.filter(w => w.atual).length, 1);
assert.equal(ws[0].contados, 7, 'a primeira semana do ciclo já passou inteira');
assert.equal(ws[1].contados, 5, 'a semana atual conta só até hoje');
assert.equal(ws[2].pct, null, 'semana futura não tem número');

/* ---- dieta ---- */
const comDieta = { ...semente(), extra: { [hoje]: { rf0: true, rf2: true, agua: 4 } } };
const m = macrosDoDia(comDieta, hoje);
assert.equal(m.feitas, 2);
assert.equal(m.total, REFEICOES.length);
assert.equal(m.prot, REFEICOES[0].prot + REFEICOES[2].prot);
assert.equal(m.kcal, REFEICOES[0].kcal + REFEICOES[2].kcal);
assert.equal(m.agua, 4);
const semNada = macrosDoDia({ extra: {} }, hoje);
assert.equal(semNada.prot, 0);
assert.equal(semNada.agua, 0);
assert.ok(REFEICOES.reduce((t, r) => t + r.prot, 0) >= 170, 'o plano de refeições tem que bater a meta de proteína');

const d7 = aderenciaPilar(dias, pilar('diet'), 7, hoje);
assert.equal(d7.bons, 5);
assert.equal(d7.pct, 71);

/* ---- dinheiro: o saldo tem que fechar com entradas − saídas ---- */
const tx = [
  { data: hoje, cat: 'Lazer', v: -48 },
  { data: hoje, cat: 'Renda', v: 1200 },
  { data: hoje, cat: 'Lazer', v: -2.5 },
  { data: '2020-01-05', cat: 'Lazer', v: -999 },
];
const cx = caixa(doMes(tx, hoje));
assert.equal(cx.entradas, 1200);
assert.equal(cx.saidas, 50.5);
assert.equal(cx.saldo, 1149.5);
assert.equal(doMes(tx, hoje).length, 3, 'mês antigo fica fora');
assert.deepEqual(porCategoria(doMes(tx, hoje)), [['Lazer', 50.5]], 'entrada não entra no gasto por categoria');

/* valor digitado: aceita o formato brasileiro e recusa lixo */
assert.equal(valorDigitado('45,90'), 45.9);
assert.equal(valorDigitado('1.250,00'), 1250);
assert.equal(valorDigitado(' R$ 8 '), 8);
assert.ok(Number.isNaN(valorDigitado('')));
assert.ok(Number.isNaN(valorDigitado('abc')));
assert.ok(Number.isNaN(valorDigitado('-5')));
assert.ok(Number.isNaN(valorDigitado('1,2,3')));

/* ---- metas: as automáticas leem os dados de verdade ---- */
const base = { ...semente(), dias, tx: doMes(tx, hoje), extra: comDieta.extra };
assert.equal(progresso({ tipo: 'saldo' }, base).p, 100);
assert.equal(progresso({ tipo: 'saldo' }, { ...base, tx: [{ data: hoje, cat: 'Lazer', v: -10 }] }).p, 0);
assert.ok(progresso({ tipo: 'treinos', alvo: 20 }, base).p > 0, 'treinos do mês saem do histórico');
assert.equal(progresso({ tipo: 'proteina', alvo: 100 }, base).p, 80);
assert.equal(progresso({ tipo: 'dieta', alvo: 86 }, base).p, 83);
assert.equal(progresso({ tipo: 'manual', valor: 81, alvo: 80, sub: 'x' }, base).p, 100, 'progresso não passa de 100%');

/* toda meta de fábrica tem que estar ancorada numa fase existente e calcular */
for (const meta of semente().metas) {
  assert.ok(faseDoDia(1) && ['base', 'ritmo', 'pico'].includes(meta.fase), `meta ${meta.id} sem fase válida`);
  const r = progresso(meta, base);
  assert.ok(r.p >= 0 && r.p <= 100, `meta ${meta.id} com progresso fora de 0–100`);
  assert.ok(typeof r.sub === 'string' && r.sub.length > 0, `meta ${meta.id} sem legenda`);
}

/* estado zerado não explode em lugar nenhum */
const z = vazio();
assert.equal(sequencia(z.dias), 0);
assert.equal(aderencia(z).contados, 1, 'o ciclo zerado começa hoje');
assert.equal(macrosDoDia(z).prot, 0);
assert.equal(caixa(z.tx).saldo, 0);

console.log('ok — todas as regras do Ritmo passaram');
