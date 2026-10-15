import { createContext, useContext, useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { api, DEMO } from './lib/api.js'
import { SketchDefs, useBoil } from './art/sketch.jsx'
import Mascot from './art/Mascot.jsx'
import Login from './pages/Login.jsx'
import Home from './pages/Home.jsx'
import Garden from './pages/Garden.jsx'
import Shelf from './pages/Shelf.jsx'
import Train from './pages/Train.jsx'
import Box from './pages/Box.jsx'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export default function App() {
  useBoil()
  const [user, setUser] = useState(undefined) // undefined — ещё грузим
  const loc = useLocation()
  const nav = useNavigate()

  useEffect(() => {
    api.me().then((u) => setUser(u || null)).catch(() => setUser(null))
  }, [])

  const auth = {
    user,
    isTeacher: user?.role === 'teacher',
    signIn: async (l, p) => { const u = await api.signIn(l, p); setUser(u); return u },
    signOut: async () => { await api.signOut(); setUser(null); nav('/login') },
  }

  if (user === undefined) return <><SketchDefs /><div className="boot"><Mascot size={120} mood="sleepy" /></div></>

  const gate = (el) => (user ? el : <Navigate to="/login" replace />)

  return (
    <AuthCtx.Provider value={auth}>
      <SketchDefs />
      {DEMO && <div className="demo-bar">демо-режим: данные хранятся только в этом браузере</div>}
      {user && <Header />}
      <AnimatePresence mode="wait">
        <motion.main key={loc.pathname} className="page" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
          <Routes location={loc}>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/" element={gate(<Home />)} />
            <Route path="/garden" element={gate(<Garden />)} />
            <Route path="/shelf" element={gate(<Shelf />)} />
            <Route path="/train" element={gate(<Train />)} />
            <Route path="/box" element={gate(<Box />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      <footer className="foot">6 класс · Гимназия №70 · сделано с любовью 🧡</footer>
    </AuthCtx.Provider>
  )
}

function Header() {
  const { user, signOut, isTeacher } = useAuth()
  const loc = useLocation()
  return (
    <header className="top">
      <Link to="/" className="brand">
        <Mascot size={46} flap={false} />
        <span>Наш класс</span>
      </Link>
      <nav className="tabs">
        {[['/garden', '🌳', 'Сад'], ['/shelf', '📚', 'Полка'], ['/train', '🚂', 'Поезд'], ['/box', '💌', 'Ящик']].map(([to, e, t]) => (
          <Link key={to} to={to} className={loc.pathname === to ? 'on' : ''}><b>{e}</b><span>{t}</span></Link>
        ))}
      </nav>
      <div className="me">
        <span className="me-chip"><b>{user.avatar}</b> <span>{isTeacher ? 'Учитель' : user.name}</span></span>
        <button className="link-btn" onClick={signOut}>выйти</button>
      </div>
    </header>
  )
}
