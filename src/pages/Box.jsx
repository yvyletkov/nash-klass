import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api.js'
import { useAuth } from '../App.jsx'
import { Card, Btn, Title, Star, C } from '../art/sketch.jsx'
import Mascot from '../art/Mascot.jsx'
import { Mailbox, Plane } from '../art/Things.jsx'
import { ago } from '../lib/util.js'

export const MOODS = [
  { id: 'cloud', icon: '☁️', label: 'Беспокоит', size: 1 },
  { id: 'rain', icon: '🌧️', label: 'Грустно', size: 2 },
  { id: 'storm', icon: '⛈️', label: 'Тяжело', size: 3 },
  { id: 'fog', icon: '🌫️', label: 'Не знаю, как назвать', size: 2 },
]
const mood = (id) => MOODS.find((m) => m.id === id) || MOODS[0]

export default function Box() {
  const { isTeacher } = useAuth()
  return (
    <div className="box-page">
      <div className="night-sky">
        {Array.from({ length: 14 }).map((_, i) => (
          <Star key={i} size={10 + (i % 4) * 5} color={i % 3 ? '#fff6b0' : '#ffd1e8'} style={{ position: 'absolute', left: `${(i * 37) % 97}%`, top: `${(i * 53) % 60}%`, animation: `twinkle ${2 + (i % 3)}s ${i * 0.3}s infinite` }} />
        ))}
      </div>
      {isTeacher ? <TeacherInbox /> : <StudentBox />}
    </div>
  )
}

