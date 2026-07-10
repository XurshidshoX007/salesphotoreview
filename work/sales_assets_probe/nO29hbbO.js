const n=`<template>
  <span class="fa-solid font-awesome">
    {{ hash }}
  </span>
</template>

<script setup>
const props = defineProps({
  hash: String,
});
<\/script>

<style scoped></style>
`;export{n as default};
