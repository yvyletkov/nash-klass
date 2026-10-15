// Создаёт предзаполненный класс «6А» с историей «с 1 сентября»: ученики, добрые дела, книги,
// пятёрки, журнал поезда и письма в ящик. Запускается один раз с вашего компьютера.
//
//   SUPABASE_URL=https://xxxx.supabase.co \
//   SUPABASE_SERVICE_KEY=<service_role key — секретный, только для этого скрипта> \
//   TEACHER_LOGIN=maria TEACHER_PASSWORD=... CLASS_PASSWORD=... \
//   node scripts/seed.mjs
//
// Необязательно: TEACHER_NAME="Мария Ивановна", SCHOOL="Гимназия №70", CLASS_NAME="6А", SLUG=6a
// Список учеников — в scripts/roster.txt (по одному в строке, файл не попадает в git).
// Если файла нет, берутся вымышленные имена.

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'node:fs'
import { buildHistory, DEFAULT_NAMES } from '../src/seed/history.js'
import { STATIONS } from '../src/lib/stations.js'

const env = (k, d) => process.env[k] ?? d ?? (console.error(`Нужна переменная ${k}`), process.exit(1))
const sb = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_KEY'), { auth: { autoRefreshToken: false, persistSession: false } })
const DOMAIN = 'klass70.ru' // как в src/lib/api.js

const login = env('TEACHER_LOGIN').trim().toLowerCase()
const slug = env('SLUG', '6a')
const rosterFile = new URL('./roster.txt', import.meta.url)
const names = existsSync(rosterFile) ? readFileSync(rosterFile, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean) : DEFAULT_NAMES
const AVATARS = ['🦊', '🐼', '🐱', '🐺', '🐻', '🐸', '🦆', '🦁', '🐨', '🦭', '🦌', '🐭', '🐯', '🦓', '🦦', '🐙', '🦄']

const ok = ({ data, error }, what) => { if (error) { console.error(`✗ ${what}: ${error.message}`); process.exit(1) } return data }
const chunks = (a, n = 400) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, (i + 1) * n))
const insert = async (table, rows) => { for (const c of chunks(rows)) ok(await sb.from(table).insert(c), table) }

// 1. учитель
const created = await sb.auth.admin.createUser({ email: `${login}@${DOMAIN}`, password: env('TEACHER_PASSWORD'), email_confirm: true })
const teacherUser = ok(created, 'учитель').user.id
console.log('✓ учитель', login)

// 2. класс
const h = buildHistory({ names })
const cls = ok(await sb.rpc('admin_create_class', {
  p_user: teacherUser, p_school: env('SCHOOL', 'Гимназия №70'), p_name: env('CLASS_NAME', '6А'), p_password: env('CLASS_PASSWORD'),
  p_teacher: env('TEACHER_NAME', 'Классный руководитель'), p_stations: STATIONS, p_slug: slug,
}), 'класс')
const cid = cls.id
console.log('✓ класс', slug)

// 3. ученики из списка (регистрация — по ссылке: каждый выберет своё имя) + «призрак» для писем
const students = ok(await sb.from('members').insert(names.map((name, i) => ({ class_id: cid, name, role: 'student', avatar: AVATARS[i % AVATARS.length] }))).select('id'), 'ученики')
const ghost = ok(await sb.from('members').insert({ class_id: cid, name: '—', role: 'ghost' }).select('id').single(), 'ghost')
const teacherMember = ok(await sb.from('members').select('id').eq('class_id', cid).eq('role', 'teacher').single(), 'teacher member')
const mid = (who) => (who === 'teacher' ? teacherMember.id : students[who].id)
console.log('✓ учеников:', students.length)

// 4. история
await insert('deeds', h.deeds.map((d) => ({ class_id: cid, member_id: mid(d.who), tree: d.tree, title: d.title, created_at: d.at.toISOString() })))
await insert('books', h.books.map((b) => ({ class_id: cid, member_id: mid(b.who), title: b.title, author: b.author, genre: b.genre, stars: b.stars, review: b.review, color: b.color, created_at: b.at.toISOString() })))
await insert('fives', h.fives.map((f) => ({ class_id: cid, member_id: mid(f.who), week_idx: f.week, subject: f.subject, count: f.count, created_at: f.at.toISOString() })))
await insert('train_legs', h.legs.map((l) => ({ class_id: cid, idx: l.idx, station_name: l.station.name, station_emoji: l.station.emoji, reward: l.station.reward || '', pushed: l.pushed, fives_total: l.fives_total, arrived_at: l.arrived_at.toISOString() })))
ok(await sb.from('train_meta').update({ station_idx: h.idx, stations: h.stations }).eq('class_id', cid), 'train_meta')
await insert('worries', h.worries.map((w) => ({ class_id: cid, author_id: ghost.id, text: w.text, mood: w.mood, size: w.size, created_at: w.at.toISOString(), reply: w.reply, replied_at: w.replied_at ? w.replied_at.toISOString() : null })))

console.log(`✓ история: ${h.deeds.length} дел, ${h.books.length} книг, ${h.fives.length} пятёрок, ${h.legs.length} станций в журнале, ${h.worries.length} писем`)
console.log(`\nГотово. Ссылка для учеников:  <адрес сайта>/#/c/${slug}`)
