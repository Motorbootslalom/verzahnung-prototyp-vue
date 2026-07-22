<script setup lang="ts">
import SlotCell from './SlotCell.vue'
import type { ParallelHeat, ParallelSlot } from '../lib/parallel'

const props = defineProps<{
  heats: ParallelHeat[]
  international: boolean
  running: Map<string, number> | null
}>()

const numNr = (slot: ParallelSlot) =>
  slot.kind === 'starter' ? props.running?.get(slot.p.id) : undefined
</script>

<template>
  <div v-if="heats.length === 0" class="empty">
    Keine Starter im gewählten Modus. Lege im Tab „Teilnehmer" Starter an{{
      international ? ' (international zählen nur Klassen bis 5).' : '.'
    }}
  </div>
  <template v-else>
    <div class="subhead">
      Startreihenfolge · {{ heats.length }} Läufe (Blöcke à 4 Starter durch farbige Linie getrennt)
    </div>
    <div class="sequence parallel-sequence">
      <table>
        <thead>
          <tr>
            <th class="pos">#</th>
            <th style="width: 60px">Boot</th>
            <th>Parcours A</th>
            <th>Parcours B</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="h in heats" :key="h.pos" :class="h.blockStart && h.pos > 1 ? 'block-start' : ''">
            <td class="pos">{{ h.pos }}</td>
            <td>
              <span :class="['boat-tag', h.boat]">{{ h.boat === 'klein' ? 'klein' : 'groß' }}</span>
              <span v-if="h.run === 2" class="run-tag" title="2. Lauf – Parcours getauscht">⇄</span>
            </td>
            <td>
              <SlotCell :item="h.a" :international="international" :run-nr="numNr(h.a)" />
            </td>
            <td>
              <SlotCell :item="h.b" :international="international" :run-nr="numNr(h.b)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
</template>
