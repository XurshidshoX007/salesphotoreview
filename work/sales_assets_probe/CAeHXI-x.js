const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :templates="store.headers"
        :save-key="clientContestLSKey"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn :headers="store.headers" :save-key="clientContestLSKey" />
      <page-size-btn
        :current-size="store.params.page_size"
        :total-count="store.data?.total_count"
        :page-number="store.data?.page_number"
        @setPageSize="store.setPageSize"
      />
      <search-input :value="store.params.search" @change="store.search" />
      <excel-btn
        :loading="store.isExcelFileDownloading"
        @click="store.downloadExcelFile"
      />
      <RefreshBtn @click="store.refresh" :loading="store.isLoading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="store.headers"
        :loading="store.isLoading"
        :is-empty="!store.data?.items?.length"
        :sorted="store.params.order_by"
        @sort="store.sortData"
      >
        <template #body>
          <template v-for="data in store.data?.items" :key="data.created_date">
            <c-tr>
              <c-td-no-edit v-for="key in store.headers" :key="key.key">
                <div v-if="key.type === 'date'">
                  {{ getFormattedDate(data[key.key]) }}
                </div>
                <div v-else-if="key.type === 'object'">
                  {{ data[key.key]?.name }}
                </div>
                <div v-else-if="key.type === 'phone'">
                  {{ phoneNumberFormatter(data[key.key]) }}
                </div>
                <div v-else-if="key.key === 'action'">
                  <rounded-icon-btn
                    v-if="allowToUpdate"
                    type="edit"
                    :iconSize="20"
                    @click="
                      openEditDialog(
                        data?.client,
                        data?.phone_number,
                        data?.comment,
                      )
                    "
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

    <div class="table-content-footer">
      <curren-page-btn
        :current-size="store.params.page_size"
        :total-count="store.data?.total_count"
        :page-number="store.data?.page_number"
      />
      <page-index
        :available-pages="store.data?.total_pages"
        :current-page="store.data?.page_number"
        @setPage="store.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingData">
      <ClientsContestAddEditDialog
        :editing-data="editingData"
        @closeDialog="closeEditDialog"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { useClientsContestStore } from "~/stores/clients/contest/store";
import { clientContestLSKey } from "~/variable/column-constants";
import { getFormattedDate, phoneNumberFormatter } from "~/utils/formatters";

// props
const props = defineProps<{
  allowToUpdate?: boolean;
}>();

// store
const store = useClientsContestStore("main");

// states
const editingData = ref<{
  id: string;
  name?: string;
  phone?: string | number;
  comment?: string;
} | null>(null);

// hooks
onMounted(async () => await store.getData());

// methods
const onChangeTableHeaders = (data: Template[]) => {
  store.headers = data;
};

const openEditDialog = (
  clientData: { id: string; name?: string },
  phone?: string | number,
  comment?: string,
) => {
  if (!clientData) return;
  editingData.value = { ...clientData, phone, comment };
};

const closeEditDialog = () => {
  editingData.value = null;
};
<\/script>
`;export{e as default};
