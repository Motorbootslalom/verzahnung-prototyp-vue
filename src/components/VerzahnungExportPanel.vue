<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from '../state/store'
import { formatVerzahnungExport } from '../lib/exportText'
import { formatStartlistTsv, formatParticipantsTsv } from '../lib/tsv'
import { buildConfigUrl } from '../lib/urlconfig'
import { buildFehlerpunkteUrl } from '../lib/fehlerpunkteLink'

/**
 * Aufklappbare Box zum Exportieren der aktuellen Verzahnung (für die
 * Optimierung durch Claude) sowie zum Erzeugen eines teilbaren Konfig-Links.
 */
type CopyKind = 'export' | 'link' | 'fehlerpunkte' | 'startlist' | 'participants'

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

const { state } = useStore()
const open = ref(false)
const copied = ref<CopyKind | null>(null)

const exportText = computed(() => formatVerzahnungExport(state.value))

async function flash(which: CopyKind, text: string) {
  const ok = await copyText(text)
  if (ok) {
    copied.value = which
    setTimeout(() => (copied.value = null), 1500)
  }
}

const configUrl = () =>
  buildConfigUrl(state.value, typeof window !== 'undefined' ? window.location.href : '')

const fehlerpunkteUrl = computed(() => buildFehlerpunkteUrl(state.value))
</script>

<template>
  <div class="panel">
    <div class="export-head">
      <button class="btn ghost sm" @click="open = !open">
        {{ open ? '▾' : '▸' }} Für Optimierung exportieren
      </button>
      <span class="spacer" style="flex: 1" />
      <button
        class="btn sm"
        title="Teilnehmerliste als TSV (Excel) in die Zwischenablage"
        @click="flash('participants', formatParticipantsTsv(state))"
      >
        {{ copied === 'participants' ? '✓ Kopiert' : '📋 Teilnehmer (Excel)' }}
      </button>
      <button
        class="btn sm"
        title="Verzahnte Startliste als TSV (Excel) in die Zwischenablage"
        @click="flash('startlist', formatStartlistTsv(state))"
      >
        {{ copied === 'startlist' ? '✓ Kopiert' : '📊 Startliste (Excel)' }}
      </button>
      <button class="btn sm" :title="configUrl()" @click="flash('link', configUrl())">
        {{ copied === 'link' ? '✓ Link kopiert' : '🔗 Konfig-Link' }}
      </button>
      <button
        class="btn sm"
        title="Einstellungs-Link für die Fehlerpunktlisten (Veranstaltung + Startnummern je Klasse in Startreihenfolge) kopieren"
        @click="flash('fehlerpunkte', fehlerpunkteUrl)"
      >
        {{ copied === 'fehlerpunkte' ? '✓ Link kopiert' : '📝 Fehlerpunkte-Link' }}
      </button>
      <a
        class="btn sm ghost"
        :href="fehlerpunkteUrl"
        target="_blank"
        rel="noopener"
        title="Fehlerpunkte-Tool mit diesen Startnummern öffnen"
        >↗</a
      >
      <button class="btn sm primary" @click="flash('export', exportText)">
        {{ copied === 'export' ? '✓ Kopiert' : '📋 Verzahnung (Text)' }}
      </button>
    </div>
    <p class="hint" style="margin: 8px 0 0">
      Übernimm das Ergebnis nach Excel: <b>Startliste (verzahnt)</b> oder <b>Teilnehmerliste</b> als
      TSV kopieren und in Excel einfügen. Oder die Verzahnung als Text an Claude zur Optimierung
      geben bzw. den Konfig-Link teilen. Der <b>Fehlerpunkte-Link</b> öffnet die
      WKR-Fehlerpunktlisten mit Veranstaltung und Startnummern je Klasse in Startreihenfolge.
    </p>
    <textarea v-if="open" class="export-text" readonly :value="exportText" rows="16" />
  </div>
</template>
