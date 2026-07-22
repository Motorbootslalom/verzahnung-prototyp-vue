<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStore } from '../state/store'
import { CLASSES } from '../lib/classes'
import { classCounts } from '../lib/verzahnung'
import type { ParcoursPlan } from '../lib/plan'
import type { ClassId, Parcours, TrackItem, WechselFaktor } from '../types'
import TrackContainer from './TrackContainer.vue'
import FlowPreview from './FlowPreview.vue'
import SequenceTable from './SequenceTable.vue'

const FACTOR_HINTS: Record<WechselFaktor, string> = {
  1: 'Keine Verzahnung – Klassen laufen in Blöcken nacheinander.',
  2: 'Zwei Spuren im Wechsel: A, B, A, B …',
  3: 'Drei Spuren im Wechsel: A, B, C, A, B, C …',
  4: 'Vier Spuren im Wechsel: A, B, C, D, A, B, C, D …',
}

const FACTORS: WechselFaktor[] = [1, 2, 3, 4]

function newPause(): TrackItem {
  return { kind: 'pause', id: 'pause_' + Math.random().toString(36).slice(2, 9), length: 1 }
}

const props = defineProps<{
  parcours: Parcours
  plan: ParcoursPlan
  running: Map<string, number> | null
}>()

const { state, dispatch } = useStore()

const filtered = computed(() =>
  state.value.participants.filter((p) => props.parcours.classIds.includes(p.klasse)),
)
const counts = computed(() => classCounts(filtered.value))

// Boot-beschränkte Anordnung (tracks/sequence/manual) kommt aus dem Plan.
const signature = computed(() => JSON.stringify(props.plan.tracks))

// Lokale Arbeitskopie der Spuren – vuedraggable mutiert sie in-place.
const containers = ref<TrackItem[][]>(props.plan.tracks.map((t) => [...t]))

// Bei Änderung von Klassen/Faktor/Startern/Pausen/Booten die Spuren neu übernehmen.
watch(signature, () => {
  containers.value = props.plan.tracks.map((t) => [...t])
})

function persist() {
  dispatch({
    type: 'SET_PARCOURS_TRACKS',
    id: props.parcours.id,
    tracks: containers.value.map((t) => [...t]),
  })
}

function addPause(trackIndex: number) {
  containers.value[trackIndex].push(newPause())
  persist()
}

function setPauseLength(pauseId: string, length: number) {
  containers.value = containers.value.map((track) =>
    track.map((it) => (it.kind === 'pause' && it.id === pauseId ? { ...it, length } : it)),
  )
  persist()
}

function removePause(pauseId: string) {
  containers.value = containers.value.map((track) =>
    track.filter((it) => !(it.kind === 'pause' && it.id === pauseId)),
  )
  persist()
}

function toggleClass(id: ClassId) {
  const has = props.parcours.classIds.includes(id)
  const next = has
    ? props.parcours.classIds.filter((c) => c !== id)
    : [...props.parcours.classIds, id]
  dispatch({ type: 'SET_PARCOURS_CLASSES', id: props.parcours.id, classIds: next })
}

const trackTotal = (track: TrackItem[]) =>
  track.reduce((s, it) => s + (it.kind === 'class' ? counts.value.get(it.klasse) ?? 0 : 0), 0)

const hasPauses = computed(() => containers.value.some((t) => t.some((i) => i.kind === 'pause')))

function starterCount(id: ClassId): number {
  return state.value.participants.filter((p) => p.klasse === id).length
}

function removeParcours() {
  if (confirm(`Parcours „${props.parcours.name}“ entfernen?`))
    dispatch({ type: 'REMOVE_PARCOURS', id: props.parcours.id })
}
</script>

<template>
  <div class="parcours">
    <div class="parcours-head">
      <input
        class="pname"
        :value="parcours.name"
        @input="
          dispatch({
            type: 'RENAME_PARCOURS',
            id: parcours.id,
            name: ($event.target as HTMLInputElement).value,
          })
        "
      />
      <div class="field" style="width: auto">
        <div class="segmented">
          <button
            v-for="f in FACTORS"
            :key="f"
            :class="parcours.wechselFaktor === f ? 'active' : ''"
            :title="FACTOR_HINTS[f]"
            @click="dispatch({ type: 'SET_PARCOURS_FACTOR', id: parcours.id, wechselFaktor: f })"
          >
            {{ f }}er
          </button>
        </div>
      </div>
      <span class="spacer" style="flex: 1" />
      <button
        v-if="plan.manual || hasPauses"
        class="btn sm ghost"
        title="Automatische Verteilung wiederherstellen (entfernt auch Pausen)"
        @click="dispatch({ type: 'RESET_TRACKS', id: parcours.id })"
      >
        ↺ Auto
      </button>
      <button class="btn sm danger" @click="removeParcours">Entfernen</button>
    </div>

    <div style="padding: 12px 16px 0">
      <div class="subhead">Klassen auf diesem Parcours · Wechsel {{ parcours.wechselFaktor }}er</div>
      <div class="classes-picker">
        <button
          v-for="c in CLASSES"
          :key="c.id"
          :class="['class-toggle', parcours.classIds.includes(c.id) ? 'on' : '']"
          :style="
            parcours.classIds.includes(c.id)
              ? { background: c.color, borderColor: c.color }
              : undefined
          "
          :title="`${c.label} · ${starterCount(c.id)} Starter`"
          @click="toggleClass(c.id)"
        >
          {{ c.id }} <span style="opacity: 0.8; font-weight: 600">· {{ starterCount(c.id) }}</span>
        </button>
      </div>
      <p class="note">
        {{ FACTOR_HINTS[parcours.wechselFaktor] }} · Bootbedarf: {{ plan.demand.klein }}× klein ·
        {{ plan.demand.gross }}× groß
        <span
          v-if="!plan.manual && plan.constrained && plan.effectiveTracks < parcours.wechselFaktor"
          style="color: var(--danger)"
        >
          · ⚠ wegen Booten auf {{ plan.effectiveTracks }} Spur{{
            plan.effectiveTracks === 1 ? '' : 'en'
          }}
          reduziert
        </span>
      </p>
    </div>

    <div class="parcours-body">
      <div class="tracks-area">
        <div class="subhead">Spuren (Drag&amp;Drop · Klassen &amp; Pausen)</div>
        <div v-if="filtered.length === 0" class="empty">
          Keine Starter – Klassen oben auswählen bzw. Teilnehmer anlegen.
        </div>
        <template v-else>
          <TrackContainer
            v-for="(track, i) in containers"
            :key="`${parcours.id}::track::${i}`"
            :index="i"
            :items="track"
            :counts="counts"
            :total="trackTotal(track)"
            :group="parcours.id"
            @change="persist"
            @add-pause="addPause(i)"
            @pause-length="setPauseLength"
            @pause-remove="removePause"
          />
        </template>
        <FlowPreview :sequence="plan.sequence" />
      </div>

      <div class="sequence-area">
        <div class="subhead">Verzahnte Startreihenfolge · {{ plan.sequence.length }} Starter</div>
        <SequenceTable :sequence="plan.sequence" :origin-mode="state.originMode" :running="running" />
      </div>
    </div>
  </div>
</template>
