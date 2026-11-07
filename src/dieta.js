/* Ritmo — modelo de dieta: refeições com alimentos, quantidade e substituições.
   O plano vem de fora (transcrição do Web Diet), nunca cravado aqui.
   Refeições do mesmo `grupo` são alternativas do mesmo horário: escolhe uma.
   Tudo função pura; testado em check.mjs. */

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

/* Junta as alternativas: um grupo por horário, com as opções dentro.
   Mantém a ordem em que as refeições chegaram. */
export function gruposDeRefeicao(refeicoes = []) {
  const ordem = [], porGrupo = {};
  refeicoes.forEach(r => {
    const g = r.grupo || r.id;
    if (!porGrupo[g]) { porGrupo[g] = { grupo: g, hora: r.hora, opcoes: [] }; ordem.push(g); }
    porGrupo[g].opcoes.push(r);
  });
  return ordem.map(g => {
    const bloco = porGrupo[g];
    /* uma opção só: o nome do grupo é o nome dela. Várias: tira o número do fim */
    bloco.nome = bloco.opcoes.length === 1
      ? bloco.opcoes[0].nome
      : bloco.opcoes[0].nome.replace(/\s*\d+$/, '');
    return bloco;
  });
}

/* quantas refeições do dia foram marcadas; num grupo de alternativas,
   marcar qualquer uma já resolve o grupo */
export function gruposFeitos(grupos, extra = {}) {
  const feitos = grupos.filter(g => g.opcoes.some(r => extra['rf' + r.id])).length;
  return { feitos, total: grupos.length };
}
