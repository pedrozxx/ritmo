/* Casca do Ritmo: menu lateral que empurra a tela, troca de tela em cascata
   e a folha de baixo do financeiro. O movimento é o aprovado no protótipo. */
import { useEffect, useMemo, useState } from 'react';
import {
  motion, AnimatePresence, MotionConfig, useMotionValue, useTransform, animate, useAnimation,
} from 'framer-motion';
import * as D from './store.js';
import { TELAS } from './screens.jsx';
import { Anim, Ico, Tick, LISTA, SUAVE, MOLA_CALMA } from './ui.jsx';

const MENU = [
  ['hoje', 'Hoje', 'hoje'], ['percurso', 'Percurso', 'percurso'], ['rotina', 'Rotina', 'rotina'],
  ['academia', 'Academia', 'gym'], ['dieta', 'Dieta', 'diet'], ['faculdade', 'Faculdade', 'fac'],
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
    rotina: `${D.HABITOS.length} itens em ${D.PILARES.length} pilares`,
    academia: `${D.contarHabito(s.dias, 'treino')} treinos neste mês`,
    dieta: `${m.feitas} de ${m.total} refeições · ${m.prot} g`,
    faculdade: '4 matérias · 2026.2',
    estagio: '24h de 30h na semana',
    financeiro: mesAtual(),
    metas: `${s.metas.length} no ciclo`,
    ajustes: 'Ritmo 0.1',
  }[tela] || '';
};

