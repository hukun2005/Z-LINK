import { createRouter, createWebHistory } from 'vue-router'
import { pinia } from '../store'
import { useAuthStore } from '../store/login'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../page/Home.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../page/Login/Login.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/assistant',
      name: 'Assistant',
      component: () => import('../page/assistant/Assistant.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../page/Profile.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/publish',
      name: 'Publish',
      component: () => import('../page/Publish.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/companies',
      name: 'Companies',
      component: () => import('../page/Companies.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/companies/:id',
      name: 'CompanyDetail',
      component: () => import('../page/CompanyDetail.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../page/NotFound.vue'),
    },
  ],
})

// RequireAuth 逻辑改写为全局导航守卫
router.beforeEach((to) => {
  const auth = useAuthStore(pinia)
  const isLoading = !!auth.token
  if (to.meta.requiresAuth === true && !isLoading) return '/login'
  if (to.meta.guestOnly === true && isLoading) return '/'
  return true
})

export default router