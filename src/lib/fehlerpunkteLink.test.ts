import { describe, it, expect } from 'vitest'
import { buildFehlerpunkteUrl, encodeFehlerpunkteConfig, numbersByClass } from './fehlerpunkteLink'
import type { AppState, ClassId, Participant } from '../types'

function make(klasse: ClassId, n: number): Participant[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${klasse}-${i}`,
    startNr: klasse + String(i + 1).padStart(2, '0'),
    vorname: 'V',
    nachname: 'N',
    verein: 'C',
    bundesland: 'B',
    geburtsdatum: '2015-01-01',
    groesse: '',
    klasse,
  }))
}

function baseState(): AppState {
  return {
    eventName: 'Möwepokal',
    eventJahr: 2027,
    originMode: 'verein',
    initialized: true,
    participants: [...make('E', 3), ...make('1', 2), ...make('4', 2)],
    parcoursList: [{ id: 'p1', name: 'Parcours 1', classIds: ['E', '1'], wechselFaktor: 2 }],
    boats: { klein: 4, gross: 4 },
    class4Small: false,
    parallelInternational: true,
    parallelOrderByStartNr: false,
    runningNumbers: { enabled: false, source: 'manoever', start: 1, skipText: '' },
  }
}

/** Dekodiert wie das Fehlerpunkte-Tool (Base64url → UTF-8 → JSON). */
function decode(url: string) {
  const c = new URL(url).searchParams.get('c')!
  const b64 = c.replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(decodeURIComponent(escape(atob(b64))))
}

describe('Fehlerpunkte-Link', () => {
  it('kodiert Veranstaltung (mit Jahr) und Startnummern je Klasse', () => {
    const wire = decode(buildFehlerpunkteUrl(baseState()))
    expect(wire.e).toBe('Möwepokal 2027')
    expect(wire.n).toEqual({ E: ['E01', 'E02', 'E03'], '1': ['101', '102'], '4': ['401', '402'] })
  })

  it('hängt das Jahr nicht doppelt an', () => {
    const wire = decode(buildFehlerpunkteUrl({ ...baseState(), eventName: 'Pokal 2027' }))
    expect(wire.e).toBe('Pokal 2027')
  })

  it('nutzt die klassischen Nummern in Verzahnungs-Reihenfolge, wenn aktiv', () => {
    const state = {
      ...baseState(),
      runningNumbers: { enabled: true, source: 'manoever' as const, start: 1, skipText: '' },
    }
    const nums = numbersByClass(state)
    const all = Object.values(nums).flat().map(Number)
    // Parcours-Starter erhalten 1..5, Klasse 4 (ohne Parcours) keine klassische Nummer.
    expect([...nums.E!, ...nums['1']!].map(Number).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5])
    expect(nums['4']).toEqual(['401', '402'])
    expect(all.length).toBe(7)
  })

  it('ersetzt eine vorhandene Query in der Basis-URL', () => {
    const url = buildFehlerpunkteUrl(baseState(), 'http://localhost:5174/?c=alt#x')
    expect(url.startsWith('http://localhost:5174/?c=')).toBe(true)
    expect(url).not.toContain('alt')
    expect(url).toContain(encodeFehlerpunkteConfig(baseState()))
  })
})
