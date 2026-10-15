import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import { api, GOALS } from '../lib/api.js'
import { useAuth } from '../App.jsx'
import { Card, Btn, Title, Modal, Cloud, Sun, Star, C, INK } from '../art/sketch.jsx'
import { Locomotive, Wagon } from '../art/Things.jsx'
import { STATIONS, SUBJECTS } from '../lib/stations.js'
import { ago } from '../lib/util.js'

const TRACK = 'M120 150 H 790 C 925 150 925 420 790 420 H 210 C 75 420 75 690 210 690 H 880'
const VB = { w: 1000, h: 800 }
const LAST = STATIONS.length - 1

export default function Train() {
  const { user, isTeacher } = useAuth()
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [info, setInfo] = useState(null)
  const [pts, setPts] = useState(null)
  const [boom, setBoom] = useState(0)
  const pathRef = useRef(null)
  const trainRef = useRef(null)
  const lenRef = useRef(0)
  const posRef = useRef(null)

  const load = useCallback(() => api.train.load().then(setData).catch((e) => setErr(e.message)), [])
  useEffect(() => { load() }, [load])

  // координаты станций вдоль пути
  useEffect(() => {
    const p = pathRef.current
    if (!p) return
    const L = p.getTotalLength()
    lenRef.current = L
    setPts(STATIONS.map((_, i) => { const q = p.getPointAtLength((L * i) / LAST); return { x: q.x, y: q.y } }))
  }, [!!data])

  const idx = data?.meta.station_idx ?? 0
  const fivesGoal = data?.meta.fives_goal ?? GOALS.fives
  const actsGoal = data?.meta.acts_goal ?? GOALS.acts
  const fives = data?.fives.reduce((a, f) => a + f.count, 0) ?? 0
  const acts = data?.tasks.filter((t) => t.done).length ?? 0
  const pF = Math.min(1, fives / fivesGoal)
  const pA = Math.min(1, acts / actsGoal)
  const ready = pF >= 1 && pA >= 1
  const progress = (pF + pA) / 2
  const target = idx >= LAST ? 1 : (idx + 0.82 * progress) / LAST

  // движение поезда
  useEffect(() => {
    const p = pathRef.current, el = trainRef.current
    if (!p || !el || !data) return
    const L = lenRef.current
    const from = posRef.current ?? Math.max(0, target - 0.05)
    const ctl = animate(from, target, {
      duration: posRef.current == null ? 1.6 : 2.6, ease: 'easeInOut',
      onUpdate: (t) => {
        posRef.current = t
        const q = p.getPointAtLength(L * Math.min(1, t))
        const q2 = p.getPointAtLength(L * Math.min(1, t + 0.004))
        const q1 = p.getPointAtLength(L * Math.max(0, t - 0.004))
        const dx = q2.x - q1.x, dy = q2.y - q1.y
        const back = dx < 0
        const ang = Math.atan2(dy, back ? -dx : dx) * (180 / Math.PI)
        el.style.left = `${(q.x / VB.w) * 100}%`
        el.style.top = `${(q.y / VB.h) * 100}%`
        el.style.transform = `translate(-50%, -78%) ${back ? 'scaleX(-1)' : ''} rotate(${ang * 0.5}deg)`
      },
    })
    return () => ctl.stop()
  }, [target, data])

  const act = async (fn, after) => {
    try { await fn(); await load(); after?.() } catch (e) { setErr(e.message) }
  }

  const addFive = () => act(() => api.train.addFive(idx, subject), () => setBoom((b) => b + 1))
  const depart = () => {
    if (!ready && !confirm('Дрова или задания ещё не набраны. Всё равно отправить поезд на следующую станцию?')) return
    act(() => api.train.advance(idx + 1))
  }
  const reward = (i) => data?.meta.rewards?.[i] || STATIONS[i].reward

  return (
    <div className="train-page">
      <div className="head-row">
        <Title color={C.sky} sub="Одна станция — одна неделя. Заправим паровоз дровами-пятёрками и выполним задания — поедем дальше и получим награду!">Поезд класса</Title>
      </div>

      {!data ? <p className="soft center">Паровоз прогревает котёл…</p> : (
        <>
          <div className="scene train-scene">
            <div className="sky-grad day" />
            <Sun size={90} style={{ position: 'absolute', top: 8, left: '4%' }} />
            <Cloud w={130} style={{ position: 'absolute', top: 24, right: '8%' }} className="drift" />
            <Cloud w={90} color="#eaf8ff" style={{ position: 'absolute', top: 120, left: '38%' }} className="drift slow" />

            <svg className="map" viewBox={`0 0 ${VB.w} ${VB.h}`} preserveAspectRatio="none">
              <Scenery />
              <path ref={pathRef} d={TRACK} fill="none" stroke="#8b5a3c" strokeWidth="30" strokeDasharray="8 20" />
              <g className="boil">
                <path d={TRACK} fill="none" stroke={INK} strokeWidth="15" strokeLinecap="round" />
                <path d={TRACK} fill="none" stroke="#dfe6f5" strokeWidth="7" strokeLinecap="round" />
              </g>
            </svg>

            {pts && STATIONS.map((s, i) => (
              <button
                key={s.name}
                className={`station ${i < idx ? 'passed' : i === idx ? 'now' : 'future'} ${i > 4 && i < 8 ? 'lbl-up' : ''}`}
                style={{ left: `${(pts[i].x / VB.w) * 100}%`, top: `${(pts[i].y / VB.h) * 100}%` }}
                onClick={() => setInfo(i)}
              >
                <span className="dot boil"><b>{i < idx ? '✓' : s.emoji}</b></span>
                <span className="lbl">{s.name}</span>
                {i === idx && <span className="flag-now">🚩</span>}
              </button>
            ))}

            <div className="train" ref={trainRef}>
              <div className="train-row">
                <Locomotive width="100%" style={{ width: '48%' }} />
                <Wagon width="100%" color={C.mint} logs={Math.min(4, Math.ceil(pF * 4))} style={{ width: '34%', marginLeft: '-3%' }} />
              </div>
            </div>
          </div>

          <div className="train-grid">
            <Card color="#fff4d6" tilt={-0.6} className="gauge-card">
              <h2>🔥 Дрова — пятёрки</h2>
              <Gauge value={fives} goal={fivesGoal} color={C.orange} unit="пятёрок" />
              <AnimatePresence>
                {pF >= 1 && <motion.p className="full" initial={{ scale: 0 }} animate={{ scale: 1 }}>Топка полна! 🔥</motion.p>}
              </AnimatePresence>

              {!isTeacher && (
                <div className="five-form">
                  <div className="chips tiny">
                    {SUBJECTS.map((s) => <button key={s} className={`chip ${subject === s ? 'on' : ''}`} onClick={() => setSubject(s)}>{s}</button>)}
                  </div>
                  <Btn color={C.mint} onClick={addFive} className="big">⭐ Я получил(а) пятёрку!</Btn>
                  <LogFly key={boom} show={boom > 0} />
                </div>
              )}
              {isTeacher && <TeacherFives idx={idx} act={act} />}

              <ul className="log">
                {data.fives.slice(0, 7).map((f) => (
                  <li key={f.id}>
                    <b>{f.profile?.avatar}</b> <span>{f.profile?.name}{f.count > 1 ? ` +${f.count}` : ''}</span> <em>{f.subject}</em> <small>{ago(f.created_at)}</small>
                    {(isTeacher || f.user_id === user.id) && <button className="x" onClick={() => act(() => api.train.removeFive(f.id))} title="Убрать">✕</button>}
                  </li>
                ))}
                {data.fives.length === 0 && <li className="soft">Пока ни одной пятёрки на этой неделе. Кто первый?</li>}
              </ul>
            </Card>

            <Card color="#dff4ff" tilt={0.6} className="gauge-card">
              <h2>⚙️ Уголь — задания и активности</h2>
              <Gauge value={acts} goal={actsGoal} color={C.sky} unit="активностей" />
              <TaskList data={data} idx={idx} isTeacher={isTeacher} act={act} />
            </Card>
          </div>

          <Card color="#fff" className="station-card">
            <div className="st-left">
              <span className="big-emoji">{idx >= LAST && ready ? '🎉' : STATIONS[Math.min(idx, LAST)].emoji}</span>
              <div>
                <small>сейчас</small>
                <h2>Станция {Math.min(idx, LAST) + 1}: «{STATIONS[Math.min(idx, LAST)].name}»</h2>
              </div>
            </div>
            <div className="st-prize">
              <small>🎁 Награда за станцию</small>
              <p>{reward(Math.min(idx, LAST))}</p>
              {isTeacher && <RewardEdit key={idx} value={reward(idx)} onSave={(v) => act(() => api.train.setReward({ ...(data.meta.rewards || {}), [idx]: v }))} />}
            </div>
            {isTeacher && idx < LAST && (
              <Btn color={ready ? C.mint : '#e5e5ef'} onClick={depart}>{ready ? '🚂 Поезд едет дальше!' : 'Отправить досрочно'}</Btn>
            )}
            {!isTeacher && ready && idx < LAST && <p className="full">Всё готово! Ждём, когда учитель даст гудок 🚂</p>}
            {idx >= LAST && ready && <p className="full">Финиш! Мы добрались до Звёздной гавани! 🌟</p>}
          </Card>
        </>
      )}
      {err && <p className="err">{err}</p>}

      <Modal open={info != null} onClose={() => setInfo(null)} width={420}>
        {info != null && (
          <div className="station-info">
            <span className="big-emoji">{STATIONS[info].emoji}</span>
            <h2>Станция {info + 1}: «{STATIONS[info].name}»</h2>
            <p>{info < idx ? '✅ Мы здесь уже были!' : info === idx ? '🚩 Мы стоим на этой станции' : '⏳ Скоро доберёмся'}</p>
            <div className="st-prize"><small>🎁 Награда</small><p>{info <= idx ? reward(info) : reward(info)}</p></div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Gauge({ value, goal, color, unit }) {
  const p = Math.min(1, value / goal)
  return (
    <div className="gauge">
      <div className="gauge-num"><b>{value}</b> / {goal} <small>{unit}</small></div>
      <div className="bar big"><motion.i className="boil" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${p * 100}%` }} transition={{ type: 'spring', stiffness: 70, damping: 16 }} /><span className="ticks">{Array.from({ length: 9 }).map((_, i) => <u key={i} />)}</span></div>
    </div>
  )
}

function LogFly({ show }) {
  if (!show) return null
  return (
    <motion.span className="logfly" initial={{ opacity: 1, y: 0, x: 0, rotate: 0 }} animate={{ opacity: 0, y: -90, x: 40, rotate: 200 }} transition={{ duration: 1 }}>🪵</motion.span>
  )
}

function TeacherFives({ idx, act }) {
  const [n, setN] = useState(5)
  const [what, setWhat] = useState('')
  return (
    <div className="teacher-box">
      <small>Учитель: добавить сразу несколько пятёрок</small>
      <div className="row">
        <input type="number" min="1" max="30" value={n} onChange={(e) => setN(Math.max(1, Math.min(30, +e.target.value || 1)))} className="num" />
        <input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="за что (например, контрольная)" />
        <Btn color={C.mint} onClick={() => act(() => api.train.addFive(idx, what || 'Пятёрки класса', n), () => setWhat(''))}>+ {n}</Btn>
      </div>
    </div>
  )
}

function TaskList({ data, idx, isTeacher, act }) {
  const [t, setT] = useState('')
  return (
    <div className="tasks">
      <ul>
        {data.tasks.map((k) => (
          <li key={k.id} className={k.done ? 'done' : ''}>
            <button className={`check ${k.done ? 'on' : ''}`} disabled={!isTeacher} onClick={() => act(() => api.train.toggleTask(k.id, !k.done))} aria-label="выполнено">
              <i className="boil" />{k.done && <b>✓</b>}
            </button>
            <span>{k.title}</span>
            {isTeacher && <button className="x" onClick={() => act(() => api.train.removeTask(k.id))}>✕</button>}
          </li>
        ))}
        {data.tasks.length === 0 && <li className="soft">Учитель ещё не вписал задания на эту неделю.</li>}
      </ul>
      {isTeacher && (
        <form className="row" onSubmit={(e) => { e.preventDefault(); if (t.trim()) act(() => api.train.addTask(idx, t.trim()), () => setT('')) }}>
          <input value={t} onChange={(e) => setT(e.target.value)} placeholder="Новое задание: например, сходить в музей" />
          <Btn color={C.sky} type="submit">+ Задание</Btn>
        </form>
      )}
    </div>
  )
}

function RewardEdit({ value, onSave }) {
  const [v, setV] = useState(value)
  return (
    <form className="row" onSubmit={(e) => { e.preventDefault(); onSave(v) }}>
      <input value={v} onChange={(e) => setV(e.target.value)} />
      <Btn color={C.sun} type="submit">Сохранить</Btn>
    </form>
  )
}

/* Нарисованный пейзаж за рельсами */
function Scenery() {
  const tree = (x, y, s = 1, c = '#5fcf5a') => (
    <g key={`${x}${y}`} transform={`translate(${x} ${y}) scale(${s})`} stroke={INK} strokeWidth="4" strokeLinejoin="round">
      <rect x="-5" y="0" width="10" height="26" fill="#a9703c" /><circle cx="0" cy="-10" r="22" fill={c} /><circle cx="-13" cy="2" r="14" fill={c} stroke="none" /><circle cx="13" cy="2" r="14" fill={c} stroke="none" />
    </g>
  )
  return (
    <g>
      <path d="M0 210 L90 90 L170 190 L260 60 L360 200 L440 120 L520 210 V330 H0 Z" fill="#9aa8d8" opacity=".0" />
      <rect y="0" width="1000" height="800" fill="#c6f1bd" opacity="0" />
      <g className="boil" strokeLinecap="round">
        {/* горы */}
        <path d="M600 100 L690 20 L760 90 L820 40 L930 110 Z" fill="#b6b9e8" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        <path d="M690 20 L706 38 L694 42 L682 36 Z" fill="#fff" stroke={INK} strokeWidth="3" />
        {/* озеро */}
        <path d="M440 520 C 460 480, 580 480, 600 530 C 620 580, 480 600, 440 560 Z" fill="#7fd8ff" stroke={INK} strokeWidth="4.5" />
        <path d="M480 530 q16 -8 34 0 M530 552 q16 -8 34 0" stroke="#fff" strokeWidth="4" fill="none" />
        {/* деревья и кусты */}
        {tree(60, 240, 1.1)}{tree(210, 262, 0.9, '#78dd6a')}{tree(380, 250, 1)}{tree(560, 262, 0.85, '#4fbf6a')}{tree(760, 270, 1.05)}{tree(925, 250, 0.8, '#78dd6a')}
        {tree(70, 520, 1)}{tree(230, 560, 1.15, '#78dd6a')}{tree(780, 540, 0.9)}{tree(900, 570, 1.1, '#4fbf6a')}
        {tree(80, 770, 0.9)}{tree(500, 760, 1.1, '#78dd6a')}{tree(970, 780, 0.8)}
        {/* домик */}
        <g transform="translate(300 300)" stroke={INK} strokeWidth="4.5" strokeLinejoin="round">
          <rect x="0" y="20" width="70" height="50" fill="#ffd9a8" /><path d="M-8 22 L35 -16 L78 22 Z" fill={C.coral} /><rect x="26" y="40" width="20" height="30" fill="#8b5a3c" /><rect x="8" y="34" width="12" height="12" fill="#bfe9ff" strokeWidth="3.5" />
        </g>
        {/* ветряк */}
        <g transform="translate(790 460)" stroke={INK} strokeWidth="4.5" strokeLinejoin="round">
          <path d="M0 80 L12 10 L28 10 L40 80 Z" fill="#fff3d6" /><g transform="translate(20 8)"><g className="spin slow" style={{ transformOrigin: '0 0' }}>{[0, 90, 180, 270].map((a) => <path key={a} d="M0 0 L8 -46 L22 -46 L16 0 Z" fill={C.sun} transform={`rotate(${a})`} />)}</g><circle r="6" fill={INK} /></g>
        </g>
        {/* цветочки */}
        {[[150, 330, C.pink], [420, 320, C.sun], [700, 330, '#fff'], [200, 600, C.sun], [660, 610, C.pink], [350, 740, '#fff'], [800, 740, C.pink]].map(([x, y, c]) => (
          <g key={`${x}${y}`} transform={`translate(${x} ${y})`} stroke={INK} strokeWidth="2.8"><path d="M0 0 V16" /><circle r="7" fill={c} /><circle r="2.4" fill={C.sun} stroke="none" /></g>
        ))}
      </g>
    </g>
  )
}
