import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const INK = '#2a2140'
export const C = {
  sun: '#f6c344', coral: '#ef6a5a', mint: '#3dc2a0', sky: '#4aaee6', grape: '#8c64d6',
  pink: '#f08cab', leaf: '#5fbd58', orange: '#f59a23', paper: '#fff6e2', cream: '#fff3b0',
}

/* Три фильтра с разным шумом. Каждые ~150 мс переключаем их — линии «дрожат», как в рисованном мультфильме. */
export function SketchDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        {[1, 2, 3].map((n) => (
          <filter key={n} id={`wob${n}`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed={n * 7} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        ))}
      </defs>
    </svg>
  )
}

export function useBoil() {
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--wob', 'url(#wob1)')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let i = 0
    const t = setInterval(() => root.style.setProperty('--wob', `url(#wob${(i = (i + 1) % 3) + 1})`), 170)
    return () => clearInterval(t)
  }, [])
}

/* Карточка с дрожащей обводкой и жирной «рисованной» тенью */
export function Card({ color = '#fff', tilt = 0, className = '', style, children, as: Tag = 'div', ...rest }) {
  return (
    <Tag className={`card ${className}`} style={{ '--c': color, '--tilt': `${tilt}deg`, ...style }} {...rest}>
      <i className="card-bg boil" />
      {children}
    </Tag>
  )
}

export function Btn({ color = C.sun, className = '', children, ...rest }) {
  return (
    <button className={`btn ${className}`} style={{ '--c': color }} {...rest}>
      <i className="btn-bg boil" />
      <span>{children}</span>
    </button>
  )
}

/* Волнистое подчёркивание под заголовком */
export function Squiggle({ color = C.coral, w = 180 }) {
  return (
    <svg className="boil" width={w} height="16" viewBox="0 0 180 16" fill="none" style={{ display: 'block' }}>
      <path d="M3 9 C 18 1, 28 15, 44 8 S 70 2, 88 9 S 118 15, 134 7 S 160 3, 177 9" stroke={color} strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
}

export function Star({ size = 24, color = C.sun, style }) {
  return (
    <svg className="boil" width={size} height={size} viewBox="0 0 40 40" style={style}>
      <path d="M20 3 L25 15 L38 16 L28 25 L31 37 L20 30 L9 37 L12 25 L2 16 L15 15 Z" fill={color} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
    </svg>
  )
}

export function Cloud({ w = 140, color = '#fff', style }) {
  return (
    <svg className="boil" width={w} viewBox="0 0 140 70" style={style}>
      <g stroke={INK} strokeWidth="9" strokeLinejoin="round" fill={INK}>
        <circle cx="38" cy="42" r="22" /><circle cx="70" cy="30" r="27" /><circle cx="104" cy="42" r="22" /><rect x="38" y="42" width="66" height="22" rx="11" />
      </g>
      <g fill={color}>
        <circle cx="38" cy="42" r="22" /><circle cx="70" cy="30" r="27" /><circle cx="104" cy="42" r="22" /><rect x="38" y="42" width="66" height="22" rx="11" />
      </g>
    </svg>
  )
}

export function Sun({ size = 110, style }) {
  return (
    <svg className="boil" width={size} height={size} viewBox="0 0 120 120" style={style}>
      <g stroke={INK} strokeWidth="5" strokeLinecap="round">
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2
          return <line key={i} x1={60 + Math.cos(a) * 42} y1={60 + Math.sin(a) * 42} x2={60 + Math.cos(a) * 56} y2={60 + Math.sin(a) * 56} />
        })}
      </g>
      <circle cx="60" cy="60" r="34" fill={C.sun} stroke={INK} strokeWidth="5" />
      <circle cx="49" cy="55" r="4" fill={INK} /><circle cx="71" cy="55" r="4" fill={INK} />
      <path d="M46 70 Q60 82 74 70" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <circle cx="42" cy="68" r="5" fill={C.pink} opacity=".7" /><circle cx="78" cy="68" r="5" fill={C.pink} opacity=".7" />
    </svg>
  )
}

/* Крутая лента-заголовок страницы */
export function Title({ children, color = C.sun, sub }) {
  return (
    <div className="title-wrap">
      <h1 className="title" style={{ '--hl': color }}><span>{children}</span></h1>
      <Squiggle color={color} w={200} />
      {sub && <p className="title-sub">{sub}</p>}
    </div>
  )
}

export function Modal({ open, onClose, children, width = 520 }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.7, rotate: -4, y: 40 }} animate={{ scale: 1, rotate: 0, y: 0 }} exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            style={{ width: `min(${width}px, 100%)` }}
          >
            <Card color="#fffdf5" className="modal-card">
              <button className="modal-x" onClick={onClose} aria-label="Закрыть">✕</button>
              {children}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* Слияние обводки: сначала обводим кругами, потом заливаем — получается один контур «облачка» */
export function Blob({ circles, fill, stroke = INK, sw = 4 }) {
  return (
    <g>
      <g fill={stroke} stroke={stroke} strokeWidth={sw * 2} strokeLinejoin="round">
        {circles.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
      </g>
      <g fill={fill}>
        {circles.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}
      </g>
    </g>
  )
}
