<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '../state/store'
import { CLASSES, CLASS_IDS } from '../lib/classes'
import { planEvent } from '../lib/plan'
import { canonicalRunningNumbers } from '../lib/running'
import type { ClassId } from '../types'
import BoatPanel from './BoatPanel.vue'
import VerzahnungExportPanel from './VerzahnungExportPanel.vue'
import RunningNumberControls from './RunningNumberControls.vue'
import ParcoursCard from './ParcoursCard.vue'

/** Vorlagen für die Parcours-Aufteilung (schneller Wechsel ohne manuelles Löschen). */
const PARCOURS_PRESETS: { key: string; label: string; groups: ClassId[][] }[] = [
  { key: 'all', label: '1 Parcours (alle)', groups: [['E', '1', '2', '3', '4', '5', '6', '7']] },
  { key: 'split', label: '2 Parcours (E–3 · 4–7)', groups: [['E', '1', '2', '3'], ['4', '5', '6', '7']] },
]

/** Kanonische Signatur einer Klassen-Gruppierung – für den Abgleich mit einer Vorlage. */
function groupsSignature(groups: ClassId[][]): string {
  return groups
    .map((g) => [...g].sort((a, b) => CLASS_IDS.indexOf(a) - CLASS_IDS.indexOf(b)).join(''))
    .join('|')
}

const { state, dispatch } = useStore()

const unassigned = computed(() => {
  const assignedClasses = new Set(state.value.parcoursList.flatMap((p) => p.classIds))
  return CLASSES.filter(
    (c) => !assignedClasses.has(c.id) && state.value.participants.some((p) => p.klasse === c.id),
  )
})

const currentSig = computed(() => groupsSignature(state.value.parcoursList.map((p) => p.classIds)))

// Boot-beschränkte Planung: die angezeigte Verzahnung hält den Bootbestand ein.
const eventPlan = computed(() => planEvent(state.value))
const planById = computed(() => new Map(eventPlan.value.plans.map((p) => [p.parcoursId, p])))

// Kanonische klassische Startnummern (einheitlich für alle Ansichten).
const runningMap = computed(() => canonicalRunningNumbers(state.value))

function applyPreset(groups: ClassId[][], active: boolean) {
  if (!active) dispatch({ type: 'SET_PARCOURS_PRESET', groups })
}
</script>

<template>
  <div class="panel">
    <h2>Verzahnung der Parcours</h2>
    <p class="hint">
      Klassen werden nach Starterzahl möglichst gleichmäßig auf die Spuren verteilt, sodass immer
      ein Boots-Wechsel stattfindet. Ziehe Klassen-Blöcke per Drag&amp;Drop zwischen den Spuren
      oder ändere ihre Reihenfolge. Mit <b>+ Pause</b> fügst du einen Versatz ein – die Spur setzt
      dort die angegebene Anzahl Starts aus, sodass die nächste Klasse später einsetzt.
    </p>
    <div class="preset-row">
      <span class="preset-label">Schnellauswahl:</span>
      <div class="segmented">
        <button
          v-for="pr in PARCOURS_PRESETS"
          :key="pr.key"
          type="button"
          :class="currentSig === groupsSignature(pr.groups) ? 'active' : ''"
          :title="
            currentSig === groupsSignature(pr.groups)
              ? 'Diese Aufteilung ist bereits aktiv'
              : 'Parcours auf diese Aufteilung setzen (ersetzt die aktuelle)'
          "
          @click="applyPreset(pr.groups, currentSig === groupsSignature(pr.groups))"
        >
          {{ pr.label }}
        </button>
      </div>
    </div>
    <p v-if="unassigned.length > 0" class="note" style="color: var(--danger)">
      Nicht zugeordnet (fahren auf keinem Parcours):
      {{ unassigned.map((c) => `Klasse ${c.id}`).join(', ') }}
    </p>
  </div>

  <BoatPanel :plan="eventPlan" />

  <VerzahnungExportPanel />

  <RunningNumberControls />

  <ParcoursCard
    v-for="p in state.parcoursList"
    :key="p.id"
    :parcours="p"
    :plan="planById.get(p.id)!"
    :running="runningMap"
  />

  <button class="btn" @click="dispatch({ type: 'ADD_PARCOURS' })">+ Parcours hinzufügen</button>
</template>
