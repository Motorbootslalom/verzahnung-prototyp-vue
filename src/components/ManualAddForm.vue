<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from '../state/store'
import { birthYearRange } from '../lib/classes'
import { SIZES } from '../lib/sizes'
import type { ClassId, Participant } from '../types'

const props = defineProps<{
  classId: ClassId
  existing: Participant[]
}>()

const emit = defineEmits<{
  add: [p: Participant]
  done: []
}>()

const { state } = useStore()
const range = computed(() => birthYearRange(props.classId, state.value.eventJahr))
const vorname = ref('')
const nachname = ref('')
const herkunft = ref('')
const geb = ref(`${range.value[0]}-06-15`)
const groesse = ref('')

function nextStartNr(): string {
  let max = 0
  for (const p of props.existing) {
    const num = parseInt(p.startNr.slice(props.classId.length), 10)
    if (!Number.isNaN(num) && num > max) max = num
  }
  return props.classId + (max + 1).toString().padStart(2, '0')
}

function submit() {
  if (!vorname.value.trim() || !nachname.value.trim()) return
  const isBundesland = state.value.originMode === 'bundesland'
  emit('add', {
    id: 'p_' + Math.random().toString(36).slice(2, 10),
    startNr: nextStartNr(),
    vorname: vorname.value.trim(),
    nachname: nachname.value.trim(),
    verein: isBundesland ? '' : herkunft.value.trim(),
    bundesland: herkunft.value.trim(),
    geburtsdatum: geb.value,
    klasse: props.classId,
    groesse: groesse.value,
  })
  vorname.value = ''
  nachname.value = ''
  herkunft.value = ''
  groesse.value = ''
  emit('done')
}
</script>

<template>
  <div class="panel" style="margin: 8px 0; background: var(--panel-2)">
    <div class="row">
      <div class="field" style="flex: 1; min-width: 120px">
        <label>Vorname</label>
        <input class="input" v-model="vorname" />
      </div>
      <div class="field" style="flex: 1; min-width: 120px">
        <label>Nachname</label>
        <input class="input" v-model="nachname" />
      </div>
      <div class="field" style="flex: 2; min-width: 160px">
        <label>{{ state.originMode === 'bundesland' ? 'Bundesland' : 'Verein' }}</label>
        <input class="input" v-model="herkunft" />
      </div>
      <div class="field" style="width: 150px">
        <label>Geb.-Datum (Jg. {{ range[0] }}–{{ range[1] }})</label>
        <input
          class="input"
          type="date"
          :min="`${range[0]}-01-01`"
          :max="`${range[1]}-12-31`"
          v-model="geb"
        />
      </div>
      <div class="field" style="width: 80px">
        <label>Größe</label>
        <select class="input" v-model="groesse">
          <option value="">–</option>
          <option v-for="s in SIZES" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <button class="btn primary" :disabled="!vorname.trim() || !nachname.trim()" @click="submit">
        Hinzufügen
      </button>
    </div>
  </div>
</template>
