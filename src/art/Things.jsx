import { INK, C } from './sketch.jsx'

/* ---------- Паровозик (смотрит вправо) ---------- */
export function Locomotive({ width = 220, puff = true, style }) {
  return (
    <svg className="boil" width={width} viewBox="0 0 210 140" style={style} overflow="visible">
      {puff && (
        <g fill="#fff" stroke={INK} strokeWidth="3.5">
          <circle className="puff p1" cx="58" cy="20" r="9" /><circle className="puff p2" cx="58" cy="20" r="9" /><circle className="puff p3" cx="58" cy="20" r="9" />
        </g>
      )}
      <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="5" stroke={INK}>
        {/* труба */}
        <path d="M44 40 L48 22 L74 22 L78 40 Z" fill={C.grape} />
        <rect x="42" y="36" width="38" height="9" rx="4" fill={C.sun} />
        {/* котёл */}
        <rect x="30" y="42" width="112" height="56" rx="26" fill={C.coral} />
        <path d="M30 70 h112" stroke={INK} strokeWidth="3.5" opacity=".35" />
        <circle cx="132" cy="70" r="13" fill={C.cream} /><circle cx="132" cy="70" r="5" fill={INK} />
        {/* кабина */}
        <rect x="108" y="22" width="60" height="76" rx="9" fill={C.sky} />
        <rect x="102" y="16" width="72" height="12" rx="6" fill={C.grape} />
        <rect x="119" y="34" width="34" height="30" rx="7" fill="#fff" />
        <path d="M130 44 l2 2 M142 52 l-2 2" strokeWidth="3" />
        <circle cx="136" cy="49" r="3.4" fill={INK} stroke="none" />
        {/* низ */}
        <rect x="22" y="94" width="156" height="14" rx="6" fill="#6a5c88" />
        {/* кочегар-ловушка спереди */}
        <path d="M22 94 L6 118 L26 118 L34 98 Z" fill={C.sun} />
        {/* колёса */}
        {[56, 100, 150].map((x, i) => (
          <g key={x}>
            <circle cx={x} cy="116" r={i === 2 ? 15 : 17} fill={C.sun} />
            <circle cx={x} cy="116" r="4.5" fill={INK} />
            <g className="spin" style={{ transformOrigin: `${x}px 116px` }}>
              <path d={`M${x - 11} 116 H${x + 11} M${x} 105 V127`} strokeWidth="3" />
            </g>
          </g>
        ))}
        <path d="M56 116 H150" strokeWidth="4" />
      </g>
    </svg>
  )
}

/* Вагон с дровами */
export function Wagon({ width = 130, color = C.mint, logs = 3, style }) {
  return (
    <svg className="boil" width={width} viewBox="0 0 130 100" style={style}>
      <g strokeLinejoin="round" strokeLinecap="round" strokeWidth="5" stroke={INK}>
        <rect x="8" y="34" width="114" height="42" rx="8" fill={color} />
        <path d="M24 34 V76 M46 34 V76 M68 34 V76 M90 34 V76 M108 34 V76" strokeWidth="2.5" opacity=".3" />
        {Array.from({ length: logs }).map((_, i) => (
          <g key={i}>
            <rect x={20 + i * 30} y="16" width="26" height="22" rx="11" fill="#c98a4b" />
            <circle cx={33 + i * 30} cy="27" r="6" fill="#f0c58d" strokeWidth="3" />
          </g>
        ))}
        <rect x="14" y="76" width="102" height="10" rx="4" fill="#6a5c88" />
        {[38, 92].map((x) => (
          <g key={x}>
            <circle cx={x} cy="88" r="12" fill={C.sun} /><circle cx={x} cy="88" r="3.5" fill={INK} />
          </g>
        ))}
        <path d="M0 80 h8 M122 80 h8" strokeWidth="4" />
      </g>
    </svg>
  )
}

