/* Ritmo — modelo de treino: rotinas com exercícios.
   O plano vem de fora (export do OpenGym), nunca cravado aqui.
   As fases do plano viram as fases do ciclo: Carga = Ritmo, Potência = Pico.
   Tudo função pura; as regras daqui são testadas em check.mjs, junto com o resto. */
import { DIAS_SEMANA, maisDias } from './store.js';

/* store.js não exporta o emDia dele; uma linha repetida sai mais barata
   que mexer no arquivo pra exportar. Meio-dia de propósito, igual lá. */
const emDia = k => new Date(k + 'T12:00:00');

const FASE_DA_NOTA = { carga: 'ritmo', 'potência': 'pico', potencia: 'pico' };

/* o arquivo de fora fala inglês; traduz na importação e o resto do app
   só conhece o vocabulário daqui */
const MODO = { time: 'tempo', cardio: 'cardio', reps: 'reps' };

/* As notas do plano trazem a prescrição das outras fases em texto corrido
   ("Fase Carga: 4 × 10."). Puxa cada uma pra um campo próprio.
   ponytail: heurística por frase. Não achando, a nota inteira continua à vista
   na tela, então o pior caso é ler a nota — nunca perder a informação. */
export function fasesDaNota(nota = '') {
  const out = {};
  String(nota).split(/(?<=\.)\s+/).forEach(frase => {
    const m = frase.match(/^Fase\s+([A-Za-zÀ-ÿ]+)\s*:\s*(.+?)\.?$/);
    if (!m) return;
    const fase = FASE_DA_NOTA[m[1].toLowerCase()];
    if (fase) out[fase] = m[2].trim();
  });
  return out;
}

/* o que mostrar como prescrição do exercício na fase em que o ciclo está */
export function prescricao(ex, faseId = 'base') {
  if (ex.fases && ex.fases[faseId]) return ex.fases[faseId];
  const lado = ex.lado ? ' cada lado' : '';
  if (ex.modo === 'cardio') return `${ex.min} min`;
  /* em tempo, o segundo já é por lado; em repetição, o OpenGym guarda o total
     das duas pernas — a tela mostra por lado. Ímpar não divide: melhor dar o
     total que inventar meia repetição. */
  if (ex.modo === 'tempo') return `${ex.sets} × ${ex.sec} s${lado}`;
  const porLado = n => (ex.lado && n != null && n % 2 === 0 ? n / 2 : n);
  const r = porLado(ex.reps), rm = porLado(ex.repsMin);
  const reps = rm && rm !== r ? `${rm}–${r}` : r;
  return `${ex.sets} × ${reps}${lado}`;
}

/* descanso legível; 0 com supersérie é emenda, ausente é livre */
export function descansoTxt(ex) {
  if (ex.descanso === null || ex.descanso === undefined) return 'livre';
  if (ex.descanso === 0) return ex.sg ? 'emenda' : 'sem pausa';
  return `${ex.descanso} s`;
}

/* Lê o .opengym-plan.json. Exercício cujo nome o arquivo não traz fica com o
   id à mostra e entra em `avisos.semNome` — nunca com nome inventado. */
