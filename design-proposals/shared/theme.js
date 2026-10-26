/* Shared by every mockup: resolves the theme from ?theme=light|dark, then localStorage,
   then prefers-color-scheme, and exposes a toggle for elements with [data-theme-toggle]. */
;(function () {
  var root = document.documentElement
  var params = new URLSearchParams(location.search)
  var theme = params.get('theme')
  if (theme !== 'light' && theme !== 'dark') {
    try { theme = localStorage.getItem('mxxnly-proposal-theme') } catch (e) { theme = null }
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme

  function toggle() {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    root.style.colorScheme = next
    try { localStorage.setItem('mxxnly-proposal-theme', next) } catch (e) {}
  }
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-theme-toggle]')
    if (button) { event.preventDefault(); toggle() }
  })
})()
