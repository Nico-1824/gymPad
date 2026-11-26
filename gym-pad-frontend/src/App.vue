<script setup lang="ts">
import { RouterView } from 'vue-router'
import RestTimer from '@/components/RestTimer.vue'
</script>

<template>
  <RouterView />
  <!-- Lives outside the pages so the rest timer keeps going when you switch pages -->
  <RestTimer />
</template>

<style scoped></style>
