<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '../state/store'
import type { RunningNumberConfig } from '../types'

/**
 * Bedienung für die klassischen, fortlaufenden Startnummern (nach Verzahnung).
 * Wird in beiden Disziplinen genutzt und teilt sich dieselbe Einstellung.
 */
const { state, dispatch } = useStore()
const rn = computed(() => state.value.runningNumbers)

const set = (patch: Partial<RunningNumberConfig>) =>
  dispatch({ type: 'SET_RUNNING_NUMBERS', patch })

function onStart(e: Event) {
  set({ start: Math.max(1, parseInt((e.target as HTMLInputElement).value, 10) || 1) })
}
</script>

<template>
  <div class="panel">
    <div class="running-head">
      <button :class="['btn', 'sm', rn.enabled ? 'primary' : '']" @click="set({ enabled: !rn.enabled })">
        {{ rn.enabled ? '✓ Klassische Startnummern' : '# Klassische Startnummern' }}
      </button>
      <span class="hint" style="margin: 0">
        Vergibt jedem Starter eine fortlaufende Nummer (1, 2, 3 …) in der Reihenfolge der
        {{ rn.source === 'parallel' ? 'Parallel-Slalom' : 'Manövrier' }}-Verzahnung. Diese Nummer
        gilt einheitlich in der Teilnehmer-Liste und in beiden Disziplinen.
      </span>
    </div>

    <div v-if="rn.enabled" class="running-fields">
      <div class="field" style="width: auto">
        <label>Reihenfolge nach</label>
        <div class="segmented">
          <button
            type="button"
            :class="rn.source === 'manoever' ? 'active' : ''"
            @click="set({ source: 'manoever' })"
          >
            Manövrieren
          </button>
          <button
            type="button"
            :class="rn.source === 'parallel' ? 'active' : ''"
            @click="set({ source: 'parallel' })"
          >
            Parallel-Slalom
          </button>
        </div>
      </div>
      <div class="field" style="width: 120px">
        <label>Startwert</label>
        <input class="input" type="number" min="1" :value="rn.start" @input="onStart" />
      </div>
      <div class="field" style="flex: 1; min-width: 220px">
        <label>Fehlende Nummern überspringen</label>
        <input
          class="input"
          :value="rn.skipText"
          placeholder="z. B. 7, 13, 20"
          @input="set({ skipText: ($event.target as HTMLInputElement).value })"
        />
      </div>
    </div>
  </div>
</template>
