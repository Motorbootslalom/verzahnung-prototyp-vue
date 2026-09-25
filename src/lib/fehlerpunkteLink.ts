import type { AppState, ClassId, Participant } from '../types'
import { CLASS_IDS } from './classes'
import { planEvent } from './plan'
import { canonicalRunningNumbers } from './running'

/**
 * Einstellungs-Link für das Schwester-Tool **fehlerpunkte-prototyp-vue**
 * (WKR-Fehlerpunktlisten). Dort liest `src/lib/sharelink.ts` den URL-Parameter
 * `c`: Base64url-kodiertes JSON in der kompakten Wire-Form
 *   { e: Veranstaltung, n: { <Klasse>: [Startnummern …] }, k: "<Klassen>", … }.
 *
 * Übergeben werden nur Veranstaltung, die Startnummern je Klasse in
 * **Startreihenfolge der Manövrier-Verzahnung** und die **Klassen-Reihenfolge**
 * für die Schnellauswahl der Bögen – genau das, was die WKR-Bögen brauchen.
 * Aufbau, Bezeichnung und Bogen-Auswahl bleiben im Fehlerpunkte-Tool lokal
 * (fehlende Felder lässt es unangetastet).
 *
 * Ist die klassische Nummerierung aktiv, werden deren Nummern übergeben
 * (sie stehen dann auch auf den Startlisten), sonst die klassenbasierten
 * (E01, 312, …).
 */

const PARAM = 'c'

/** Standard-Adresse des Fehlerpunkte-Tools; per `VITE_FEHLERPUNKTE_URL` überschreibbar. */
export const FEHLERPUNKTE_URL: string =
  import.meta.env.VITE_FEHLERPUNKTE_URL ||
  'https://motorbootslalom.github.io/fehlerpunkte-prototyp-vue/'

/** Veranstaltungsname inkl. Jahr (nur angehängt, wenn es nicht schon enthalten ist). */
function eventLabel(state: AppState): string {
  const name = state.eventName.trim()
  const jahr = String(state.eventJahr)
  if (!name) return jahr
  return name.includes(jahr) ? name : `${name} ${jahr}`
}

/**
 * Alle Starter in Startreihenfolge: die (boot-beschränkte) Manövrier-
 * Verzahnung, Parcours nacheinander; danach Starter von Klassen, die keinem
 * Parcours zugeordnet sind (nach Klasse, dann Startnummer).
 */
function startOrder(state: AppState): Participant[] {
  const plan = planEvent(state)
  const byId = new Map(plan.plans.map((p) => [p.parcoursId, p]))
  const ordered = state.parcoursList.flatMap((p) => byId.get(p.id)?.sequence ?? [])
  const seen = new Set(ordered.map((p) => p.id))
  const rest = state.participants
    .filter((p) => !seen.has(p.id))
    .sort(
      (a, b) =>
        CLASS_IDS.indexOf(a.klasse) - CLASS_IDS.indexOf(b.klasse) ||
        a.startNr.localeCompare(b.startNr, 'de', { numeric: true }),
    )
  return [...ordered, ...rest]
}

/** Startnummern je Klasse in Startreihenfolge. */
export function numbersByClass(
  state: AppState,
  ordered: Participant[] = startOrder(state),
): Partial<Record<ClassId, string[]>> {
  const running = canonicalRunningNumbers(state)
  const out: Partial<Record<ClassId, string[]>> = {}
  for (const p of ordered) {
    const n = running?.get(p.id)
    ;(out[p.klasse] ??= []).push(n != null ? String(n) : p.startNr)
  }
  // Stabile Schlüssel-Reihenfolge E,1..7 (kürzere, vergleichbare Links).
  const sorted: Partial<Record<ClassId, string[]>> = {}
  for (const c of CLASS_IDS) if (out[c]) sorted[c] = out[c]
  return sorted
}

/**
 * Klassen in der Reihenfolge ihres ersten Starts, Parcours nacheinander – bei
 * zwei Parcours z. B. 1, 3, E, 2 (Parcours 1), dann 5, 7, 4, 6 (Parcours 2).
 * Das Fehlerpunkte-Tool legt die Bögen in dieser Reihenfolge an und hängt
 * Klassen ohne Starter hinten an.
 */
export function classOrder(state: AppState, ordered: Participant[] = startOrder(state)): ClassId[] {
  const out: ClassId[] = []
  for (const p of ordered) if (!out.includes(p.klasse)) out.push(p.klasse)
  return out
}

/** Base64url (UTF-8-fest) – identisch zur Dekodierung im Fehlerpunkte-Tool. */
function b64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Wert des URL-Parameters `c` für das Fehlerpunkte-Tool. */
export function encodeFehlerpunkteConfig(state: AppState): string {
  const ordered = startOrder(state)
  const order = classOrder(state, ordered)
  const wire = {
    e: eventLabel(state),
    n: numbersByClass(state, ordered),
    // Ohne Starter keine Reihenfolge – dann behält das Fehlerpunkte-Tool seine eigene.
    ...(order.length > 0 ? { k: order.join('') } : {}),
  }
  return b64urlEncode(JSON.stringify(wire))
}

/** Vollständiger Einstellungs-Link zum Fehlerpunkte-Tool. */
export function buildFehlerpunkteUrl(state: AppState, base: string = FEHLERPUNKTE_URL): string {
  const clean = base.split('?')[0].split('#')[0]
  return `${clean}?${PARAM}=${encodeFehlerpunkteConfig(state)}`
}
