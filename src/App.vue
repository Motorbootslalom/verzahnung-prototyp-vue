<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useStore } from './state/store'
import TopBar from './components/TopBar.vue'
import SetupScreen from './components/SetupScreen.vue'
import ParticipantsView from './components/ParticipantsView.vue'
import VerzahnungView from './components/VerzahnungView.vue'
import ParallelView from './components/ParallelView.vue'
import { parseUrlConfig } from './lib/urlconfig'

type Tab = 'teilnehmer' | 'verzahnung' | 'parallel'

const { state, dispatch } = useStore()
const tab = ref<Tab>('teilnehmer')

// Konfiguration aus URL-Parametern übernehmen (Klassenverteilung, Parcours,
// Faktoren). Erzeugt das Starterfeld neu und entfernt danach die Parameter,
// damit ein Reload nicht erneut würfelt.
onMounted(() => {
  const cfg = parseUrlConfig(window.location.search)
  if (!cfg) return
  dispatch({
    type: 'INIT_SETUP',
    eventName: cfg.eventName ?? state.value.eventName,
    eventJahr: cfg.eventJahr ?? state.value.eventJahr,
    originMode: cfg.originMode ?? state.value.originMode,
    counts: cfg.counts,
    parcoursConfig: cfg.parcours.length > 0 ? cfg.parcours : undefined,
    boats: cfg.boats,
    class4Small: cfg.class4Small,
  })
  tab.value = 'verzahnung'
  window.history.replaceState(null, '', window.location.pathname)
})

function resetAll() {
  if (confirm('Alle Teilnehmer und Einstellungen zurücksetzen?')) dispatch({ type: 'RESET_ALL' })
}
</script>

<template>
  <div v-if="!state.initialized" class="app">
    <TopBar />
    <SetupScreen />
  </div>
  <div v-else class="app">
    <TopBar />
    <div class="tabs">
      <button :class="['tab', tab === 'teilnehmer' ? 'active' : '']" @click="tab = 'teilnehmer'">
        Teilnehmer
      </button>
      <button :class="['tab', tab === 'verzahnung' ? 'active' : '']" @click="tab = 'verzahnung'">
        Verzahnung
      </button>
      <button :class="['tab', tab === 'parallel' ? 'active' : '']" @click="tab = 'parallel'">
        Parallel-Slalom
      </button>
      <div style="flex: 1" />
      <button class="btn ghost sm" @click="resetAll">Zurücksetzen</button>
    </div>

    <ParticipantsView v-if="tab === 'teilnehmer'" />
    <VerzahnungView v-if="tab === 'verzahnung'" />
    <ParallelView v-if="tab === 'parallel'" />
  </div>
</template>
