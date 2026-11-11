import { describe, it, expect } from 'vitest'
import { reducer } from './store'
import type { AppState, ClassId, Participant } from '../types'

function mk(klasse: ClassId, startNr: string, groesse = ''): Participant {
  return {
    id: `${klasse}-${startNr}`,
    startNr,
    vorname: 'V',
    nachname: 'N' + startNr,
    verein: 'C',
    bundesland: 'B',
    geburtsdatum: '2015-01-01',
    klasse,
    groesse,
  }
}

function stateWith(participants: Participant[]): AppState {
  return {
    eventName: 'Test',
    eventJahr: 2026,
    originMode: 'verein',
    participants,
    parcoursList: [],
    boats: { klein: 2, gross: 2 },
    class4Small: false,
    parallelInternational: true,
    parallelOrderByStartNr: false,
    runningNumbers: { enabled: false, source: 'manoever', start: 1, skipText: '' },
    initialized: true,
  }
}

const nrs = (s: AppState) => Object.fromEntries(s.participants.map((p) => [p.id, p.startNr]))

describe('Startnummern im Store', () => {
  // Importierte Nummern mit Lücken (206 und 306–310 fehlen).
  const imported = [
    mk('2', '205'),
    mk('2', '207'),
    mk('3', '305'),
    mk('3', '311', 'XS'),
    mk('E', 'E01'),
  ]

  it('Verschieben behält den Nummernbestand der Klasse (Lücken bleiben)', () => {
    const s = reducer(stateWith(imported), { type: 'MOVE_STARTER', id: '2-207', target: 'first' })
    expect(nrs(s)).toMatchObject({ '2-207': '205', '2-205': '207', '3-305': '305', '3-311': '311' })
  })

  it('Sortieren nach Größe verteilt nur die vorhandenen Nummern', () => {
    const s = reducer(stateWith(imported), { type: 'ORDER_CLASS_BY_SIZE', klasse: '3' })
    expect(nrs(s)).toMatchObject({ '3-311': '305', '3-305': '311', '2-205': '205' })
  })

  it('„Neu nummerieren" vergibt je Klasse fortlaufend in aktueller Reihenfolge', () => {
    const s = reducer(stateWith(imported), { type: 'RENUMBER_ALL' })
    expect(nrs(s)).toEqual({
      '2-205': '201',
      '2-207': '202',
      '3-305': '301',
      '3-311': '302',
      'E-E01': 'E01',
    })
    // Reihenfolge des Arrays bleibt unverändert.
    expect(s.participants.map((p) => p.id)).toEqual(imported.map((p) => p.id))
  })
})
