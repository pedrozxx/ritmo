/* As telas do Ritmo. Cada uma recebe o estado do perfil (s) e as ações (a).
   Nada aqui é dado fixo: tudo vem de s.listas, cadastrado por quem usa. */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as D from './store.js';
import { Card, CARD, Ring, Barra, Habito, Check, Pill, Ico, Numero, Vazio, MOLA_CALMA } from './ui.jsx';

/* cabeçalho de card com o botão que abre o editor daquela lista */
const Head = ({ titulo, chave, filtro, rotulo, a, extra }) => (
  <div className="card-head">
    <h2>{titulo}</h2>
    {extra}
    {chave && (
      <button className="more" onClick={() => a.gerir(chave, filtro, rotulo || titulo)}>Editar</button>
    )}
  </div>
);
const Convite = ({ texto, rotulo, chave, filtro, titulo, a }) => (
  <div className="empty">
    <b>Nada aqui ainda</b>{texto}
    <button className="btn-primary" style={{ marginTop: 14 }}
      onClick={() => a.gerir(chave, filtro, titulo)}>{rotulo}</button>
  </div>
);
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
const HabitosDoPilar = ({ s, a, pilarId }) => {
  const itens = D.habitosDo(s, pilarId);
  const resp = s.dias[D.iso()] || {};
  if (!itens.length) {
    return <Convite a={a} chave="habitos" filtro={{ pilar: pilarId }} titulo={`Hábitos de ${D.pilar(pilarId).nome}`}
      rotulo="Cadastrar hábito" texto="Os itens de Sim / Não deste pilar são seus pra criar." />;
  }
  return (
    <div className="habits">
      {itens.map(h => <Habito key={h.id} h={h} estado={resp[h.id]} onPick={v => a.marcar(h.id, v)} />)}
    </div>
  );
};

/* ================= Hoje ================= */
function Hoje({ s, a }) {
  const hoje = D.iso();
  const resp = s.dias[hoje] || {};
  const habitos = s.listas.habitos;
  const p = D.pctDoDia(s, hoje);
  const sim = D.contar(resp, habitos, 'sim');
  const nao = D.contar(resp, habitos, 'nao');
  const pendentes = habitos.filter(h => !resp[h.id]);
  const c = D.ciclo(s, hoje);
  const mes = D.doMes(s.tx, hoje);
  const { entradas, saidas, saldo } = D.caixa(mes);
  const macros = D.macrosDoDia(s, hoje);
  const entregas = [...s.listas.entregas].sort((x, y) => (x.data || '').localeCompare(y.data || '')).slice(0, 3);

  if (!habitos.length) {
    return (
      <>
        <Card>
          <div className="today">
            <Ring pct={0} sub="do dia" />
            <div className="today-txt">
              <h2>Bem-vindo, {s.nome}</h2>
              <p>O app está vazio de propósito. Comece cadastrando os hábitos que você quer
                responder com Sim ou Não todo dia.</p>
            </div>
          </div>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => a.go('rotina')}>
            Montar minha rotina
          </button>
        </Card>
        <Card>
          <div className="card-head"><h2>Como funciona</h2></div>
          {[
            ['Rotina', 'Crie os hábitos de cada pilar. Todo dia você responde Sim ou Não.'],
            ['Percurso', `O ciclo de ${D.CICLO_DIAS} dias em 3 fases, com as metas de cada fase.`],
            ['Dieta e Academia', 'Cadastre suas refeições e seus exercícios; o app soma proteína e treinos.'],
            ['Financeiro', 'Lance o que entrou e o que saiu; o saldo e as categorias saem sozinhos.'],
          ].map(([t, sub]) => (
            <div className="row" key={t}><div className="row-txt"><b>{t}</b><span>{sub}</span></div></div>
          ))}
        </Card>
      </>
    );
  }

  return (
    <>
      <Card>
        <div className="today">
          <Ring pct={p} sub="do dia" />
          <div className="today-txt">
            <h2>{sim} de {habitos.length} em pé</h2>
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
              <Ring pct={D.pctPilar(resp, D.habitosDo(s, pl.id))} size={42} sw={5} atraso={.16 + i * .07} />
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
        <div className="card-head"><h2>Semana</h2><span className="more">meta de {s.cfg.metaDia}% por dia</span></div>
        <Semaninha dias={D.semana(s, hoje)} />
      </Card>

      {s.listas.refeicoes.length > 0 && (
        <Card>
          <div className="card-head"><h2>Dieta de hoje</h2><button className="more" onClick={() => a.go('dieta')}>Dieta</button></div>
          <div className="today">
            <Ring pct={Math.round(macros.feitas / macros.total * 100)} size={64} sw={7} sub="refeições" />
            <div className="today-txt">
              <h2 style={{ fontSize: 16 }}>{macros.prot} g de proteína</h2>
              <p>{macros.feitas} de {macros.total} refeições · {macros.kcal.toLocaleString('pt-BR')} kcal de {s.cfg.kcal.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </Card>
      )}

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

      {entregas.length > 0 && (
        <Card>
          <div className="card-head"><h2>Próximas entregas</h2><button className="more" onClick={() => a.go('faculdade')}>Faculdade</button></div>
          {entregas.map(e => {
            const f = D.faltam(e.data);
            return (
              <div className="row" key={e.id}>
                <div className="row-txt"><b>{e.nome}</b><span>{[D.rotuloData(e.data), e.meta].filter(Boolean).join(' · ')}</span></div>
                <Pill t={f.txt} cor={f.cor} />
              </div>
            );
          })}
        </Card>
      )}
    </>
  );
}

