<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from '../state/store'
import { ageHint, getClass } from '../lib/classes'
import { SIZES } from '../lib/sizes'
import StartNr from './StartNr.vue'
import ManualAddForm from './ManualAddForm.vue'
import type { ClassId, Participant } from '../types'

const props = defineProps<{
  classId: ClassId
  starters: Participant[]
  running: Map<string, number> | null
  open: boolean
}>()

const emit = defineEmits<{
  toggle: []
  generate: [count: number]
  clear: []
  remove: [id: string]
  add: [p: Participant]
}>()

const { state, dispatch } = useStore()
const def = computed(() => getClass(props.classId))
const count = ref(3)
const showAdd = ref(false)
const editNr = ref(false)

function formatDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso || '–'
}

// Doppelt vergebene Startnummern in dieser Klasse (für die Warnmarkierung).
const duplicates = computed(() => {
  const seen = new Map<string, number>()
  for (const p of props.starters) seen.set(p.startNr, (seen.get(p.startNr) ?? 0) + 1)
  return new Set([...seen].filter(([, n]) => n > 1).map(([nr]) => nr))
})

function onCount(e: Event) {
  count.value = Math.max(1, Math.min(99, parseInt((e.target as HTMLInputElement).value, 10) || 1))
}

function toggleEditNr() {
  const next = !editNr.value
  editNr.value = next
  if (next && !props.open) emit('toggle')
}

function clearAll() {
  if (confirm(`Alle ${props.starters.length} Starter in ${def.value.label} entfernen?`)) emit('clear')
}
</script>

<template>
  <div class="class-section">
    <div class="class-header" @click="emit('toggle')">
      <span class="class-badge" :style="{ background: def.color }">{{ classId }}</span>
      <span class="title">{{ def.label }}</span>
      <span class="count">{{ starters.length }} Starter · {{ ageHint(classId, state.eventJahr) }}</span>
      <span class="spacer" />
      <div class="class-tools" @click.stop>
        <input type="number" min="1" max="99" :value="count" title="Anzahl zu generieren" @input="onCount" />
        <button class="btn sm primary" @click="emit('generate', count)">+ Generieren</button>
        <button class="btn sm" @click="showAdd = !showAdd">Manuell</button>
        <button
          :class="['btn', 'sm', editNr ? 'primary' : '']"
          :disabled="starters.length === 0"
          title="Startnummern bearbeiten: verschieben und Nummer ändern"
          @click="toggleEditNr"
        >
          ✎ Nummern
        </button>
        <button
          class="btn sm"
          :disabled="starters.length === 0"
          title="Startnummern nach Größe neu vergeben (klein → groß)"
          @click="dispatch({ type: 'RENUMBER_CLASS_BY_SIZE', klasse: classId })"
        >
          ↕ Größe
        </button>
        <button class="btn sm danger" :disabled="starters.length === 0" @click="clearAll">
          Leeren
        </button>
        <span style="color: var(--muted); font-size: 12px; width: 16px; text-align: center">
          {{ open ? '▾' : '▸' }}
        </span>
      </div>
    </div>

    <ManualAddForm
      v-if="showAdd"
      :class-id="classId"
      :existing="starters"
      @add="(p) => emit('add', p)"
      @done="showAdd = false"
    />

    <template v-if="open">
      <div v-if="starters.length === 0" class="empty">Noch keine Starter in dieser Klasse.</div>
      <table v-else class="starters">
        <thead>
          <tr>
            <th :style="{ width: editNr ? '150px' : '64px' }">{{ running ? 'Start-Nr.' : 'S-Nr.' }}</th>
            <th>Name</th>
            <th>Vorname</th>
            <th>{{ state.originMode === 'bundesland' ? 'Bundesland' : 'Verein' }}</th>
            <th style="width: 56px">Größe</th>
            <th style="width: 100px">Geb.-Datum</th>
            <th style="width: 40px" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in starters" :key="p.id">
            <td class="num">
              <div v-if="editNr" class="nr-edit">
                <input
                  class="nr-input"
                  :value="p.startNr"
                  :aria-invalid="duplicates.has(p.startNr)"
                  :title="duplicates.has(p.startNr) ? 'Startnummer doppelt vergeben' : 'Startnummer ändern'"
                  @input="
                    dispatch({
                      type: 'SET_START_NR',
                      id: p.id,
                      startNr: ($event.target as HTMLInputElement).value,
                    })
                  "
                />
                <span class="nr-moves">
                  <button
                    class="mv"
                    :disabled="i === 0"
                    title="An den Anfang"
                    @click="dispatch({ type: 'MOVE_STARTER', id: p.id, target: 'first' })"
                  >
                    ⤒
                  </button>
                  <button
                    class="mv"
                    :disabled="i === 0"
                    title="Eins nach oben"
                    @click="dispatch({ type: 'MOVE_STARTER', id: p.id, target: 'up' })"
                  >
                    ▲
                  </button>
                  <button
                    class="mv"
                    :disabled="i === starters.length - 1"
                    title="Eins nach unten"
                    @click="dispatch({ type: 'MOVE_STARTER', id: p.id, target: 'down' })"
                  >
                    ▼
                  </button>
                  <button
                    class="mv"
                    :disabled="i === starters.length - 1"
                    title="Ans Ende"
                    @click="dispatch({ type: 'MOVE_STARTER', id: p.id, target: 'last' })"
                  >
                    ⤓
                  </button>
                </span>
              </div>
              <StartNr v-else :start-nr="p.startNr" :run-nr="running?.get(p.id)" />
            </td>
            <td>{{ p.nachname }}</td>
            <td>{{ p.vorname }}</td>
            <td>{{ state.originMode === 'bundesland' ? p.bundesland : p.verein || p.bundesland }}</td>
            <td>
              <select
                v-if="editNr"
                class="size-select"
                :value="SIZES.includes(p.groesse as (typeof SIZES)[number]) ? p.groesse : ''"
                @change="
                  dispatch({
                    type: 'UPDATE_PARTICIPANT',
                    id: p.id,
                    patch: { groesse: ($event.target as HTMLSelectElement).value },
                  })
                "
              >
                <option value="">–</option>
                <option v-for="s in SIZES" :key="s" :value="s">{{ s }}</option>
              </select>
              <template v-else>{{ p.groesse || '–' }}</template>
            </td>
            <td>{{ formatDate(p.geburtsdatum) }}</td>
            <td>
              <button class="del" title="Entfernen" @click="emit('remove', p.id)">×</button>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>
