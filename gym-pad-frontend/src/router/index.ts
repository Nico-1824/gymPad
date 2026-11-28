import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/util/supabase'
import LoginPage from '@/views/LoginPage.vue'
import DashboardPage from '@/views/DashboardPage.vue'
import WorkoutPage from '@/views/WorkoutPage.vue'
import SettingsPage from '@/views/SettingsPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/', name: 'dashboard', component: DashboardPage, meta: { requiresAuth: true } },
    {
      path: '/workouts/:id',
      name: 'workout',
      component: WorkoutPage,
      props: true,
      meta: { requiresAuth: true },
    },
    { path: '/settings', name: 'settings', component: SettingsPage, meta: { requiresAuth: true } },
  ],
})

router.beforeEach(async (to) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (to.meta.requiresAuth && !session) return { name: 'login' }
  if (to.name === 'login' && session) return { path: '/' }
})

export default router