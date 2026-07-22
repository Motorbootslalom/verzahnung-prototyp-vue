<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '../state/store'
import type { EventPlan } from '../lib/plan'
import type { BoatConfig } from '../types'

/**
 * Boote & Bootbedarf oberhalb der Parcours. Einstellbare Bootzahlen, der
 * Klasse-4-Umschalter und ein Hinweis, ob die Verzahnung fahrbar ist bzw.
 * wie viele Zusatzboote die optimale Verzahnung ermöglichen würden.
 */
const props = defineProps<{ plan: EventPlan }>()

const { state, dispatch } = useStore()

/** „2 kleine Boote", „1 großes Boot" … */
function boatWord(type: 'klein' | 'gross', n: number): string {
  const base = type === 'klein' ? 'klein' : 'groß'
  return n === 1 ? `${n} ${base}es Boot` : `${n} ${base}e Boote`
}

function clampBoats(v: string): number {
  return Math.max(0, Math.min(99, parseInt(v, 10) || 0))
}

const setBoats = (patch: Partial<BoatConfig>) =>
  dispatch({ type: 'SET_BOATS', boats: { ...state.value.boats, ...patch } })

const missing = computed(() => {
  const m: string[] = []
  if (props.plan.extra.klein > 0) m.push(boatWord('klein', props.plan.extra.klein))
  if (props.plan.extra.gross > 0) m.push(boatWord('gross', props.plan.extra.gross))
  return m
})
const short = computed(() => props.plan.extra.klein > 0 || props.plan.extra.gross > 0)
</script>

<template>
  <div class="panel">
    <h2>Boote</h2>
    <div class="boat-controls">
      <div class="field" style="width: 130px">
        <label>Kleine Boote (E–3)</label>
        <input
          class="input"
          type="number"
          min="0"
          max="99"
          :value="state.boats.klein"
          @input="setBoats({ klein: clampBoats(($event.target as HTMLInputElement).value) })"
        />
      </div>
      <div class="field" style="width: 130px">
        <label>Große Boote (4–7)</label>
        <input
          class="input"
          type="number"
          min="0"
          max="99"
          :value="state.boats.gross"
          @input="setBoats({ gross: clampBoats(($event.target as HTMLInputElement).value) })"
        />
      </div>
      <label class="boat-check">
        <input
          type="checkbox"
          :checked="state.class4Small"
          @change="
            dispatch({
              type: 'SET_CLASS4_SMALL',
              class4Small: ($event.target as HTMLInputElement).checked,
            })
          "
        />
        Klasse 4 fährt mit kleinem Boot
      </label>
    </div>

    <div :class="['boat-banner', short ? 'warn' : 'ok']">
      <template v-if="short">
        ⚠ Die Verzahnung ist auf den Bootbestand begrenzt. Angezeigt:
        <b>{{ plan.demand.klein }}× klein · {{ plan.demand.gross }}× groß</b>
        (vorhanden {{ state.boats.klein }}/{{ state.boats.gross }}). Mit
        <b>{{ missing.join(' und ') }}</b> zusätzlich wäre eine bessere Verzahnung möglich (optimal
        {{ plan.optimalDemand.klein }}× klein · {{ plan.optimalDemand.gross }}× groß).
      </template>
      <template v-else>
        ✓ Boote reichen für die optimale Verzahnung. Bedarf:
        <b>{{ plan.demand.klein }}× klein · {{ plan.demand.gross }}× groß</b>
        (vorhanden {{ state.boats.klein }}/{{ state.boats.gross }}).
      </template>
    </div>
  </div>
</template>
