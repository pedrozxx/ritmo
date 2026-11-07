/* As telas do Ritmo. Cada uma recebe o estado salvo (s) e as ações (a). */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as D from './store.js';
import { Card, CARD, Ring, Barra, Habito, Check, Pill, Ico, Numero, Vazio, MOLA_CALMA } from './ui.jsx';

/* Conteúdo de apoio das telas — uma fonte só, usada em mais de um lugar.
   Editar matéria, exercício e entrega pela interface ficou pra fase 2. */
const SPLIT = [['SEG', 'Push A'], ['TER', 'Pull A'], ['QUA', 'Legs'], ['QUI', 'Push B'], ['SEX', 'Pull B'], ['SÁB', 'Cardio'], ['DOM', 'Folga']];
const EXERCICIOS = [
  ['Supino inclinado', '4 × 8 · halteres de 32 kg'],
  ['Desenvolvimento militar', '3 × 10 · 18 kg'],
  ['Crucifixo na máquina', '3 × 12 · placa 7'],
  ['Tríceps na corda', '4 × 12 · 25 kg'],
  ['Elevação lateral', '4 × 15 · 8 kg'],
];
const MATERIAS = [
  ['Cálculo III', '88% de presença · 3 faltas', '7,5', 'neutral'],
  ['Banco de Dados', '95% de presença · 1 falta', '8,8', 'ok'],
  ['Engenharia de Software', '100% de presença', '9,2', 'ok'],
  ['Redes de Computadores', '82% de presença · 5 faltas', '6,9', 'warn'],
];
const ENTREGAS = [
  ['Lista 7 de Cálculo III', 'Amanhã às 23h59', 'warn', '1 dia'],
  ['Prova 2 de Banco de Dados', '12/11 · 19h10 · sala B204', 'lilac', '6 dias'],
  ['Trabalho de Redes', '18/11 · em grupo de 4', 'neutral', '12 dias'],
];
const TAREFAS_EST = [
  ['Ajustar o endpoint de relatório', 'Fechado às 11h40'],
  ['Review do PR #214', 'Aprovado com 2 comentários'],
  ['Subir o dump do banco de homolog', 'Combinado pra amanhã'],
];
const HORAS_SEMANA = [['Segunda', 6], ['Terça', 6], ['Quarta', 5.5], ['Quinta', 6.5], ['Sexta', 0]];
const VOLUME = [68, 74, 71, 80, 77, 84, 86];

const Banner = ({ s, a }) => s.exemplo ? (
  <motion.div className="banner" variants={CARD}>
    Dados de exemplo pra você ver o app cheio.
    <button onClick={a.limparExemplo}>Limpar</button>
  </motion.div>
) : null;

const Semaninha = ({ dias }) => (
  <div className="week">
    {dias.map(d => {
      const fill = d.pct === null ? 'none' : d.pct >= 95 ? 'full' : d.pct > 0 ? 'part' : 'none';
      return (
        <div className={`day ${d.hoje ? 'now' : ''}`} key={d.k}>
          <b>{d.nome}</b>
          <div className="dot" data-fill={fill}>{d.pct === null ? '·' : d.pct}</div>
        </div>
      );
    })}
  </div>
);

