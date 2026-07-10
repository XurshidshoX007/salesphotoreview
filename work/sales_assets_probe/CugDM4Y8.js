const e=`<template>
  <div class="table-content-container info-table">
    <div class="table-content-header border-b-1">
      <div class="flex items-center justify-between w-full gap-3">
        <div class="w-5/6">
          <search-input :value="searchParams" @change="searchEmployee" />
        </div>
        <RefreshBtn
          :title="t('refresh_data')"
          :loading="gpsStore.isMiniReportLoading"
          @click="refresh"
        />
        <ExcelBtn @click="downloadExcel" />
      </div>
    </div>
    <div class="table-content-body info-table-body">
      <data-table
        :isEmpty="!miniReportData?.length"
        :loading="gpsStore.isMiniReportLoading"
        class="table-content"
      >
        <template #header>
          <c-tr class="bg-neutral-50 border-t-none sticky top-0 z-2">
            <c-td-no-edit
              v-for="key in gpsStore.headersMiniReport"
              :key="key.key"
              :class="key?.borderX && 'border-r-1'"
              :is-checked="key.checked"
            >
              <order-by-universal
                :name="key.name"
                :props-key="key.key"
                :sorted="miniReportParamsOrderBy.order_by"
                :without-order-by="key.type === 'come'"
                @sort="sortData"
              />
            </c-td-no-edit>
          </c-tr>
        </template>
        <template #body>
          <template v-for="(data, index) in miniReportData" :key="index">
            <c-tr class="border-b-none">
              <c-td-no-edit
                v-for="key in gpsStore.headersMiniReport"
                :key="key.key"
                :is-checked="key.checked"
                :type="key.type"
                :class="key?.borderX && 'border-r-1'"
              >
                <div
                  v-if="key.key === 'from' || key.key === 'to'"
                  class="flex items-center gap-x-1 w-35 text-primary-600"
                  :class="
                    isLocation(data) ? 'hover:underline cursor-pointer' : ''
                  "
                  @click="setClientLocation(data)"
                >
                  <span v-if="data['visit_period'][key.key]">с</span>
                  {{ getFormattedDate(data["visit_period"][key.key], "HH:mm") }}
                  <span v-if="data['visit_period']['to']">по</span>
                  {{ getFormattedDate(data["visit_period"]["to"], "HH:mm") }}
                </div>
                <div v-else-if="key.key === 'index'">
                  {{ index + 1 }}
                </div>
                <div v-else-if="key.key === 'charge'">
                  {{ data[key.key] }}
                  <span v-if="data[key.key]"> % </span>
                </div>
                <div v-else-if="key.key === 'visit_period'" class="w-30">
                  {{ getDistanceTime(data["visit_period"]) }}
                </div>
                <div
                  v-else-if="
                    key.key === 'calculated_route_length_in_meters' &&
                    data[key.key]
                  "
                  class="w-30"
                >
                  {{ formatDistance(data[key.key]) }}
                </div>
                <div
                  v-else-if="key.key === 'accuracy' && data[key.key]"
                  class="w-30"
                >
                  {{ formatDistance(data[key.key]) }}
                </div>
                <div
                  v-else-if="key.type === 'seconds' && data[key.key]"
                  class="w-30"
                >
                  {{ convertSeconds(data[key.key]) }}
                </div>
                <div v-else-if="key.key === 'place_type'" class="place-type">
                  <div
                    :style="\`background: \${data[key.key]?.hex_color}\`"
                    class="circle"
                  />
                  <div class="title">
                    {{ data[key.key]?.name }}
                  </div>
                </div>
                <div v-else>
                  {{ getNestedValue(data, key.key) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </template>
        <template #footer v-if="miniReportData?.length">
          <c-tr class="total-row">
            <c-td-no-edit
              v-for="key in gpsStore.headersMiniReport"
              :key="key.key"
              :class="{ 'border-r-1': key?.borderX }"
            >
              <div v-if="key.key === 'from'">
                {{ t("column.total") }}
              </div>
              <div v-else-if="key.key === 'calculated_route_length_in_meters'">
                {{ formatDistance(totalDistanceInMeters) }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getCheckedItemsByKey } from "~/utils/local-storage";
import { formatDistance, getFormattedDate } from "~/utils/formatters";
import { getNestedValue } from "~/utils/helpers";
import { gpsPlaceType } from "~/variable/column-constants";

import type { MiniReportDataModel } from "~/interfaces/api/gps/GPS-model";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";
import type { GenericObject } from "~/interfaces/ui";
import type { Template } from "~/interfaces/ui/template";

// store
const gpsStore = useGPSStore("main");

// emits
const emit = defineEmits(["setClientLocation"]);

//props
const props = defineProps<{
  placeType?: ConstantModel[];
}>();

// state
const { t } = useI18n();

const miniReportParamsOrderBy = ref({
  order_by: {
    field: "employee",
    is_asc: true,
  },
});

const searchParams = ref<string>();

const placeTypeState = ref<ConstantModel[]>(
  getCheckedItemsByKey(gpsPlaceType) || [],
);

// method
const searchEmployee = (value: string | null) => {
  if (value !== null) {
    searchParams.value = value;
  }
  const searchValue = searchParams.value?.trim().toLowerCase(); // Normalize input

  if (!searchValue) {
    gpsStore.miniReportData = gpsStore.miniReportDataForSearch;
    return;
  }

  gpsStore.miniReportData = gpsStore.miniReportDataForSearch?.filter((item) => {
    return (
      item.place_type?.name?.toLowerCase()?.includes(searchValue) ||
      getFormattedDate(item.visit_period?.from, "HH:mm:ss")?.includes(
        searchValue,
      ) ||
      getFormattedDate(item.visit_period?.to, "HH:mm:ss")?.includes(
        searchValue,
      ) ||
      (item.calculated_route_length_in_meters ?? "")
        .toString()
        .includes(searchValue) ||
      (item.accuracy ?? "").toString().includes(searchValue) ||
      (item.network_type ?? "")
        .toString()
        .toLowerCase()
        .includes(searchValue) ||
      (item.charge ?? "").toString().includes(searchValue)
    );
  });
};

const sortData = async (orderBy: { field: string; is_asc: boolean }) => {
  miniReportParamsOrderBy.value.order_by = orderBy;
  if (orderBy) {
    const { field, is_asc = true } = orderBy; // Default to ascending order if not specified
    const list = gpsStore.miniReportData;

    if (!Array.isArray(list) || !field) return; // Ensure \`list\` is an array and \`field\` is defined

    gpsStore.miniReportData = [...list].sort((a, b) => {
      let aValue, bValue;

      if (field === "place_type") {
        aValue = a[field]?.id;
        bValue = b[field]?.id;
      } else if (field === "from" || field === "to") {
        aValue = a["visit_period"]?.[field];
        bValue = b["visit_period"]?.[field];
      } else if (field === "visit_interval_in_seconds") {
        aValue = a["visit_interval_in_seconds"];
        bValue = b["visit_interval_in_seconds"];
      } else {
        aValue = getNestedValue(a, field);
        bValue = getNestedValue(b, field);
      }
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return is_asc ? 1 : -1;
      if (bValue === undefined) return is_asc ? -1 : 1;
      if (typeof aValue === "string" && typeof bValue === "string") {
        return is_asc
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue); // String sorting
      }
      if (typeof aValue === "number" && typeof bValue === "number") {
        return is_asc ? aValue - bValue : bValue - aValue; // Numeric sorting
      }
      return 0;
    });
  } else {
    gpsStore.miniReportData = gpsStore.miniReportDataForSearch;
  }
};

const getDistanceTime = (date: {
  from: string | null;
  to: string | null;
}): string => {
  if (!date.from || !date.to) return "";

  const diffMs = new Date(date.to).getTime() - new Date(date.from).getTime();
  if (diffMs <= 0) return "0 с";

  const diffHours = Math.floor(diffMs / 3600000);
  const diffMinutes = Math.floor((diffMs % 3600000) / 60000);
  const diffSeconds = Math.floor((diffMs % 60000) / 1000);

  return (
    [
      diffHours ? \`\${diffHours}ч\` : "",
      diffMinutes ? \`\${diffMinutes}м\` : "",
      diffSeconds ? \`\${diffSeconds}с\` : "",
    ]
      .filter(Boolean)
      .join(", ") || "0 с"
  );
};

const convertSeconds = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const sec = Math.floor(seconds % 60);

  return (
    [hours && \`\${hours}ч\`, minutes && \`\${minutes}м\`, sec && \`\${sec}с\`]
      .filter(Boolean)
      .join(", ") || "0 с"
  );
};

const getData = async () => {
  if (
    gpsStore.employeeRouteParams.for_date &&
    gpsStore.employeeRouteParams.employee_id
  ) {
    await gpsStore.getMiniReportData();
  }
};

const refresh = async () => {
  await gpsStore.getMiniReportData();
  searchEmployee(null);
};

const setClientLocation = (data: MiniReportDataModel) => {
  emit("setClientLocation", data.location, data);
};

const isLocation = (data: MiniReportDataModel) => {
  return !!data?.location;
};

const transformExcelData = (data: GenericObject[], headers: Template[]) => {
  const result: GenericObject[] = [];

  const handlers: Record<string, (item: GenericObject, index: number) => any> =
    {
      index: (_item, index) => index + 1,
      from: (item) =>
        item.visit_period?.from && item.visit_period?.to
          ? \`\${getFormattedDate(item.visit_period.from, "HH:mm")} - \${getFormattedDate(
              item.visit_period.to,
              "HH:mm",
            )}\`
          : 0,
      place_type: (item) => (item.place_type?.name as string) ?? "",
      calculated_route_length_in_meters: (item) =>
        item.calculated_route_length_in_meters
          ? formatDistance(item.calculated_route_length_in_meters)
          : "",
      accuracy: (item) => (item.accuracy ? formatDistance(item.accuracy) : ""),
      visit_duration_in_seconds: (item) =>
        item.visit_duration_in_seconds
          ? convertSeconds(item.visit_duration_in_seconds)
          : "",
      visit_interval_in_seconds: (item) =>
        item.visit_interval_in_seconds
          ? convertSeconds(item.visit_interval_in_seconds)
          : "",
      charge: (item) => (item.charge ? \`\${item.charge} %\` : ""),
    };

  data.forEach((item, index) => {
    const row: GenericObject = {};

    for (const { key } of headers) {
      const handler = handlers[key];
      row[key] = handler ? handler(item, index) : item[key];
    }

    result.push(row);
  });

  return result;
};

const downloadExcel = () => {
  const headers = gpsStore.headersMiniReport.filter((h) => h.checked);
  const header = headers.reduce(
    (acc, item) => {
      acc[item.key] = item.name;
      return acc;
    },
    {} as Record<string, string>,
  );
  const excelFooter = Object.fromEntries(
    headers.map(({ key }) => [
      key,
      key === "from"
        ? t("column.total")
        : key === "calculated_route_length_in_meters"
          ? formatDistance(totalDistanceInMeters.value)
          : "",
    ]),
  );
  const excelData = transformExcelData(miniReportData.value, headers);
  excelData.unshift(header);
  excelData.push(excelFooter);

  downloadLocalExcelFile({
    headers: headers,
    data: excelData,
    title: \`mini-report-\${getFormattedDate(
      new Date().toISOString(),
      "DD-MM-YYYY",
    )}\`,
  });
};

// hooks
watch(
  () => props.placeType,
  (newVal) => {
    if (newVal) placeTypeState.value = newVal;
  },
  { deep: true },
);

const miniReportData = computed(() => {
  let visitData = gpsStore.miniReportData;

  if (placeTypeState.value?.length) {
    visitData = visitData?.filter((item) =>
      placeTypeState.value.some(
        (el) => el.id === item.place_type.id && el.checked,
      ),
    );
  }

  return visitData;
});

const totalDistanceInMeters = computed(() => {
  return miniReportData.value.reduce((total, item) => {
    return total + (item.calculated_route_length_in_meters || 0);
  }, 0);
});

onMounted(async () => {
  await getData();
});

watch(gpsStore.employeeRouteParams, async (value, oldValue, onCleanup) => {
  await getData();
});

watch(
  () => gpsStore.miniReportDataForSearch,
  () => {
    searchEmployee(null);
  },
);
<\/script>

<style lang="scss" scoped>
.info-table {
  overflow: hidden;
}

.info-table-body {
  padding-bottom: 0 !important;
}

.table-content {
  max-height: calc(100vh - 330px);
  overflow-y: auto;
  position: relative;
}

.place-type {
  border: 1px solid theme("colors.neutral.200");
  border-radius: 6px;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 4px;

  .circle {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .title {
    font-weight: 500;
    font-size: 12px;
    text-wrap: nowrap;
    font-family: "Inter", sans-serif;
    color: theme("colors.neutral.600");
  }
}

::-webkit-scrollbar {
  width: 6px;
  height: 8px;
}

::-webkit-scrollbar-track {
  height: 8px;
  background: #e1e4e4;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

::-webkit-scrollbar-thumb {
  background: #299b9b;
  height: 8px;
}

:deep(.total-row) {
  background: #f5f5f5;
  div {
    font-weight: 600;
  }
}
</style>
`;export{e as default};
