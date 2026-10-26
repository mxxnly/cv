import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

// ========== COMPANY CONFIG ==========
// config/company.json is the single source of company data (see config/README.md). Values are
// injected into index.html and exposed as the `__COMPANY__` constant; a production build fails
// while placeholder fields remain unless ALLOW_PLACEHOLDERS=1 (staging only).
const COMPANY_PATH = process.env.COMPANY_CONFIG ?? resolve(__dirname, '../config/company.json')

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

function resolveCompany(node: Json, trail: string, placeholders: string[]): Json {
  if (Array.isArray(node)) return node.map((item, i) => resolveCompany(item, `${trail}[${i}]`, placeholders))
  if (node && typeof node === 'object') {
    if ('value' in node && typeof node.placeholder === 'boolean') {
      if (node.placeholder) placeholders.push(trail)
      return node.value
    }
    const out: { [key: string]: Json } = {}
    for (const [key, child] of Object.entries(node)) {
      if (key.startsWith('_')) continue
      if (key.endsWith('_placeholder') && child === true) {
        placeholders.push([trail, key.slice(0, -'_placeholder'.length)].filter(Boolean).join('.'))
        continue
      }
      out[key] = resolveCompany(child, [trail, key].filter(Boolean).join('.'), placeholders)
    }
    return out
  }
  return node
}

export function loadCompany(path = COMPANY_PATH) {
  const placeholders: string[] = []
  const raw = JSON.parse(readFileSync(path, 'utf8')) as Json
  const data = resolveCompany(raw, '', placeholders) as Record<string, Record<string, Json>>
  placeholders.sort()
  return { data, placeholders }
}

function companyPlugin(): Plugin {
  const { data, placeholders } = loadCompany()
  const brand = data.brand as { name: string; tagline: Record<string, string>; description: Record<string, string> }
  const site = data.site as { domain: string; default_language: string }
  return {
    name: 'mxxnly-company',
    config: () => ({
      define: {
        __COMPANY__: JSON.stringify(data),
        __COMPANY_PLACEHOLDERS__: JSON.stringify(placeholders),
        __SITE_ENV__: JSON.stringify(process.env.SITE_ENV ?? 'development'),
      },
    }),
    buildStart() {
      const production = process.env.NODE_ENV === 'production' || process.env.SITE_ENV === 'production'
      const allowed = ['1', 'true', 'yes'].includes((process.env.ALLOW_PLACEHOLDERS ?? '').toLowerCase())
      if (production && placeholders.length > 0 && !allowed) {
        throw new Error(
          `config/company.json still has placeholder fields:\n  - ${placeholders.join('\n  - ')}\n` +
            'A production build is blocked until they are replaced with real data ' +
            '(README → «Замінити перед запуском»). For staging set ALLOW_PLACEHOLDERS=1.',
        )
      }
    },
    transformIndexHtml(html) {
      const lang = site.default_language
      return html
        .replaceAll('%COMPANY_NAME%', brand.name)
        .replaceAll('%COMPANY_TAGLINE%', brand.tagline[lang])
        .replaceAll('%COMPANY_DESCRIPTION%', brand.description[lang])
        .replaceAll('%SITE_DOMAIN%', site.domain)
        .replaceAll('%SITE_LANG%', lang)
    },
  }
}

// Outside Docker the dev server proxies backend routes to a local `manage.py runserver`.
const apiTarget = process.env.VITE_API_PROXY ?? 'http://localhost:8000'
const hmrClientPort = process.env.VITE_HMR_CLIENT_PORT
  ? Number(process.env.VITE_HMR_CLIENT_PORT)
  : undefined

export default defineConfig({
  plugins: [companyPlugin(), react(), tailwindcss()],
  server: {
    host: true,
    port: Number(process.env.VITE_PORT ?? 5173),
    strictPort: true,
    // Extra hostnames allowed to reach the dev server (e.g. a phone on the LAN or a test container).
    allowedHosts: process.env.VITE_ALLOWED_HOSTS ? process.env.VITE_ALLOWED_HOSTS.split(',') : undefined,
    hmr: hmrClientPort ? { clientPort: hmrClientPort } : undefined,
    watch: process.env.VITE_USE_POLLING === 'true' ? { usePolling: true, interval: 300 } : undefined,
    proxy: Object.fromEntries(
      ['/api', '/admin', '/static', '/media', '/robots.txt', '/sitemap.xml'].map((path) => [path, apiTarget]),
    ),
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
