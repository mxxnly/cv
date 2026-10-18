import { useEffect, useState } from 'react'

function format(timeZone: string): { time: string; offset: string } {
  const now = new Date()
  try {
    const time = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
    }).format(now)
    const offset =
      new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
        .formatToParts(now)
        .find((part) => part.type === 'timeZoneName')?.value ?? ''
    return { time, offset }
  } catch {
    return { time: now.toTimeString().slice(0, 5), offset: '' }
  }
}

/** Live "HH:MM" clock in the given IANA time zone, refreshed every 15 seconds. */
export function useLocalTime(timeZone: string) {
  const [value, setValue] = useState(() => format(timeZone))

  useEffect(() => {
    const tick = () => setValue(format(timeZone))
    const interval = window.setInterval(tick, 15_000)
    const first = window.setTimeout(tick, 0)
    return () => {
      window.clearInterval(interval)
      window.clearTimeout(first)
    }
  }, [timeZone])

  return value
}
