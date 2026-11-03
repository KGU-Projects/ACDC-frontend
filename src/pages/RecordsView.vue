<template>
  <div>
    <PageHeader title="나의 응시 내역" />
    <EmptyState message="응시 내역이 이곳에 표시됩니다." />
  </div>
</template>

<script setup>
import PageHeader from '../components/ui/PageHeader.vue';
import EmptyState from '../components/ui/EmptyState.vue';
</script>
