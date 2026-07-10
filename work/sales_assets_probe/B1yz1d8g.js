const n=`<template>
  <card :classes="{ header: 'justify-between' }">
    <template #header>
      <refresh-btn
        @click="onRefresh"
        :loading="reconciliationStore.isLoading"
      />

      <excel-btn
        :loading="isExporting"
        :disabled="!pivotReport"
        @click="handleExportExcel"
      />
    </template>

    <shared-pivot-table
      ref="pivotTableRef"
      class="cashbox-reconciliation-by-territory-table"
      :toolbar="false"
      :report="pivotReport"
      :loading="isLoading"
      :customize-cell="customizeCell"
    />
  </card>
</template>

<script setup lang="ts">
import type Flexmonster from "flexmonster";
import { useI18n } from "vue-i18n";
import type { PivotTableExpose } from "~/components/shared/PivotTable.vue";
import { useEventBus } from "~/composables/EventBus/eventBus";
import type { CashboxReconciliationUpdatePayloadType } from "~/interfaces/api/cashboxes/reconciliation-statement-model";
import { CashboxEventKeys } from "~/variable/event-key-constants";

// Composables
const { t } = useI18n();
const eventBus = useEventBus();
const { withTenant } = useTenantPath();

// Stores
const reconciliationStore =
  useCashboxReconciliationStatementStore("by_territory");
const libraryStore = useLibraryStore();

// States
const isLoading = ref(false);
const isExporting = ref(false);
const transactionTypes = ref<ConstantModel[]>([]);

// Child-components
const pivotTableRef = ref<PivotTableExpose | null>(null);

// Hooks
onMounted(async () => {
  const constants = await getLibConstantsByKey<ConstantModel[]>(
    "ActRevise.ByClient.ClientTransactionType"
  );
  transactionTypes.value = constants || [];
});

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

const pivotReport = computed((): Flexmonster.Report | undefined => {
  const reportData = reconciliationStore.byTerritoryData;
  if (!reportData?.columns?.length || !reportData?.rows?.length)
    return undefined;

  const columns: string[] = reportData.columns;
  const clientMapping = createMapping("client");
  const currencyMapping = createMapping("currency");

  const data = reportData.rows.map(
    (
      row: Array<
        string | number | boolean | null | string[] | Record<string, unknown>
      >
    ) => {
      const entries = columns.map((column: string, index: number) => {
        let raw = row[index];

        switch (column) {
          case "client_id":
            raw = clientMapping[row[index] as string];
            break;
          case "currency_id":
            raw = currencyMapping[row[index] as string];
            break;
          case "client_transaction_type":
            const type = transactionTypes.value.find(
              (t) => t.id === Number(row[index])
            );
            raw = type ? type.name : row[index];
            break;
        }

        const value = Array.isArray(raw) ? raw.join(", ") : raw;
        return [column, value] as const;
      });

      return Object.fromEntries(entries);
    }
  );

  return {
    dataSource: {
      data,
      mapping: {
        visual_id: {
          caption: t("cash.reconciliation.visual_id"),
        },
        client_id: {
          caption: t("column.client"),
        },
        date: {
          caption: t("column.date"),
          type: "date string",
        },
        change: {
          caption: t("cash.reconciliation.balance_changes"),
          type: "number",
        },
        converted_change: {
          caption: t(
            "cash.reconciliation.balance_changes_on_selected_currency"
          ),
          type: "number",
        },
        currency_id: {
          caption: t("reports.universal_sales_report.currency_id"),
        },
        client_transaction_type: {
          caption: t("cash.reconciliation.client_transaction_type"),
        },
      },
    },
    options: {
      grid: {
        type: "flat",
        showTotals: "off",
        showGrandTotals: "off",
      },
    },
    slice: {
      columns: [
        { uniqueName: "visual_id" },
        { uniqueName: "client_id" },
        { uniqueName: "date" },
        { uniqueName: "change" },
        { uniqueName: "converted_change" },
        { uniqueName: "currency_id" },
        { uniqueName: "client_transaction_type" },
      ],
    },
  };
});

const dataSourceGrouppedByVisualId = computed(() => {
  return pivotReport.value?.dataSource?.data?.reduce<Record<string, object>>(
    (acc, row) => {
      if ("visual_id" in row) {
        const visual_id = row["visual_id"] as string;

        acc[visual_id] = row;
      }

      return acc;
    },
    {}
  );
});

// Methods
const getLinkPathByNavigationType = (
  navigationType: number,
  navigationParameterId: string
) => {
  switch (navigationType) {
    case 1:
      return \`/orders/orders/details?\${params2query({ id: navigationParameterId })}\`;
    case 2:
      return \`/dashboard/cashbox/payment-customers/history/\${navigationParameterId}\`;
    default:
      break;
  }
};

const customizeCell = (
  cell: Flexmonster.CellBuilder,
  data: Flexmonster.CellData
) => {
  if (!(data.hierarchy && data.hierarchy.uniqueName === "visual_id")) return;

  const visual_id = data.escapedLabel;

  if (
    !visual_id ||
    !dataSourceGrouppedByVisualId.value?.[visual_id] ||
    !("navigation_type" in dataSourceGrouppedByVisualId.value[visual_id]) ||
    !(
      "navigation_parameter_id" in dataSourceGrouppedByVisualId.value[visual_id]
    )
  )
    return;

  const navigation_type = dataSourceGrouppedByVisualId.value[visual_id]
    .navigation_type as number;
  const navigation_parameter_id = dataSourceGrouppedByVisualId.value[visual_id]
    .navigation_parameter_id as string;

  const newText = \`<a
      href="\${withTenant(getLinkPathByNavigationType(navigation_type, navigation_parameter_id))}"
      target="_blank"
      class="link"
      onclick="preventExpand(event)"
    >
      \${visual_id}
    </a>\`;

  if (cell.style) {
    (cell.style as Record<string, unknown>)["z-index"] = 1;
  }
  cell.text = newText;
};

const handleExportExcel = () => {
  const flexmonster = pivotTableRef.value?.getInstance();
  if (!flexmonster) return;

  isExporting.value = true;
  flexmonster.exportTo(
    "excel",
    {
      filename:
        t("cash.reconciliation.act_reconciliation") +
        \`(\${t("cash.by_territory")})\`,
    },
    () => {
      isExporting.value = false;
    }
  );
};

const createMapping = (
  key: keyof ReportsLibraryDataModel,
  field: string = "name"
) => {
  const data = libraryStore.data?.[key];
  if (!data) return {};

  const { columns, rows } = data;
  const idIndex = columns.indexOf("id");
  const fieldIdx = columns.indexOf(field);

  if (idIndex === -1 || fieldIdx === -1) return {};

  return rows.reduce<Record<string, string | string[]>>((acc, row) => {
    const id = String(row[idIndex]).trim();
    const fieldValue = row[fieldIdx];
    acc[id] = fieldValue;

    return acc;
  }, {});
};

const fetchIfNeeded = async (
  payload: CashboxReconciliationUpdatePayloadType
) => {
  if (payload.type !== "by_territory") return;
  if (payload.disabled) return;

  if (
    !payload.force &&
    reconciliationStore.lastFetchedDateKey === payload.dateKey
  )
    return;

  reconciliationStore.paramsByTerritory.date_range!.from =
    payload.params.date_range!.from;
  reconciliationStore.paramsByTerritory.date_range!.to =
    payload.params.date_range!.to;
  reconciliationStore.paramsByTerritory.supervisor_ids =
    payload.params.supervisor_ids;
  reconciliationStore.paramsByTerritory.expeditor_ids =
    payload.params.expeditor_ids;
  reconciliationStore.paramsByTerritory.agent_ids = payload.params.agent_ids;
  reconciliationStore.paramsByTerritory.client_category_ids =
    payload.params.client_category_ids;
  reconciliationStore.paramsByTerritory.territory_ids =
    payload.params.territory_ids;
  reconciliationStore.paramsByTerritory.currency_ids =
    payload.params.currency_ids;
  reconciliationStore.paramsByTerritory.client_transaction_types =
    payload.params.client_transaction_types || [];

  await reconciliationStore.fetchByTerritory();
  reconciliationStore.setLastFetchedDateKey(payload.dateKey);
};

const getDateKey = () => {
  const from = reconciliationStore.paramsByTerritory.date_range?.from ?? "";
  const to = reconciliationStore.paramsByTerritory.date_range?.to ?? "";
  return \`\${from}|\${to}\`;
};

const onRefresh = async () => {
  await reconciliationStore.fetchByTerritory();
  reconciliationStore.setLastFetchedDateKey(getDateKey());
};

async function onReconciliationUpdate(
  payload?: CashboxReconciliationUpdatePayloadType
) {
  if (!payload) return;
  await fetchIfNeeded(payload);
}
<\/script>

<style>
.cashbox-reconciliation-by-territory-table .link {
  color: theme("colors.primary.600") !important;
  text-decoration: underline !important;
  cursor: pointer;
}
</style>
`;export{n as default};
