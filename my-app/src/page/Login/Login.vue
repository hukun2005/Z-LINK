<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LockOutlined, UserOutlined } from '@ant-design/icons-vue'
import type { FormInstance } from 'ant-design-vue'
import Container from '../../shared/Container.vue'
import Logo from '../../assets/Logo.png'
import lbdg from '../../assets/lbdg.png'
import RegisterPage from './function/RegisterPage.vue'
import LoginHero from './function/LoginHero.vue'
import Title from './function/Title.vue'
import { useThemeStore } from '../../store/ThemeStore'
import { useAuthStore } from '../../store/login'
import { login } from '../../api/user'

const themeStore = useThemeStore()
const authStore = useAuthStore()
const router = useRouter()

const isLightTheme = computed(() => themeStore.theme === 'light')

const formRef = ref<FormInstance>()
const loading = ref(false)
const formState = reactive({
  username: '',
  password: '',
})

async function handleLogin() {
  try {
    const res = await formRef.value!.validate()
    loading.value = true
    const response: any = await login(res as { username: string; password: string })
    const { token, username, btnAuth } = response.data
    loading.value = false
    authStore.setToken(token) // 将 token 储存到 pinia
    sessionStorage.setItem('username', username)
    sessionStorage.setItem('btnAuth', JSON.stringify(btnAuth))
    router.replace('/') // 登录成功后跳转到首页
  } catch (err) {
    loading.value = false
    console.log(err)
  }
}
</script>

<template>
  <div
    class="relative min-h-screen overflow-hidden"
    :style="{
      backgroundImage: isLightTheme ? `url(${lbdg})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }"
  >
    <header class="absolute inset-x-0 top-0 z-50 py-6">
      <Container>
        <div class="w-full flex justify-between gap-6 relative">
          <div class="min-w-max inline-flex relative">
            <div class="relative flex items-center gap-3">
              <img :src="Logo" class="w-10 h-10" alt="logo" />
              <div class="text-lg font-semibold text-heading-1">智链采Z-Link</div>
            </div>
          </div>

          <div class="flex flex-col lg:flex-row w-full lg:justify-between lg:items-center absolute top-full left-0 lg:static lg:top-0 lg:bg-transparent border-x border-x-box-border lg:border-x-0 lg:h-auto h-0 ovverflow-hidden">
            <div class="border-t border-box-border lg:border-t-0 px-6 lg:px-0 pt-6 lg:pt-0 flex flex-col lg:flex-row gap-y-4 gap-x-3 text-lg text-heading-2 w-full lg:justify-center lg:items-center">
              <div class="duration-300 font-medium ease-linear hover:text-primary py-3">智能、链接、精准、工业、数据</div>
              <div class="flex items-center lg:min-w-max sm:w-max w-full pb-6 lg:pb-0 border-b border-box-border lg:border-0 px-6 lg:px-0">
                <RegisterPage />
              </div>
            </div>
          </div>

          <div class="min-w-max flex items-center gap-x-3">
            <button
              @click="themeStore.toggleTheme()"
              class="outline-hidden flex relative text-heading-2 rounded-full p-2 lg:p-3 border border-box-border cursor-pointer"
            >
              <svg
                v-if="themeStore.theme === 'dark'"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                class="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            </button>
          </div>
        </div>
      </Container>
    </header>

    <main class="flex flex-col gap-y-20 md:gap-y-32 overflow-hidden">
      <div class="relative pt-32 lg:pt-36">
        <Container class="flex flex-col lg:flex-row gap-10 lg:gap-12">
          <div class="absolute w-full lg:w-1/2 inset-y-0 lg:right-0">
            <span class="absolute left-6 md:left-4 top-24 lg:top-28 w-24 h-24 rotate-90 skew-x-12 rounded-3xl bg-linear-to-r from-sky-600 to-violet-600 blur-xl opacity-60 lg:opacity-95 lg:block hidden"></span>
            <span class="absolute right-4 bottom-12 w-24 h-24 rounded-3xl bg-primary blur-xl opacity-80"></span>
          </div>
          <div class="flex flex-1 lg:w-1/2 lg:h-auto relative lg:max-w-none lg:mx-0 mx-auto max-w-3xl">
            <LoginHero class="w-full max-w-lg" />
          </div>
          <div class="relative flex flex-col items-center text-center lg:text-left lg:py-8 lg:items-start lg:max-w-none max-w-3xl mx-auto lg:flex-1 lg:w-1/2">
            <Title />
            <p class="text-heading-3 md:text-lg mt-8">"AI 懂需求，智能链好厂"</p>
            <div class="mt-10 w-full flex max-w-md mx-auto lg:mx-0">
              <div class="flex sm:flex-row flex-col gap-5 w-full">
                <a-form ref="formRef" :model="formState">
                  <a-form-item
                    name="username"
                    :rules="[{ required: true, message: 'Please input your username!' }]"
                    class="py-1 pl-6 w-full pr-1 flex gap-3 items-center text-heading-3 shadow-lg shadow-box-shadow border border-box-border bg-box-bg rounded-full ease-linear focus-within:bg-body focus-within:border-primary"
                  >
                    <a-input
                      v-model:value="formState.username"
                      placeholder="请输入用户名"
                      variant="borderless"
                      class="bg-transparent text-black! placeholder:text-gray-400! outline-none"
                    >
                      <template #prefix><UserOutlined class="text-gray-400 text-lg shrink-0" /></template>
                    </a-input>
                  </a-form-item>

                  <a-form-item
                    name="password"
                    :rules="[{ required: true, message: 'Please input your password!' }]"
                    class="py-1 pl-6 w-full pr-1 flex gap-3 items-center text-heading-3 shadow-lg shadow-box-shadow border border-box-border bg-box-bg rounded-full ease-linear focus-within:bg-body focus-within:border-primary"
                  >
                    <a-input-password
                      v-model:value="formState.password"
                      placeholder="请输入密码"
                      variant="borderless"
                      class="bg-transparent text-black! placeholder:text-gray-400! outline-none"
                    >
                      <template #prefix><LockOutlined /></template>
                    </a-input-password>
                  </a-form-item>

                  <a-form-item>
                    <a-button type="primary" style="width: 100%" :loading="loading" @click="handleLogin">登录</a-button>
                  </a-form-item>
                </a-form>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </main>

    <div class="relative mt-12 md:mt-16">
      <Container class="flex justify-center align-center">
        <div class="mx-auto lg:mx-0 p-5 sm:p-6 sm:py-8 max-w-5xl rounded-3xl bg-box-bg border border-box-border shadow-lg shadow-box-shadow md:divide-x divide-box-border grid grid-cols-2 md:grid-cols-4">
          <div class="text-center px-5">
            <h2 class="font-semibold text-xl sm:text-2xl md:text-4xl text-heading-1">95%</h2>
            <p class="mt-2 text-heading-3">效率提高率</p>
          </div>
          <div class="text-center px-5">
            <h2 class="font-semibold text-xl sm:text-2xl md:text-4xl text-heading-1">90%</h2>
            <p class="mt-2 text-heading-3">成交成功率</p>
          </div>
          <div class="text-center px-5">
            <h2 class="font-semibold text-xl sm:text-2xl md:text-4xl text-heading-1">100+</h2>
            <p class="mt-2 text-heading-3">日均服务公司</p>
          </div>
          <div class="text-center px-5">
            <h2 class="font-semibold text-xl sm:text-2xl md:text-4xl text-heading-1">5000+</h2>
            <p class="mt-2 text-heading-3">生态合作伙伴</p>
          </div>
        </div>
      </Container>
    </div>
  </div>
</template>