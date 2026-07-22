<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useStore } from '../state/store'
import { CLASSES, ageHint } from '../lib/classes'
import { FIXED_ORDER_LABEL, parseParticipantsTsv } from '../lib/tsv'
import type { ClassId, OriginMode } from '../types'

const { state, dispatch } = useStore()

const eventName = ref(state.value.eventName)
const eventJahr = ref(state.value.eventJahr)
const originMode = ref<OriginMode>(state.value.originMode)
const counts = reactive(
  Object.fromEntries(CLASSES.map((c) => [c.id, 6])) as Record<ClassId, number>,
)

const total = computed(() => Object.values(counts).reduce((a, b) => a + b, 0))

function setCount(id: ClassId, value: number) {
  counts[id] = Math.max(0, Math.min(99, value || 0))
}

function onJahr(e: Event) {
  eventJahr.value = parseInt((e.target as HTMLInputElement).value, 10) || new Date().getFullYear()
}

function start() {
  dispatch({
    type: 'INIT_SETUP',
    eventName: eventName.value,
    eventJahr: eventJahr.value,
    originMode: originMode.value,
    counts: { ...counts },
  })
}

// Alternative zum Zufalls-Starterfeld: echte Teilnehmerliste aus Excel (TSV)
// direkt beim ersten Start importieren.
const importRaw = ref('')
const importPreview = computed(() =>
  importRaw.value.trim() ? parseParticipantsTsv(importRaw.value) : null,
)

const importPlaceholder =
  'Zellen aus Excel hier einfügen …\n\n' +
  'Mit Kopfzeile (Reihenfolge egal): Klasse\tNachname\tVorname\tGröße\tVerein\tGeburtsdatum\tStartnummer\n' +
  'Ohne Kopfzeile (feste Reihenfolge): ' +
  FIXED_ORDER_LABEL

function startWithImport() {
  const res = parseParticipantsTsv(importRaw.value)
  if (res.imported === 0) return
  // Erst das (leere) Setup initialisieren, dann die importierten Starter übernehmen.
  dispatch({
    type: 'INIT_SETUP',
    eventName: eventName.value,
    eventJahr: eventJahr.value,
    originMode: originMode.value,
    counts: {},
  })
  dispatch({ type: 'IMPORT_PARTICIPANTS', participants: res.participants, mode: 'replace' })
}
</script>

<template>
  <div class="setup-wrap">
    <div class="panel">
      <h2>Veranstaltung</h2>
      <p class="hint">
        Alle Daten bleiben lokal im Browser (localStorage) gespeichert. Starte mit einem zufällig
        generierten Starterfeld oder importiere gleich deine Teilnehmerliste aus Excel.
      </p>

      <div class="row">
        <div class="field" style="flex: 2; min-width: 220px">
          <label>Veranstaltung</label>
          <input class="input" v-model="eventName" placeholder="z. B. 30. Möwepokal" />
        </div>
        <div class="field" style="width: 130px">
          <label>Veranstaltungsjahr</label>
          <input class="input" type="number" :value="eventJahr" @input="onJahr" />
        </div>
        <div class="field">
          <label>Herkunft</label>
          <div class="segmented">
            <button
              :class="originMode === 'verein' ? 'active' : ''"
              type="button"
              @click="originMode = 'verein'"
            >
              Vereine
            </button>
            <button
              :class="originMode === 'bundesland' ? 'active' : ''"
              type="button"
              @click="originMode = 'bundesland'"
            >
              Bundesländer
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <h2>Starterfeld generieren</h2>
      <p class="hint">
        Dieser öffentliche Prototyp erzeugt zufällige Teilnehmer, damit die Darstellung und
        Verwaltung der Starterlisten mit den Fachteams besprochen werden kann.
      </p>

      <label style="font-size: 12px; font-weight: 600; color: var(--muted)">
        Anzahl Teilnehmer pro Klasse
      </label>
      <div class="setup-grid">
        <div v-for="c in CLASSES" :key="c.id" class="class-count">
          <span class="dot" :style="{ background: c.color }" />
          <div class="meta">
            <div class="name">{{ c.label }}</div>
            <div class="age">{{ ageHint(c.id, eventJahr) }}</div>
          </div>
          <input
            type="number"
            min="0"
            max="99"
            :value="counts[c.id]"
            @input="setCount(c.id, parseInt(($event.target as HTMLInputElement).value, 10))"
          />
        </div>
      </div>

      <div class="row" style="justify-content: space-between; align-items: center">
        <span class="hint" style="margin: 0">
          Gesamt: <b>{{ total }}</b> Starter · Geburtsjahrgänge werden aus dem Veranstaltungsjahr
          berechnet (Altersklasse = Jahr − Geburtsjahr).
        </span>
        <button class="btn primary" :disabled="total === 0" @click="start">
          Starterfeld erzeugen →
        </button>
      </div>
    </div>

    <div class="panel">
      <h2>Oder: Teilnehmer aus Excel importieren</h2>
      <p class="hint">
        Kopiere die Zellen deiner Teilnehmerliste aus Excel und füge sie hier ein (TSV). Erkannte
        Spalten (mit Kopfzeile, Reihenfolge egal): <b>Klasse</b>, Nachname, Vorname, Verein,
        Bundesland, Geburtsdatum (TT.MM.JJJJ oder ISO), Größe, Startnummer. Ohne Kopfzeile gilt die
        feste Reihenfolge: {{ FIXED_ORDER_LABEL }}. Fehlende Startnummern werden je Klasse nach
        Größe vergeben.
      </p>
      <textarea
        class="export-text"
        v-model="importRaw"
        rows="8"
        :placeholder="importPlaceholder"
      />
      <p v-if="importPreview" class="note">
        Vorschau: {{ importPreview.imported }} Starter{{
          importPreview.usedHeader ? ' · Kopfzeile erkannt' : ' · feste Reihenfolge'
        }}{{
          importPreview.skipped.length > 0
            ? ` · ${importPreview.skipped.length} Zeile(n) übersprungen`
            : ''
        }}
      </p>
      <div class="row" style="justify-content: flex-end; margin-top: 4px">
        <button
          class="btn primary"
          :disabled="!importPreview || importPreview.imported === 0"
          @click="startWithImport"
        >
          Importieren &amp; starten →
        </button>
      </div>
    </div>
  </div>
</template>
