import { ArrowUpRight, RotateCw } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

import { dictionaries } from '../../i18n/strings'
import { EASE_OUT_EXPO } from '../../lib/motion'
import { Button } from '../ui/Button'
import { MoonPhase } from '../ui/MoonPhase'

interface StatusScreenProps {
  fraction: number
  title: string
  text: string
  action: ReactNode
}

function StatusScreen({ fraction, title, text, action }: StatusScreenProps) {
  return (
    <main className="relative z-10 grid min-h-svh place-items-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="glass shadow-moon flex max-w-md flex-col items-center gap-5 rounded-[2rem] p-10 text-center"
      >
        <MoonPhase fraction={fraction} size={48} />
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted">{text}</p>
        {action}
      </motion.div>
    </main>
  )
}

// Shown before the profile (and its language) is known, so the browser language decides.
const lang = navigator.language.toLowerCase().startsWith('uk') ? 'uk' : 'en'
const t = dictionaries[lang]

export function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <StatusScreen
      fraction={0.08}
      title={t.error.title}
      text={t.error.text}
      action={
        <Button onClick={onRetry} icon={<RotateCw className="size-4" />}>
          {t.error.retry}
        </Button>
      }
    />
  )
}

export function SetupScreen() {
  return (
    <StatusScreen
      fraction={0.5}
      title={t.setup.title}
      text={t.setup.text}
      action={
        <Button href="/admin/" icon={<ArrowUpRight className="size-4" />}>
          {t.setup.cta}
        </Button>
      }
    />
  )
}
