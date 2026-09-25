/// <reference types="vite/client" />

/** Zeitpunkt des Builds – wird von Vite eingesetzt (siehe vite.config.ts). */
declare const __BUILD_TIME__: string
/** Kurze ID und Zeitpunkt des letzten Commits – ebenfalls aus vite.config.ts. */
declare const __BUILD_COMMIT__: string
declare const __BUILD_COMMIT_TIME__: string

declare module '*.css'

// vuedraggable v4 liefert keine eigenen Typdefinitionen mit.
declare module 'vuedraggable' {
  import type { DefineComponent } from 'vue'
  const draggable: DefineComponent<Record<string, unknown>>
  export default draggable
}
