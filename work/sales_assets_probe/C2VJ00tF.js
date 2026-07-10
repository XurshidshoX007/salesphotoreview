const n=`<template>
  <button
    :class="{
      'cursor-not-allowed opacity-30 bg-gray-100 hover:bg-[#299B9B0D] active:bg-[#299B9B0D]':
        disabled || loading,
      'hover:bg-[#299B9B0D] active:bg-t[#299B9B0D] bg-gray-200 rounded-md':
        !disabled && !loading,
    }"
    :disabled="disabled || loading"
    :type="type || 'button'"
  >
    <slot></slot>
  </button>
</template>

<script setup>
const props = defineProps({
  disabled: Boolean,
  loading: Boolean,
  type: String,
});
<\/script>
`;export{n as default};
