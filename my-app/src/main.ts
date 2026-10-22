import { createApp } from 'vue'
import './index.css'
import App from './App.vue'
import { pinia } from './store/index'
import { useThemeStore } from './store/ThemeStore'
import router from './router/router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(Antd)

// 应用持久化的主题（等价于原 zustand persist 的 onRehydrateStorage）
const themeStore = useThemeStore(pinia)
if (themeStore.theme === 'dark') {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

app.mount('#app')