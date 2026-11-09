/* Casca do Ritmo: escolha de perfil, menu lateral que empurra a tela,
   troca de tela em cascata, a folha de lançamento e o editor de listas. */
import { useEffect, useMemo, useState } from 'react';
import {
  motion, AnimatePresence, MotionConfig, useMotionValue, useTransform, animate, useAnimation,
} from 'framer-motion';
import * as D from './store.js';
import * as J from './joelho.js';
import * as Di from './dieta.js';
import { TELAS } from './screens.jsx';
import { Folha, Gerenciador } from './editor.jsx';
import { Anim, Ico, LISTA, SUAVE, MOLA_CALMA } from './ui.jsx';

const MENU = [
  ['hoje', 'Hoje', 'hoje'], ['percurso', 'Percurso', 'percurso'], ['rotina', 'Rotina', 'rotina'],
  ['progresso', 'Progresso', 'progresso'],
  ['academia', 'Academia', 'gym'], ['joelho', 'Joelho', 'gym'],
  ['dieta', 'Dieta', 'diet'], ['faculdade', 'Faculdade', 'fac'],
  ['estagio', 'Estágio', 'est'], ['financeiro', 'Financeiro', 'fin'], ['metas', 'Metas', 'metas'],
  ['ajustes', 'Ajustes', 'ajustes'],
];
const TITULO = Object.fromEntries(MENU.map(([id, nome]) => [id, nome]));
const EMPURRA = 236;  // quanto o menu empurra a tela, em px

