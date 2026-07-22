import { createApp } from 'vue'
import { createStore, storeKey } from './state/store'
import App from './App.vue'
import './styles.css'

createApp(App).provide(storeKey, createStore()).mount('#root')
