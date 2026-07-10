const n=`<template>
  <div>
    <div class="no-data" :class="size">
      <icon-no-data />
      <div class="text">
        {{ t("labels.information_not_found") }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// state

const { t } = useI18n();

// props
const props = defineProps<{
  size: "small" | "medium" | "large";
}>();
<\/script>

<style scoped lang="scss">
.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 16px;

  svg {
    width: 100px;
    height: 100px;
  }

  .text {
    font-family: "Inter", sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    text-align: center;
    color: #99a0ad;
    width: 100%;
  }
}

.small {
  svg {
    width: 60px;
    height: 60px;
  }
}
</style>
`;export{n as default};
