import { createClient } from '@supabase/supabase-js'
import { STATIONS } from './stations.js'
import { buildHistory, DEFAULT_NAMES } from '../seed/history.js'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const DEMO = !(URL && KEY)
const DOMAIN = 'klass70.ru' // техническая часть «почты» для входа по логину; должна совпадать со scripts/

export const GOALS = { fives: 60 }
export const DEMO_CLASS = { slug: '6a', password: '6a-demo', teacher: 'teacher', teacherPassword: 'teacher' }

export const normLogin = (s) => s.trim().toLowerCase()
export const checkLogin = (s) => (/^[a-z0-9._-]{3,24}$/.test(normLogin(s)) ? '' : 'Логин: 3–24 символа, латинские буквы, цифры, точка, дефис или подчёркивание')

/* ======================= Supabase ======================= */
function makeSupabase() {
  const sb = createClient(URL, KEY)
  const must = ({ data, error }) => {
    if (error) throw new Error(error.message)
    return data
  }
  const withProfile = '*, profile:members(name,avatar)'

  const session = async () => {
    const { data: { session: s } } = await sb.auth.getSession()
    if (!s) return null
    const p = must(await sb.rpc('my_profile'))
    return p || null // {member:{id,name,role,avatar}, class:{id,slug,name,school}}
  }

  return {
    session,
    classInfo: async (slug, password) => must(await sb.rpc('class_info', { p_slug: slug, p_password: password || null })),

    async signIn(username, password) {
      const { error } = await sb.auth.signInWithPassword({ email: `${normLogin(username)}@${DOMAIN}`, password })
      if (error) throw new Error('Не получилось войти. Проверьте логин и пароль.')
      const s = await session()
      if (!s) throw new Error('У этого логина нет класса.')
      return s
    },
    signOut: () => sb.auth.signOut(),

    async createClass({ school, className, classPassword, teacherName, username, password }) {
      const e = checkLogin(username)
      if (e) throw new Error(e)
      const { error } = await sb.auth.signUp({ email: `${normLogin(username)}@${DOMAIN}`, password })
      if (error) throw new Error(/registered|exists/i.test(error.message) ? 'Этот логин уже занят' : error.message)
      must(await sb.rpc('create_class', { p_school: school, p_name: className, p_password: classPassword, p_teacher: teacherName, p_stations: STATIONS }))
      return session()
    },

    async register({ slug, classPassword, memberId, name, username, password }) {
      const e = checkLogin(username)
      if (e) throw new Error(e)
      const { error } = await sb.auth.signUp({ email: `${normLogin(username)}@${DOMAIN}`, password })
      if (error) throw new Error(/registered|exists/i.test(error.message) ? 'Этот логин уже занят, придумайте другой' : error.message)
      try {
        must(await sb.rpc('join_class', { p_slug: slug, p_password: classPassword, p_member: memberId || null, p_name: name || null }))
      } catch (err) { await sb.auth.signOut(); throw err }
      return session()
    },

    teacher: {
      updateClass: async (school, name) => must(await sb.rpc('class_update', { p_school: school, p_name: name })),
      changePassword: async (pw) => must(await sb.rpc('change_class_password', { p_new: pw })),
      rosterAdd: async (names) => must(await sb.rpc('roster_add', { p_names: names })),
      memberRemove: async (id) => must(await sb.rpc('member_remove', { p_member: id })),
    },
    members: async () => must(await sb.rpc('class_roster')),

    deeds: {
      list: async () => must(await sb.from('deeds').select(withProfile).order('created_at')),
      add: async (d) => must(await sb.from('deeds').insert(d).select(withProfile).single()),
      remove: async (id) => must(await sb.from('deeds').delete().eq('id', id)),
    },
    books: {
      list: async () => must(await sb.from('books').select(withProfile).order('created_at')),
      add: async (b) => must(await sb.from('books').insert(b).select(withProfile).single()),
      remove: async (id) => must(await sb.from('books').delete().eq('id', id)),
    },
    train: {
      async load() {
        const meta = must(await sb.from('train_meta').select('*').single())
        const [fives, legs] = await Promise.all([
          sb.from('fives').select(withProfile).eq('week_idx', meta.station_idx).order('created_at', { ascending: false }),
          sb.from('train_legs').select('*').order('idx'),
        ])
        return { meta, fives: must(fives), legs: must(legs) }
      },
      addFive: async (week_idx, subject, count = 1) => must(await sb.from('fives').insert({ week_idx, subject, count })),
      removeFive: async (id) => must(await sb.from('fives').delete().eq('id', id)),
      saveStations: async (stations) => must(await sb.from('train_meta').update({ stations }).not('class_id', 'is', null)),
      // приехали (или «дотолкали») на следующую станцию: пишем перегон в журнал и сдвигаем поезд
      async arrive({ idx, station, pushed, fives_total }) {
        must(await sb.from('train_legs').insert({ idx: idx + 1, station_name: station.name, station_emoji: station.emoji, reward: station.reward || '', pushed, fives_total }))
        return must(await sb.from('train_meta').update({ station_idx: idx + 1 }).not('class_id', 'is', null))
      },
    },
    worries: {
      mine: async () => must(await sb.from('worries').select('*').order('created_at', { ascending: false })),
      send: async (w) => must(await sb.from('worries').insert(w)),
      inbox: async () => must(await sb.rpc('teacher_inbox')),
      reply: async (id, answer) => must(await sb.rpc('teacher_reply', { worry_id: id, answer })),
    },
  }
}

