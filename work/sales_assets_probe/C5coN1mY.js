const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :templates="supervisorStore?.headers"
          :save-key="dashboardSalesAgentHeader"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="supervisorStore?.headers"
          :save-key="dashboardSalesAgentHeader"
        />
        <page-size-btn
          :current-size="params.page_size"
          @setPageSize="setPageSize"
        />
        <search-input @change="search" />

        <excel-btn
          @click="supervisorStore.onDownloadExcelFile(params)"
          :loading="supervisorStore.isExcelFileDownloading"
        />

        <RefreshBtn @click="refresh" :loading="supervisorStore?.isLoading" />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="supervisorStore?.headers"
          :is-empty="!supervisorStore.data?.items?.length"
          :loading="supervisorStore?.isLoading"
          :sorted="params?.order_by"
          @sort="sortData"
        >
          <template #body>
            <template
              v-for="(data, index) in supervisorStore?.data?.items"
              :key="index"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in supervisorStore?.headers"
                  :key="key"
                  :is-checked="key.checked"
                  :type="key.type"
                >
                  <div v-if="key.key === 'agent_name'">
                    {{ data["agent"]?.name }}
                  </div>
                  <div
                    v-else-if="key.key === 'photo_report_uploaded_client_count'"
                    class="float-right w-40"
                  >
                    <tooltip position="left" :tooltip="data?.agent?.name">
                      <link-component
                        @click="agentPhotoDialogOpen(data?.agent)"
                        :value="\`\${data[key.key]} T.T. (\${
                          data?.uploaded_photo_report_count
                        } \${t('dashboard.supervisor.image')}) \`"
                        nonCopyable
                      />
                    </tooltip>
                  </div>
                  <div v-else-if="key.key === 'total_order_amount'">
                    {{ getFormattedAmount(data[key.key]?.amount) }}
                  </div>
                  <div v-else-if="key.type === 'number'">
                    {{ getFormattedAmount(data[key.key]) }}
                  </div>
                  <div v-else>
                    {{ data[key.key] }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </template>
          <template #footer>
            <tr
              v-if="supervisorStore.dataTotal"
              class="border-b-1 bg-neutral-50"
            >
              <c-td-no-edit
                v-for="total in supervisorStore.headers"
                :is-checked="total.checked"
              >
                <div
                  v-if="total.key === 'total_order_amount'"
                  class="fs-14 fw-6 text-black text-end"
                >
                  {{
                    getFormattedAmount(
                      supervisorStore.dataTotal[total.key]?.amount,
                    )
                  }}
                </div>
                <div
                  v-else-if="total.key === 'agent_name'"
                  class="fs-14 fw-6 text-black"
                >
                  Общий
                </div>
                <div v-else-if="total.key === 'agent_code'"></div>
                <div v-else class="fs-14 fw-6 text-black text-end">
                  {{ getFormattedAmount(supervisorStore.dataTotal[total.key]) }}
                </div>
              </c-td-no-edit>
            </tr>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="params?.page_size"
          :page-number="supervisorStore?.data?.page_number"
          :total-count="supervisorStore?.data?.total_count"
        />
        <page-index
          :available-pages="supervisorStore?.data?.total_pages"
          :current-page="supervisorStore?.data?.page_number"
          @setPage="setPage"
        />
      </div>
    </div>
  </div>
  <transition name="modal">
    <div v-if="photoIsActive">
      <DashboardSupervisorAgentsPhotoDialog
        :id="photoIsActive"
        :modal-name="agentFullNameForPhotoDialog"
        @closeDialog="closePhotoModal"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getFormattedAmount } from "~/utils/filter";
import type { UnwrapNestedRefs } from "@vue/reactivity";
import type { ListParams } from "~/interfaces/api/params/list-parameters";
import {
  dashboardPageSizeConst,
  dashboardSalesAgentHeader,
} from "~/variable/column-constants";

// store
const supervisorStore = useSupervisorStore("main");

// State
const { t } = useI18n();
const photoIsActive = ref<string | null>(null);
const agentFullNameForPhotoDialog = ref<string | null>(null);
const isDataFetching = ref<boolean>(false);
let params: UnwrapNestedRefs<ListParams> = reactive({
  page: 1,
  page_size: getPageSizeByKey(dashboardPageSizeConst) || 10,
  search: null,
  order_by: {
    field: "agent_name",
    is_asc: true,
  },
});
//props
const props = defineProps({
  params: Object,
});

// methods
const closePhotoModal = () => {
  photoIsActive.value = null;
  agentFullNameForPhotoDialog.value = null;
};

const agentPhotoDialogOpen = (agent: { id: string; name: string }) => {
  photoIsActive.value = agent?.id;
  agentFullNameForPhotoDialog.value = \`\${t("photo_report")}: \${agent?.name}\`;
};

const refresh = async () => {
  await getData();
};

const setPage = (page: number) => {
  params.page = page;
};

const setPageSize = (pageSize: number) => {
  setPageSizeByKey(dashboardPageSizeConst, pageSize);
  params.page = 1;
  params.page_size = pageSize;
};

const sortData = (data: any) => {
  params.order_by = data;
};

const search = (value: string) => {
  params.page = 1;
  params.search = value;
};

const getData = async () => {
  await supervisorStore.refresh({ ...props.params, ...params });
};

const onChangeTableHeaders = (newValue) => {
  supervisorStore.headers = newValue;
};

onMounted(async () => {
  if (props.params) {
    supervisorStore.filterParams = props.params;
    await getData();
  }
});

watch(params, async () => {
  await supervisorStore._loadData({ ...props.params, ...params });
});

watch(
  () => props.params,
  async (newParams, oldParams) => {
    if (newParams) {
      supervisorStore.filterParams = newParams;
      if (!isDataFetching.value) {
        isDataFetching.value = true;
        try {
          await getData();
        } finally {
          isDataFetching.value = false;
        }
      }
    }
  },
  { deep: true },
);
<\/script>
`;export{e as default};
