const n=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <div class="flex gap-4 w-full">
        <page-title
          :title="t('dashboard.plan_fact.acb_by_branch_trade_direction')"
          size="xl"
          class="w-full"
        />

        <RefreshBtn :loading="loading" @click="emit('refresh')" />
      </div>
    </div>

    <div class="p-4 pt-0">
      <div class="table-content-body border rounded-lg">
        <data-table
          with-information-above-header
          :headers="columns"
          :is-empty="!data?.items?.length"
          :loading="loading"
        >
          <template #body>
            <c-tr
              v-for="(item, index) in data?.items"
              :key="item.branch?.id ?? index"
            >
              <c-td-no-edit
                v-for="(col, colIndex) in columns"
                :key="col.key"
                :is-checked="col.checked"
                :custom-style="
                  getCellStyle(
                    col.key === 'total'
                      ? item.total
                      : getListValue(item, col.key),
                  )
                "
              >
                <!-- First column: branch name -->
                <div v-if="colIndex === 0">
                  {{ item.branch?.name }}
                </div>
                <!-- Total column -->
                <div
                  v-else-if="col.key === 'total'"
                  class="text-end whitespace-nowrap"
                >
                  {{ getFormattedAmount(item.total?.acb ?? 0) }} /
                  <span class="text-green-600">
                    {{ getFormattedAmount(item.total?.tcb ?? 0) }}
                  </span>
                </div>

                <div v-else class="text-end whitespace-nowrap">
                  {{
                    getFormattedAmount(getListValue(item, col.key)?.acb ?? 0)
                  }}
                  /
                  <span class="text-green-600">
                    {{
                      getFormattedAmount(getListValue(item, col.key)?.tcb ?? 0)
                    }}
                  </span>
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>

          <template v-if="data?.total" #footer>
            <c-tr class="bg-neutral-50 border-b-0">
              <c-td-no-edit
                v-for="(col, colIndex) in columns"
                :key="col.key"
                :is-checked="col.checked"
                :custom-style="
                  getCellStyle(
                    col.key === 'total'
                      ? data.total.total
                      : getListValue(data.total, col.key),
                  )
                "
              >
                <div v-if="colIndex === 0" class="fw-6 fs-14">
                  {{ t("column.total") }}
                </div>

                <div
                  v-else-if="col.key === 'total'"
                  class="text-end whitespace-nowrap fw-6 fs-14"
                >
                  {{ getFormattedAmount(data.total.total?.acb ?? 0) }} /
                  <span class="text-green-600">
                    {{ getFormattedAmount(data.total.total?.tcb ?? 0) }}
                  </span>
                </div>
                <div v-else class="text-end whitespace-nowrap fw-6 fs-14">
                  {{
                    getFormattedAmount(
                      getListValue(data.total, col.key)?.acb ?? 0,
                    )
                  }}
                  /
                  <span class="text-green-600">
                    {{
                      getFormattedAmount(
                        getListValue(data.total, col.key)?.tcb ?? 0,
                      )
                    }}
                  </span>
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { Template } from "~/interfaces/ui/template";
import type { ACBByBranchTradeDirectionReportModel } from "~/interfaces/api/dashboard/plan-task/acb-by-branch-trade-direction-report-model";
import { getFormattedAmount } from "~/utils/filter";

const props = defineProps<{
  data?: ACBByBranchTradeDirectionReportModel;
  loading: boolean;
}>();

const emit = defineEmits<{ (e: "refresh"): void }>();

const { t } = useI18n();

type AcbTcb = { acb: number; tcb: number };

// Shared row type — matches both items[n] and root total
type BranchRow = {
  list: { key: { id: string; name: string }; value: AcbTcb }[];
};

// All branches share the same trade direction list — take columns from the first item
const columns = computed<Template[]>(() => {
  const directionCols: Template[] = (props.data?.items?.[0]?.list ?? [])
    .filter((entry) => entry.key != null)
    .map((entry) => ({
      name: entry.key.name,
      key: entry.key.id,
      checked: true,
      type: "number" as const,
      right: true,
      is_sortable: false,
    }));

  return [
    {
      name: t("dashboard.plan_fact.portfolios"),
      key: "branch.name",
      checked: true,
    },
    ...directionCols,
    {
      name: t("column.total"),
      key: "total",
      checked: true,
      type: "number",
      right: true,
      is_sortable: false,
    },
  ];
});

const getListValue = (item: BranchRow, keyId: string): AcbTcb | undefined => {
  return item.list.find((entry) => entry.key?.id === keyId)?.value;
};

const getCellStyle = (value?: AcbTcb): Record<string, string> => {
  if (!value || value.tcb === 0) return {};

  const ratio = Math.min(value.acb / value.tcb, 1);
  const opacity = Math.round(ratio * 100) / 100;

  return {
    backgroundColor: \`rgba(34, 197, 94, \${opacity * 0.6})\`,
    padding: "10px",
  };
};
<\/script>

<style scoped>
.table-content-body {
  padding-bottom: 0;
}
</style>
`;export{n as default};
