import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { EASE_OUT_EXPO } from '../../lib/motion'
import { useLenisInstance } from '../../lib/scroll'

interface ModalProps {
  open: boolean
  onClose: () => void
  labelledBy: string
  closeLabel: string
  children: ReactNode
}

export function Modal({ open, onClose, labelledBy, closeLabel, children }: ModalProps) {
  const lenis = useLenisInstance()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    lenis?.stop()
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 50)

    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', onKeyDown)
      document.documentElement.style.overflow = ''
      lenis?.start()
      previouslyFocused?.focus()
    }
  }, [open, onClose, lenis])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div
            className="absolute inset-0 bg-bg/70 backdrop-blur-md"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            data-lenis-prevent
            className="glass shadow-moon relative max-h-[92svh] w-full max-w-4xl overflow-y-auto overscroll-contain rounded-t-[2rem] bg-elevated/90 sm:rounded-[2rem]"
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="glass absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full text-fg transition-transform hover:rotate-90"
            >
              <X className="size-4" />
            </button>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
