<script setup lang="ts">
import { useStore } from '../state/store'

const { state, dispatch } = useStore()

function onName(e: Event) {
  dispatch({
    type: 'SET_EVENT',
    eventName: (e.target as HTMLInputElement).value,
    eventJahr: state.value.eventJahr,
  })
}

function onJahr(e: Event) {
  dispatch({
    type: 'SET_EVENT',
    eventName: state.value.eventName,
    eventJahr: parseInt((e.target as HTMLInputElement).value, 10) || state.value.eventJahr,
  })
}
</script>

<template>
  <div class="panel">
    <h2>Veranstaltung</h2>
    <div class="row">
      <div class="field" style="flex: 2; min-width: 200px">
        <label>Name</label>
        <input class="input" :value="state.eventName" @input="onName" />
      </div>
      <div class="field" style="width: 120px">
        <label>Jahr</label>
        <input class="input" type="number" :value="state.eventJahr" @input="onJahr" />
      </div>
      <div class="field">
        <label>Herkunft neuer Teilnehmer</label>
        <div class="segmented">
          <button
            :class="state.originMode === 'verein' ? 'active' : ''"
            type="button"
            @click="dispatch({ type: 'SET_ORIGIN_MODE', originMode: 'verein' })"
          >
            Vereine
          </button>
          <button
            :class="state.originMode === 'bundesland' ? 'active' : ''"
            type="button"
            @click="dispatch({ type: 'SET_ORIGIN_MODE', originMode: 'bundesland' })"
          >
            Bundesländer
          </button>
        </div>
      </div>
    </div>
    <p class="note">
      Das Jahr bestimmt die Altersberechnung neu erzeugter Starter. Bereits generierte Geburtsdaten
      bleiben unverändert.
    </p>
  </div>
</template>
