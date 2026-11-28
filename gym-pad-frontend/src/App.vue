<script setup lang="ts">
import { watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import RestTimer from '@/components/RestTimer.vue'
import { useRestTimer } from '@/composables/useRestTimer'
import { usePreferences } from '@/composables/usePreferences'
import { supabase } from '@/util/supabase'
import { clearAppStorage } from '@/util/appStorage'

const route = useRoute()
const restTimer = useRestTimer()
const { preferences, loadFromDatabase, resetToDefaults } = usePreferences()

function forgetPreviousAccount() {
  restTimer.cancel()
  clearAppStorage()
  resetToDefaults()
}

function followSession() {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') forgetPreviousAccount()
    const sessionStarted = event === 'INITIAL_SESSION' || event === 'SIGNED_IN'
    const runOutsideAuthCallbackToAvoidDeadlock = () => setTimeout(loadFromDatabase, 0)
    if (session && sessionStarted) runOutsideAuthCallbackToAvoidDeadlock()
  })
}

followSession()
watch(
  () => preferences.value.show_rest_timer,
  (show) => {
    if (!show) restTimer.cancel()
  },
)
const onSignedInPage = () => route.meta.requiresAuth === true
</script>

<template>
  <RouterView />
  <RestTimer v-if="onSignedInPage()" />
</template>

<style scoped></style>
