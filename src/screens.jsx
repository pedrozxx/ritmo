/* As telas do Ritmo. Cada uma recebe o estado do perfil (s) e as ações (a).
   Nada aqui é dado fixo: tudo vem de s.listas, cadastrado por quem usa. */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as D from './store.js';
/* direto, e não via store.js: é o treino.js que importa dele, reexportar faria ciclo */
import * as T from './treino.js';
import * as Di from './dieta.js';
import * as J from './joelho.js';
import * as ICS from './ics.js';
import NOMES_OPENGYM from './nomes-opengym.json';
/* o plano do Pedro embutido: o botão de Ajustes aplica estes três de uma vez.
   Não é semente — perfil novo continua nascendo vazio, isso só entra no toque. */
import PLANO_TREINO from './plano-treino.json';
import PLANO_DIETA from './plano-dieta.json';
import PLANO_ROTINA from './plano-rotina.json';
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
const HabitosDoPilar = ({ s, a, pilarId, dia = D.iso() }) => {
  /* só os hábitos que valem no dia: o checklist não mostra o que é de
     outro dia da semana nem de outro modo */
  const itens = D.habitosDoPilarNoDia(s, pilarId, dia);
  const resp = s.dias[dia] || {};
  if (!itens.length) {
    const temNoPilar = D.habitosDo(s, pilarId).length > 0;
    if (temNoPilar) {
      return (
        <div className="row alto" style={{ borderTop: 0 }}>
          <div className="row-txt">
            <b>Nada hoje</b>
            <span>Os hábitos deste pilar são de outros dias da semana.</span>
          </div>
        </div>
      );
    }
    return <Convite a={a} chave="habitos" filtro={{ pilar: pilarId }} titulo={`Hábitos de ${D.pilar(pilarId).nome}`}
      rotulo="Cadastrar hábito" texto="Os itens de Sim / Não deste pilar são seus pra criar." />;
  }
  return (
    <div className="habits">
      {itens.map(h => <Habito key={h.id} h={h} estado={resp[h.id]} onPick={v => a.marcar(h.id, v, dia)} />)}
    </div>
  );
};

/* Escolher o dia que se está respondendo. Existe porque esquecer de marcar
   ontem quebrava a sequência pra sempre, sem chance de conserto. */
const EscolheDia = ({ dia, onMuda, ref0 = D.iso() }) => (
  <div className="week dias-voltar" role="group" aria-label="Dia que você está respondendo">
    {Array.from({ length: 7 }, (_, i) => D.maisDias(ref0, i - 6)).map(k => {
      const nome = D.DIAS_SEMANA[D.diaIdx(k)];
      return (
        <motion.button key={k} className={`day ${k === dia ? 'now' : ''}`} whileTap={{ scale: .94 }}
          aria-pressed={k === dia} onClick={() => onMuda(k)}>
          <b>{nome}</b>
          <div className="dot" data-fill={k === dia ? 'full' : 'none'}>{Number(k.slice(-2))}</div>
        </motion.button>
      );
    })}
  </div>
);

