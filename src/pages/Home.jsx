import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, GOALS } from '../lib/api.js'
import { useAuth } from '../App.jsx'
import { Card, Cloud, Sun, Star, C, INK } from '../art/sketch.jsx'
import Mascot from '../art/Mascot.jsx'
import Tree from '../art/Trees.jsx'
import { Locomotive, Mailbox, BookStack } from '../art/Things.jsx'
import { STATIONS } from '../lib/stations.js'
import { plural } from '../lib/util.js'

const PHRASES = ['Что нового у класса?', 'Загляни в сад: там могло вырасти что-то новое.', 'Пятёрки — топливо для нашего поезда.', 'На полке мог появиться хороший совет.', 'Если что-то беспокоит — есть ящик.']

export default function Home() {
  const { user, isTeacher } = useAuth()
  const [s, setS] = useState({})
  const [phrase] = useState(() => PHRASES[Math.floor(Math.random() * PHRASES.length)])

  useEffect(() => {
    let off = false
    Promise.allSettled([api.deeds.list(), api.books.list(), api.train.load(), isTeacher ? api.worries.inbox() : api.worries.mine()]).then(([d, b, t, w]) => {
      if (off) return
      const seen = Number(localStorage.getItem('box-seen') || 0)
      setS({
        deeds: d.value?.length, books: b.value?.length,
        train: t.value && {
          idx: t.value.meta.station_idx,
          names: (t.value.meta.stations || STATIONS).map((x) => x.name),
          fives: t.value.fives.reduce((a, f) => a + f.count, 0),
        },
        box: w.value && (isTeacher
          ? { text: `${w.value.filter((x) => !x.reply).length} без ответа`, hot: w.value.some((x) => !x.reply) }
          : { text: w.value.some((x) => x.reply && new Date(x.replied_at) > seen) ? 'Тебе ответили!' : 'Анонимное письмо учителю', hot: w.value.some((x) => x.reply && new Date(x.replied_at) > seen) }),
      })
    })
    return () => { off = true }
  }, [isTeacher])

  const first = isTeacher ? user.name : (user.name.split(' ')[1] || user.name.split(' ')[0] || '')
  const place = s.train ? { name: s.train.names[Math.min(s.train.idx, s.train.names.length - 1)] } : null

  return (
    <div className="home">
      <Sun size={100} style={{ position: 'absolute', top: -6, right: '4%' }} />
      <Cloud w={130} style={{ position: 'absolute', top: 20, left: '2%' }} className="drift" />
      <Cloud w={90} color="#eaf8ff" style={{ position: 'absolute', top: 100, right: '26%' }} className="drift slow" />

      <div className="hello">
        <Mascot size={104} mood="happy" />
        <motion.div className="bubble" initial={{ scale: 0, rotate: -6 }} animate={{ scale: 1, rotate: -1.5 }} transition={{ delay: 0.35, type: 'spring', stiffness: 260, damping: 14 }}>
          <i className="boil" />
          <strong>{isTeacher ? `Здравствуйте, ${first}!` : first ? `Привет, ${first}!` : 'Привет!'}</strong>
          <span>{isTeacher ? 'Загляните в ящик и впишите активности недели для поезда.' : phrase}</span>
        </motion.div>
      </div>

      <div className="worlds">
        <World to="/garden" color="#c9f5c0" tilt={-1.6} title="Сад добрых дел" text={s.deeds != null ? `${s.deeds} ${plural(s.deeds, ['доброе дело', 'добрых дела', 'добрых дел'])} в саду` : 'Добавь первое дело'}>
          <div className="w-art garden-art"><Tree kind="sakura" size={90} /><Tree kind="sunflower" size={74} /><Tree kind="apple" size={100} /></div>
        </World>
        <World to="/shelf" color="#ffe3a8" tilt={1.4} title="Книжная полка" text={s.books != null ? (s.books ? `${s.books} ${plural(s.books, ['книга', 'книги', 'книг'])} с отзывами` : 'Пока пусто — стань первым') : 'Поделись книгой'}>
          <div className="w-art"><BookStack size={130} /></div>
        </World>
        <World to="/train" color="#bfe9ff" tilt={1.2} title="Поезд класса" text={s.train ? `Станция «${place.name}» · дрова ${s.train.fives}/${GOALS.fives}` : 'Набираем пятёрки'}>
          <div className="w-art"><Locomotive width={190} /></div>
        </World>
        <World to="/box" color="#d9d3ff" tilt={-1.3} title="Ящик тревог" text={s.box?.text || 'Анонимно и безопасно'} hot={s.box?.hot}>
          <div className="w-art"><Mailbox size={140} mood="happy" /></div>
        </World>
      </div>
    </div>
  )
}

function World({ to, color, tilt, title, text, children, hot }) {
  return (
    <motion.div whileHover={{ y: -8, rotate: tilt * -0.6 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
      <Link to={to} className="world-link">
        <Card color={color} tilt={tilt} className="world">
          {hot && <span className="ping" />}
          {children}
          <h2>{title}</h2>
          <p>{text}</p>
        </Card>
      </Link>
    </motion.div>
  )
}
