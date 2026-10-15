export const hash = (s) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) }
  return (h >>> 0) / 4294967295
}

export const plural = (n, [one, few, many]) => {
  const a = Math.abs(n) % 100, b = a % 10
  if (a > 10 && a < 20) return many
  if (b > 1 && b < 5) return few
  if (b === 1) return one
  return many
}

export const ago = (iso) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 90) return 'только что'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} ${plural(m, ['минуту', 'минуты', 'минут'])} назад`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} ${plural(h, ['час', 'часа', 'часов'])} назад`
  const d = Math.round(h / 24)
  if (d < 30) return `${d} ${plural(d, ['день', 'дня', 'дней'])} назад`
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export const days = (iso) => (Date.now() - new Date(iso).getTime()) / 864e5
