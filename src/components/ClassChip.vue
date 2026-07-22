<script setup lang="ts">
import { classColor } from '../lib/classes'
import type { ClassId } from '../types'

/** Klassen-Block innerhalb einer Spur (per Drag&Drop verschiebbar). */
defineProps<{ classId: ClassId; count: number }>()
</script>

<template>
  <div class="class-chip drag-handle" :style="{ background: classColor(classId) }">
    <span>Klasse {{ classId }}</span>
    <span class="cnt">{{ count }}</span>
  </div>
</template>
