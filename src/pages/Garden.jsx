import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api.js'
import { useAuth } from '../App.jsx'
import { Card, Btn, Title, Modal, Cloud, Sun, Star, C, INK } from '../art/sketch.jsx'
import Mascot from '../art/Mascot.jsx'
import Tree, { TREES } from '../art/Trees.jsx'
import { ago, days, plural } from '../lib/util.js'

const MILESTONES = [
  { n: 5, icon: '☀️', text: 'Солнышко улыбается' },
  { n: 10, icon: '🦋', text: 'Прилетели бабочки' },
  { n: 25, icon: '🪷', text: 'Появился пруд' },
  { n: 50, icon: '🌈', text: 'Над садом радуга' },
  { n: 100, icon: '🎈', text: 'Праздник в саду!' },
]

const frac = (x) => x - Math.floor(x)

export default function Garden() {
  const { user, isTeacher } = useAuth()
  const [deeds, setDeeds] = useState(null)
  const [plant, setPlant] = useState(false)
  const [sel, setSel] = useState(null)
  const [fresh, setFresh] = useState(null)
  const [tree, setTree] = useState('oak')
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = () => api.deeds.list().then(setDeeds).catch((e) => setErr(e.message))
  useEffect(() => { load() }, [])

  const n = deeds?.length ?? 0
  const next = MILESTONES.find((m) => m.n > n)
  const prev = [...MILESTONES].reverse().find((m) => m.n <= n)
  const mine = deeds?.filter((d) => d.user_id === user.id).length ?? 0

  const placed = useMemo(() => {
    const crowd = n > 80 ? 0.6 : n > 40 ? 0.75 : n > 20 ? 0.9 : 1
    return (deeds || []).map((d, i) => {
      const row = (i * 5 + 1) % 4
      return {
        d, row,
        x: 6 + frac((i + 1) * 0.6180339) * 88,
        y: 46 + row * 15 + frac((i + 3) * 0.7548776) * 5,
        size: (92 + row * 20) * crowd,
      }
    }).sort((a, b) => a.y - b.y)
  }, [deeds, n])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const d = await api.deeds.add({ tree, title: title.trim() })
      setDeeds((x) => [...x, d]); setFresh(d.id); setPlant(false); setTitle('')
      setTimeout(() => setFresh(null), 4000)
    } catch (e2) { setErr(e2.message) }
    setBusy(false)
  }

  const remove = async (d) => {
    if (!confirm('Убрать это дерево из сада?')) return
    await api.deeds.remove(d.id); setSel(null); load()
  }

  const has = (k) => n >= MILESTONES[k].n

  return (
    <div className="garden">
      <div className="head-row">
        <Title color={C.leaf} sub="Каждое доброе дело класса — новое дерево в общем саду. Чем больше дел, тем богаче сад.">Сад добрых дел</Title>
        <Btn color={C.mint} className="big" onClick={() => setPlant(true)}>Добавить доброе дело</Btn>
      </div>

      <Card color="#fffdf5" className="progress-card">
        <div className="pg-top">
          <strong>🌳 Всего в саду: {n} {plural(n, ['дерево', 'дерева', 'деревьев'])}</strong>
          <span>твоих: {mine}</span>
        </div>
        <div className="bar"><i className="boil" style={{ width: `${next ? Math.min(100, ((n - (prev?.n || 0)) / (next.n - (prev?.n || 0))) * 100) : 100}%`, background: C.leaf }} /></div>
        <div className="miles">
          {MILESTONES.map((m) => (
            <span key={m.n} className={n >= m.n ? 'done' : ''} title={m.text}><b>{n >= m.n ? m.icon : '❔'}</b> {m.n}</span>
          ))}
        </div>
        <p className="pg-hint">{next ? `До «${next.text.toLowerCase()}» осталось ${next.n - n} ${plural(next.n - n, ['доброе дело', 'добрых дела', 'добрых дел'])}` : 'Сад расцвёл полностью. Отличная работа.'}</p>
      </Card>

      <div className="scene garden-scene">
        <div className="sky-grad" />
        <Sun size={has(0) ? 120 : 90} style={{ position: 'absolute', top: 12, right: '6%', opacity: has(0) ? 1 : 0.55 }} />
        <Cloud w={150} style={{ position: 'absolute', top: 30, left: '5%' }} className="drift" />
        <Cloud w={110} style={{ position: 'absolute', top: 90, left: '48%' }} className="drift slow" />
        {has(3) && <Rainbow />}
        <Backdrop />
        <div className="hill h1" /><div className="hill h2" />
        <Meadow />
        {has(2) && <Pond />}
        {has(1) && [0, 1, 2, 3, 4].map((i) => <Butterfly key={i} i={i} />)}
        {has(4) && [0, 1, 2, 3].map((i) => <Balloon key={i} i={i} />)}

        {n === 0 && deeds && (
          <div className="empty-say">
            <Mascot size={120} mood="sleepy" />
            <div className="bubble sm"><i className="boil" /><span>Сад пока пуст. Добавь первое доброе дело — и здесь вырастет дерево.</span></div>
          </div>
        )}

        {placed.map(({ d, x, y, size }) => (
          <motion.button
            key={d.id}
            className="tree-btn"
            style={{ left: `${x}%`, top: `${y}%`, zIndex: Math.round(y), width: size, marginLeft: -size / 2, marginTop: -size * 1.2 + 6 }}
            initial={d.id === fresh ? { scale: 0, y: -80 } : false}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 11 }}
            whileHover={{ scale: 1.12, y: -6 }}
            onClick={() => setSel(d)}
            aria-label={`${d.profile?.name}: ${d.title}`}
          >
            <Tree kind={d.tree} size={size} growth={Math.min(1, days(d.created_at) / 6)} />
            {days(d.created_at) < 1 && <Sparkles />}
            {d.id === fresh && <span className="new-tag">новое!</span>}
          </motion.button>
        ))}
        <div className="grass-front" />
      </div>

      {err && <p className="err">{err}</p>}

      <Modal open={plant} onClose={() => setPlant(false)} width={600}>
        <form onSubmit={submit} className="plant-form">
          <h2>Что за доброе дело?</h2>
          <label className="field">
            <textarea value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: помог первоклашке донести рюкзак" rows={3} maxLength={140} autoFocus />
          </label>
          <h3>Выбери дерево</h3>
          <div className="tree-pick">
            {TREES.map((t) => (
              <button type="button" key={t.id} className={`pick ${tree === t.id ? 'on' : ''}`} onClick={() => setTree(t.id)}>
                <Tree kind={t.id} size={54} />
                <b>{t.name}</b>
                <small>{t.hint}</small>
              </button>
            ))}
          </div>
          {err && <p className="err">{err}</p>}
          <Btn color={C.mint} type="submit" disabled={busy || title.trim().length < 3}>{busy ? 'Сажаю…' : 'Посадить'}</Btn>
        </form>
      </Modal>

      <Modal open={!!sel} onClose={() => setSel(null)} width={440}>
        {sel && (
          <div className="deed-card">
            <Tree kind={sel.tree} size={110} growth={Math.min(1, days(sel.created_at) / 6)} />
            <h2>«{sel.title}»</h2>
            <p className="who"><b>{sel.profile?.avatar}</b> {sel.profile?.name} · {ago(sel.created_at)}</p>
            <p className="age">{days(sel.created_at) < 1 ? 'Только что посажено' : days(sel.created_at) < 6 ? 'Продолжает расти' : 'Выросло полностью'}</p>
            {(isTeacher || sel.user_id === user.id) && <button className="link-btn" onClick={() => remove(sel)}>убрать из сада</button>}
          </div>
        )}
      </Modal>
    </div>
  )
}

