// Создаёт аккаунты учителя и учеников в Supabase.
//
//   1. Положите список учеников в scripts/roster.txt — по одному на строку («Анна Иванова»).
//   2. Первая строка файла — учитель с пометкой:  teacher: Мария Ивановна
//   3. Запустите (ключ service_role — секретный, берётся в Supabase → Settings → API):
//        SUPABASE_URL=https://xxxx.supabase.co SUPABASE_SERVICE_KEY=eyJ... npm run users
//   4. Готовые логины и пароли появятся в scripts/credentials.csv — раздайте детям.
//
// Пароли — «зверь-число», например fox-4821: легко набрать на телефоне.

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync } from 'node:fs'
import { randomInt } from 'node:crypto'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY
if (!url || !key) {
  console.error('Нужны переменные SUPABASE_URL и SUPABASE_SERVICE_KEY')
  process.exit(1)
}
const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const DOMAIN = 'klass70.ru' // должен совпадать с src/lib/api.js
const ANIMALS = ['fox', 'panda', 'owl', 'cat', 'wolf', 'bear', 'frog', 'duck', 'lion', 'koala', 'seal', 'deer', 'mouse', 'tiger', 'zebra', 'otter']
const AVATARS = ['🦊', '🐼', '🦉', '🐱', '🐺', '🐻', '🐸', '🦆', '🦁', '🐨', '🦭', '🦌', '🐭', '🐯', '🦓', '🦦']

const TR = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya' }
const translit = (s) => [...s.toLowerCase()].map((c) => TR[c] ?? (/[a-z0-9]/.test(c) ? c : '')).join('')

const lines = readFileSync(new URL('./roster.txt', import.meta.url), 'utf8')
  .split('\n').map((l) => l.trim()).filter(Boolean)

const used = new Set()
const rows = [['login', 'password', 'name', 'role']]

for (const [i, line] of lines.entries()) {
  const isTeacher = /^teacher\s*:/i.test(line)
  const name = line.replace(/^teacher\s*:/i, '').trim()
  let login
  if (isTeacher) login = 'teacher'
  else {
    const [first = '', last = ''] = name.split(/\s+/)
    login = `${translit(first)}${translit(last).slice(0, 1)}` || `kid${i}`
    let n = 2
    const base = login
    while (used.has(login)) login = base + n++
  }
  used.add(login)
  const password = isTeacher ? `teach-${randomInt(1000, 9999)}` : `${ANIMALS[randomInt(ANIMALS.length)]}-${randomInt(1000, 9999)}`
  const { data, error } = await sb.auth.admin.createUser({
    email: `${login}@${DOMAIN}`, password, email_confirm: true,
  })
  if (error) { console.error(`✗ ${name}: ${error.message}`); continue }
  const avatar = isTeacher ? '🦉' : AVATARS[randomInt(AVATARS.length)]
  const { error: e2 } = await sb.from('profiles').insert({
    id: data.user.id, login, name, role: isTeacher ? 'teacher' : 'student', avatar,
  })
  if (e2) { console.error(`✗ профиль ${name}: ${e2.message}`); continue }
  rows.push([login, password, name, isTeacher ? 'teacher' : 'student'])
  console.log(`✓ ${name}  →  ${login} / ${password}`)
}

writeFileSync(new URL('./credentials.csv', import.meta.url), rows.map((r) => r.join(';')).join('\n'))
console.log('\nГотово: scripts/credentials.csv')
