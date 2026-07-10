const n=`<template>
  <div class="h-4">
    <icon-spinner :class="loading && 'spinner'" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  disabled?: boolean;
  loading?: boolean;
  width?: number;
  size?: number;
}>();
<\/script>

<style scoped>
.spinner {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
`;export{n as default};
