const e=`<template>
  <div class="rounded-lg bg-white border-grey">
    <div class="flex flex-row gap-4 p-4 items-center">
      <table-sort-columns
        :save-key="territoriesHeader"
        :templates="territoriesStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="territoriesStore.templates"
        :save-key="territoriesHeader"
      />
      <div>
        <page-size-btn
          :current-size="territoriesStore.params.page_size"
          :total-count="territoriesStore.data?.total_count"
          :page-number="territoriesStore.data?.page_number"
          @setPageSize="territoriesStore.setPageSize"
        />
      </div>
      <div>
        <search-input
          @change="territoriesStore.search"
          :value="territoriesStore.params.search"
          class="w-full h-38px"
        />
      </div>
      <div>
        <excel-btn :size="'360kb'"></excel-btn>
      </div>
      <div>
        <RefreshBtn @click="refresh" :loading="territoriesStore.loading" />
      </div>
    </div>
    <div class="pb-3 w-full overflow-auto">
      <data-table
        :headers="territoriesStore.templates"
        @sort="territoriesStore.sortData"
        :sorted="territoriesStore.params.order_by"
        :loading="territoriesStore.loading"
        :is-empty="!territoriesStore.data?.items.length"
      >
        <template #body>
          <c-tr v-for="data in territoriesStore.data?.items" :key="data">
            <c-td-no-edit
              v-for="key in territoriesStore.templates"
              :key="key"
              :is-checked="key.checked"
            >
              <div v-if="key.key === 'action'">
                <rounded-icon-btn
                  type="edit"
                  :iconSize="20"
                  @click="() => dialogStore.edit({ ...data })"
                />
              </div>
              <div v-else>
                {{ data[key.key] }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
    <div class="flex justify-between w-full">
      <div class="flex p-3 gap-2 items-center">
        <curren-page-btn
          :current-size="territoriesStore.params.page_size"
          :total-count="territoriesStore.data?.total_count"
          :page-number="territoriesStore.data?.page_number"
        />
      </div>
      <div class="p-3">
        <page-index
          :available-pages="territoriesStore.data?.total_pages"
          :current-page="territoriesStore.data?.page_number"
          @setPage="territoriesStore.setPage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Stores
import { useI18n } from "vue-i18n";
import { territoriesHeader } from "~/variable/column-constants";

const dialogStore = useDialogStore("territories");
const territoriesStore = useTerritoriesStore("");

// State
const { t } = useI18n();

// Methods

const refresh = () => {
  territoriesStore.refresh();
};
const onChangeTableHeaders = (newValue) => {
  territoriesStore.templates = newValue;
};
<\/script>
`;export{e as default};
