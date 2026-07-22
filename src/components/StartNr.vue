<script setup lang="ts">
/**
 * Startnummer-Anzeige. Ist eine klassische (Verzahnungs-)Nummer vorhanden, wird
 * sie als **primäre** Startnummer gezeigt; die klassenbasierte Nummer (E01, 312 …)
 * erscheint klein/sekundär darunter. Ohne klassische Nummer wird die
 * klassenbasierte Nummer normal angezeigt.
 */
defineProps<{ startNr: string; runNr?: number }>()
</script>

<template>
  <span v-if="runNr === undefined" class="num">{{ startNr }}</span>
  <span v-else class="startnr-combo">
    <span class="startnr-main">{{ runNr }}</span>
    <span class="startnr-sub">{{ startNr }}</span>
  </span>
</template>
