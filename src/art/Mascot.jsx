import { INK, C } from './sketch.jsx'

/* Крылик — птенец с двумя крыльями («Два крыла»). mood: happy | wow | sleepy | sad | love */
export default function Mascot({ size = 140, mood = 'happy', flap = true, className = '', style }) {
  const eyes = {
    happy: (
      <>
        <Eye x={80} look={0} /><Eye x={120} look={0} />
      </>
    ),
    wow: (
      <>
        <Eye x={80} r={15} /><Eye x={120} r={15} />
      </>
    ),
    sad: (
      <>
        <Eye x={80} look={2} /><Eye x={120} look={2} />
        <path d="M66 70 L92 76 M134 70 L108 76" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
      </>
    ),
    sleepy: (
      <>
        <path d="M68 92 Q80 100 92 92 M108 92 Q120 100 132 92" stroke={INK} strokeWidth="5" fill="none" strokeLinecap="round" />
      </>
    ),
    love: (
      <>
        <Heart x={80} /><Heart x={120} />
      </>
    ),
  }[mood]

  return (
    <svg className={`mascot ${flap ? 'flap' : ''} ${className}`} width={size} height={size} viewBox="0 0 200 200" style={style}>
      <ellipse cx="100" cy="186" rx="46" ry="8" fill={INK} opacity=".16" />
      <g className="boil" strokeLinejoin="round" strokeLinecap="round">
        {/* лапки */}
        <path d="M82 160 L80 180 M72 181 L90 181 M118 160 L120 180 M110 181 L128 181" stroke={C.orange} strokeWidth="9" />
        <path d="M82 160 L80 180 M72 181 L90 181 M118 160 L120 180 M110 181 L128 181" stroke={INK} strokeWidth="3" opacity=".35" />
        {/* крылья */}
        <g className="wing wing-l">
          <path d="M56 104 C 14 82, 2 140, 40 156 C 58 160, 66 132, 56 104 Z" fill={C.sky} stroke={INK} strokeWidth="5" />
          <path d="M36 112 C 28 124, 28 138, 38 148 M46 108 C 40 118, 40 130, 46 140" stroke={INK} strokeWidth="3" fill="none" opacity=".5" />
        </g>
        <g className="wing wing-r">
          <path d="M144 104 C 186 82, 198 140, 160 156 C 142 160, 134 132, 144 104 Z" fill={C.sky} stroke={INK} strokeWidth="5" />
          <path d="M164 112 C 172 124, 172 138, 162 148 M154 108 C 160 118, 160 130, 154 140" stroke={INK} strokeWidth="3" fill="none" opacity=".5" />
        </g>
        {/* туловище */}
        <ellipse cx="100" cy="112" rx="58" ry="60" fill={C.sun} stroke={INK} strokeWidth="5.5" />
        <ellipse cx="100" cy="134" rx="34" ry="34" fill={C.cream} />
        {/* хохолок */}
        <path d="M92 54 C 88 38, 98 32, 96 22 M102 54 C 104 40, 116 36, 112 24 M112 57 C 118 46, 128 46, 130 38" stroke={INK} strokeWidth="5" fill="none" />
        {/* щёчки */}
        <circle cx="64" cy="112" r="9" fill={C.pink} opacity=".8" /><circle cx="136" cy="112" r="9" fill={C.pink} opacity=".8" />
        {eyes}
        {/* клюв */}
        {mood === 'wow' ? (
          <ellipse cx="100" cy="118" rx="9" ry="11" fill={C.orange} stroke={INK} strokeWidth="4.5" />
        ) : (
          <path d="M88 108 Q100 102 112 108 Q108 124 100 126 Q92 124 88 108 Z" fill={C.orange} stroke={INK} strokeWidth="4.5" />
        )}
        {mood === 'happy' && <path d="M92 116 Q100 122 108 116" stroke={INK} strokeWidth="2.5" fill="none" opacity=".5" />}
      </g>
    </svg>
  )
}

function Eye({ x, r = 13, look = 0 }) {
  return (
    <g>
      <circle cx={x} cy="92" r={r} fill="#fff" stroke={INK} strokeWidth="4.5" />
      <circle cx={x + look} cy={93 + Math.abs(look) * 0.5} r={r * 0.5} fill={INK} />
      <circle cx={x + look + 2.5} cy={89} r="2.8" fill="#fff" />
    </g>
  )
}

function Heart({ x }) {
  return <path transform={`translate(${x - 14} 76)`} d="M14 28 C -6 12, 6 -2, 14 8 C 22 -2, 34 12, 14 28 Z" fill={C.coral} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
}
