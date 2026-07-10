const e=`<template>
  <d-modal
    :name="modalName"
    dataContainerWidth="80%"
    @closeDialog="closeDialog"
  >
    <div class="w-full">
      <div class="w-full overflow-auto">
        <div class="flex gap-4.5 mb-5">
          <div
            v-show="_totals?.length"
            v-for="total in _totals"
            :key="total.name"
            class="w-fit rounded-large py-2 px-5.5"
            :style="{ background: total.hex_color }"
          >
            {{ total?.name }}:
            <span class="font-semibold text-xl"> {{ total.amount }} </span>
          </div>
        </div>
        <div class="table-content-container">
          <div class="table-content-header">
            <table-sort-columns />
            <ShowHideColumn :headers="headers" />
            <page-size-btn
              :current-size="params.page_size"
              :total-count="dataByAgentId?.total_count"
              :page-number="dataByAgentId?.page_number"
              @setPageSize="setPageSize"
            />
            <search-input @change="onSearch" />
          </div>
          <div class="table-content-body">
            <data-table
              :headers="headers"
              :sorted="params.order_by"
              :loading="ordersByAgentsStore.isOrdersByIdLoading"
              :isEmpty="isTableEmpty"
              @sort="onSortData"
            >
              <template #body>
                <template
                  v-for="(data, index) in dataByAgentId?.items"
                  :key="index"
                >
                  <c-tr>
                    <c-td-no-edit
                      v-for="key in headers"
                      :key="key"
                      :is-checked="key.checked"
                      :type="key.type"
                    >
                      <div v-if="key.type === 'number'">
                        {{ getFormattedAmount(data[key.key]) }}
                      </div>
                      <div v-else-if="key.type === 'date'">
                        {{ getFormattedDate(data[key.key]) }}
                      </div>
                      <div v-else>
                        {{ data[key.key] }}
                      </div>
                    </c-td-no-edit>
                  </c-tr>
                </template>
              </template>
            </data-table>
          </div>
          <div class="table-content-footer">
            <curren-page-btn
              :current-size="params.page_size"
              :total-count="dataByAgentId?.total_count"
              :page-number="dataByAgentId?.page_number"
            />
            <page-index
              :available-pages="dataByAgentId?.total_pages"
              :current-page="dataByAgentId?.page_number"
              @setPage="setPage"
            />
          </div>
        </div>
      </div>
    </div>
  </d-modal>
</template>

<script setup lang="ts">
import type { AppResponse } from "~/interfaces/api/response/app-response";
import type { Template } from "~/interfaces/ui/template";
import type { ReportsOrderListModel } from "~/interfaces/api/reports/orders-by-agents/order-list-model";
import type {
  ListParams,
  ReportsOrdersByAgentsParams,
} from "~/interfaces/api/params/list-parameters";
import type { ReportsTotalsByStatusModel } from "~/interfaces/api/reports/orders-by-agents/totals-by-status-model";
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";

// Store
const ordersByAgentsStore = useOrdersByAgentsStore("main");

// props
const props = defineProps<{
  dialogInfo: Record<"id" | "statusKey", string>;
  modalName: String;
}>();

// emits
const emit = defineEmits(["closeDialog"]);

const statusId = computed(() => {
  switch (props.dialogInfo.statusKey) {
    case "new_order_value":
      return 1;
    case "canceled_order_value":
      return 2;
    case "accepted_to_ship_value":
      return 3;
    case "shipped_order_value":
      return 4;
    case "delivered_order_value":
      return 5;
    case "pending_return_order_value":
      return 6;
    case "returned_order_value":
      return 7;
  }
  return null;
});

// states
const { t } = useI18n();
const dataByAgentId = ref<AppResponse<ReportsOrderListModel>>();
const totals = ref<ReportsTotalsByStatusModel>();

const params = reactive<ReportsOrdersByAgentsParams & ListParams>({
  ...ordersByAgentsStore.commonParams,
  order_by: {
    field: "order_date",
    is_asc: true,
  },
  agent_id_arr: [props.dialogInfo.id || ""],
  order_status_arr: statusId.value ? [statusId.value] : [],
  result_value_type: ordersByAgentsStore.tableParams?.result_value_type || 3,
  page: 1,
  page_size: 10,
  search: "",
  filter: [
    {
      field: "is_active",
      value: ["true"],
    },
  ],
});

const headers = ref<Template[]>([
  {
    name: t("column.order_date"),
    checked: true,
    key: "order_date",
    type: "date",
  },
  {
    name: t("column.shipped_date"),
    checked: true,
    key: "shipped_date",
    type: "date",
  },
  {
    name: t("column.client"),
    checked: true,
    key: "client_name",
  },
  {
    name: t("column.quantity"),
    checked: true,
    key: "total_count",
    type: "number",
  },
  {
    name: t("column.sum"),
    checked: true,
    key: "total_cost",
    type: "number",
  },
  {
    name: t("settings_sidebar.payment_method"),
    checked: true,
    key: "price_type_name",
  },
  {
    name: t("column.status"),
    checked: true,
    key: "status_name",
  },
]);

// hooks
onMounted(
  async () => await Promise.all([getDataByAgentId(), getTotalsByAgentId()]),
);

watch(params, async () => {
  await getDataByAgentId();
});

const _totals = computed(() => {
  if (!totals.value) return [];
  return [
    {
      name: t("column.sum"),
      amount: getFormattedAmount(totals.value?.cost),
      hex_color: "#E3FCF0",
    },
    {
      name: t("column.volume"),
      amount: getFormattedAmount(totals.value?.volume),
      hex_color: "#F5E8FF",
    },
    {
      name: t("reports.akb"),
      amount: getFormattedAmount(totals.value?.akb_count),
      hex_color: "#E3E7FC",
    },
  ];
});

const isTableEmpty = computed(() => !!!dataByAgentId.value?.items?.length);

// methods
const setPage = (page: number) => {
  params.page = page;
};

const setPageSize = (pageSize: number) => {
  params.page_size = pageSize;
  params.page = 1;
};

const getDataByAgentId = async () => {
  dataByAgentId.value = await ordersByAgentsStore.getOrderListByAgentId(params);
};

const getTotalsByAgentId = async () => {
  totals.value = await ordersByAgentsStore.getOrderTotalsByAgentId(params);
};

const onSearch = (value: string) => (params.search = value);

const onSortData = (newOrder: { field: string; is_asc: boolean } | null) => {
  if (newOrder?.field === "status_name") newOrder.field = "status_id";
  params.order_by = newOrder;
};

const closeDialog = () => emit("closeDialog");
<\/script>
`;export{e as default};
