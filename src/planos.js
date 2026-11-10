/* Planos prontos por perfil: rotina, dieta e treino de uma vez.
   Fica fora do store.js porque usa o treino.js e o dieta.js, que importam o
   store; daqui ninguém importa de volta. */
import * as D from './store.js';
import * as T from './treino.js';
import * as Di from './dieta.js';
import NOMES_OPENGYM from './nomes-opengym.json' with { type: 'json' };
import ANA_ROTINA from './planos/ana-rotina.json' with { type: 'json' };
import ANA_DIETA from './planos/ana-dieta.json' with { type: 'json' };
import ANA_TREINO from './planos/ana-treino.json' with { type: 'json' };

export const PLANOS = {
  ana: { rotina: ANA_ROTINA, dieta: ANA_DIETA, treino: ANA_TREINO, semJoelho: true },
};
export const temPlano = id => !!PLANOS[id];

/* o plano já no formato do perfil, com ids novos */
export function montar(id) {
  const P = PLANOS[id];
  const { treinos, split } = T.importarOpenGym(P.treino);
  const dieta = Di.importarPlanoDieta(P.dieta);
  const comId = xs => (xs || []).map(x => ({ ...x, id: D.novoId() }));
  return {
    listas: {
      habitos: comId(P.rotina.habitos), turnos: comId(P.rotina.turnos), materias: comId(P.rotina.materias),
      refeicoes: dieta.refeicoes, orientacoes: dieta.orientacoes,
      treinos: T.comNomes(treinos, NOMES_OPENGYM), split,
    },
    cfg: { ...(P.rotina.cfg || {}), ...dieta.cfg, ...(P.rotina.acorda ? { acorda: P.rotina.acorda } : {}) },
    acordaDia: P.rotina.acordaDia || {},
    semJoelho: !!P.semJoelho,
  };
}

/* Aplica o plano. soVazio: só preenche o que o perfil ainda não tem (é o que
   roda sozinho na primeira abertura); sem ele, substitui tudo (botão de Ajustes). */
export function comPlano(s, id, { soVazio = false } = {}) {
  if (!PLANOS[id]) return s;
  const m = montar(id);
  const vazio = k => !(s.listas[k] || []).length;
  /* split vazio é o padrão de 7 dias sem treino */
  const splitVazio = !(s.listas.split || []).some(d => d.treinoId);
  const listas = { ...s.listas };
  Object.entries(m.listas).forEach(([k, v]) => {
    if (!soVazio || (k === 'split' ? splitVazio : vazio(k))) listas[k] = v;
  });
  const acordaDia = soVazio && Object.keys(s.acordaDia || {}).length ? s.acordaDia : m.acordaDia;
  /* sem nada cadastrado, as metas de dieta e os horários do plano valem;
     com dados, ajuste feito na mão fica */
  const cfg = soVazio && !vazio('refeicoes') ? s.cfg : { ...s.cfg, ...m.cfg };
  return { ...s, listas, acordaDia, cfg, semJoelho: m.semJoelho, modo: 'aula' };
}

/* primeira abertura do perfil depois que o plano existe: aplica uma vez */
export function planoInicial(id, s) {
  const marca = D.PLANO_INICIAL[id];
  if (!marca || !PLANOS[id] || (s.aplicados || []).includes(marca)) return s;
  return { ...comPlano(s, id, { soVazio: true }), aplicados: [...(s.aplicados || []), marca] };
}
