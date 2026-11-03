<template>
  <AppShell v-if="layout === 'shell'">
    <RouterView />
  </AppShell>
  <FocusLayout v-else-if="layout === 'focus'">
    <RouterView />
  </FocusLayout>
  <RouterView v-else />
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppShell from './layouts/AppShell.vue';
import FocusLayout from './layouts/FocusLayout.vue';

const route = useRoute();
const layout = computed(() => route.meta.layout || 'bare');
</script>
