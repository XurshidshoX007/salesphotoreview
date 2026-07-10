const n=`<template>
  <div
    class="gap-4 rounded-large bg-white w-full"
    :class="{ 'p-4': !withoutPadding, 'flex flex-col': !withoutFlexCol }"
  >
    <slot></slot>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  withoutPadding: {
    default: false,
    type: Boolean,
  },
  withoutFlexCol: {
    default: false,
    type: Boolean,
  },
});
<\/script>
`;export{n as default};
