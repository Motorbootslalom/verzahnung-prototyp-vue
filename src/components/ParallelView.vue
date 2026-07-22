<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '../state/store'
import { buildParallelPlan, type ParallelOptions } from '../lib/parallel'
import { canonicalRunningNumbers } from '../lib/running'
import RunningNumberControls from './RunningNumberControls.vue'
import ParallelExportPanel from './ParallelExportPanel.vue'
import HeatTable from './HeatTable.vue'

const { state, dispatch } = useStore()

const opts = computed<ParallelOptions>(() => ({
  international: state.value.parallelInternational,
  class4Small: state.value.class4Small,
  orderByStartNr: state.value.parallelOrderByStartNr,
}))

// Kanonische klassische Startnummern (einheitliche Quelle) – dieselben Nummern
// wie in der Teilnehmer-Liste; dienen zugleich als Sortierschlüssel „nach
// Startnummer".
const runningMap = computed(() => canonicalRunningNumbers(state.value))

const plan = computed(() =>
  buildParallelPlan(state.value.participants, opts.value, runningMap.value ?? undefined),
)

const kleinLine = computed(
  () => `${plan.value.kleinStarter} Starter` + (plan.value.kleinDummy ? ' + 1 Dummy' : ''),
)
const grossLine = computed(
  () => `${plan.value.grossStarter} Starter` + (plan.value.grossDummy ? ' + 1 Dummy' : ''),
)
</script>

<template>
  <div class="panel">
    <h2>Parallel-Slalom</h2>
    <p class="hint">
      Zwei parallele Parcours (A und B). Je Lauf fahren zwei Starter <b>gleichen Bootstyps</b>
      gegeneinander auf Zeit. Die Klasse bestimmt nur den Bootstyp und zählt fürs Ergebnis –
      ansonsten kann z.&nbsp;B. Klasse&nbsp;E gegen Klasse&nbsp;3 fahren (beide kleines Boot).
      Paare werden in Startreihenfolge gebildet, jedes Paar fährt zweimal (2.&nbsp;Lauf mit
      getauschten Parcours). Verzahnung: Bootstyp abwechselnd – ein Block umfasst 4 Starter.
    </p>

    <div class="parallel-controls">
      <label class="boat-check">
        <input
          type="checkbox"
          :checked="state.parallelInternational"
          @change="
            dispatch({
              type: 'SET_PARALLEL_INTERNATIONAL',
              parallelInternational: ($event.target as HTMLInputElement).checked,
            })
          "
        />
        International (nur bis Klasse&nbsp;5, Klasse&nbsp;E = „Dolphin")
      </label>
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
        Klasse&nbsp;4 fährt mit kleinem Boot
      </label>
      <label
        class="boat-check"
        title="Sortiert innerhalb jedes Bootstyps nach (klassischer) Startnummer statt nach Klasse – z. B. wenn das Manövrieren mit Klasse 3 beginnt."
      >
        <input
          type="checkbox"
          :checked="state.parallelOrderByStartNr"
          @change="
            dispatch({
              type: 'SET_PARALLEL_ORDER_BY_STARTNR',
              value: ($event.target as HTMLInputElement).checked,
            })
          "
        />
        Reihenfolge nach Startnummer (statt Klasse)
      </label>
    </div>

    <div class="parallel-stats">
      <span class="pstat">
        <span class="dot" style="background: #0ea5e9" /> Kleine Boote: <b>{{ kleinLine }}</b>
      </span>
      <span class="pstat">
        <span class="dot" style="background: #f97316" /> Große Boote: <b>{{ grossLine }}</b>
      </span>
      <span class="pstat">
        {{ plan.heats.length }} Läufe · {{ plan.pairs }} Paare · {{ plan.blocks }} Blöcke
      </span>
    </div>
  </div>

  <ParallelExportPanel :plan="plan" :opts="opts" :running="runningMap" />

  <RunningNumberControls />

  <div class="panel">
    <HeatTable :heats="plan.heats" :international="opts.international" :running="runningMap" />
  </div>
</template>
