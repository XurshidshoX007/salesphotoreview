const n=`<template>
  <div class="bg-white rounded-lg shadow-md w-full">
    <div
      class="flex items-center justify-between sticky bg-lotion border-b top-0 rounded-t-large p-4"
    >
      <page-title-20 :title="t('orders.process_of_updating_parameters')" />
      <m-btn @click="closeInfoContent">{{ t("orders.close") }}</m-btn>
    </div>
    <div class="pr-1 rest-info-container">
      <flex-col
        v-if="orderIdsWithVisualId.length"
        class="gap-3 max-h-130 overflow-auto p-4"
      >
        <div
          v-for="order in orderIdsWithVisualId"
          :key="order.id"
          class="w-full flex items-center gap-2"
        >
          <IconLoading
            v-if="isStatusLoading(order.id)"
            :loading="true"
            color="#fff"
            :width="4"
            :height="4"
          />
          <IconX v-else-if="isResultError(order.id)" />
          <IconCheck v-else :color="'#299B9B'" />
          <div class="text-nowrap">
            {{ t("column.order") }} № {{ order?.visual_id }}
          </div>
          <div v-if="!isStatusLoading(order.id)" class="w-full">
            <div v-if="statusesInfo[order.id] === 'alreadyInStatus'">
              {{ t("labels.already_in_status") }}
            </div>
            <div
              v-else-if="isResultError(order.id)"
              class="text-red-3 w-full w-full text-wrap"
              :title="statusesInfo[order.id].message"
            >
              {{ statusesInfo[order.id].message }}
            </div>
            <div v-else-if="isResultSuccess(order.id)" class="text-[#299B9B]">
              {{ t("successfully") }}
            </div>
          </div>
        </div>
      </flex-col>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  orderIdsWithVisualId: {
    id: string;
    visual_id: string;
  }[];
  statusesInfo: Record<
    string,
    {
      status: string;
      message: string;
    }
  >;
}>();

// emits
const emit = defineEmits<{
  (e: "close-info-content"): void;
}>();

// states
const { t } = useI18n();

watch(
  () => props.orderIdsWithVisualId,
  (val) => {
    console.log("Statuses Info Updated:", val);
  },
);

// methods
const isStatusLoading = (orderId: string): boolean => {
  const loadedStatusesArr = Object.keys(props.statusesInfo);
  return !loadedStatusesArr.includes(orderId);
};

const isResultError = (orderId: string): boolean => {
  return props.statusesInfo[orderId]?.status !== "OK";
};

const isResultSuccess = (orderId: string): boolean => {
  return props.statusesInfo[orderId]?.status === "OK";
};

const closeInfoContent = () => {
  emit("close-info-content");
};
<\/script>

<style lang="scss" scoped>
.rest-info-container {
  ::-webkit-scrollbar {
    width: 6px;
    border-radius: 28px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    height: 8px;
    background: theme("colors.neutral.0");
    border-radius: 28px;
  }

  ::-webkit-scrollbar-thumb {
    background: theme("colors.primary.600");
    border-radius: 28px;
    height: 8px;
  }
}
</style>
`;export{n as default};
