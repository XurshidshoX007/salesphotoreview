const n=`<template>
  <div class="table-content-container !border-none">
    <div class="table-content-header justify-between !px-0">
      <div class="table-content-btn-group">
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
      <div class="table-content-btn-group">
        <DropdownMenu
          :options="groupProcess"
          label-key="name"
          value-key="url"
          :content-width="200"
          @select="(option) => onSwitchToProcessMenu(String(option.url))"
        >
          <template #trigger>
            <m-btn group="gray">
              <IconFrame :result="result" />
              {{ t("clients.group_processing") }}
            </m-btn>
          </template>

          <template #item="{ option }">
            <div
              class="flex w-full items-center justify-between"
              :class="
                option.tone === 'danger' ? 'text-red-600' : 'text-neutral-950'
              "
            >
              <span>{{ option.name }}</span>
              <IconBan v-if="option.tone === 'danger'" class="text-xl" />
            </div>
          </template>
        </DropdownMenu>
      </div>
    </div>
    <div class="table-content-body">
      <data-table
        :headers="products.templates"
        :sorted="products.params.order_by"
        :loading="products.isLoading"
        :check="isTableAllChecked"
        :indeterminate="isTableIndeterminate"
        :is-empty="!products.data?.items.length"
        @sort="products.sortData"
        @getAllId="getAllProductsId"
      >
        <template #body>
          <c-tr v-for="data in products.data?.items" :key="data.id">
            <c-td-no-edit
              v-for="key in products.templates"
              :key="key"
              :is-checked="key.checked"
              :type="key.type"
            >
              <Checkbox
                v-if="key.key === 'checkbox'"
                :id="data.id"
                :checked="isTableChecked(data.id)"
                @change="onSelectProduct(data.id)"
              />
              <div v-else-if="key.type === 'array'">
                <ShowMore :data="data[key.key]" :show-count="2" />
              </div>
              <div v-else-if="key.key === 'name'">
                <link-component
                  isLinkable
                  :value="data[key.key]"
                  @click="detailId = data?.id"
                />
              </div>
              <div v-else-if="key.key === 'action'">
                <rounded-icon-btn
                  v-if="hasAccess2ProductUpdate"
                  type="edit"
                  :iconSize="20"
                  @click="openEditDialog(data?.id)"
                />
              </div>
              <span v-else>
                {{ getDataValue(data, key.key, key.type) }}
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
    <div v-if="products.deleteDialog">
      <CommonDeletedDialog
        @onSelectExit="products.closeDeleteDialog"
        @onSelectDelete="deletedProduct"
      />
    </div>
  </transition>
  <transition name="modal">
    <div v-if="editingId">
      <SettingsProductsNewProductModal
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
        <SettingsProductsDetail :id="detailId" />
      </d-modal>
    </div>
  </transition>
  <transition name="modal">
    <div v-if="isApproveDialogOpen">
      <ConfirmationDialog
        :is-save-btn-loading="isStatusLoading"
        :text="t('settings.do_you_want_change_status')"
        @closeDialog="onCloseApproveDialog"
        @onSave="onChangeStatus"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { ProductsModel } from "~/interfaces/api/settings/products-model";
import type { Template } from "~/interfaces/ui/template";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { productsHeader } from "~/variable/column-constants";
import { useProductsAccess } from "~/composables/access/settings/products/products";
import { getDataValue, type FilterParams } from "#imports";

// Types
interface PayloadType {
  isActive?: boolean;
  filters?: FilterParams[];
}

// props
const props = defineProps<{
  isActive: boolean;
  externalParams?: FilterParams[];
}>();

// emits
const emit = defineEmits(["clearFetchedTab"]);

// access
const {
  hasAccess2ProductUpdate,
  hasAccess2ProductCreate,
  hasAccess2ProductList,
} = useProductsAccess();

// store
const { isActive } = toRefs(props);
const products = useProductsStore(isActive.value.toString());

// State
const { t } = useI18n();
const eventBus = useEventBus();
const detailId = ref("");
const editingId = ref("");
const router = useRouter();
const isStatusLoading = ref(false);
const isApproveDialogOpen = ref(false);
const updateListEventKey = SettingsEventKeys.PRODUCTS_TABLE_UPDATE;

const result = ref({
  resultTable: true,
});

// hooks

const groupProcess = computed(() => {
  const items = [
    {
      name: t("labels.main"),
      url: "/settings/products/group-process/change-main-products",
      get hasAccess() {
        return hasAccess2ProductCreate.value;
      },
    },
    {
      name: t("labels.additional"),
      url: "/settings/products/group-process/change-secondary-products",
      get hasAccess() {
        return hasAccess2ProductList.value;
      },
    },
    {
      name: isActive.value
        ? t("warehouse.deactivated")
        : t("warehouse.activate"),
      url: "is_active",
      tone: "danger",
      get hasAccess() {
        return hasAccess2ProductUpdate.value;
      },
    },
  ];
  return items.filter((item) => item.hasAccess);
});

const isTableAllChecked = computed(() => {
  if (!products.data?.items.length) return false;
  return products.data?.items.every((item) =>
    products.productsIds.includes(item.id),
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !products.data?.items.length) return false;
  return products.data?.items.some((item) =>
    products.productsIds.includes(item.id),
  );
});

eventBus.on(updateListEventKey, async (payload: PayloadType) => {
  if (!payload) {
    await getData();
    clearFetchedTab(isActive.value);

    return;
  } else if (payload.isActive === isActive.value) {
    products.setNullProductIds();
    await getData(payload.filters);
  }
});

onMounted(async () => {
  await getData();
});

// Methods
const onSwitchToProcessMenu = (url: string) => {
  if (!products.productsIds.length) {
    notify({ title: t("first_select_product"), type: "error" });
    return;
  } else if (url === "is_active") {
    isApproveDialogOpen.value = true;
    return;
  }
  router.push(url);
};

const getAllProductsId = (checked: boolean) => {
  if (!checked) {
    products.setNullProductIds();
  } else {
    products.productsIds = products.data?.items.map(
      (product: ProductsModel) => product.id,
    );
  }
};

const onSelectProduct = (productId: string) => {
  if (!isTableChecked(productId)) {
    products.productsIds.push(productId);
  } else {
    products.productsIds = products.productsIds.filter(
      (id) => id !== productId,
    );
  }
};

const isTableChecked = (productId: string) => {
  return !!products.productsIds.find((id) => productId === id);
};

const onChangeTableHeaders = (param: Template[]) => {
  products.templates = param;
};

const onCloseApproveDialog = () => {
  isApproveDialogOpen.value = false;
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

const deletedProduct = async () => {
  await products.deleteProducts();
  await products.refresh();
};

const onChangeStatus = async () => {
  isStatusLoading.value = true;
  await products.onChangeMultipleProductsActivity(!props.isActive);
  isStatusLoading.value = false;
  onCloseApproveDialog();
  clearFetchedTab(props.isActive);
};

const setFilters = (filters?: FilterParams[]) => {
  (filters || props.externalParams)?.forEach((filter) => {
    products.setDynamicFilter(filter.field, filter.value);
  });
};

const getData = async (filters?: FilterParams[]) => {
  products.setDynamicFilter("is_active", [String(isActive.value)]);
  setFilters(filters);
};

const refresh = async () => {
  await products.refresh();
};
<\/script>
`;export{n as default};
