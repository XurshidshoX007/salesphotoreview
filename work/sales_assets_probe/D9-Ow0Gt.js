const e=`<template>
  <div class="table-content-container info-table">
    <div class="table-content-header !px-0 !pt-0 pb-5.5">
      <div
        class="flex w-full items-center"
        :class="isAgent ? 'gap-3' : 'gap-0'"
      >
        <!-- Dropdown section -->
        <div
          class="transition-all duration-300 ease-in-out overflow-hidden"
          :class="isAgent ? 'w-1/2 opacity-100' : 'w-0 opacity-0'"
        >
          <DropdownsByFilterStates
            ref="DropdownComponent"
            :filter-states="filterStates"
            class="w-full"
            @onOpenDropdown="onOpenDropdown"
          />
        </div>

        <!-- Date picker section -->
        <div
          class="transition-all duration-300 ease-in-out"
          :class="isAgent ? 'w-1/2' : 'w-full'"
        >
          <GpsDatePickerForGps
            :selected-time="selectedTime"
            :selected-date="gpsStore.selectedDate"
            class="w-full"
            @set-date-picker="setDatePicker"
          />
        </div>
      </div>
      <search-input
        :value="gpsStore.searchParams"
        class="flex-1"
        @change="searchEmployee"
      />
      <RefreshBtn
        :title="t('refresh_data')"
        :loading="gpsStore.isGetEmployeeLoading"
        position="top-start"
        @click="refresh"
      />
    </div>
    <div class="table-content-body info-table-body min-h-90">
      <data-table
        without-header
        with-information-above-header
        :isEmpty="!gpsStore.employeeData?.length"
        :class="
          gpsStore.employeeParams.role === EmployeeRole.AGENT
            ? 'table-content-by-agent'
            : 'table-content'
        "
        :loading="gpsStore.isGetEmployeeLoading"
      >
        <template #body>
          <template v-for="data in gpsStore.employeeData" :key="data.id">
            <c-tr class="border-t border-color-input">
              <c-td-no-edit
                v-for="key in gpsStore.headers"
                :key="key.key"
                :is-checked="key.checked"
                :type="key.type"
                style="padding: 5px 0"
                class="cursor-pointer group"
                @click="setEmployeeRoute(data)"
              >
                <div
                  v-if="key.key === 'employee'"
                  class="flex items-center gap-4"
                >
                  <div class="w-8 h-8 text-primary-400">
                    <IconAvatar :size="32" />
                  </div>
                  <div>
                    <div class="fw-5 text-black group-hover:text-primary-600">
                      {{ data[key.key]?.name }}
                    </div>
                    <div v-if="data.last_updated_date" class="w-full">
                      <div class="text-neutral-600">
                        {{
                          getFormattedDate(
                            data["last_updated_date"],
                            "DD.MM.YYYY HH:mm",
                          )
                        }}
                      </div>
                    </div>
                    <div v-else class="italic">
                      <div class="employee-no-info">
                        {{ t("labels.no_information") }}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-else-if="key.key === 'charge'"
                  class="text-end flex justify-end gap-x-1 items-center"
                >
                  <div v-if="data['location_data']?.[key.key]">
                    <icon-charge :percent="data?.location_data?.charge" />
                    <div class="flex justify-end text-3">
                      {{ data["location_data"]?.[key.key] }} <span>%</span>
                    </div>
                  </div>
                  <div
                    v-if="data?.location_data?.lat_lng"
                    @click.stop="setLocationEmployee(data)"
                    class="cursor-pointer"
                  >
                    <icon-target />
                  </div>
                  <div
                    v-if="hasAccessToRouteOptimization"
                    class="cursor-pointer"
                    v-tooltip="{
                      text: t('gps.optimize_route'),
                      placement: 'top-start',
                    }"
                    @click="setEmployeeRouteOptimization(data)"
                  >
                    <icon-direction />
                  </div>
                </div>
                <div v-else-if="key.key === 'is_online'">
                  <div
                    class="w-3 h-3 rounded-[50%]"
                    :style="\`background:\${getEmployeeIsOnline(data[key.key])}\`"
                  />
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
  </div>
</template>

<script setup lang="ts">
// store

import moment from "moment/moment";
import type { EmployeeDataModel } from "~/interfaces/api/gps/GPS-model";
import { params2query } from "~/utils/store-params";
import { useI18n } from "vue-i18n";
import { ref } from "vue";
import { useAccessesService } from "~/composables/access/accesses";
import { getFormattedDate } from "@/utils/formatters";
import { EmployeeRole, getRoleRoutePath } from "~/variable/gps-constants";

// props
const props = defineProps<{
  selectedTime: string | null;
}>();

// emits
const emit = defineEmits(["setLocationEmployee"]);

// store
const gpsStore = useGPSStore("main");

// state
const { t } = useI18n();
const { isAdmin, isOperator, isManager, isSupervisor } = useAccessesService();
const searchParams = ref<string>();

const withoutSupervisorState = ref([
  {
    name: t("users.without_supervisor"),
    id: null,
    code: null,
    is_active: true,
  },
]);

// hooks
const hasAccessToRouteOptimization = computed(() => {
  return (
    isAdmin.value || isOperator.value || isManager.value || isSupervisor.value
  );
});

// methods
const setDatePicker = (value: string) => {
  gpsStore.employeeParams.for_date = value;
  gpsStore.selectedDate = value;
};

const getEmployeeIsOnline = (is_online: null | boolean) => {
  if (is_online === null) return "#000";
  if (is_online) return "#33c229";
  return "#eb2c2c";
};

const setLocationEmployee = (employee: EmployeeDataModel) => {
  emit("setLocationEmployee", employee);
};

const setEmployeeRoute = (data: EmployeeDataModel) => {
  gpsStore.employeeRouteParams.for_date = null;
  gpsStore.employeeRouteParams.employee_id = null;

  const url = \`/gps/employee-route/?\${params2query({
    employee_name: data?.employee?.name,
    employee_id: data?.employee?.id,
    last_update_date: moment(
      data.last_updated_date || new Date().toISOString()
    ).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
    role_id: gpsStore.employeeParams.role,
  })}\`;
  navigateTo(url);
};

const setEmployeeRouteOptimization = (data: EmployeeDataModel) => {
  gpsStore.employeeRouteParams.employee_id = null;
  const employeeUrl = getRoleRoutePath(gpsStore.employeeParams.role);
  const url = \`\${employeeUrl}?\${params2query({
    employee_name: data?.employee?.name,
    employee_id: data?.employee?.id,
  })}\`;
  navigateTo(url);
};

const searchEmployee = (value: string | null) => {
  if (value !== null) {
    gpsStore.searchParams = value;
    searchParams.value = value;
  }

  const searchValue = gpsStore.searchParams?.trim().toLowerCase();

  if (!searchValue) {
    gpsStore.employeeData = gpsStore.employeeDataForSearch;
    return;
  }

  gpsStore.employeeData = gpsStore.employeeDataForSearch?.filter((item) => {
    const name = item.employee?.name?.toLowerCase() || "";
    const lastUpdated = getFormattedDate(item?.last_updated_date, "DD.MM.YYYY");
    const charge = item.location_data?.charge?.toString() || "";

    return (
      name.includes(searchValue) ||
      lastUpdated.includes(searchValue) ||
      charge.includes(searchValue)
    );
  });
};

const getData = async () => {
  if (gpsStore.employeeParams.role !== EmployeeRole.AGENT) {
    await gpsStore.getEmployeeData();
    return;
  }
  await gpsStore.getLastLocationDataAgents();
};

const refresh = async () => {
  await getData();
  searchEmployee(null);
};

const onOpenDropdown = async (state: string, value: unknown) => {
  if (state === "supervisors" && !gpsStore.supervisors) {
    await gpsStore.getSupervisors();
    return;
  }
};
// hooks
onMounted(async () => {
  await getData();
});

const isAgent = computed(() => {
  return gpsStore.employeeParams.role === EmployeeRole.AGENT;
});

const withoutSupervisorsStates = computed(() => {
  return {
    items: gpsStore.supervisors
      ? [...withoutSupervisorState.value, ...gpsStore.supervisors.items]
      : undefined,
  };
});

const filterStates = computed(() => {
  const { lastLocationAgentsParams } = gpsStore;

  return [
    {
      name: t("users.supervisors"),
      key: "supervisors",
      get data() {
        return withoutSupervisorsStates.value;
      },
      get getSelectedData() {
        return lastLocationAgentsParams.supervisor_id_arr;
      },
      set setSelectedData(value: string[]) {
        lastLocationAgentsParams.supervisor_id_arr = value;
      },
    },
  ];
});

watch(
  () => gpsStore.employeeDataForSearch,
  () => {
    searchEmployee(null);
  }
);
<\/script>

<style lang="scss" scoped>
.info-table {
  overflow: hidden;
  border: none;
  border-radius: 0;
}

.info-table-body {
  padding-bottom: 0 !important;

  .employee,
  .employee-no-info {
    display: inline-block;
    font-size: 13px;
    color: theme("colors.neutral.900");
  }

  .employee:hover {
    color: #299b9b;
    text-decoration: underline;
    cursor: pointer;
  }
}

.table-content {
  max-height: calc(100vh - 198px);
  overflow-y: auto;
  position: relative;
  border: none !important;
}

.table-content-by-agent {
  max-height: calc(100vh - 258px);
  overflow-y: auto;
  position: relative;
  border: none !important;
}

::-webkit-scrollbar {
  width: 14px;
}

::-webkit-scrollbar-track {
  background: #fafafa;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  margin-top: 10px;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  border: 4px solid transparent;
  background-clip: padding-box;
}
</style>
`;export{e as default};
