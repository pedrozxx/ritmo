/* Folha de baixo genérica + o editor de listas.
   Um esquema em store.js vira formulário aqui — serve pra hábito, refeição,
   exercício, matéria, entrega, tarefa, categoria e meta. */
import { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import * as D from './store.js';
import { Ico, MOLA_CALMA, RAPIDO } from './ui.jsx';

/* A folha arrasta só pela alça, pra não brigar com a rolagem de dentro. */
export function Folha({ onFechar, label, children }) {
  const arraste = useDragControls();
  return (
    <>
      <motion.button className="sheet-bd" aria-label="Fechar" onClick={onFechar}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div className="sheet" role="dialog" aria-modal="true" aria-label={label}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={MOLA_CALMA}
        drag="y" dragListener={false} dragControls={arraste}
        dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: .4 }} dragMomentum={false}
        onDragEnd={(_, i) => { if (i.offset.y > 110 || i.velocity.y > 500) onFechar(); }}>
        <div className="grip-area" onPointerDown={e => arraste.start(e)}><div className="grip" /></div>
        <div className="sheet-corpo">{children}</div>
      </motion.div>
    </>
  );
}

function Campo({ campo, valor, erro, onMuda, s }) {
  const id = 'c-' + campo.k;
  if (campo.tipo === 'escolha' || campo.tipo === 'habito') {
    const ops = campo.tipo === 'habito'
      ? s.listas.habitos.map(h => [h.id, h.nome])
      : campo.ops;
    return (
      <div className="campo">
        <span className="label">{campo.rot}</span>
        {ops.length === 0
          ? <p className="err">Cadastre um hábito primeiro.</p>
          : (
            <div className="chips">
              {ops.map(([v, t]) => (
                <motion.button key={v} type="button" className="chip" aria-pressed={valor === v}
                  whileTap={{ scale: .94 }} onClick={() => onMuda(v)}>{t}</motion.button>
              ))}
            </div>
          )}
        {erro && <p className="err">{erro}</p>}
      </div>
    );
  }
  return (
    <div className="campo">
      <label className="label" htmlFor={id}>{campo.rot}</label>
      <div className={`field ${erro ? 'bad' : ''}`}>
        <input id={id} className="campo-input"
          type={campo.tipo === 'data' ? 'date' : 'text'}
          inputMode={campo.tipo === 'numero' ? 'decimal' : undefined}
          placeholder={campo.dica || ''}
          value={valor ?? ''}
          onChange={e => onMuda(e.target.value)} />
      </div>
      {erro && <p className="err">{erro}</p>}
    </div>
  );
}

function Formulario({ s, chave, item, onSalvar, onVoltar }) {
  const schema = D.SCHEMAS[chave];
  const [v, setV] = useState(() => {
    const base = {};
    schema.campos.forEach(c => { base[c.k] = item?.[c.k] ?? c.padrao ?? ''; });
    return { ...base, id: item?.id };
  });
  const [erros, setErros] = useState({});
  const campos = D.camposVisiveis(chave, v);

  const salvar = () => {
    const e = {};
    campos.forEach(c => {
      if (c.obrig && !String(v[c.k] ?? '').trim()) e[c.k] = 'Preencha este campo.';
      if (c.tipo === 'numero' && String(v[c.k] ?? '').trim() && !isFinite(Number(String(v[c.k]).replace(',', '.')))) {
        e[c.k] = 'Use só números, tipo 32 ou 7,5.';
      }
    });
    setErros(e);
    if (Object.keys(e).length) return;
    const limpo = { id: v.id };
    campos.forEach(c => {
      const bruto = String(v[c.k] ?? '').trim();
      limpo[c.k] = c.tipo === 'numero' ? (bruto === '' ? '' : Number(bruto.replace(',', '.'))) : bruto;
    });
    onSalvar(limpo);
  };

  return (
    <motion.div key="form" initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 26 }} transition={RAPIDO}>
      <div className="sheet-head">
        <button className="icon-btn" onClick={onVoltar} aria-label="Voltar">
          <Ico n="seta" s={18} w={2} />
        </button>
        <h2>{item?.id ? 'Editar' : 'Novo'} {schema.um}</h2>
      </div>
      {campos.map(c => (
        <Campo key={c.k} campo={c} s={s} valor={v[c.k]} erro={erros[c.k]}
          onMuda={x => { setV(p => ({ ...p, [c.k]: x })); setErros(p => ({ ...p, [c.k]: null })); }} />
      ))}
      <motion.button className="btn-primary" onClick={salvar} whileTap={{ scale: .97 }}>
        Salvar {schema.um}
      </motion.button>
    </motion.div>
  );
}

export function Gerenciador({ s, chave, filtro, titulo, onFechar, onSalvar, onApagar }) {
  const schema = D.SCHEMAS[chave];
  const [editando, setEditando] = useState(null);   // {} = novo, item = editar, null = lista
  const [apagando, setApagando] = useState(null);
  const itens = (s.listas[chave] || [])
    .filter(i => !filtro || Object.entries(filtro).every(([k, val]) => i[k] === val));

  return (
    <Folha onFechar={onFechar} label={titulo}>
      <AnimatePresence mode="wait" initial={false}>
        {editando ? (
          <Formulario key="form" s={s} chave={chave} item={editando}
            onVoltar={() => setEditando(null)}
            onSalvar={item => { onSalvar(chave, { ...filtro, ...item }); setEditando(null); }} />
        ) : (
          <motion.div key="lista" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={RAPIDO}>
            <div className="sheet-head"><h2>{titulo}</h2></div>
            {itens.length === 0 && (
              <p className="empty" style={{ padding: '10px 0 18px' }}>
                Nenhum {schema.um} cadastrado ainda.
              </p>
            )}
            {itens.map(i => (
              <div className="row" key={i.id}>
                <div className="row-txt">
                  <b>{i.nome}</b>
                  <span>{[i.meta, i.hora, i.o, i.data && D.dataCurta(i.data),
                    i.prot !== '' && i.prot != null && `${i.prot} g`,
                    i.nota !== '' && i.nota != null && `nota ${i.nota}`]
                    .filter(Boolean).join(' · ') || '—'}</span>
                </div>
                <button className="icon-btn pequeno" aria-label={`Editar ${i.nome}`} onClick={() => setEditando(i)}>
                  <Ico n="lapis" s={16} />
                </button>
                {!schema.fixo && (
                  <button className={`icon-btn pequeno ${apagando === i.id ? 'perigo' : ''}`}
                    aria-label={apagando === i.id ? `Confirmar apagar ${i.nome}` : `Apagar ${i.nome}`}
                    onClick={() => {
                      if (apagando === i.id) { onApagar(chave, i.id); setApagando(null); }
                      else setApagando(i.id);
                    }}>
                    {apagando === i.id ? <b style={{ fontSize: 10 }}>ok?</b> : <Ico n="lixo" s={16} />}
                  </button>
                )}
              </div>
            ))}
            {!schema.fixo && (
              <motion.button className="btn-primary" style={{ marginTop: 14 }} whileTap={{ scale: .97 }}
                onClick={() => setEditando({})}>
                Adicionar {schema.um}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Folha>
  );
}