export default function App() {
  const [s, setS] = useState(D.carregar);
  const [tela, setTela] = useState('hoje');
  const [menu, setMenu] = useState(false);
  const [folha, setFolha] = useState(false);
  const [pulo, setPulo] = useState(0);

  useEffect(() => { D.salvar(s); }, [s]);
  useEffect(() => {
    const el = document.documentElement;
    if (s.tema === 'sistema') delete el.dataset.theme;
    else el.dataset.theme = s.tema === 'escuro' ? 'dark' : 'light';
  }, [s.tema]);
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') { setFolha(false); setMenu(false); } };
    addEventListener('keydown', h);
    return () => removeEventListener('keydown', h);
  }, []);

  /* o empurrão: x manda em escala, canto e sombra do fundo */
  const x = useMotionValue(0);
  const scale = useTransform(x, [0, EMPURRA], [1, .88]);
  const raio = useTransform(x, [0, EMPURRA], [0, 42]);
  const sombra = useTransform(x, [0, EMPURRA], [0, 1]);
  useEffect(() => { animate(x, menu ? EMPURRA : 0, SUAVE); }, [menu, x]);

  const a = useMemo(() => ({
    marcar: (id, v) => {
      if (v === 'sim') setPulo(p => p + 1);
      setS(p => {
        const k = D.iso(), dia = { ...(p.dias[k] || {}) };
        if (v === null) delete dia[id]; else dia[id] = v;
        return { ...p, dias: { ...p.dias, [k]: dia } };
      });
    },
    toggle: k => setS(p => ({ ...p, marcados: { ...p.marcados, [k]: !p.marcados[k] } })),
    /* marcações do dia que não são hábito: refeições, água, exercícios, tarefas */
    toggleExtra: chave => setS(p => {
      const k = D.iso(), e = { ...(p.extra[k] || {}) };
      e[chave] = !e[chave];
      return { ...p, extra: { ...p.extra, [k]: e } };
    }),
    setExtra: (chave, valor) => setS(p => {
      const k = D.iso();
      return { ...p, extra: { ...p.extra, [k]: { ...(p.extra[k] || {}), [chave]: valor } } };
    }),
    reiniciarCiclo: () => setS(p => ({ ...p, cicloInicio: D.iso() })),
    go: t => { setTela(t); setMenu(false); },
    addTx: tx => setS(p => ({ ...p, tx: [tx, ...p.tx] })),
    setTema: tema => setS(p => ({ ...p, tema })),
    setAnim: anim => setS(p => ({ ...p, anim })),
    limparExemplo: () => setS(p => ({ ...p, exemplo: false, tx: [], dias: { [D.iso()]: p.dias[D.iso()] || {} } })),
    apagarTudo: () => setS(D.vazio()),
  }), []);

  const seq = useMemo(() => D.sequencia(s.dias), [s.dias]);
  const Tela = TELAS[tela];

  return (
    <Anim.Provider value={s.anim}>
      <MotionConfig reducedMotion={s.anim ? 'never' : 'always'}>
        <div className="shell">
          <nav className="drawer" aria-label="Menu lateral">
            <div className="drawer-head">
              <div className="avatar">P</div>
              <div>
                <b>Pedro</b>
                <span>Dia {D.ciclo(s).dia} de {D.CICLO_DIAS} · {seq === 0 ? 'sem sequência' : `${seq} ${seq === 1 ? 'dia' : 'dias'} seguidos`}</span>
              </div>
            </div>
            <motion.div className="nav" animate={menu ? 'show' : 'hide'}
              variants={{ hide: {}, show: { transition: { staggerChildren: .038, delayChildren: .07 } } }}>
              {MENU.map(([id, nome, icon]) => (
                <motion.button key={id} className="nav-item" onClick={() => a.go(id)}
                  aria-current={tela === id ? 'page' : undefined}
                  variants={{ hide: { opacity: 0, x: -18 }, show: { opacity: 1, x: 0 } }}
                  whileTap={{ scale: .97 }}>
                  <Ico n={icon} /> {nome}
                </motion.button>
              ))}
            </motion.div>
            <div className="drawer-foot">Ritmo 0.1 · salvo neste aparelho</div>
          </nav>

          <motion.div className="app"
            style={{ x, scale, borderRadius: raio }}
            drag={folha ? false : 'x'} dragDirectionLock dragElastic={.05} dragMomentum={false}
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
                title={`Dias seguidos com ${D.META_DIA}% ou mais da rotina`}>
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
              {tela === 'financeiro' && !folha && (
                <motion.button className="fab" onClick={() => setFolha(true)}
                  initial={{ opacity: 0, scale: .8, y: 22 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: .8, y: 22 }} transition={MOLA_CALMA} whileTap={{ scale: .94 }}>
                  <Ico n="mais" s={18} w={2.2} /> Lançamento
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {folha && (
                <>
                  <motion.button className="sheet-bd" aria-label="Fechar" onClick={() => setFolha(false)}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                  <Lancamento
                    onFechar={() => setFolha(false)}
                    onSalvar={tx => { a.addTx(tx); setFolha(false); }} />
                </>
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

/* ---- folha de baixo: novo lançamento ---- */
function Lancamento({ onFechar, onSalvar }) {
  const [tipo, setTipo] = useState('out');
  const [cat, setCat] = useState('Alimentação');
  const [valor, setValor] = useState('');
  const [desc, setDesc] = useState('');
  const [erro, setErro] = useState('');
  const tremor = useAnimation();

  const salvar = () => {
    const v = D.valorDigitado(valor);
    if (!Number.isFinite(v) || v <= 0) {
      setErro('Digite um valor maior que zero, tipo 45,90.');
      tremor.start({ x: [0, -7, 6, -3, 0] }, { duration: .4 });
      return;
    }
    onSalvar({
      id: Date.now(),
      data: D.iso(),
      desc: desc.trim() || (tipo === 'in' ? 'Entrada avulsa' : `Gasto de ${cat.toLowerCase()}`),
      cat,
      meio: 'Pix',
      v: tipo === 'in' ? v : -v,
    });
  };

  return (
    <motion.div className="sheet" role="dialog" aria-modal="true" aria-label="Novo lançamento"
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={MOLA_CALMA}
      drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: .4 }} dragMomentum={false}
      onDragEnd={(_, i) => { if (i.offset.y > 110 || i.velocity.y > 500) onFechar(); }}>
      <div className="grip" />

      <div className="seg" role="group" aria-label="Tipo de lançamento">
        {[['out', 'Gastei'], ['in', 'Recebi']].map(([k, t]) => (
          <button key={k} aria-pressed={tipo === k}
            onClick={() => { setTipo(k); setCat(k === 'in' ? 'Renda' : 'Alimentação'); }}>
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

      <div className="field" style={{ marginBottom: 2 }}>
        <input value={desc} placeholder="No que foi? (opcional)" aria-label="Descrição"
          style={{ fontSize: 16, fontWeight: 500, fontFamily: 'inherit' }}
          onChange={e => setDesc(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && salvar()} />
      </div>

      <div className="chips" role="group" aria-label="Categoria">
        {D.CATS.map(c => (
          <motion.button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)} whileTap={{ scale: .94 }}>
            {c}
          </motion.button>
        ))}
      </div>

      <motion.button className="btn-primary" onClick={salvar} whileTap={{ scale: .97 }}>
        Salvar lançamento
      </motion.button>
    </motion.div>
  );
}