/* ---------- Ящик тревог: классический почтовый ящик со светящейся щелью ---------- */
export function Mailbox({ size = 220, open = false, style }) {
  return (
    <svg className="boil" width={size} height={size * 1.1} viewBox="0 0 220 240" style={style} overflow="visible">
      <ellipse cx="110" cy="228" rx="64" ry="9" fill={INK} opacity=".25" />
      <g strokeLinejoin="round" strokeLinecap="round" stroke={INK} strokeWidth="5">
        {/* столб */}
        <path d="M96 150 L94 226 L126 226 L124 150 Z" fill="#a9703c" />
        <path d="M100 176 q5 3 10 0 M99 200 q6 3 12 0" strokeWidth="3" fill="none" opacity=".4" />
        {/* корпус */}
        <path d="M28 104 C 28 54, 62 30, 110 30 C 158 30, 192 54, 192 104 L192 146 C192 156, 186 162, 176 162 L44 162 C34 162, 28 156, 28 146 Z" fill="#5b7bd9" />
        <path d="M44 108 C 44 70, 68 48, 104 46" stroke="#fff" strokeWidth="6" fill="none" opacity=".3" />
        {/* дверца */}
        <path d="M54 92 H166 V146 H54 Z" fill="#4a68c0" strokeWidth="4" />
        <circle cx="154" cy="119" r="5" fill={C.sun} strokeWidth="3" />
        {/* щель для писем */}
        <rect x="70" y="64" width="80" height="14" rx="7" fill={open ? C.sun : '#1c1740'} />
        {open && <rect x="70" y="64" width="80" height="14" rx="7" fill="none" stroke="#fff" strokeWidth="2" opacity=".8" />}
        {/* надпись */}
        <path d="M76 118 h40 M76 130 h28" stroke="#fff" strokeWidth="4" opacity=".7" />
        {/* флажок */}
        <path d="M192 96 H208 V52" fill="none" />
        <path d="M208 52 L208 74 L186 63 Z" fill={C.coral} strokeWidth="4" className="flag" />
      </g>
      {open && <g className="glow-rays" stroke={C.sun} strokeWidth="4" strokeLinecap="round"><path d="M110 50 V36 M80 54 L72 42 M140 54 L148 42" /></g>}
    </svg>
  )
}

/* Бумажный самолётик */
export function Plane({ size = 70, style, className = '' }) {
  return (
    <svg className={`boil ${className}`} width={size} height={size * 0.7} viewBox="0 0 100 70" style={style}>
      <g strokeLinejoin="round" strokeLinecap="round" stroke={INK} strokeWidth="4.5">
        <path d="M4 36 L96 4 L58 66 L44 44 Z" fill="#fff" />
        <path d="M44 44 L96 4 L50 36 Z" fill="#dfe6ff" />
        <path d="M44 44 L50 62" fill="none" />
      </g>
    </svg>
  )
}

/* ---------- Иконки-вывески для главной ---------- */
export function BookStack({ size = 120 }) {
  const books = [[8, 78, 104, 22, C.coral], [14, 56, 92, 22, C.sky], [6, 34, 100, 22, C.sun], [18, 12, 84, 22, C.grape]]
  return (
    <svg className="boil" width={size} height={size} viewBox="0 0 120 120">
      <g strokeLinejoin="round" stroke={INK} strokeWidth="4.5">
        {books.map(([x, y, w, h, c], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx="4" fill={c} />
            <path d={`M${x + 12} ${y} v${h} M${x + 18} ${y} v${h}`} strokeWidth="3" opacity=".5" />
          </g>
        ))}
      </g>
    </svg>
  )
}

export function Sign({ children, color = C.sun, tilt = -3, style }) {
  return (
    <div className="sign" style={{ '--c': color, transform: `rotate(${tilt}deg)`, ...style }}>
      <i className="boil" />
      <span>{children}</span>
    </div>
  )
}

/* Безделушки на полке: цветок, глобус, лампа */
export function ShelfDecor({ i = 0 }) {
  const k = i % 3
  return (
    <svg className="boil" width="86" viewBox="0 0 86 110" style={{ display: 'block' }}>
      <g strokeLinejoin="round" strokeLinecap="round" stroke={INK} strokeWidth="4">
        {k === 0 && (
          <g>
            <path d="M43 62 C 40 44, 22 40, 14 22 C 30 22, 44 36, 43 62 Z M43 58 C 46 40, 62 34, 72 14 C 54 16, 42 32, 43 58 Z M43 60 C 43 40, 43 28, 43 10" fill={C.leaf} />
            <path d="M24 62 H62 L58 106 H28 Z" fill={C.coral} />
            <path d="M22 60 H64 V70 H22 Z" fill="#ff8f8f" />
          </g>
        )}
        {k === 1 && (
          <g>
            <path d="M28 106 H58 M43 86 V106" />
            <path d="M16 86 H70" />
            <circle cx="43" cy="48" r="34" fill={C.sky} />
            <path d="M24 36 C 32 28, 40 34, 38 44 C 36 52, 28 50, 26 58 C 22 52, 20 44, 24 36 Z M52 26 C 62 30, 66 44, 60 54 C 54 50, 50 42, 52 26 Z" fill={C.leaf} strokeWidth="3" />
            <path d="M12 60 C 30 78, 56 78, 74 50" fill="none" strokeWidth="3" opacity=".5" />
          </g>
        )}
        {k === 2 && (
          <g>
            <path d="M24 104 H62 L58 96 H28 Z" fill="#6a5c88" />
            <path d="M43 96 V54" />
            <path d="M20 54 L28 18 H58 L66 54 Z" fill={C.sun} />
            <path d="M32 22 L28 50" stroke="#fff" strokeWidth="4" opacity=".6" />
            <circle cx="43" cy="64" r="5" fill="#fff" strokeWidth="3" />
          </g>
        )}
      </g>
    </svg>
  )
}
