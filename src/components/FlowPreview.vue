<script setup lang="ts">
import { computed } from 'vue'
import { classColor } from '../lib/classes'
import type { Participant } from '../types'

const PREVIEW_LIMIT = 100
const PREVIEW_EDGE = 50

const props = defineProps<{ sequence: Participant[] }>()

// Bis 100 alles zeigen; darüber die ersten 50 und die letzten 50 – der
// un-verzahnte End-Block ist besonders wichtig.
const truncated = computed(() => props.sequence.length > PREVIEW_LIMIT)
const head = computed(() => (truncated.value ? props.sequence.slice(0, PREVIEW_EDGE) : props.sequence))
const tail = computed(() =>
  truncated.value ? props.sequence.slice(props.sequence.length - PREVIEW_EDGE) : [],
)
const hidden = computed(() => props.sequence.length - head.value.length - tail.value.length)

const classColorOf = classColor
</script>

<template>
  <template v-if="sequence.length > 0">
    <div class="subhead" style="margin-top: 14px">
      Wechsel-Vorschau {{ truncated ? '(erste 50 & letzte 50)' : '' }}
    </div>
    <div class="flow-preview">
      <span
        v-for="(p, i) in head"
        :key="`h${i}`"
        class="fp"
        :style="{ background: classColorOf(p.klasse) }"
        :title="`#${i + 1} · ${p.startNr}`"
      >
        {{ p.klasse }}
      </span>
      <span v-if="truncated" class="fp-gap">… {{ hidden }} weitere …</span>
      <span
        v-for="(p, i) in tail"
        :key="`t${i}`"
        class="fp"
        :style="{ background: classColorOf(p.klasse) }"
        :title="`#${sequence.length - tail.length + i + 1} · ${p.startNr}`"
      >
        {{ p.klasse }}
      </span>
    </div>
  </template>
</template>
