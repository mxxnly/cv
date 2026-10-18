import { useEffect, useRef } from 'react'

interface Star {
  x: number
  y: number
  r: number
  alpha: number
  speed: number
  offset: number
  depth: number
  color: string
}

interface Mote {
  x: number
  y: number
  r: number
  alpha: number
  vy: number
  sway: number
  offset: number
  color: string
}

interface ShootingStar {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  ttl: number
  length: number
}

const STAR_COLORS = ['238, 237, 247', '238, 237, 247', '238, 237, 247', '200, 212, 255', '255, 234, 205']
const MOTE_COLORS = ['81, 69, 201', '168, 119, 32', '120, 110, 230']

const random = (min: number, max: number) => min + Math.random() * (max - min)
const pick = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)]

/** Night: twinkling stars with parallax and shooting stars. Day: drifting light motes. */
export function StarField({ isDay }: { isDay: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dayTarget = useRef(isDay ? 1 : 0)

  useEffect(() => {
    dayTarget.current = isDay ? 1 : 0
  }, [isDay])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let width = 0
    let height = 0
    let stars: Star[] = []
    let motes: Mote[] = []
    let shooting: ShootingStar[] = []
    let day = dayTarget.current
    let nextShootingStar = performance.now() + random(2500, 5000)
    let lastTime = performance.now()
    let frame = 0
    const pointer = { x: 0, y: 0, sx: 0, sy: 0 }

    const populate = () => {
      const starCount = Math.min(560, Math.round((width * height) / 3300))
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.25 + Math.pow(Math.random(), 5) * 1.6,
        alpha: random(0.25, 0.95),
        speed: random(0.4, 1.9),
        offset: Math.random() * Math.PI * 2,
        depth: Math.random(),
        color: pick(STAR_COLORS),
      }))
      const moteCount = Math.min(70, Math.round((width * height) / 24000))
      motes = Array.from({ length: moteCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: random(0.8, 2.6),
        alpha: random(0.08, 0.3),
        vy: random(5, 16),
        sway: random(6, 22),
        offset: Math.random() * Math.PI * 2,
        color: pick(MOTE_COLORS),
      }))
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      populate()
    }

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX / window.innerWidth - 0.5
      pointer.y = event.clientY / window.innerHeight - 0.5
    }

    const drawStars = (time: number, opacity: number) => {
      const scroll = window.scrollY
      for (const star of stars) {
        const twinkle = reduceMotion ? 1 : 0.6 + 0.4 * Math.sin(time * star.speed + star.offset)
        const alpha = star.alpha * twinkle * opacity
        if (alpha < 0.02) continue
        const shift = 0.15 + star.depth * 0.85
        const x = star.x + pointer.sx * shift * 18
        const y = (((star.y - scroll * shift * 0.06 + pointer.sy * shift * 14) % height) + height) % height

        ctx.fillStyle = `rgba(${star.color}, ${alpha})`
        ctx.beginPath()
        ctx.arc(x, y, star.r, 0, Math.PI * 2)
        ctx.fill()

        if (star.r > 1.05) {
          ctx.fillStyle = `rgba(${star.color}, ${alpha * 0.12})`
          ctx.beginPath()
          ctx.arc(x, y, star.r * 3.2, 0, Math.PI * 2)
          ctx.fill()
        }
        if (star.r > 1.45) {
          ctx.strokeStyle = `rgba(${star.color}, ${alpha * 0.35})`
          ctx.lineWidth = 0.6
          ctx.beginPath()
          ctx.moveTo(x - star.r * 4, y)
          ctx.lineTo(x + star.r * 4, y)
          ctx.moveTo(x, y - star.r * 4)
          ctx.lineTo(x, y + star.r * 4)
          ctx.stroke()
        }
      }
    }

    const drawMotes = (time: number, dt: number, opacity: number) => {
      for (const mote of motes) {
        if (!reduceMotion) {
          mote.y -= mote.vy * dt
          if (mote.y < -10) {
            mote.y = height + 10
            mote.x = Math.random() * width
          }
        }
        const x = mote.x + Math.sin(time * 0.3 + mote.offset) * mote.sway + pointer.sx * 20
        const alpha = mote.alpha * opacity
        const gradient = ctx.createRadialGradient(x, mote.y, 0, x, mote.y, mote.r * 3)
        gradient.addColorStop(0, `rgba(${mote.color}, ${alpha})`)
        gradient.addColorStop(1, `rgba(${mote.color}, 0)`)
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(x, mote.y, mote.r * 3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const drawShootingStars = (now: number, dt: number, opacity: number) => {
      if (!reduceMotion && opacity > 0.5 && now > nextShootingStar) {
        const angle = random(0.32, 0.6)
        const speed = random(900, 1300)
        shooting.push({
          x: random(width * 0.25, width * 1.05),
          y: random(-20, height * 0.35),
          vx: -Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          age: 0,
          ttl: random(0.7, 1.15),
          length: random(120, 240),
        })
        nextShootingStar = now + random(4000, 10000)
      }

      shooting = shooting.filter((s) => s.age < s.ttl)
      for (const s of shooting) {
        s.age += dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        const life = Math.sin((s.age / s.ttl) * Math.PI)
        const norm = Math.hypot(s.vx, s.vy)
        const tailX = s.x - (s.vx / norm) * s.length
        const tailY = s.y - (s.vy / norm) * s.length
        const gradient = ctx.createLinearGradient(s.x, s.y, tailX, tailY)
        gradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * life * opacity})`)
        gradient.addColorStop(1, 'rgba(200, 193, 255, 0)')
        ctx.strokeStyle = gradient
        ctx.lineWidth = 1.4
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(tailX, tailY)
        ctx.stroke()
      }
    }

    const render = (now: number) => {
      frame = requestAnimationFrame(render)
      if (document.hidden) {
        lastTime = now
        return
      }
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now
      const time = now / 1000

      day += (dayTarget.current - day) * 0.06
      pointer.sx += (pointer.x - pointer.sx) * 0.05
      pointer.sy += (pointer.y - pointer.sy) * 0.05

      ctx.clearRect(0, 0, width, height)
      const night = 1 - day
      if (night > 0.01) {
        drawStars(time, night)
        drawShootingStars(now, dt, night)
      }
      if (day > 0.01) drawMotes(time, dt, day)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 size-full" />
}
