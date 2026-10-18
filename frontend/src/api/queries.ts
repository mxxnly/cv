import { useMutation, useQuery } from '@tanstack/react-query'

import { fetchPortfolio, sendContactMessage } from './client'

export function usePortfolio() {
  return useQuery({ queryKey: ['portfolio'], queryFn: fetchPortfolio })
}

export function useContactMutation() {
  return useMutation({ mutationFn: sendContactMessage })
}
