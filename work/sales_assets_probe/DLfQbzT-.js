const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="bonusCategoryHeader"
        :templates="bonusCategoryStore.templates"
        @onChangeTableHeaders="change"
      />
      <ShowHideColumn
        :headers="bonusCategoryStore.templates"
        :save-key="bonusCategoryHeader"
      />
      <page-size-btn
        :current-size="bonusCategoryStore.params.page_size"
        :total-count="bonusCategoryStore.data?.total_count"
        :page-number="bonusCategoryStore.data?.page_number"
        @setPageSize="bonusCategoryStore.setPageSize"
      />
      <search-input
        @change="bonusCategoryStore.search"
        :value="bonusCategoryStore.params.search"
      />
      <excel-btn
        @click="bonusCategoryStore.onDownloadExcelFile"
        :loading="bonusCategoryStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="bonusCategoryStore.loading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="bonusCategoryStore.templates"
        @sort="bonusCategoryStore.sortData"
        :sorted="bonusCategoryStore.params.order_by"
        :loading="bonusCategoryStore.loading"
        :is-empty="!bonusCategoryStore.data?.items.length"
      >
        <template #body>
          <c-tr v-for="data in bonusCategoryStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in bonusCategoryStore.templates"
              :key="key"
              :is-checked="key.checked"
              :type="key.type"
            >
              <div v-if="key.key === 'action'" class="flex gap-2">
                <rounded-icon-btn
                  type="edit"
                  :iconSize="20"
                  @click="dialogStore.edit({ ...data })"
                />
                <rounded-icon-btn
                  v-if="isAdmin"
                  type="danger"
                  @click="bonusCategoryStore.deleteDialog = data.id"
                />
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
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="bonusCategoryStore.params.page_size"
        :total-count="bonusCategoryStore.data?.total_count"
        :page-number="bonusCategoryStore.data?.page_number"
      />
      <page-index
        :available-pages="bonusCategoryStore.data?.total_pages"
        :current-page="bonusCategoryStore.data?.page_number"
        @setPage="bonusCategoryStore.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="bonusCategoryStore.deleteDialog">
      <CommonDeletedDialog
        @onSelectDelete="bonusCategoryStore.deleteBonusCategory"
        @onSelectExit="bonusCategoryStore.deleteDialog = null"
        @onInputReason="bonusCategoryStore.deleteReason = $event"
        reasonInput
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
// Props
import { useBonusCategoryStore } from "~/stores/settings/bonus-category/bonus-category.store";
import { bonusCategoryHeader } from "~/variable/column-constants";
import { useAccessesService } from "~/composables/access/accesses";

const bonusCategoryStore = useBonusCategoryStore("main");

// State
const { isAdmin } = useAccessesService();

function change(param: any) {
  bonusCategoryStore.templates = param;
}

// Stores
const dialogStore = useDialogStore("bonus-category");

const refresh = () => {
  bonusCategoryStore.refresh();
};
<\/script>
`;export{e as default};
