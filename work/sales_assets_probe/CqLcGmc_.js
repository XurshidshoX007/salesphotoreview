const n=`<template>
  <transition name="fade" appear>
    <div
      v-if="show"
      class="fade-wrapper"
      :style="{ '--fade-duration': duration + 'ms' }"
      :aria-hidden="!show"
    >
      <slot />
    </div>
  </transition>
</template>

<script setup lang="ts">
type Props = {
  show: boolean | undefined;
  duration?: number;
};

withDefaults(defineProps<Props>(), {
  duration: 300,
});
<\/script>

<style scoped>
.fade-wrapper {
  transition: opacity var(--fade-duration, 300ms) ease;
  will-change: opacity;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
`;export{n as default};
