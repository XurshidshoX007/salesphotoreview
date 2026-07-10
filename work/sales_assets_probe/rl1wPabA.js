const n=`<template>
  <div class="flex items-center page-gap.25">
    <div
      v-if="currentSize && pageNumber && totalCount"
      class="text-[14px] text-[#299B9B]"
    >
      <span class="text-[#8FA0A0] mr-2 fs-14">{{ t("shown") }} </span>
      {{ currentSize * pageNumber + 1 - currentSize }} -
      {{
        pageNumber * currentSize > totalCount
          ? totalCount
          : pageNumber * currentSize
      }}
      / {{ totalCount }}
    </div>
  </div>

  <div id="close"></div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const props = defineProps({
  currentSize: Number,
  totalCount: Number,
  pageNumber: Number,
});
const { t } = useI18n();
<\/script>
`;export{n as default};