function Sparkles() {
  return (
    <span className="sparkles" aria-hidden>
      {[0, 1, 2].map((i) => <Star key={i} size={14} color={C.sun} style={{ position: 'absolute', left: `${20 + i * 28}%`, top: `${6 + (i % 2) * 14}%`, animationDelay: `${i * 0.4}s` }} />)}
    </span>
  )
}

function Rainbow() {
  const cols = ['#ff6b6b', '#ff9f1c', '#ffc93c', '#5fcf5a', '#4cc9f0', '#9b5de5']
  return (
    <svg className="rainbow boil" viewBox="0 0 400 200">
      {cols.map((c, i) => <path key={c} d={`M${20 + i * 12} 200 A${180 - i * 12} ${170 - i * 12} 0 0 1 ${380 - i * 12} 200`} fill="none" stroke={c} strokeWidth="13" strokeLinecap="round" />)}
    </svg>
  )
}

function Pond() {
  return (
    <svg className="pond boil" viewBox="0 0 240 90">
      <ellipse cx="120" cy="50" rx="108" ry="30" fill={INK} />
      <ellipse cx="120" cy="48" rx="102" ry="26" fill="#6fd6ff" />
      <path d="M50 44 q10 -6 22 0 M150 54 q12 -6 26 0" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
      <g stroke={INK} strokeWidth="3.5">
        <ellipse cx="170" cy="40" rx="17" ry="7" fill="#5fcf5a" /><ellipse cx="86" cy="56" rx="13" ry="5" fill="#5fcf5a" />
        <circle cx="170" cy="34" r="6" fill={C.pink} /><circle cx="86" cy="52" r="4.5" fill="#fff" />
      </g>
    </svg>
  )
}

