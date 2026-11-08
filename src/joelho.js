/* Ritmo — joelho: semáforo do dia, autotestes de simetria e volta ao futebol.
   As regras vêm do app Volta ao Campo (criacao-rotina, src/js/rules.js) e são
   copiadas de lá, não reinventadas aqui. Tudo função pura; testado em check.mjs. */
import { iso, maisDias, diasEntre } from './store.js';

/** direita precisa chegar a 90% da esquerda */
export const LSI_ALVO = 90;
/** autoteste se repete a cada 28 dias */
export const DIAS_RETESTE = 28;

export const LUZES = [
  ['verde', 'Verde', 'Segue o plano do dia'],
  ['amarelo', 'Amarelo', 'Treina, mas sem impacto e mais leve na perna'],
  ['vermelho', 'Vermelho', 'Só superior: o treino de hoje vira Recuperação'],
];

/* Regra do Volta ao Campo: falseou, dor 5 ou mais, ou inchaço forte = vermelho;
   dor 3 ou mais, ou inchaço leve = amarelo. Sem check não inventa cor. */
export function luzDo(check) {
  if (!check || !check.ok) return null;
  if (check.falseou || Number(check.dor) >= 5 || Number(check.inchaco) === 2) return 'vermelho';
  if (Number(check.dor) >= 3 || Number(check.inchaco) === 1) return 'amarelo';
  return 'verde';
}
export const luzDoDia = (s, k) => {
  const v = (s.joelho || {})[k];
  return typeof v === 'string' ? v : luzDo(v);
};

/* Histórico do semáforo: eu gravava um check por dia e só lia o de hoje.
   Em reabilitação a tendência vale mais que o dia solto. */
export function historico(s, n = 30, ref = iso()) {
  const dias = [];
  for (let i = 0; i < n; i++) {
    const k = maisDias(ref, -i);
    dias.push({ k, luz: luzDoDia(s, k) });
  }
  const conta = { verde: 0, amarelo: 0, vermelho: 0, sem: 0 };
  dias.forEach(d => { conta[d.luz || 'sem']++; });
  const comCheck = n - conta.sem;
  return { dias, ...conta, comCheck, n, pctVerde: comCheck ? Math.round((conta.verde / comCheck) * 100) : null };
}

/** índice de simetria: a direita em % da esquerda */
export const lsi = (direita, esquerda) =>
  Number(esquerda) > 0 ? Math.round((Number(direita) / Number(esquerda)) * 100) : null;

export const AUTOTESTES = [
  { k: 'sts', nome: 'Levantar da cadeira numa perna',
    como: 'Cadeira de altura normal, braços cruzados no peito. Senta e levanta numa perna só até falhar ou perder a técnica (joelho entrando pra dentro, usar impulso). Conta as repetições boas.' },
  { k: 'ponte', nome: 'Ponte numa perna',
    como: 'Deitado, um pé no chão e a outra perna esticada. Sobe o quadril até alinhar e desce encostando no chão, no ritmo de 1 por segundo, até falhar.' },
  { k: 'panturrilha', nome: 'Panturrilha numa perna',
    como: 'Em pé no chão, uma mão na parede só pra equilíbrio. Sobe na ponta do pé o mais alto que der, até falhar.' },
];

export const ultimoTeste = (testes = []) =>
  testes.length ? [...testes].sort((a, b) => (a.data < b.data ? -1 : 1)).at(-1) : null;

/** todos os três autotestes do último registro com a direita em 90% ou mais */
export function simetriaOk(testes = []) {
  const t = ultimoTeste(testes);
  if (!t) return false;
  return AUTOTESTES.every(({ k }) => {
    const par = t[k];
    return !!par && (lsi(par.d, par.e) ?? 0) >= LSI_ALVO;
  });
}

/** o que mostrar por autoteste: o índice e se passou */
export function linhasDoTeste(teste) {
  if (!teste) return [];
  return AUTOTESTES.map(a => {
    const par = teste[a.k];
    const v = par ? lsi(par.d, par.e) : null;
    return { ...a, d: par?.d ?? null, e: par?.e ?? null, lsi: v, ok: v != null && v >= LSI_ALVO };
  });
}

/* Quando toca o próximo autoteste. Sem teste nenhum já está devendo: é o
   primeiro que estabelece a linha de base. */
export function reteste(testes = [], ref = iso()) {
  const u = ultimoTeste(testes);
  if (!u) return { nunca: true, devido: true, ultimo: null, prox: null, faltam: null };
  const prox = maisDias(u.data, DIAS_RETESTE);
  const faltam = diasEntre(ref, prox);
  return { nunca: false, devido: faltam <= 0, ultimo: u.data, prox, faltam };
}

/* Critérios de volta ao futebol. `auto` é calculado; o resto a pessoa marca.
   Copiados do RETURN_CRITERIA do Volta ao Campo. */
export const CRITERIOS = [
  { k: 'run', t: 'Médico liberou corrida leve' },
  { k: 'run25', t: 'Corre 25 min sem parar, sem dor e sem inchaço no dia seguinte' },
  { k: 'self', t: 'Autotestes de casa com a direita a 90% ou mais da esquerda', auto: true,
    sub: 'Calculado pelos seus autotestes' },
  { k: 'quad', t: 'Teste de força do quadríceps com fisio (dinamômetro): 90% ou mais' },
  { k: 'hop', t: 'Testes de salto com fisio: 90% ou mais' },
  { k: 'cod', t: 'Treino de mudança de direção e corte feito sem dor' },
  { k: 'team', t: 'Algumas semanas treinando com bola e com o time, sem contato' },
  { k: 'conf', t: 'Confia no joelho pra girar, frear e dividir bola' },
];

export const criterioFeito = (c, volta = {}, testes = []) =>
  c.auto ? simetriaOk(testes) : !!volta[c.k];

export function voltaAoCampo(volta = {}, testes = []) {
  const feitos = CRITERIOS.filter(c => criterioFeito(c, volta, testes)).length;
  return { feitos, total: CRITERIOS.length, liberado: feitos === CRITERIOS.length };
}
