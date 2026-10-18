import { useId } from 'react'

/** Small deterministic PRNG so every project always gets the same artwork. */
function mulberry32(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface ProjectArtProps {
  seed: number
  color: string
  title: string
}

/** Generative cover for projects without an image: a tinted moon, orbit and stars. */
export function ProjectArt({ seed, color, title }: ProjectArtProps) {
  const id = useId().replaceAll(':', '')
  const random = mulberry32(seed * 7919 + 13)

  const stars = Array.from({ length: 46 }, () => ({
    x: random() * 160,
    y: random() * 100,
    r: 0.15 + random() * 0.45,
    o: 0.2 + random() * 0.7,
  }))
  const moon = { x: 96 + random() * 34, y: 34 + random() * 26, r: 26 + random() * 14 }
  const craters = Array.from({ length: 8 }, () => {
    const angle = random() * Math.PI * 2
    const distance = Math.sqrt(random()) * moon.r * 0.8
    return {
      x: moon.x + Math.cos(angle) * distance,
      y: moon.y + Math.sin(angle) * distance,
      r: 1.2 + random() * moon.r * 0.16,
    }
  })
  const shadowOffset = (0.35 + random() * 0.4) * moon.r

  return (
    <svg
      viewBox="0 0 160 100"
      preserveAspectRatio="xMidYMid slice"
      className="size-full"
      role="img"
      aria-label={title}
    >
      <defs>
        <radialGradient id={`${id}-sky`} cx="72%" cy="25%" r="85%">
          <stop offset="0" stopColor={color} stopOpacity="0.4" />
          <stop offset="0.6" stopColor={color} stopOpacity="0.06" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-moon`} cx="38%" cy="32%" r="78%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor={color} stopOpacity="0.75" />
          <stop offset="1" stopColor={color} stopOpacity="0.25" />
        </radialGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx={moon.x} cy={moon.y} r={moon.r} />
        </clipPath>
      </defs>

      <rect width="160" height="100" fill="var(--bg-elevated)" />
      <rect width="160" height="100" fill={`url(#${id}-sky)`} />
      {stars.map((star, i) => (
        <circle key={i} cx={star.x} cy={star.y} r={star.r} fill="var(--fg)" opacity={star.o * 0.7} />
      ))}

      <ellipse
        cx={moon.x}
        cy={moon.y}
        rx={moon.r * 1.9}
        ry={moon.r * 0.5}
        fill="none"
        stroke={color}
        strokeOpacity="0.35"
        strokeWidth="0.4"
        strokeDasharray="1.5 2"
        transform={`rotate(-14 ${moon.x} ${moon.y})`}
      />
      <circle cx={moon.x} cy={moon.y} r={moon.r * 1.25} fill={color} opacity="0.08" />
      <circle cx={moon.x} cy={moon.y} r={moon.r} fill={`url(#${id}-moon)`} />
      <g clipPath={`url(#${id}-clip)`}>
        {craters.map((crater, i) => (
          <circle key={i} cx={crater.x} cy={crater.y} r={crater.r} fill="#000" opacity="0.13" />
        ))}
        <circle cx={moon.x - shadowOffset} cy={moon.y + shadowOffset * 0.2} r={moon.r} fill="var(--bg-elevated)" opacity="0.82" />
      </g>
    </svg>
  )
}
