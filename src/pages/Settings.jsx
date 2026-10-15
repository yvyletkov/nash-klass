import { useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { useAuth } from '../App.jsx'
import { Card, Btn, Title, C } from '../art/sketch.jsx'

export default function Settings() {
  const { klass, user, refresh } = useAuth()
  const [members, setMembers] = useState([])
  const [school, setSchool] = useState(klass.school)
  const [name, setName] = useState(klass.name)
  const [pw, setPw] = useState('')
  const [tname, setTname] = useState(user.name)
  const [names, setNames] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const link = `${location.origin}${location.pathname}#/c/${klass.slug}`

  const load = () => api.members().then((m) => setMembers(m.filter((x) => x.role === 'student')))
  useEffect(() => { load() }, [])
  const run = async (fn, ok) => {
    setErr(''); setMsg('')
    try { await fn(); setMsg(ok); await load(); await refresh() } catch (e) { setErr(e.message) }
  }
  const copy = async () => { try { await navigator.clipboard.writeText(link); setMsg('Ссылка скопирована') } catch { setMsg('Скопируйте ссылку вручную') } }

  return (
    <div className="settings">
      <div className="head-row"><Title color={C.grape} sub="Ссылка для учеников, пароль класса и список учеников.">Настройки класса</Title></div>
      {msg && <p className="ok-msg">{msg}</p>}
      {err && <p className="err">{err}</p>}

      <div className="set-grid">
        <Card color="#e6fbd9" className="set-card">
          <h2>Ссылка для учеников</h2>
          <p className="soft small">Отправьте её в родительский чат или классный чат. Ученик откроет ссылку, введёт пароль класса и зарегистрируется.</p>
          <input readOnly value={link} onFocus={(e) => e.target.select()} />
          <div className="row"><Btn color={C.mint} onClick={copy}>Скопировать ссылку</Btn></div>
        </Card>

        <Card color="#fff1d0" className="set-card">
          <h2>Пароль класса</h2>
          <p className="soft small">Нужен только для регистрации новых учеников. Сменить его можно в любой момент, уже зарегистрированные не пострадают.</p>
          <form className="row" onSubmit={(e) => { e.preventDefault(); run(() => api.teacher.changePassword(pw), 'Пароль класса изменён').then(() => setPw('')) }}>
            <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="новый пароль класса" />
            <Btn color={C.sun} type="submit" disabled={pw.length < 4}>Сменить</Btn>
          </form>
        </Card>

        <Card color="#f1e6ff" className="set-card">
          <h2>Ваше имя</h2>
          <p className="soft small">Так вас видят ученики и вы сами в шапке сайта.</p>
          <form className="row" onSubmit={(e) => { e.preventDefault(); run(() => api.teacher.rename(tname), 'Имя сохранено') }}>
            <input value={tname} onChange={(e) => setTname(e.target.value)} maxLength={60} placeholder="Фамилия И.О." />
            <Btn color={C.grape} type="submit" disabled={tname.trim().length < 2 || tname.trim() === user.name}>Сохранить</Btn>
          </form>
        </Card>

        <Card color="#e3f0ff" className="set-card">
          <h2>Школа и класс</h2>
          <div className="two">
            <label className="field"><span>Школа</span><input value={school} onChange={(e) => setSchool(e.target.value)} maxLength={80} /></label>
            <label className="field"><span>Класс</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} /></label>
          </div>
          <Btn color={C.sky} onClick={() => run(() => api.teacher.updateClass(school, name), 'Сохранено')} disabled={!school.trim() || !name.trim()}>Сохранить</Btn>
        </Card>

        <Card color="#fff" className="set-card wide">
          <h2>Ученики ({members.length})</h2>
          <p className="soft small">Можно заранее добавить список: при регистрации ученик выберет своё имя из него. Или пусть ученики вводят имена сами.</p>
          <form onSubmit={(e) => { e.preventDefault(); run(() => api.teacher.rosterAdd(names.split('\n')), 'Список обновлён').then(() => setNames('')) }}>
            <textarea rows={3} value={names} onChange={(e) => setNames(e.target.value)} placeholder={'Аня Иванова\nМиша Петров\n(по одному ученику в строке)'} />
            <div className="row"><Btn color={C.mint} type="submit" disabled={!names.trim()}>Добавить в список</Btn></div>
          </form>
          <ul className="roster">
            {members.map((m) => (
              <li key={m.id}>
                <b>{m.avatar}</b> <span>{m.name}</span>
                <em className={m.claimed === false ? 'wait' : 'done'}>{m.claimed === false ? 'не зарегистрирован' : 'в классе'}</em>
                <button className="x" title="Удалить" onClick={() => confirm(`Удалить ${m.name} из класса вместе с его делами и книгами?`) && run(() => api.teacher.memberRemove(m.id), 'Ученик удалён')}>✕</button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
