const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="cashboxReconciliationByClientHeader"
        :templates="headers"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <show-hide-column
        :headers="headers"
        :save-key="cashboxReconciliationByClientHeader"
      />
      <refresh-btn
        :loading="reconciliationStore.isLoading"
        @click="onRefresh"
      />
    </div>

    <div class="table-content-body">
      <data-table
        :headers="headers"
        :sorted="null"
        :loading="reconciliationStore.isLoading"
        :is-empty="!reconciliationStore.byClientData.length"
      >
        <template #body>
          <c-tr v-for="row in reconciliationStore.byClientData" :key="row.id">
            <c-td-no-edit
              v-for="col in headers"
              :key="col.key"
              :is-checked="col.checked"
              :type="col.type"
            >
              {{ getDataValue(row, col.key, col.type) }}
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { useI18n } from "vue-i18n";
import { getDataValue } from "~/utils/helpers";
import { useCashboxReconciliationStatementStore } from "~/stores/dashboard/cashbox/reconciliation/reconciliation.store";
import { cashboxReconciliationByClientHeader } from "~/variable/column-constants";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { CashboxEventKeys } from "~/variable/event-key-constants";
import type { CashboxReconciliationUpdatePayloadType } from "~/interfaces/api/cashboxes/reconciliation-statement-model";

// Composables
const { t } = useI18n();
const eventBus = useEventBus();

// Stores
const reconciliationStore = useCashboxReconciliationStatementStore("by_client");

// States
const headers = ref<Template[]>(
  getCheckedItemsByKey(cashboxReconciliationByClientHeader) || [
    { name: t("column.date"), key: "date", checked: true, type: "date" },
    { name: t("column.visual_id"), key: "visual_id", checked: true },
    {
      name: t("column.agent_name"),
      key: "agent_name",
      checked: true,
    },
    {
      name: t("settings_sidebar.trade_direction"),
      key: "trade_direction_name",
      checked: true,
    },
    {
      name: t("cash.reconciliation.transaction_type"),
      key: "client_transaction_type_name",
      checked: true,
    },
    {
      name: t("settings_sidebar.payment_method"),
      key: "payment_method_code",
      checked: true,
    },
    { name: t("column.debt"), key: "debt", checked: true, type: "number" },
    { name: t("labels.credit"), key: "credit", checked: true, type: "number" },
    {
      name: t("cash.reconciliation.interim_balance"),
      key: "interim_balance",
      checked: true,
      type: "number",
    },
    {
      name: t("cash.reconciliation.transaction_details"),
      key: "transaction_details",
      checked: true,
    },
    {
      name: t("column.comment"),
      key: "commentary",
      checked: true,
    },
    {
      name: t("column.created_by"),
      key: "created_by_name",
      checked: true,
    },
  ]
);

// Hooks
onUnmounted(() => {
  eventBus.off(
    CashboxEventKeys.CASHBOX_RECONCILIATION_TABLE_UPDATE,
    onReconciliationUpdate
  );
});

eventBus.on(
  CashboxEventKeys.CASHBOX_RECONCILIATION_TABLE_UPDATE,
  onReconciliationUpdate
);

// Methods
const onChangeTableHeaders = (newValue: Template[]) => {
  headers.value = newValue;
};

const fetchIfNeeded = async (
  payload: CashboxReconciliationUpdatePayloadType
) => {
  if (payload.type !== "by_client") return;
  if (payload.disabled) return;

  if (
    !payload.force &&
    reconciliationStore.lastFetchedDateKey === payload.dateKey
  )
    return;

  reconciliationStore.paramsByClient.date_range!.from =
    payload.params.date_range!.from;
  reconciliationStore.paramsByClient.date_range!.to =
    payload.params.date_range!.to;
  reconciliationStore.paramsByClient.client_id = payload.params.client_id;

  await reconciliationStore.fetchByClient();
  reconciliationStore.setLastFetchedDateKey(payload.dateKey);
};

const getDateKey = () => {
  const from = reconciliationStore.paramsByClient.date_range?.from ?? "";
  const to = reconciliationStore.paramsByClient.date_range?.to ?? "";
  return \`\${from}|\${to}\`;
};

const onRefresh = async () => {
  if (!reconciliationStore.paramsByClient.client_id) return;

  await reconciliationStore.fetchByClient();
  reconciliationStore.setLastFetchedDateKey(getDateKey());
};

async function onReconciliationUpdate(
  payload?: CashboxReconciliationUpdatePayloadType
) {
  if (!payload) return;
  await fetchIfNeeded(payload);
}
<\/script>
`;export{e as default};
