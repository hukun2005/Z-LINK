import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: (): { token: string; menuList: any[] } => ({
    token: sessionStorage.getItem('token') || '',
    menuList: [],
  }),
  actions: {
    setToken(token: string) {
      this.token = token // 将 token 储存到 pinia
      sessionStorage.setItem('token', token) // 将 token 储存到 sessionStorage
    },
    clearToken() {
      this.token = ''
      sessionStorage.removeItem('token')
    },
    setMenu(menu: any[]) {
      this.menuList = menu
    },
  },
})