/* ================= Percurso ================= */
function Percurso({ s, a }) {
  const c = D.ciclo(s);
  const ad = D.aderencia(s);
  return (
    <>
      <Card>
        <div className="today">
          <Ring pct={c.pct} sub={`dia ${c.dia}`} />
          <div className="today-txt">
            <h2>Fase {c.fase.nome} · {c.fase.lema}</h2>
            <p>
              {c.terminou ? `Ciclo fechado em ${D.dataCurta(c.fim)}.`
                : `Semana ${c.semana} de 13 · restam ${c.restam} ${c.restam === 1 ? 'dia' : 'dias'}.`}
              {' '}De {D.dataCurta(c.inicio)} a {D.dataCurta(c.fim)}.
            </p>
          </div>
        </div>
        <div className="sep" />
        <span className="label">As 13 semanas</span>
        <div className="semanas" style={{ marginTop: 8 }}>
          {D.semanasDoCiclo(s).map(w => (
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
        <p className="nota">Um dia entra na conta com {s.cfg.metaDia}% ou mais da rotina respondida como “Sim”.</p>
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
                <Pill t={atual ? 'você está aqui' : passou ? 'fechada' : `dia ${f.de} a ${f.ate}`}
                  cor={atual ? 'lilac' : passou ? 'ok' : 'neutral'} />
              </div>
              <p>{f.foco}</p>
              {metas.length === 0
                ? (
                  <button className="btn-ghost" onClick={() => a.gerir('metas', { fase: f.id }, `Metas da fase ${f.nome}`)}>
                    Definir uma meta pra esta fase
                  </button>
                )
                : metas.map((m, i) => {
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
          <div className="card-head"><h2>{D.CICLO_DIAS} dias fechados</h2></div>
          <p className="nota" style={{ margin: '0 0 12px' }}>
            Você fechou o ciclo com {ad.bons} de {ad.contados} dias em pé. O próximo começa hoje
            e o histórico fica guardado.
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
          item. O que fica sem resposta não conta como falha — só como pendente. Use “Editar” pra
          criar, mudar ou apagar os hábitos de cada pilar.
        </p>
      </Card>
      {D.PILARES.map(pl => {
        const itens = D.habitosDo(s, pl.id);
        return (
          <Card key={pl.id}>
            <div className="card-head">
              <h2><Ico n={pl.icon} s={17} /> {pl.nome}</h2>
              {itens.length > 0 && (
                <Pill t={`${itens.filter(i => resp[i.id] === 'sim').length}/${itens.length}`}
                  cor={D.pctPilar(resp, itens) === 100 ? 'ok' : 'neutral'} />
              )}
              <button className="more" onClick={() => a.gerir('habitos', { pilar: pl.id }, `Hábitos de ${pl.nome}`)}>
                Editar
              </button>
            </div>
            {itens.length === 0
              ? <Convite a={a} chave="habitos" filtro={{ pilar: pl.id }} titulo={`Hábitos de ${pl.nome}`}
                rotulo={`Criar hábito de ${pl.nome}`} texto={`Nenhum hábito de ${pl.nome.toLowerCase()} ainda.`} />
              : (
                <div className="habits">
                  {itens.map(h => <Habito key={h.id} h={h} estado={resp[h.id]} onPick={v => a.marcar(h.id, v)} />)}
                </div>
              )}
          </Card>
        );
      })}
    </>
  );
}

/* ================= Academia ================= */
function Academia({ s, a }) {
  const ex = D.extraDoDia(s);
  const treinos = D.diasComPilar(s, 'gym');
  const metaTreino = s.listas.metas.find(m => m.tipo === 'habito' && D.habitosDo(s, 'gym').some(h => h.id === m.habitoId));
  const alvo = Number(metaTreino?.alvo) || 0;
  const hojeIdx = (new Date().getDay() + 6) % 7;
  const semanas = D.porSemana(s, 'gym');
  const maxSem = Math.max(1, ...semanas);
  return (
    <>
      <Card>
        <div className="today">
          <Ring pct={alvo ? Math.min(100, Math.round(treinos / alvo * 100)) : (treinos ? 100 : 0)}
            size={76} sub={alvo ? `${treinos}/${alvo}` : `${treinos}`} />
          <div className="today-txt">
            <h2>{treinos} {treinos === 1 ? 'dia' : 'dias'} de treino no mês</h2>
            <p>{alvo ? `Meta do ciclo: ${alvo} no mês. ` : 'Crie uma meta de treino no Percurso pra ver o alvo. '}
              Contado do próprio checklist.</p>
          </div>
        </div>
        <div className="sep" />
        <div className="card-head" style={{ marginBottom: 8 }}>
          <span className="label">Divisão da semana</span>
          <button className="more" onClick={() => a.gerir('split', null, 'Divisão da semana')}>Editar</button>
        </div>
        <div className="split">
          {s.listas.split.map((d, i) => (
            <div key={d.id} className={i === hojeIdx ? 'now' : ''}><b>{d.nome}</b>{d.meta || '—'}</div>
          ))}
        </div>
      </Card>

      <Card>
        <Head titulo="Treino de hoje" chave="exercicios" rotulo="Exercícios" a={a} />
        {s.listas.exercicios.length === 0
          ? <Convite a={a} chave="exercicios" titulo="Exercícios" rotulo="Cadastrar exercício"
            texto="Cadastre os exercícios pra marcar série por série." />
          : s.listas.exercicios.map(e => (
            <div className="row" key={e.id}>
              <Check on={ex['ex' + e.id]} onClick={() => a.toggleExtra('ex' + e.id)} label={e.nome} />
              <div className="row-txt"><b>{e.nome}</b><span>{e.meta || '—'}</span></div>
            </div>
          ))}
        <div className="sep" />
        <HabitosDoPilar s={s} a={a} pilarId="gym" />
      </Card>

      {treinos > 0 && (
        <Card>
          <div className="card-head"><h2>Treinos por semana</h2><span className="more num">últimas 7</span></div>
          <div className="bars">
            {semanas.map((n, i) => (
              <div className="bar-row" key={i}>
                <span>{i === semanas.length - 1 ? 'Esta semana' : `${semanas.length - 1 - i} semanas atrás`}</span>
                <span className="v">{n} {n === 1 ? 'dia' : 'dias'}</span>
                <Barra pct={n / maxSem * 100} atraso={i * .06} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}

/* ================= Dieta ================= */
function Dieta({ s, a }) {
  const ex = D.extraDoDia(s);
  const m = D.macrosDoDia(s);
  const litros = (m.agua * s.cfg.mlGarrafa / 1000).toFixed(1).replace('.', ',');
  const alvoLitros = (s.cfg.garrafas * s.cfg.mlGarrafa / 1000).toFixed(1).replace('.', ',');
  const ad = D.aderenciaPilar(s, 'diet');
  return (
    <>
      <Card>
        <div className="today">
          <Ring pct={m.total ? Math.round(m.feitas / m.total * 100) : 0} sub="refeições" />
          <div className="today-txt">
            <h2>{m.prot} g de proteína</h2>
            <p>{m.total
              ? `${m.feitas} de ${m.total} refeições marcadas. Os gramas saem das refeições que você marcou.`
              : 'Cadastre suas refeições pra o app somar proteína e caloria sozinho.'}</p>
          </div>
        </div>
        {m.total > 0 && (
          <>
            <div className="sep" />
            <div className="bars">
              <div className="bar-row">
                <span>Proteína</span><span className="v">{m.prot} g de {s.cfg.proteina} g</span>
                <Barra pct={Math.min(100, m.prot / s.cfg.proteina * 100)} />
              </div>
              <div className="bar-row">
                <span>Calorias</span><span className="v">{m.kcal.toLocaleString('pt-BR')} de {s.cfg.kcal.toLocaleString('pt-BR')} kcal</span>
                <Barra pct={Math.min(100, m.kcal / s.cfg.kcal * 100)} atraso={.07} />
              </div>
            </div>
          </>
        )}
      </Card>

      <Card>
        <Head titulo="Refeições de hoje" chave="refeicoes" rotulo="Refeições" a={a}
          extra={m.total > 0 ? <Pill t={`${m.feitas}/${m.total}`} cor={m.feitas === m.total ? 'ok' : 'neutral'} /> : null} />
        {m.total === 0
          ? <Convite a={a} chave="refeicoes" titulo="Refeições" rotulo="Cadastrar refeição"
            texto="Monte o seu dia de comida: nome, horário, proteína e caloria de cada refeição." />
          : s.listas.refeicoes.map(r => (
            <div className="row" key={r.id}>
              <Check on={ex['rf' + r.id]} onClick={() => a.toggleExtra('rf' + r.id)} label={r.nome} />
              <div className="row-txt">
                <b>{[r.nome, r.hora].filter(Boolean).join(' · ')}</b>
                <span>{r.o || '—'}</span>
              </div>
              {r.prot !== '' && r.prot != null && <span className="tx-v">{r.prot} g</span>}
            </div>
          ))}
      </Card>

      <Card>
        <div className="card-head"><h2>Água</h2><span className="more num">{litros} L de {alvoLitros} L</span></div>
        <div className="aguas" style={{ gridTemplateColumns: `repeat(${s.cfg.garrafas}, 1fr)` }}>
          {Array.from({ length: s.cfg.garrafas }, (_, i) => (
            <motion.button key={i} className="garrafa" whileTap={{ scale: .92 }}
              aria-pressed={i < m.agua} aria-label={`${i + 1}ª garrafa de ${s.cfg.mlGarrafa} ml`}
              onClick={() => a.setExtra('agua', m.agua === i + 1 ? i : i + 1)}>
              <motion.i initial={false} animate={{ scaleY: i < m.agua ? 1 : 0 }} transition={MOLA_CALMA} />
            </motion.button>
          ))}
        </div>
        <span className="label" style={{ display: 'block', marginTop: 10 }}>
          {s.cfg.garrafas} de {s.cfg.mlGarrafa} ml · toque pra encher, toque de novo pra desfazer
        </span>
      </Card>

      <Card>
        <div className="card-head">
          <h2>Rotina da dieta</h2>
          {D.habitosDo(s, 'diet').length > 0 && <Pill t={`${ad.bons}/${ad.n} dias`} cor={ad.bons >= 6 ? 'ok' : 'neutral'} />}
          <button className="more" onClick={() => a.gerir('habitos', { pilar: 'diet' }, 'Hábitos de Dieta')}>Editar</button>
        </div>
        <HabitosDoPilar s={s} a={a} pilarId="diet" />
      </Card>

      {D.habitosDo(s, 'diet').length > 0 && (
        <Card>
          <div className="card-head"><h2>Aderência da semana</h2><span className="more num">{ad.pct}%</span></div>
          <Semaninha dias={D.semanaPilar(s, 'diet')} />
        </Card>
      )}
    </>
  );
}

/* ================= Faculdade ================= */
function Faculdade({ s, a }) {
  const materias = s.listas.materias;
  const comNota = materias.filter(m => m.nota !== '' && m.nota != null);
  const media = comNota.length ? comNota.reduce((t, m) => t + Number(m.nota), 0) / comNota.length : 0;
  const entregas = [...s.listas.entregas].sort((x, y) => (x.data || '').localeCompare(y.data || ''));
  return (
    <>
      <Card>
        <div className="today">
          <Ring pct={Math.min(100, Math.round(media * 10))} size={76} sub="média" />
          <div className="today-txt">
            <h2>{materias.length} {materias.length === 1 ? 'matéria' : 'matérias'}</h2>
            <p>{comNota.length
              ? `Média parcial de ${media.toFixed(1).replace('.', ',')} em ${comNota.length} ${comNota.length === 1 ? 'matéria' : 'matérias'} com nota.`
              : 'Cadastre as matérias e as notas pra acompanhar a média.'}</p>
          </div>
        </div>
      </Card>

      <Card>
        <Head titulo="Matérias" chave="materias" a={a} />
        {materias.length === 0
          ? <Convite a={a} chave="materias" titulo="Matérias" rotulo="Cadastrar matéria"
            texto="Suas matérias do semestre, com horário e nota parcial." />
          : materias.map(m => (
            <div className="row" key={m.id}>
              <div className="row-txt"><b>{m.nome}</b><span>{m.meta || '—'}</span></div>
              {m.nota !== '' && m.nota != null && (
                <span className={`pill num ${Number(m.nota) >= 7 ? 'ok' : 'warn'}`}>
                  {String(m.nota).replace('.', ',')}
                </span>
              )}
            </div>
          ))}
      </Card>

      <Card>
        <Head titulo="Entregas e provas" chave="entregas" a={a} />
        {entregas.length === 0
          ? <Convite a={a} chave="entregas" titulo="Entregas e provas" rotulo="Cadastrar entrega"
            texto="Provas e trabalhos com data — o app conta os dias que faltam." />
          : entregas.map(e => {
            const f = D.faltam(e.data);
            return (
              <div className="row" key={e.id}>
                <div className="row-txt"><b>{e.nome}</b><span>{[D.rotuloData(e.data), e.meta].filter(Boolean).join(' · ')}</span></div>
                <Pill t={f.txt} cor={f.cor} />
              </div>
            );
          })}
      </Card>

      <Card>
        <div className="card-head">
          <h2>Rotina da faculdade</h2>
          <button className="more" onClick={() => a.gerir('habitos', { pilar: 'fac' }, 'Hábitos de Faculdade')}>Editar</button>
        </div>
        <HabitosDoPilar s={s} a={a} pilarId="fac" />
      </Card>
    </>
  );
}

/* ================= Estágio ================= */
function Estagio({ s, a }) {
  const ex = D.extraDoDia(s);
  const sem = D.horasDaSemana(s);
  const feitas = Math.round(sem.reduce((t, d) => t + d.horas, 0) * 10) / 10;
  const meta = s.cfg.horasSemana;
  const hoje = D.horasDoDia(s);
  const maxDia = Math.max(1, ...sem.map(d => d.horas));
  const hhmm = n => String(n).replace('.', ',') + 'h';
  return (
    <>
      <Card>
        <div className="today">
          <Ring pct={meta ? Math.min(100, Math.round(feitas / meta * 100)) : 0} sub={`${hhmm(feitas)}/${meta}h`} />
          <div className="today-txt">
            <h2>Semana em {hhmm(feitas)}</h2>
            <p>{feitas >= meta
              ? 'Semana fechada. O que passar daqui vira banco de horas.'
              : `Faltam ${hhmm(Math.round((meta - feitas) * 10) / 10)} pra fechar as ${meta}h.`}</p>
          </div>
        </div>
        <div className="sep" />
        <div className="card-head" style={{ marginBottom: 10 }}>
          <span className="label">Horas de hoje</span>
        </div>
        <div className="stepper">
          <motion.button whileTap={{ scale: .9 }} aria-label="Menos meia hora"
            onClick={() => a.setExtra('horas', Math.max(0, Math.round((hoje - .5) * 10) / 10))}>
            <Ico n="menos" s={20} w={2.2} />
          </motion.button>
          <b className="num">{hhmm(hoje)}</b>
          <motion.button whileTap={{ scale: .9 }} aria-label="Mais meia hora"
            onClick={() => a.setExtra('horas', Math.min(24, Math.round((hoje + .5) * 10) / 10))}>
            <Ico n="mais" s={20} w={2.2} />
          </motion.button>
        </div>
      </Card>

      <Card>
        <Head titulo="Tarefas do board" chave="tarefas" rotulo="Tarefas" a={a} />
        {s.listas.tarefas.length === 0
          ? <Convite a={a} chave="tarefas" titulo="Tarefas" rotulo="Cadastrar tarefa"
            texto="O que você precisa fechar no estágio." />
          : s.listas.tarefas.map(t => (
            <div className="row" key={t.id}>
              <Check on={ex['tf' + t.id]} onClick={() => a.toggleExtra('tf' + t.id)} label={t.nome} />
              <div className="row-txt"><b>{t.nome}</b><span>{t.meta || '—'}</span></div>
            </div>
          ))}
      </Card>

      {feitas > 0 && (
        <Card>
          <div className="card-head"><h2>Horas por dia</h2><span className="more num">meta de {meta}h na semana</span></div>
          <div className="bars">
            {sem.map((d, i) => (
              <div className="bar-row" key={d.k}>
                <span>{d.nome}{d.hoje ? ' · hoje' : ''}</span>
                <span className="v">{d.horas ? hhmm(d.horas) : '—'}</span>
                <Barra pct={d.horas / maxDia * 100} atraso={i * .06} />
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="card-head">
          <h2>Rotina do estágio</h2>
          <button className="more" onClick={() => a.gerir('habitos', { pilar: 'est' }, 'Hábitos de Estágio')}>Editar</button>
        </div>
        <HabitosDoPilar s={s} a={a} pilarId="est" />
      </Card>
    </>
  );
}

/* ================= Financeiro ================= */
function Financeiro({ s, a }) {
  const mes = D.doMes(s.tx);
  const { entradas, saidas, saldo } = D.caixa(mes);
  const cats = D.porCategoria(mes);
  const max = cats.length ? cats[0][1] : 1;
  return (
    <>
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
          <Head titulo="Pra onde foi" chave="cats" rotulo="Categorias" a={a} />
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
        <div className="card-head">
          <h2>Lançamentos</h2>
          {mes.length > 0 && <span className="more num">{mes.length} no mês</span>}
          <button className="more" onClick={() => a.gerir('cats', null, 'Categorias')}>Categorias</button>
        </div>
        {mes.length === 0
          ? <Vazio titulo="Nenhum lançamento" texto="Toque em Lançamento pra registrar o primeiro gasto ou recebimento." />
          : mes.map(t => (
            <div className="tx" key={t.id}>
              <div className={`tx-ic ${t.v > 0 ? 'pos' : 'neg'}`}><Ico n={t.v > 0 ? 'sobe' : 'desce'} s={16} /></div>
              <div className="tx-txt"><b>{t.desc}</b><span>{D.rotuloData(t.data)} · {t.cat}</span></div>
              <div className={`tx-v ${t.v > 0 ? 'pos' : 'neg'}`}>{t.v > 0 ? '+ ' : '− '}{D.brl(t.v)}</div>
            </div>
          ))}
      </Card>

      <Card>
        <div className="card-head">
          <h2>Rotina financeira</h2>
          <button className="more" onClick={() => a.gerir('habitos', { pilar: 'fin' }, 'Hábitos de Financeiro')}>Editar</button>
        </div>
        <HabitosDoPilar s={s} a={a} pilarId="fin" />
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
          Cada meta fica ancorada numa fase do ciclo. Você está no{' '}
          <b style={{ color: 'var(--lilac)' }}>dia {c.dia}, fase {c.fase.nome}</b>.
        </p>
      </Card>
      {s.listas.metas.length === 0 ? (
        <Card>
          <Convite a={a} chave="metas" titulo="Metas" rotulo="Criar primeira meta"
            texto="Metas podem se calcular sozinhas: contar um hábito no mês, fechar o mês no positivo, dias de dieta na semana ou a proteína de hoje." />
        </Card>
      ) : (
        <>
          {s.listas.metas.map((m, i) => {
            const { p, sub } = D.progresso(m, s);
            const fase = D.FASES.find(f => f.id === m.fase);
            return (
              <Card key={m.id}>
                <div className="goal">
                  <div className="goal-top">
                    <b>{m.nome}</b>
                    <Pill t={p >= 100 ? 'batida' : fase ? `fase ${fase.nome}` : '—'}
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
          <Card>
            <button className="btn-ghost" onClick={() => a.gerir('metas', null, 'Metas')}>Editar metas</button>
          </Card>
        </>
      )}
    </>
  );
}

/* ================= Ajustes ================= */
function Ajustes({ s, a }) {
  const c = D.ciclo(s);
  const numeros = [
    ['metaDia', 'Meta do dia', '% de “Sim” pro dia contar na sequência', '%'],
    ['proteina', 'Proteína por dia', 'Alvo da tela de Dieta', 'g'],
    ['kcal', 'Calorias por dia', 'Alvo da tela de Dieta', 'kcal'],
    ['garrafas', 'Garrafas de água', `De ${s.cfg.mlGarrafa} ml cada`, ''],
    ['horasSemana', 'Horas de estágio', 'Meta da semana', 'h'],
  ];
  return (
    <>
      <Card>
        <div className="card-head"><h2>Perfil</h2><Pill t={s.nome} cor="lilac" /></div>
        <div className="campo">
          <label className="label" htmlFor="nome-perfil">Como te chamar</label>
          <div className="field">
            <input id="nome-perfil" className="campo-input" value={s.nome}
              onChange={e => a.setCampo('nome', e.target.value)} />
          </div>
        </div>
        <p className="nota">Cada perfil guarda a própria rotina, dieta, metas e dinheiro, só neste aparelho.
          Troque de pessoa no topo do menu lateral.</p>
      </Card>

      <Card>
        <div className="card-head"><h2>Aparência</h2></div>
        <div className="seg">
          {[['sistema', 'Sistema'], ['claro', 'Claro'], ['escuro', 'Escuro']].map(([v, t]) => (
            <button key={v} aria-pressed={s.tema === v} onClick={() => a.setCampo('tema', v)}
              style={s.tema === v ? { background: 'var(--surface)', color: 'var(--ink)', boxShadow: 'var(--shadow-card)' } : undefined}>{t}</button>
          ))}
        </div>
        <div className="row">
          <div className="row-txt"><b>Animações</b><span>Desligue se preferir o app parado</span></div>
          <Check on={s.anim} onClick={() => a.setCampo('anim', !s.anim)} label="Animações" />
        </div>
      </Card>

      <Card>
        <div className="card-head"><h2>Seus números</h2></div>
        {numeros.map(([k, rot, sub, un]) => (
          <div className="row" key={k}>
            <div className="row-txt"><b>{rot}</b><span>{sub}</span></div>
            <div className="field compacto">
              <input className="campo-input num" inputMode="numeric" value={s.cfg[k]}
                aria-label={rot}
                onChange={e => a.setCfg(k, e.target.value.replace(/\D/g, '').slice(0, 5))} />
              {un && <span>{un}</span>}
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <div className="card-head"><h2>Ciclo de {D.CICLO_DIAS} dias</h2><Pill t={`dia ${c.dia}`} cor="lilac" /></div>
        <div className="row" style={{ borderTop: 0 }}>
          <div className="row-txt">
            <b>Começou em {D.dataCurta(c.inicio)}</b>
            <span>Fase {c.fase.nome} · termina em {D.dataCurta(c.fim)}</span>
          </div>
        </div>
        <ConfirmaDuasVezes rotulo="Reiniciar o ciclo a partir de hoje"
          confirma="Toque de novo: o ciclo recomeça hoje" onOk={a.reiniciarCiclo} />
      </Card>

      <Card>
        <div className="card-head"><h2>Dados de {s.nome}</h2></div>
        <p className="nota" style={{ margin: '0 0 12px' }}>
          Tudo fica salvo só neste aparelho, no navegador. Apagar aqui não mexe no outro perfil.
        </p>
        <ConfirmaDuasVezes rotulo="Apagar tudo deste perfil"
          confirma="Toque de novo pra apagar tudo" onOk={a.apagarPerfil} />
      </Card>
    </>
  );
}

function ConfirmaDuasVezes({ rotulo, confirma, onOk }) {
  const [armado, setArmado] = useState(false);
  return (
    <button className={`btn-ghost ${armado ? 'danger' : ''}`} style={{ marginTop: 10 }}
      onClick={() => { if (armado) { onOk(); setArmado(false); } else setArmado(true); }}>
      {armado ? confirma : rotulo}
    </button>
  );
}

export const TELAS = {
  hoje: Hoje, percurso: Percurso, rotina: Rotina, academia: Academia, dieta: Dieta,
  faculdade: Faculdade, estagio: Estagio, financeiro: Financeiro, metas: Metas, ajustes: Ajustes,
};
