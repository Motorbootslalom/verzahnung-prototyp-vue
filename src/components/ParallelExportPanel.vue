<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from '../state/store'
import { formatParallelExport, type ParallelOptions, type ParallelPlan } from '../lib/parallel'

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

const props = defineProps<{
  plan: ParallelPlan
  opts: ParallelOptions
  running: Map<string, number> | null
}>()

const { state } = useStore()
const open = ref(false)
const copied = ref(false)

const text = computed(() =>
  formatParallelExport(props.plan, props.opts, state.value.eventName, state.value.eventJahr, props.running),
)

async function copy() {
  if (await copyText(text.value)) {
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  }
}
</script>

<template>
  <div class="panel">
    <div class="export-head">
      <button class="btn ghost sm" @click="open = !open">
        {{ open ? '▾' : '▸' }} Startplan als Text
      </button>
      <span class="spacer" style="flex: 1" />
      <button class="btn sm primary" @click="copy">
        {{ copied ? '✓ Kopiert' : '📋 Startplan kopieren' }}
      </button>
    </div>
    <textarea v-if="open" class="export-text" readonly :value="text" rows="16" />
  </div>
</template>