export function importarOpenGym(json) {
  const nomes = {};
  (json.customEx || []).forEach(c => { nomes[c.id] = { nome: c.n, desc: c.desc }; });

  const treinos = (json.routines || []).map(r => ({
    id: r.id,
    nome: String(r.name || r.id).replace(/^[A-Z]\s*·\s*/, ''),
    emoji: r.emoji || '',
    ex: (r.ex || []).map((e, i) => {
      const conhecido = nomes[e.id] || null;
      return {
        ord: i,
        ref: e.id,
        nome: conhecido ? conhecido.nome : '',
        desc: conhecido ? conhecido.desc : '',
        modo: MODO[e.mode] || 'reps',
        sets: e.sets ?? 1,
        reps: e.reps ?? null,
        repsMin: e.repsMin ?? null,
        sec: e.sec ?? null,
        min: e.min ?? null,
        vel: e.speed ?? null,
        descanso: e.restOff ? null : (e.restSec ?? null),
        lado: !!e.side,
        prog: e.prog || r.prog || 'off',
        sg: e.sg || null,
        sgNome: e.sgName || null,
        sgDescanso: e.sgRest ?? null,
        subs: e.subs || [],
        nota: e.note || '',
        fases: fasesDaNota(e.note),
      };
    }),
  }));

  const porId = Object.fromEntries(treinos.map(t => [t.id, t]));
  const split = DIAS_SEMANA.map((nome, i) => {
    const ids = json.week ? json.week[String(i + 1)] : null;
    const t = ids && ids.length ? porId[ids[0]] : null;
    return {
      id: nome.toLowerCase(), nome,
      treinoId: t ? t.id : '',
      meta: t ? `${t.emoji ? t.emoji + ' ' : ''}${t.nome}`.trim() : 'folga',
    };
  });

  const semNome = [];
  treinos.forEach(t => t.ex.forEach(e => {
    if (!e.nome && !semNome.includes(e.ref)) semNome.push(e.ref);
  }));
  return { treinos, split, avisos: { semNome } };
}

/* preenche os nomes que faltavam, de um mapa { "0585": "Cadeira extensora" } */
export function comNomes(treinos, mapa) {
  return treinos.map(t => ({
    ...t,
    ex: t.ex.map(e => (!e.nome && mapa[e.ref] ? { ...e, nome: mapa[e.ref] } : e)),
  }));
}

/* ---- registro de carga e repetições ----
   Duas chaves por exercício no `extra` do dia: `tx…` é o feito/não feito que
   já existia, `tl…` guarda { kg, s: [reps por série] }. */
export const chaveFeito = (t, e) => `tx${t.id}-${e.ord}`;
export const chaveLog = (t, e) => `tl${t.id}-${e.ord}`;
export const logVazio = { kg: '', s: [] };
export const logDe = (extra, t, e) => (extra || {})[chaveLog(t, e)] || logVazio;

/* quantas repetições por série a fase pede (por lado, quando é unilateral) */
export function alvoDeReps(ex) {
  if (ex.modo !== 'reps' || ex.reps == null) return null;
  return ex.lado && ex.reps % 2 === 0 ? ex.reps / 2 : ex.reps;
}

/* Dupla progressão: fechou o topo da faixa em todas as séries, sobe a carga.
   É a regra que o plano usa e que sem registro de carga nunca dispara. */
export function fechouAFaixa(ex, log) {
  if (ex.prog !== 'double' || !log || !log.s || log.s.length < ex.sets) return false;
  const alvo = alvoDeReps(ex);
  if (!alvo) return false;
  return log.s.slice(0, ex.sets).every(r => Number(r) >= alvo);
}

/* A última vez que esse exercício foi registrado, olhando pra trás.
   Serve pra tela dizer "da última vez: 32 kg" em vez de te deixar lembrar. */
export function ultimoLog(extra = {}, t, e, ref, dias = 120) {
  const k = chaveLog(t, e);
  for (let i = 1; i <= dias; i++) {
    const dia = maisDias(ref, -i);
    const log = (extra[dia] || {})[k];
    if (log && (log.kg !== '' || (log.s || []).length)) return { ...log, data: dia };
  }
  return null;
}

/* a rotina de recuperação do plano (id REC no export do OpenGym) */
export const recuperacao = (treinos = []) =>
  treinos.find(t => t.id === 'REC') || treinos.find(t => /recupera/i.test(t.nome)) || null;

/* O treino marcado pro dia da semana dessa data.
   Joelho no vermelho troca pela rotina de recuperação; se o plano não tiver
   uma, devolve null em vez do treino normal — mandar treinar perna com o
   joelho no vermelho seria pior do que não mandar nada. */
export function treinoDoDia(listas, ref, luz) {
  const treinos = listas.treinos || [];
  if (luz === 'vermelho') return recuperacao(treinos);
  const dia = (listas.split || [])[(emDia(ref).getDay() + 6) % 7];
  if (!dia || !dia.treinoId) return null;
  return treinos.find(t => t.id === dia.treinoId) || null;
}
