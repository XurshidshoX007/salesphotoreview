const e=`<template>
  <c-tr
    class="sticky border-b-0 -bottom-0.5 bg-lotion z-1 w-full custom-top-shadow"
    :class="fewDataTrClasses"
  >
    <c-td-no-edit
      v-for="header in headers"
      :key="header.key"
      :class="[header.key?.borderX && 'border-r-1', fewDataTdClasses]"
    >
      <template v-if="header.key === 'currency'">
        <div class="text-end text-sm font-semibold">
          {{ getReceivedAmountByCurrencyId(header.id) }}
        </div>
      </template>
      <template v-else>
        <div
          v-for="item in totalAmounts"
          :key="item.id"
          :class="{
            'text-red-3': header.key === 'amount' && item.id === 'left',
          }"
        >
          <template
            v-if="
              (header.key === 'client_name' && item.id === 'total') ||
              (header.key === 'visual_id' && item.id === 'received') ||
              (header.key === 'order_status' && item.id === 'debt') ||
              (header.key === 'amount' && item.id === 'left')
            "
          >
            <div class="text-sm">
              {{ item.title }}
              <span class="font-semibold">{{ item.amount }}</span>
            </div>
          </template>
        </div>
      </template>
    </c-td-no-edit>
  </c-tr>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";

// props
const props = defineProps<{
  headers: (Template & { id: string })[];
  totalAmounts: {
    id: string;
    title: string;
    amount: string;
    details?: {
      id: string;
      title: string;
      amount: string;
    }[];
  }[];
  fewDataTrClasses: string[];
  fewDataTdClasses: string[];
}>();

const receivedDetails = computed(() => {
  return props.totalAmounts.find((t) => t.id === "received")?.details || [];
});

// methods
const getReceivedAmountByCurrencyId = (id: string) => {
  return receivedDetails.value.find((d) => d.id === id)?.amount;
};
<\/script>

<style scoped>
.custom-top-shadow {
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
}
</style>
`;export{e as default};
