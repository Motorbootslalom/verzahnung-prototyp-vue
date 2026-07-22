<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from '../state/store'
import { CLASSES } from '../lib/classes'
import { canonicalRunningNumbers } from '../lib/running'
import { sortedByStartNr } from '../lib/startnumbers'
import RunningNumberControls from './RunningNumberControls.vue'
import ExcelPanel from './ExcelPanel.vue'
import SettingsPanel from './SettingsPanel.vue'
import ClassSection from './ClassSection.vue'
import type { ClassId, Participant } from '../types'

const { state, dispatch } = useStore()
const expanded = ref<Set<ClassId>>(new Set())

const byClass = computed(() => {
  const m = new Map<ClassId, Participant[]>()
  for (const c of CLASSES) m.set(c.id, [])
  for (const p of state.value.participants) m.get(p.klasse)!.push(p)
  for (const [k, list] of m) m.set(k, sortedByStartNr(list))
  return m
})

function toggle(id: ClassId) {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

// Kanonische klassische Startnummern (aus der Manövrier-Verzahnung), damit die
// Teilnehmer-Liste dieselben Nummern zeigt wie die Verzahnungs-Ansichten.
const running = computed(() => canonicalRunningNumbers(state.value))
</script>

<template>
  <SettingsPanel />
  <ExcelPanel />
  <RunningNumberControls />
  <div class="panel">
    <h2>Teilnehmer verwalten</h2>
    <p class="hint">
      Pro Klasse Teilnehmer generieren, manuell hinzufügen oder entfernen. Herkunft (Verein /
      Bundesland) richtet sich nach der Einstellung oben.
    </p>
    <ClassSection
      v-for="c in CLASSES"
      :key="c.id"
      :class-id="c.id"
      :starters="byClass.get(c.id)!"
      :running="running"
      :open="expanded.has(c.id)"
      @toggle="toggle(c.id)"
      @generate="(count: number) => dispatch({ type: 'GENERATE', klasse: c.id, count })"
      @clear="dispatch({ type: 'CLEAR_CLASS', klasse: c.id })"
      @remove="(id: string) => dispatch({ type: 'REMOVE_PARTICIPANT', id })"
      @add="(p: Participant) => dispatch({ type: 'ADD_PARTICIPANT', participant: p })"
    />
  </div>
</template>
