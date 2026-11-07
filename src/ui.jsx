/* Peças de interface do Ritmo + os números do movimento aprovado no protótipo. */
import { createContext, useContext, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

export const SUAVE = { duration: .42, ease: [.22, 1, .36, 1] };   // menu empurrando a tela
export const RAPIDO = { duration: .26, ease: [.22, 1, .36, 1] };  // troca de tela
export const MOLA = { type: 'spring', stiffness: 520, damping: 24 };        // o "sim": passa e volta
export const MOLA_CALMA = { type: 'spring', stiffness: 300, damping: 32 };  // folha de baixo, botão
export const CASCATA = .045;                                               // 45ms por card

export const CARD = { hide: { opacity: 0, y: 13 }, show: { opacity: 1, y: 0 } };
export const LISTA = { hide: {}, show: { transition: { staggerChildren: CASCATA } } };

/* animações ligadas/desligadas (Ajustes) — o MotionConfig cobre o declarativo,
   este contexto cobre o imperativo (contador de número) */
export const Anim = createContext(true);

export const Card = ({ children, className = '', ...p }) => (
  <motion.div className={`card ${className}`} variants={CARD} {...p}>{children}</motion.div>
);

/* ---- ícones ---- */
const ICONS = {
  hoje: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.2M12 19.3v2.2M4.2 12H2M22 12h-2.2M6.5 6.5L5 5M19 19l-1.5-1.5M17.5 6.5L19 5M5 19l1.5-1.5" /></>,
  rotina: <path d="M9 7h11M9 12h11M9 17h7M3.4 6.6l1.4 1.4L7.2 5.6M3.4 11.6l1.4 1.4 2.4-2.4" />,
  gym: <path d="M4.5 9v6M7.5 7v10M16.5 7v10M19.5 9v6M7.5 12h9" />,
  diet: <><path d="M20 4c-9 0-14 4.5-14 10a5.6 5.6 0 005.6 5.6C17 19.6 20 13 20 4z" /><path d="M6.5 20.5C9 15.5 13 11.8 17.5 9.6" /></>,
  percurso: <path d="M5.5 3v18M5.5 4h11l-1.6 4 1.6 4h-11" />,
  fac: <><path d="M3 9l9-4 9 4-9 4-9-4z" /><path d="M7.5 11.6V16c0 1.1 2 2 4.5 2s4.5-.9 4.5-2v-4.4" /></>,
  est: <><rect x="3" y="8" width="18" height="11" rx="2.5" /><path d="M9 8V6.2A2.2 2.2 0 0111.2 4h1.6A2.2 2.2 0 0115 6.2V8M3 12.5h18" /></>,
  fin: <><rect x="3" y="6" width="18" height="13" rx="3.5" /><path d="M3 10.5h18" /><circle cx="16.8" cy="14.8" r="1.2" /></>,
  metas: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r=".6" /></>,
  ajustes: <><path d="M4 7.5h8M17.5 7.5H20M4 16.5h3M12.5 16.5H20" /><circle cx="14.5" cy="7.5" r="2.4" /><circle cx="9.5" cy="16.5" r="2.4" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  mais: <path d="M12 5v14M5 12h14" />,
  chama: <path d="M12 3c3 4 5 5.5 5 9a5 5 0 01-10 0c0-1.3.4-2.3 1.2-3.3.6 1.3 1.4 1.8 2.3 1.8 0-2.5-.5-5 1.5-7.5z" />,
  sobe: <path d="M7.5 16.5l9-9M9.5 7.5h7v7" />,
  desce: <path d="M16.5 16.5l-9-9M14.5 16.5h-7v-7" />,
  seta: <path d="M9.5 6l6 6-6 6" />,
  lapis: <><path d="M4 20l1-4.4L15.7 4.9a2.3 2.3 0 013.3 3.3L8.3 19 4 20z" /><path d="M14.3 6.3l3.4 3.4" /></>,
  lixo: <><path d="M4.5 7h15M9.5 7V5.6A1.6 1.6 0 0111.1 4h1.8a1.6 1.6 0 011.6 1.6V7" /><path d="M6.6 7l.8 11.5A1.6 1.6 0 009 20h6a1.6 1.6 0 001.6-1.5L17.4 7" /></>,
  menos: <path d="M5 12h14" />,
};
export const Ico = ({ n, s = 19, w = 1.6 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w}
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[n]}</svg>
);
export const Tick = ({ s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 13l4.5 4.5L19 7" /></svg>
);

/* ---- número que corre até o valor ---- */
export function Numero({ valor, suf = '%' }) {
  const anim = useContext(Anim);
  const mv = useMotionValue(anim ? 0 : valor);
  const txt = useTransform(mv, v => Math.round(v) + suf);
  useEffect(() => {
    const ctrl = animate(mv, valor, anim ? { duration: .9, ease: [.22, 1, .36, 1] } : { duration: 0 });
    return () => ctrl.stop();
  }, [valor, anim, mv]);
  return <motion.span>{txt}</motion.span>;
}

/* ---- anel de progresso ---- */
export function Ring({ pct, size = 86, sw = 8, sub, atraso = 0 }) {
  const r = (size - sw) / 2, c = 2 * Math.PI * r;
  return (
    <div className="ring" style={{ '--size': size + 'px' }}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="bg" cx={size / 2} cy={size / 2} r={r} strokeWidth={sw} />
        <motion.circle className="fg" cx={size / 2} cy={size / 2} r={r} strokeWidth={sw}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct / 100) }}
          transition={{ duration: .9, ease: [.22, 1, .36, 1], delay: atraso }} />
      </svg>
      <div className="ring-lab">
        <strong><Numero valor={pct} /></strong>
        {sub && <span>{sub}</span>}
      </div>
    </div>
  );
}

