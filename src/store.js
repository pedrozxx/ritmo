/* Ritmo — dados e regras.
   Tudo aqui em cima é função pura (dá pra testar com `npm run check`).
   O localStorage só aparece no fim do arquivo. */

// % de "sim" que o dia precisa pra contar na sequência.
// ponytail: knob. Se na vida real a sequência quebrar fácil demais, baixa pra 60.
export const META_DIA = 70;

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

/* ---- estrutura da rotina ----
   Pra trocar os hábitos é só mexer nesta lista: o resto do app se ajusta. */
export const PILARES = [
  { id: 'fac', nome: 'Faculdade', icon: 'fac', itens: [
    { id: 'aulas',  nome: 'Assisti todas as aulas',      meta: 'Cálculo III · 19h10' },
    { id: 'estudo', nome: 'Estudei 1h pra prova',        meta: 'Banco de Dados · 12/11' },
    { id: 'lista',  nome: 'Entreguei a lista da semana', meta: 'Lista 7 · vence amanhã' },
  ]},
  { id: 'gym', nome: 'Academia', icon: 'gym', itens: [
    { id: 'treino', nome: 'Fui pra academia', meta: 'Push B · 18h' },
    { id: 'cardio', nome: 'Fiz o cardio',     meta: '20 min de esteira' },
  ]},
  { id: 'diet', nome: 'Dieta', icon: 'diet', itens: [
    { id: 'sem_lixo',  nome: 'Não saí da dieta',   meta: 'Sem fast food nem doce' },
    { id: 'marmita',   nome: 'Levei a marmita',    meta: 'Almoço de casa' },
    { id: 'creatina',  nome: 'Tomei a creatina',   meta: '5 g, qualquer horário' },
  ]},
  { id: 'est', nome: 'Estágio', icon: 'est', itens: [
    { id: 'horas', nome: 'Bati as 6h do dia',          meta: '09h00 às 15h30' },
    { id: 'board', nome: 'Fechei as tarefas do board', meta: '2 cards + review do PR' },
  ]},
  { id: 'fin', nome: 'Financeiro', icon: 'fin', itens: [
    { id: 'gastos', nome: 'Registrei os gastos do dia',  meta: 'Lançamentos de hoje' },
    { id: 'limite', nome: 'Não passei do limite diário', meta: 'Limite de R$ 45,00' },
  ]},
];
export const HABITOS = PILARES.flatMap(p => p.itens.map(i => ({ ...i, pilar: p.id })));
export const pilar = id => PILARES.find(p => p.id === id);
export const CATS = ['Alimentação', 'Transporte', 'Academia', 'Faculdade', 'Lazer', 'Renda'];

/* ---- dieta ---- */
export const META_PROTEINA = 170;
export const META_KCAL = 2600;
export const GARRAFAS = 6;
export const ML_GARRAFA = 500;
export const REFEICOES = [
  { nome: 'Café da manhã',   hora: '07h30', o: '4 ovos, 2 fatias de pão integral, café', prot: 32, kcal: 480 },
  { nome: 'Lanche da manhã', hora: '10h00', o: 'Whey com banana',                        prot: 28, kcal: 240 },
  { nome: 'Almoço',          hora: '12h30', o: '180 g de frango, arroz, feijão, salada',  prot: 48, kcal: 720 },
  { nome: 'Pré-treino',      hora: '17h00', o: 'Pão com pasta de amendoim e café',        prot: 10, kcal: 320 },
  { nome: 'Jantar',          hora: '20h30', o: '200 g de carne moída, batata doce, legumes', prot: 46, kcal: 680 },
  { nome: 'Ceia',            hora: '22h30', o: 'Iogurte natural com granola',             prot: 16, kcal: 220 },
];

/* ---- datas ---- */
export const iso = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// meio-dia de propósito: imune a horário de verão e a fuso
const emDia = k => new Date(k + 'T12:00:00');
export const maisDias = (k, n) => { const d = emDia(k); d.setDate(d.getDate() + n); return iso(d); };
export const diasEntre = (a, b) => Math.round((emDia(b) - emDia(a)) / 86400000);
export const DIAS_SEMANA = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

export function dataLonga(k = iso()) {
  const d = emDia(k), s = d.toLocaleDateString('pt-BR', { weekday: 'long' }).replace('-feira', '');
  return s.charAt(0).toUpperCase() + s.slice(1) + ', ' + d.getDate() + ' de ' +
    d.toLocaleDateString('pt-BR', { month: 'long' });
}
export const dataCurta = k => `${String(emDia(k).getDate()).padStart(2, '0')}/${String(emDia(k).getMonth() + 1).padStart(2, '0')}`;
export function rotuloData(k, ref = iso()) {
  if (k === ref) return 'Hoje';
  if (k === maisDias(ref, -1)) return 'Ontem';
  return dataCurta(k);
}

/* ---- rotina ---- */
export function pctDia(resp, total = HABITOS.length) {
  if (!resp || !total) return 0;
  const sim = Object.values(resp).filter(v => v === 'sim').length;
  return Math.round((sim / total) * 100);
}
export const pctPilar = (resp, p) => {
  const sim = p.itens.filter(i => resp && resp[i.id] === 'sim').length;
  return Math.round((sim / p.itens.length) * 100);
};

