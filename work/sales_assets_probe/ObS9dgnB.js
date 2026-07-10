const n=`<template>
  <div class="badge-marker">
    <div class="badge-indicator" />

    <div class="badge-text">{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    text: string;
    icon?: any;
    color?: string;
  }>(),
  {}
);
<\/script>

<style lang="scss" scoped>
.badge-marker {
  position: relative;
  display: inline-flex;
  padding: 1px 12px 1px 22px;
  border-radius: 20px;
  font-size: 12px;
  line-height: 20px;
  font-weight: 600;
  background-color: #ffffff;

  .badge-indicator {
    position: absolute;
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 3px solid white;
    box-sizing: content-box;
    background-color: v-bind(color);
    box-shadow: 0px 2.4px 4.8px 0px #1b1c1d0a;
  }

  .badge-text {
    white-space: nowrap;
  }
}
</style>
`;export{n as default};