/* ================= Hoje ================= */
function Hoje({ s, a }) {
  const hoje = D.iso();
  const resp = s.dias[hoje] || {};
  const p = D.pctDia(resp);
  const sim = Object.values(resp).filter(v => v === 'sim').length;
  const nao = Object.values(resp).filter(v => v === 'nao').length;
  const pendentes = D.HABITOS.filter(h => !resp[h.id]);
  const c = D.ciclo(s, hoje);
  const mes = D.doMes(s.tx, hoje);
  const { entradas, saidas, saldo } = D.caixa(mes);
  const macros = D.macrosDoDia(s, hoje);

  return (
    <>
      <Banner s={s} a={a} />

      <Card>
        <div className="today">
          <Ring pct={p} sub="do dia" />
          <div className="today-txt">
            <h2>{sim} de {D.HABITOS.length} em pé</h2>
            <p>
              {nao > 0 && `${nao} marcado como não. `}
              {pendentes.length > 0 ? `Faltam ${pendentes.length} respostas.` : 'Dia respondido inteiro.'}
            </p>
            <button className="link" style={{ marginTop: 6 }} onClick={() => a.go('percurso')}>
              Dia {c.dia} de {D.CICLO_DIAS} · fase {c.fase.nome} <Ico n="seta" s={14} />
            </button>
          </div>
        </div>
        <div className="mini-rings">
          {D.PILARES.map((pl, i) => (
            <div className="mini" key={pl.id}>
              <Ring pct={D.pctPilar(resp, pl)} size={42} sw={5} atraso={.16 + i * .07} />
              <b>{pl.nome}</b>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="card-head">
          <h2>{pendentes.length > 0 ? 'Falta responder' : 'Checklist de hoje'}</h2>
          <span className="more">Sim · Não</span>
        </div>
        {pendentes.length === 0
          ? <Vazio titulo="Dia fechado" texto="Todos os itens respondidos. Dá pra mudar qualquer resposta na Rotina." />
          : (
            <div className="habits">
              <AnimatePresence initial={false} mode="popLayout">
                {pendentes.slice(0, 6).map(h => (
                  <motion.div className="habit-wrap" key={h.id} layout
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 60, transition: { duration: .22 } }}
                    transition={MOLA_CALMA}>
                    <Habito h={h} estado={resp[h.id]} onPick={v => a.marcar(h.id, v)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        <div className="sep" />
        <button className="link" onClick={() => a.go('rotina')}>
          {pendentes.length > 6 ? `Mais ${pendentes.length - 6} pendentes · ver a rotina completa` : 'Ver a rotina completa'}
          <Ico n="seta" s={15} />
        </button>
      </Card>

      <Card>
        <div className="card-head"><h2>Semana</h2><span className="more">meta de {D.META_DIA}% por dia</span></div>
        <Semaninha dias={D.semana(s.dias, hoje)} />
      </Card>

      <Card>
        <div className="card-head"><h2>Dieta de hoje</h2><button className="more" onClick={() => a.go('dieta')}>Dieta</button></div>
        <div className="today">
          <Ring pct={Math.round(macros.feitas / macros.total * 100)} size={64} sw={7} sub="refeições" />
          <div className="today-txt">
            <h2 style={{ fontSize: 16 }}>{macros.prot} g de proteína</h2>
            <p>{macros.feitas} de {macros.total} refeições · {macros.kcal.toLocaleString('pt-BR')} kcal de {D.META_KCAL.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="card-head"><h2>Este mês</h2><button className="more" onClick={() => a.go('financeiro')}>Financeiro</button></div>
        {mes.length === 0
          ? <Vazio titulo="Nada lançado ainda" texto="Abra o Financeiro e toque em Lançamento." />
          : (
            <>
              <div className="balance">
                <div><span className="label">Saldo do mês</span><div className="big">{D.brl(saldo)}</div></div>
                <Pill t={saldo >= 0 ? 'no positivo' : 'no vermelho'} cor={saldo >= 0 ? 'ok' : 'warn'} />
              </div>
              <div className="flow">
                <div className="in"><span className="label">Entrou</span><b>+ {D.brl(entradas)}</b></div>
                <div className="out"><span className="label">Saiu</span><b>− {D.brl(saidas)}</b></div>
              </div>
            </>
          )}
      </Card>

      <Card>
        <div className="card-head"><h2>Tarefas da semana</h2><button className="more" onClick={() => a.go('metas')}>Metas</button></div>
        {ENTREGAS.map(([n, sub, cor, tag]) => (
          <div className="row" key={n}>
            <div className="row-txt"><b>{n}</b><span>{sub}</span></div>
            <Pill t={tag} cor={cor} />
          </div>
        ))}
      </Card>
    </>
  );
}

/* ================= Percurso (ciclo de 90 dias) ================= */
function Percurso({ s, a }) {
  const c = D.ciclo(s);
  const ad = D.aderencia(s);
  const semanas = D.semanasDoCiclo(s);
  return (
    <>
      <Card>
        <div className="today">
          <Ring pct={c.pct} sub={`dia ${c.dia}`} />
          <div className="today-txt">
            <h2>Fase {c.fase.nome} · {c.fase.lema}</h2>
            <p>
              {c.terminou
                ? `Ciclo fechado em ${D.dataCurta(c.fim)}.`
                : `Semana ${c.semana} de 13 · restam ${c.restam} ${c.restam === 1 ? 'dia' : 'dias'}.`}
              {' '}De {D.dataCurta(c.inicio)} a {D.dataCurta(c.fim)}.
            </p>
          </div>
        </div>
        <div className="sep" />
        <span className="label">As 13 semanas</span>
        <div className="semanas" style={{ marginTop: 8 }}>
          {semanas.map(w => (
            <div key={w.semana} className={`sem ${w.atual ? 'atual' : ''}`}
              data-fill={w.pct === null ? 'none' : w.pct >= 80 ? 'full' : w.pct > 0 ? 'part' : 'none'}
              title={`Semana ${w.semana}${w.pct === null ? '' : ` · ${w.pct}%`}`}>
              {w.semana}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="card-head"><h2>Aderência do ciclo</h2><span className="more num">{ad.pct}%</span></div>
        <div className="balance">
          <div>
            <span className="label">Dias em pé</span>
            <div className="big">{ad.bons}<span style={{ fontSize: 18, color: 'var(--ink-3)' }}>/{ad.contados}</span></div>
          </div>
          <Pill t={ad.pct >= 80 ? 'no rumo' : ad.pct >= 60 ? 'dá pra apertar' : 'atrasado'}
            cor={ad.pct >= 80 ? 'ok' : ad.pct >= 60 ? 'lilac' : 'warn'} />
        </div>
        <div style={{ marginTop: 12 }}><Barra pct={ad.pct} /></div>
        <p style={{ margin: '10px 2px 0', fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.45 }}>
          Um dia entra na conta com {D.META_DIA}% ou mais da rotina respondida como “Sim”.
        </p>
      </Card>

      {D.FASES.map(f => {
        const atual = f.id === c.fase.id;
        const passou = c.dia > f.ate;
        const metas = D.metasDaFase(s, f.id);
        return (
          <Card key={f.id}>
            <div className={`fase ${atual ? 'atual' : ''}`}>
              <div className="fase-top">
                <b>{f.nome}</b>
                <Pill t={atual ? `você está aqui` : passou ? 'fechada' : `dia ${f.de} a ${f.ate}`}
                  cor={atual ? 'lilac' : passou ? 'ok' : 'neutral'} />
              </div>
              <p>{f.foco}</p>
              {metas.map((m, i) => {
                const { p, sub } = D.progresso(m, s);
                return (
                  <div className="goal" key={m.id} style={{ marginTop: i ? 14 : 0 }}>
                    <div className="goal-top">
                      <b style={{ fontSize: 13 }}>{m.nome}</b>
                      <span className="num" style={{ fontSize: 11.5 }}><Numero valor={p} /></span>
                    </div>
                    <Barra pct={p} rosa={p < 100} atraso={i * .06} />
                    <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{sub}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {c.terminou && (
        <Card>
          <div className="card-head"><h2>90 dias fechados</h2></div>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            Você fechou o ciclo com {ad.bons} de {ad.contados} dias em pé. O próximo começa hoje e o
            histórico fica guardado.
          </p>
          <button className="btn-primary" onClick={a.reiniciarCiclo}>Começar o próximo ciclo</button>
        </Card>
      )}
    </>
  );
}

/* ================= Rotina ================= */
function Rotina({ s, a }) {
  const resp = s.dias[D.iso()] || {};
  return (
    <>
      <Card style={{ background: 'transparent', boxShadow: 'none', padding: '2px 4px' }}>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--ink-3)' }}>
          Responda <b style={{ color: 'var(--lilac)' }}>Sim</b> ou <b style={{ color: 'var(--rose)' }}>Não</b> em cada
          item. O que fica sem resposta não conta como falha — só como pendente.
        </p>
      </Card>
      {D.PILARES.map(pl => (
        <Card key={pl.id}>
          <div className="card-head">
            <h2><Ico n={pl.icon} s={17} /> {pl.nome}</h2>
            <Pill t={`${pl.itens.filter(i => resp[i.id] === 'sim').length}/${pl.itens.length}`}
              cor={D.pctPilar(resp, pl) === 100 ? 'ok' : 'neutral'} />
          </div>
          <div className="habits">
            {pl.itens.map(h => <Habito key={h.id} h={h} estado={resp[h.id]} onPick={v => a.marcar(h.id, v)} />)}
          </div>
        </Card>
      ))}
    </>
  );
}

/* ================= Academia ================= */
function Academia({ s, a }) {
  const resp = s.dias[D.iso()] || {};
  const ex = D.extraDoDia(s);
  const pl = D.pilar('gym');
  const treinos = D.contarHabito(s.dias, 'treino');
  const alvo = (s.metas.find(m => m.id === 'treinos') || { alvo: 20 }).alvo;
  const hojeIdx = (new Date().getDay() + 6) % 7;
  return (
    <>
      <Card>
        <div className="today">
          <Ring pct={Math.min(100, Math.round(treinos / alvo * 100))} size={76} sub={`${treinos}/${alvo}`} />
          <div className="today-txt">
            <h2>{treinos} {treinos === 1 ? 'treino' : 'treinos'} no mês</h2>
            <p>Meta do mês: {alvo} treinos. Contado do próprio checklist, não na mão.</p>
          </div>
        </div>
        <div className="sep" />
        <span className="label">Divisão da semana</span>
        <div className="split" style={{ marginTop: 8 }}>
          {SPLIT.map(([d, t], i) => <div key={d} className={i === hojeIdx ? 'now' : ''}><b>{d}</b>{t}</div>)}
        </div>
      </Card>

      <Card>
        <div className="card-head"><h2>Treino de hoje · {SPLIT[hojeIdx][1]}</h2><Pill t={`${EXERCICIOS.length} exercícios`} cor="lilac" /></div>
        {EXERCICIOS.map(([n, sub], i) => (
          <div className="row" key={n}>
            <Check on={ex['ex' + i]} onClick={() => a.toggleExtra('ex' + i)} label={n} />
            <div className="row-txt"><b>{n}</b><span>{sub}</span></div>
          </div>
        ))}
        <div className="sep" />
        <div className="habits">
          {pl.itens.map(h => <Habito key={h.id} h={h} estado={resp[h.id]} onPick={v => a.marcar(h.id, v)} />)}
        </div>
      </Card>

      <Card>
        <div className="card-head"><h2>Carga no supino</h2><span className="more num">+6 kg em 7 semanas</span></div>
        <svg className="spark" viewBox="0 0 300 46" preserveAspectRatio="none"
          aria-label="Carga no supino subindo de 26 a 32 quilos em sete semanas">
          <path className="line" d="M6 38 L54 34 L102 30 L150 31 L198 22 L246 16 L294 8" />
          <circle cx="294" cy="8" r="4" />
        </svg>
        <div className="week" style={{ marginTop: 8 }}>
          {VOLUME.map((v, i) => <div className="day" key={i}><b>{v}</b></div>)}
        </div>
        <span className="label" style={{ display: 'block', marginTop: 6 }}>Volume por semana, em % do melhor</span>
      </Card>
    </>
  );
}

/* ================= Dieta ================= */
function Dieta({ s, a }) {
  const resp = s.dias[D.iso()] || {};
  const ex = D.extraDoDia(s);
  const pl = D.pilar('diet');
  const m = D.macrosDoDia(s);
  const litros = (m.agua * D.ML_GARRAFA / 1000).toFixed(1).replace('.', ',');
  const alvoLitros = (D.GARRAFAS * D.ML_GARRAFA / 1000).toFixed(1).replace('.', ',');
  const ad = D.aderenciaPilar(s.dias, pl);
  return (
    <>
      <Card>
        <div className="today">
          <Ring pct={Math.round(m.feitas / m.total * 100)} sub="refeições" />
          <div className="today-txt">
            <h2>{m.prot} g de proteína</h2>
            <p>{m.feitas} de {m.total} refeições marcadas. Os gramas saem das refeições que você marcou.</p>
          </div>
        </div>
        <div className="sep" />
        <div className="bars">
          <div className="bar-row">
            <span>Proteína</span><span className="v">{m.prot} g de {D.META_PROTEINA} g</span>
            <Barra pct={Math.min(100, m.prot / D.META_PROTEINA * 100)} />
          </div>
          <div className="bar-row">
            <span>Calorias</span><span className="v">{m.kcal.toLocaleString('pt-BR')} de {D.META_KCAL.toLocaleString('pt-BR')} kcal</span>
            <Barra pct={Math.min(100, m.kcal / D.META_KCAL * 100)} atraso={.07} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="card-head"><h2>Refeições de hoje</h2><Pill t={`${m.feitas}/${m.total}`} cor={m.feitas === m.total ? 'ok' : 'neutral'} /></div>
        {D.REFEICOES.map((r, i) => (
          <div className="row" key={r.nome}>
            <Check on={ex['rf' + i]} onClick={() => a.toggleExtra('rf' + i)} label={r.nome} />
            <div className="row-txt"><b>{r.nome} · {r.hora}</b><span>{r.o}</span></div>
            <span className="tx-v">{r.prot} g</span>
          </div>
        ))}
      </Card>

      <Card>
        <div className="card-head">
          <h2>Água</h2>
          <span className="more num">{litros} L de {alvoLitros} L</span>
        </div>
        <div className="aguas">
          {Array.from({ length: D.GARRAFAS }, (_, i) => (
            <motion.button key={i} className="garrafa" whileTap={{ scale: .92 }}
              aria-pressed={i < m.agua} aria-label={`${i + 1}ª garrafa de ${D.ML_GARRAFA} ml`}
              onClick={() => a.setExtra('agua', m.agua === i + 1 ? i : i + 1)}>
              <motion.i initial={false} animate={{ scaleY: i < m.agua ? 1 : 0 }} transition={MOLA_CALMA} />
            </motion.button>
          ))}
        </div>
        <span className="label" style={{ display: 'block', marginTop: 10 }}>
          {D.GARRAFAS} garrafas de {D.ML_GARRAFA} ml · toque pra encher, toque de novo pra desfazer
        </span>
      </Card>

      <Card>
        <div className="card-head"><h2>Rotina da dieta</h2><Pill t={`${ad.bons}/${ad.n} dias`} cor={ad.bons >= 6 ? 'ok' : 'neutral'} /></div>
        <div className="habits">
          {pl.itens.map(h => <Habito key={h.id} h={h} estado={resp[h.id]} onPick={v => a.marcar(h.id, v)} />)}
        </div>
      </Card>

      <Card>
        <div className="card-head"><h2>Aderência da semana</h2><span className="more num">{ad.pct}%</span></div>
        <Semaninha dias={D.semanaPilar(s.dias, pl)} />
      </Card>
    </>
  );
}

/* ================= Faculdade ================= */
function Faculdade({ s, a }) {
  const resp = s.dias[D.iso()] || {};
  const pl = D.pilar('fac');
  return (
    <>
      <Card>
        <div className="today">
          <Ring pct={91} size={76} sub="presença" />
          <div className="today-txt">
            <h2>{MATERIAS.length} matérias no semestre</h2>
            <p>Média parcial de 8,1. Nenhuma matéria passou do limite de faltas.</p>
          </div>
        </div>
      </Card>
      <Card>
        <div className="card-head"><h2>Matérias</h2><span className="more">2026.2</span></div>
        {MATERIAS.map(([n, sub, nota, cor]) => (
          <div className="row" key={n}>
            <div className="row-txt"><b>{n}</b><span>{sub}</span></div>
            <span className={`pill ${cor} num`}>{nota}</span>
          </div>
        ))}
      </Card>
      <Card>
        <div className="card-head"><h2>Próximas entregas</h2><span className="more">{ENTREGAS.length} abertas</span></div>
        {ENTREGAS.map(([n, sub, cor, tag]) => (
          <div className="row" key={n}>
            <div className="row-txt"><b>{n}</b><span>{sub}</span></div>
            <Pill t={tag} cor={cor} />
          </div>
        ))}
      </Card>
      <Card>
        <div className="card-head"><h2>Rotina da faculdade</h2></div>
        <div className="habits">
          {pl.itens.map(h => <Habito key={h.id} h={h} estado={resp[h.id]} onPick={v => a.marcar(h.id, v)} />)}
        </div>
      </Card>
    </>
  );
}

/* ================= Estágio ================= */
function Estagio({ s, a }) {
  const resp = s.dias[D.iso()] || {};
  const ex = D.extraDoDia(s);
  const pl = D.pilar('est');
  const feitas = HORAS_SEMANA.reduce((t, [, h]) => t + h, 0);
  const maxDia = Math.max(...HORAS_SEMANA.map(([, h]) => h));
  return (
    <>
      <Card>
        <div className="today">
          <Ring pct={Math.round(feitas / 30 * 100)} sub={`${feitas}h/30h`} />
          <div className="today-txt">
            <h2>Semana em {String(feitas).replace('.', ',')} horas</h2>
            <p>Faltam {String(30 - feitas).replace('.', ',')}h pra fechar as 30h. Banco de horas em <b className="num">+3h20</b>.</p>
          </div>
        </div>
        <div className="flow">
          <div className="in"><span className="label">Entrada de hoje</span><b>09:00</b></div>
          <div><span className="label">Saída de hoje</span><b style={{ color: 'var(--ink)' }}>15:30</b></div>
        </div>
      </Card>
      <Card>
        <div className="card-head">
          <h2>Tarefas do board</h2>
          <Pill t={`${TAREFAS_EST.filter((_, i) => ex['tf' + i]).length} fechadas`} cor="ok" />
        </div>
        {TAREFAS_EST.map(([n, sub], i) => (
          <div className="row" key={n}>
            <Check on={ex['tf' + i]} onClick={() => a.toggleExtra('tf' + i)} label={n} />
            <div className="row-txt"><b>{n}</b><span>{sub}</span></div>
          </div>
        ))}
      </Card>
      <Card>
        <div className="card-head"><h2>Horas por dia</h2><span className="more num">meta de 6h</span></div>
        <div className="bars">
          {HORAS_SEMANA.map(([d, h], i) => (
            <div className="bar-row" key={d}>
              <span>{d}</span>
              <span className="v">{h ? String(h).replace('.', ',') + 'h' : '—'}</span>
              <Barra pct={h / maxDia * 100} atraso={i * .07} />
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="card-head"><h2>Rotina do estágio</h2></div>
        <div className="habits">
          {pl.itens.map(h => <Habito key={h.id} h={h} estado={resp[h.id]} onPick={v => a.marcar(h.id, v)} />)}
        </div>
      </Card>
    </>
  );
}

/* ================= Financeiro ================= */
function Financeiro({ s, a }) {
  const resp = s.dias[D.iso()] || {};
  const pl = D.pilar('fin');
  const mes = D.doMes(s.tx);
  const { entradas, saidas, saldo } = D.caixa(mes);
  const cats = D.porCategoria(mes);
  const max = cats.length ? cats[0][1] : 1;
  return (
    <>
      <Banner s={s} a={a} />
      <Card>
        <div className="balance">
          <div><span className="label">Saldo do mês</span><div className="big">{D.brl(saldo)}</div></div>
          <Pill t={saldo >= 0 ? 'no positivo' : 'no vermelho'} cor={saldo >= 0 ? 'ok' : 'warn'} />
        </div>
        <div className="flow">
          <div className="in"><span className="label">Recebi</span><b>+ {D.brl(entradas)}</b></div>
          <div className="out"><span className="label">Gastei</span><b>− {D.brl(saidas)}</b></div>
        </div>
      </Card>

      {cats.length > 0 && (
        <Card>
          <div className="card-head"><h2>Pra onde foi</h2><span className="more num">{cats.length} categorias</span></div>
          <div className="bars">
            {cats.map(([n, v], i) => (
              <div className="bar-row" key={n}>
                <span>{n}</span><span className="v">− {D.brl(v)}</span>
                <Barra pct={v / max * 100} rosa={i === 0} atraso={i * .07} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="card-head"><h2>Lançamentos</h2><span className="more num">{mes.length} no mês</span></div>
        {mes.length === 0
          ? <Vazio titulo="Nenhum lançamento" texto="Toque em Lançamento pra registrar o primeiro gasto ou recebimento." />
          : mes.map(t => (
            <div className="tx" key={t.id}>
              <div className={`tx-ic ${t.v > 0 ? 'pos' : 'neg'}`}><Ico n={t.v > 0 ? 'sobe' : 'desce'} s={16} /></div>
              <div className="tx-txt"><b>{t.desc}</b><span>{D.rotuloData(t.data)} · {t.cat} · {t.meio}</span></div>
              <div className={`tx-v ${t.v > 0 ? 'pos' : 'neg'}`}>{t.v > 0 ? '+ ' : '− '}{D.brl(t.v)}</div>
            </div>
          ))}
      </Card>

      <Card>
        <div className="card-head"><h2>Rotina financeira</h2></div>
        <div className="habits">
          {pl.itens.map(h => <Habito key={h.id} h={h} estado={resp[h.id]} onPick={v => a.marcar(h.id, v)} />)}
        </div>
      </Card>
    </>
  );
}

/* ================= Metas ================= */
function Metas({ s, a }) {
  const c = D.ciclo(s);
  return (
    <>
      <Card style={{ background: 'transparent', boxShadow: 'none', padding: '2px 4px' }}>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--ink-3)' }}>
          Cada meta está ancorada numa fase do ciclo de {D.CICLO_DIAS} dias. Você está no{' '}
          <b style={{ color: 'var(--lilac)' }}>dia {c.dia}, fase {c.fase.nome}</b>.{' '}
          <button className="link" style={{ display: 'inline-flex' }} onClick={() => a.go('percurso')}>Ver o percurso</button>
        </p>
      </Card>
      {s.metas.map((m, i) => {
        const { p, sub } = D.progresso(m, s);
        const fase = D.FASES.find(f => f.id === m.fase);
        return (
          <Card key={m.id}>
            <div className="goal">
              <div className="goal-top">
                <b>{m.nome}</b>
                <Pill t={p >= 100 ? 'batida' : fase ? `fase ${fase.nome}` : ''}
                  cor={p >= 100 ? 'ok' : m.fase === c.fase.id ? 'lilac' : 'neutral'} />
              </div>
              <Barra pct={p} rosa={p < 100} atraso={i * .05} />
              <div className="goal-top">
                <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{sub}</span>
                <span className="num" style={{ fontSize: 12 }}><Numero valor={p} /></span>
              </div>
            </div>
          </Card>
        );
      })}
    </>
  );
}

/* ================= Ajustes ================= */
function Ajustes({ s, a }) {
  const [confirmar, setConfirmar] = useState(false);
  const [confirmarCiclo, setConfirmarCiclo] = useState(false);
  const c = D.ciclo(s);
  const temas = [['sistema', 'Sistema'], ['claro', 'Claro'], ['escuro', 'Escuro']];
  return (
    <>
      <Card>
        <div className="card-head"><h2>Aparência</h2></div>
        <div className="row" style={{ borderTop: 0 }}>
          <div className="row-txt"><b>Tema</b><span>Lilás e branco no claro, o inverso no escuro</span></div>
        </div>
        <div className="seg" style={{ marginBottom: 4 }}>
          {temas.map(([v, t]) => (
            <button key={v} aria-pressed={s.tema === v} onClick={() => a.setTema(v)}
              style={s.tema === v ? { background: 'var(--surface)', color: 'var(--ink)', boxShadow: 'var(--shadow-card)' } : undefined}>{t}</button>
          ))}
        </div>
        <div className="row">
          <div className="row-txt"><b>Animações</b><span>Desligue se preferir o app parado</span></div>
          <Check on={s.anim} onClick={() => a.setAnim(!s.anim)} label="Animações" />
        </div>
      </Card>

      <Card>
        <div className="card-head"><h2>Ciclo de {D.CICLO_DIAS} dias</h2><Pill t={`dia ${c.dia}`} cor="lilac" /></div>
        <div className="row" style={{ borderTop: 0 }}>
          <div className="row-txt">
            <b>Começou em {D.dataCurta(c.inicio)}</b>
            <span>Fase {c.fase.nome} · termina em {D.dataCurta(c.fim)}</span>
          </div>
        </div>
        <div className="row">
          <div className="row-txt">
            <b>O dia precisa de {D.META_DIA}% de “Sim”</b>
            <span>Abaixo disso o dia não entra na sequência nem na aderência do ciclo.</span>
          </div>
        </div>
        <button className={`btn-ghost ${confirmarCiclo ? 'danger' : ''}`} style={{ marginTop: 10 }}
          onClick={() => { if (confirmarCiclo) { a.reiniciarCiclo(); setConfirmarCiclo(false); } else setConfirmarCiclo(true); }}>
          {confirmarCiclo ? 'Toque de novo: o ciclo recomeça hoje' : 'Reiniciar o ciclo a partir de hoje'}
        </button>
      </Card>

      <Card>
        <div className="card-head"><h2>Lembretes</h2></div>
        {[['Check-in da rotina', 'Todo dia às 21h30'], ['Antes do treino', '17h30 nos dias de treino']].map(([n, sub], i) => (
          <div className="row" key={n}>
            <div className="row-txt"><b>{n}</b><span>{sub}</span></div>
            <Check on={s.marcados['lb' + i]} onClick={() => a.toggle('lb' + i)} label={n} />
          </div>
        ))}
        <p style={{ margin: '10px 2px 0', fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.45 }}>
          A notificação em si depende do iOS e entra na fase 2 — aqui ficam só os horários.
        </p>
      </Card>

      <Card>
        <div className="card-head"><h2>Dados</h2></div>
        {s.exemplo && (
          <button className="btn-ghost" style={{ marginBottom: 8 }} onClick={a.limparExemplo}>
            Limpar os dados de exemplo
          </button>
        )}
        <button className={`btn-ghost ${confirmar ? 'danger' : ''}`}
          onClick={() => { if (confirmar) { a.apagarTudo(); setConfirmar(false); } else setConfirmar(true); }}>
          {confirmar ? 'Toque de novo pra apagar tudo' : 'Apagar todo o histórico'}
        </button>
        <p style={{ margin: '10px 2px 0', fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.45 }}>
          Tudo fica salvo só neste aparelho, no navegador. Exportar em CSV e backup entram na fase 2.
        </p>
      </Card>
    </>
  );
}

export const TELAS = {
  hoje: Hoje, percurso: Percurso, rotina: Rotina, academia: Academia, dieta: Dieta,
  faculdade: Faculdade, estagio: Estagio, financeiro: Financeiro, metas: Metas, ajustes: Ajustes,
};