/* ================= Hoje ================= */
function Hoje({ s, a }) {
  const hoje = D.iso();
  const resp = s.dias[hoje] || {};
  /* o dia conta só o que vale hoje; o acervo inteiro fica na tela Rotina */
  const habitos = D.habitosDoDia(s, hoje);
  const p = D.pctDoDia(s, hoje);
  const sim = D.contar(resp, habitos, 'sim');
  const nao = D.contar(resp, habitos, 'nao');
  const pendentes = habitos.filter(h => !resp[h.id]);
  const rt = J.reteste(s.listas.testes, hoje);
  const avisoJoelho = (s.listas.treinos || []).length > 0 && rt.devido;
  const c = D.ciclo(s, hoje);
  const mes = D.doMes(s.tx, hoje);
  const { entradas, saidas, saldo } = D.caixa(mes);
  const macros = D.macrosDoDia(s, hoje);
  const entregas = [...s.listas.entregas].sort((x, y) => (x.data || '').localeCompare(y.data || '')).slice(0, 3);

  if (!s.listas.habitos.length) {
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
      {/* o reteste do joelho vence longe da aba Joelho, então ele vem procurar
          você aqui — é a única tela que se abre todo dia */}
      {avisoJoelho && (
        <motion.button className="banner" onClick={() => a.go('joelho')}
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={MOLA_CALMA}
          whileTap={{ scale: .98 }} style={{ width: '100%', textAlign: 'left' }}>
          <Ico n="gym" s={16} />
          {rt.nunca
            ? 'Faça o primeiro autoteste do joelho pra ter uma linha de base.'
            : `Autoteste do joelho venceu ${rt.faltam === 0 ? 'hoje' : `há ${-rt.faltam} dias`}. Toque pra registrar.`}
        </motion.button>
      )}
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
              <Ring pct={D.pctPilar(resp, D.habitosDoPilarNoDia(s, pl.id, hoje))} size={42} sw={5} atraso={.16 + i * .07} />
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
  const [dia, setDia] = useState(D.iso());
  const resp = s.dias[dia] || {};
  const hoje = dia === D.iso();
  return (
    <>
      <Card>
        <div className="card-head">
          <h2>{D.rotuloData(dia)}</h2>
          {!hoje && <Pill t={D.dataCurta(dia)} cor="lilac" />}
          {!hoje && <button className="more" onClick={() => setDia(D.iso())}>Voltar pra hoje</button>}
        </div>
        <EscolheDia dia={dia} onMuda={setDia} />
        <p className="nota" style={{ marginBottom: 0 }}>
          {hoje
            ? 'Responda Sim ou Não em cada item. O que fica sem resposta não conta como falha, só como pendente.'
            : 'Você está respondendo um dia que já passou. Serve pra consertar o que ficou em branco.'}
        </p>
      </Card>
      {D.PILARES.map(pl => {
        /* o checklist é do dia escolhido: hábito de outro dia da semana não
           aparece aqui, mas continua existindo e editável pelo "Editar" */
        const itens = D.habitosDoPilarNoDia(s, pl.id, dia);
        const noPilar = D.habitosDo(s, pl.id).length;
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
              ? noPilar > 0
                ? (
                  <div className="row alto" style={{ borderTop: 0 }}>
                    <div className="row-txt">
                      <b>Nada {hoje ? 'hoje' : 'neste dia'}</b>
                      <span>Os {noPilar} hábitos de {pl.nome.toLowerCase()} são de outros dias da semana.</span>
                    </div>
                  </div>
                )
                : <Convite a={a} chave="habitos" filtro={{ pilar: pl.id }} titulo={`Hábitos de ${pl.nome}`}
                  rotulo={`Criar hábito de ${pl.nome}`} texto={`Nenhum hábito de ${pl.nome.toLowerCase()} ainda.`} />
              : (
                <div className="habits">
                  {itens.map(h => <Habito key={h.id} h={h} estado={resp[h.id]} onPick={v => a.marcar(h.id, v, dia)} />)}
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
  const temPlano = (s.listas.treinos || []).length > 0;
  const luz = J.luzDoDia(s, D.iso());
  const treinoHoje = T.treinoDoDia(s.listas, D.iso(), luz);
  const hist = D.pesagens(s);
  const ultima = hist[0] || null;
  const fase = D.ciclo(s).fase;
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
        {/* Um sétimo da tela não comporta "Corpo todo e condicionamento": aqui
            vai a letra da rotina, e o nome inteiro fica no card de hoje. */}
        <div className="split">
          {s.listas.split.map((d, i) => {
            const t = (s.listas.treinos || []).find(x => x.id === d.treinoId);
            const folga = !d.meta || /^folga$/i.test(d.meta);
            return (
              <div key={d.id} className={i === hojeIdx ? 'now' : ''} title={d.meta || 'folga'}>
                <b>{d.nome}</b>
                {t
                  ? <><i className="split-emoji">{t.emoji}</i><u>{t.id}</u></>
                  : <u className={folga ? 'folga' : ''}>{folga ? '—' : d.meta}</u>}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <Head titulo="Treino de hoje" chave={treinoHoje ? null : 'exercicios'} rotulo="Exercícios" a={a}
          extra={temPlano ? <Pill t={`fase ${fase.nome}`} cor="lilac" /> : null} />

        {treinoHoje ? (
          <>
            <div className="row" style={{ borderTop: 0 }}>
              <div className="row-txt">
                <b>{treinoHoje.emoji} {treinoHoje.nome}</b>
                <span>
                  {luz === 'vermelho'
                    ? 'Joelho no vermelho: o treino de perna de hoje deu lugar à recuperação.'
                    : `${treinoHoje.ex.length} exercícios · prescrição da fase ${fase.nome}`}
                </span>
              </div>
            </div>
            {treinoHoje.ex.map(e => (
              <ExercicioDoDia key={`${treinoHoje.id}-${e.ord}`} s={s} a={a}
                treino={treinoHoje} ex={e} faseId={fase.id} />
            ))}
          </>
        ) : temPlano && luz === 'vermelho' ? (
          <div className="row alto" style={{ borderTop: 0 }}>
            <div className="row-txt">
              <b>Joelho no vermelho</b>
              <span>Hoje era pra ser só superior, mas o seu plano não tem uma rotina de
                recuperação importada. Não vou te mandar treinar perna assim.</span>
            </div>
          </div>
        ) : temPlano ? (
          <div className="row alto" style={{ borderTop: 0 }}>
            <div className="row-txt">
              <b>Folga hoje</b>
              <span>Nenhum treino marcado pra {D.DIAS_SEMANA[hojeIdx]} na divisão da semana.</span>
            </div>
          </div>
        ) : s.listas.exercicios.length === 0 ? (
          <Convite a={a} chave="exercicios" titulo="Exercícios" rotulo="Cadastrar exercício"
            texto="Cadastre os exercícios pra marcar série por série, ou importe um plano em Ajustes." />
        ) : s.listas.exercicios.map(e => (
          <div className="row" key={e.id}>
            <Check on={ex['ex' + e.id]} onClick={() => a.toggleExtra('ex' + e.id)} label={e.nome} />
            <div className="row-txt"><b>{e.nome}</b><span>{e.meta || '—'}</span></div>
          </div>
        ))}

        {/* o traço só existe se houver as duas metades pra separar */}
        {D.habitosDoPilarNoDia(s, 'gym', D.iso()).length > 0 && (
          <>
            <div className="sep" />
            <HabitosDoPilar s={s} a={a} pilarId="gym" />
          </>
        )}
      </Card>

      <Card>
        <div className="card-head">
          <h2>Peso e cintura</h2>
          {ultima && <Pill t={`${String(ultima.peso).replace('.', ',')} kg`} cor="lilac" />}
        </div>
        <div className="serie-linha" style={{ margin: '0 0 6px' }}>
          {[['peso', 'kg'], ['cintura', 'cm']].map(([campo, un]) => (
            <div className="field medida" key={campo}>
              <input className="campo-input num" inputMode="decimal" aria-label={campo}
                placeholder={campo === 'peso' ? 'peso' : 'cintura'}
                value={D.extraDoDia(s)[campo] ?? ''}
                onChange={e => a.setExtra(campo, e.target.value.replace(/[^\d,.]/g, '').slice(0, 5))} />
              <span>{un}</span>
            </div>
          ))}
        </div>
        <p className="nota" style={{ margin: 0 }}>
          {!ultima
            ? 'Sem pesagem ainda. O peso também define a meta de água, que hoje está num número fixo.'
            : hist.length < 2
              ? `Primeira pesagem em ${D.dataCurta(ultima.k)}. Na próxima o app mostra a variação.`
              : (() => {
                const dif = Math.round((hist[0].peso - hist[1].peso) * 10) / 10;
                return `${D.dataCurta(hist[1].k)} → ${D.dataCurta(hist[0].k)}: `
                  + `${dif === 0 ? 'sem mudança' : `${dif > 0 ? '+' : ''}${String(dif).replace('.', ',')} kg`}`
                  + ` · ${hist.length} pesagens no total`;
              })()}
        </p>
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

/* Conta o descanso entre séries. Existe porque o plano prescreve 60, 75 e 90 s
   e até agora isso era só um texto na tela. */
function Cronometro({ segundos }) {
  const [resta, setResta] = useState(null);
  useEffect(() => {
    if (resta === null) return undefined;
    if (resta <= 0) { const t = setTimeout(() => setResta(null), 1400); return () => clearTimeout(t); }
    const t = setTimeout(() => setResta(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resta]);

  if (!segundos) return null;
  const mm = resta === null ? null : `${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')}`;
  return (
    <motion.button className={`crono ${resta !== null ? 'rodando' : ''} ${resta === 0 ? 'fim' : ''}`}
      whileTap={{ scale: .94 }}
      aria-label={resta === null ? `Começar descanso de ${segundos} segundos` : 'Parar o descanso'}
      onClick={() => setResta(resta === null ? segundos : null)}>
      {resta === null ? `⏱ ${segundos} s` : resta === 0 ? 'vai!' : mm}
    </motion.button>
  );
}

/* Uma linha de exercício: marcar, anotar carga e repetições, ver o substituto
   e contar o descanso. A dupla progressão só acontece se houver onde anotar. */
function ExercicioDoDia({ s, a, treino, ex, faseId }) {
  const extra = D.extraDoDia(s);
  const feito = !!extra[T.chaveFeito(treino, ex)];
  const log = T.logDe(extra, treino, ex);
  const anterior = T.ultimoLog(s.extra, treino, ex, D.iso());
  const sobe = T.fechouAFaixa(ex, log);
  const titulo = ex.nome || ex.ref;
  const subs = (ex.subs || []).map(id => NOMES_OPENGYM[id] || id);

  const gravar = novo => a.setExtra(T.chaveLog(treino, ex), { ...log, ...novo });
  const serie = (i, v) => {
    const sr = [...(log.s || [])];
    sr[i] = v === '' ? '' : Number(v);
    gravar({ s: sr });
  };

  return (
    <div className="row alto">
      <Check on={feito} onClick={() => a.toggleExtra(T.chaveFeito(treino, ex))} label={titulo} />
      <div className="row-txt">
        <b>{titulo}</b>
        <span>
          {T.prescricao(ex, faseId)} · descanso {T.descansoTxt(ex)}
          {ex.sgNome ? ` · supersérie ${ex.sgNome}` : ''}
        </span>

        {ex.modo === 'reps' && (
          <div className="serie-linha">
            <div className="field carga">
              <input className="campo-input num" inputMode="decimal" aria-label={`Carga em kg, ${titulo}`}
                placeholder={anterior?.kg ? String(anterior.kg) : '–'} value={log.kg ?? ''}
                onChange={e => gravar({ kg: e.target.value.replace(/[^\d,.]/g, '').slice(0, 6) })} />
              <span>kg</span>
            </div>
            {Array.from({ length: ex.sets }, (_, i) => (
              <div className="field serie" key={i}>
                <input className="campo-input num" inputMode="numeric"
                  aria-label={`Repetições da série ${i + 1}, ${titulo}`}
                  placeholder="–" value={log.s?.[i] ?? ''}
                  onChange={e => serie(i, e.target.value.replace(/\D/g, '').slice(0, 3))} />
              </div>
            ))}
            <Cronometro segundos={ex.descanso} />
          </div>
        )}
        {ex.modo !== 'reps' && ex.descanso ? (
          <div className="serie-linha"><Cronometro segundos={ex.descanso} /></div>
        ) : null}

        {sobe && <Pill t="fechou a faixa — sobe a carga" cor="ok" />}
        {anterior && (
          <span className="nota" style={{ margin: '4px 0 0' }}>
            Da última vez, em {D.dataCurta(anterior.data)}: {anterior.kg ? `${anterior.kg} kg` : 'sem carga'}
            {anterior.s?.length ? ` · ${anterior.s.filter(x => x !== '').join(' · ')}` : ''}
          </span>
        )}
        {subs.length > 0 && (
          <details className="subs-ex">
            <summary>{subs.length === 1 ? 'substituto' : `${subs.length} substitutos`}</summary>
            <span>{subs.join(' · ')}</span>
          </details>
        )}
        {(ex.nota || ex.desc) && <span className="nota">{ex.nota || ex.desc}</span>}
      </div>
    </div>
  );
}

/* ================= Joelho =================
   Sem cor nova: verde usa o tom de entrada, vermelho o mesmo rosa do "não",
   e o amarelo vira lilás — a disciplina de cor do app continua de pé. */
const COR_LUZ = { verde: 'ok', amarelo: 'lilac', vermelho: 'warn' };
const DORES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const INCHACOS = [[0, 'Nenhum'], [1, 'Leve'], [2, 'Forte']];

function Joelho({ s, a }) {
  const hoje = D.iso();
  const check = (s.joelho || {})[hoje] || null;
  const luz = J.luzDoDia(s, hoje);
  const testes = s.listas.testes || [];
  const ultimo = J.ultimoTeste(testes);
  const v = J.voltaAoCampo(s.volta, testes);
  const prox = ultimo ? D.maisDias(ultimo.data, J.DIAS_RETESTE) : null;
  const h30 = J.historico(s, 30, hoje);
  const muda = (k, valor) =>
    a.setJoelho({ dor: 0, inchaco: 0, falseou: false, ...check, ok: true, [k]: valor });

  return (
    <>
      <Card>
        <div className="card-head">
          <h2>Como está hoje</h2>
          {luz
            ? <Pill t={J.LUZES.find(l => l[0] === luz)[1]} cor={COR_LUZ[luz]} />
            : <Pill t="sem check" cor="neutral" />}
        </div>
        <p className="nota" style={{ margin: '0 0 14px' }}>
          {luz
            ? J.LUZES.find(l => l[0] === luz)[2]
            : 'Responda as três e o app decide o treino do dia por você.'}
        </p>

        <div className="row" style={{ borderTop: 0 }}>
          <div className="row-txt"><b>O joelho falseou?</b><span>Sensação de que ia sair do lugar</span></div>
          <Check on={!!check?.falseou} onClick={() => muda('falseou', !check?.falseou)} label="O joelho falseou" />
        </div>

        <span className="label" style={{ display: 'block', marginTop: 12 }}>Dor de 0 a 10</span>
        <div className="chips" role="group" aria-label="Dor de 0 a 10">
          {DORES.map(n => (
            <motion.button key={n} className="chip" aria-pressed={Number(check?.dor) === n && !!check}
              onClick={() => muda('dor', n)} whileTap={{ scale: .94 }}>{n}</motion.button>
          ))}
        </div>

        <span className="label" style={{ display: 'block' }}>Inchaço</span>
        <div className="chips" role="group" aria-label="Inchaço">
          {INCHACOS.map(([n, t]) => (
            <motion.button key={n} className="chip" aria-pressed={Number(check?.inchaco) === n && !!check}
              onClick={() => muda('inchaco', n)} whileTap={{ scale: .94 }}>{t}</motion.button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="card-head">
          <h2>Últimos 30 dias</h2>
          {h30.comCheck > 0 && <Pill t={`${h30.pctVerde}% verde`} cor={h30.pctVerde >= 70 ? 'ok' : 'neutral'} />}
        </div>
        {h30.comCheck === 0
          ? <p className="nota" style={{ margin: 0 }}>Nenhum check ainda. A partir do primeiro, a tendência aparece aqui.</p>
          : (
            <>
              <div className="luzes">
                {[...h30.dias].reverse().map(d => (
                  <i key={d.k} data-luz={d.luz || 'sem'} title={`${D.dataCurta(d.k)}: ${d.luz || 'sem check'}`} />
                ))}
              </div>
              <p className="nota" style={{ marginBottom: 0 }}>
                {h30.verde} verdes · {h30.amarelo} amarelos · {h30.vermelho} vermelhos
                {h30.sem > 0 && ` · ${h30.sem} dias sem check`}
              </p>
            </>
          )}
      </Card>

      <Card>
        <div className="card-head">
          <h2>Autotestes</h2>
          {ultimo && <Pill t={J.simetriaOk(testes) ? 'simetria ok' : `abaixo de ${J.LSI_ALVO}%`}
            cor={J.simetriaOk(testes) ? 'ok' : 'warn'} />}
        </div>
        {!ultimo
          ? <p className="nota" style={{ margin: 0 }}>
              Nenhum registro ainda. A cada {J.DIAS_RETESTE} dias, faça os três até falhar em
              cada perna e anote as repetições boas.
            </p>
          : (
            <>
              <p className="nota" style={{ margin: '0 0 10px' }}>
                Último em {D.dataCurta(ultimo.data)} · próximo em {D.dataCurta(prox)} ({D.faltam(prox).txt})
              </p>
              <div className="bars">
                {J.linhasDoTeste(ultimo).map(l => (
                  <div className="bar-row" key={l.k}>
                    <span>{l.nome}</span>
                    <span className="v">D {l.d} · E {l.e} · {l.lsi ?? '—'}%</span>
                    <Barra pct={Math.min(100, l.lsi || 0)} />
                  </div>
                ))}
              </div>
            </>
          )}
        <div className="sep" />
        <NovoTeste onSalvar={a.addTeste} />
      </Card>

      <Card>
        <div className="card-head">
          <h2>Volta ao futebol</h2>
          <Pill t={`${v.feitos}/${v.total}`} cor={v.liberado ? 'ok' : 'neutral'} />
        </div>
        {J.CRITERIOS.map(c => {
          const feito = J.criterioFeito(c, s.volta, testes);
          return (
            <div className="row" key={c.k}>
              <Check on={feito} onClick={() => !c.auto && a.setVolta(c.k, !feito)} label={c.t} />
              <div className="row-txt">
                <b>{c.t}</b>
                {c.sub && <span>{c.sub}</span>}
              </div>
            </div>
          );
        })}
      </Card>
    </>
  );
}

/* registra um autoteste: repetições boas de cada perna nos três movimentos */
function NovoTeste({ onSalvar }) {
  const [v, setV] = useState({});
  const num = x => (String(x ?? '').trim() === '' ? null : Number(x));
  const completo = J.AUTOTESTES.every(t => num(v[t.k + 'd']) > 0 && num(v[t.k + 'e']) > 0);
  const salvar = () => {
    if (!completo) return;
    onSalvar(Object.fromEntries(J.AUTOTESTES.map(t =>
      [t.k, { d: num(v[t.k + 'd']), e: num(v[t.k + 'e']) }])));
    setV({});
  };
  return (
    <>
      <span className="label" style={{ display: 'block', marginBottom: 8 }}>Registrar um teste novo</span>
      {J.AUTOTESTES.map(t => (
        <div className="teste" key={t.k}>
          <b>{t.nome}</b>
          <span>{t.como}</span>
          <div className="teste-pernas">
            {[['d', 'direita'], ['e', 'esquerda']].map(([lado, rot]) => (
              <div className="field" key={lado}>
                <span>{lado.toUpperCase()}</span>
                <input className="campo-input num" inputMode="numeric"
                  aria-label={`${t.nome}, perna ${rot}`}
                  placeholder="reps" value={v[t.k + lado] ?? ''}
                  onChange={e => setV(p => ({ ...p, [t.k + lado]: e.target.value.replace(/\D/g, '').slice(0, 3) }))} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <motion.button className="btn-primary" style={{ marginTop: 12, opacity: completo ? 1 : .45 }}
        disabled={!completo} onClick={salvar} whileTap={{ scale: .97 }}>
        {completo ? 'Salvar teste de hoje' : 'Preencha as seis repetições'}
      </motion.button>
    </>
  );
}

/* ================= Dieta ================= */
function Dieta({ s, a }) {
  const ex = D.extraDoDia(s);
  const m = D.macrosDoDia(s);
  const grupos = Di.gruposDeRefeicao(s.listas.refeicoes);
  const gf = Di.gruposFeitos(grupos, ex);
  /* plano sem macro por refeição (o Web Diet só dá o total do dia): a tela
     conta refeição em vez de fingir que sabe os gramas de cada uma */
  const temMacro = s.listas.refeicoes.some(r => Number(r.prot) > 0 || Number(r.kcal) > 0);
  /* a meta de água sai do peso quando há pesagem, como manda o plano */
  const ag = D.metaAgua(s);
  const litros = (m.agua * s.cfg.mlGarrafa / 1000).toFixed(1).replace('.', ',');
  const alvoLitros = (ag.ml / 1000).toFixed(1).replace('.', ',');
  const ad = D.aderenciaPilar(s, 'diet');
  return (
    <>
      <Card>
        <div className="today">
          <Ring pct={gf.total ? Math.round(gf.feitos / gf.total * 100) : 0} sub="refeições" />
          <div className="today-txt">
            <h2>{temMacro ? `${m.prot} g de proteína` : `${gf.feitos} de ${gf.total} refeições`}</h2>
            <p>{!gf.total
              ? 'Cadastre suas refeições pra o app somar proteína e caloria sozinho.'
              : temMacro
                ? `${gf.feitos} de ${gf.total} refeições marcadas. Os gramas saem das refeições que você marcou.`
                : `Meta do dia: ${s.cfg.proteina} g de proteína e ${s.cfg.kcal.toLocaleString('pt-BR')} kcal. O plano não traz o macro de cada refeição, então aqui a conta é por refeição feita.`}</p>
          </div>
        </div>
        {temMacro && (
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
          extra={grupos.length > 0 ? <Pill t={`${gf.feitos}/${gf.total}`} cor={gf.feitos === gf.total ? 'ok' : 'neutral'} /> : null} />
        {grupos.length === 0
          ? <Convite a={a} chave="refeicoes" titulo="Refeições" rotulo="Cadastrar refeição"
            texto="Monte o seu dia de comida: nome, horário, proteína e caloria de cada refeição." />
          : grupos.map(g => <RefeicaoGrupo key={g.grupo} g={g} ex={ex} a={a} />)}
      </Card>

      {(s.listas.orientacoes || []).length > 0 && (
        <Card>
          <div className="card-head"><h2>Orientações do plano</h2></div>
          {s.listas.orientacoes.map((o, i) => (
            <div className="row alto" key={i}>
              <div className="row-txt">
                <b>{[o.titulo, o.hora].filter(Boolean).join(' · ')}</b>
                <span className="nota" style={{ margin: '3px 0 0' }}>{o.texto}</span>
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <div className="card-head"><h2>Água</h2><span className="more num">{litros} L de {alvoLitros} L</span></div>
        <div className="aguas" style={{ gridTemplateColumns: `repeat(${ag.garrafas}, 1fr)` }}>
          {Array.from({ length: ag.garrafas }, (_, i) => (
            <motion.button key={i} className="garrafa" whileTap={{ scale: .92 }}
              aria-pressed={i < m.agua} aria-label={`${i + 1}ª garrafa de ${s.cfg.mlGarrafa} ml`}
              onClick={() => a.setExtra('agua', m.agua === i + 1 ? i : i + 1)}>
              <motion.i initial={false} animate={{ scaleY: i < m.agua ? 1 : 0 }} transition={MOLA_CALMA} />
            </motion.button>
          ))}
        </div>
        <span className="label" style={{ display: 'block', marginTop: 10 }}>
          {ag.garrafas} de {s.cfg.mlGarrafa} ml · toque pra encher, toque de novo pra desfazer
        </span>
        <p className="nota" style={{ marginBottom: 0 }}>
          {ag.doPeso
            ? `Calculado dos seus ${String(ag.peso).replace('.', ',')} kg a ${ag.mlKg} ml por quilo, como o plano pede. Pese de novo e a meta acompanha.`
            : 'Número fixo dos Ajustes. Registre seu peso na Academia e a meta passa a sair de ml por quilo.'}
        </p>
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
  const cofs = D.cofres(s);
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
          : mes.map(t => {
            const cf = t.cofre && (s.listas.cofres || []).find(c => c.id === t.cofre);
            return (
              /* o lançamento abre pra editar: errar o valor não pode ser definitivo */
              <motion.button className="tx" key={t.id} whileTap={{ scale: .98 }}
                onClick={() => a.editarTx(t)} aria-label={`Editar ${t.desc}`}>
                <div className={`tx-ic ${t.v > 0 ? 'pos' : 'neg'}`}><Ico n={t.v > 0 ? 'sobe' : 'desce'} s={16} /></div>
                <div className="tx-txt">
                  <b>{t.desc}</b>
                  <span>{D.rotuloData(t.data)} · {t.cat}{cf ? ` · ${cf.nome}` : ''}</span>
                </div>
                <div className={`tx-v ${t.v > 0 ? 'pos' : 'neg'}`}>{t.v > 0 ? '+ ' : '− '}{D.brl(t.v)}</div>
              </motion.button>
            );
          })}
        {mes.length > 0 && <p className="nota" style={{ marginBottom: 0 }}>Toque num lançamento pra corrigir ou apagar.</p>}
      </Card>

      <Card>
        <Head titulo="Guardar dinheiro" chave="cofres" rotulo="Objetivos" a={a}
          extra={cofs.length > 0 ? <Pill t={D.brl(cofs.reduce((x, c) => x + c.tem, 0))} cor="ok" /> : null} />
        {cofs.length === 0
          ? <Convite a={a} chave="cofres" titulo="Objetivos" rotulo="Criar um objetivo"
            texto="Defina pra que você está juntando e quanto. Depois é só marcar o lançamento como guardado." />
          : cofs.map(c => (
            <div className="row alto" key={c.id}>
              <div className="row-txt">
                <b>{c.nome}</b>
                <span>
                  {D.brl(c.tem)} de {D.brl(c.alvo)}
                  {c.falta > 0 ? ` · faltam ${D.brl(c.falta)}` : ' · objetivo batido'}
                </span>
                <Barra pct={c.pct} />
                {c.ate && (
                  <span className="nota" style={{ margin: '5px 0 0' }}>
                    {c.venceu
                      ? `O prazo era ${D.dataCurta(c.ate)}.`
                      : c.falta === 0
                        ? `Fechou antes de ${D.dataCurta(c.ate)}.`
                        : `Até ${D.dataCurta(c.ate)} (${D.faltam(c.ate).txt}): ${D.brl(c.porMes)} por mês.`}
                  </span>
                )}
              </div>
              <div className="tx-v pos">{c.pct}%</div>
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
        <div className="card-head"><h2>Semana</h2></div>
        <div className="seg" role="group" aria-label="Modo da semana">
          {D.MODOS_SEMANA.map(([v, t]) => (
            <button key={v} aria-pressed={(s.modo || 'aula') === v} onClick={() => a.setCampo('modo', v)}>
              {(s.modo || 'aula') === v && <motion.span className="seg-thumb" layoutId="seg-modo" transition={MOLA_CALMA} />}
              {t}
            </button>
          ))}
        </div>
        <p className="nota">
          Troca quais hábitos valem. Na semana sem aula caem os de faculdade e entram
          os de férias — {D.habitosDoDia(s, D.iso()).length} {D.habitosDoDia(s, D.iso()).length === 1 ? 'hábito vale' : 'hábitos valem'} hoje.
        </p>
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
        <div className="card-head"><h2>Backup</h2></div>
        <Backup s={s} a={a} />
      </Card>

      <Card>
        <div className="card-head"><h2>Avisos no calendário</h2></div>
        <BaixarAvisos s={s} />
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
        <div className="card-head">
          <h2>Importar plano</h2>
          {(s.listas.treinos || []).length > 0 &&
            <Pill t={`${s.listas.treinos.length} rotinas`} cor="lilac" />}
        </div>
        <ImportarPlano a={a} />
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

/* Backup do perfil inteiro num arquivo. Sem isto, tudo mora no armazenamento
   do navegador e some junto com ele. */
function Backup({ s, a }) {
  const perfil = D.perfilEscolhido() || 'pedro';
  const [msg, setMsg] = useState('');
  const [ruim, setRuim] = useState(false);
  const [pronto, setPronto] = useState(null);

  const baixar = () => {
    const txt = JSON.stringify(D.paraBackup(s, perfil), null, 1);
    const url = URL.createObjectURL(new Blob([txt], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ritmo-${s.nome.toLowerCase()}-${D.iso()}.json`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setRuim(false);
    setMsg(`Backup de ${D.dataCurta(D.iso())} baixado. Guarde fora do aparelho.`);
  };

  const ler = async arquivo => {
    if (!arquivo) return;
    try {
      const estado = D.deBackup(JSON.parse(await arquivo.text()));
      if (!estado) { setRuim(true); setMsg('Isso não é um backup do Ritmo.'); setPronto(null); return; }
      setRuim(false); setPronto(estado);
      setMsg(`Backup de ${estado.nome}: ${estado.listas.habitos.length} hábitos, `
        + `${Object.keys(estado.dias).length} dias e ${estado.tx.length} lançamentos. Confirme pra substituir.`);
    } catch {
      setRuim(true); setPronto(null); setMsg('Não deu pra ler o arquivo.');
    }
  };

  return (
    <>
      <p className="nota" style={{ margin: '0 0 12px' }}>
        Tudo que você marca vive só neste navegador. Limpar os dados do site, trocar de
        aparelho ou o iPhone liberar espaço, e acabou. Baixe de vez em quando.
      </p>
      <motion.button className="btn-primary" style={{ width: '100%' }}
        onClick={baixar} whileTap={{ scale: .97 }}>Baixar backup de {s.nome}</motion.button>

      <label className="btn-ghost" style={{ display: "block", textAlign: "center", cursor: "pointer", marginTop: 10, lineHeight: "46px" }}>
        Restaurar de um arquivo
        <input type="file" accept=".json,application/json" style={{ display: 'none' }}
          onChange={e => { ler(e.target.files[0]); e.target.value = ''; }} />
      </label>

      {msg && <p className={ruim ? 'err' : 'nota'} role="status" style={{ marginTop: 10, marginBottom: 0 }}>{msg}</p>}
      {pronto && (
        <ConfirmaDuasVezes rotulo="Substituir este perfil pelo backup"
          confirma="Toque de novo: o que está aqui agora será perdido"
          onOk={() => { a.restaurar(pronto); setPronto(null); setMsg('Perfil restaurado.'); }} />
      )}
    </>
  );
}

/* Gera o .ics e entrega pro sistema. É o único aviso que toca com o app
   fechado: quem dispara é o Calendário, não o PWA. */
function BaixarAvisos({ s }) {
  const [msg, setMsg] = useState('');
  const { eventos, semHora } = ICS.avisosDoPerfil(s);

  const baixar = () => {
    const { texto } = ICS.avisosDoPerfil(s);
    const url = URL.createObjectURL(new Blob([texto], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ritmo-${s.nome.toLowerCase()}-${s.modo === 'ferias' ? 'sem-aula' : 'com-aula'}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg(`${eventos.length} ${eventos.length === 1 ? 'aviso' : 'avisos'} no arquivo. Abra e toque em “Adicionar ao Calendário”.`);
  };

  return (
    <>
      <p className="nota" style={{ margin: '0 0 12px' }}>
        O app não consegue te avisar fechado, mas o Calendário consegue. Isto gera um
        arquivo com os hábitos que têm horário e com o reteste do joelho, pra você
        importar uma vez no iPhone. Refaça depois de cada autoteste: a data anda.
      </p>
      <motion.button className="btn-primary" style={{ width: '100%', opacity: eventos.length ? 1 : .45 }}
        disabled={!eventos.length} onClick={baixar} whileTap={{ scale: .97 }}>
        {eventos.length ? `Baixar ${eventos.length} avisos pro calendário` : 'Nenhum hábito com horário ainda'}
      </motion.button>
      {semHora > 0 && (
        <p className="nota" style={{ marginBottom: 0 }}>
          {semHora} {semHora === 1 ? 'hábito ficou de fora por não ter horário' : 'hábitos ficaram de fora por não terem horário'}.
          Preencha o campo Horário em Rotina → Editar.
        </p>
      )}
      {msg && <p className="nota" role="status" style={{ marginBottom: 0 }}>{msg}</p>}
    </>
  );
}

/* Um horário de refeição. Com mais de uma opção no mesmo grupo, elas são
   alternativas: escolhe uma, e marcar qualquer uma já fecha o horário. */
function RefeicaoGrupo({ g, ex, a }) {
  const [sel, setSel] = useState(g.opcoes[0].id);
  const marcada = g.opcoes.find(o => ex['rf' + o.id]);
  const r = marcada || g.opcoes.find(o => o.id === sel) || g.opcoes[0];
  return (
    <div className="row alto">
      <Check on={!!ex['rf' + r.id]} onClick={() => a.toggleExtra('rf' + r.id)} label={r.nome} />
      <div className="row-txt">
        <b>{[g.nome, g.hora].filter(Boolean).join(' · ')}</b>
        {g.opcoes.length > 1 && (
          <div className="chips" role="group" aria-label={`Opções de ${g.nome}`}>
            {g.opcoes.map(o => (
              <motion.button key={o.id} className="chip" aria-pressed={o.id === r.id}
                onClick={() => setSel(o.id)} whileTap={{ scale: .94 }}>{o.nome}</motion.button>
            ))}
          </div>
        )}
        {r.itens && r.itens.length > 0 ? (
          <ul className="itens">
            {r.itens.map((it, i) => (
              <li key={i}>
                <b>{it.nome}</b> <i>{it.qtd}</i>
                {it.subs.length > 0 && (
                  <details>
                    <summary>{it.subs.length} substituiç{it.subs.length === 1 ? 'ão' : 'ões'}</summary>
                    <ul>{it.subs.map((sb, j) => <li key={j}><b>{sb.nome}</b> <i>{sb.qtd}</i></li>)}</ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
        ) : <span>{r.o || '—'}</span>}
        {r.obs && <span className="nota">{r.obs}</span>}
      </div>
      {r.prot !== '' && r.prot != null && <span className="tx-v">{r.prot} g</span>}
    </div>
  );
}

/* Importa o .opengym-plan.json. Substitui as rotinas e a divisão da semana;
   não inventa nome: exercício sem par no mapa aparece pelo código. */
function ImportarPlano({ a }) {
  const [msg, setMsg] = useState('');
  const [ruim, setRuim] = useState(false);

  const ler = async arquivo => {
    if (!arquivo) return;
    try {
      const json = JSON.parse(await arquivo.text());

      /* rotina: o arquivo traz hábitos */
      if (Array.isArray(json.habitos)) {
        const habitos = json.habitos.map(hb => ({ ...hb, id: D.novoId() }));
        if (!habitos.length) { setRuim(true); setMsg('Esse arquivo não tem hábito nenhum.'); return; }
        a.importarRotina(habitos);
        setRuim(false);
        setMsg(`${habitos.length} hábitos nos pilares. Os dias já marcados continuam como estavam.`);
        return;
      }

      /* dieta: o arquivo traz refeições */
      if (Array.isArray(json.refeicoes)) {
        const { refeicoes, cfg, orientacoes } = Di.importarPlanoDieta(json);
        if (!refeicoes.length) { setRuim(true); setMsg('Esse arquivo não tem refeição nenhuma.'); return; }
        a.importarDieta(refeicoes, cfg, orientacoes);
        const g = Di.gruposDeRefeicao(refeicoes).length;
        setRuim(false);
        setMsg(`${refeicoes.length} refeições em ${g} ${g === 1 ? 'horário' : 'horários'}.`
          + (cfg.proteina ? ` Meta do dia ajustada pra ${cfg.proteina} g e ${cfg.kcal} kcal.` : ''));
        return;
      }

      /* treino: o export do OpenGym */
      const { treinos, split } = T.importarOpenGym(json);
      if (!treinos.length) {
        setRuim(true);
        setMsg('Esse arquivo não tem rotina nem refeição dentro.');
        return;
      }
      const comNome = T.comNomes(treinos, NOMES_OPENGYM);
      const semNome = comNome.flatMap(t => t.ex).filter(e => !e.nome).length;
      a.importarPlano(comNome, split);
      setRuim(false);
      setMsg(`${comNome.length} ${comNome.length === 1 ? 'rotina' : 'rotinas'} e a divisão da semana.`
        + (semNome ? ` ${semNome} ${semNome === 1 ? 'exercício' : 'exercícios'} sem nome, aparecem pelo código.` : ''));
    } catch {
      setRuim(true);
      setMsg('Não deu pra ler. Precisa ser o .json do OpenGym ou o do plano de dieta.');
    }
  };

  return (
    <>
      <p className="nota" style={{ margin: '0 0 12px' }}>
        Aceita o arquivo que o OpenGym exporta (treino) e o arquivo do plano de dieta.
        Substitui só a parte correspondente deste perfil; o resto dos seus dados fica igual.
      </p>
      <label className="btn-primary" style={{ display: 'block', textAlign: 'center', cursor: 'pointer' }}>
        Escolher arquivo do plano
        <input type="file" accept=".json,application/json" style={{ display: 'none' }}
          onChange={e => { ler(e.target.files[0]); e.target.value = ''; }} />
      </label>
      {msg && <p className={ruim ? 'err' : 'nota'} role="status" style={{ marginTop: 10 }}>{msg}</p>}

      <div className="sep" />
      <p className="nota" style={{ margin: '0 0 12px' }}>
        O plano do Pedro já vem junto com o app: treino, dieta e rotina de uma vez,
        sem precisar do arquivo. Substitui o que estiver neste perfil.
      </p>
      <ConfirmaDuasVezes rotulo="Usar o plano que já vem no app"
        confirma="Toque de novo: substitui treino, dieta e rotina"
        onOk={() => {
          const { treinos, split } = T.importarOpenGym(PLANO_TREINO);
          a.importarPlano(T.comNomes(treinos, NOMES_OPENGYM), split);
          const { refeicoes, cfg, orientacoes } = Di.importarPlanoDieta(PLANO_DIETA);
          a.importarDieta(refeicoes, cfg, orientacoes);
          a.importarRotina(PLANO_ROTINA.habitos.map(hb => ({ ...hb, id: D.novoId() })));
          setRuim(false);
          setMsg(`${treinos.length} rotinas de treino, ${refeicoes.length} refeições e ${PLANO_ROTINA.habitos.length} hábitos.`);
        }} />
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
  hoje: Hoje, percurso: Percurso, rotina: Rotina, academia: Academia, joelho: Joelho, dieta: Dieta,
  faculdade: Faculdade, estagio: Estagio, financeiro: Financeiro, metas: Metas, ajustes: Ajustes,
};
