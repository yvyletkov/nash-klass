import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../App.jsx'
import { DEMO } from '../lib/api.js'
import { Card, Btn, Cloud, Sun, Star, C } from '../art/sketch.jsx'
import Mascot from '../art/Mascot.jsx'

export default function Login() {
  const { signIn } = useAuth()
  const [login, setLogin] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(0)

  const go = async (l = login, p = pw) => {
    setBusy(true); setErr('')
    try { await signIn(l, p) } catch (e) { setErr(e.message); setShake((s) => s + 1) }
    setBusy(false)
  }

  return (
    <div className="login">
      <Sun size={120} style={{ position: 'absolute', top: 10, right: '8%' }} />
      <Cloud w={150} style={{ position: 'absolute', top: 60, left: '4%' }} className="drift" />
      <Cloud w={100} color="#eaf8ff" style={{ position: 'absolute', top: 160, right: '22%' }} />
      <Star size={28} style={{ position: 'absolute', top: '46%', left: '10%' }} color={C.pink} />
      <Star size={20} style={{ position: 'absolute', top: '30%', right: '12%' }} color={C.mint} />

      <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 12 }}>
        <Mascot size={170} mood={err ? 'sad' : 'happy'} />
      </motion.div>
      <h1 className="logo">Наш класс</h1>
      <p className="logo-sub">6 класс · Гимназия №70</p>

      <motion.div key={shake} animate={shake ? { x: [0, -12, 12, -8, 8, 0] } : {}} transition={{ duration: 0.4 }} style={{ width: 'min(400px,100%)' }}>
        <Card color="#fffdf5" tilt={-1.2} className="login-card">
          <form onSubmit={(e) => { e.preventDefault(); go() }}>
            <label className="field">
              <span>Логин</span>
              <input value={login} onChange={(e) => setLogin(e.target.value)} autoCapitalize="none" autoComplete="username" placeholder="например, annak" />
            </label>
            <label className="field">
              <span>Пароль</span>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" placeholder="например, fox-4821" />
            </label>
            {err && <p className="err">{err}</p>}
            <Btn color={C.mint} type="submit" disabled={busy || !login}>{busy ? 'Открываю…' : 'Войти в класс!'}</Btn>
          </form>
          {DEMO && (
            <div className="demo-login">
              <small>Демо без паролей:</small>
              <button className="chip" onClick={() => go('anna', 'x')}>🦊 я ученица</button>
              <button className="chip" onClick={() => go('teacher', 'x')}>🦉 я учитель</button>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
