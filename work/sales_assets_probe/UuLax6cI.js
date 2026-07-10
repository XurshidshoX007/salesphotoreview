const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <div class="table-content-btn-group">
        <table-sort-columns
          :templates="suppliersReconciliationStore.headers"
          :save-key="suppliersReconciliation"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="suppliersReconciliationStore.headers"
          :save-key="suppliersReconciliation"
        />
        <page-size-btn
          :current-size="suppliersReconciliationStore.tableParams.page_size"
          :total-count="suppliersReconciliationStore.data?.total_count"
          :page-number="suppliersReconciliationStore.data?.page_number"
          @setPageSize="suppliersReconciliationStore.setPageSize"
        />
        <search-input
          :value="suppliersReconciliationStore.tableParams.search"
          @change="suppliersReconciliationStore.onSearch"
        />
        <excel-btn
          :loading="suppliersReconciliationStore.isExcelFileDownloading"
          @click="suppliersReconciliationStore.downloadExcelFile"
        />
        <RefreshBtn
          @click="suppliersReconciliationStore.refresh"
          :loading="suppliersReconciliationStore.isLoading"
        />
      </div>
    </div>
    <div
      class="table-content-body"
      :class="{ 'reconciliation-table': !hasDataCurrentPeriod }"
    >
      <data-table
        :headers="suppliersReconciliationStore.headers"
        :sorted="suppliersReconciliationStore.tableParams.order_by"
        :loading="suppliersReconciliationStore.isLoading"
        :isEmpty="isEmpty"
        @sort="suppliersReconciliationStore.sortData"
      >
        <template #body>
          <!-- Beginning period summary row -->
          <c-tr
            v-if="summaryData?.beginning_period_summary"
            class="summary-row border-bottom-0"
            :style="!hasDataCurrentPeriod && \`border-bottom:none\`"
          >
            <c-td-no-edit
              v-for="key in suppliersReconciliationStore.headers"
              :key="key.key"
              :type="key.type"
            >
              <div v-if="key.key === 'date'">
                {{ t("suppliers.reconciliation.beginning_period") }}
              </div>
              <div v-else-if="key.key === 'type'">
                {{ t("suppliers.reconciliation.balance_start") }}
              </div>
              <div v-else-if="key.key === 'debt'">
                {{
                  getFormattedAmount(summaryData.beginning_period_summary.debt)
                }}
              </div>
              <div v-else-if="key.key === 'credit'">
                {{
                  getFormattedAmount(
                    summaryData.beginning_period_summary.credit,
                  )
                }}
              </div>
              <div
                v-else-if="
                  key.key === 'balance' &&
                  summaryData.beginning_period_summary.balance
                "
              >
                {{
                  getFormattedAmount(
                    summaryData.beginning_period_summary.balance.amount,
                  )
                }}
              </div>
            </c-td-no-edit>
          </c-tr>

          <!-- Regular data rows -->
          <template
            v-for="data in suppliersReconciliationStore.data?.items"
            :key="data.visual_id"
          >
            <c-tr>
              <c-td-no-edit
                v-for="key in suppliersReconciliationStore.headers"
                :key="key.key"
                :type="key.type"
              >
                <div v-if="key.type === 'date'">
                  {{ getFormattedDate(getDataValue(data, key.key)) }}
                </div>
                <div v-else-if="key.type === 'object'">
                  <div v-if="key.key === 'type'">
                    <LinkComponent
                      non-copyable
                      :value="getDataValue(data, key.key)?.name"
                      @click="
                        getDetailByObjType(data.object_type, data.object_id)
                      "
                    />
                  </div>
                  <div v-else>
                    {{
                      key.accessorKey
                        ? getNestedValue(data, key.accessorKey, key?.innerType)
                        : getDataValue(data, key.key)?.name
                    }}
                  </div>
                </div>
                <div v-else-if="key.type === 'number'">
                  {{ getFormattedAmount(getDataValue(data, key.key)) }}
                </div>
                <div v-else>
                  {{ getDataValue(data, key.key) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </template>
        <template
          #footer
          v-if="!isEmpty && summaryData?.current_period_summary?.length"
        >
          <!-- Turnover row -->
          <c-tr class="summary-row">
            <c-td-no-edit
              v-for="key in suppliersReconciliationStore.headers"
              :key="key.key"
              :type="key.type"
            >
              <div v-if="key.key === 'date'">
                {{ t("suppliers.reconciliation.turnover") }}
              </div>
              <div v-else-if="key.key === 'debt'">
                {{ getTotalValue(summaryData.current_period_summary, "debt") }}
              </div>
              <div v-else-if="key.key === 'credit'">
                {{
                  getTotalValue(summaryData.current_period_summary, "credit")
                }}
              </div>
            </c-td-no-edit>
          </c-tr>

          <!-- Total row -->
          <c-tr class="summary-row">
            <c-td-no-edit
              v-for="key in suppliersReconciliationStore.headers"
              :key="key.key"
              :type="key.type"
            >
              <div v-if="key.key === 'date'">
                {{ t("suppliers.reconciliation.total") }}
              </div>
              <div v-else-if="key.key === 'debt'">
                {{ getTotalValue(summaryData.current_period_summary, "debt") }}
              </div>
              <div v-else-if="key.key === 'credit'">
                {{
                  getTotalValue(summaryData.current_period_summary, "credit")
                }}
              </div>
              <div v-else></div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
    <div v-if="isTabFooter" class="table-content-footer">
      <curren-page-btn
        :current-size="suppliersReconciliationStore.tableParams.page_size"
        :total-count="suppliersReconciliationStore.data?.total_count"
        :page-number="suppliersReconciliationStore.data?.page_number"
      />
      <page-index
        :available-pages="suppliersReconciliationStore.data?.total_pages"
        :current-page="suppliersReconciliationStore.data?.page_number"
        @setPage="suppliersReconciliationStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="detailInfo.id && detailInfo.component">
      <component
        :is="detailInfo.component"
        :id="detailInfo.id"
        @closeDialog="closeDetailDialog"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { suppliersReconciliation } from "~/variable/column-constants";
import { getFormattedDate } from "~/utils/formatters";
import { getNestedValue } from "~/utils/helpers";
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";
import type { ReconciliationListItemModel } from "~/interfaces/api/supplier/reconciliation-models";
import type { Template } from "~/interfaces/ui/template";

// stores
const suppliersReconciliationStore = useSuppliersReconciliationStore("main");

// states
const { t } = useI18n();
const router = useRouter();

const detailInfo = reactive<{
  id: string | null;
  component: ReturnType<typeof defineAsyncComponent> | null;
}>({
  id: null,
  component: null,
});

// hooks
const isEmpty = computed(() => {
  return (
    !suppliersReconciliationStore.data?.items?.length &&
    !summaryData.value?.beginning_period_summary
  );
});

const hasDataCurrentPeriod = computed(() => {
  return !isEmpty.value && summaryData.value?.current_period_summary?.length;
});

const summaryData = computed(() => {
  return suppliersReconciliationStore.summaryData;
});

// methods
const getDataValue = (data: ReconciliationListItemModel, key: string) => {
  return (data as any)[key];
};

const getDetailByObjType = (
  objectTypeId: number,
  objectId: string,
):
  | void
  | {
      to: string;
      query?: Record<string, string>;
    }
  | string => {
  switch (objectTypeId) {
    case 1: // PaymentIncome
      detailInfo.id = objectId;
      detailInfo.component = defineAsyncComponent(
        () =>
          import(
            "~~/components/dashboard/cashbox/payment-customers/DetailDialog.vue"
          ),
      );
      break;
    case 2: // PaymentExpense
      detailInfo.id = objectId;
      detailInfo.component = defineAsyncComponent(
        () => import("~~/components/suppliers/payments/DetailDialog.vue"),
      );
      break;
    case 3: // Order
      router.push({
        path: "/orders/orders/details",
        query: { id: objectId },
      });
      return;
    // case 6: // OtherIncomePayment
    //   return \`/payments/other-income/\${objectId}\`;
    // case 7: // OtherExpensePayment
    //   return \`/payments/other-expense/\${objectId}\`;
    // case 8: // IncomingProductPack
    //   return \`/products/incoming-product-pack/\${objectId}\`;
    // case 9: // Supplier
    //   return \`/suppliers/\${objectId}\`;
    default:
      return "";
  }
};

const getTotalValue = (items: any[], key: string): number => {
  const total = items.reduce((sum: number, item: any) => {
    return sum + (typeof item[key] === "number" ? item[key] : 0);
  }, 0);
  return getFormattedAmount(total as number) as number;
};

const onChangeTableHeaders = (newValue: Template[]) => {
  suppliersReconciliationStore.headers = newValue;
};

const closeDetailDialog = () => {
  detailInfo.id = null;
  detailInfo.component = null;
};
<\/script>

<style scoped>
:deep(.summary-row div) {
  font-weight: 600;
}

.reconciliation-table {
  padding-bottom: 0 !important;
}
</style>
`;export{e as default};
