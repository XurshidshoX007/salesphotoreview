const o=`<template>
  <div
    v-if="!isLoading"
    :style="{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }"
    class="grid items-center page-gap"
  >
    <div v-for="block in _totalBlocks" :key="block?.order_state?.id">
      <ReportsOrderByAgentsTotalBox
        v-show="block"
        :title="block?.order_state?.name"
        :bg-color="block?.order_state?.hex_color"
        :total-sum="block?.total_cost"
        :total-count="block?.total_product_count"
        :total-volume="block?.total_product_volume"
        :total-akb="block?.total_akb_count"
      />
    </div>
  </div>
  <div v-else class="grid grid-cols-3 gap-4 mt-6">
    <SkeletonBlock v-for="i in 3" :key="i" height="166px" width="1/3" />
  </div>
</template>

<script setup lang="ts">
import type { ReportTotalModel } from "~/interfaces/api/reports/orders-by-agents/total";

// props
const props = defineProps<{
  totalBlocks: ReportTotalModel;
  isLoading: Boolean;
}>();

// hooks
const _totalBlocks = computed(() => {
  return [
    props.totalBlocks?.total && {
      ...props.totalBlocks?.total,
    },
    ...(props.totalBlocks?.list || []),
  ];
});
<\/script>
`;export{o as default};
