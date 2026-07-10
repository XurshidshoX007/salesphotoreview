const n=`<template>
  <div class="rounded-lg bg-white shadow-md transition-all">
    <div
      class="rounded-t-lg text-[#384949] p-3"
      :style="{
        backgroundColor: _bgColor || '#C301011A',
        color: bgColor || '#C30101',
      }"
    >
      {{ title || t("column.common") }}
    </div>
    <div class="w-full flex flex-col">
      <div class="text-xl text-center fw-6 mt-3">
        {{ totalSum && getFormattedAmount(totalSum) }}
      </div>
      <div class="px-3 pb-3 mt-1">
        <div class="flex">
          <div class="fw-4 fs-14">{{ t("column.quantity") }}:</div>
          <div class="fw-6 fs-14 ml-1 whitespace-nowrap">
            {{ totalCount && getFormattedAmount(totalCount) }}
          </div>
        </div>
        <div class="flex">
          <div class="fw-4 fs-14">{{ t("column.volume") }}:</div>
          <div class="fw-6 fs-14 ml-1 whitespace-nowrap">
            {{ totalVolume && getFormattedAmount(totalVolume) }}
          </div>
        </div>
        <div class="flex">
          <div class="fw-4 fs-14">{{ t("reports.akb") }}:</div>
          <div class="fw-6 fs-14 ml-1 whitespace-nowrap">
            {{ totalAkb && getFormattedAmount(totalAkb) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";

//state
const { t } = useI18n();
// props
const props = defineProps<{
  title?: string;
  bgColor?: string;
  totalSum?: number;
  totalCount?: number;
  totalVolume?: number;
  totalAkb?: number;
}>();

// hooks
const _bgColor = computed(() => {
  if (props.bgColor) {
    return props.bgColor + "1A";
  }
  return null;
});
<\/script>
`;export{n as default};
