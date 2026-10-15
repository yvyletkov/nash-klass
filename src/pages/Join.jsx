import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api, checkLogin } from '../lib/api.js'
import { useAuth } from '../App.jsx'
import { Card, Btn, Cloud, Sun, C } from '../art/sketch.jsx'
import Mascot from '../art/Mascot.jsx'

export default function Join() {
  const { slug } = useParams()
  const { user, klass, register, signIn } = useAuth()
  const [info, setInfo] = useState(undefined)
  const [pw, setPw] = useState('')
  const [roster, setRoster] = useState(null)
  const [who, setWho] = useState('')      // id из списка или 'new'
  const [name, setName] = useState('')
  const [mode, setMode] = useState('join') // join | login
  const [f, setF] = useState({ username: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { api.classInfo(slug).then(setInfo).catch(() => setInfo(null)) }, [slug])

  if (user && klass?.slug === slug) return <Navigate to="/" replace />

  const unlock = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const r = await api.classInfo(slug, pw)
      if (!r?.ok) setErr('Неверный пароль класса')
      else { setRoster(r.roster); setWho(r.roster.length ? '' : 'new') }
    } catch (e2) { setErr(e2.message) }
    setBusy(false)
  }
  const go = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      const bad = checkLogin(f.username)
      if (bad) throw new Error(bad)
      if (f.password.length < 6) throw new Error('Пароль — минимум 6 символов')
      await register({ slug, classPassword: pw, memberId: who && who !== 'new' ? who : null, name, username: f.username, password: f.password })
    } catch (e2) { setErr(e2.message) }
    setBusy(false)
  }
  const doLogin = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await signIn(f.username, f.password) } catch (e2) { setErr(e2.message) }
    setBusy(false)
  }

  if (info === undefined) return <div className="boot"><Mascot size={100} mood="sleepy" /></div>
  if (info === null) return (
    <div className="landing">
      <Mascot size={110} mood="sad" />
      <h1 className="logo">Класс не найден</h1>
      <p className="land-sub">Проверьте ссылку: возможно, в ней не хватает символов.</p>
      <Link to="/" className="link-btn">на главную</Link>
    </div>
  )

  return (
    <div className="landing">
      <Sun size={100} style={{ position: 'absolute', top: 4, right: '6%' }} />
      <Cloud w={130} style={{ position: 'absolute', top: 50, left: '4%' }} className="drift" />
      <div className="land-hero join">
        <Mascot size={110} mood="happy" />
        <div>
          <p className="land-sub small-top">Приглашение в класс</p>
          <h1 className="logo">{info.name}</h1>
          <p className="land-sub">{info.school}</p>
        </div>
      </div>

      <div className="land-card">
        <Card color="#fffdf5" className="login-card">
          {mode === 'login' ? (
            <form onSubmit={doLogin}>
              <h2>Войти</h2>
              <label className="field"><span>Логин</span><input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} autoCapitalize="none" autoComplete="username" /></label>
              <label className="field"><span>Пароль</span><input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" /></label>
              {err && <p className="err">{err}</p>}
              <Btn color={C.sky} type="submit" disabled={busy || !f.username || !f.password}>Войти</Btn>
              <button type="button" className="link-btn" onClick={() => { setMode('join'); setErr('') }}>я здесь впервые</button>
            </form>
          ) : !roster ? (
            <form onSubmit={unlock}>
              <h2>Пароль класса</h2>
              <p className="soft small">Его даёт классный руководитель.</p>
              <label className="field"><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus placeholder="пароль класса" /></label>
              {err && <p className="err">{err}</p>}
              <Btn color={C.mint} type="submit" disabled={busy || !pw}>{busy ? 'Проверяем…' : 'Войти в класс'}</Btn>
              <button type="button" className="link-btn" onClick={() => { setMode('login'); setErr('') }}>у меня уже есть аккаунт</button>
            </form>
          ) : (
            <form onSubmit={go}>
              <h2>Регистрация</h2>
              {roster.length > 0 && (
                <div className="field">
                  <span>Найдите себя в списке</span>
                  <div className="chips">
                    {roster.map((r) => <button type="button" key={r.id} className={`chip ${who === r.id ? 'on' : ''}`} onClick={() => setWho(r.id)}>{r.name}</button>)}
                    <button type="button" className={`chip ${who === 'new' ? 'on' : ''}`} onClick={() => setWho('new')}>меня нет в списке</button>
                  </div>
                </div>
              )}
              {who === 'new' && <label className="field"><span>Ваше имя и фамилия</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Аня Иванова" maxLength={60} /></label>}
              <div className="two">
                <label className="field"><span>Придумайте логин</span><input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} autoCapitalize="none" autoComplete="username" placeholder="anya2014" /></label>
                <label className="field"><span>Придумайте пароль</span><input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" placeholder="от 6 символов" /></label>
              </div>
              {err && <p className="err">{err}</p>}
              <Btn color={C.mint} type="submit" disabled={busy || !who || (who === 'new' && name.trim().length < 2) || !f.username || !f.password}>{busy ? 'Регистрируем…' : 'Зарегистрироваться'}</Btn>
              <p className="fine-dark">Запомните логин и пароль: по ним вы будете заходить с любого устройства. Письма в ящик остаются анонимными.</p>
            </form>
          )}
        </Card>
      </div>
    </div>
  )
}
