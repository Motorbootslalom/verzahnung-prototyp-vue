<script setup lang="ts">
import draggable from 'vuedraggable'
import type { ClassId, TrackItem } from '../types'
import { itemDragId } from '../lib/verzahnung'
import ClassChip from './ClassChip.vue'
import PauseChip from './PauseChip.vue'

/**
 * Eine Spur der Verzahnung – Ablagefläche für Klassen- und Pausen-Blöcke.
 * `items` wird von vuedraggable in-place mutiert; nach jeder Änderung meldet
 * `change` dem Parent, dass der Stand persistiert werden soll.
 */
defineProps<{
  index: number
  items: TrackItem[]
  counts: Map<ClassId, number>
  total: number
  group: string
}>()

const emit = defineEmits<{
  change: []
  addPause: []
  pauseLength: [pauseId: string, length: number]
  pauseRemove: [pauseId: string]
}>()
</script>

<template>
  <div class="track">
    <div class="track-label">
      <span>Spur {{ String.fromCharCode(65 + index) }}</span>
      <span>
        {{ total }} Starter
        <button class="add-pause" title="Pause zu dieser Spur hinzufügen" @click="emit('addPause')">
          + Pause
        </button>
      </span>
    </div>
    <draggable
      class="track-blocks"
      :list="items"
      :group="group"
      :item-key="itemDragId"
      handle=".drag-handle"
      ghost-class="dragging"
      :animation="150"
      @change="emit('change')"
    >
      <template #item="{ element }">
        <ClassChip
          v-if="element.kind === 'class'"
          :class-id="element.klasse"
          :count="counts.get(element.klasse) ?? 0"
        />
        <PauseChip
          v-else
          :item="element"
          @length="(len: number) => emit('pauseLength', element.id, len)"
          @remove="emit('pauseRemove', element.id)"
        />
      </template>
      <template #footer>
        <span v-if="items.length === 0" style="color: var(--muted); font-size: 12px">
          Klasse hierher ziehen…
        </span>
      </template>
    </draggable>
  </div>
</template>
