import type { MotionValue } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { MAP_SHADER, MOON_SHADER, VERTEX_SHADER } from './moonShaders'

const SEED = 7.0
const BAKE_ROWS_PER_FRAME = 64
const MAX_DPR = 1.75
const MAX_PIXELS = 1700

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Cannot create shader')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader compilation failed')
  }
  return shader
}

function createProgram(gl: WebGLRenderingContext, fragment: string): WebGLProgram {
  const program = gl.createProgram()
  if (!program) throw new Error('Cannot create program')
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragment))
  gl.bindAttribLocation(program, 0, 'aPosition')
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? 'Program link failed')
  }
  return program
}

interface MoonCanvasProps {
  /** Phase angle in radians: 0 = new moon, π = full moon. */
  phase: MotionValue<number>
  /** Current opacity of the moon; rendering pauses while it is invisible. */
  visibility: MotionValue<number>
  isDay: boolean
}

export function MoonCanvas({ phase, visibility, isDay }: MoonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dayTarget = useRef(isDay ? 1 : 0)
  const [supported] = useState(detectWebGL)

  useEffect(() => {
    dayTarget.current = isDay ? 1 : 0
  }, [isDay])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!supported || !canvas) return

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      powerPreference: 'low-power',
    })
    if (!gl) return

    let mapProgram: WebGLProgram
    let moonProgram: WebGLProgram
    try {
      mapProgram = createProgram(gl, MAP_SHADER)
      moonProgram = createProgram(gl, MOON_SHADER)
    } catch (error) {
      console.warn('Moon shader unavailable:', error)
      return
    }

    const quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    // Equirectangular surface map, power-of-two so longitude can wrap with REPEAT.
    const mapWidth = Math.min(2048, gl.getParameter(gl.MAX_TEXTURE_SIZE) as number)
    const mapHeight = mapWidth / 2
    const map = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, map)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, mapWidth, mapHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    const framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, map, 0)
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      console.warn('Moon framebuffer incomplete')
      return
    }

    const uniform = (program: WebGLProgram, name: string) => gl.getUniformLocation(program, name)
    const u = {
      seed: uniform(mapProgram, 'uSeed'),
      map: uniform(moonProgram, 'uMap'),
      mapSize: uniform(moonProgram, 'uMapSize'),
      pixels: uniform(moonProgram, 'uPixels'),
      phase: uniform(moonProgram, 'uPhase'),
      libration: uniform(moonProgram, 'uLibration'),
      day: uniform(moonProgram, 'uDay'),
      reveal: uniform(moonProgram, 'uReveal'),
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const pointer = { x: 0, y: 0, sx: 0, sy: 0 }
    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    let bakedRows = 0
    let revealStart = 0
    let day = dayTarget.current
    let frame = 0
    let lost = false

    const onContextLost = (event: Event) => {
      event.preventDefault()
      lost = true
    }
    canvas.addEventListener('webglcontextlost', onContextLost)

    const bake = () => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
      gl.viewport(0, 0, mapWidth, mapHeight)
      gl.useProgram(mapProgram)
      gl.uniform1f(u.seed, SEED)
      gl.enable(gl.SCISSOR_TEST)
      gl.scissor(0, bakedRows, mapWidth, BAKE_ROWS_PER_FRAME)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      gl.disable(gl.SCISSOR_TEST)
      bakedRows += BAKE_ROWS_PER_FRAME
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      const size = Math.min(Math.round(canvas.clientWidth * dpr), MAX_PIXELS)
      if (size > 0 && (canvas.width !== size || canvas.height !== size)) {
        canvas.width = size
        canvas.height = size
      }
    }

    const render = (now: number) => {
      frame = requestAnimationFrame(render)
      if (lost || document.hidden) return

      if (bakedRows < mapHeight) {
        bake()
        if (bakedRows >= mapHeight) revealStart = now
        return
      }
      if (visibility.get() < 0.01) return

      resize()
      day += (dayTarget.current - day) * 0.06
      pointer.sx += (pointer.x - pointer.sx) * 0.04
      pointer.sy += (pointer.y - pointer.sy) * 0.04

      const t = now / 1000
      const libX = reduceMotion ? 0.12 : 0.12 + Math.sin(t * 0.11) * 0.09 + pointer.sx * 0.12
      const libY = reduceMotion ? 0.05 : 0.05 + Math.sin(t * 0.083 + 1.3) * 0.05 - pointer.sy * 0.07
      const reveal = reduceMotion ? 1 : Math.min(1, (now - revealStart) / 1400)

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(moonProgram)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, map)
      gl.uniform1i(u.map, 0)
      gl.uniform2f(u.mapSize, mapWidth, mapHeight)
      gl.uniform1f(u.pixels, canvas.width)
      gl.uniform1f(u.phase, phase.get())
      gl.uniform2f(u.libration, libX, libY)
      gl.uniform1f(u.day, day)
      gl.uniform1f(u.reveal, 1 - Math.pow(1 - reveal, 3))
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      gl.deleteTexture(map)
      gl.deleteFramebuffer(framebuffer)
      gl.deleteBuffer(quad)
      gl.deleteProgram(mapProgram)
      gl.deleteProgram(moonProgram)
    }
  }, [supported, phase, visibility])

  if (!supported) return <div className="moon-fallback" />

  return <canvas ref={canvasRef} className="block size-full" />
}
