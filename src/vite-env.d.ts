/// <reference types="vite/client" />

declare module '*.css'

// vuedraggable v4 liefert keine eigenen Typdefinitionen mit.
declare module 'vuedraggable' {
  import type { DefineComponent } from 'vue'
  const draggable: DefineComponent<Record<string, unknown>>
  export default draggable
}
