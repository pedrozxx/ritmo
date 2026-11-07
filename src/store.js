/* Ritmo — dados e regras.
   Dois perfis (Pedro e Ana), cada um com o próprio estado no localStorage.
   Tudo aqui em cima é função pura (`npm run check`); o storage fica no fim. */

/* ---- o percurso: 90 dias em 3 fases de 30 ---- */
export const CICLO_DIAS = 90;
export const FASES = [
  { id: 'base',  nome: 'Base',  de: 1,  ate: 30, lema: 'Criar o hábito',
    foco: 'Aparecer todo dia, mesmo no mínimo. Frequência vale mais que intensidade.' },
  { id: 'ritmo', nome: 'Ritmo', de: 31, ate: 60, lema: 'Subir a carga',
    foco: 'Volume no treino, dieta fechada na semana e gasto sob controle.' },
  { id: 'pico',  nome: 'Pico',  de: 61, ate: 90, lema: 'Fechar forte',
    foco: 'Provas, meta de grana e o melhor shape do ciclo.' },
];

/* ---- os 5 pilares são a estrutura do app (cada um tem sua tela).
   Os hábitos dentro deles são cadastrados por quem usa. ---- */
export const PILARES = [
  { id: 'fac',  nome: 'Faculdade',  icon: 'fac' },
  { id: 'gym',  nome: 'Academia',   icon: 'gym' },
  { id: 'diet', nome: 'Dieta',      icon: 'diet' },
  { id: 'est',  nome: 'Estágio',    icon: 'est' },
  { id: 'fin',  nome: 'Financeiro', icon: 'fin' },
];
export const pilar = id => PILARES.find(p => p.id === id);
export const PERFIS = [{ id: 'pedro', nome: 'Pedro' }, { id: 'ana', nome: 'Ana' }];
export const DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

/* ---- o que dá pra cadastrar, e com quais campos ----
   Um esquema por lista; o editor genérico monta o formulário a partir daqui. */
export const SCHEMAS = {
  habitos: { um: 'hábito', campos: [
    { k: 'nome', rot: 'O que é', tipo: 'texto', obrig: true, dica: 'Fui pra academia' },
    { k: 'meta', rot: 'Detalhe', tipo: 'texto', dica: 'Push B às 18h' },
    { k: 'hora', rot: 'Horário', tipo: 'texto', dica: '18:00 — só pra exportar pro calendário' },
    { k: 'dias', rot: 'Em que dias', tipo: 'dias' },
    { k: 'modo', rot: 'Em qual semana', tipo: 'escolha', padrao: '',
      ops: [['', 'Nas duas'], ['aula', 'Só com aula'], ['ferias', 'Só sem aula']] },
  ]},
  refeicoes: { um: 'refeição', campos: [
    { k: 'nome', rot: 'Refeição', tipo: 'texto', obrig: true, dica: 'Almoço' },
    { k: 'hora', rot: 'Horário', tipo: 'texto', dica: '12h30' },
    { k: 'o', rot: 'O que tem', tipo: 'texto', dica: '180 g de frango, arroz e salada' },
    { k: 'prot', rot: 'Proteína em gramas', tipo: 'numero' },
    { k: 'kcal', rot: 'Calorias', tipo: 'numero' },
  ]},
  exercicios: { um: 'exercício', campos: [
    { k: 'nome', rot: 'Exercício', tipo: 'texto', obrig: true, dica: 'Supino inclinado' },
    { k: 'meta', rot: 'Séries e carga', tipo: 'texto', dica: '4 × 8 com 32 kg' },
  ]},
  materias: { um: 'matéria', campos: [
    { k: 'nome', rot: 'Matéria', tipo: 'texto', obrig: true, dica: 'Cálculo III' },
    { k: 'meta', rot: 'Detalhe', tipo: 'texto', dica: 'Segunda e quarta, 19h10' },
    { k: 'nota', rot: 'Nota parcial', tipo: 'numero' },
  ]},
  entregas: { um: 'entrega', campos: [
    { k: 'nome', rot: 'O que é', tipo: 'texto', obrig: true, dica: 'Prova 2 de Banco de Dados' },
    { k: 'meta', rot: 'Detalhe', tipo: 'texto', dica: 'Sala B204' },
    { k: 'data', rot: 'Quando', tipo: 'data', obrig: true },
  ]},
  tarefas: { um: 'tarefa', campos: [
    { k: 'nome', rot: 'Tarefa', tipo: 'texto', obrig: true, dica: 'Review do PR' },
    { k: 'meta', rot: 'Detalhe', tipo: 'texto' },
  ]},
  cats: { um: 'categoria', campos: [
    { k: 'nome', rot: 'Categoria', tipo: 'texto', obrig: true, dica: 'Alimentação' },
  ]},
  split: { um: 'dia da semana', fixo: true, campos: [
    { k: 'meta', rot: 'Treino do dia', tipo: 'texto', dica: 'Push A, Pull B, folga…' },
  ]},
  metas: { um: 'meta', campos: [
    { k: 'nome', rot: 'A meta', tipo: 'texto', obrig: true, dica: 'Treinar 20 vezes no mês' },
    { k: 'fase', rot: 'Fase do ciclo', tipo: 'escolha', padrao: 'base',
      ops: [['base', 'Base'], ['ritmo', 'Ritmo'], ['pico', 'Pico']] },
    { k: 'tipo', rot: 'Como medir', tipo: 'escolha', padrao: 'manual', ops: [
      ['manual', 'Eu atualizo na mão'],
      ['habito', 'Contar um hábito no mês'],
      ['saldo', 'Fechar o mês no positivo'],
      ['dieta', 'Dias de dieta na semana'],
      ['proteina', 'Proteína de hoje'],
    ]},
    { k: 'habitoId', rot: 'Qual hábito contar', tipo: 'habito', so: ['habito'] },
    { k: 'alvo', rot: 'Alvo', tipo: 'numero', so: ['manual', 'habito', 'dieta'], dica: '20' },
    { k: 'valor', rot: 'Onde está hoje', tipo: 'numero', so: ['manual'] },
  ]},
};
export const camposVisiveis = (chave, v) =>
  SCHEMAS[chave].campos.filter(c => !c.so || c.so.includes(v.tipo));

