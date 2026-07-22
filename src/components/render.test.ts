// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Component } from 'vue'
import { createStore, storeKey } from '../state/store'
import App from '../App.vue'
import VerzahnungView from './VerzahnungView.vue'
import ParallelView from './ParallelView.vue'
import type { AppState, Participant, ClassId } from '../types'

const STORAGE_KEY = 'verzahnung-prototyp:v1'

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

/**
 * Minimaler localStorage-Ersatz. Node blendet ohne `--localstorage-file` ein
 * undefiniertes `localStorage`-Global ein, das die happy-dom-Version verdeckt –
 * deshalb wird hier explizit gestubbt.
 */
function stubStorage(initial: Record<string, string> = {}) {
  const store = { ...initial }
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v
      },
      removeItem: (k: string) => {
        delete store[k]
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k]
      },
      key: () => null,
      length: 0,
    } as Storage,
  })
}

const seed = (tracks: unknown): AppState => ({
  eventName: 'Test',
  eventJahr: 2026,
  originMode: 'verein',
  initialized: true,
  participants: [...make('E', 3), ...make('7', 6)],
  parcoursList: [{ id: 'p1', name: 'P1', classIds: ['E', '7'], wechselFaktor: 2, tracks: tracks as never }],
  boats: { klein: 2, gross: 2 },
  class4Small: false,
  parallelInternational: true,
  parallelOrderByStartNr: false,
  runningNumbers: { enabled: false, source: 'manoever', start: 1, skipText: '' },
})

/** Mountet eine Komponente mit frischem Store (liest den ggf. geseedeten localStorage). */
function mountWithStore(component: Component) {
  return mount(component, {
    global: { provide: { [storeKey as symbol]: createStore() } },
  })
}

describe('UI-Render (Smoke)', () => {
  beforeEach(() => stubStorage())

  it('ohne Daten wird der Setup-Screen gerendert', () => {
    const wrapper = mountWithStore(App)
    expect(wrapper.html()).toContain('Starterfeld generieren')
  })

  it('VerzahnungView rendert Startliste, Spuren und Pause-Chip', () => {
    stubStorage({
      [STORAGE_KEY]: JSON.stringify(
        seed([
          [{ kind: 'class', klasse: 'E' }],
          [{ kind: 'pause', id: 'pp', length: 3 }, { kind: 'class', klasse: '7' }],
        ]),
      ),
    })
    const wrapper = mountWithStore(VerzahnungView)
    expect(wrapper.html()).toContain('Verzahnte Startreihenfolge')
    expect(wrapper.html()).toContain('Spur A')
    expect(wrapper.html()).toContain('⏸ Pause')
    // Pause(3) vor Klasse 7 → E,E,E,7,7,7,7,7,7
    const badges = wrapper
      .findAll('.sequence .class-badge')
      .map((b) => b.text())
      .join(',')
    expect(badges).toBe('E,E,E,7,7,7,7,7,7')
  })

  it('klassische Startnummern: Spalte + fortlaufende Nummern in Verzahnungs-Reihenfolge', () => {
    const s = seed([
      [{ kind: 'class', klasse: 'E' }],
      [{ kind: 'pause', id: 'pp', length: 3 }, { kind: 'class', klasse: '7' }],
    ])
    s.runningNumbers = { enabled: true, source: 'manoever', start: 1, skipText: '' }
    stubStorage({ [STORAGE_KEY]: JSON.stringify(s) })
    const wrapper = mountWithStore(VerzahnungView)
    expect(wrapper.html()).toContain('Klassische Startnummern')
    // Klassische Nummer wird primär angezeigt (startnr-main) in Verzahnungs-Reihenfolge.
    const nums = wrapper.findAll('.sequence .startnr-main').map((n) => n.text())
    expect(nums).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9'])
  })

  it('ParallelView rendert Läufe, Bootstyp-Wechsel und Block-Trennung', () => {
    const parallelState: AppState = {
      eventName: 'Test',
      eventJahr: 2026,
      originMode: 'verein',
      initialized: true,
      participants: [...make('E', 2), ...make('4', 2)],
      parcoursList: [],
      boats: { klein: 2, gross: 2 },
      class4Small: false,
      parallelInternational: true,
      parallelOrderByStartNr: false,
      runningNumbers: { enabled: false, source: 'manoever', start: 1, skipText: '' },
    }
    stubStorage({ [STORAGE_KEY]: JSON.stringify(parallelState) })
    const wrapper = mountWithStore(ParallelView)
    expect(wrapper.html()).toContain('Parallel-Slalom')
    expect(wrapper.html()).toContain('Parcours A')
    expect(wrapper.html()).toContain('E01')
    expect(wrapper.html()).toContain('401')
    // ein voller Block (4 Läufe) mit einem klein- und einem groß-Tag
    expect(wrapper.find('.boat-tag.klein').exists()).toBe(true)
    expect(wrapper.find('.boat-tag.gross').exists()).toBe(true)
  })
})
