<script setup lang="ts">
import type { PauseItem } from '../types'

/** Pausen-Block innerhalb einer Spur (Versatz um `length` Takte). */
defineProps<{ item: PauseItem }>()

const emit = defineEmits<{
  length: [length: number]
  remove: []
}>()
</script>

<template>
  <div class="pause-chip">
    <span class="handle drag-handle" title="Pause verschieben">⏸ Pause</span>
    <button
      class="len"
      :disabled="item.length <= 1"
      title="Kürzer"
      @click="emit('length', Math.max(1, item.length - 1))"
    >
      −
    </button>
    <span class="len-val" title="Takte, die die Spur aussetzt">{{ item.length }}</span>
    <button class="len" title="Länger" @click="emit('length', Math.min(20, item.length + 1))">
      +
    </button>
    <button class="rm" title="Pause entfernen" @click="emit('remove')">×</button>
  </div>
</template>
