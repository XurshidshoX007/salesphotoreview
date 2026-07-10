const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="productsHeader"
        :templates="products.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <ShowHideColumn
        :headers="products.templates"
        :save-key="productsHeader"
      />
      <page-size-btn
        :current-size="products.params.page_size"
        :total-count="products.data?.total_count"
        :page-number="products.data?.page_number"
        @setPageSize="products.setPageSize"
      />
      <search-input @change="products.search" />
      <excel-btn
        @click="products.onDownloadExcelFile"
        :loading="products.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="products.isLoading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="products.templates"
        :sorted="products.params.order_by"
        :loading="products.isLoading"
        :is-empty="!products.data?.items.length"
        @sort="products.sortData"
      >
        <template #body>
          <c-tr v-for="data in products.data?.items" :key="data.id">
            <c-td-no-edit
              v-for="key in products.templates"
              :key="key"
              :is-checked="key.checked"
              :type="key.type"
            >
              <div v-if="key.key === 'name'">
                <link-component
                  isLinkable
                  :value="data[key.key]"
                  @click="detailId = data?.id"
                />
              </div>
              <div v-else-if="typeof data[key.key] === 'object'">
                {{ data[key.key]?.name }}
              </div>
              <div v-else-if="key.type === 'number'">
                {{ getFormattedAmount(data[key.key]) }}
              </div>
              <div v-else-if="key.key === 'action'">
                <rounded-icon-btn
                  v-if="hasAccess2ConcurrentProductUpdate"
                  type="edit"
                  :iconSize="20"
                  @click="openEditDialog(data?.id)"
                />
              </div>
              <div v-else-if="key.type === 'date'">
                {{ getFormattedDate(data[key.key], "DD.MM.YYYY") }}
              </div>
              <span v-else>
                {{ data[key.key] }}
              </span>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="products.params.page_size"
        :total-count="products.data?.total_count"
        :page-number="products.data?.page_number"
      />
      <page-index
        :available-pages="products.data?.total_pages"
        :current-page="products.data?.page_number"
        @setPage="products.setPage"
      />
    </div>
  </div>
  <transition name="modal">
    <div v-if="editingId">
      <AuditSettingsProductNewProductModalBody
        :id="editingId"
        @closeDialog="closeEditDialog"
        @clearFetchedTab="clearFetchedTab"
      />
    </div>
  </transition>
  <transition name="modal">
    <div v-if="detailId">
      <d-modal
        @closeDialog="detailId = ''"
        :name="t('labels.detailed_information')"
        dataContainerWidth="450px"
      >
        <AuditSettingsProductDetail :id="detailId" />
      </d-modal>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { Template } from "~/interfaces/ui/template";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { AuditEventKeys } from "~/variable/event-key-constants";
import { productsHeader } from "~/variable/column-constants";
import { useAuditSettingsAccess } from "~/composables/access/audit/audit-settings";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// store
const { isActive } = toRefs(props);
const products = useAuditProductsStore(isActive.value.toString());

// State
const { t } = useI18n();
const eventBus = useEventBus();
const detailId = ref("");
const editingId = ref("");
const router = useRouter();
const updateListEventKey = AuditEventKeys.PRODUCTS_CONCURRENT_TABLE_UPDATE;
const { hasAccess2ConcurrentProductUpdate } = useAuditSettingsAccess();

const result = ref({
  resultTable: true,
});

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
  products.templates = param;
};

const openEditDialog = (id: string | undefined) => {
  if (!id) return;
  editingId.value = id;
};

const closeEditDialog = () => {
  editingId.value = "";
};

const clearFetchedTab = (isActive: boolean) => {
  emit("clearFetchedTab", isActive);
};
const getData = async () => {
  await products.getData(isActive.value.toString());
};

const refresh = async () => {
  await products.refresh();
};
<\/script>
`;export{e as default};
