const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header justify-between">
        <div class="table-content-btn-group">
          <table-sort-columns
            :templates="supervisorCategoryGroupHeaders"
            :save-key="dashboardSupervisorsByProductGroupHeader"
            @onChangeTableHeaders="onChangeTableHeaders"
          />
          <ShowHideColumn
            :headers="supervisorCategoryGroupHeaders"
            :save-key="dashboardSupervisorsByProductGroupHeader"
          />

          <search-input @change="supervisorByProductCategoryStore.search" />

          <excel-btn
            @click="
              supervisorByProductCategoryStore.onDownloadExcelFile(params)
            "
            :loading="supervisorByProductCategoryStore.isExcelFileDownloading"
          />

          <RefreshBtn
            @click="refresh"
            :loading="supervisorByProductCategoryStore?.isLoading"
          />
        </div>
      </div>
      <div class="table-content-body">
        <data-table
          :headers="supervisorCategoryGroupHeaders"
          :is-empty="!supervisorByProductCategoryStore.data?.items?.length"
          :loading="supervisorByProductCategoryStore?.isLoading"
          :sorted="supervisorByProductCategoryStore.params.order_by"
          @sort="supervisorByProductCategoryStore.sortData"
        >
          <template #body>
            <template
              v-for="(data, index) in supervisorByProductCategoryStore?.data
                ?.items"
              :key="index"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in supervisorCategoryGroupHeaders"
                  :key="key"
                  :is-checked="key.checked"
                  :class="key?.borderX && 'border-r-1'"
                  :type="key.type"
                >
                  <div v-if="key.key === 'grouping_item'">
                    {{ data["grouping_item"]?.name }}
                  </div>
                  <div v-else-if="key.type === 'number'">
                    {{ getFormattedAmount(data[key.key]) }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </template>
          <template #footer>
            <c-tr
              v-if="supervisorByProductCategoryStore.data?.items?.length"
              class="bg-neutral-50 border-none"
            >
              <c-td-no-edit
                v-for="key in supervisorCategoryGroupHeaders"
                :key="key.name"
                :is-checked="key.checked"
                :class="key.borderX && 'border-r-1'"
                :type="key.type"
              >
                <div v-if="key.key === 'grouping_item'" class="fw-6 fs-14">
                  {{ t("column.total") }}
                </div>
                <div v-else class="fw-6 fs-14">
                  {{
                    getFormattedAmount(
                      supervisorByProductCategoryStore?.data.total[key.key],
                    )
                  }}
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
import { getFormattedAmount } from "~/utils/filter";
import { dashboardSupervisorsByProductGroupHeader } from "~/variable/column-constants";

// store
const supervisorByProductCategoryStore =
  useDashboardProductCategoryGroupStore("main");

//emit

const emit = defineEmits([
  "changeTitle",
  "getGroupFilterType",
  "getTableLoading",
]); // emit

//props
const props = defineProps({
  params: Object,
  groupTypeId: Number,
  resultGroupFilterType: Object,
});

// State
const { t } = useI18n();

// methods

const refresh = () => {
  supervisorByProductCategoryStore.refresh();
};
const onChangeTableHeaders = (newValue) => {
  supervisorByProductCategoryStore.headers = newValue;
};

const supervisorCategoryGroupHeaders = computed(() => {
  const { headers, params } = supervisorByProductCategoryStore;

  if (!headers?.length) {
    return [];
  }

  const newHeaders = [
    {
      ...headers[0],
      name: checkConstName(params.result_group_filter_type),
    },
    ...(headers.slice(1, 5) || []),
  ];
  emit(
    "changeTitle",
    checkConstName(
      supervisorByProductCategoryStore.params.result_group_filter_type,
    ),
  );
  return newHeaders;
});

const checkConstName = (id: number) => {
  if (id) {
    return supervisorByProductCategoryStore.resultGroupFilterType?.items?.find(
      (item) => item.id === id,
    )?.name;
  }
};

onMounted(async () => {
  await supervisorByProductCategoryStore.getResultGroupFilterType();
  emit(
    "getGroupFilterType",
    supervisorByProductCategoryStore.resultGroupFilterType,
  );
});

const isRefreshing = ref(false);

watch(
  () => props.params,
  async (newParams, oldParams) => {
    if (isRefreshing.value) return;

    isRefreshing.value = true;
    try {
      supervisorByProductCategoryStore.params = {
        ...supervisorByProductCategoryStore.params,
        ...newParams,
      };
      await supervisorByProductCategoryStore.refresh();
      // await supervisorByProductCategoryStore.getChartData();
    } finally {
      isRefreshing.value = false;
    }
  },
  { deep: true },
);

watch(
  () => props.groupTypeId,
  async (newValue, oldValue) => {
    if (isRefreshing.value) return;

    isRefreshing.value = true;
    try {
      supervisorByProductCategoryStore.params = {
        ...supervisorByProductCategoryStore.params,
        ...props.params,
      };
      supervisorByProductCategoryStore.params.result_group_filter_type =
        newValue;
      await supervisorByProductCategoryStore.refresh();
      // await supervisorByProductCategoryStore.getChartData();
    } finally {
      isRefreshing.value = false;
    }
  },
);

watch(
  () => supervisorByProductCategoryStore.isLoading,
  async (newParams, oldParams) => {
    emit("getTableLoading", supervisorByProductCategoryStore.isLoading);
  },
);
<\/script>

<style lang="scss" scoped>
.table-content-body {
  padding-bottom: 0;
  z-index: 2;
}
.table-content-container {
  overflow: hidden;
}
</style>
`;export{e as default};
