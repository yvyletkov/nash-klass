import { INK, C, Blob } from './sketch.jsx'

export const TREES = [
  { id: 'oak', name: 'Дуб', hint: 'крепкий и надёжный' },
  { id: 'apple', name: 'Яблоня', hint: 'щедрая' },
  { id: 'birch', name: 'Берёзка', hint: 'нежная' },
  { id: 'spruce', name: 'Ёлка', hint: 'зелёная круглый год' },
  { id: 'sakura', name: 'Сакура', hint: 'самая красивая' },
  { id: 'sunflower', name: 'Подсолнух', hint: 'за солнцем' },
  { id: 'tulip', name: 'Тюльпан', hint: 'весёлый' },
  { id: 'star', name: 'Звёздное дерево', hint: 'волшебное' },
]

const trunk = (d, fill = '#a9703c') => (
  <path d={d} fill={fill} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
)

const Ground = () => (
  <g>
    <ellipse cx="50" cy="113" rx="30" ry="5" fill={INK} opacity=".14" />
    <path d="M20 112 L24 104 L28 112 M70 112 L74 105 L78 112" stroke="#3a9a3a" strokeWidth="3" fill="none" strokeLinecap="round" />
  </g>
)

const art = {
  oak: (
    <>
      {trunk('M42 112 C 44 96, 44 84, 40 72 L60 72 C 56 84, 56 98, 60 112 Z')}
      <path d="M50 96 L36 84 M50 90 L64 80" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <Blob circles={[[30, 56, 22], [70, 56, 22], [50, 40, 28], [50, 62, 24]]} fill={C.leaf} />
      <path d="M36 42 Q40 36 46 38 M62 52 Q68 46 74 50" stroke="#3a9a3a" strokeWidth="4" fill="none" strokeLinecap="round" />
    </>
  ),
  apple: (
    <>
      {trunk('M43 112 C 45 98, 46 88, 42 78 L58 78 C 54 88, 55 98, 57 112 Z')}
      <Blob circles={[[32, 52, 20], [68, 52, 20], [50, 36, 24], [50, 56, 22]]} fill="#7be06a" />
      {[[34, 46], [62, 40], [52, 58], [72, 58], [44, 30]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="6" fill={C.coral} stroke={INK} strokeWidth="2.8" />
          <path d={`M${x} ${y - 6} q2 -4 5 -4`} stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </g>
      ))}
    </>
  ),
  birch: (
    <>
      <path d="M44 112 L46 60 L58 60 L56 112 Z" fill="#fffdf5" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M46 76 h6 M50 92 h6 M46 102 h5 M49 68 h5" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />
      <Blob circles={[[36, 44, 16], [66, 40, 18], [50, 28, 20], [50, 50, 18]]} fill="#a8e86a" />
      <path d="M34 54 q-4 10 -2 18 M68 52 q4 10 2 20 M52 54 q0 10 -2 14" stroke="#3a9a3a" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  spruce: (
    <>
      <rect x="44" y="94" width="12" height="18" rx="2" fill="#a9703c" stroke={INK} strokeWidth="4" />
      <path d="M50 8 L74 42 H62 L82 72 H66 L88 98 H12 L34 72 H18 L38 42 H26 Z" fill="#2fa86a" stroke={INK} strokeWidth="4.2" strokeLinejoin="round" />
      <path d="M36 62 q6 4 12 0 M52 82 q8 5 16 0 M44 40 q4 3 8 0" stroke="#127a48" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="86" r="4" fill={C.sun} stroke={INK} strokeWidth="2" /><circle cx="62" cy="64" r="4" fill={C.coral} stroke={INK} strokeWidth="2" />
    </>
  ),
  sakura: (
    <>
      {trunk('M44 112 C 46 96, 40 86, 34 74 L42 70 C 46 78, 50 80, 52 84 C 54 76, 56 68, 62 60 L68 64 C 60 72, 58 82, 57 94 C 57 102, 58 108, 60 112 Z', '#8b5a3c')}
      <Blob circles={[[28, 50, 18], [72, 48, 18], [50, 34, 24], [50, 54, 22], [38, 66, 12], [64, 66, 12]]} fill="#ffb3d1" />
      {[[34, 44], [58, 30], [72, 52], [48, 56], [26, 58]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-4" rx="2.6" ry="3.6" transform={`rotate(${a})`} fill="#fff" stroke="#e0508c" strokeWidth="1.2" />)}
          <circle r="1.8" fill={C.sun} />
        </g>
      ))}
      <path d="M20 106 q3 -4 6 0 M74 100 q3 -4 6 0" stroke="#ff8fb8" strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  sunflower: (
    <>
      <path d="M50 112 C 48 90, 52 70, 50 46" stroke={INK} strokeWidth="11" fill="none" strokeLinecap="round" />
      <path d="M50 112 C 48 90, 52 70, 50 46" stroke="#3fb34a" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M50 92 C 34 94, 26 84, 28 74 C 40 76, 48 82, 50 92 Z M50 80 C 66 80, 74 70, 72 60 C 60 62, 52 68, 50 80 Z" fill="#3fb34a" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      {Array.from({ length: 12 }).map((_, i) => <ellipse key={i} cx="50" cy="20" rx="7" ry="13" transform={`rotate(${i * 30} 50 40)`} fill={C.sun} stroke={INK} strokeWidth="3" />)}
      <circle cx="50" cy="40" r="15" fill="#8b4a1e" stroke={INK} strokeWidth="4" />
      <circle cx="45" cy="37" r="2.4" fill={INK} /><circle cx="55" cy="37" r="2.4" fill={INK} />
      <path d="M44 45 Q50 50 56 45" stroke={INK} strokeWidth="2.8" fill="none" strokeLinecap="round" />
    </>
  ),
  tulip: (
    <>
      <path d="M50 112 C 52 96, 48 84, 50 64" stroke={INK} strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M50 112 C 52 96, 48 84, 50 64" stroke="#3fb34a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M50 108 C 28 104, 22 84, 26 68 C 40 74, 48 90, 50 108 Z" fill="#3fb34a" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M50 66 C 30 62, 28 36, 32 28 L42 40 L50 24 L58 40 L68 28 C 72 36, 70 62, 50 66 Z" fill={C.coral} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      <path d="M42 40 C 44 52, 46 58, 50 62 M58 40 C 56 52, 54 58, 50 62" stroke={INK} strokeWidth="2.6" fill="none" opacity=".4" />
    </>
  ),
  star: (
    <>
      {trunk('M43 112 C 45 96, 46 84, 42 72 L58 72 C 54 84, 55 96, 57 112 Z', '#7a4fc9')}
      <Blob circles={[[30, 52, 20], [70, 52, 20], [50, 36, 26], [50, 58, 22]]} fill="#b58cff" />
      {[[34, 46, 7], [62, 38, 9], [52, 60, 7], [72, 58, 5], [44, 28, 5]].map(([x, y, s], i) => (
        <path key={i} transform={`translate(${x} ${y}) scale(${s / 20})`} d="M0 -20 L5 -6 L20 -5 L8 4 L12 19 L0 11 L-12 19 L-8 4 L-20 -5 L-5 -6 Z" fill={C.sun} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
      ))}
      <circle cx="22" cy="24" r="2.5" fill={C.sun} /><circle cx="80" cy="30" r="2" fill={C.sun} />
    </>
  ),
}

/* growth: 0..1 — насколько выросло (маленький росток → большое дерево) */
export default function Tree({ kind = 'oak', size = 100, growth = 1, className = '', style }) {
  const g = 0.45 + 0.55 * Math.max(0, Math.min(1, growth))
  return (
    <svg className={className} width={size} height={size * 1.2} viewBox="0 0 100 120" style={style} overflow="visible">
      <Ground />
      <g className="boil" strokeLinecap="round">
        <g transform={`translate(50 112) scale(${g}) translate(-50 -112)`}>
          <g className="sway">{art[kind] || art.oak}</g>
        </g>
      </g>
    </svg>
  )
}
