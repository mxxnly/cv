import { useMutation, useQuery } from '@tanstack/react-query'

import { useI18n } from '../i18n/context'
import { api } from './client'

export function useProducts() {
  const { lang } = useI18n()
  return useQuery({ queryKey: ['products', lang], queryFn: () => api.products(lang) })
}

export function useProduct(slug: string) {
  const { lang } = useI18n()
  return useQuery({
    queryKey: ['product', slug, lang],
    queryFn: () => api.product(slug, lang),
    retry: (count, error) => !(error instanceof Error && 'status' in error && error.status === 404) && count < 2,
  })
}

export function usePrices() {
  const { lang } = useI18n()
  return useQuery({ queryKey: ['prices', lang], queryFn: () => api.prices(lang) })
}

export function useSiteContent() {
  const { lang } = useI18n()
  return useQuery({ queryKey: ['site', lang], queryFn: () => api.site(lang) })
}

export function useSiteFlags() {
  return useQuery({ queryKey: ['flags'], queryFn: api.flags, staleTime: Infinity })
}

export function useContactMutation() {
  return useMutation({ mutationFn: api.contact })
}

export function useSupportMutation() {
  return useMutation({ mutationFn: api.support })
}
