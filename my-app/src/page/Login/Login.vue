<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { LoadingOutlined, LockOutlined, UserOutlined } from '@ant-design/icons-vue'
import Logo from '../../assets/Logo.png'
import { useThemeStore } from '../../store/ThemeStore'
import { useAuthStore } from '../../store/login'
import { login } from '../../api/user'

const themeStore = useThemeStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const formState = reactive({ username: '', password: '' })

async function handleLogin() {
  if (!formState.username.trim()) return message.warning('请输入用户名')
  if (!formState.password) return message.warning('请输入密码')
  loading.value = true
  try {
    const response: any = await login({
      username: formState.username.trim(),
      password: formState.password,
    })
    const { token, username, btnAuth } = response.data
    authStore.setToken(token)
    sessionStorage.setItem('username', username)
    sessionStorage.setItem('btnAuth', JSON.stringify(btnAuth))
    message.success('登录成功，正在进入工作台…')
    const redirect = (route.query.redirect as string) || '/'
    router.replace(redirect)
  } catch {
    message.error('用户名或密码错误')
  } finally {
    loading.value = false
  }
}

function fillDemo() {
  formState.username = 'hk'
  formState.password = '12345678'
}
</script>

<template>
  <div class="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <!-- 主题切换：固定在右上 -->
    <button
      type="button"
      aria-label="切换主题"
      @click="themeStore.toggleTheme()"
      class="absolute top-5 right-5 z-20 inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur text-slate-500 dark:text-slate-300 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-500 transition-colors cursor-pointer"
    >
      <svg
        v-if="themeStore.theme === 'dark'"
        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.7" stroke="currentColor" class="w-5 h-5"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.7" stroke="currentColor" class="w-5 h-5"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    </button>

    <!-- 左：品牌叙事区（桌面端显示） -->
    <aside class="hidden lg:flex lg:w-[46%] xl:w-1/2 relative overflow-hidden bg-slate-950 text-white flex-col justify-between px-14 py-16">
      <!-- 光斑背景 -->
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-600/30 blur-3xl"></div>
        <div class="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-violet-600/25 blur-3xl"></div>
        <div class="absolute top-1/3 left-1/2 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl"></div>
      </div>

      <!-- 品牌 -->
      <div class="relative flex items-center gap-3">
        <img :src="Logo" class="w-11 h-11 rounded-xl" alt="智链采 Z-Link" />
        <span class="text-xl font-semibold tracking-tight">智链采 Z-Link</span>
      </div>

      <!-- 价值主张 -->
      <div class="relative">
        <p class="text-sm font-medium tracking-widest text-blue-300/80 uppercase mb-5">智能制造供应链 · 供需匹配平台</p>
        <h1 class="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
          让每一次采购<br />都精准匹配到<br />最合适的供应商
        </h1>
        <p class="mt-6 text-lg text-slate-300/90 leading-relaxed max-w-md">
          AI 理解你的需求，从认证供应商库中智能寻源、匹配与协同，让工业采购更高效、更可靠。
        </p>

        <!-- 信任点 -->
        <ul class="mt-10 space-y-4">
          <li class="flex items-start gap-3">
            <span class="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" /></svg>
            </span>
            <div>
              <div class="font-medium">认证供应商库</div>
              <div class="text-sm text-slate-400">全链路资质审核，合作可信赖</div>
            </div>
          </li>
          <li class="flex items-start gap-3">
            <span class="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" /></svg>
            </span>
            <div>
              <div class="font-medium">AI 智能匹配</div>
              <div class="text-sm text-slate-400">语义理解需求，推荐最优厂家</div>
            </div>
          </li>
          <li class="flex items-start gap-3">
            <span class="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3.5 h-3.5"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" /></svg>
            </span>
            <div>
              <div class="font-medium">全流程协同</div>
              <div class="text-sm text-slate-400">从需求发布到交付，一站式跟进</div>
            </div>
          </li>
        </ul>
      </div>

      <!-- 底部 -->
      <p class="relative text-sm text-slate-500">© 2026 智链采 Z-Link · 让工业供应链更高效</p>
    </aside>

    <!-- 右：登录表单区 -->
    <main class="flex-1 flex items-center justify-center px-6 py-12 relative">
      <div class="w-full max-w-md">
        <!-- 移动端 logo -->
        <div class="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
          <img :src="Logo" class="w-10 h-10 rounded-xl" alt="智链采 Z-Link" />
          <span class="text-lg font-semibold">智链采 Z-Link</span>
        </div>

        <h2 class="text-3xl font-bold tracking-tight">欢迎回来</h2>
        <p class="mt-2 text-slate-500 dark:text-slate-400">登录智链采，进入智能采购工作台</p>

        <form class="mt-9 space-y-5" @submit.prevent="handleLogin">
          <!-- 用户名 -->
          <div>
            <label for="username" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">用户名</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-4 flex items-center text-slate-400">
                <UserOutlined class="text-base" />
              </span>
              <input
                id="username"
                v-model="formState.username"
                type="text"
                autocomplete="username"
                placeholder="请输入用户名"
                class="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 transition-shadow"
              />
            </div>
          </div>

          <!-- 密码 -->
          <div>
            <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">密码</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-4 flex items-center text-slate-400">
                <LockOutlined class="text-base" />
              </span>
              <input
                id="password"
                v-model="formState.password"
                type="password"
                autocomplete="current-password"
                placeholder="请输入密码"
                class="w-full h-12 pl-11 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-blue-500 transition-shadow"
              />
            </div>
          </div>

          <!-- 登录按钮 -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full h-12 rounded-xl bg-linear-to-r from-blue-600 to-violet-600 text-white font-medium text-base shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:opacity-95 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LoadingOutlined v-if="loading" />
            {{ loading ? '登录中…' : '登录' }}
          </button>
        </form>

        <!-- 演示账号 -->
        <div class="mt-7 flex items-center justify-between gap-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-4 py-3">
          <div class="text-sm text-blue-700 dark:text-blue-300">
            <span class="font-medium">演示账号</span>
            <span class="text-blue-500/70 dark:text-blue-300/70"> hk / 12345678</span>
          </div>
          <button
            type="button"
            @click="fillDemo"
            class="shrink-0 text-xs font-medium text-blue-600 dark:text-blue-300 hover:underline cursor-pointer"
          >
            一键填入
          </button>
        </div>
      </div>
    </main>
  </div>
</template>