/* ---- datas ---- */
export const iso = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// meio-dia de propósito: imune a horário de verão e a fuso
const emDia = k => new Date(k + 'T12:00:00');
export const maisDias = (k, n) => { const d = emDia(k); d.setDate(d.getDate() + n); return iso(d); };
export const diasEntre = (a, b) => Math.round((emDia(b) - emDia(a)) / 86400000);
export const dataCurta = k => `${String(emDia(k).getDate()).padStart(2, '0')}/${String(emDia(k).getMonth() + 1).padStart(2, '0')}`;

export function dataLonga(k = iso()) {
  const d = emDia(k), s = d.toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '');
  return s.charAt(0).toUpperCase() + s.slice(1) + ', ' + d.getDate() + ' de ' +
    d.toLocaleDateString('pt-BR', { month: 'long' });
}
export function rotuloData(k, ref = iso()) {
  if (k === ref) return 'Hoje';
  if (k === maisDias(ref, -1)) return 'Ontem';
  if (k === maisDias(ref, 1)) return 'Amanhã';
  return dataCurta(k);
}
export function faltam(k, ref = iso()) {
  const n = diasEntre(ref, k);
  if (n < 0) return { n, txt: `${-n} ${-n === 1 ? 'dia' : 'dias'} atrás`, cor: 'neutral' };
  if (n === 0) return { n, txt: 'hoje', cor: 'warn' };
  if (n === 1) return { n, txt: 'amanhã', cor: 'warn' };
  return { n, txt: `${n} dias`, cor: n <= 7 ? 'lilac' : 'neutral' };
}

/* ---- rotina ---- */
export const habitosDo = (s, pilarId) => s.listas.habitos.filter(h => h.pilar === pilarId);

/* Hábito pode valer só em alguns dias e só num modo de semana.
   `dias` usa 0 = SEG … 6 = DOM, igual ao split; vazio quer dizer todo dia.
   `modo` vazio vale nos dois (com aula e sem aula). */
export const MODOS_SEMANA = [['aula', 'Com aula'], ['ferias', 'Sem aula']];
export const diaIdx = k => (emDia(k).getDay() + 6) % 7;

export function valeNoDia(h, s, k) {
  if (h.modo && h.modo !== (s.modo || 'aula')) return false;
  if (!h.dias || !h.dias.length) return true;
  return h.dias.includes(diaIdx(k));
}
export const habitosDoDia = (s, k = iso()) => s.listas.habitos.filter(h => valeNoDia(h, s, k));
export const habitosDoPilarNoDia = (s, pilarId, k = iso()) =>
  habitosDoDia(s, k).filter(h => h.pilar === pilarId);

