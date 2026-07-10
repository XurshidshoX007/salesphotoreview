const n=`<template>
  <button
    type="button"
    :disabled="disabled"
    class="i-button button-bg hover:bg-primary-600 active:bg-primary-700"
    :class="disabled && 'opacity-50 pointer-events-none'"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
// props
const props = defineProps<{
  disabled?: boolean;
}>();
<\/script>

<style lang="scss">
.i-button {
  padding: 10px;
  min-width: 40px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-family: "Inter", sans-serif;
  font-weight: 400;
  border-radius: 10px;
}
</style>
`;export{n as default};