/* ===================== Ученик ===================== */
function StudentBox() {
  const [list, setList] = useState(null)
  const [text, setText] = useState('')
  const [m, setM] = useState('cloud')
  const [flying, setFlying] = useState(false)
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const [seen] = useState(() => Number(localStorage.getItem('box-seen') || 0))

  const load = () => api.worries.mine().then(setList).catch((e) => setErr(e.message))
  useEffect(() => {
    load()
    return () => { try { localStorage.setItem('box-seen', String(Date.now())) } catch {} }
  }, [])

  const send = async () => {
    setErr('')
    setFlying(true); setOpen(true)
    try {
      await api.worries.send({ text: text.trim(), mood: m, size: mood(m).size })
    } catch (e) { setErr(e.message); setFlying(false); setOpen(false); return }
    setTimeout(() => { setOpen(false); setFlying(false); setText(''); setSent(true); load(); setTimeout(() => setSent(false), 6000) }, 1500)
  }

  const newReply = (w) => w.reply && new Date(w.replied_at).getTime() > seen

  return (
    <>
      <Title color={C.grape} sub="Анонимный ящик. Напиши то, что трудно сказать вслух: учитель прочитает и ответит, но не узнает, что письмо твоё.">Ящик тревог</Title>

      <div className="box-hero">
        <div className="box-monster">
          <Mailbox size={230} mood={sent ? 'happy' : text ? 'happy' : 'sleepy'} open={open} />
          <AnimatePresence>
            {flying && (
              <motion.div className="plane" initial={{ x: -230, y: 90, rotate: -12, scale: 1.1, opacity: 1 }} animate={{ x: -6, y: -6, rotate: 4, scale: 0.25, opacity: 0.9 }} transition={{ duration: 1.3, ease: 'easeIn' }} exit={{ opacity: 0 }}>
                <Plane size={96} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Card color="#2d2a5e" className="write-card">
          <p className="say">
            {sent ? 'Письмо отправлено. Ответ появится ниже — загляни сюда позже.' : 'Здесь можно написать о том, что беспокоит. Имя не нужно: учитель не узнает, кто автор.'}
          </p>
          <div className="moods">
            {MOODS.map((x) => (
              <button key={x.id} className={`mood ${m === x.id ? 'on' : ''}`} onClick={() => setM(x.id)}>
                <b>{x.icon}</b><span>{x.label}</span>
              </button>
            ))}
          </div>
          <label className="field dark">
            <textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} placeholder="Что тебя беспокоит? Пиши как есть. Имя писать не нужно." maxLength={1500} disabled={flying} />
          </label>
          {err && <p className="err light">{err}</p>}
          <Btn color={C.pink} onClick={send} disabled={flying || text.trim().length < 3} className="big">Отправить письмо</Btn>
          <p className="fine">В письме нет твоего имени. Учитель видит только текст.</p>
        </Card>
      </div>

      <h2 className="sec-h">Мои письма</h2>
      <div className="letters">
        {list?.length === 0 && <p className="soft light center">Здесь будут твои письма и ответы на них.</p>}
        {list?.map((w) => (
          <motion.div key={w.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card color="#fffdf5" tilt={w.id.charCodeAt(0) % 2 ? 0.4 : -0.4} className={`letter ${newReply(w) ? 'glow' : ''}`}>
              <div className="l-top"><span>{mood(w.mood).icon} {mood(w.mood).label}</span><small>{ago(w.created_at)}</small></div>
              <p className="l-text">{w.text}</p>
              {w.reply ? (
                <div className="l-reply">
                  <b>🦉 Ответ учителя {newReply(w) && <em className="new">новый!</em>}</b>
                  <p>{w.reply}</p>
                </div>
              ) : <div className="l-wait"><Mascot size={44} mood="sleepy" flap={false} /> Учитель скоро ответит. Ответ появится здесь.</div>}
            </Card>
          </motion.div>
        ))}
      </div>

      <Card color="#ffe3e8" className="help-card">
        <b>Если очень плохо или страшно</b>
        <p>Скажи взрослому, которому доверяешь: маме, папе, бабушке, учителю. Можно позвонить на детский телефон доверия: <strong>8-800-2000-122</strong>. Это бесплатно и анонимно, работает каждый день.</p>
      </Card>
    </>
  )
}

/* ===================== Учитель ===================== */
function TeacherInbox() {
  const [list, setList] = useState(null)
  const [err, setErr] = useState('')
  const load = () => api.worries.inbox().then(setList).catch((e) => setErr(e.message))
  useEffect(() => { load() }, [])
  const waiting = list?.filter((w) => !w.reply).length ?? 0

  return (
    <>
      <Title color={C.grape} sub="Письма приходят без имён — так задумано. Ответ увидит только тот, кто написал.">Почта доверия</Title>
      <div className="inbox-head">
        <Mascot size={90} mood={waiting ? 'wow' : 'love'} />
        <p>{waiting ? `Ждут ответа: ${waiting}` : 'Все письма отвечены.'}</p>
      </div>
      {err && <p className="err light">{err}</p>}
      <div className="letters">
        {list?.length === 0 && <p className="soft light center">Писем пока нет.</p>}
        {list?.map((w) => <TeacherLetter key={w.id} w={w} onDone={load} />)}
      </div>
    </>
  )
}

function TeacherLetter({ w, onDone }) {
  const [v, setV] = useState(w.reply || '')
  const [edit, setEdit] = useState(!w.reply)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const go = async () => {
    setBusy(true); setErr('')
    try { await api.worries.reply(w.id, v.trim()); setEdit(false); onDone() } catch (e) { setErr(e.message) }
    setBusy(false)
  }
  return (
    <Card color="#fffdf5" className={`letter ${w.reply ? '' : 'unread'}`}>
      <div className="l-top"><span>{mood(w.mood).icon} {mood(w.mood).label}</span><small>{new Date(w.day).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} · автор неизвестен 🤫</small></div>
      <p className="l-text">{w.text}</p>
      {edit ? (
        <div className="l-form">
          <textarea rows={3} value={v} onChange={(e) => setV(e.target.value)} placeholder="Ваш ответ — его увидит только автор письма" />
          {err && <p className="err">{err}</p>}
          <Btn color={C.mint} disabled={busy || v.trim().length < 2} onClick={go}>Ответить</Btn>
        </div>
      ) : (
        <div className="l-reply"><b>Ваш ответ</b><p>{w.reply}</p><button className="link-btn" onClick={() => setEdit(true)}>изменить</button></div>
      )}
    </Card>
  )
}