const mesAtual = () => {
  const t = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const subtitulo = (tela, s) => {
  const c = D.ciclo(s);
  const m = D.macrosDoDia(s);
  return {
    hoje: D.dataLonga(),
    percurso: `Dia ${c.dia} de ${D.CICLO_DIAS} · fase ${c.fase.nome}`,
    rotina: `Hoje acorda ${D.emHora(D.acordaMin(s, D.iso()))} · dorme ${D.emHora(D.dormeMin(s, D.iso()))}`,
    progresso: (() => {
      const r = D.resumoDias(s, 7);
      if (!D.primeiroDia(s)) return 'sem histórico ainda';
      return r.contados ? `média de ${r.media}% nos últimos 7 dias` : 'primeiro dia';
    })(),
    academia: `${D.diasComPilar(s, 'gym')} dias de treino no mês`,
    joelho: (() => {
      const luz = J.luzDoDia(s, D.iso());
      const v = J.voltaAoCampo(s.volta, s.listas.testes);
      return `${luz ? `Hoje no ${luz}` : 'Sem check hoje'} · ${v.feitos} de ${v.total} critérios`;
    })(),
    dieta: (() => {
      /* conta horário, não refeição: os três lanches são um só */
      const g = Di.gruposDeRefeicao(s.listas.refeicoes);
      if (!g.length) return 'sem refeições cadastradas';
      const f = Di.gruposFeitos(g, D.extraDoDia(s));
      return `${f.feitos} de ${f.total} refeições${m.prot ? ` · ${m.prot} g` : ''}`;
    })(),
    faculdade: `${s.listas.materias.length} ${s.listas.materias.length === 1 ? 'matéria' : 'matérias'}`,
    estagio: `${String(D.horasDaSemana(s).reduce((t, d) => t + d.horas, 0)).replace('.', ',')}h de ${s.cfg.horasSemana}h na semana`,
    financeiro: mesAtual(),
    metas: `${s.listas.metas.length} no ciclo`,
    ajustes: s.nome,
  }[tela] || '';
};

export default function App() {
  const [perfil, setPerfil] = useState(() => D.perfilEscolhido());
  const [s, setS] = useState(() => (D.perfilEscolhido() ? D.carregarPerfil(D.perfilEscolhido()) : null));
  const [tela, setTela] = useState('hoje');
  const [menu, setMenu] = useState(false);
  const [folha, setFolha] = useState(null);
  const [gestor, setGestor] = useState(null);
  const [pulo, setPulo] = useState(0);

  useEffect(() => { if (perfil && s) D.salvarPerfil(perfil, s); }, [s, perfil]);
  useEffect(() => {
    const el = document.documentElement;
    const t = s ? s.tema : 'sistema';
    if (t === 'sistema') delete el.dataset.theme;
    else el.dataset.theme = t === 'escuro' ? 'dark' : 'light';
  }, [s]);
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') { setFolha(null); setGestor(null); setMenu(false); } };
    addEventListener('keydown', h);
    return () => removeEventListener('keydown', h);
  }, []);

  /* A janela nunca deveria rolar: quem rola é o .scroll lá dentro. Quando o
     teclado do iOS rola ela mesmo assim, o app fica desenhado num lugar e
     recebendo toque em outro. Isso aqui devolve pro zero sempre que a janela
     muda de tamanho, que é quando o teclado abre e fecha. */
  useEffect(() => {
    const nivelar = () => { if (window.scrollY || window.scrollX) window.scrollTo(0, 0); };
    const vv = window.visualViewport;
    vv?.addEventListener('resize', nivelar);
    vv?.addEventListener('scroll', nivelar);
    addEventListener('orientationchange', nivelar);
    return () => {
      vv?.removeEventListener('resize', nivelar);
      vv?.removeEventListener('scroll', nivelar);
      removeEventListener('orientationchange', nivelar);
    };
  }, []);

  /* o empurrão: x manda em escala, canto e sombra do fundo */
  const x = useMotionValue(0);
  const scale = useTransform(x, [0, EMPURRA], [1, .88]);
  const raio = useTransform(x, [0, EMPURRA], [0, 42]);
  const sombra = useTransform(x, [0, EMPURRA], [0, 1]);
  useEffect(() => { animate(x, menu ? EMPURRA : 0, SUAVE); }, [menu, x]);

  const trocarPerfil = id => {
    D.escolherPerfil(id);
    setPerfil(id);
    setS(D.carregarPerfil(id));
    setTela('hoje');
    setMenu(false);
    setFolha(null);
    setGestor(null);
  };

  const a = useMemo(() => ({
    /* `k` deixa consertar um dia passado; sem ele, é hoje */
    marcar: (id, v, k = D.iso()) => {
      if (v === 'sim' && k === D.iso()) setPulo(p => p + 1);
      setS(p => {
        const dia = { ...(p.dias[k] || {}) };
        if (v === null) delete dia[id]; else dia[id] = v;
        return { ...p, dias: { ...p.dias, [k]: dia } };
      });
    },
    /* marcações do dia que não são hábito: refeições, água, exercícios, horas */
    toggleExtra: (chave, k = D.iso()) => setS(p => {
      const e = { ...(p.extra[k] || {}) };
      e[chave] = !e[chave];
      return { ...p, extra: { ...p.extra, [k]: e } };
    }),
    setExtra: (chave, valor, k = D.iso()) =>
      setS(p => ({ ...p, extra: { ...p.extra, [k]: { ...(p.extra[k] || {}), [chave]: valor } } })),
    go: t => { setTela(t); setMenu(false); },
    addTx: tx => setS(p => ({ ...p, tx: [tx, ...p.tx] })),
    /* editar e apagar lançamento: errar o valor não pode ser definitivo */
    editTx: tx => setS(p => ({ ...p, tx: p.tx.map(t => (t.id === tx.id ? { ...t, ...tx } : t)) })),
    delTx: id => setS(p => ({ ...p, tx: p.tx.filter(t => t.id !== id) })),
    editarTx: t => setFolha(t),
    /* troca o perfil inteiro por um backup lido de arquivo */
    restaurar: estado => setS(estado),
    setCampo: (k, v) => setS(p => ({ ...p, [k]: v })),
    /* hora de acordar é texto (07:00), não número como o resto do cfg */
    setAcorda: v => { if (D.emMinutos(v) != null) setS(p => ({ ...p, cfg: { ...p.cfg, acorda: D.emHora(D.emMinutos(v)) } })); },
    /* hora própria de um dia da semana; null volta pra de todo dia */
    setAcordaDia: (dia, v) => setS(p => {
      const m = { ...(p.acordaDia || {}) };
      if (v == null) delete m[dia];
      else if (D.emMinutos(v) != null) m[dia] = D.emHora(D.emMinutos(v));
      else return p;
      return { ...p, acordaDia: m };
    }),
    /* campo opcional apagado fica em branco (usa o padrão), não vira zero */
    setCfg: (k, v) => setS(p => ({ ...p, cfg: { ...p.cfg, [k]: v === '' ? (D.CFG_OPCIONAL.includes(k) ? '' : 0) : Number(v) } })),
    reiniciarCiclo: () => setS(p => ({ ...p, cicloInicio: D.iso() })),
    /* plano de treino vindo de fora; substitui as rotinas e a divisão da semana */
    importarPlano: (treinos, split) => setS(p => ({
      ...p, listas: { ...p.listas, treinos, split },
    })),
    /* dieta de fora: troca as refeições e puxa o total do dia pras metas */
    importarDieta: (refeicoes, cfg, orientacoes = []) => setS(p => ({
      ...p, cfg: { ...p.cfg, ...cfg }, listas: { ...p.listas, refeicoes, orientacoes },
    })),
    /* rotina de fora: troca os hábitos, mantendo o histórico dos dias */
    importarRotina: (habitos, turnos) => setS(p => ({
      ...p, listas: { ...p.listas, habitos, ...(turnos ? { turnos } : {}) },
    })),
    /* joelho: o check do dia, os autotestes e os critérios de volta */
    setJoelho: check => setS(p => ({ ...p, joelho: { ...p.joelho, [D.iso()]: check } })),
    setVolta: (k, v) => setS(p => ({ ...p, volta: { ...p.volta, [k]: v } })),
    addTeste: t => setS(p => D.comItem(p, 'testes', { ...t, data: D.iso() })),
    apagarPerfil: () => setS(p => D.perfilApagado(D.perfilEscolhido(), p.nome)),
    gerir: (chave, filtro, titulo) => setGestor({ chave, filtro, titulo }),
  }), []);

  /* primeira abertura: quem é você? */
  if (!perfil || !s) return <Escolha onEscolher={trocarPerfil} />;

  const seq = D.sequencia(s);
  const c = D.ciclo(s);
  const Tela = TELAS[tela];

  return (
    <Anim.Provider value={s.anim}>
      <MotionConfig reducedMotion={s.anim ? 'never' : 'always'}>
        <div className="shell">
          <nav className="drawer" aria-label="Menu lateral">
            <div className="perfis" role="group" aria-label="Quem está usando">
              {D.PERFIS.map(p => {
                const ativo = p.id === perfil;
                return (
                  <motion.button key={p.id} className="perfil" aria-pressed={ativo} whileTap={{ scale: .96 }}
                    onClick={() => !ativo && trocarPerfil(p.id)}>
                    {ativo && <motion.span className="perfil-thumb" layoutId="perfil-thumb" transition={MOLA_CALMA} />}
                    <span className="perfil-txt">{ativo ? s.nome : p.nome}</span>
                  </motion.button>
                );
              })}
            </div>
            <p className="drawer-sub">
              Dia {c.dia} de {D.CICLO_DIAS} · {seq === 0 ? 'sem sequência ainda' : `${seq} ${seq === 1 ? 'dia' : 'dias'} seguidos`}
            </p>
            <motion.div className="nav" animate={menu ? 'show' : 'hide'}
              variants={{ hide: {}, show: { transition: { staggerChildren: .034, delayChildren: .06 } } }}>
              {/* Joelho só existe pra quem importou um plano de treino — o perfil
                  que não tem plano nem vê a aba */}
              {MENU.filter(([id]) => id !== 'joelho' || (s.listas.treinos || []).length > 0)
                .map(([id, nome, icon]) => (
                <motion.button key={id} className="nav-item" onClick={() => a.go(id)}
                  aria-current={tela === id ? 'page' : undefined}
                  variants={{ hide: { opacity: 0, x: -18 }, show: { opacity: 1, x: 0 } }}
                  whileTap={{ scale: .97 }}>
                  <Ico n={icon} /> {nome}
                </motion.button>
              ))}
            </motion.div>
            <div className="drawer-foot">Ritmo 0.2 · salvo neste aparelho</div>
          </nav>

          <motion.div className="app"
            style={{ x, scale, borderRadius: raio }}
            drag={folha || gestor ? false : 'x'} dragDirectionLock dragElastic={.05} dragMomentum={false}
            dragConstraints={{ left: 0, right: EMPURRA }}
            onDragEnd={(_, i) => {
              const abrir = menu
                ? !(i.offset.x < -70 || i.velocity.x < -400)
                : (i.offset.x > 90 || i.velocity.x > 400);
              setMenu(abrir);
              animate(x, abrir ? EMPURRA : 0, SUAVE);   // encaixa mesmo se o estado não mudou
            }}>

            <header className="appbar">
              <motion.button className="icon-btn" onClick={() => setMenu(m => !m)}
                aria-label="Abrir menu lateral" aria-expanded={menu} whileTap={{ scale: .92 }}>
                <Ico n="menu" s={20} w={1.9} />
              </motion.button>
              <div className="appbar-txt">
                <h1>{TITULO[tela]}</h1>
                <p>{subtitulo(tela, s)}</p>
              </div>
              <motion.div className="streak" key={pulo} initial={{ scale: 1 }} animate={{ scale: [1, 1.14, 1] }}
                transition={{ duration: .5, ease: [.22, 1, .36, 1] }}
                title={`Dias seguidos com ${s.cfg.metaDia}% ou mais da rotina`}>
                <Ico n="chama" s={15} w={1.8} />
                <span className="num">{seq}</span>
              </motion.div>
            </header>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={tela} className="scroll" variants={LISTA} initial="hide" animate="show"
                exit={{ opacity: 0, y: -8, transition: { duration: .16 } }}>
                <Tela s={s} a={a} />
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {tela === 'financeiro' && !folha && !gestor && (
                <motion.button className="fab" onClick={() => setFolha({})}
                  initial={{ opacity: 0, scale: .8, y: 22 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: .8, y: 22 }} transition={MOLA_CALMA} whileTap={{ scale: .94 }}>
                  <Ico n="mais" s={18} w={2.2} /> Lançamento
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {folha && (
                /* Quem decide entre criar e editar é a folha que abriu, não o
                   objeto salvo: o salvo sempre tem id, porque o formulário gera
                   um quando falta — e por isso todo lançamento novo virava uma
                   edição de algo que não existia, e sumia. */
                <Lancamento key="lanc" cats={s.listas.cats} cofres={s.listas.cofres || []} tx={folha}
                  onFechar={() => setFolha(null)}
                  onSalvar={novo => { (folha.id ? a.editTx : a.addTx)(novo); setFolha(null); }}
                  onApagar={id => { a.delTx(id); setFolha(null); }} />
              )}
              {gestor && (
                <Gerenciador key="gestor" s={s} {...gestor}
                  onFechar={() => setGestor(null)}
                  onSalvar={(chave, item) => setS(p => D.comItem(p, chave, item))}
                  onApagar={(chave, id) => setS(p => D.semItem(p, chave, id))} />
              )}
            </AnimatePresence>

            <motion.button className="scrim" aria-label="Fechar menu lateral" tabIndex={menu ? 0 : -1}
              onClick={() => setMenu(false)}
              style={{ opacity: sombra, pointerEvents: menu ? 'auto' : 'none' }} />
          </motion.div>
        </div>
      </MotionConfig>
    </Anim.Provider>
  );
}

/* ---- primeira abertura ---- */
function Escolha({ onEscolher }) {
  return (
    <div className="escolha">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={SUAVE}>
        <h1>Ritmo</h1>
        <p>Rotina, dieta, treino e dinheiro num percurso de {D.CICLO_DIAS} dias.<br />Quem está usando agora?</p>
        <div className="escolha-botoes">
          {D.PERFIS.map((p, i) => (
            <motion.button key={p.id} onClick={() => onEscolher(p.id)}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ ...SUAVE, delay: .12 + i * .08 }} whileTap={{ scale: .96 }}>
              <span className="avatar">{p.nome[0]}</span>
              {p.nome}
            </motion.button>
          ))}
        </div>
        <span className="label">Dá pra trocar de pessoa a qualquer hora, no menu lateral</span>
      </motion.div>
    </div>
  );
}

