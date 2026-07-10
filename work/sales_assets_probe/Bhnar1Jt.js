const n=`<template>
  <div
    class="my-notification"
    :class="
      (type === 'error' && 'bg-[#FFDBDB]') ||
      (type === 'warning' && 'bg-[#FFF3DB]') ||
      'bg-[#EAF2E9]'
    "
  >
    <div class="toast-content flex items-center gap-3 w-fit">
      <div v-if="type === 'error'">
        <icon-exclamation />
      </div>
      <div class="icon" v-else-if="type === 'warning'">
        <icon-warning color="#F59E0B" size="32" />
      </div>
      <div class="icon bg-[#E2EBE1]" v-else>
        <icon-check color="#25ae88" size="32" />
      </div>
      <p class="title" :class="titleColorClass">
        {{ title || text }}
      </p>
    </div>
    <button class="close" @click="props.close">
      <x-btn />
    </button>
  </div>
</template>

<script setup lang="ts">
// props
const props = defineProps<{
  type: "success" | "error" | "warning";
  title?: string;
  text?: string;
  close?: Function;
}>();

// hooks
const titleColorClass = computed(() => {
  switch (props.type) {
    case "success":
      return "text-[#23C00A]";
    case "error":
      return "text-[#BB0A0A]";
    case "warning":
      return "text-[#F59E0B]";
    default:
      return "text-[#23C00A]";
  }
});
<\/script>

<style scoped lang="scss">
.my-notification {
  // styling
  margin: 5px;
  padding: 7px 10px 7px 7px;
  font-size: 12px;
  border-radius: 8px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 200 !important;
  width: calc(100% - 10px);
  // default (blue)
  //background: #EAF2E9;
  //border-left: 5px solid #187fe7;
  .icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      scale: 0.7;
    }
  }

  .title {
    margin-bottom: 0px;
    font-size: 14px;
    font-weight: 400;
    font-family: "Inter", sans-serif;
    width: calc(100% - 40px);
  }

  // types (green, amber, red)
  &.success {
    width: 100%;
    background: #eaf2e9;
    color: #23c00a;

    .icon {
      width: 34px !important;
      height: 34px !important;
      border-radius: 8px;
      background: #e2ebe1;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        scale: 0.7;
      }

      .title {
        width: calc(100% - 60px);
      }
    }
  }

  &.warn {
    background: #ffb648;
    border-left-color: #f48a06;
  }

  &.error {
    background: #ffdbdb;
    color: red;
    //border-left-color: #b82e24;
  }

  &.warning {
    background: #fff3db;
    color: #f59e0b;

    .icon {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      background: #ede0bf;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
        scale: 0.7;
      }
    }

    .title {
      color: #f59e0b;
      margin-bottom: 0px;
      font-size: 14px;
      font-weight: 400;
      font-family: "Inter", sans-serif;
    }
  }
}
</style>
`;export{n as default};
