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
    /* A dica segue o pilar de onde o cadastro foi aberto: sugerir "Fui pra
       academia" em Faculdade não ajuda ninguém. `dicaPor` é lido pelo editor
       a partir do filtro que abriu a folha. */
    { k: 'nome', rot: 'O que é', tipo: 'texto', obrig: true, dica: 'O que você responde todo dia',
      dicaPor: { pilar: {
        gym: 'Fui pra academia',
        diet: 'Não saí da dieta',
        fac: 'Assisti as aulas do dia',
        est: 'Bati as horas do estágio',
        fin: 'Registrei os gastos do dia',
      } } },
    { k: 'meta', rot: 'Detalhe', tipo: 'texto', dica: 'Opcional, pra lembrar do combinado',
      dicaPor: { pilar: {
        gym: 'Treino B, 19h45',
        diet: 'Sem besteira depois do jantar',
        fac: 'Cálculo III, segunda e quarta',
        est: '6 h por dia, das 13h às 19h',
        fin: 'Lançar tudo no mesmo dia',
      } } },
    /* O horário pode sair da aula ou do estágio de cada dia: "sai pra
       faculdade" às 08:00 não serve pra quem só tem aula à tarde na terça. */
    { k: 'ancora', rot: 'O horário depende de', tipo: 'escolha', padrao: '', ops: [
      ['', 'Horário fixo'], ['aula', 'Da aula do dia'], ['estagio', 'Do estágio do dia']] },
    { k: 'antes', rot: 'Quantos minutos antes', tipo: 'numero', dica: '30',
      soCampo: 'ancora', so: ['aula', 'estagio'] },
    { k: 'hora', rot: 'Horário', tipo: 'texto', dica: '18:00', soCampo: 'ancora', so: [''] },
    { k: 'dias', rot: 'Em que dias', tipo: 'dias' },
    { k: 'modo', rot: 'Em qual semana', tipo: 'escolha', padrao: '',
      ops: [['', 'Nas duas'], ['aula', 'Só com aula'], ['ferias', 'Só sem aula']] },
  ]},
  refeicoes: { um: 'refeição', campos: [
    { k: 'nome', rot: 'Refeição', tipo: 'texto', obrig: true, dica: 'Almoço 2' },
    { k: 'hora', rot: 'Horário', tipo: 'texto', dica: '12:00' },
    /* é isso que deixa ter Almoço 1 e 2 como opções do mesmo horário */
    { k: 'grupo', rot: 'Alternativa de qual refeição', tipo: 'grupo' },
    /* dia de aula com estágio de manhã muda onde e quando se come */
    { k: 'ondeAula', rot: 'Em dia de aula com estágio de manhã', tipo: 'escolha', padrao: '', ops: [
      ['', 'No horário de sempre'], ['estagio', 'No estágio, logo que chega'],
      ['faculdade', 'Na faculdade, chegando do estágio']] },
    { k: 'o', rot: 'O que tem', tipo: 'texto', dica: '180 g de frango, arroz e salada' },
    { k: 'prot', rot: 'Proteína em gramas', tipo: 'numero' },
    { k: 'kcal', rot: 'Calorias', tipo: 'numero' },
  ]},
  exercicios: { um: 'exercício', campos: [
    { k: 'nome', rot: 'Exercício', tipo: 'texto', obrig: true, dica: 'Supino inclinado' },
    { k: 'meta', rot: 'Séries e carga', tipo: 'texto', dica: '4 × 8 com 32 kg' },
  ]},
  materias: { um: 'matéria', campos: [
    { k: 'nome', rot: 'Matéria', tipo: 'texto', obrig: true, dica: 'Sistemas Operacionais' },
    { k: 'dias', rot: 'Em que dias tem aula', tipo: 'dias' },
    { k: 'inicio', rot: 'Começa', tipo: 'texto', dica: '19:10' },
    { k: 'fim', rot: 'Termina', tipo: 'texto', dica: '22:30' },
    { k: 'meta', rot: 'Detalhe', tipo: 'texto', dica: 'Sala B204, professor Silva' },
    { k: 'nota', rot: 'Nota parcial', tipo: 'numero' },
  ]},
  /* o expediente do estágio: é ele que põe o estágio na linha do dia */
  turnos: { um: 'horário de estágio', campos: [
    { k: 'nome', rot: 'Onde', tipo: 'texto', obrig: true, dica: 'Estágio' },
    { k: 'dias', rot: 'Em que dias', tipo: 'dias' },
    { k: 'inicio', rot: 'Começa', tipo: 'texto', dica: '12:00' },
    { k: 'fim', rot: 'Termina', tipo: 'texto', dica: '18:00' },
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
  cofres: { um: 'objetivo', campos: [
    { k: 'nome', rot: 'Pra que é', tipo: 'texto', obrig: true, dica: 'Reserva de emergência' },
    { k: 'alvo', rot: 'Quanto quer juntar', tipo: 'numero', obrig: true, dica: '3000' },
    { k: 'ate', rot: 'Até quando', tipo: 'data' },
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
  SCHEMAS[chave].campos.filter(c => !c.so || c.so.includes(v[c.soCampo || 'tipo'] ?? ''));

/* A dica do campo, já resolvida pelo filtro que abriu o cadastro.
   Sem filtro ou sem correspondência, vale a dica genérica do campo. */
export function dicaDe(campo, filtro) {
  if (campo.dicaPor && filtro) {
    for (const [chave, mapa] of Object.entries(campo.dicaPor)) {
      const achada = mapa[filtro[chave]];
      if (achada) return achada;
    }
  }
  return campo.dica || '';
}

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

export const valeNoDia = (h, s, k) => horaDoHabito(h, s, diaIdx(k)) !== null;

/* ---- aula e estágio: os blocos fixos de cada dia da semana ----
   Aula só existe na semana com aula. Estágio vale nas duas. */
export const ANTES_PADRAO = 30;
export const NOME_BLOCO = { aula: 'aula', estagio: 'estágio' };
export function blocosDoDia(s, dia) {
  const out = [];
  if ((s.modo || 'aula') === 'aula') {
    (janelaDeAula(s.listas.materias, dia)?.aulas || [])
      .forEach(m => out.push({ tipo: 'aula', de: m.de, ate: m.ate, nome: m.nome }));
  }
  (s.listas.turnos || []).filter(t => (t.dias || []).includes(dia)).forEach(t => {
    const de = emMinutos(t.inicio), ate = emMinutos(t.fim);
    if (de != null && ate != null && ate > de) out.push({ tipo: 'estagio', de, ate, nome: t.nome || 'Estágio' });
  });
  return out.sort((a, b) => a.de - b.de);
}
/* Estágio que acaba antes da aula do mesmo dia, com até 3 h de intervalo:
   é dia de ir do estágio direto pra faculdade. */
export const COMER_MIN = 20;          // o mínimo pra almoçar sem engolir
export const trajetoEstagioFac = s => {
  const v = Number(s.cfg?.trajetoEstagioFac);
  return s.cfg?.trajetoEstagioFac !== '' && Number.isFinite(v) && v > 0 ? v : trajeto(s, 'aula');
};
export const DEPOIS_DE_CHEGAR = 30;   // o café no estágio, depois de chegar e se ajeitar
export const trajeto = (s, tipo) => {
  const v = Number(s.cfg?.[tipo === 'aula' ? 'trajetoFaculdade' : 'trajetoEstagio']);
  return Number.isFinite(v) && v >= 0 ? v : 30;
};
export const INTERVALO_DIRETO = 3 * 60;
export function estagioAntesDaAula(s, dia) {
  const bl = blocosDoDia(s, dia);
  const aula = bl.find(b => b.tipo === 'aula');
  if (!aula) return null;
  const estagio = bl.filter(b => b.tipo === 'estagio' && b.ate <= aula.de && aula.de - b.ate <= INTERVALO_DIRETO).pop();
  return estagio ? { estagio, aula } : null;
}

/* Onde e quando cai uma refeição (um grupo de alternativas) num dia da
   semana. Só muda em dia de aula com estágio de manhã, e só se a refeição
   pediu isso em "ondeAula": aí o café vai pro estágio, logo que chega, e o
   almoço vai pra faculdade, na hora que chega do estágio. */
export function horaDaRefeicao(g, s, dia) {
  const fixo = { min: emMinutos(g.hora), onde: null };
  const quer = (g.opcoes || []).map(r => r.ondeAula).find(Boolean);
  if (!quer) return fixo;
  const ea = estagioAntesDaAula(s, dia);
  if (!ea) return fixo;
  if (quer === 'estagio') return { min: ea.estagio.de + DEPOIS_DE_CHEGAR, onde: 'no estágio' };
  if (quer === 'faculdade') {
    /* chega do estágio e almoça antes da aula; se não sobra tempo, avisa */
    const min = ea.estagio.ate + trajetoEstagioFac(s);
    return { min, onde: 'na faculdade', aperto: min + COMER_MIN > ea.aula.de ? ea.aula : null };
  }
  return fixo;
}

/* alguém cadastrou aula (ou estágio) com dia e horário? */
const temHorarioDe = (s, tipo) => ((tipo === 'aula' ? s.listas.materias : s.listas.turnos) || [])
  .some(m => emMinutos(m.inicio) != null && emMinutos(m.fim) != null && (m.dias || []).length);

/* O horário do hábito num dia da semana (0 = SEG). null: não vale nesse dia.
   Hábito preso à aula ou ao estágio só vale nos dias que têm aquele bloco,
   e o horário sai do começo dele. Enquanto não há horário de aula (ou de
   estágio) cadastrado em lugar nenhum, ele cai no horário fixo de antes. */
export function horaDoHabito(h, s, dia) {
  if (h.modo && h.modo !== (s.modo || 'aula')) return null;
  if (h.dias && h.dias.length && !h.dias.includes(dia)) return null;
  if (h.ancora && temHorarioDe(s, h.ancora)) {
    const b = blocosDoDia(s, dia).find(x => x.tipo === h.ancora);
    if (!b) return null;
    const antes = h.antes === '' || h.antes == null || !Number.isFinite(Number(h.antes)) ? ANTES_PADRAO : Number(h.antes);
    /* estágio de manhã e aula à tarde: sai pra aula direto do estágio, na
       hora que ele acaba, e não X minutos antes da aula */
    const ea = h.ancora === 'aula' && estagioAntesDaAula(s, dia);
    if (ea) {
      const chegada = ea.estagio.ate + trajetoEstagioFac(s);
      return { min: ea.estagio.ate, antes, bloco: b, direto: ea.estagio, chegada, atraso: chegada > b.de };
    }
    return { min: Math.max(0, b.de - antes), antes, bloco: b };
  }
  return { min: emMinutos(h.hora) };
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

/* ---- peso e cintura: medida do dia, guardada junto com o resto do dia ---- */
export const MLKG_PADRAO = 45;
export const pesoDoDia = (s, ref = iso()) => Number(extraDoDia(s, ref).peso) || null;

/* as pesagens registradas, da mais nova pra mais velha */
export function pesagens(s) {
  return Object.entries(s.extra || {})
    .filter(([, e]) => Number(e.peso) > 0)
    .map(([k, e]) => ({ k, peso: Number(e.peso), cintura: Number(e.cintura) || null }))
    .sort((a, b) => (a.k < b.k ? 1 : -1));
}
export const ultimaPesagem = s => pesagens(s)[0] || null;

/* Meta de água: com peso registrado ela sai de ml por quilo, como manda o
   plano. Sem peso, cai no número fixo de garrafas que a pessoa configurou. */
export function metaAgua(s) {
  const p = ultimaPesagem(s);
  const mlKg = Number(s.cfg.mlPorKg) || MLKG_PADRAO;
  if (!p) return { ml: s.cfg.garrafas * s.cfg.mlGarrafa, garrafas: s.cfg.garrafas, doPeso: false };
  const ml = Math.round(p.peso * mlKg);
  return { ml, garrafas: Math.max(1, Math.round(ml / s.cfg.mlGarrafa)), doPeso: true, peso: p.peso, mlKg };
}

/* os horários de refeição que já existem, pra escolher no cadastro */
export const gruposExistentes = s =>
  [...new Map((s.listas.refeicoes || [])
    .filter(r => r.grupo)
    .map(r => [r.grupo, `${String(r.nome).replace(/\s*\d+$/, '')}${r.hora ? ` · ${r.hora}` : ''}`]))
    .entries()];

/* ---- horários: aula e rotina no mesmo relógio ----
   "19:10", "19h10" e "19h" viram minutos desde a meia-noite. Qualquer outra
   coisa vira null, e quem não tem horário fica de fora das contas. */
export function emMinutos(txt) {
  const m = String(txt ?? '').trim().match(/^(\d{1,2})\s*[:h]\s*(\d{2})?$/i);
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2] ?? 0);
  return h > 23 || min > 59 ? null : h * 60 + min;
}
export const emHora = min =>
  min == null ? '' : `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/* A janela de aula de um dia: do começo da primeira ao fim da última. */
export function janelaDeAula(materias = [], diaIdx) {
  const doDia = materias.filter(m => (m.dias || []).includes(diaIdx))
    .map(m => ({ de: emMinutos(m.inicio), ate: emMinutos(m.fim), nome: m.nome }))
    .filter(m => m.de != null && m.ate != null && m.ate > m.de);
  if (!doDia.length) return null;
  return {
    de: Math.min(...doDia.map(m => m.de)),
    ate: Math.max(...doDia.map(m => m.ate)),
    aulas: doDia.sort((a, b) => a.de - b.de),
  };
}

/* Quais hábitos caem dentro da aula, e pra que horário eles iriam.
   Empurra pro fim da aula mais a folga, mantendo a ordem e o espaçamento
   original entre eles — não embola todo mundo no mesmo minuto. */
export const FOLGA_POS_AULA = 15;
export function conflitosComAula(s, folga = FOLGA_POS_AULA) {
  const fora = [];
  DIAS_SEMANA.forEach((_, dia) => {
    const j = janelaDeAula(s.listas.materias, dia);
    if (!j) return;
    const presos = (s.listas.habitos || [])
      .filter(h => !h.ancora && (h.dias || []).includes(dia) && (!h.modo || h.modo === (s.modo || 'aula')))
      .map(h => ({ h, min: emMinutos(h.hora) }))
      .filter(x => x.min != null && x.min >= j.de && x.min < j.ate)
      .sort((a, b) => a.min - b.min);
    if (!presos.length) return;
    const base = j.ate + folga;
    presos.forEach((x, i) => {
      const novo = Math.min(23 * 60 + 59, base + (x.min - presos[0].min) + (i === 0 ? 0 : 0));
      fora.push({ dia, habito: x.h, de: emHora(x.min), para: emHora(novo), janela: j });
    });
  });
  return fora;
}

/* Aplica os conflitos: devolve a lista de hábitos com as horas novas.
   Hábito que vale em mais de um dia com aula fica com o horário mais tarde,
   que é o único que não conflita com nenhum deles. */
export function comHorariosAjustados(habitos, conflitos) {
  const novo = {};
  conflitos.forEach(c => {
    const atual = novo[c.habito.id];
    if (!atual || emMinutos(c.para) > emMinutos(atual)) novo[c.habito.id] = c.para;
  });
  return habitos.map(h => (novo[h.id] ? { ...h, hora: novo[h.id] } : h));
}

/* ---- a rotina hora a hora ----
   O dia começa na hora de acordar e termina 8 horas antes dela, no dia
   seguinte. O que cai de madrugada (depois da meia-noite e antes de acordar)
   vai pro fim da lista, não pro começo. */
export const SONO_MIN = 8 * 60;
export const PREPARO_MIN = 45;      // do acordar até sair de casa
export const DIA_MIN = 24 * 60;
export const acordaMin = s => emMinutos(s.cfg?.acorda) ?? emMinutos(CFG_PADRAO.acorda);
export const dormeMin = s => (acordaMin(s) - SONO_MIN + DIA_MIN) % DIA_MIN;
/* minuto do relógio pro minuto "desde que acordou", pra ordenar o dia */
export const noDia = (s, min) => (min - acordaMin(s) + DIA_MIN) % DIA_MIN;

/* Tudo que tem hora no dia k, em ordem: acordar, hábitos, refeições, aula
   e dormir. Hábito sem hora fica em `semHora`, que a tela mostra no fim.
   Refeições do mesmo grupo viram um item só, igual na Dieta. */
export function linhaDoDia(s, k = iso(), grupos = []) {
  const acorda = acordaMin(s), dorme = dormeMin(s);
  const dia = diaIdx(k);
  const blocos = blocosDoDia(s, dia);
  /* o que cai dentro de aula ou estágio. Comer não conta (come-se em
     qualquer lugar), nem hábito do próprio bloco (estudar durante a aula) */
  const dono = { aula: 'fac', estagio: 'est' };
  const choqueDe = (min, pilar, tipo) => blocos.find(b => b.tipo !== tipo && pilar !== 'diet'
    && dono[b.tipo] !== pilar && min >= b.de && min < b.ate) || null;

  /* A hora de sair pro primeiro compromisso do dia é o começo dele menos o
     trajeto. Se não sobram PREPARO_MIN entre acordar e sair, o acordar avisa
     e diz a hora que caberia. */
  const b0 = blocos[0];
  const saida0 = b0 ? b0.de - trajeto(s, b0.tipo) : null;
  const cedo = b0 && saida0 - acorda < PREPARO_MIN
    ? { ...b0, saida: saida0, sugestao: (saida0 - PREPARO_MIN + DIA_MIN) % DIA_MIN } : null;
  const itens = [{ tipo: 'acorda', id: 'acorda', min: acorda, nome: 'Acorda', cedo }];
  const semHora = [];
  habitosDoDia(s, k).forEach(h => {
    const hd = horaDoHabito(h, s, dia);
    if (hd.min == null) { semHora.push(h); return; }
    itens.push({ tipo: 'habito', id: h.id, min: hd.min, nome: h.nome, h,
      ancorado: hd.bloco || null, direto: hd.direto || null, antes: hd.antes,
      chegada: hd.chegada ?? null, atraso: !!hd.atraso, choque: choqueDe(hd.min, h.pilar, hd.bloco?.tipo) });
  });
  grupos.forEach(g => {
    const { min, onde, aperto } = horaDaRefeicao(g, s, dia);
    if (min != null) itens.push({ tipo: 'refeicao', id: 'g' + g.grupo, min, nome: g.nome, g, onde, aperto: aperto || null });
  });
  /* a saída pro estágio entra sozinha, a não ser que já exista um hábito
     preso ao estágio fazendo esse papel */
  const temSaida = habitosDoDia(s, k).some(h => h.ancora === 'estagio');
  if (!temSaida) {
    blocos.filter(b => b.tipo === 'estagio').forEach((b, i) => itens.push({
      tipo: 'saida', id: 'saida' + i, min: (b.de - trajeto(s, 'estagio') + DIA_MIN) % DIA_MIN,
      nome: 'Sai pro estágio', ate: b.de, trajeto: trajeto(s, 'estagio'),
    }));
  }
  blocos.forEach((b, i) => itens.push({
    tipo: b.tipo, id: b.tipo + i, min: b.de, ate: b.ate, nome: b.nome,
    /* aula e estágio no mesmo horário: avisa no bloco, não esconde nenhum */
    choque: blocos.find(o => o !== b && o.tipo !== b.tipo && o.de < b.ate && b.de < o.ate) || null,
  }));
  itens.push({ tipo: 'dorme', id: 'dorme', min: dorme, nome: 'Dorme' });
  /* o sort é estável: no mesmo minuto vale a ordem de cima (hábito antes de
     refeição), e acordar fica sempre no topo e dormir sempre no fim */
  const pos = it => (it.tipo === 'acorda' ? -1 : it.tipo === 'dorme' ? DIA_MIN : noDia(s, it.min));
  itens.sort((x, y) => pos(x) - pos(y));
  return { itens: itens.map(it => ({ ...it, hora: emHora(it.min) })), semHora };
}

/* qual item da linha é o de agora: o último que já começou */
export function itemDeAgora(s, itens, agora = new Date()) {
  const m = noDia(s, agora.getHours() * 60 + agora.getMinutes());
  let idx = -1;
  itens.forEach((it, i) => {
    if (it.tipo === 'dorme' ? m >= noDia(s, it.min) : it.tipo === 'acorda' || noDia(s, it.min) <= m) idx = i;
  });
  return idx;
}

/* ---- progresso ----
   O histórico começa no primeiro dia com alguma resposta. Dali pra frente,
   dia sem resposta conta como zero: deixar de abrir o app também é furar. */
export const primeiroDia = s => Object.keys(s.dias || {})
  .filter(k => Object.keys(s.dias[k] || {}).length).sort()[0] || null;

/* um dia do histórico: null antes de começar, no futuro ou sem hábito */
export function pctHistorico(s, k, ref = iso(), inicio = primeiroDia(s)) {
  if (!inicio || k < inicio || k > ref) return null;
  if (!habitosDoDia(s, k).length) return null;
  return pctDoDia(s, k);
}

/* os últimos n dias, do mais velho pro mais novo */
export function historico(s, n = 30, ref = iso()) {
  const inicio = primeiroDia(s);
  return Array.from({ length: n }, (_, i) => {
    const k = maisDias(ref, i - n + 1);
    return { k, pct: pctHistorico(s, k, ref, inicio) };
  });
}

/* média dos dias que contam, e quantos bateram a meta. Hoje fica de fora
   enquanto não bate: o dia ainda está aberto, igual na sequência. */
export function resumoDias(s, n = 7, ref = iso()) {
  const dias = historico(s, n, ref)
    .filter(d => d.pct !== null && !(d.k === ref && d.pct < s.cfg.metaDia));
  const soma = dias.reduce((t, d) => t + d.pct, 0);
  return {
    media: dias.length ? Math.round(soma / dias.length) : 0,
    bons: dias.filter(d => d.pct >= s.cfg.metaDia).length,
    contados: dias.length,
  };
}

/* a maior sequência que já teve, do primeiro dia até hoje */
export function melhorSequencia(s, ref = iso()) {
  const inicio = primeiroDia(s);
  if (!inicio) return 0;
  let melhor = 0, atual = 0;
  for (let k = inicio, guarda = 0; k <= ref && guarda < 3650; k = maisDias(k, 1), guarda++) {
    const p = diaPassou(s, k);
    if (p === true) melhor = Math.max(melhor, ++atual);
    else if (p === false && k !== ref) atual = 0;
  }
  return melhor;
}

/* cada hábito nos últimos n dias: em quantos ele valia e em quantos foi sim.
   Ordena do mais furado pro mais firme, que é o que interessa ver primeiro. */
export function placarHabitos(s, n = 30, ref = iso()) {
  const inicio = primeiroDia(s);
  if (!inicio) return [];
  return s.listas.habitos.map(h => {
    let vale = 0, sim = 0, nao = 0;
    for (let i = 0; i < n; i++) {
      const k = maisDias(ref, -i);
      if (k < inicio || !valeNoDia(h, s, k)) continue;
      const r = (s.dias[k] || {})[h.id];
      if (k === ref && !r) continue;        // hoje sem resposta ainda não é falha
      vale++;
      if (r === 'sim') sim++;
      if (r === 'nao') nao++;
    }
    return { h, vale, sim, nao, pct: vale ? Math.round((sim / vale) * 100) : 0 };
  }).filter(x => x.vale > 0).sort((a, b) => a.pct - b.pct || b.vale - a.vale);
}

/* ---- backup: o perfil inteiro num arquivo, pra não depender do navegador ---- */
export const VERSAO_BACKUP = 1;
export const paraBackup = (s, perfilId) => ({
  ritmo_backup: VERSAO_BACKUP, perfil: perfilId, nome: s.nome, exportado: iso(), estado: s,
});
/* devolve null em vez de lançar: arquivo errado não pode derrubar o app */
export function deBackup(json) {
  if (!json || json.ritmo_backup !== VERSAO_BACKUP || !json.estado) return null;
  const base = novoPerfil(json.nome || json.estado.nome || 'Pedro');
  const s = json.estado;
  return {
    ...base, ...s,
    cfg: { ...base.cfg, ...s.cfg },
    dias: s.dias || {}, extra: s.extra || {}, tx: s.tx || [],
    joelho: s.joelho || {}, volta: s.volta || {},
    listas: { ...base.listas, ...s.listas },
  };
}
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

/* ---- quanto você tem agora ----
   A pessoa diz quanto tem no bolso/conta uma vez; a partir daí cada saída
   desconta e cada entrada soma sozinha. Só conta lançamento do dia da
   conferência pra frente, senão o histórico antigo descontaria duas vezes. */
export function dinheiroAgora(s) {
  const base = Number(s.cfg.saldoBase);
  if (!Number.isFinite(base) || !s.cfg.saldoBaseEm) return null;
  const desde = s.cfg.saldoBaseEm;
  const mexido = cent(s.tx.filter(t => t.data >= desde).reduce((a, t) => a + t.v, 0));
  return { base: cent(base), desde, mexido, agora: cent(base + mexido) };
}

/* ---- chamados de TI atendidos no dia ---- */
export const chamadosDoDia = (s, ref = iso()) => Number(extraDoDia(s, ref).chamados) || 0;
export const chamadosDaSemana = (s, ref = iso()) =>
  semana(s, ref).map(d => ({ ...d, chamados: chamadosDoDia(s, d.k) }));

/* ---- cofres: objetivos de guardar dinheiro ----
   Não existe caixa paralelo. Guardar é uma saída marcada com o cofre, tirar é
   uma entrada marcada com ele. O guardado é a soma invertida desses lançamentos,
   então o extrato e o cofre nunca podem discordar. */
export const guardado = (tx, cofreId) =>
  cent(tx.filter(t => t.cofre === cofreId).reduce((a, t) => a - t.v, 0));

export function cofre(c, tx, ref = iso()) {
  const alvo = Number(c.alvo) || 0;
  const tem = guardado(tx, c.id);
  const falta = cent(Math.max(0, alvo - tem));
  const base = { ...c, alvo, tem, falta, pct: alvo ? Math.min(100, Math.round((tem / alvo) * 100)) : 0 };
  if (!c.ate) return base;
  const dias = diasEntre(ref, c.ate);
  const meses = Math.max(1, Math.ceil(dias / 30));
  return { ...base, dias, porMes: dias > 0 ? cent(falta / meses) : null, venceu: dias < 0 };
}
export const cofres = (s, ref = iso()) => (s.listas.cofres || []).map(c => cofre(c, s.tx, ref));

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
  garrafas: 6,        // usado só enquanto não há pesagem registrada
  mlGarrafa: 500,
  mlPorKg: 45,        // o plano pede de 45 a 50 ml por quilo
  horasSemana: 30,    // meta de horas de estágio na semana
  saldoBase: '',      // quanto a pessoa disse que tinha, e quando
  saldoBaseEm: '',
  acorda: '07:00',    // hora de acordar; a de dormir sai dela (8 h antes)
  trajetoEstagio: 30,   // min de porta a porta até o estágio
  trajetoFaculdade: 30, // min de casa até a faculdade
  trajetoEstagioFac: '', // min do estágio até a faculdade; em branco usa o de casa
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
    turnos: [],    // horário do estágio
    treinos: [],   // rotinas importadas de fora; vazio até alguém importar
    testes: [],    // autotestes de simetria entre as pernas
    cofres: [],    // objetivos de guardar dinheiro
    orientacoes: [],  // recados do plano que não são refeição (creatina etc.)
    cats: ['Alimentação', 'Transporte', 'Academia', 'Faculdade', 'Lazer', 'Renda']
      .map(n => ({ id: novoId(), nome: n })),
    split: DIAS_SEMANA.map(d => ({ id: d.toLowerCase(), nome: d, meta: '', treinoId: '' })),
  },
});

/* Mudanças que a pessoa pediu pro próprio perfil e que precisam chegar ao
   dado já salvo no aparelho. Cada uma roda uma vez só (fica anotada em
   `aplicados`), então mudar de novo pela tela depois vale normalmente. */
export const AJUSTES_PEDIDOS = {
  pedro: [
    { id: 'acorda-0600', cfg: { acorda: '06:00' } },
    /* terça e sexta: café no estágio, almoço na faculdade */
    /* ônibus pra outra cidade: 40 a 50 min do ponto até o estágio */
    { id: 'trajeto-onibus', cfg: { trajetoEstagio: 50 } },
    /* mais 10 min de casa até o ponto: 60 de porta a porta */
    { id: 'trajeto-ate-o-ponto', cfg: { trajetoEstagio: 60 } },
    /* a faculdade é na cidade de casa: do estágio até ela é o ônibus de volta */
    { id: 'faculdade-na-minha-cidade', cfg: { trajetoEstagioFac: 60 } },
    { id: 'refeicoes-dia-de-aula', refeicoes: { cafe: { ondeAula: 'estagio' }, almoco: { ondeAula: 'faculdade' } } },
  ],
};
export function aplicarPedidos(id, s) {
  const feitos = s.aplicados || [];
  const novos = (AJUSTES_PEDIDOS[id] || []).filter(x => !feitos.includes(x.id));
  if (!novos.length) return s;
  return novos.reduce((acc, x) => ({
    ...acc,
    cfg: { ...acc.cfg, ...(x.cfg || {}) },
    listas: !x.refeicoes ? acc.listas : {
      ...acc.listas,
      /* só preenche quem ainda não escolheu: não desfaz edição feita na mão */
      refeicoes: (acc.listas.refeicoes || []).map(r => {
        const patch = x.refeicoes[r.grupo];
        if (!patch) return r;
        return { ...r, ...Object.fromEntries(Object.entries(patch).filter(([k]) => !(k in r))) };
      }),
    },
  }), { ...s, aplicados: [...feitos, ...novos.map(x => x.id)] });
}
export function carregarPerfil(id) {
  const base = novoPerfil((PERFIS.find(p => p.id === id) || { nome: 'Pedro' }).nome);
  try {
    const bruto = localStorage.getItem(chaveDe(id));
    if (!bruto) return aplicarPedidos(id, base);
    const s = JSON.parse(bruto);
    return aplicarPedidos(id, {
      ...base, ...s,
      cfg: { ...base.cfg, ...s.cfg },
      dias: s.dias || {}, extra: s.extra || {}, tx: s.tx || [],
      joelho: s.joelho || {}, volta: s.volta || {}, modo: s.modo || 'aula',
      listas: migrarListas({ ...base.listas, ...s.listas }),
    });
  } catch {
    return base;          // storage bloqueado ou JSON corrompido: começa limpo
  }
}
/* O "Sai pra faculdade" do plano embutido nasceu com 08:00 fixo. Quem já
   tinha aplicado o plano passa a ter ele preso à aula: some nos dias sem aula
   e anda junto com a aula nos outros. Só mexe em quem nunca escolheu. */
export function migrarListas(listas) {
  return {
    ...listas,
    habitos: (listas.habitos || []).map(h => (h.pilar === 'fac' && h.nome === 'Sai pra faculdade' && !('ancora' in h)
      ? { ...h, ancora: 'aula', antes: ANTES_PADRAO } : h)),
  };
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
