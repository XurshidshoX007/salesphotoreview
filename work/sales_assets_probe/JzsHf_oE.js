const n=`<template>
  <card :classes="{ header: 'mb-4', content: '@container' }">
    <template #header> {{ props.title }} </template>

    <div class="grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3 gap-2">
      <skeleton-block
        v-if="isLoading"
        v-for="i in 5"
        :key="i"
        height="76px"
        width="200px"
      />
      <template v-else>
        <div
          v-if="data?.total"
          class="bg-[#F2F5F5] rounded-lg py-3 px-4 space-y-1 col-span-full"
        >
          <div class="flex items-center gap-3">
            <div
              class="size-12 p-2 rounded-[10px] bg-[#1CAFCF] border-2 border-white/15 flex items-center justify-center"
            >
              <icon-cash1 class="size-8 [&>path]:fill-white" />
            </div>

            <div>
              <div class="text-neutral-600 font-medium text-sm">
                {{ data.total.base_currency_code }}
              </div>
              <div class="text-neutral-950 font-semibold text-xl">
                {{ getFormattedAmount(data.total.amount) }}
              </div>
            </div>
          </div>
        </div>

        <div
          v-for="(item, index) in data?.items"
          :key="index"
          class="bg-[#F2F5F5] rounded-lg py-3 px-4 space-y-1"
        >
          <div class="text-neutral-600 font-medium text-sm">
            {{ item.currency_code }}
          </div>
          <div class="text-neutral-950 font-semibold text-xl">
            {{ getFormattedAmount(item.amount) }}
          </div>
        </div>
      </template>
    </div>
  </card>
</template>

<script setup lang="ts">
import type { AxiosResponse } from "axios";
import type {
  DashboardFinancePaymentTotalForPeriodModel,
  DashboardFinanceTotalBalanceModel,
} from "~/interfaces/api/dashboard/finance-model";
import { getFormattedAmount } from "~/utils/filter";

// Types
type Props = {
  title: string;
  getData: () => Promise<
    AxiosResponse<
      | DashboardFinanceTotalBalanceModel
      | DashboardFinancePaymentTotalForPeriodModel
    >
  >;
};

// Props
const props = defineProps<Props>();

// Stores
const dashboardFinanceStore = useDashboardFinanceStore();

// States
const data = ref<
  DashboardFinanceTotalBalanceModel | DashboardFinancePaymentTotalForPeriodModel
>();
const isLoading = ref(false);

// Hooks
watch(
  () => dashboardFinanceStore.params,
  (params) => {
    if (!params.date_filter) return;

    loadData();
  },
  { immediate: true, deep: true },
);

// Methods
async function loadData() {
  isLoading.value = true;

  try {
    const response = await props.getData();

    data.value = response.data;
  } catch (error) {
    console.error("Error loading sales data:", error);
  } finally {
    isLoading.value = false;
  }
}
<\/script>
`;export{n as default};
