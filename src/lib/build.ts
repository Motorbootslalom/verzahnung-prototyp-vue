/**
 * Stand der laufenden Fassung – für die Fußzeile. So lässt sich z. B. nach
 * einem Push schnell prüfen, ob GitHub Pages schon die neue Fassung ausliefert.
 * Die Werte setzt Vite beim Bauen ein (siehe vite.config.ts).
 */
export const BUILD_TIME = typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : ''

/** Lesbarer Stand, z. B. „14.08.2026, 00:45:12". „unbekannt", wenn nicht gesetzt. */
export function buildLabel(): string {
  if (!BUILD_TIME) return 'unbekannt'
  const date = new Date(BUILD_TIME)
  return Number.isNaN(date.getTime()) ? 'unbekannt' : date.toLocaleString('de-DE')
}

export const BUILD_COMMIT = typeof __BUILD_COMMIT__ === 'string' ? __BUILD_COMMIT__ : ''
export const BUILD_COMMIT_TIME = typeof __BUILD_COMMIT_TIME__ === 'string' ? __BUILD_COMMIT_TIME__ : ''

/**
 * Codestand für die Fußzeile, z. B. „a925c90 vom 25.09.2026, 14:35". Ein „+“
 * hinter der ID heißt: gebaut mit nicht committeten Änderungen.
 */
export function commitLabel(): string {
  if (!BUILD_COMMIT) return 'unbekannt'
  const date = new Date(BUILD_COMMIT_TIME)
  return Number.isNaN(date.getTime())
    ? BUILD_COMMIT
    : `${BUILD_COMMIT} vom ${date.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}`
}
