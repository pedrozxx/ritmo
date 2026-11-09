/* Ritmo — gera o arquivo de calendário (.ics) dos avisos.
   É o único jeito de avisar com o app fechado: quem toca o alarme é o sistema,
   não o PWA. Mesmo truque do scripts/avisos.mjs do Volta ao Campo.
   Tudo função pura; testado em check.mjs. */
import { iso, maisDias, diaIdx, DIAS_SEMANA, horaDoHabito, emHora } from './store.js';
import { DIAS_RETESTE, ultimoTeste } from './joelho.js';

/* 0 = SEG … 6 = DOM, igual ao split e ao campo `dias` do hábito */
const DIA_ICS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

/* RFC 5545: vírgula, ponto e vírgula e barra invertida são especiais */
export const escapar = t => String(t ?? '')
  .replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\r?\n/g, '\\n');

/* RFC 5545: linha passa de 75 OCTETOS, dobra com um espaço na frente.
   Conta byte e não caractere — "ã" ocupa dois — e percorre por code point,
   pra nunca cortar um caractere no meio. */
const octetos = t => new TextEncoder().encode(t).length;
export function dobrar(linha, limite = 75) {
  if (octetos(linha) <= limite) return [linha];
  const out = [];
  let atual = '';
  for (const ch of linha) {
    if (octetos(atual + ch) > limite) { out.push(atual); atual = ' '; }
    atual += ch;
  }
  if (atual.trim()) out.push(atual);
  return out;
}

/** "08:00", "08h00" e "8h" viram "080000"; o resto vira null */
export function horaIcs(txt) {
  const m = String(txt ?? '').trim().match(/^(\d{1,2})\s*[:h]\s*(\d{2})?$/i);
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2] ?? 0);
  if (h > 23 || min > 59) return null;
  return String(h).padStart(2, '0') + String(min).padStart(2, '0') + '00';
}

const semData = k => k.replace(/-/g, '');

/* Âncora do evento semanal: o primeiro dia escolhido, a partir da segunda
   desta semana. DTSTART num dia que não está no BYDAY confunde calendário. */
function ancora(dias, ref) {
  const segunda = maisDias(ref, -diaIdx(ref));
  return maisDias(segunda, dias.length ? Math.min(...dias) : 0);
}

/** um hábito com hora e dias vira um evento semanal recorrente */
export function eventoDoHabito(h, ref = iso()) {
  const hora = horaIcs(h.hora);
  if (!hora) return null;
  const dias = (h.dias && h.dias.length ? h.dias : [0, 1, 2, 3, 4, 5, 6]).slice().sort((a, b) => a - b);
  return {
    uid: `ritmo-h-${h.id}@ritmo`,
    inicio: `${semData(ancora(dias, ref))}T${hora}`,
    rrule: `FREQ=WEEKLY;BYDAY=${dias.map(d => DIA_ICS[d]).join(',')}`,
    titulo: h.nome,
    desc: [h.meta, h.modo === 'aula' ? 'Só na semana com aula.' : h.modo === 'ferias' ? 'Só na semana sem aula.' : '']
      .filter(Boolean).join(' '),
  };
}

/** o reteste do joelho, a cada 28 dias a partir do último teste */
export function eventoDoReteste(testes = [], ref = iso()) {
  const u = ultimoTeste(testes);
  const base = u ? maisDias(u.data, DIAS_RETESTE) : ref;
  return {
    uid: `ritmo-reteste-${semData(base)}@ritmo`,
    inicio: `${semData(base)}T090000`,
    rrule: `FREQ=DAILY;INTERVAL=${DIAS_RETESTE}`,
    titulo: 'Autoteste do joelho',
    desc: 'Os três testes até falhar em cada perna: levantar da cadeira, ponte e panturrilha. '
      + 'Anote as repetições boas na aba Joelho. A data anda a cada teste: gere o arquivo de novo depois.',
  };
}

export function montarIcs(eventos, nome = 'Ritmo') {
  const linhas = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Ritmo//Avisos//PT', 'CALSCALE:GREGORIAN',
    `X-WR-CALNAME:${escapar(nome)}`,
  ];
  eventos.forEach(e => {
    linhas.push('BEGIN:VEVENT', `UID:${e.uid}`, `DTSTART:${e.inicio}`, `RRULE:${e.rrule}`,
      `SUMMARY:${escapar(e.titulo)}`);
    if (e.desc) linhas.push(`DESCRIPTION:${escapar(e.desc)}`);
    linhas.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapar(e.titulo)}`,
      'TRIGGER:PT0S', 'END:VALARM', 'END:VEVENT');
  });
  linhas.push('END:VCALENDAR');
  /* CRLF é o que a norma pede, e é o que o iPhone lê sem reclamar.
     `flatMap(dobrar)` não serve: passaria o índice como limite. */
  return linhas.flatMap(l => dobrar(l)).join('\r\n') + '\r\n';
}

/* Os avisos deste perfil: os hábitos que têm horário, mais o reteste do
   joelho quando há plano de treino. Hábito sem hora fica de fora e é
   contado em `semHora` — não invento horário pra ninguém. */
export function avisosDoPerfil(s, ref = iso()) {
  /* hábito preso à aula ou ao estágio tem um horário por dia: vira um
     evento por dia da semana, cada um na hora certa daquele dia */
  const habitos = (s.listas.habitos || []).filter(h => !h.modo || h.modo === (s.modo || 'aula'))
    .flatMap(h => {
      if (!h.ancora) return [h];
      const porDia = DIAS_SEMANA.map((_, d) => [d, horaDoHabito(h, s, d)]).filter(([, x]) => x && x.bloco);
      if (!porDia.length) return [h];          // sem horário de aula/estágio: fica o fixo
      return porDia.map(([d, x]) => ({ ...h, id: `${h.id}-${d}`, hora: emHora(x.min), dias: [d] }));
    });
  const eventos = [];
  let semHora = 0;
  habitos.forEach(h => {
    const e = eventoDoHabito(h, ref);
    if (e) eventos.push(e); else semHora++;
  });
  if ((s.listas.treinos || []).length) eventos.push(eventoDoReteste(s.listas.testes, ref));
  const modo = (s.modo || 'aula') === 'aula' ? 'com aula' : 'sem aula';
  return { eventos, semHora, texto: montarIcs(eventos, `Ritmo · ${s.nome} · ${modo}`) };
}

export const DIAS_ROTULO = DIAS_SEMANA;
