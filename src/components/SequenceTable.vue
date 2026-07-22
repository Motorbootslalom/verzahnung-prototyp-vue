<script setup lang="ts">
import { getClass } from '../lib/classes'
import StartNr from './StartNr.vue'
import type { AppState, Participant } from '../types'

defineProps<{
  sequence: Participant[]
  originMode: AppState['originMode']
  running: Map<string, number> | null
}>()
</script>

<template>
  <div v-if="sequence.length === 0" class="empty">Noch keine Starter auf diesem Parcours.</div>
  <div v-else class="sequence">
    <table>
      <thead>
        <tr>
          <th class="pos">#</th>
          <th style="width: 44px">Kl.</th>
          <th style="width: 64px">{{ running ? 'Start-Nr.' : 'S-Nr.' }}</th>
          <th>Name, Vorname</th>
          <th>{{ originMode === 'bundesland' ? 'Bundesland' : 'Verein' }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(p, i) in sequence" :key="p.id">
          <td class="pos">{{ i + 1 }}</td>
          <td>
            <span
              class="class-badge"
              :style="{ background: getClass(p.klasse).color, minWidth: '22px', height: '20px' }"
            >
              {{ p.klasse }}
            </span>
          </td>
          <td class="num">
            <StartNr :start-nr="p.startNr" :run-nr="running?.get(p.id)" />
          </td>
          <td>{{ p.nachname }}, {{ p.vorname }}</td>
          <td>{{ originMode === 'bundesland' ? p.bundesland : p.verein || p.bundesland }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