/* conta só os hábitos que existem hoje: hábito apagado não pode inflar o dia */
export function pctDia(resp, habitos) {
  if (!resp || !habitos || !habitos.length) return 0;
  const sim = habitos.filter(h => resp[h.id] === 'sim').length;
  return Math.round((sim / habitos.length) * 100);
}
export const contar = (resp, habitos, v) =>
  !resp ? 0 : habitos.filter(h => resp[h.id] === v).length;
export function pctPilar(resp, itens) {
  if (!itens || !itens.length) return 0;
  const sim = itens.filter(i => resp && resp[i.id] === 'sim').length;
  return Math.round((sim / itens.length) * 100);
}
export const pctDoDia = (s, k = iso()) => pctDia(s.dias[k], habitosDoDia(s, k));

/* true passou, false não passou, null não havia hábito nenhum marcado pra esse
   dia — nesse caso o dia não soma na sequência e também não a quebra. */
export function diaPassou(s, k, meta = s.cfg.metaDia) {
  const h = habitosDoDia(s, k);
  if (!h.length) return null;
  return pctDia(s.dias[k], h) >= meta;
}

/* O dia de hoje ainda está aberto: enquanto não bate a meta ele não quebra
   a sequência, só não soma. Por isso a contagem começa em ontem. */
export function sequencia(s, ref = iso()) {
  if (!s.listas.habitos.length) return 0;
  let n = diaPassou(s, ref) === true ? 1 : 0;
  let k = maisDias(ref, -1);
  for (let guarda = 0; guarda < 3650; guarda++) {
    const p = diaPassou(s, k);
    if (p === false) break;        // dia ruim corta
    if (p === true) n++;           // dia sem hábito nenhum: atravessa sem somar
    k = maisDias(k, -1);
  }
  return n;
}
export function semana(s, ref = iso()) {
  const seg = maisDias(ref, -((emDia(ref).getDay() + 6) % 7));
  return DIAS_SEMANA.map((nome, i) => {
    const k = maisDias(seg, i);
    return { k, nome, hoje: k === ref, futuro: k > ref, pct: s.dias[k] ? pctDoDia(s, k) : null };
  });
}
export function semanaPilar(s, pilarId, ref = iso()) {
  return semana(s, ref).map(d => ({
    ...d,
    pct: s.dias[d.k] ? pctPilar(s.dias[d.k], habitosDoPilarNoDia(s, pilarId, d.k)) : null,
  }));
}
/* dias do mês em que o pilar teve pelo menos uma resposta "sim" */
export function diasComPilar(s, pilarId, ref = iso()) {
  const itens = habitosDo(s, pilarId);
  if (!itens.length) return 0;
  return Object.entries(s.dias)
    .filter(([k, r]) => k.slice(0, 7) === ref.slice(0, 7) && itens.some(i => r[i.id] === 'sim')).length;
}
export const contarHabito = (s, id, ref = iso()) =>
  Object.entries(s.dias).filter(([k, r]) => k.slice(0, 7) === ref.slice(0, 7) && r[id] === 'sim').length;

/* quantos dos últimos n dias o pilar ficou em pé (75% dele ou mais) */
/* dia em que o pilar não tem hábito nenhum não entra na conta: não é falha */
export function aderenciaPilar(s, pilarId, n = 7, ref = iso()) {
  let bons = 0, contados = 0;
  for (let i = 0; i < n; i++) {
    const k = maisDias(ref, -i);
    const itens = habitosDoPilarNoDia(s, pilarId, k);
    if (!itens.length) continue;
    contados++;
    if (pctPilar(s.dias[k], itens) >= 75) bons++;
  }
  return { bons, n: contados, pct: contados ? Math.round((bons / contados) * 100) : 0 };
}
/* treinos por semana nas últimas n semanas — serve de gráfico sem dado inventado */
export function porSemana(s, pilarId, n = 7, ref = iso()) {
  return Array.from({ length: n }, (_, w) => {
    let dias = 0;
    for (let i = 0; i < 7; i++) {
      const k = maisDias(ref, -((n - 1 - w) * 7 + (6 - i)));
      if (k <= ref && pctPilar(s.dias[k], habitosDoPilarNoDia(s, pilarId, k)) > 0) dias++;
    }
    return dias;
  });
}

/* ---- ciclo de 90 dias ---- */
export const faseDoDia = d => FASES.find(f => d >= f.de && d <= f.ate) || FASES[FASES.length - 1];

