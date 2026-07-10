const n=`<template>
  <div class="title20">
    {{ title }}
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: "",
  },
});
<\/script>

<style scoped>
.title20 {
  color: theme("colors.neutral.950");
  font-family: "Inter", sans-serif;
  font-weight: 600;
  font-size: 20px;
  line-height: 100%;
}

@media only screen and (max-width: 576px) {
  .title20 {
    font-size: 16px;
    line-height: 20px;
  }
}
</style>
`;export{n as default};
