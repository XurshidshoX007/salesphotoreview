const e=`<template>
  <div :class="containerClass">
    <div v-if="isNtProductType" class="table-content-header">
      <div class="table-content-btn-group">
        <table-sort-columns
          :save-key="props.saveKey"
          :templates="props.headers"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn :headers="headers" :save-key="props.saveKey" />
        <page-size-btn
          :current-size="props.params?.page_size"
          :total-count="props.data?.total_count"
          :page-number="props.data?.page_number"
          @set-page-size="setPageSize"
        />
        <search-input @change="search" />
        <excel-btn
          :loading="props.isExcelFileDownloading"
          @click="onDownloadExcelFile"
        />
        <RefreshBtn :loading="props.isLoading" @click="refresh" />
      </div>
    </div>

    <div :class="bodyClass">
      <data-table
        :headers="props.headers"
        :loading="props.isLoading"
        :sorted="isNtProductType ? props.params?.order_by : undefined"
        :is-empty="!_data?.length"
        :with-information-above-header="!isNtProductType"
        @sort="sortData"
      >
        <template #body>
          <c-tr
            v-for="item in _data"
            :key="item?.expeditor?.id"
            :class="trClass"
          >
            <c-td-no-edit
              v-for="header in headers"
              :key="header.key"
              :header-key="header.key"
              :is-checked="header.checked"
              :type="header.type"
            >
              <div v-if="header.type === 'object'">
                <link-component
                  v-if="shouldShowExpeditorLink(header.key)"
                  :is-linkable="hasAccess2ExpeditorDebtDetail"
                  :value="item.expeditor?.name"
                  non-copyable
                  @click="
                    hasAccess2ExpeditorDebtDetail &&
                    openDetailDialog(item?.expeditor?.id)
                  "
                />
                <div v-else>
                  <div v-if="header?.accessorKey">
                    {{
                      getNestedValue(
                        item,
                        header.accessorKey,
                        header?.innerType,
                      )
                    }}
                  </div>
                  <div v-else>
                    {{ item[header.key]?.name }}
                  </div>
                </div>
              </div>

              <div v-else-if="header.type === 'number'">
                {{ getFormattedAmount(item[header.key]) }}
                {{ header?.showCurrencyCode && getCurrencyCode(item) }}
              </div>

              <div v-else-if="header.key === 'action'">
                <rounded-icon-btn
                  v-if="hasAccess2ExpeditorDebtWriteOff"
                  icon="list"
                  :tooltip="t('warehouse.write_off')"
                  @click="openWriteOffDetailDialog(item?.expeditor)"
                />
              </div>

              <div v-else>
                {{ item[header.key] }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>

    <div v-if="isNtProductType" class="table-content-footer">
      <curren-page-btn
        :current-size="props.params?.page_size"
        :total-count="props.data?.total_count"
        :page-number="props.data?.page_number"
      />
      <page-index
        :current-page="props.params?.page"
        :available-pages="props.data?.total_pages || 1"
        @set-page="setPage"
      />
    </div>

    <transition name="modal">
      <div v-if="openedItemId">
        <DashboardCashboxExpeditorDebtDetailDialog
          :id="openedItemId"
          @close-dialog="closeDetailDialog"
        />
      </div>
    </transition>

    <transition name="modal">
      <div v-if="openedWriteOffInfo">
        <DashboardCashboxExpeditorDebtWriteOffDetailDialog
          :expeditor="openedWriteOffInfo"
          @close-dialog="closeWriteOffDetailDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import type {
  ByInvoiceDetailModel,
  ByProductDetailModel,
  ListModel,
} from "~/interfaces/api/cashboxes/expeditor-debt-model";
import type {
  ListParams,
  OrderByParams,
} from "~/interfaces/api/params/list-parameters";
import { getFormattedAmount } from "~/utils/filter";
import type { AppResponse } from "~/interfaces/api/response/app-response";
import { getNestedValue } from "~/utils/helpers";
import { useI18n } from "vue-i18n";
import type { IdNameModel } from "~/interfaces/api/IdNameModel";
import { useCashboxAccess } from "~/composables/access/cashbox/cashbox";

// props
interface BaseProps {
  headers: (Template & {
    accessorKey?: string;
    showCurrencyCode?: boolean;
    innerType?: string;
  })[];
  isLoading: boolean;
}

interface ExpeditorProps extends BaseProps {
  type: "expeditor";
  params: ListParams;
  data: AppResponse<ListModel>;
  isExcelFileDownloading: boolean;
  saveKey: string;
}

interface ProductProps extends BaseProps {
  type: "product";
  data: ByProductDetailModel[];
  params?: never;
  isExcelFileDownloading?: never;
  saveKey?: never;
}

interface InvoiceProps extends BaseProps {
  type: "invoice";
  params: ListParams;
  data: AppResponse<ByInvoiceDetailModel>;
  isExcelFileDownloading: boolean;
  saveKey: string;
}

type Props = ExpeditorProps | ProductProps | InvoiceProps;
type PropType = "expeditor" | "product" | "invoice";

const props = defineProps<Props>();

// emits
const emit = defineEmits<{
  refresh: [];
  search: [value: string];
  "set-page-size": [size: number];
  "set-page": [page: number];
  sort: [orderBy: OrderByParams | null];
  "change-table-headers": [headers: Template[]];
  "download-excel-file": [];
}>();

// states
const { t } = useI18n();
const openedItemId = ref<string | null>(null);
const openedWriteOffInfo = ref<IdNameModel | null>(null);

// access
const { hasAccess2ExpeditorDebtDetail, hasAccess2ExpeditorDebtWriteOff } =
  useCashboxAccess();

// hooks
const headers = computed(() => props.headers);

const isNtProductType = computed(() => (props as Props).type !== "product");

const _data = computed(() => {
  if (!isNtProductType.value) return props.data;
  return props.data?.items || [];
});

const containerClass = computed(() => {
  return isNtProductType.value ? "table-content-container" : "";
});

const bodyClass = computed(() => {
  return isNtProductType.value
    ? "table-content-body"
    : "w-full overflow-auto rounded-large border-grey";
});

const trClass = computed(() => {
  return isNtProductType.value ? "" : "last-border-b-0";
});

// methods
const refresh = (): void => emit("refresh");

const search = (value: string): void => emit("search", value);

const setPageSize = (size: number): void => emit("set-page-size", size);

const setPage = (page: number): void => emit("set-page", page);

const sortData = (orderBy: OrderByParams | null): void => emit("sort", orderBy);

const onChangeTableHeaders = (headers: Template[]): void => {
  emit("change-table-headers", headers);
};

const onDownloadExcelFile = (): void => emit("download-excel-file");

const getCurrencyCode = (item: unknown) => {
  switch (props.type as PropType) {
    case "expeditor":
      return (item as ListModel)?.base_currency_code;
    case "invoice":
      return (item as ByInvoiceDetailModel)?.currency?.code;
    case "product":
      return (item as ByProductDetailModel)?.base_currency_code;
    default:
      return "";
  }
};

const openDetailDialog = (id?: string): void => {
  openedItemId.value = id || null;
};

const closeDetailDialog = (): void => {
  openedItemId.value = null;
};

const shouldShowExpeditorLink = (headerKey: string): boolean => {
  return props.type === "expeditor" && headerKey === "expeditor";
};

const openWriteOffDetailDialog = (expeditor: IdNameModel): void => {
  openedWriteOffInfo.value = expeditor || null;
};

const closeWriteOffDetailDialog = (): void => {
  openedWriteOffInfo.value = null;
};
<\/script>
`;export{e as default};
