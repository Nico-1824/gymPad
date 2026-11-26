<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import RestTimer from '@/components/RestTimer.vue'
import { useRestTimer } from '@/composables/useRestTimer'
import { supabase } from '@/util/supabase'

const route = useRoute()
const restTimer = useRestTimer()

function stopRestWhenSessionEnds() {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') restTimer.cancel()
  })
}

stopRestWhenSessionEnds()
const onSignedInPage = () => route.meta.requiresAuth === true
</script>

<template>
  <RouterView />
  <RestTimer v-if="onSignedInPage()" />
</template>

<style scoped></style>
