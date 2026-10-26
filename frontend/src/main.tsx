import '@fontsource-variable/manrope'
import './styles/index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import { captureAttribution } from './lib/attribution'
import { initConsentDefaults } from './lib/consent'
import { router } from './router'
import { ThemeProvider } from './theme/ThemeProvider'

// Consent Mode v2 defaults (all denied) must be set before any tag could load.
initConsentDefaults()
// Remember utm_* / gclid from the first page of the session for form attribution.
captureAttribution()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: false },
  },
})

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root is missing')

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)
