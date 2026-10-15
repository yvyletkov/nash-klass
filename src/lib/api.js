import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const DEMO = !(URL && KEY)
const DOMAIN = 'klass70.ru' // должен совпадать с scripts/create-users.mjs

export const GOALS = { fives: 60, acts: 20 }

/* ======================= Supabase ======================= */
function makeSupabase() {
  const sb = createClient(URL, KEY)
  const must = ({ data, error }) => {
    if (error) throw new Error(error.message)
    return data
  }
  const withProfile = '*, profile:profiles(name,avatar)'

  const me = async () => {
    const { data: { session } } = await sb.auth.getSession()
    if (!session) return null
    const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).single()
    return data || null
  }

  return {
    me,
    async signIn(login, password) {
      const email = `${login.trim().toLowerCase()}@${DOMAIN}`
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) throw new Error('Не получилось войти. Проверь логин и пароль.')
      return me()
    },
    signOut: () => sb.auth.signOut(),

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
        const meta = must(await sb.from('train_meta').select('*').eq('id', 1).single())
        const [fives, tasks] = await Promise.all([
          sb.from('fives').select(withProfile).eq('week_idx', meta.station_idx).order('created_at', { ascending: false }),
          sb.from('tasks').select('*').eq('week_idx', meta.station_idx).order('created_at'),
        ])
        return { meta, fives: must(fives), tasks: must(tasks) }
      },
      addFive: async (week_idx, subject, count = 1) => must(await sb.from('fives').insert({ week_idx, subject, count })),
      removeFive: async (id) => must(await sb.from('fives').delete().eq('id', id)),
      addTask: async (week_idx, title) => must(await sb.from('tasks').insert({ week_idx, title })),
      toggleTask: async (id, done) => must(await sb.from('tasks').update({ done }).eq('id', id)),
      removeTask: async (id) => must(await sb.from('tasks').delete().eq('id', id)),
      advance: async (idx) => must(await sb.from('train_meta').update({ station_idx: idx }).eq('id', 1)),
      setReward: async (rewards) => must(await sb.from('train_meta').update({ rewards }).eq('id', 1)),
    },
    worries: {
      mine: async () => must(await sb.from('worries').select('*').order('created_at', { ascending: false })),
      send: async (w) => must(await sb.from('worries').insert(w)),
      inbox: async () => must(await sb.rpc('teacher_inbox')),
      reply: async (id, answer) => must(await sb.rpc('teacher_reply', { worry_id: id, answer })),
    },
  }
}

