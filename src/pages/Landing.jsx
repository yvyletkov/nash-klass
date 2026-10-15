import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../App.jsx'
import { DEMO, DEMO_CLASS, checkLogin } from '../lib/api.js'
import { Card, Btn, Cloud, Sun, Star, C } from '../art/sketch.jsx'
import Mascot from '../art/Mascot.jsx'

export default function Landing() {
  const { signIn, createClass } = useAuth()
  const [tab, setTab] = useState('create')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(0)
  const [f, setF] = useState({ school: '', className: '', teacherName: '', username: '', password: '', classPassword: '' })
  const [l, setL] = useState({ username: '', password: '' })
  const up = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }))

  const run = async (fn) => {
    setBusy(true); setErr('')
    try { await fn() } catch (e) { setErr(e.message); setShake((s) => s + 1) }
    setBusy(false)
  }
  const create = (e) => {
    e.preventDefault()
    if (f.password.length < 6) { setErr('Пароль учителя — минимум 6 символов'); return }
    const bad = checkLogin(f.username); if (bad) { setErr(bad); return }
    run(() => createClass(f))
  }
  const login = (e) => { e.preventDefault(); run(() => signIn(l.username, l.password)) }
  const ok = f.school.trim() && f.className.trim() && f.teacherName.trim() && f.username && f.password && f.classPassword.length >= 4

  return (
    <div className="landing">
      <Sun size={110} style={{ position: 'absolute', top: 4, right: '5%' }} />
      <Cloud w={140} style={{ position: 'absolute', top: 40, left: '3%' }} className="drift" />
      <Star size={26} style={{ position: 'absolute', top: '52%', left: '6%' }} color={C.pink} />

      <div className="land-hero">
        <Mascot size={120} mood={err ? 'sad' : 'happy'} />
        <div>
          <h1 className="logo">Наш класс</h1>
          <p className="land-sub">Сад добрых дел, книжная полка, поезд с наградами и анонимный ящик для писем учителю. Всё в одном месте, у каждого класса своё.</p>
        </div>
      </div>

      <motion.div key={shake} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.4 }} className="land-card">
        <Card color="#fffdf5" className="login-card">
          <div className="seg">
            <button className={tab === 'create' ? 'on' : ''} onClick={() => { setTab('create'); setErr('') }}>Создать класс</button>
            <button className={tab === 'login' ? 'on' : ''} onClick={() => { setTab('login'); setErr('') }}>Войти</button>
          </div>

          {tab === 'create' ? (
            <form onSubmit={create}>
              <div className="two">
                <label className="field"><span>Школа</span><input value={f.school} onChange={up('school')} placeholder="Гимназия №70" maxLength={80} /></label>
                <label className="field"><span>Класс</span><input value={f.className} onChange={up('className')} placeholder="6А" maxLength={40} /></label>
              </div>
              <label className="field"><span>Как вас зовут (увидят ученики)</span><input value={f.teacherName} onChange={up('teacherName')} placeholder="Мария Ивановна" maxLength={60} /></label>
              <div className="two">
                <label className="field"><span>Ваш логин</span><input value={f.username} onChange={up('username')} autoCapitalize="none" autoComplete="username" placeholder="maria.ivanovna" /></label>
                <label className="field"><span>Ваш пароль</span><input type="password" value={f.password} onChange={up('password')} autoComplete="new-password" placeholder="от 6 символов" /></label>
              </div>
              <label className="field"><span>Пароль класса (его вводят ученики по ссылке)</span><input value={f.classPassword} onChange={up('classPassword')} placeholder="например, 6a-september" /></label>
              {err && <p className="err">{err}</p>}
              <Btn color={C.mint} type="submit" disabled={busy || !ok}>{busy ? 'Создаём…' : 'Создать класс'}</Btn>
              <p className="fine-dark">После создания вы получите ссылку для учеников. Войти в класс можно только по ней и с паролем класса.</p>
            </form>
          ) : (
            <form onSubmit={login}>
              <label className="field"><span>Логин</span><input value={l.username} onChange={(e) => setL({ ...l, username: e.target.value })} autoCapitalize="none" autoComplete="username" /></label>
              <label className="field"><span>Пароль</span><input type="password" value={l.password} onChange={(e) => setL({ ...l, password: e.target.value })} autoComplete="current-password" /></label>
              {err && <p className="err">{err}</p>}
              <Btn color={C.sky} type="submit" disabled={busy || !l.username || !l.password}>{busy ? 'Входим…' : 'Войти'}</Btn>
              <p className="fine-dark">Ученики регистрируются по ссылке на класс, которую даёт учитель.</p>
            </form>
          )}
        </Card>

        {DEMO && (
          <Card color="#fff1d0" className="demo-card">
            <b>Демо-класс 6А (Гимназия №70)</b>
            <p>Уже заполнен «с 1 сентября».</p>
            <p>Ученик: откройте <a href={`#/c/${DEMO_CLASS.slug}`}>ссылку класса</a>, пароль класса — <code>{DEMO_CLASS.password}</code>.</p>
            <p>Учитель: логин <code>{DEMO_CLASS.teacher}</code>, пароль <code>{DEMO_CLASS.teacherPassword}</code> (вкладка «Войти»).</p>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
