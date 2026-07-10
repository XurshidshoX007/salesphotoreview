const e=`<template>
  <div class="table-content-container min-w-0 w-full p-4">
    <div class="table-content-header flex items-center justify-between !px-0">
      <div class="flex items-center gap-3">
        <MBtn
          group="outlined"
          class="!p-[9px] !bg-white"
          @click="onToggleExpandAll"
        >
          <IconAnimatedExpandCollapse
            :size="20"
            :state="isAllExpanded ? 'expanded' : 'collapsed'"
          />
        </MBtn>
        <RefreshBtn
          :loading="cashFlowStore.isLoading"
          @click="cashFlowStore.refresh"
        />
      </div>
      <ExcelBtn @click="downloadExcelFile" />
    </div>
    <div
      class="table-content-body !pb-0 cash-flow-table rounded-large overflow-auto bg-white min-w-0 border border-neutral-200"
    >
      <data-table
        :headers="cashFlowStore.headers"
        :loading="cashFlowStore.isLoading"
        :is-empty="!tableData?.length"
        with-information-above-header
      >
        <template #body>
          <template v-for="(item, index) in tableData" :key="index">
            <DashboardCashboxCashFlowTableRow
              :item="item"
              :headers="cashFlowStore.headers"
            />
          </template>
        </template>
      </data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type {
  CashFlowModel,
  FlowStatementModel,
  PeriodBalancesModel,
  TableRowItem,
} from "~/interfaces/api/cashbox/cash-flow-model";
import type { GenericObject } from "~/interfaces/ui";
import type { Template } from "~/interfaces/ui/template";

// Stores
const cashFlowStore = useCashFlowStore("main");

// states
const { t } = useI18n();

const tableData = computed(() =>
  cashFlowStore.data ? transformRowData(cashFlowStore.data) : [],
);

const setAllExpanded = (items: TableRowItem[], value: boolean) => {
  for (const item of items) {
    if (item.hasChildren) item.isExpanded = value;
    if (item.children?.length) setAllExpanded(item.children, value);
  }
};

const isAllExpanded = computed(() => {
  const check = (items: TableRowItem[]): boolean => {
    for (const item of items) {
      if (item.hasChildren && !item.isExpanded) return false;
      if (item.children?.length && !check(item.children)) return false;
    }
    return true;
  };
  return tableData.value.length > 0 && check(tableData.value);
});

const onToggleExpandAll = () => {
  setAllExpanded(tableData.value, !isAllExpanded.value);
};

// hooks
const transformRowData = (data: CashFlowModel): TableRowItem[] => {
  const transformedData: TableRowItem[] = [];

  const rowNames = {
    beginning_period_balances: t("cash.cash_flow.beginning_period_balances"),
    end_period_balances: t("cash.cash_flow.end_period_balances"),
    expense_statement_flow: t("cash.expenses"),
    income_statement_flow: t("cash.other_cash_receipts"),
  };

  const bgColors = {
    beginning_period_balances: "bg-neutral-50",
    end_period_balances: "bg-neutral-50",
    income_statement_flow: "bg-green-50",
    expense_statement_flow: "bg-red-50",
  };

  const txtColors = {
    income_statement_flow: "text-green-500",
    expense_statement_flow: "text-red-500",
  };

  const createTransformedRow = (
    item: PeriodBalancesModel | FlowStatementModel,
    key?: string,
  ): TableRowItem => {
    const pmAmounts =
      "payment_method_amounts" in item
        ? (item as FlowStatementModel).payment_method_amounts
        : (item as unknown as { [key: string]: any });

    const hasChildren =
      "children" in item &&
      Array.isArray((item as any).children) &&
      (item as any).children.length > 0;

    return reactive({
      name:
        "name" in item
          ? (item as any).name
          : key
            ? rowNames[key as keyof typeof rowNames]
            : "",
      total_amounts_by_payment_method: pmAmounts,
      total_amount: getTotalAmount(Object.values(pmAmounts || {})),
      hasChildren,
      isExpanded: false,
      children: hasChildren
        ? transformRowData((item as any).children)
        : undefined,
      bgColor: bgColors[key as keyof typeof bgColors] || undefined,
      textColor: txtColors[key as keyof typeof txtColors] || undefined,
      isBold:
        key === "end_period_balances" || key === "beginning_period_balances",
    } as unknown as TableRowItem);
  };

  // Handle both object and array cases
  const items = Array.isArray(data) ? data : Object.entries(data || {});

  for (const entry of items) {
    const [key, item] = Array.isArray(data) ? [undefined, entry] : entry;
    if (!item) continue;

    transformedData.push(createTransformedRow(item, key));
  }

  return transformedData;
};

const getTotalAmount = (paymentMethods: any[] | any): number => {
  if (!paymentMethods) return 0;

  if (Array.isArray(paymentMethods)) {
    return paymentMethods.reduce((total, method) => {
      return total + method?.amount || 0;
    }, 0);
  }

  if (typeof paymentMethods === "object") {
    return Object.values(paymentMethods).reduce(
      (total: number, method: any) => {
        return total + method?.amount || 0;
      },
      0,
    );
  }

  return 0;
};

const transformExcelData = (data: GenericObject[], headers: Template[]) => {
  const result: GenericObject[] = [];
  const recurse = (items: GenericObject[], depth: number = 0) => {
    for (const item of items) {
      const row: GenericObject = {};

      for (const hh of headers) {
        switch (hh.key) {
          case "category":
            const indent = "    ".repeat(depth);
            row[hh.key] = \`\${indent}\${item.name}\`;
            break;
          case "total":
            row[hh.key] = item.total_amount;
            break;
          default:
            const amount = item.total_amounts_by_payment_method?.find(
              (el: any) => el.payment_method_id === hh.key,
            );
            row[hh.key] = amount?.converted_amount ?? amount?.amount;
            break;
        }
      }

      result.push(row);

      if (item.hasChildren && Array.isArray(item.children)) {
        recurse(item.children, depth + 1);
      }
    }
  };

  recurse(data);
  return result;
};

const downloadExcelFile = () => {
  if (!tableData.value?.length) return;
  const headers = [...cashFlowStore.headers];
  const header = headers.reduce(
    (acc, item) => {
      acc[item.key] = item.name;
      return acc;
    },
    {} as Record<string, string>,
  );
  const excelData = transformExcelData(tableData.value, headers);
  excelData.unshift(header);

  downloadLocalExcelFile({
    headers: headers,
    data: excelData,
    title: \`cash-flow-report-\${getFormattedDate(
      new Date().toISOString(),
      "DD-MM-YYYY",
    )}\`,
  });
};
<\/script>

<style scoped></style>
`;export{e as default};
