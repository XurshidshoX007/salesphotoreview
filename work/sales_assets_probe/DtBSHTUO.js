const n=`<template>
  <div
    :style="customStyles"
    class="animate-pulse bg-gray-200 rounded-lg dark:bg-gray-400"
  >
    <span class="sr-only">Loading...</span>
  </div>
</template>

<script setup lang="ts">
// props
const props = defineProps<{
  height?: number | string;
  width?: number | string;
}>();

// hooks
const customStyles = computed(() => ({
  height: props.height || "100%",
  width: props.width || "100%",
  minHeight: "20px",
  minWidth: "50px",
}));
<\/script>

<style scoped>
/* Optional: customize the pulse effect */
.animate-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
`;export{n as default};
