<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from '../state/store'
import {
  FIXED_ORDER_LABEL,
  formatParticipantsTsv,
  formatStartlistTsv,
  parseParticipantsTsv,
  type ImportResult,
} from '../lib/tsv'

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Datenaustausch mit Excel per Copy&Paste (TSV): Teilnehmerliste importieren
 * sowie die verzahnte Startliste bzw. die Teilnehmerliste exportieren.
 */
const { state, dispatch } = useStore()
const open = ref(false)
const raw = ref('')
const result = ref<ImportResult | null>(null)
const copied = ref<'startlist' | 'participants' | null>(null)

const preview = computed(() => (raw.value.trim() ? parseParticipantsTsv(raw.value) : null))

const placeholder =
  'Zellen aus Excel hier einfügen …\n\n' +
  'Mit Kopfzeile (Reihenfolge egal): Klasse\tNachname\tVorname\tGröße\tVerein\tGeburtsdatum\tStartnummer\n' +
  'Ohne Kopfzeile (feste Reihenfolge): ' +
  FIXED_ORDER_LABEL

function doImport(mode: 'replace' | 'merge') {
  const res = parseParticipantsTsv(raw.value)
  if (res.imported === 0) {
    result.value = res
    return
  }
  dispatch({ type: 'IMPORT_PARTICIPANTS', participants: res.participants, mode })
  result.value = res
  raw.value = ''
}

async function copy(which: 'startlist' | 'participants') {
  const text =
    which === 'startlist' ? formatStartlistTsv(state.value) : formatParticipantsTsv(state.value)
  if (await copyText(text)) {
    copied.value = which
    setTimeout(() => (copied.value = null), 1500)
  }
}

function onRaw(e: Event) {
  raw.value = (e.target as HTMLTextAreaElement).value
  result.value = null
}
</script>

<template>
  <div class="panel">
    <div class="export-head">
      <button class="btn ghost sm" @click="open = !open">
        {{ open ? '▾' : '▸' }} Excel-Datenaustausch (Import / Export)
      </button>
      <span class="spacer" style="flex: 1" />
      <button
        class="btn sm"
        title="Teilnehmerliste als TSV in die Zwischenablage – in Excel einfügbar"
        @click="copy('participants')"
      >
        {{ copied === 'participants' ? '✓ Kopiert' : '📋 Teilnehmerliste' }}
      </button>
      <button
        class="btn sm primary"
        title="Verzahnte Startliste als TSV in die Zwischenablage – in Excel einfügbar"
        @click="copy('startlist')"
      >
        {{ copied === 'startlist' ? '✓ Kopiert' : '📊 Startliste (verzahnt)' }}
      </button>
    </div>
    <p class="hint" style="margin: 8px 0 0">
      Kopiere Zellen aus Excel und füge sie unten ein, um die Teilnehmerliste zu importieren. Die
      Ergebnisse (Startliste bzw. Teilnehmerliste) kopierst du mit den Buttons oben zurück nach
      Excel.
    </p>

    <div v-if="open" style="margin-top: 12px">
      <label class="subhead" style="display: block; margin-bottom: 6px">
        Teilnehmerliste importieren (TSV / Excel-Zellen)
      </label>
      <textarea
        class="export-text"
        :value="raw"
        rows="8"
        :placeholder="placeholder"
        @input="onRaw"
      />
      <p class="note" style="margin-top: 6px">
        Erkannte Spalten (mit Kopfzeile, Reihenfolge egal): <b>Klasse</b>, Nachname, Vorname,
        Verein, Bundesland, Geburtsdatum (TT.MM.JJJJ oder ISO), Größe, Startnummer. Ohne Kopfzeile
        gilt die feste Reihenfolge: {{ FIXED_ORDER_LABEL }}. Fehlende Startnummern werden je Klasse
        nach Größe vergeben.
      </p>

      <p v-if="preview" class="note">
        Vorschau: {{ preview.imported }} Starter{{
          preview.usedHeader ? ' · Kopfzeile erkannt' : ' · feste Reihenfolge'
        }}{{ preview.skipped.length > 0 ? ` · ${preview.skipped.length} Zeile(n) übersprungen` : '' }}
      </p>

      <div class="row" style="gap: 8px; margin-top: 4px">
        <button
          class="btn primary"
          :disabled="!preview || preview.imported === 0"
          title="Ersetzt die gesamte aktuelle Teilnehmerliste durch den Import"
          @click="doImport('replace')"
        >
          Alle ersetzen
        </button>
        <button
          class="btn"
          :disabled="!preview || preview.imported === 0"
          title="Fügt die importierten Starter hinzu (Duplikate nach Name+Klasse werden übersprungen)"
          @click="doImport('merge')"
        >
          Ergänzen
        </button>
      </div>

      <div
        v-if="result"
        :class="['boat-banner', result.imported > 0 ? 'ok' : 'warn']"
        style="margin-top: 12px"
      >
        <template v-if="result.imported > 0">✓ {{ result.imported }} Starter importiert.</template>
        <template v-else>⚠ Keine Starter erkannt – bitte Format prüfen.</template>
        <template v-if="result.skipped.length > 0">
          {{ ' ' }}{{ result.skipped.length }} Zeile(n) übersprungen:
          <ul style="margin: 6px 0 0; padding-left: 18px">
            <li v-for="s in result.skipped.slice(0, 6)" :key="s.line">
              Zeile {{ s.line }}: {{ s.reason }}
            </li>
            <li v-if="result.skipped.length > 6">… {{ result.skipped.length - 6 }} weitere</li>
          </ul>
        </template>
      </div>
    </div>
  </div>
</template>
