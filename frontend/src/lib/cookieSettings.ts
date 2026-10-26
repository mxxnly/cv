export const COOKIE_SETTINGS_EVENT = 'mxxnly:cookie-settings'

/** Reopens the cookie banner in "settings" mode (footer link «Налаштування cookie»). */
export function openCookieSettings() {
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))
}
