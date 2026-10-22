import { createPinia } from 'pinia'

export const pinia = createPinia()

export { useAuthStore } from './login/index'
export { useThemeStore } from './ThemeStore'