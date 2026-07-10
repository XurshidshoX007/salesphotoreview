const n=`<template>
  <button
    class="md-btn"
    :class="
      isActive
        ? ' active:bg-primary-700 text-white button-bg'
        : 'border-1 border-primary-gray hover:bg-gray-100 active:bg-gray-200 text-black bg-white'
    "
    type="button"
  >
    <slot></slot>
  </button>
</template>

<script setup>
const props = defineProps({
  isActive: Boolean,
});
<\/script>

<style scoped>
.md-btn {
  min-width: 35px;
  height: 35px;
  display: flex;
  padding: 0 4px;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 400;
  font-family: "SourceSans3", sans-serif;
  outline: none;
  user-select: none;
  border-radius: 8px;
}
</style>
`;export{n as default};
