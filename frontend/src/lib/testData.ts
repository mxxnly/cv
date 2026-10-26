import { useSiteFlags } from '../api/queries'

/** «Тестові дані» mode: decided by the backend (SITE_ENV + placeholders), never by the build. */
export function useTestDataMode(): boolean {
  const flags = useSiteFlags()
  return flags.data?.show_test_data_badge ?? false
}
