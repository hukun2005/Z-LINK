import { defineStore } from 'pinia'

type Theme = 'light' | 'dark'

function readTheme(): Theme {
  try {
    const raw = localStorage.getItem('theme')
    if (raw) {
      const parsed = JSON.parse(raw)
      const t = parsed?.state?.theme
      if (t === 'dark' || t === 'light') return t
    }
  } catch {
    /* ignore */
  }
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export const useThemeStore = defineStore('theme', {
  state: (): { theme: Theme } => ({
    theme: readTheme(),
  }),
  actions: {
    toggleTheme() {
      const newTheme: Theme = this.theme === 'light' ? 'dark' : 'light'
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
      }
      try {
        localStorage.setItem('theme', JSON.stringify({ state: { theme: newTheme }, version: 0 }))
      } catch {
        /* ignore */
      }
      this.theme = newTheme
    },
  },
})