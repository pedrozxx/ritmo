/* Ritmo — modelo de dieta: refeições com alimentos, quantidade e substituições.
   O plano vem de fora (transcrição do Web Diet), nunca cravado aqui.
   Refeições do mesmo `grupo` são alternativas do mesmo horário: escolhe uma.
   Tudo função pura; testado em check.mjs. */
import { emMinutos } from './store.js';

/* Lê o plano-dieta.json. Macro em branco fica em branco: o Web Diet só dá o
   total do dia, e número de refeição estimado por mim não entra no app. */
export function importarPlanoDieta(json) {
  const refeicoes = (json.refeicoes || []).map((r, i) => ({
    id: `${r.grupo || 'ref'}-${i}`,
    grupo: r.grupo || 'ref',
    nome: r.nome || '',
    hora: r.hora || '',
    prot: r.prot ?? '',
    kcal: r.kcal ?? '',
    obs: r.obs || '',
    ondeAula: r.ondeAula || '',
    /* horário em dias específicos (0 = SEG): { "0": "05:00" } */
    ...(r.horaPorDia ? { horaPorDia: r.horaPorDia } : {}),
    /* o campo de texto que o esquema antigo já tinha, pra lista e editor */
    o: (r.itens || []).map(it => it.nome).join(', '),
    itens: (r.itens || []).map(it => ({
      nome: it.nome,
      qtd: it.qtd || '',
      duvida: it.duvida || '',
      subs: (it.subs || []).map(s => ({ nome: s.nome, qtd: s.qtd || '', duvida: s.duvida || '' })),
    })),
  }));

  const t = json.totaisDoDia || {};
  const cfg = {};
  if (Number.isFinite(t.prot)) cfg.proteina = Math.round(t.prot);
  if (Number.isFinite(t.kcal)) cfg.kcal = Math.round(t.kcal);

  return { refeicoes, cfg, orientacoes: json.orientacoes || [] };
}

/* "Jantar 2" vem depois de "Jantar 1" e antes de "Jantar 10": comparar texto
   puro colocaria o 10 no meio. Sem número no fim, vale a ordem de chegada. */
const numeroDoFim = nome => {
  const m = String(nome || '').match(/(\d+)\s*$/);
  return m ? Number(m[1]) : null;
};

/* Junta as alternativas: um grupo por horário, com as opções dentro.
   Os grupos saem na ordem do relógio — o dia se lê de cima pra baixo. */
export function gruposDeRefeicao(refeicoes = []) {
  const ordem = [], porGrupo = {};
  refeicoes.forEach((r, i) => {
    const g = r.grupo || r.id;
    if (!porGrupo[g]) { porGrupo[g] = { grupo: g, hora: r.hora, opcoes: [], chegou: i }; ordem.push(g); }
    porGrupo[g].opcoes.push({ ...r, chegou: i });
  });

  return ordem.map(g => porGrupo[g]).map(bloco => {
    bloco.opcoes.sort((a, b) => {
      const na = numeroDoFim(a.nome), nb = numeroDoFim(b.nome);
      return na != null && nb != null ? na - nb : a.chegou - b.chegou;
    });
    /* uma opção só: o nome do grupo é o nome dela. Várias: tira o número do fim */
    bloco.nome = bloco.opcoes.length === 1
      ? bloco.opcoes[0].nome
      : bloco.opcoes[0].nome.replace(/\s*\d+$/, '');
    return bloco;
  }).sort((a, b) => {
    const ha = emMinutos(a.hora), hb = emMinutos(b.hora);
    if (ha == null || hb == null) return a.chegou - b.chegou;   // sem horário, ordem de chegada
    return ha - hb;
  });
}

/* quantas refeições do dia foram marcadas; num grupo de alternativas,
   marcar qualquer uma já resolve o grupo */
export function gruposFeitos(grupos, extra = {}) {
  const feitos = grupos.filter(g => g.opcoes.some(r => extra['rf' + r.id])).length;
  return { feitos, total: grupos.length };
}
