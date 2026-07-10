const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="invoiceAssemblySettingsHeader"
          :templates="invoiceAssemblyStore.templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="invoiceAssemblyStore.templates"
          :save-key="invoiceAssemblySettingsHeader"
        />
        <page-size-btn
          :current-size="invoiceAssemblyStore.params.page_size"
          :total-count="invoiceAssemblyStore.data?.total_count"
          :page-number="invoiceAssemblyStore.data?.page_number"
          @setPageSize="invoiceAssemblyStore.setPageSize"
        />
        <search-input
          @change="invoiceAssemblyStore.search"
          :value="invoiceAssemblyStore.params.search"
        />
        <excel-btn
          @click="invoiceAssemblyStore.onDownloadExcelFile"
          :loading="invoiceAssemblyStore.isExcelFileDownloading"
        />
        <RefreshBtn @click="refresh" :loading="invoiceAssemblyStore.loading" />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="invoiceAssemblyStore.templates"
          :sorted="invoiceAssemblyStore.params.order_by"
          :loading="invoiceAssemblyStore.loading"
          :is-empty="!invoiceAssemblyStore.data?.items.length"
          @sort="invoiceAssemblyStore.sortData"
        >
          <template #body>
            <c-tr v-for="data in invoiceAssemblyStore.data?.items" :key="data">
              <c-td-no-edit
                v-for="key in invoiceAssemblyStore.templates"
                :key="key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.key === 'display_time_range_from'">
                  {{ getFormattedTimeRangeDate(data["display_time_range"]) }}
                </div>
                <div v-else-if="key.type === 'number'">
                  {{ getFormattedAmount(data[key.key]) }}
                </div>
                <div v-else-if="key.type === 'action'">
                  <div class="flex gap-x-2">
                    <rounded-icon-btn
                      type="edit"
                      :iconSize="20"
                      @click="openEditDialog(data.id)"
                    />
                    <rounded-icon-btn
                      type="danger"
                      @click="invoiceAssemblyStore.deleteInvoices(data.id)"
                    />
                  </div>
                </div>
                <div v-else-if="key.key === 'warehouse_name'">
                  {{ data["warehouse"]?.name }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="invoiceAssemblyStore.params.page_size"
          :total-count="invoiceAssemblyStore.data?.total_count"
          :page-number="invoiceAssemblyStore.data?.page_number"
        />
        <page-index
          :available-pages="invoiceAssemblyStore.data?.total_pages"
          :current-page="invoiceAssemblyStore.data?.page_number"
          @setPage="invoiceAssemblyStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="editingId">
        <SettingsAssemblyInvoiceDialog
          :id="editingId"
          @closeDialog="closeEditDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
// props
import { invoiceAssemblySettingsHeader } from "~/variable/column-constants";
import { useAssemblyInvoiceStore } from "~/stores/settings/assembly-invoice/assembly-invoice.store";
import type { Template } from "~/interfaces/ui/template";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  isActive: boolean;
}>();

// Store
const invoiceAssemblyStore = useAssemblyInvoiceStore("main");

// State
const editingId = ref<string>("");
const { t } = useI18n();
// hooks

onMounted(async () => {
  await getData();
});

// Methods
const onChangeTableHeaders = (param: Template[]) => {
  invoiceAssemblyStore.templates = param;
};

const openEditDialog = (id: string) => {
  editingId.value = id;
};

const closeEditDialog = () => {
  editingId.value = "";
};

const getFormattedTimeRangeDate = (date: {
  from_value: string | null;
  to_value: string | null;
}) => {
  const fromDate = date?.from_value
    ? t("filters.from") + " " + date?.from_value!
    : "";
  const endDate = date?.to_value ? t("filters.to") + " " + date?.to_value : "";

  return fromDate + " " + endDate;
};

const getData = async () => {
  await invoiceAssemblyStore.getData();
};

const refresh = async () => {
  await getData();
};
<\/script>
`;export{e as default};
