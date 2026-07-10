const e=`<template>
  <d-modal
    :name="t('cash.daily_state_of_cash')"
    data-container-width="90%"
    @close-dialog="closeDialog"
  >
    <div class="table-content-container">
      <div class="table-content-header justify-between">
        <div class="table-content-btn-group">
          <table-sort-columns
            :templates="headers"
            :save-key="CashboxClosingDailyListHeader"
            @onChangeTableHeaders="onChangeHeaders"
          />
          <ShowHideColumn
            :headers="headers"
            :save-key="CashboxClosingDailyListHeader"
          />
          <excel-btn
            :loading="isExcelLoading"
            :disabled="isLoading"
            @click="downloadExcel"
          />
          <RefreshBtn @click="refreshData" :loading="isLoading" />
        </div>
        <MonthPicker @change-month="onChangeYearMonth" />
      </div>

      <div class="table-content-body">
        <data-table
          :headers="headers"
          :loading="isLoading"
          :is-empty="!data?.length"
          :sorted="orderBy"
          @sort="onSortData"
        >
          <template #body>
            <template v-for="(item, index) in sortedData" :key="index">
              <c-tr class="last-border-b-0">
                <c-td-no-edit
                  v-for="key in headers"
                  :is-checked="key.checked"
                  :key="key.key"
                  :type="key.type"
                >
                  <flex-row
                    v-if="key.key === 'is_closed'"
                    class="gap-4 items-center"
                  >
                    <rounded-icon-btn
                      v-if="hasAccessToGetExpeditorReport"
                      icon="list"
                      :type="item.is_closed ? 'checked' : 'danger'"
                      :tooltip="
                        item.is_closed
                          ? t('cash.state_of_closed_cash_by_expeditor')
                          : t('cash.state_of_not_closed_cash_by_expeditor')
                      "
                      @click="openExpeditorStateDialog(item.date)"
                    />
                    <rounded-icon-btn
                      v-if="hasAccess2CloseCashBox && !item.is_closed"
                      icon="check"
                      type="info"
                      :tooltip="t('cash.close_cash')"
                      @click="openApproveClosingDialog(item.date)"
                    />
                  </flex-row>
                  <div
                    v-else-if="key.type === 'date'"
                    @click="toggleExpandRow(index)"
                  >
                    <div
                      v-if="isRowExpandable(item) && key.key === 'date'"
                      class="expand-collapse flex gap-2 items-center w-fit select-none"
                    >
                      <IconArrowBottom
                        :class="[
                          expandedRows.includes(index)
                            ? 'rotate-180 transition-all'
                            : 'rotate-0 transition-all',
                        ]"
                      />
                      <div>
                        {{ getFormattedDate(item[key.key], "DD.MM.YYYY") }}
                      </div>
                    </div>
                    <div v-else>
                      {{ getFormattedDate(item[key.key], "DD.MM.YYYY") }}
                    </div>
                  </div>
                  <div v-else-if="typeof item[key.key] === 'object'">
                    {{ item[key.key]?.name }}
                  </div>
                  <div v-else-if="key.type === 'boolean'">
                    {{ item[key.key] ? t("filters.yes") : t("filters.no") }}
                  </div>
                  <div v-else-if="key.type === 'number'">
                    {{ getFormattedAmount(item[key.key]) }}
                  </div>
                  <div v-else>
                    {{ item[key.key] }}
                  </div>
                </c-td-no-edit>
              </c-tr>
              <template v-if="expandedRows.includes(index) && item.list.length">
                <c-tr
                  v-for="(innerItem, innerIndex) in item.list"
                  :key="innerIndex"
                >
                  <c-td-no-edit
                    v-for="key in headers"
                    :key="key.key"
                    :is-checked="key.checked"
                    :type="key.type"
                  >
                    <div v-if="typeof item[key.key] === 'object'">
                      {{ innerItem[key.key]?.name }}
                    </div>
                    <div v-else-if="key.type === 'boolean'">
                      {{
                        innerItem[key.key] ? t("filters.yes") : t("filters.no")
                      }}
                    </div>
                    <div v-else-if="key.type === 'number'">
                      {{ getFormattedAmount(innerItem[key.key]) }}
                    </div>
                  </c-td-no-edit>
                </c-tr>
              </template>
            </template>
          </template>
        </data-table>
      </div>
    </div>
  </d-modal>
  <transition name="modal">
    <div v-if="expeditorDialogState">
      <DashboardCashboxCashboxesExpeditorStateDialog
        :id="expeditorDialogState.cashboxId"
        :date="expeditorDialogState.date"
        @close-dialog="expeditorDialogState = null"
      />
    </div>
  </transition>
  <transition name="modal">
    <div v-if="approveClosingDialogState">
      <DashboardCashboxCashboxesApproveClosingDialog
        :is-saving="isClosing"
        @approve-closing="approveClosing"
        @close-dialog="approveClosingDialogState = null"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { DailyStateListModel } from "~/interfaces/api/cashboxes/cashboxes-model";
import type { OrderByParams } from "~/interfaces/api/params/list-parameters";
import type { Template } from "~/interfaces/ui/template";
import { getFormattedDate } from "~/utils/formatters";
import { getFormattedAmount } from "~/utils/filter";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";
import { CashboxClosingDailyListHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  id: string;
}>();

// emits
const emit = defineEmits<{
  (e: "close-dialog"): void;
  (e: "refresh"): void;
}>();

// store
const cashboxesStore = useCashboxesStore("main");

// accesses
const { hasAccess2GetClosingExpeditorReport, hasAccess2CloseCashBox } =
  useCashboxAccess();

// states
const { t } = useI18n();
const data = ref<DailyStateListModel[]>();
const isLoading = ref(false);
const isExcelLoading = ref(false);
const expandedRows = ref<number[]>([]);
const isClosing = ref(false);
const orderBy = ref<OrderByParams | null>(null);
const shouldRefreshCashboxList = ref(false);

const expeditorDialogState = ref<{
  date: string;
  cashboxId: string;
} | null>(null);

const approveClosingDialogState = ref<{
  date: string;
  cashboxId: string;
} | null>(null);

const params = reactive<{
  yearMonth: {
    year: number;
    month: number;
  };
  cashboxId: string;
}>({
  yearMonth: {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  },
  cashboxId: props.id,
});

const headers = ref<Template[]>(
  getCheckedItemsByKey(CashboxClosingDailyListHeader) || [
    {
      name: t("cash.closing_status"),
      key: "is_closed" as keyof DailyStateListModel,
      type: "is_closed",
      checked: true,
    },
    {
      name: t("column.date"),
      key: "date" as keyof DailyStateListModel,
      type: "date",
      checked: true,
    },
    {
      name: t("cash.is_data_correct_for_closing"),
      key: "is_correct" as keyof DailyStateListModel,
      type: "boolean",
      checked: true,
    },
    {
      name: t("cash.problematic_orders_count"),
      key: "problematic_orders_count" as keyof DailyStateListModel,
      type: "number",
      checked: true,
    },
    {
      name: t("cash.expected_payment_amount"),
      key: "expected_payment_amount",
      type: "number",
      checked: true,
    },
    {
      name: t("cash.all_payment_amount"),
      key: "all_payment_amount" as keyof DailyStateListModel,
      type: "number",
      checked: true,
    },
    {
      name: t("cash.approved_payment_amount"),
      key: "approved_payment_amount" as keyof DailyStateListModel,
      type: "number",
      checked: true,
    },
    {
      name: t("column.currency"),
      key: "base_currency" as keyof DailyStateListModel,
      type: "base_currency.name",
      checked: true,
    },

    {
      name: t("cash.closed_by"),
      key: "closed_by" as keyof DailyStateListModel,
      type: "closed_by.name",
      checked: true,
    },
    {
      name: t("cash.closed_date"),
      key: "closed_date" as keyof DailyStateListModel,
      type: "date",
      checked: true,
    },
    {
      name: t("cash.closed_comment"),
      key: "closed_comment" as keyof DailyStateListModel,
      type: "string",
      checked: true,
    },
  ]
);

// hooks
const sortedData = computed(() => {
  if (!orderBy.value) return data.value;

  const { field, is_asc } = orderBy.value;

  return data.value?.slice().sort((a, b) => {
    const aVal = a[field as keyof DailyStateListModel];
    const bVal = b[field as keyof DailyStateListModel];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return is_asc ? -1 : 1;
    if (bVal == null) return is_asc ? 1 : -1;

    if (typeof aVal === "number" && typeof bVal === "number") {
      return is_asc ? aVal - bVal : bVal - aVal;
    }

    return is_asc
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });
});

const hasAccessToGetExpeditorReport = computed(() => {
  return hasAccess2GetClosingExpeditorReport || hasAccess2CloseCashBox;
});

watch(params, async () => await getData());

// methods
const closeDialog = () => {
  emit("close-dialog");

  if (shouldRefreshCashboxList.value) {
    emit("refresh");
    shouldRefreshCashboxList.value = false;
  }
};

const onChangeYearMonth = (payload: { year: number; month: number }) => {
  params.yearMonth = payload;
};

const onChangeHeaders = (newHeaders: Template[]) => {
  headers.value = newHeaders;
};

const isRowExpandable = (item: DailyStateListModel) => {
  return item.list && item.list.length > 1;
};

const toggleExpandRow = (index: number) => {
  if (expandedRows.value.includes(index)) {
    expandedRows.value = expandedRows.value.filter((row) => row !== index);
  } else {
    expandedRows.value.push(index);
  }
};

const openExpeditorStateDialog = (date: string) => {
  expeditorDialogState.value = {
    date,
    cashboxId: props.id,
  };
};

const openApproveClosingDialog = (date: string) => {
  approveClosingDialogState.value = {
    date,
    cashboxId: props.id,
  };
};

const onSortData = (orderByVal: OrderByParams | null) => {
  orderBy.value = orderByVal;
};

const downloadExcel = async () => {
  await cashboxesStore.downloadDailyListExcel(
    {
      year_month: {
        year: params.yearMonth.year,
        month: params.yearMonth.month,
      },
      cash_box_id: params.cashboxId,
    },
    headers.value,
    (loading: boolean) => {
      isExcelLoading.value = loading;
    }
  );
};

const approveClosing = async (comment: string) => {
  isClosing.value = true;
  const { cashboxId, date } = approveClosingDialogState.value!;
  const payload = {
    cash_box_id: cashboxId,
    date,
    comment,
  };
  const res = await cashboxesStore.closeCashbox(payload);
  if (res !== "error") {
    approveClosingDialogState.value = null;
    await getData();
    shouldRefreshCashboxList.value = true;
  }
  isClosing.value = false;
};

const getData = async () => {
  isLoading.value = true;
  const payload = {
    year_month: {
      year: params.yearMonth.year,
      month: params.yearMonth.month,
    },
    cash_box_id: params.cashboxId,
  };
  data.value = await cashboxesStore.fetchClosingDateDailyList(payload);
  isLoading.value = false;
};

const refreshData = async () => {
  await getData();
};
<\/script>

<style scoped>
.table-content-body {
  padding-bottom: 0;
}
</style>
`;export{e as default};
