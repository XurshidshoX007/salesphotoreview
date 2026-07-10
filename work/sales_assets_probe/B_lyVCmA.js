const n=`<template>
  <div v-if="loading">
    <IconLoading loading :width="4" :height="4" />
  </div>
</template>

<script setup>
const props = defineProps({
  loading: Boolean,
});
<\/script>
`;export{n as default};