export function ciclo(s, ref = iso()) {
  const bruto = diasEntre(s.cicloInicio, ref) + 1;              // 1-based
  const dia = Math.min(CICLO_DIAS, Math.max(1, bruto));
  return {
    dia, bruto,
    fase: faseDoDia(dia),
    semana: Math.min(13, Math.ceil(dia / 7)),
    restam: Math.max(0, CICLO_DIAS - bruto),
    pct: Math.round((dia / CICLO_DIAS) * 100),
    inicio: s.cicloInicio,
    fim: maisDias(s.cicloInicio, CICLO_DIAS - 1),
    terminou: bruto > CICLO_DIAS,
  };
}
export function aderencia(s, ref = iso()) {
  let bons = 0, contados = 0;
  for (let i = 0; i < CICLO_DIAS; i++) {
    const k = maisDias(s.cicloInicio, i);
    if (k > ref) break;
    const p = diaPassou(s, k);
    if (p === null) continue;       // dia sem hábito nenhum não entra na conta
    contados++;
    if (p) bons++;
  }
  return { bons, contados, pct: contados ? Math.round((bons / contados) * 100) : 0 };
}
export function semanasDoCiclo(s, ref = iso()) {
  const atual = ciclo(s, ref).semana;
  return Array.from({ length: 13 }, (_, w) => {
    let bons = 0, contados = 0;
    for (let i = 0; i < 7; i++) {
      const idx = w * 7 + i;
      if (idx >= CICLO_DIAS) break;
      const k = maisDias(s.cicloInicio, idx);
      if (k > ref) break;
      const p = diaPassou(s, k);
      if (p === null) continue;
      contados++;
      if (p) bons++;
    }
    return { semana: w + 1, contados, atual: w + 1 === atual, pct: contados ? Math.round((bons / contados) * 100) : null };
  });
}

/* ---- dinheiro ---- */
export const brl = n => 'R$ ' + Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cent = n => Math.round(n * 100) / 100;

export const doMes = (tx, ref = iso()) => tx.filter(t => t.data.slice(0, 7) === ref.slice(0, 7));
export function caixa(tx) {
  const entradas = cent(tx.filter(t => t.v > 0).reduce((a, t) => a + t.v, 0));
  const saidas = cent(tx.filter(t => t.v < 0).reduce((a, t) => a - t.v, 0));
  return { entradas, saidas, saldo: cent(entradas - saidas) };
}
export function porCategoria(tx) {
  const m = {};
  tx.filter(t => t.v < 0).forEach(t => { m[t.cat] = cent((m[t.cat] || 0) - t.v); });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}
/* "45,90" e "1.250,00" viram número; qualquer outra coisa vira NaN de propósito */
export function valorDigitado(txt) {
  const limpo = String(txt).trim().replace(/\s|R\$/g, '').replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return NaN;
  return cent(Number(limpo));
}

/* ---- marcações do dia que não são hábito (refeições, água, exercícios) ---- */
export const extraDoDia = (s, ref = iso()) => (s.extra && s.extra[ref]) || {};
export function macrosDoDia(s, ref = iso()) {
  const ex = extraDoDia(s, ref);
  let prot = 0, kcal = 0, feitas = 0;
  s.listas.refeicoes.forEach(r => {
    if (ex['rf' + r.id]) { prot += Number(r.prot) || 0; kcal += Number(r.kcal) || 0; feitas++; }
  });
  return { prot, kcal, feitas, total: s.listas.refeicoes.length, agua: ex.agua || 0 };
}
export const horasDoDia = (s, ref = iso()) => Number(extraDoDia(s, ref).horas) || 0;
export function horasDaSemana(s, ref = iso()) {
  return semana(s, ref).map(d => ({ ...d, horas: horasDoDia(s, d.k) }));
}

/* ---- metas ---- */
export function progresso(meta, s) {
  const alvo = Number(meta.alvo) || 0;
  if (meta.tipo === 'habito') {
    const v = contarHabito(s, meta.habitoId);
    const h = s.listas.habitos.find(x => x.id === meta.habitoId);
    if (!h) return { p: 0, sub: 'escolha um hábito pra contar' };
    return { p: alvo ? Math.min(100, Math.round((v / alvo) * 100)) : 0, sub: `${v} de ${alvo} no mês · ${h.nome}` };
  }
  if (meta.tipo === 'saldo') {
    const { saldo } = caixa(doMes(s.tx));
    return { p: saldo >= 0 ? 100 : 0, sub: saldo >= 0 ? `Saldo de ${brl(saldo)}` : `No vermelho em ${brl(saldo)}` };
  }
  if (meta.tipo === 'dieta') {
    const d = aderenciaPilar(s, 'diet');
    return { p: alvo ? Math.min(100, Math.round((d.pct / alvo) * 100)) : 0, sub: `${d.bons} de ${d.n} dias na linha` };
  }
  if (meta.tipo === 'proteina') {
    const { prot } = macrosDoDia(s);
    return { p: Math.min(100, Math.round((prot / s.cfg.proteina) * 100)), sub: `${prot} g de ${s.cfg.proteina} g hoje` };
  }
  const valor = Number(meta.valor) || 0;
  return {
    p: alvo ? Math.min(100, Math.round((valor / alvo) * 100)) : 0,
    sub: `${valor.toLocaleString('pt-BR')} de ${alvo.toLocaleString('pt-BR')}`,
  };
}
export const metasDaFase = (s, faseId) => s.listas.metas.filter(m => m.fase === faseId);