function Butterfly({ i }) {
  const cols = [C.pink, C.sky, C.sun, C.grape, C.coral]
  return (
    <svg className="butterfly boil" style={{ '--i': i, left: `${12 + i * 18}%`, top: `${18 + (i % 3) * 14}%` }} width="38" viewBox="0 0 40 30">
      <g stroke={INK} strokeWidth="2.6" strokeLinejoin="round">
        <path className="bw" d="M20 15 C 6 -2, -2 12, 8 20 C 14 24, 18 20, 20 15 Z" fill={cols[i % 5]} />
        <path className="bw" d="M20 15 C 34 -2, 42 12, 32 20 C 26 24, 22 20, 20 15 Z" fill={cols[i % 5]} />
        <path d="M20 8 V24" /><path d="M20 8 q-4 -5 -7 -5 M20 8 q4 -5 7 -5" fill="none" />
      </g>
    </svg>
  )
}

function Balloon({ i }) {
  const cols = [C.coral, C.sun, C.sky, C.grape]
  return (
    <svg className="balloon boil" style={{ '--i': i, left: `${16 + i * 22}%` }} width="44" viewBox="0 0 44 80">
      <g stroke={INK} strokeWidth="3" strokeLinejoin="round">
        <path d="M22 4 C 40 4, 42 30, 22 50 C 2 30, 4 4, 22 4 Z" fill={cols[i]} />
        <path d="M22 50 L18 56 H26 Z" fill={cols[i]} />
        <path d="M22 56 C 18 64, 26 70, 22 78" fill="none" />
      </g>
    </svg>
  )
}

function Backdrop() {
  return (
    <svg className="backdrop" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden>
      <g className="boil" stroke={INK} strokeWidth="5" strokeLinejoin="round">
        <path d="M-20 380 L170 190 L260 270 L360 150 L520 330 L640 250 L760 380 Z" fill="#b6b9e8" />
        <path d="M360 150 L392 188 L366 196 L346 184 Z M170 190 L194 216 L172 220 L156 208 Z" fill="#fff" strokeWidth="4" />
        <path d="M900 380 L1060 210 L1150 280 L1290 120 L1440 300 L1520 240 L1650 380 Z" fill="#a9acdf" />
        <path d="M1290 120 L1326 164 L1296 172 L1272 158 Z" fill="#fff" strokeWidth="4" />
      </g>
    </svg>
  )
}

/* Цветы и кусты на лугу — чтобы поляна не была пустой */
function Meadow() {
  const flowers = [[6, 66, C.pink], [14, 88, C.sun], [24, 74, '#fff'], [33, 92, C.pink], [45, 70, C.sun], [52, 90, '#fff'], [63, 68, C.pink], [72, 86, C.sun], [80, 72, '#fff'], [90, 92, C.pink], [96, 68, C.sun], [38, 60, '#fff'], [58, 58, C.pink], [86, 58, C.sun]]
  return (
    <div className="meadow" aria-hidden>
      {flowers.map(([x, y, c], i) => (
        <svg key={i} className="boil" style={{ left: `${x}%`, top: `${y}%` }} width="22" viewBox="0 0 22 30">
          <g stroke={INK} strokeWidth="2.6" strokeLinecap="round"><path d="M11 12 V28" /><path d="M11 22 q-6 -2 -7 -7 M11 20 q6 -2 7 -7" fill="none" stroke="#2f9b3a" /><circle cx="11" cy="9" r="6.5" fill={c} /><circle cx="11" cy="9" r="2.4" fill={C.sun} stroke="none" /></g>
        </svg>
      ))}
    </div>
  )
}
