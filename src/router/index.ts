import { defineRouter } from '#q-app'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory
} from 'vue-router'

import routes from './routes'
import { useAuthStore } from '../stores/authStore'

export default defineRouter(({ store }) => {
  const createHistory = import.meta.env.QUASAR_SERVER
    ? createMemoryHistory
    : import.meta.env.QUASAR_VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(import.meta.env.QUASAR_VUE_ROUTER_BASE)
  })

  // Global Auth Guard
  Router.beforeEach((to) => {
    const authStore = useAuthStore(store)
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

    if (requiresAuth && !authStore.isAuthenticated) {
      return '/login'
    }
    if ((to.path === '/login' || to.path === '/auth/callback') && authStore.isAuthenticated) {
      return '/'
    }
  })

  return Router
})