/* ---- CRUD genérico das listas ---- */
export const novoId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

export function comItem(s, chave, item) {
  const lista = s.listas[chave] || [];
  const i = lista.findIndex(x => x.id === item.id);
  const nova = i >= 0 ? lista.map(x => (x.id === item.id ? { ...x, ...item } : x)) : [...lista, { ...item, id: item.id || novoId() }];
  return { ...s, listas: { ...s.listas, [chave]: nova } };
}
export function semItem(s, chave, id) {
  return { ...s, listas: { ...s.listas, [chave]: (s.listas[chave] || []).filter(x => x.id !== id) } };
}

/* ---- estado salvo no aparelho, um por perfil ---- */
const CHAVE_PERFIL = 'ritmo:perfil';
const chaveDe = id => `ritmo:v2:${id}`;

export const CFG_PADRAO = {
  metaDia: 70,        // % de "sim" pro dia contar na sequência
  proteina: 150,      // g por dia
  kcal: 2400,
  garrafas: 6,        // copos/garrafas de água por dia
  mlGarrafa: 500,
  horasSemana: 30,    // meta de horas de estágio na semana
};
/* Um perfil nasce vazio: só a estrutura, nenhum dado inventado.
   As categorias de gasto vêm preenchidas porque são genéricas — e dá pra editar. */
export const novoPerfil = nome => ({
  versao: 2,
  nome,
  anim: true,
  tema: 'sistema',
  modo: 'aula',     // semana com aula ou sem aula; muda quais hábitos valem
  joelho: {},       // por dia: 'verde' | 'amarelo' | 'vermelho'
  volta: {},        // critérios de volta ao futebol marcados na mão
  cicloInicio: iso(),
  cfg: { ...CFG_PADRAO },
  dias: {},
  extra: {},
  tx: [],
  listas: {
    habitos: [], refeicoes: [], exercicios: [], materias: [], entregas: [], tarefas: [], metas: [],
    treinos: [],   // rotinas importadas de fora; vazio até alguém importar
    testes: [],    // autotestes de simetria entre as pernas
    cats: ['Alimentação', 'Transporte', 'Academia', 'Faculdade', 'Lazer', 'Renda']
      .map(n => ({ id: novoId(), nome: n })),
    split: DIAS_SEMANA.map(d => ({ id: d.toLowerCase(), nome: d, meta: '', treinoId: '' })),
  },
});

export function carregarPerfil(id) {
  const base = novoPerfil((PERFIS.find(p => p.id === id) || { nome: 'Pedro' }).nome);
  try {
    const bruto = localStorage.getItem(chaveDe(id));
    if (!bruto) return base;
    const s = JSON.parse(bruto);
    return {
      ...base, ...s,
      cfg: { ...base.cfg, ...s.cfg },
      dias: s.dias || {}, extra: s.extra || {}, tx: s.tx || [],
      joelho: s.joelho || {}, volta: s.volta || {}, modo: s.modo || 'aula',
      listas: { ...base.listas, ...s.listas },
    };
  } catch {
    return base;          // storage bloqueado ou JSON corrompido: começa limpo
  }
}
export function salvarPerfil(id, s) {
  try { localStorage.setItem(chaveDe(id), JSON.stringify(s)); } catch { /* aba privada: roda sem salvar */ }
}
export function perfilEscolhido() {
  try { return localStorage.getItem(CHAVE_PERFIL); } catch { return null; }
}
export function escolherPerfil(id) {
  try {
    localStorage.setItem(CHAVE_PERFIL, id);
    localStorage.removeItem('ritmo:v1');   // dados de exemplo da versão anterior
  } catch { /* segue sem salvar */ }
}
