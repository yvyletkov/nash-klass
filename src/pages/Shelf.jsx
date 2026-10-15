import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../lib/api.js'
import { useAuth } from '../App.jsx'
import { Card, Btn, Title, Modal, Star, C, INK } from '../art/sketch.jsx'
import Mascot from '../art/Mascot.jsx'
import { ShelfDecor } from '../art/Things.jsx'
import { hash, ago, plural } from '../lib/util.js'

const GENRES = ['Приключения', 'Фэнтези', 'Фантастика', 'Сказки', 'Детектив', 'Рассказы', 'Наука', 'Классика', 'Стихи', 'Комиксы', 'Другое']
const COLORS = ['#ff6b6b', '#ff9f1c', '#ffc93c', '#5fcf5a', '#3ed6a0', '#4cc9f0', '#7b8cff', '#9b5de5', '#ff8fb8']

function perRow() {
  const w = typeof window === 'undefined' ? 1000 : window.innerWidth
  return w < 520 ? 6 : w < 900 ? 8 : 11
}

export default function Shelf() {
  const { user, isTeacher } = useAuth()
  const [books, setBooks] = useState(null)
  const [genre, setGenre] = useState('')
  const [q, setQ] = useState('')
  const [add, setAdd] = useState(false)
  const [sel, setSel] = useState(null)
  const [per, setPer] = useState(perRow())
  const [err, setErr] = useState('')

  useEffect(() => {
    api.books.list().then(setBooks).catch((e) => setErr(e.message))
    const f = () => setPer(perRow())
    window.addEventListener('resize', f)
    return () => window.removeEventListener('resize', f)
  }, [])

  const shown = useMemo(() => (books || []).filter((b) => (!genre || b.genre === genre) && (!q || (b.title + b.author).toLowerCase().includes(q.toLowerCase()))), [books, genre, q])
  const rows = useMemo(() => {
    const r = []
    for (let i = 0; i < shown.length; i += per) r.push(shown.slice(i, i + per))
    while (r.length < 3) r.push([]) // минимум три полки — это мебель, она есть и пустая
    return r
  }, [shown, per])

  const counts = useMemo(() => {
    const c = {}
    ;(books || []).forEach((b) => { c[b.genre] = (c[b.genre] || 0) + 1 })
    return c
  }, [books])

  const empty = books && books.length === 0

  return (
    <div className="shelf-page">
      <div className="head-row">
        <Title color={C.orange} sub="Читаем, пишем честные отзывы и советуем друг другу. Полка наполняется вашими книгами.">Книжная полка класса</Title>
        <Btn color={C.sun} className="big" onClick={() => setAdd(true)}>Добавить книгу</Btn>
      </div>

      {!empty && (
        <div className="filters">
          <input className="search" placeholder="🔍 Найти книгу или автора" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="chips">
            <button className={`chip ${!genre ? 'on' : ''}`} onClick={() => setGenre('')}>Все · {books?.length ?? 0}</button>
            {GENRES.filter((g) => counts[g]).map((g) => (
              <button key={g} className={`chip ${genre === g ? 'on' : ''}`} onClick={() => setGenre(genre === g ? '' : g)}>{g} · {counts[g]}</button>
            ))}
          </div>
        </div>
      )}

      <div className="bookcase">
        <i className="case-bg boil" />
        {empty && (
          <div className="empty-say shelf-say">
            <Mascot size={110} mood="sleepy" />
            <div className="bubble sm"><i className="boil" /><span>Полка пока пустая. Добавь первую книгу — и она оживёт.</span></div>
          </div>
        )}
        {rows.map((row, ri) => (
          <div className="shelf-row" key={ri}>
            {ri === 0 && empty && <Cobweb />}
            <div className="spines">
              <AnimatePresence>
                {row.map((b) => <Spine key={b.id} b={b} onClick={() => setSel(b)} />)}
              </AnimatePresence>
            </div>
            <div className="decor"><ShelfDecor i={ri} /></div>
            <div className="plank"><i className="boil" /></div>
          </div>
        ))}
      </div>
      {books && !empty && shown.length === 0 && <p className="soft center">Ничего не найдено.</p>}
      {err && <p className="err">{err}</p>}

      <AddBook open={add} onClose={() => setAdd(false)} onAdded={(b) => { setBooks((x) => [...x, b]); setAdd(false); setSel(b) }} />

      <Modal open={!!sel} onClose={() => setSel(null)} width={520}>
        {sel && (
          <div className="book-open">
            <div className="book-cover" style={{ '--c': sel.color }}>
              <i className="boil" />
              <b>{sel.title}</b>
              <small>{sel.author}</small>
              <span className="genre-tag">{sel.genre}</span>
            </div>
            <Stars n={sel.stars} />
            <p className="review">«{sel.review}»</p>
            <p className="who"><b>{sel.profile?.avatar}</b> советует {sel.profile?.name} · {ago(sel.created_at)}</p>
            {(isTeacher || sel.member_id === user.id) && (
              <button className="link-btn" onClick={async () => { if (confirm('Убрать книгу с полки?')) { await api.books.remove(sel.id); setBooks((x) => x.filter((b) => b.id !== sel.id)); setSel(null) } }}>убрать с полки</button>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

function Spine({ b, onClick }) {
  const h = hash(b.id + b.title)
  const w = 46 + Math.round(h * 22)
  const ht = 136 + Math.round(hash(b.title) * 56)
  const tilt = hash(b.id) > 0.93 ? -9 : 0
  return (
    <motion.button
      layout
      className="spine"
      style={{ '--c': b.color, width: w, height: ht, transformOrigin: 'bottom left' }}
      initial={{ y: -260, rotate: -25, opacity: 0 }}
      animate={{ y: 0, rotate: tilt, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 170, damping: 13 }}
      whileHover={{ y: -14, rotate: tilt - 3 }}
      onClick={onClick}
      title={b.title}
    >
      <i className="boil" />
      <em /><em className="b" />
      <span>{b.title}</span>
      <u>{'★'.repeat(b.stars)}</u>
    </motion.button>
  )
}

function Stars({ n, set }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <button type="button" key={i} onClick={() => set?.(i)} className={set ? 'live' : ''} disabled={!set}>
          <Star size={34} color={i <= n ? C.sun : '#fff'} />
        </button>
      ))}
    </div>
  )
}

function AddBook({ open, onClose, onAdded }) {
  const [f, setF] = useState({ title: '', author: '', genre: 'Приключения', stars: 5, review: '', color: COLORS[0] })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))
  const ok = f.title.trim() && f.review.trim().length >= 20

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const b = await api.books.add({ ...f, title: f.title.trim(), author: f.author.trim(), review: f.review.trim() })
      setF({ title: '', author: '', genre: 'Приключения', stars: 5, review: '', color: COLORS[(Math.random() * COLORS.length) | 0] })
      onAdded(b)
    } catch (e2) { setErr(e2.message) }
    setBusy(false)
  }

  return (
    <Modal open={open} onClose={onClose} width={580}>
      <form onSubmit={submit} className="add-book">
        <h2>Какую книгу посоветуешь?</h2>
        <div className="two">
          <label className="field"><span>Название</span><input value={f.title} onChange={up('title')} maxLength={120} autoFocus /></label>
          <label className="field"><span>Автор</span><input value={f.author} onChange={up('author')} maxLength={80} /></label>
        </div>
        <label className="field"><span>Жанр</span>
          <select value={f.genre} onChange={up('genre')}>{GENRES.map((g) => <option key={g}>{g}</option>)}</select>
        </label>
        <div className="field"><span>Твоя оценка</span><Stars n={f.stars} set={(i) => setF((x) => ({ ...x, stars: i }))} /></div>
        <label className="field"><span>Твой отзыв — почему стоит прочитать?</span>
          <textarea rows={4} value={f.review} onChange={up('review')} maxLength={800} placeholder="Что понравилось? Кто тебе запомнился? Без спойлеров." />
          <small className={f.review.trim().length >= 20 ? 'ok' : ''}>{f.review.trim().length}/20 — напиши хотя бы пару предложений</small>
        </label>
        <div className="field"><span>Цвет корешка</span>
          <div className="swatches">
            {COLORS.map((c) => <button type="button" key={c} className={f.color === c ? 'on' : ''} style={{ background: c }} onClick={() => setF((x) => ({ ...x, color: c }))} aria-label={c} />)}
          </div>
        </div>
        {err && <p className="err">{err}</p>}
        <Btn color={C.sun} type="submit" disabled={busy || !ok}>{busy ? 'Ставлю на полку…' : 'Поставить на полку'}</Btn>
      </form>
    </Modal>
  )
}

function Cobweb() {
  return (
    <svg className="cobweb boil" viewBox="0 0 100 100" width="90">
      <g stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".55">
        <path d="M0 0 L100 0 M0 0 L0 100 M0 0 L80 80 M0 0 L100 40 M0 0 L40 100" />
        <path d="M30 0 Q24 24 0 30 M55 0 Q44 44 0 55 M80 0 Q64 64 0 80" />
      </g>
      <g transform="translate(60 56)">
        <circle r="5" fill={INK} /><path d="M-9 -6 l-7 -6 M9 -6 l7 -6 M-9 6 l-7 6 M9 6 l7 6 M-10 0 h-8 M10 0 h8" stroke={INK} strokeWidth="2" />
      </g>
    </svg>
  )
}
