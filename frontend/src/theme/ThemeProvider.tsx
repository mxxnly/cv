import { useCallback, useEffect, useState, type ReactNode } from 'react'

import { ThemeContext, type Theme } from './context'

function readInitialTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    root.style.colorScheme = theme
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* private mode: the theme just will not persist */
    }
  }, [theme])

  const toggleTheme = useCallback(() => setTheme((current) => (current === 'dark' ? 'light' : 'dark')), [])

  return <ThemeContext value={{ theme, toggleTheme }}>{children}</ThemeContext>
}
