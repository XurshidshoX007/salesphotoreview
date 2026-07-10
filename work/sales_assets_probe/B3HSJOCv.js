const n=`<template>
  <flex-col class="w-full items-center py-8">
    <SettingsProductsExcelDialogFileTemplate
      :file-name="fileName"
      :size="size"
      :percent="progressPercent"
      progress-mode
      class="mb-4"
      @clear-file="() => emits('clearFile')"
    />
  </flex-col>
</template>

<script setup lang="ts">
// Emits

const emits = defineEmits<{
  (e: "clearFile"): void;
}>();

// Props

interface Props {
  fileName?: string;
  size?: number;
  percent?: number;
}

defineProps<Props>();

const progressPercent = ref(0);
let animationFrameId: number | undefined;

const animateProgress = (startTime: number) => {
  const duration = 5000;
  const elapsed = performance.now() - startTime;
  const progress = Math.min(elapsed / duration, 1);

  progressPercent.value = Math.round(progress * 100);

  if (progress < 1) {
    animationFrameId = requestAnimationFrame(() => animateProgress(startTime));
  }
};

onMounted(() => {
  const startTime = performance.now();
  animationFrameId = requestAnimationFrame(() => animateProgress(startTime));
});

onBeforeUnmount(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
<\/script>
`;export{n as default};
