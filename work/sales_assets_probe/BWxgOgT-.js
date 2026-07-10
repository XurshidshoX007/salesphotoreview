const e=`<template>
  <flex-col class="w-full bg-white rounded-lg shadow-md">
    <div
      class="flex justiffy-between items-center border-b p-2 text-gray-3 justify-between gap-3"
    >
      <div>{{ t("orders.request") }}:</div>
      <div class="text-end">
        <SkeletonRows v-if="loading" :rows="1" height="8px" :maxRowWidth="5" />
        <div v-else>
          {{ getFormattedAmount(countDetail?.request_total_count ?? 0) }}
        </div>
      </div>
    </div>
    <div
      class="flex justiffy-between items-center p-2 text-gray-3 justify-between gap-3"
    >
      <div>{{ t("orders.refund") }}:</div>
      <div class="text-end">
        <SkeletonRows v-if="loading" :rows="1" height="8px" :maxRowWidth="5" />
        <div v-else>
          {{ getFormattedAmount(countDetail?.refund_total_count ?? 0) }}
        </div>
      </div>
    </div>
  </flex-col>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ExchangeCountDetailModel } from "~/interfaces/api/exchange-count-detail-model";

// props
const props = defineProps<{
  countDetail?: ExchangeCountDetailModel;
  loading: boolean;
}>();

// states
const { t } = useI18n();
<\/script>
`;export{e as default};
