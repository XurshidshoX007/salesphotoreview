const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="accessHistoryHeader"
        :templates="historyStore.templates"
        @on-change-table-headers="onChangeTableHeaders"
      />
      <show-hide-column
        :headers="historyStore.templates"
        :save-key="accessHistoryHeader"
      />
      <page-size-btn
        :current-size="historyStore.params.page_size"
        :total-count="historyStore.data?.total_count"
        :page-number="historyStore.data?.page_number"
        @setPageSize="historyStore.setPageSize"
      />
      <search-input
        :value="historyStore.params.search"
        @change="historyStore.search"
      />
      <excel-btn
        :loading="historyStore.isExcelFileDownloading"
        @click="historyStore.onDownloadExcelFile"
      />
      <refresh-btn
        :loading="historyStore.isLoading"
        @click="historyStore.refresh"
      />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="historyStore.templates"
        :sorted="historyStore.params.order_by"
        :loading="historyStore.isLoading"
        :is-empty="!historyStore.data?.items?.length"
        @sort="historyStore.sortData"
      >
        <template #body>
          <c-tr v-for="data in historyStore.data?.items" :key="data.id">
            <c-td-no-edit
              v-for="column in historyStore.templates"
              :key="column.key"
              :is-checked="column.checked"
              :type="column.type"
            >
              <div v-if="column.type === 'date'">
                <link-component
                  :is-linkable="!props.id"
                  :value="
                    getFormattedDate(
                      String(data[column.accessorKey || column.key]),
                      'DD.MM.YYYY HH:mm:ss',
                    )
                  "
                  @click="onSelectSerialId(data.grant_access_serial_id)"
                  nonCopyable
                />
              </div>
              <div v-else>
                {{
                  getDataValue(
                    data,
                    column.accessorKey || column.key,
                    column.type,
                  )
                }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="historyStore.params.page_size"
        :total-count="historyStore.data?.total_count"
        :page-number="historyStore.data?.page_number"
      />
      <page-index
        :available-pages="historyStore.data?.total_pages"
        :current-page="historyStore.data?.page_number"
        @set-page="historyStore.setPage"
      />
    </div>
  </div>

  <transition name="modal">
    <div v-if="selectedSerialId">
      <access-history-dialog
        :grant-access-serial-id="selectedSerialId"
        @close-dialog="selectedSerialId = null"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { accessHistoryHeader } from "~/variable/column-constants";
import { getDataValue, getFormattedDate } from "#imports";

// Type
type Props = {
  id?: string;
};

// Props
const props = defineProps<Props>();

// Store
const historyStore = useAccessHistoryStore(props.id || "main");

// State
const selectedSerialId = ref<string | null>(null);

// Methods
const onChangeTableHeaders = (param: Template[]) => {
  historyStore.templates = param;
};

const onSelectSerialId = (id: string) => {
  if (!props.id) {
    selectedSerialId.value = id;
  }
};
<\/script>
`;export{e as default};
