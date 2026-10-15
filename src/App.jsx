import { createContext, useContext, useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { api, DEMO } from './lib/api.js'
import { SketchDefs, useBoil } from './art/sketch.jsx'
import Mascot from './art/Mascot.jsx'
import Landing from './pages/Landing.jsx'
import Join from './pages/Join.jsx'
import Settings from './pages/Settings.jsx'
import Home from './pages/Home.jsx'
import Garden from './pages/Garden.jsx'
import Shelf from './pages/Shelf.jsx'
import Train from './pages/Train.jsx'
import Box from './pages/Box.jsx'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export default function App() {
  useBoil()
  const [sess, setSess] = useState(undefined) // undefined — ещё грузим; null — не вошли; {member, class}
  const loc = useLocation()

  useEffect(() => {
    api.session().then((s) => setSess(s || null)).catch(() => setSess(null))
  }, [])

  const user = sess?.member
  const klass = sess?.class
  const auth = {
    user, klass,
    isTeacher: user?.role === 'teacher',
    signIn: async (l, p) => setSess(await api.signIn(l, p)),
    createClass: async (f) => setSess(await api.createClass(f)),
    register: async (f) => setSess(await api.register(f)),
    refresh: async () => setSess(await api.session()),
    signOut: async () => { await api.signOut(); setSess(null) },
  }

  if (sess === undefined) return <><SketchDefs /><div className="boot"><Mascot size={120} mood="sleepy" /></div></>

  const gate = (el) => (user ? el : <Navigate to="/" replace />)
  const teacherOnly = (el) => (user?.role === 'teacher' ? el : <Navigate to="/" replace />)

  return (
    <AuthCtx.Provider value={auth}>
      <SketchDefs />
      {DEMO && <div className="demo-bar">демо-режим: данные хранятся только в этом браузере</div>}
      {user && <Header />}
      <AnimatePresence mode="wait">
        <motion.main key={loc.pathname} className="page" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          <Routes location={loc}>
            <Route path="/" element={user ? <Home /> : <Landing />} />
            <Route path="/c/:slug" element={<Join />} />
            <Route path="/garden" element={gate(<Garden />)} />
            <Route path="/shelf" element={gate(<Shelf />)} />
            <Route path="/train" element={gate(<Train />)} />
            <Route path="/box" element={gate(<Box />)} />
            <Route path="/class" element={teacherOnly(<Settings />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      <footer className="foot">{klass ? `${klass.name} · ${klass.school}` : 'Наш класс'}</footer>
    </AuthCtx.Provider>
  )
}

function Header() {
  const { user, klass, signOut, isTeacher } = useAuth()
  const loc = useLocation()
  return (
    <header className="top">
      <Link to="/" className="brand">
        <Mascot size={46} flap={false} />
        <span>Наш класс<small>{klass.name} · {klass.school}</small></span>
      </Link>
      <nav className="tabs">
        {[['/garden', '🌳', 'Сад'], ['/shelf', '📚', 'Полка'], ['/train', '🚂', 'Поезд'], ['/box', '💌', 'Ящик']].map(([to, e, t]) => (
          <Link key={to} to={to} className={loc.pathname === to ? 'on' : ''}><b>{e}</b><span>{t}</span></Link>
        ))}
      </nav>
      <div className="me">
        {isTeacher && <Link to="/class" className={`gear ${loc.pathname === '/class' ? 'on' : ''}`} title="Настройки класса">⚙</Link>}
        <span className="me-chip"><b>{user.avatar}</b> <span>{user.name}</span></span>
        <button className="link-btn" onClick={signOut}>выйти</button>
      </div>
    </header>
  )
}