/* ---- folha de baixo: novo lançamento ---- */
function Lancamento({ cats, cofres = [], tx = {}, onFechar, onSalvar, onApagar }) {
  const editando = !!tx.id;
  const [tipo, setTipo] = useState(tx.v > 0 ? 'in' : 'out');
  const [cat, setCat] = useState(tx.cat || (cats[0] ? cats[0].nome : ''));
  const [valor, setValor] = useState(tx.v ? String(Math.abs(tx.v)).replace('.', ',') : '');
  const [desc, setDesc] = useState(tx.desc || '');
  const [cofre, setCofre] = useState(tx.cofre || '');
  const [erro, setErro] = useState('');
  const [armado, setArmado] = useState(false);
  const tremor = useAnimation();

  const salvar = () => {
    const v = D.valorDigitado(valor);
    if (!Number.isFinite(v) || v <= 0) {
      setErro('Digite um valor maior que zero, tipo 45,90.');
      tremor.start({ x: [0, -7, 6, -3, 0] }, { duration: .4 });
      return;
    }
    onSalvar({
      id: tx.id || D.novoId(),
      data: tx.data || D.iso(),
      desc: desc.trim() || (tipo === 'in' ? 'Entrada' : cat || 'Gasto'),
      cat: cat || 'Sem categoria',
      v: tipo === 'in' ? v : -v,
      ...(cofre ? { cofre } : { cofre: undefined }),
    });
  };

  return (
    <Folha onFechar={onFechar} label={editando ? 'Editar lançamento' : 'Novo lançamento'}>
      <div className="seg" role="group" aria-label="Tipo de lançamento">
        {[['out', 'Gastei'], ['in', 'Recebi']].map(([k, t]) => (
          <button key={k} aria-pressed={tipo === k} onClick={() => setTipo(k)}>
            {tipo === k && <motion.span className="seg-thumb" layoutId="seg-thumb" transition={MOLA_CALMA} />}
            {t}
          </button>
        ))}
      </div>

      <motion.div className={`field ${erro ? 'bad' : ''}`} animate={tremor}>
        <span>R$</span>
        <input value={valor} inputMode="decimal" placeholder="0,00" aria-label="Valor em reais" autoFocus
          onChange={e => { setValor(e.target.value); setErro(''); }}
          onKeyDown={e => e.key === 'Enter' && salvar()} />
      </motion.div>
      <p className="err" role="status">{erro}</p>

      <div className="field">
        <input value={desc} placeholder="No que foi? (opcional)" aria-label="Descrição" className="campo-input"
          onChange={e => setDesc(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && salvar()} />
      </div>

      <div className="chips" role="group" aria-label="Categoria">
        {cats.map(c => (
          <motion.button key={c.id} className="chip" aria-pressed={cat === c.nome}
            onClick={() => setCat(c.nome)} whileTap={{ scale: .94 }}>{c.nome}</motion.button>
        ))}
      </div>

      {cofres.length > 0 && (
        <>
          <span className="label" style={{ display: 'block', margin: '4px 0 0' }}>
            {tipo === 'out' ? 'Guardar num objetivo' : 'Tirar de um objetivo'}
          </span>
          <div className="chips" role="group" aria-label="Objetivo">
            <motion.button className="chip" aria-pressed={cofre === ''}
              onClick={() => setCofre('')} whileTap={{ scale: .94 }}>Nenhum</motion.button>
            {cofres.map(c => (
              <motion.button key={c.id} className="chip" aria-pressed={cofre === c.id}
                onClick={() => setCofre(c.id)} whileTap={{ scale: .94 }}>{c.nome}</motion.button>
            ))}
          </div>
        </>
      )}

      <motion.button className="btn-primary" onClick={salvar} whileTap={{ scale: .97 }}>
        {editando ? 'Salvar alteração' : 'Salvar lançamento'}
      </motion.button>

      {editando && (
        <motion.button className={`btn-ghost ${armado ? 'danger' : ''}`} style={{ marginTop: 10 }}
          whileTap={{ scale: .97 }}
          onClick={() => (armado ? onApagar(tx.id) : setArmado(true))}>
          {armado ? 'Toque de novo pra apagar' : 'Apagar lançamento'}
        </motion.button>
      )}
    </Folha>
  );
}
