const n=`<template>
  <form @submit.prevent="savePlanCreate">
    <div class="table-content-container overflow-hidden">
      <div class="table-content-header border-b-1 justify-between">
        <search-input :value="searchParams" @change="onSearch" />
        <div class="flex gap-3">
          <m-btn group="border" @click="changeUpdateFormat">
            {{
              (createdPlanningStore.updateState && t("clients.cancel")) ||
              t("plan.set_up_plan")
            }}
          </m-btn>
          <m-btn
            v-if="createdPlanningStore.updateState"
            type="submit"
            :loading="createdPlanningStore.isSaveLoading"
          >
            {{ t("save") }}
          </m-btn>
        </div>
      </div>
      <div
        class="table-content-body overflow-hidden plan-table-body"
        :class="searchData?.length && 'pr-1'"
      >
        <data-table
          :loading="createdPlanningStore.isGetPlanLoading"
          :is-empty="!searchData?.length"
          class="table-content relative"
          :class="searchData?.length && 'pr-1'"
        >
          <template #header>
            <c-tr class="bg-neutral-50 border-t-0 border-r-1 sticky top-0 z-2">
              <c-td-no-edit
                v-for="key in createdPlanningStore.headers"
                :key="key"
                :is-checked="key.checked"
                :class="[
                  key.borderX && 'border-r-1',
                  (key.key === 'employee' && 'w-[25%]') || 'w-[15%]',
                ]"
              >
                <div
                  v-if="key.key === 'employee'"
                  class="text-[#8FA0A0] pl-9.5"
                >
                  <div v-if="createdPlanningStore.updateState">
                    {{ key.name }}
                  </div>
                  <div v-else>
                    <order-by-universal
                      :name="key.name"
                      :props-key="key.key"
                      :sorted="createdPlanningStore.params.order_by"
                      @sort="createdPlanningStore.sortData"
                    />
                  </div>
                </div>
                <div v-else class="text-[#8FA0A0] text-end">
                  <div v-if="createdPlanningStore.updateState">
                    {{ key.name }}
                  </div>
                  <div v-else>
                    <order-by-universal
                      :name="key.name"
                      :props-key="key.key"
                      :sorted="createdPlanningStore.params.order_by"
                      text-position-is-right
                      @sort="createdPlanningStore.sortData"
                    />
                  </div>
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
          <template #body>
            <template v-for="(data, index) in searchData" :key="data?.id">
              <c-tr>
                <c-td-no-edit
                  v-for="key in createdPlanningStore.headers"
                  :key="key"
                  :is-checked="key.checked"
                  :class="[
                    key.borderX && 'border-r-1',
                    (key.key === 'employee' && 'w-[25%]') || 'w-[15%]',
                  ]"
                >
                  <div
                    @click="
                      openProducts(index, data?.details, data.employee?.id)
                    "
                    v-if="key.key === 'employee'"
                    class="flex text-primary-600 cursor-pointer items-center gap-x-3"
                  >
                    <IconArrowBottom
                      :class="[
                        (showProduct.isActive &&
                          showProduct.index === index &&
                          'rotate-180 transition-all') ||
                          'rotate-0 transition-all',
                      ]"
                    />
                    <div class="ml-3 text-[#424F4F]">
                      {{ data["employee"]?.name }}
                    </div>
                    <IconLoading
                      :loading="data?.detail_loading"
                      color="#fff"
                      :width="4"
                      :height="4"
                    />
                  </div>
                  <div
                    v-if="
                      typeof data[key.key] === 'number' ||
                      data[key.key] === null
                    "
                    class="flex justify-end plan-header-input"
                  >
                    <d-input
                      v-if="createdPlanningStore.updateState"
                      :value="data[key.key]"
                      :max="100000000000000000"
                      :class="
                        (data[key.key] > 1000000000000 && 'w-40') || 'w-35'
                      "
                      type="number"
                      disabled
                    />
                    <div v-else>
                      {{ getFormattedAmount(data[key.key]) }}
                    </div>
                  </div>
                </c-td-no-edit>
              </c-tr>
              <template
                v-if="showProduct.isActive && showProduct.index === index"
              >
                <c-tr
                  v-for="(product, chIndex) in data?.details"
                  :key="'children' + index + chIndex"
                  class="bg-[#FAFDFD] create-plan-content"
                >
                  <c-td-no-edit
                    v-for="key in createdPlanningStore.headers"
                    :key="key"
                    :class="[
                      key.borderX && 'border-r-1',
                      createdPlanningStore.updateState && 'border-t-1',
                    ]"
                  >
                    <flex-col class="text-end">
                      <flex-row
                        v-if="key.key === 'employee'"
                        class="justify-between fs-14 fw-4 text-[#8FA0A0] pl-11"
                      >
                        {{
                          product[!isKpiGroup ? "product_category" : "group"]
                            ?.name
                        }}
                      </flex-row>
                      <div
                        v-if="
                          typeof product[key.key] === 'number' ||
                          product[key.key] === null
                        "
                        class="flex justify-end"
                      >
                        <div v-if="createdPlanningStore.updateState">
                          <d-input
                            :value="product[key.key]"
                            class="w-35"
                            type="number"
                            @change="
                              setPlanFields(
                                key.key,
                                $event,
                                index,
                                null,
                                chIndex
                              )
                            "
                          />
                        </div>
                        <div class="fs-14 fw-4 text-[#8FA0A0]" v-else>
                          {{ getFormattedAmount(product[key.key]) }}
                        </div>
                      </div>
                    </flex-col>
                  </c-td-no-edit>
                </c-tr>
              </template>
            </template>
          </template>
          <template #footer v-if="searchData?.length > 0">
            <c-tr class="bg-[#FAFDFD] border-b-0 sticky bottom-0">
              <c-td-no-edit
                v-for="key in createdPlanningStore.headers"
                :key="key"
                :is-checked="key.checked"
                class="fw-6"
                :class="key.borderX && 'border-r-1'"
              >
                <div v-if="key.key === 'employee'" class="text-start pl-4">
                  {{ t("plan.all_agents") }}
                </div>
                <div v-else class="text-end fw-6 fs-14 text-[#299B9B]">
                  {{ getFormattedAmount(totalAmountPlan(key.key)) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
// Stores
import { useNotification } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type {
  MonthYearModel,
  SettingsDetailDataListModel,
} from "~/interfaces/api/planning/settings-plan-model-OLD";

// store
const createdPlanningStore = useCreatedPlanningStore("main");
const { notify } = useNotification();
// props
const props = defineProps<{
  monthYear: MonthYearModel;
  isKpiGroup?: boolean;
}>();
// State
const { t } = useI18n();
const searchParams = ref<null | string>(null);
const showProduct = ref({
  isActive: false,
  index: 0,
});

const openProducts = async (
  index: number,
  details: SettingsDetailDataListModel[] | undefined,
  employeeId: string
) => {
  const isSameIndex = index === showProduct.value.index;
  const item = createdPlanningStore.responseData[index];

  if (!details) {
    item.detail_loading = true;

    item.details = props.isKpiGroup
      ? await createdPlanningStore.employeeByKpiGroupDetail(employeeId)
      : await createdPlanningStore.employeeDetail(employeeId);

    item.detail_loading = false;
  }

  showProduct.value = {
    isActive: isSameIndex ? !showProduct.value.isActive : true,
    index,
  };

  createdPlanningStore.responseDataLocal = structuredClone(
    createdPlanningStore.responseData
  );
};

const onSearch = (value: string) => {
  searchParams.value = value;
};

// hooks

const searchData = computed(() => {
  const searchTerm = searchParams.value?.trim().toLowerCase();
  const originalCategories = createdPlanningStore.responseData ?? [];

  if (!searchTerm) {
    return createdPlanningStore.responseData;
  }

  const filteredCategories = originalCategories.filter((category) => {
    const name = category?.employee?.name?.toLowerCase();
    const cost = category?.cost;
    const count = category?.count;
    const orderCount = category?.order_count;
    const baseCount = category?.active_client_base_count;
    const volume = category?.volume;

    return (
      name?.includes(searchTerm) ||
      cost?.toString().includes(searchTerm) ||
      orderCount?.toString().includes(searchTerm) ||
      baseCount?.toString().includes(searchTerm) ||
      volume?.toString().includes(searchTerm) ||
      count?.toString().includes(searchTerm)
    );
  });

  return filteredCategories;
});

const updateData = async () => {
  if (!props.monthYear.year) return;
  createdPlanningStore.month_year = props.monthYear;
  if (!props.isKpiGroup) {
    await createdPlanningStore.getData();
  } else {
    await createdPlanningStore.getDataByKpiGroup();
  }
};

onMounted(updateData);

watch(
  () => props.monthYear,
  () => {
    updateData();
  }
);
// Methods
const savePlanCreate = async () => {
  const isProductTab = !props.isKpiGroup;
  const employeeSaveData = [];

  createdPlanningStore.responseData?.forEach((item) => {
    if (!item.is_active) return;

    const details =
      item.details
        ?.filter((chItem) => chItem.is_active)
        .map((chItem) => ({
          ...(isProductTab
            ? { product_category_id: chItem.product_category.id }
            : { group_id: chItem.group.id }),
          cost: chItem.cost,
          count: chItem.count,
          volume: chItem.volume,
          order_count: chItem.order_count,
          active_client_base_count: chItem.active_client_base_count,
        })) || [];

    employeeSaveData.push({
      cost: item.cost,
      count: item.count,
      volume: item.volume,
      order_count: item.order_count,
      active_client_base_count: item.active_client_base_count,
      employee_id: item.employee.id,
      details,
    });
  });

  const dataForSave = {
    year_month: createdPlanningStore.month_year,
    employees: employeeSaveData,
  };

  if (dataForSave.employees.length) {
    if (isProductTab) {
      await createdPlanningStore.createPlan(dataForSave);
    } else {
      await createdPlanningStore.createPlanByKpiGroup(dataForSave);
    }

    showProduct.value = {
      isActive: false,
      index: 0,
    };
  } else {
    notify({ title: "Никаких изменений не произошло", type: "error" });
  }
};

const setPlanFields = (
  key: string,
  value: number,
  index: number,
  type: string,
  childIndex: number
) => {
  const report = createdPlanningStore.responseData[index];
  if (type === "common") {
    if (report[key] !== value) {
      report[key] = value;
      report.is_active = true;
    }
  } else if (report?.details) {
    const detail = report.details[childIndex];
    if (detail?.[key] !== value) {
      detail[key] = value;
      report[key] = report.details.reduce((sum, item) => sum + item[key], 0);
      report.is_active = true;
      detail.is_active = true;
      report[\`\${key}_is_active\`] = true;
    }
  }
};

const changeUpdateFormat = async () => {
  createdPlanningStore.updateState = !createdPlanningStore.updateState;
  if (!createdPlanningStore.updateState) {
    createdPlanningStore.responseData = JSON.parse(
      JSON.stringify(createdPlanningStore.responseDataLocal)
    );
  }
};

const totalAmountPlan = (key: string) => {
  return createdPlanningStore.responseData?.reduce((a, b) => a + b[key], 0);
};
<\/script>

<style lang="scss" scoped>
.create-plan-content {
  .form-field {
    input {
      background: white;
    }

    input:focus {
      background-color: #fff;
    }
  }
}

.table-content {
  max-height: calc(100vh - 180px);
  overflow-y: auto;
}

::-webkit-scrollbar {
  width: 6px;
  border-radius: 28px;
  height: 8px;
}

::-webkit-scrollbar-track {
  height: 8px;
  background: #fff;
  border-radius: 28px;
}

::-webkit-scrollbar-thumb {
  background: #299b9b;
  border-radius: 28px;
  height: 8px;
}

.plan-table-body {
  padding-bottom: 0 !important;
}
</style>
`;export{n as default};
