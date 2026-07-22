<script setup lang="ts">
import { classColor, parallelClassBadge, parallelClassLabel } from '../lib/classes'
import StartNr from './StartNr.vue'
import type { ParallelSlot } from '../lib/parallel'

/** Ein Startplatz (Starter oder Dummy) als farbiges Badge + Startnummer/Name. */
defineProps<{
  item: ParallelSlot
  international: boolean
  runNr?: number
}>()
</script>

<template>
  <div v-if="item.kind === 'dummy'" class="slot dummy-slot">
    <span class="class-badge dummy-badge">DU</span>
    <span class="slot-main">
      <span class="slot-nr">Dummy</span>
      <span class="slot-name">außer Wertung · {{ item.boat === 'klein' ? 'klein' : 'groß' }}</span>
    </span>
  </div>
  <div v-else class="slot">
    <span
      class="class-badge"
      :style="{ background: classColor(item.p.klasse) }"
      :title="parallelClassLabel(item.p.klasse, international)"
    >
      {{ parallelClassBadge(item.p.klasse, international) }}
    </span>
    <span class="slot-main">
      <span class="slot-nr">
        <StartNr :start-nr="item.p.startNr" :run-nr="runNr" />
      </span>
      <span class="slot-name">{{ item.p.nachname }}, {{ item.p.vorname }}</span>
    </span>
  </div>
</template>