/* ---- barra ---- */
export const Barra = ({ pct, rosa, atraso = 0 }) => (
  <div className={`bar ${rosa ? 'rose' : ''}`}>
    <motion.i style={{ width: '100%' }} initial={{ scaleX: 0 }} animate={{ scaleX: Math.max(.012, pct / 100) }}
      transition={{ duration: .8, ease: [.22, 1, .36, 1], delay: .14 + atraso }} />
  </div>
);

/* ---- sim / não ---- */
export function Yn({ estado, onPick, label }) {
  return (
    <div className="yn" role="group" aria-label={label}>
      <motion.span className="yn-thumb" aria-hidden="true"
        animate={{ x: estado === 'sim' ? '100%' : '0%', opacity: estado ? 1 : 0 }}
        transition={MOLA} />
      {[['nao', 'Não'], ['sim', 'Sim']].map(([v, t]) => (
        <motion.button key={v} className="yn-b" data-v={v} aria-pressed={estado === v}
          whileTap={{ scale: .93 }} onClick={() => onPick(estado === v ? null : v)}>
          {v === 'sim' && <Tick s={13} />}{t}
        </motion.button>
      ))}
    </div>
  );
}
export const Habito = ({ h, estado, onPick }) => (
  <div className="habit" data-state={estado || ''}>
    <div className="habit-txt"><b>{h.nome}</b><span>{h.meta}</span></div>
    <Yn estado={estado} onPick={onPick} label={h.nome} />
  </div>
);

export const Check = ({ on, onClick, label }) => (
  <motion.button className="check" aria-pressed={!!on} aria-label={label} onClick={onClick} whileTap={{ scale: .88 }}>
    <Tick s={16} />
  </motion.button>
);

export const Pill = ({ t, cor = 'neutral' }) => <span className={`pill ${cor}`}>{t}</span>;

export const Vazio = ({ titulo, texto }) => (
  <div className="empty"><b>{titulo}</b>{texto}</div>
);