/* O dia de hoje ainda está aberto: enquanto não bate a meta ele não quebra
   a sequência, só não soma. Por isso a contagem começa em ontem. */
export function sequencia(dias, meta = META_DIA, ref = iso()) {
  let n = pctDia(dias[ref]) >= meta ? 1 : 0;
  let k = maisDias(ref, -1);
  for (let guarda = 0; guarda < 3650; guarda++) {
    if (pctDia(dias[k]) < meta) break;
    n++;
    k = maisDias(k, -1);
  }
  return n;
}
export function semana(dias, ref = iso()) {
  const seg = maisDias(ref, -((emDia(ref).getDay() + 6) % 7));
  return DIAS_SEMANA.map((nome, i) => {
    const k = maisDias(seg, i);
    return { k, nome, hoje: k === ref, futuro: k > ref, pct: dias[k] ? pctDia(dias[k]) : null };
  });
}
export const semanaPilar = (dias, p, ref = iso()) =>
  semana(dias, ref).map(d => ({ ...d, pct: dias[d.k] ? pctPilar(dias[d.k], p) : null }));

export const contarHabito = (dias, id, ref = iso()) =>
  Object.entries(dias).filter(([k, r]) => k.slice(0, 7) === ref.slice(0, 7) && r[id] === 'sim').length;

