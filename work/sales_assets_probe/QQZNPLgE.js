const n=`<template>
  <button
    class="bg-[#EEF5F5] px-8 py-3 fs-14 fw-4 text-gray-3 rounded-lg hover:bg-gray-100 active:bg-gray-50"
    :class="isDisabled && 'cursor-not-allowed opacity-30'"
    @click="handleClick"
  >
    <IconLoading :loading="loading" color="#fff" />
    <slot></slot>
  </button>
</template>

<script setup>
// props
const props = defineProps({
  loading: Boolean,
  disabled: Boolean,
});

// emits
const emit = defineEmits(["click"]);

// hooks
const isDisabled = computed(() => {
  if (props.disabled || props.loading) return true;
  return false;
});

// methods
const handleClick = () => {
  if (isDisabled.value) return;
  emit("click");
};
<\/script>
`;export{n as default};
