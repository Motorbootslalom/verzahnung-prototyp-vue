<script setup lang="ts">
import { useStore } from '../state/store'

const { state } = useStore()
</script>

<template>
  <div class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        <h1>⚓ Verzahnung</h1>
        <span class="sub">Schlauchbootslalom · Prototyp</span>
      </div>
      <div class="topbar-spacer" />
      <div v-if="state.initialized" class="event-line">
        {{ state.eventName }} · {{ state.eventJahr }} · {{ state.participants.length }} Starter
      </div>
    </div>
  </div>
</template>