/* quantos dos últimos n dias o pilar ficou em pé (75% ou mais dele) */
export function aderenciaPilar(dias, p, n = 7, ref = iso()) {
  let bons = 0;
  for (let i = 0; i < n; i++) if (pctPilar(dias[maisDias(ref, -i)], p) >= 75) bons++;
  return { bons, n, pct: Math.round((bons / n) * 100) };
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
/* dias do ciclo já vividos que bateram a meta */
export function aderencia(s, ref = iso()) {
  let bons = 0, contados = 0;
  for (let i = 0; i < CICLO_DIAS; i++) {
    const k = maisDias(s.cicloInicio, i);
    if (k > ref) break;
    contados++;
    if (pctDia(s.dias[k]) >= META_DIA) bons++;
  }
  return { bons, contados, pct: contados ? Math.round((bons / contados) * 100) : 0 };
}
/* as 13 semanas do ciclo, pra barra do percurso */
export function semanasDoCiclo(s, ref = iso()) {
  const atual = ciclo(s, ref).semana;
  return Array.from({ length: 13 }, (_, w) => {
    let bons = 0, contados = 0;
    for (let i = 0; i < 7; i++) {
      const idx = w * 7 + i;
      if (idx >= CICLO_DIAS) break;
      const k = maisDias(s.cicloInicio, idx);
      if (k > ref) break;
      contados++;
      if (pctDia(s.dias[k]) >= META_DIA) bons++;
    }
    return { semana: w + 1, contados, atual: w + 1 === atual, pct: contados ? Math.round((bons / contados) * 100) : null };
  });
}

/* ---- dinheiro ---- */
export const brl = n => 'R$ ' + Math.abs(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const dinheiro = n => (n < 0 ? '− ' : '') + brl(n);
const cent = n => Math.round(n * 100) / 100;

export const doMes = (tx, ref = iso()) => tx.filter(t => t.data.slice(0, 7) === ref.slice(0, 7));
export function caixa(tx) {
  const entradas = cent(tx.filter(t => t.v > 0).reduce((s, t) => s + t.v, 0));
  const saidas = cent(tx.filter(t => t.v < 0).reduce((s, t) => s - t.v, 0));
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
  REFEICOES.forEach((r, i) => { if (ex['rf' + i]) { prot += r.prot; kcal += r.kcal; feitas++; } });
  return { prot, kcal, feitas, total: REFEICOES.length, agua: ex.agua || 0 };
}

/* ---- metas, cada uma ancorada numa fase do ciclo ---- */
export function progresso(meta, s) {
  if (meta.tipo === 'treinos') {
    const v = contarHabito(s.dias, 'treino');
    return { p: Math.min(100, Math.round((v / meta.alvo) * 100)), sub: `${v} de ${meta.alvo} treinos no mês` };
  }
  if (meta.tipo === 'saldo') {
    const { saldo } = caixa(doMes(s.tx));
    return { p: saldo >= 0 ? 100 : 0, sub: saldo >= 0 ? `Saldo de ${brl(saldo)}` : `No vermelho em ${brl(saldo)}` };
  }
  if (meta.tipo === 'dieta') {
    const d = aderenciaPilar(s.dias, pilar('diet'));
    return { p: Math.min(100, Math.round((d.pct / meta.alvo) * 100)), sub: `${d.bons} de ${d.n} dias na linha` };
  }
  if (meta.tipo === 'proteina') {
    const { prot } = macrosDoDia(s);
    return { p: Math.min(100, Math.round((prot / meta.alvo) * 100)), sub: `${prot} g de ${meta.alvo} g hoje` };
  }
  return { p: Math.min(100, Math.round((meta.valor / meta.alvo) * 100)), sub: meta.sub };
}
export const metasDaFase = (s, faseId) => s.metas.filter(m => m.fase === faseId);

/* ---- estado salvo no aparelho ---- */
const CHAVE = 'ritmo:v1';

function sementeDias() {
  const hoje = iso(), todosSim = Object.fromEntries(HABITOS.map(h => [h.id, 'sim']));
  const d = {};
  for (let i = 1; i <= 11; i++) d[maisDias(hoje, -i)] = { ...todosSim };
  d[maisDias(hoje, -2)] = { ...todosSim, cardio: 'nao' };
  d[maisDias(hoje, -5)] = { ...todosSim, cardio: 'nao', creatina: null };
  d[hoje] = {
    aulas: 'sim', estudo: 'sim', lista: 'sim', treino: 'sim',
    sem_lixo: 'sim', marmita: 'sim', horas: 'sim', board: 'sim', gastos: 'sim', limite: 'nao',
  };
  return d;
}
function sementeTx() {
  const h = iso();
  return [
    { id: 1, data: h,               desc: 'Almoço no RU',           cat: 'Alimentação', meio: 'Pix',           v: -14.50 },
    { id: 2, data: h,               desc: 'Passagem de ônibus',     cat: 'Transporte',  meio: 'Cartão',        v: -9.20 },
    { id: 3, data: h,               desc: 'Café da tarde',          cat: 'Alimentação', meio: 'Pix',           v: -8.00 },
    { id: 4, data: maisDias(h, -1), desc: 'Bolsa do estágio',       cat: 'Renda',       meio: 'Transferência', v: 1200.00 },
    { id: 5, data: maisDias(h, -1), desc: 'Whey protein',           cat: 'Academia',    meio: 'Crédito',       v: -139.90 },
    { id: 6, data: maisDias(h, -2), desc: 'Mensalidade academia',   cat: 'Academia',    meio: 'Débito',        v: -99.90 },
    { id: 7, data: maisDias(h, -3), desc: 'Freela de landing page', cat: 'Renda',       meio: 'Pix',           v: 600.00 },
    { id: 8, data: maisDias(h, -4), desc: 'Cinema com a galera',    cat: 'Lazer',       meio: 'Crédito',       v: -48.00 },
    { id: 9, data: maisDias(h, -5), desc: 'Mercado do mês',         cat: 'Alimentação', meio: 'Débito',        v: -213.40 },
  ];
}
export const METAS_PADRAO = [
  { id: 'treinos',  fase: 'base',  nome: 'Treinar 20 vezes no mês',           tipo: 'treinos',  alvo: 20 },
  { id: 'dieta',    fase: 'base',  nome: 'Dieta em pé 6 dias por semana',     tipo: 'dieta',    alvo: 86 },
  { id: 'positivo', fase: 'ritmo', nome: 'Fechar o mês no positivo',          tipo: 'saldo',    alvo: 0 },
  { id: 'proteina', fase: 'ritmo', nome: `Bater ${META_PROTEINA} g de proteína no dia`, tipo: 'proteina', alvo: META_PROTEINA },
  { id: 'viagem',   fase: 'pico',  nome: 'Juntar R$ 3.000 pra viagem de julho', tipo: 'manual', valor: 1740, alvo: 3000, sub: 'R$ 1.740 de R$ 3.000' },
  { id: 'media',    fase: 'pico',  nome: 'Média acima de 8,0 no semestre',    tipo: 'manual',   valor: 81, alvo: 80, sub: 'Média parcial de 8,1' },
];

export const semente = () => ({
  versao: 1,
  exemplo: true,          // some quando ele limpa os dados de exemplo
  anim: true,             // animações ligadas (Ajustes desliga)
  tema: 'sistema',        // 'sistema' | 'claro' | 'escuro'
  cicloInicio: maisDias(iso(), -11),   // o exemplo começa no dia 12 do ciclo
  dias: sementeDias(),
  extra: { [iso()]: { rf0: true, rf1: true, rf2: true, rf3: true, agua: 3 } },
  tx: sementeTx(),
  metas: METAS_PADRAO,
  marcados: { lb0: true, lb1: true },   // só o que não é do dia (lembretes)
});

export function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return semente();
    const s = JSON.parse(bruto);
    const r = {
      ...semente(), ...s,
      dias: s.dias || {}, extra: { ...s.extra }, marcados: { ...s.marcados },
      metas: s.metas && s.metas.length ? s.metas : METAS_PADRAO,
    };
    if (!s.cicloInicio) r.cicloInicio = Object.keys(r.dias).sort()[0] || iso();
    return r;
  } catch {
    return semente();        // storage bloqueado ou JSON corrompido: começa limpo
  }
}
export function salvar(s) {
  try { localStorage.setItem(CHAVE, JSON.stringify(s)); } catch { /* aba privada: roda sem salvar */ }
}
export const vazio = () => ({
  ...semente(), exemplo: false, cicloInicio: iso(), dias: {}, extra: {}, tx: [], marcados: {},
});