/* ======================= Демо (localStorage, много классов) ======================= */
function makeDemo() {
  const KEYNAME = 'klass-demo-v3'
  const uid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
  const AVATARS = ['🦊', '🐼', '🦉', '🐱', '🐺', '🐻', '🐸', '🦆', '🦁', '🐨', '🦭', '🦌', '🐭', '🐯', '🦓', '🦦']
  const iso = (d) => new Date(d).toISOString()

  // готовый класс 6А с историей «с 1 сентября»
  const seedDb = () => {
    const h = buildHistory({ names: DEFAULT_NAMES })
    const classId = 'c-6a'
    const members = [{ id: 'm-teacher', class_id: classId, user: DEMO_CLASS.teacher, name: 'Мария Ивановна', role: 'teacher', avatar: '🦉' }]
    h.names.forEach((name, i) => members.push({ id: `m-${i}`, class_id: classId, user: null, name, role: 'student', avatar: AVATARS[i % AVATARS.length] }))
    const mid = (who) => (who === 'teacher' ? 'm-teacher' : `m-${who}`)
    return {
      session: null,
      users: { [DEMO_CLASS.teacher]: { password: DEMO_CLASS.teacherPassword, member: 'm-teacher' } },
      classes: [{ id: classId, slug: DEMO_CLASS.slug, name: '6А', school: 'Гимназия №70', password: DEMO_CLASS.password }],
      members,
      deeds: h.deeds.map((d) => ({ id: uid(), class_id: classId, member_id: mid(d.who), tree: d.tree, title: d.title, created_at: iso(d.at) })),
      books: h.books.map((b) => ({ id: uid(), class_id: classId, member_id: mid(b.who), title: b.title, author: b.author, genre: b.genre, stars: b.stars, review: b.review, color: b.color, created_at: iso(b.at) })),
      fives: h.fives.map((f) => ({ id: uid(), class_id: classId, member_id: mid(f.who), week_idx: f.week, subject: f.subject, count: f.count, created_at: iso(f.at) })),
      legs: h.legs.map((l) => ({ id: uid(), class_id: classId, idx: l.idx, station_name: l.station.name, station_emoji: l.station.emoji, reward: l.station.reward || '', pushed: l.pushed, fives_total: l.fives_total, arrived_at: iso(l.arrived_at) })),
      meta: { [classId]: { class_id: classId, station_idx: h.idx, fives_goal: GOALS.fives, stations: h.stations } },
      worries: h.worries.map((w) => ({ id: uid(), class_id: classId, author_id: 'ghost', text: w.text, mood: w.mood, size: w.size, created_at: iso(w.at), reply: w.reply, replied_at: w.replied_at ? iso(w.replied_at) : null })),
    }
  }

  let db
  try { db = JSON.parse(localStorage.getItem(KEYNAME)) } catch { db = null }
  if (!db) db = seedDb()
  const save = () => { try { localStorage.setItem(KEYNAME, JSON.stringify(db)) } catch {} }
  const delay = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 80))
  const fail = (m) => Promise.reject(new Error(m))

  const meM = () => db.members.find((m) => m.id === db.users[db.session]?.member)
  const klass = () => db.classes.find((c) => c.id === meM()?.class_id)
  const inClass = (a) => a.filter((x) => x.class_id === meM().class_id)
  const prof = (id) => { const m = db.members.find((x) => x.id === id); return m ? { name: m.name, avatar: m.avatar } : null }
  const view = (x) => ({ ...x, user_id: x.member_id, profile: prof(x.member_id) })
  const profile = () => {
    const m = meM(), c = klass()
    return m ? { member: { id: m.id, name: m.name, role: m.role, avatar: m.avatar }, class: { id: c.id, slug: c.slug, name: c.name, school: c.school } } : null
  }
  const needTeacher = () => (meM()?.role === 'teacher' ? null : fail('Только для учителя'))

  const login = (u) => {
    if (!u) return
    if (db.users[u]) db.session = u
    save()
  }

  return {
    session: async () => delay(profile()),
    classInfo: async (slug, password) => {
      const c = db.classes.find((x) => x.slug === slug)
      if (!c) return delay(null)
      const ok = password != null && password === c.password
      return delay({ name: c.name, school: c.school, slug: c.slug, ok, roster: ok ? db.members.filter((m) => m.class_id === c.id && m.role === 'student' && !m.user).map((m) => ({ id: m.id, name: m.name })) : [] })
    },
    async signIn(username, password) {
      const u = db.users[normLogin(username)]
      if (!u || u.password !== password) return fail('Не получилось войти. Проверьте логин и пароль.')
      login(normLogin(username))
      return delay(profile())
    },
    signOut: async () => { db.session = null; save() },

    async createClass({ school, className, classPassword, teacherName, username, password }) {
      const e = checkLogin(username); if (e) return fail(e)
      const l = normLogin(username)
      if (db.users[l]) return fail('Этот логин уже занят')
      if (classPassword.length < 4) return fail('Пароль класса — минимум 4 символа')
      const id = 'c-' + uid()
      const slug = 'c' + uid().slice(0, 8)
      db.classes.push({ id, slug, name: className.trim(), school: school.trim(), password: classPassword })
      db.members.push({ id: 'm-' + uid(), class_id: id, user: l, name: teacherName.trim(), role: 'teacher', avatar: '🦉' })
      db.users[l] = { password, member: db.members[db.members.length - 1].id }
      db.meta[id] = { class_id: id, station_idx: 0, fives_goal: GOALS.fives, stations: STATIONS.map((s) => ({ ...s })) }
      login(l)
      return delay(profile())
    },
    async register({ slug, classPassword, memberId, name, username, password }) {
      const e = checkLogin(username); if (e) return fail(e)
      const l = normLogin(username)
      const c = db.classes.find((x) => x.slug === slug)
      if (!c || c.password !== classPassword) return fail('Неверный пароль класса')
      if (db.users[l]) return fail('Этот логин уже занят, придумайте другой')
      if (password.length < 6) return fail('Пароль — минимум 6 символов')
      let m
      if (memberId) {
        m = db.members.find((x) => x.id === memberId && x.class_id === c.id && !x.user)
        if (!m) return fail('Это имя уже занято')
        m.user = l
      } else {
        if ((name || '').trim().length < 2) return fail('Введите имя')
        m = { id: 'm-' + uid(), class_id: c.id, user: l, name: name.trim(), role: 'student', avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)] }
        db.members.push(m)
      }
      db.users[l] = { password, member: m.id }
      login(l)
      return delay(profile())
    },

    teacher: {
      async updateClass(school, name) { const e = needTeacher(); if (e) return e; Object.assign(klass(), { school: school.trim(), name: name.trim() }); save() },
      async changePassword(pw) { const e = needTeacher(); if (e) return e; if (pw.length < 4) return fail('Пароль класса — минимум 4 символа'); klass().password = pw; save() },
      async rosterAdd(names) { const e = needTeacher(); if (e) return e; names.filter((n) => n.trim().length >= 2).forEach((n) => db.members.push({ id: 'm-' + uid(), class_id: klass().id, user: null, name: n.trim(), role: 'student', avatar: '🙂' })); save() },
      async memberRemove(id) { const e = needTeacher(); if (e) return e; db.members = db.members.filter((m) => !(m.id === id && m.role === 'student' && m.class_id === klass().id)); save() },
    },
    members: async () => delay(inClass(db.members).filter((m) => m.role !== 'ghost').map(({ id, name, role, avatar, user }) => ({ id, name, role, avatar, claimed: !!user })).sort((a, b) => a.name.localeCompare(b.name))),

    deeds: {
      list: async () => delay(inClass(db.deeds).map(view)),
      async add(d) { const x = { ...d, id: uid(), class_id: meM().class_id, member_id: meM().id, created_at: iso(Date.now()) }; db.deeds.push(x); save(); return delay(view(x)) },
      async remove(id) { db.deeds = db.deeds.filter((x) => !(x.id === id && (x.member_id === meM().id || meM().role === 'teacher'))); save() },
    },
    books: {
      list: async () => delay(inClass(db.books).map(view)),
      async add(b) { const x = { ...b, id: uid(), class_id: meM().class_id, member_id: meM().id, created_at: iso(Date.now()) }; db.books.push(x); save(); return delay(view(x)) },
      async remove(id) { db.books = db.books.filter((x) => !(x.id === id && (x.member_id === meM().id || meM().role === 'teacher'))); save() },
    },
    train: {
      async load() {
        const meta = db.meta[meM().class_id]
        return delay({
          meta,
          fives: inClass(db.fives).filter((f) => f.week_idx === meta.station_idx).sort((a, b) => b.created_at.localeCompare(a.created_at)).map(view),
          legs: inClass(db.legs).sort((a, b) => a.idx - b.idx),
        })
      },
      async addFive(week_idx, subject, count = 1) { db.fives.push({ id: uid(), class_id: meM().class_id, member_id: meM().id, week_idx, subject, count: meM().role === 'teacher' ? count : 1, created_at: iso(Date.now()) }); save() },
      async removeFive(id) { db.fives = db.fives.filter((x) => !(x.id === id && (x.member_id === meM().id || meM().role === 'teacher'))); save() },
      async saveStations(stations) { const e = needTeacher(); if (e) return e; db.meta[meM().class_id].stations = stations; save() },
      async arrive({ idx, station, pushed, fives_total }) {
        const e = needTeacher(); if (e) return e
        db.legs.push({ id: uid(), class_id: meM().class_id, idx: idx + 1, station_name: station.name, station_emoji: station.emoji, reward: station.reward || '', pushed, fives_total, arrived_at: iso(Date.now()) })
        db.meta[meM().class_id].station_idx = idx + 1
        save()
      },
    },
    worries: {
      mine: async () => delay(db.worries.filter((w) => w.author_id === meM().id).sort((a, b) => b.created_at.localeCompare(a.created_at))),
      async send(w) { db.worries.push({ ...w, id: uid(), class_id: meM().class_id, author_id: meM().id, created_at: iso(Date.now()), reply: null, replied_at: null }); save() },
      // как в SQL: автор не возвращается, порядок «перемешан»
      inbox: async () => delay(inClass(db.worries).map(({ author_id, created_at, class_id, ...w }) => ({ ...w, day: created_at.slice(0, 10) })).sort((a, b) => (a.reply ? 1 : 0) - (b.reply ? 1 : 0) || a.id.localeCompare(b.id))),
      async reply(id, answer) { const w = db.worries.find((x) => x.id === id && x.class_id === meM().class_id); w.reply = answer; w.replied_at = iso(Date.now()); save() },
    },
  }
}

export const api = DEMO ? makeDemo() : makeSupabase()