/* ======================= Демо (localStorage) ======================= */
function makeDemo() {
  const KEYNAME = 'klass-demo-v2'
  const uid = () => Math.random().toString(36).slice(2, 10)
  const now = Date.now()
  const day = 864e5
  const people = {
    u1: { id: 'u1', login: 'anna', name: 'Аня К.', avatar: '🦊', role: 'student' },
    u2: { id: 'u2', login: 'misha', name: 'Миша Т.', avatar: '🐼', role: 'student' },
    u3: { id: 'u3', login: 'sonya', name: 'Соня Р.', avatar: '🐱', role: 'student' },
    u4: { id: 'u4', login: 'timur', name: 'Тимур А.', avatar: '🦁', role: 'student' },
    u5: { id: 'u5', login: 'liza', name: 'Лиза М.', avatar: '🐸', role: 'student' },
    t1: { id: 't1', login: 'teacher', name: 'Учитель', avatar: '🦉', role: 'teacher' },
  }
  const prof = (id) => ({ name: people[id].name, avatar: people[id].avatar })
  const deed = (user_id, tree, title, d) => ({ id: uid(), user_id, tree, title, created_at: new Date(now - d * day).toISOString(), profile: prof(user_id) })
  const book = (user_id, title, author, genre, stars, review, color, d) => ({ id: uid(), user_id, title, author, genre, stars, review, color, created_at: new Date(now - d * day).toISOString(), profile: prof(user_id) })

  const seed = () => ({
    session: null,
    deeds: [
      deed('u1', 'oak', 'Помогла Пете разобрать задачу по математике', 9),
      deed('u2', 'apple', 'Убрал в классе после урока труда', 7),
      deed('u3', 'sakura', 'Поделилась завтраком с новенькой', 6),
      deed('u4', 'spruce', 'Помог первоклашке найти кабинет', 5),
      deed('u5', 'sunflower', 'Полила цветы на подоконнике', 4),
      deed('u1', 'birch', 'Нарисовала открытку для бабушки Вали', 2.5),
      deed('u2', 'star', 'Написал стихотворение маме', 1.2),
      deed('u3', 'tulip', 'Помогла дежурным вытереть доску', 0.3),
    ],
    books: [
      book('u1', 'Гарри Поттер и философский камень', 'Дж. К. Роулинг', 'Фэнтези', 5, 'Мне понравилось, как Гарри нашёл настоящих друзей. Хочется самой получить письмо из Хогвартса!', '#9b5de5', 6),
      book('u2', 'Приключения Тома Сойера', 'Марк Твен', 'Приключения', 5, 'Очень смешная книга про побелку забора. Том хитрый, но добрый внутри.', '#ff9f1c', 5),
      book('u3', 'Тайна третьей планеты', 'Кир Булычёв', 'Фантастика', 4, 'Алиса — моя любимая героиня. Смелая и всегда придумывает выход.', '#4cc9f0', 3),
      book('u4', 'Денискины рассказы', 'В. Драгунский', 'Рассказы', 5, 'Читал и смеялся вслух. Про кашу — самый смешной.', '#ff6b6b', 1),
    ],
    train: {
      meta: { station_idx: 1, fives_goal: GOALS.fives, acts_goal: GOALS.acts, rewards: {} },
      fives: [
        ...Array.from({ length: 5 }, (_, i) => ({ id: uid(), user_id: 'u' + (1 + (i % 5)), week_idx: 1, subject: ['Математика', 'Русский', 'Информатика', 'Литература', 'Английский'][i], count: 1, created_at: new Date(now - i * 3600e3 * 5).toISOString(), profile: prof('u' + (1 + (i % 5))) })),
        { id: uid(), user_id: 't1', week_idx: 1, subject: 'Контрольная', count: 12, created_at: new Date(now - day).toISOString(), profile: prof('t1') },
        { id: uid(), user_id: 'u4', week_idx: 1, subject: 'Физкультура', count: 1, created_at: new Date(now - day * 1.5).toISOString(), profile: prof('u4') },
      ],
      tasks: [
        { id: uid(), week_idx: 1, title: 'Сходить всем классом в театр', done: true, created_at: new Date(now - day).toISOString() },
        { id: uid(), week_idx: 1, title: 'Занятие в кружке робототехники', done: true, created_at: new Date(now - day).toISOString() },
        { id: uid(), week_idx: 1, title: 'Экскурсия в музей', done: false, created_at: new Date(now - day).toISOString() },
        { id: uid(), week_idx: 1, title: 'Шахматный турнир', done: false, created_at: new Date(now - day).toISOString() },
      ],
    },
    worries: [
      { id: 'w1', author_id: 'u1', text: 'Боюсь, что завтра на контрольной всё забуду и получу двойку.', mood: 'storm', size: 2, created_at: new Date(now - 2 * day).toISOString(), reply: 'Спасибо, что написала. Волноваться перед контрольной нормально. Давай вечером повторим вместе самое важное — подойди ко мне после уроков, если захочешь. И помни: одна оценка — это не ты.', replied_at: new Date(now - day).toISOString() },
      { id: 'w2', author_id: 'u3', text: 'Мне кажется, что со мной не хотят дружить на перемене.', mood: 'rain', size: 3, created_at: new Date(now - 1 * day).toISOString(), reply: null, replied_at: null },
      { id: 'w3', author_id: 'u2', text: 'Дома сегодня все ругались, и мне грустно.', mood: 'cloud', size: 2, created_at: new Date(now - 0.2 * day).toISOString(), reply: null, replied_at: null },
    ],
  })

  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEYNAME)) || seed() } catch { return seed() }
  }
  let db = load()
  const save = () => { try { localStorage.setItem(KEYNAME, JSON.stringify(db)) } catch {} }
  const delay = (v) => new Promise((r) => setTimeout(() => r(structuredClone(v)), 120))
  const cur = () => people[db.session]

  return {
    me: async () => (db.session ? delay(people[db.session]) : null),
    async signIn(login) {
      const p = Object.values(people).find((x) => x.login === login.trim().toLowerCase())
      if (!p) throw new Error('В демо есть логины: anna или teacher (пароль любой).')
      db.session = p.id; save(); return p
    },
    signOut: async () => { db.session = null; save() },

    deeds: {
      list: () => delay(db.deeds),
      async add(d) { const x = { ...d, id: uid(), user_id: cur().id, created_at: new Date().toISOString(), profile: prof(cur().id) }; db.deeds.push(x); save(); return delay(x) },
      async remove(id) { db.deeds = db.deeds.filter((x) => x.id !== id); save() },
    },
    books: {
      list: () => delay(db.books),
      async add(b) { const x = { ...b, id: uid(), user_id: cur().id, created_at: new Date().toISOString(), profile: prof(cur().id) }; db.books.push(x); save(); return delay(x) },
      async remove(id) { db.books = db.books.filter((x) => x.id !== id); save() },
    },
    train: {
      load: () => delay({ meta: db.train.meta, fives: db.train.fives.filter((f) => f.week_idx === db.train.meta.station_idx).sort((a, b) => b.created_at.localeCompare(a.created_at)), tasks: db.train.tasks.filter((t) => t.week_idx === db.train.meta.station_idx) }),
      async addFive(week_idx, subject, count = 1) { db.train.fives.push({ id: uid(), user_id: cur().id, week_idx, subject, count, created_at: new Date().toISOString(), profile: prof(cur().id) }); save() },
      async removeFive(id) { db.train.fives = db.train.fives.filter((x) => x.id !== id); save() },
      async addTask(week_idx, title) { db.train.tasks.push({ id: uid(), week_idx, title, done: false, created_at: new Date().toISOString() }); save() },
      async toggleTask(id, done) { db.train.tasks.find((t) => t.id === id).done = done; save() },
      async removeTask(id) { db.train.tasks = db.train.tasks.filter((x) => x.id !== id); save() },
      async advance(idx) { db.train.meta.station_idx = idx; save() },
      async setReward(rewards) { db.train.meta.rewards = rewards; save() },
    },
    worries: {
      mine: () => delay(db.worries.filter((w) => w.author_id === cur().id).sort((a, b) => b.created_at.localeCompare(a.created_at))),
      async send(w) { db.worries.push({ ...w, id: uid(), author_id: cur().id, created_at: new Date().toISOString(), reply: null, replied_at: null }); save() },
      // как в SQL: автор не возвращается
      inbox: () => delay(db.worries.map(({ author_id, created_at, ...w }) => ({ ...w, day: created_at.slice(0, 10) })).sort((a, b) => (a.reply ? 1 : 0) - (b.reply ? 1 : 0))),
      async reply(id, answer) { const w = db.worries.find((x) => x.id === id); w.reply = answer; w.replied_at = new Date().toISOString(); save() },
    },
  }
}

export const api = DEMO ? makeDemo() : makeSupabase()
