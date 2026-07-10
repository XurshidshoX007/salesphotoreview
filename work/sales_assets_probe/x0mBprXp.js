const n=`<template>
  <div class="content">
    <div class="circle">
      <icon-search />
    </div>
    <div class="text w-full">
      {{ title }}
    </div>
  </div>
</template>

<script setup lang="ts">
// props
const props = defineProps({
  title: String,
});
<\/script>

<style scoped lang="scss">
.content {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;

  .circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: #fafdfd;
    display: flex;
    text-align: center;
    justify-content: center;
    align-items: center;
  }

  .text {
    width: 100%;
    font-size: 18px;
    font-family: "Inter", sans-serif;
    font-weight: 500;
    color: #424f4f;
    text-align: center;
    padding-top: 15px;
  }
}
</style>
`;export{n as default};
