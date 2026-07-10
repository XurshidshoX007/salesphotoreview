const e=`<template>
  <div class="table-content-container h-fit">
    <div class="table-content-header justify-between">
      <div class="flex items-center gap-x-4">
        <table-sort-columns
          :templates="headers"
          :save-key="auditReportDetailByAuditor"
          @on-change-table-headers="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="headers"
          :save-key="auditReportDetailByAuditor"
        />
        <page-size-btn
          :current-size="visitDetailStore.reviewParams.page_size"
          :total-count="data?.total_count"
          :page-number="data?.page_number"
          @set-page-size="visitDetailStore.setReviewPageSize"
        />
        <search-input
          :value="visitDetailStore.reviewParams.search"
          @change="visitDetailStore.onReviewSearch"
        />
        <excel-btn
          :loading="visitDetailStore.isReviewExcelFileDownloading"
          @click="onDownloadExcelFile"
        />
        <RefreshBtn
          :loading="visitDetailStore.isReviewLoading"
          @click="visitDetailStore.refreshReview"
        />
      </div>
      <m-btn
        group="primary"
        :disabled="!data?.items?.length"
        class="w-full sm:w-fit"
        @click="onEditAudit"
      >
        {{ t("edit") }}
      </m-btn>
    </div>
    <div class="table-content-body">
      <data-table
        :headers="headers"
        :loading="visitDetailStore.isReviewLoading"
        :is-empty="!data?.items?.length"
        :sorted="visitDetailStore.reviewParams.order_by"
        @sort="visitDetailStore.sortReviewData"
      >
        <template #body>
          <c-tr v-for="item in data?.items" :key="item.id">
            <c-td-no-edit
              v-for="header in headers"
              :key="header.key"
              :type="header.type"
              :is-checked="header.checked"
            >
              <div v-if="header.type === 'boolean'">
                <Checkbox
                  :checked="Boolean(getValue(item, header.key, header.type))"
                  disabled
                />
              </div>
              <div v-else-if="header.key === 'reasons'">
                {{ getReasonsAsString(item.reasons) }}
              </div>
              <div v-else>
                {{
                  getValue(item, header?.accessorKey || header.key, header.type)
                }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="visitDetailStore.reviewParams.page_size"
        :total-count="data?.total_count"
        :page-number="data?.page_number"
      />
      <page-index
        :available-pages="data?.total_pages"
        :current-page="data?.page_number"
        @set-page="visitDetailStore.setReviewPage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { auditReportDetailByAuditor } from "~/variable/column-constants";
import { getCheckedItemsByKey } from "~/utils/local-storage";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";
import type { Template } from "~/interfaces/ui/template";
import type { ByReviewConfigIdListItemModel } from "~/interfaces/api/audit/audit-report/detail-models";
import type { AppResponse } from "~/interfaces/api/response/app-response";

// types
const checkTypeKeys = [
  "FaceProductCountCheck",
  "PriceCheck",
  "SoldCountCheck",
  "ReserveCountCheck",
] as const;

type CheckTypeKey = (typeof checkTypeKeys)[number];

type FormattedReviewData = ByReviewConfigIdListItemModel & {
  [K in CheckTypeKey]: number;
};

// props
const props = defineProps<{
  visitId: string;
  auditorId: string;
}>();

// emits
const emit = defineEmits<{
  (e: "onEdit", data: boolean): void;
}>();

// stores
const visitDetailStore = useAuditReportDetailStore("main");

// states
const { t } = useI18n();

const checkTypes = ref<ConstantModel[]>([]);
const headersState = ref<(Template & { accessorKey?: string })[]>(
  getCheckedItemsByKey(auditReportDetailByAuditor) || [],
);

const headers = computed<(Template & { accessorKey?: string })[]>({
  get() {
    if (headersState.value.length) {
      return headersState.value;
    }

    return [
      ...visitDetailStore.reviewTemplates,
      ...checkTypes.value.map((item) => ({
        name: item.name,
        key: item.id.toString(),
        type: "number",
        checked: true,
        is_sortable: false,
      })),
    ];
  },
  set(newValue: (Template & { accessorKey?: string })[]) {
    headersState.value = newValue;
  },
});

const data = computed<AppResponse<FormattedReviewData>>(() => {
  if (!props.auditorId) return {} as AppResponse<FormattedReviewData>;
  return {
    ...visitDetailStore.reviewData,
    items: formatData(visitDetailStore.reviewData?.items || []),
  } as AppResponse<FormattedReviewData>;
});

// methods
const getValue = (
  data: ByReviewConfigIdListItemModel,
  key: string,
  type?: string,
) => {
  const value = getDataValue<ByReviewConfigIdListItemModel>(
    data as ByReviewConfigIdListItemModel,
    key,
    type,
  );
  return value;
};

const onChangeTableHeaders = (newValue: Template[]) => {
  headersState.value = newValue;
};

const formatData = (
  data: ByReviewConfigIdListItemModel[],
): FormattedReviewData[] => {
  if (!data || !data.length) return [];
  return data.map((item) => {
    const base: ByReviewConfigIdListItemModel = { ...item };

    const checksMap: Partial<Record<number, number>> = {};
    for (const type of checkTypes.value) {
      if (checkTypeKeys.includes(type.key as CheckTypeKey)) {
        const check = item.list.find((c) => c.key === type.id);
        checksMap[type.id as number] = check ? check.value : undefined;
      }
    }

    return {
      ...base,
      ...checksMap,
    } as FormattedReviewData;
  });
};

const getCheckTypes = async () => {
  checkTypes.value =
    (await visitDetailStore.getCheckTypes()) as ConstantModel[];
};

const onDownloadExcelFile = async () => {
  await visitDetailStore.onDownloadReviewExcelFile(headers.value);
};

const onEditAudit = () => {
  emit("onEdit", true);
};

const getReasonsAsString = (items: string[]) => {
  return items.join(", ");
};

// hooks
onMounted(async () => {
  await getCheckTypes();
});

watch(
  () => props.auditorId,
  () => {
    if (props.auditorId) {
      visitDetailStore.reviewParams.visit_id = props.visitId;
      visitDetailStore.reviewParams.review_config_id = props.auditorId;
    }
  },
  { immediate: true, deep: true },
);
<\/script>
`;export{e as default};
