const e=`<template>
  <div class="bg-white rounded-lg border-grey">
    <div v-if="clientsBalancesStore.debtReports" class="w-full overflow-auto">
      <data-table
        :loading="clientsBalancesStore.isDetailReportLoading"
        :isEmpty="!clientsBalancesStore.debtReports?.length"
      >
        <template #header>
          <c-tr class="border-t-0">
            <c-td-no-edit colspan="4" class="border-r-1">
              {{ t("dashboard.for_this_months") }}
            </c-td-no-edit>
            <c-td-no-edit colspan="3">
              {{ t("dashboard.for_year") }}
            </c-td-no-edit>
          </c-tr>
          <c-tr>
            <c-td-no-edit
              v-for="key in headers"
              :class="key?.borderX && 'border-r-1'"
              class="bg-neutral-50"
            >
              {{ key.name }}
            </c-td-no-edit>
          </c-tr>
        </template>
        <template #body>
          <template
            v-for="(data, index) in clientsBalancesStore.debtReports"
            :key="data?.id"
          >
            <c-tr class="border-b-0">
              <c-td-no-edit
                v-for="key in headers"
                :key="key.key"
                :is-checked="key.checked"
                :header-key="key.key"
                :class="[{ 'border-r-1': key?.borderX }]"
                @click="onOpenPayments(index, key.key)"
              >
                <div
                  v-if="key.key === 'month'"
                  class="cursor-pointer underline text-[#299B9B]"
                >
                  {{ data?.month?.name }}, {{ data?.year }}
                </div>
                <div
                  v-else-if="typeof data[key.type][key.key] === 'number'"
                  class="text-right"
                >
                  {{ getFormattedAmount(data[key.type][key.key]) }}
                </div>
                <div v-else>
                  {{ data[key.type][key.key] }}
                </div>
              </c-td-no-edit>
            </c-tr>
            <template
              v-for="payment in data?.payment_method_arr"
              :key="payment?.payment_method?.id"
            >
              <c-tr
                v-if="isOpenedPayments(index)"
                class="border-b-0 bg-[#fafdfc] cursor-default"
              >
                <c-td-no-edit
                  v-for="key in headers"
                  :key="key.key"
                  :is-checked="key.checked"
                  :header-key="key.key"
                  :class="{ 'border-r-1': key.borderX }"
                >
                  <div v-if="key.key === 'month'">
                    {{ payment?.payment_method.name }}
                  </div>
                  <div
                    v-else-if="typeof payment[key.type][key.key] === 'number'"
                    class="text-right"
                  >
                    {{ getFormattedAmount(payment[key.type][key.key]) }}
                  </div>
                  <div v-else>
                    {{ payment[key.type][key.key] }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </template>
        </template>
      </data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { Template } from "~/interfaces/ui/template";

// store
const clientsBalancesStore = useClientsBalancesStore("main");

// props
const props = defineProps<{
  subDepositOwnerIds: string[];
}>();

// states
const { t } = useI18n();
const route = useRoute();
const openedPaymentsIndexes = ref<number[]>([]);

const headers = ref<Template[]>([
  {
    name: t("labels.month"),
    key: "month",
    type: "for_month",
    checked: true,
    is_sortable: false,
    borderX: true,
  },
  {
    name: t("labels.debt"),
    key: "debt",
    type: "for_month",
    checked: true,
    is_sortable: false,
    borderX: true,
    right: true,
  },
  {
    name: t("labels.credit"),
    key: "credit",
    type: "for_month",
    checked: true,
    is_sortable: false,
    borderX: true,
    right: true,
  },
  {
    name: t("labels.saldo"),
    key: "saldo",
    type: "for_month",
    checked: true,
    is_sortable: false,
    right: true,
    borderX: true,
  },
  {
    name: t("labels.debt"),
    key: "debt",
    type: "for_year",
    checked: true,
    is_sortable: false,
    borderX: true,
    right: true,
  },
  {
    name: t("labels.credit"),
    key: "credit",
    type: "for_year",
    checked: true,
    is_sortable: false,
    borderX: true,
    right: true,
  },
  {
    name: t("labels.saldo"),
    key: "saldo",
    type: "for_year",
    checked: true,
    is_sortable: false,
    right: true,
  },
]);

const params = reactive<{
  client_id: string;
  sub_deposit_owner_id_arr: string[];
}>({
  client_id: route.params.id as string,
  sub_deposit_owner_id_arr: props.subDepositOwnerIds,
});

// hooks
onMounted(async () => {
  if (!clientsBalancesStore.debtReports.length > 0) {
    await clientsBalancesStore.getDebtReports(params);
  }
});

watch(params, async () => await clientsBalancesStore.getDebtReports(params), {
  deep: true,
});

watch(
  () => props.subDepositOwnerIds,
  () => {
    params.sub_deposit_owner_id_arr = props.subDepositOwnerIds;
  }
);

// methods

const onOpenPayments = (idx: number, key: string) => {
  if (key === "month") {
    if (openedPaymentsIndexes.value.includes(idx)) {
      openedPaymentsIndexes.value = openedPaymentsIndexes.value.filter(
        (index) => index !== idx
      );
    } else {
      openedPaymentsIndexes.value = [...openedPaymentsIndexes.value, idx];
    }
  }
};

const isOpenedPayments = (idx: number) => {
  return openedPaymentsIndexes.value.includes(idx);
};
<\/script>
`;export{e as default};
