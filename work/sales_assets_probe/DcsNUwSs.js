const n=`<template>
  <div class="flex flex-col gap-5">
    <div
      class="grid gap-5 items-end relative break-words"
      :style="cardStyle"
      :class="{
        'opacity-10': incomeReportsStore.isTotalBlocksLoading,
      }"
    >
      <div
        v-show="incomeReportsStore.isTotalBlocksLoading"
        class="absolute top-[50%] left-[50%]"
      >
        <icon-loading :loading="true" :width="14" :height="14" />
      </div>
      <div
        v-for="item in incomeReportsStore.totalBlocks"
        :key="item.id"
        :style="[
          item.hex_color
            ? \`background:\${item.hex_color + '1A'};\`
            : 'background: white;',
          \`border: 1px solid \${item?.hex_color};\`,
          item?.is_summary &&
            \`background: \${getHexByTWColor('bg-red-100')}; border: 1px solid \${getHexByTWColor('border-red-500')};\`,
        ]"
        class="px-6 py-8 w-full rounded-lg flex items-center justify-center"
      >
        <div
          v-if="!item?.is_summary"
          class="flex flex-col items-center justify-center"
        >
          <div class="text-sm text-[#94A791]">{{ item.currency?.name }}</div>
          <div
            :style="[\`color: \${item.hex_color}\`]"
            class="font-semibold text-lg"
          >
            {{
              item.total !== null
                ? getFormattedAmount(item.total)
                : t("column.unknown")
            }}
            <span class="text-xs text-black">{{
              item.total !== null ? item.currency?.code : ""
            }}</span>
          </div>
        </div>
        <div v-else class="flex flex-col items-center justify-center">
          <div class="text-sm text-[#94A791]">{{ t("warehouse.common") }}</div>
          <div class="font-semibold text-lg text-[#D81313]">
            {{
              item.total !== null
                ? getFormattedAmount(item.total)
                : t("column.unknown")
            }}
            <span class="text-xs text-black">{{
              item.total !== null ? item.currency?.code : ""
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getFormattedAmount } from "~/utils/filter";
import { getHexByTWColor } from "~/utils/helpers";

// Composables
const { t } = useI18n();

// Stores
const incomeReportsStore = useCashboxIncomeReportsStore("main");

// States
const balanceCardWidth = ref<number | null>(null);

// Hooks

const cardStyle = computed(() => {
  const width = balanceCardWidth.value ?? 0;
  return \`grid-template-columns:repeat(auto-fill, minmax(\${width > 20 ? width * 10 + 160 : 260}px, 1fr))\`;
});

watch(
  () => incomeReportsStore.totalBlocks,
  (newBalances) => {
    if (incomeReportsStore.totalBlocks?.length > 0) {
      balanceCardWidth.value = newBalances.reduce((max, item) => {
        const balanceLength = (item.total ?? 0).toString().length;
        return Math.max(max, balanceLength);
      }, 0);
    }
  },
  { immediate: true, deep: true },
);
<\/script>
`;export{n as default};
