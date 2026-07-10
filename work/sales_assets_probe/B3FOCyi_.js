const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="paymentMethodHeader"
          :templates="currenciesStore.templates"
          @change="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="currenciesStore.templates"
          :save-key="paymentMethodHeader"
        />
        <page-size-btn
          :current-size="currenciesStore.params.page_size"
          @setPageSize="currenciesStore.setPageSize"
        />
        <search-input
          @change="currenciesStore.search"
          :value="currenciesStore.params.search"
        />
        <excel-btn
          @click="currenciesStore.onDownloadExcelFile"
          :loading="currenciesStore.isExcelFileDownloading"
        />
        <RefreshBtn @click="refresh" :loading="currenciesStore.loading" />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="currenciesStore.templates"
          :sorted="currenciesStore.params.order_by"
          :loading="currenciesStore.loading"
          :is-empty="!currenciesStore.data?.items.length"
          @sort="currenciesStore.sortData"
        >
          <template #body>
            <c-tr v-for="data in currenciesStore.data?.items" :key="data">
              <c-td-no-edit
                v-for="key in currenciesStore.templates"
                :key="key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div
                  v-if="key.key === 'is_default'"
                  class="text-end flex justify-end"
                >
                  <img
                    v-if="data['is_default']"
                    style="scale: 0.7"
                    src="../../../assets/img/fi-rr-check.svg"
                    alt=""
                  />
                </div>
                <div v-else-if="key.type === 'number'">
                  {{ getFormattedAmount(data[key.key]) }}
                </div>
                <div v-else-if="key.type === 'action'">
                  <rounded-icon-btn
                    type="edit"
                    :iconSize="20"
                    @click="openEditDialog(data.id)"
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
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="currenciesStore.params.page_size"
          :total-count="currenciesStore.data?.total_count"
          :page-number="currenciesStore.data?.page_number"
        />
        <page-index
          :available-pages="currenciesStore.data?.total_pages"
          :current-page="currenciesStore.data?.page_number"
          @setPage="currenciesStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="editingId">
        <SettingsBaseCurrencyDataDialog
          :id="editingId"
          @closeDialog="closeEditDialog"
          @clearFetchedTab="clearFetchedTab"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useEventBus } from "~/composables/EventBus/eventBus";
import type { Template } from "~/interfaces/ui/template";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { paymentMethodHeader } from "~/variable/column-constants";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// Store
const { isActive } = toRefs(props);
const currenciesStore = useBaseCurrenciesStore(isActive.value.toString());

// State
const eventBus = useEventBus();
const editingId = ref<string>("");
const updateListEventKey = SettingsEventKeys.BASE_CURRENCY_TABLE_UPDATE;

// hooks
eventBus.on(updateListEventKey, async (updatedIsActive) => {
  if (updatedIsActive === isActive.value) {
    await getData();
  }
});

onMounted(async () => {
  await getData();
});

// Methods
const onChangeTableHeaders = (param: Template[]) => {
  currenciesStore.templates = param;
};

const openEditDialog = (id: string) => {
  editingId.value = id;
};

const closeEditDialog = () => {
  editingId.value = "";
};

const clearFetchedTab = (isActive: boolean) => {
  emit("clearFetchedTab", isActive);
};

const getData = async () => {
  await currenciesStore.getData(isActive.value.toString());
};

const refresh = async () => {
  await currenciesStore.refresh();
};
<\/script>
`;export{e as default};
