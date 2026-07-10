const e=`<template>
  <div class="rounded-large bg-white">
    <form @submit.prevent="save" class="flex flex-col gap-4 py-4">
      <div class="flex items-center justify-between px-4">
        <div class="flex items-center gap-3">
          <back-btn
            without-title
            class="size-10"
            :link="AppRoutes.settings.child.products.route"
          />
          <page-title
            :title="t('labels.adding_product')"
            size="xl"
            weight="500"
          />
        </div>
        <m-btn group="border" @click="addMore">
          <fa-icon hash="&#x2b;" />
          {{ t("add_more") }}
        </m-btn>
      </div>
      <div class="w-full overflow-auto pb-3 px-4">
        <multi-panel
          :headers-label="t('labels.name')"
          :headers="headers"
          :entered-data="enteredData"
          @remove="onDelete"
        >
          <template #header_volume="{ header }">
            <div class="flex items-center justify-between gap-2">
              <span>
                {{ header.name }}
              </span>

              <multi-tab
                variant="filled"
                :tabs="volumeUnitTabs"
                v-model:active="selectAllVolumeUnitId"
              />
            </div>
          </template>

          <template #prepend>
            <flex-col class="w-[490px] flex-shrink-0 gap-2.5">
              <div class="text-neutral-600 text-sm line-clamp-1 px-2">
                {{ t("settings.product.template") }}
              </div>

              <card
                :classes="{
                  root: 'mb-4 bg-white border bg-primary-100 p-2.5 rounded-[14px]',
                  content: 'text-base',
                }"
              >
                <flex-col class="gap-3">
                  <!-- Comment -->
                  <DropdownsByFilterStates
                    :filterStates="filterTotalProductCategoriesStates"
                    @onOpenDropdown="filterStore.onOpenDropdown"
                  />
                  <!-- Product name -->
                  <shared-localized-input
                    without-label
                    :base="commonDefaultName"
                    :translations="commonNameL10n"
                    @update:base="setCommonDefaultName"
                    @update:translations="setCommonNameL10n"
                  />

                  <!-- Quantities in a block -->
                  <d-input
                    type="number"
                    class="w-full"
                    :value="commonQuantity"
                    @change="changeTotalInput($event, 'quantity')"
                  />

                  <!-- Code -->
                  <d-input
                    pattern-type="code"
                    type="text"
                    :value="commonCode"
                    @change="changeTotalInput($event, 'code')"
                  />
                  <!-- Units of measurement -->
                  <DropdownsByFilterStates
                    :filterStates="filterTotalUnitStates"
                    @onOpenDropdown="filterStore.onOpenDropdown"
                  />

                  <!-- Product group -->
                  <DropdownsByFilterStates
                    :filterStates="filterTotalProductGroupStates"
                    @onOpenDropdown="filterStore.onOpenDropdown"
                  />

                  <!-- Trade direction -->
                  <DropdownsByFilterStates
                    :filterStates="filterTotalTradeDirectionStates"
                    @onOpenDropdown="filterStore.onOpenDropdown"
                  />

                  <!-- Segments -->
                  <DropdownsByFilterStates
                    :filterStates="filterTotalSegmentStates"
                    @onOpenDropdown="filterStore.onOpenDropdown"
                  />

                  <!-- Brand -->
                  <DropdownsByFilterStates
                    :filterStates="filterTotalBrandStates"
                    @onOpenDropdown="filterStore.onOpenDropdown"
                  />

                  <!-- Barcode -->
                  <d-input
                    type="text"
                    :value="commonBarCode"
                    @change="changeTotalInput($event, 'barCode')"
                  />

                  <!-- TN VED -->
                  <d-input
                    type="text"
                    :value="commonTnvedCode"
                    @change="changeTotalInput($event, 'tnvedCode')"
                  />

                  <!-- Status -->
                  <Switch
                    :active="commonStatus"
                    @change="changeTotalInput($event, 'status')"
                    class="h-10"
                    without-title
                  />

                  <!-- Volume -->
                  <VolumeInputs
                    group="all"
                    without-tabs
                    :volume-unit-id="selectAllVolumeUnitId"
                    :item_dimension="volumeAllItemDimension"
                    @setVolume="changeTotalInput($event, 'volume')"
                    @setVolumeUnit="setAllVolumeUnitId"
                  /> </flex-col
              ></card>
            </flex-col>
          </template>

          <template #cell="{ row, rowIndex, header }">
            <DropdownsByFilterStates
              v-if="header.data_type === 'dropdown'"
              :filterStates="header?.filter_states?.(rowIndex)"
              @onOpenDropdown="filterStore.onOpenDropdown"
            />

            <shared-localized-input
              v-else-if="header.data_type === 'localizedInput'"
              required
              without-label
              v-model:base="row.default_name"
              v-model:translations="row.name_l10n"
            />

            <d-input
              v-else-if="header.data_type === 'input'"
              :type="header.type === 'code' ? 'text' : header.type"
              :pattern-type="header.type === 'code' ? 'code' : undefined"
              class="w-full"
              :value="row[header.key]"
              @change="(value) => (row[header.key] = value)"
            />

            <Switch
              v-else-if="header.data_type === 'isActive'"
              :active="row[header.key]"
              @change="row[header.key] = $event"
              class="h-10"
              without-title
            />

            <VolumeInputs
              v-else-if="header.data_type === 'volumeInputs'"
              :key="rowIndex"
              group="multiple"
              without-tabs
              :volume-unit-id="selectAllVolumeUnitId"
              :item_dimension="row.item_dimension"
              @set-volume="row.item_dimension = $event"
            />
          </template>
        </multi-panel>
      </div>
      <flex-row class="justify-end gap-4 px-4">
        <nuxt-link :to="AppRoutes.settings.child.products.route">
          <m-btn group="gray"> {{ t("cancel") }}</m-btn>
        </nuxt-link>
        <m-btn type="submit" :loading="isBtnLoading"> {{ t("save") }}</m-btn>
      </flex-row>
    </form>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { AppRoutes } from "~/variable/routes";
import { notify } from "@kyvg/vue3-notification";

// Composables

const { t } = useI18n();

// Stores
const productsStore = useProductsStore("true");
const filterStore = useFiltersStore("/settings/product/multiple-add");

// States
const commonDefaultName = ref<string>("");
const commonNameL10n = ref<ProductsModel["name_l10n"]>({});
const commonQuantity = ref<string | null>(null);
const commonCode = ref<string | null>(null);
const commonStatus = ref<boolean | undefined>();
const commonBarCode = ref<string | null>(null);
const commonTnvedCode = ref<string | null>(null);
const isBtnLoading = ref<boolean>(false);

const createEmptyDimensions = (): ItemDimension => ({
  length: null,
  width: null,
  thickness: null,
});

const selectAllVolumeUnitId = ref(1);
const volumeAllItemDimension = ref(createEmptyDimensions());
const volumeUnitTabs = reactive<{ key: number; title: string }[]>([
  { title: "м3", key: 1 },
  { title: "см3", key: 2 },
]);

type ItemDimension = ProductsModel["item_dimension"];

const createEmptyProduct = (): ProductsModel => ({
  id: undefined,
  category_id: "",
  name: "",
  default_name: "",
  name_l10n: {},
  unit_id: "",
  product_group_id: null,
  quantity_in_package: null,
  code: null,
  is_active: true,
  item_dimension: createEmptyDimensions(),
  tnved_code: null,
  brand_id: undefined,
  segment_id: null,
  bar_code: undefined,
  trade_direction_id_arr: [],
});

const enteredData = ref<ProductsModel[]>([createEmptyProduct()]);

const headers = ref([
  {
    name: t("column.category"),
    key: "product-category",
    checked: true,
    is_sortable: false,
    data_type: "dropdown",
    filter_states: filterProductCategoryStates,
  },
  {
    name: t("labels.product_name"),
    key: "default_name",
    checked: true,
    is_sortable: false,
    data_type: "localizedInput",
  },
  {
    name: t("column.quantity_for_block"),
    key: "quantity_in_package",
    checked: true,
    is_sortable: false,
    data_type: "input",
    type: "number",
  },
  {
    name: t("column.code"),
    key: "code",
    checked: true,
    is_sortable: false,
    data_type: "input",
    type: "code",
  },
  {
    name: t("settings_sidebar.units"),
    key: "units",
    checked: true,
    is_sortable: false,
    data_type: "dropdown",
    filter_states: filterUnitStates,
  },
  {
    name: t("labels.product_group"),
    key: "product_group",
    checked: true,
    is_sortable: false,
    data_type: "dropdown",
    filter_states: filterProductGroupStates,
  },
  {
    name: t("settings_sidebar.trade_direction"),
    key: "trade_direction",
    checked: true,
    is_sortable: false,
    data_type: "dropdown",
    filter_states: filterTradeDirectionStates,
  },
  {
    name: t("settings.segment"),
    key: "segment",
    checked: true,
    is_sortable: false,
    data_type: "dropdown",
    filter_states: filterSegmentStates,
  },
  {
    name: t("settings.brand"),
    key: "brand",
    checked: true,
    is_sortable: false,
    data_type: "dropdown",
    filter_states: filterBrandStates,
  },
  {
    name: t("column.barcode"),
    key: "bar_code",
    checked: true,
    is_sortable: false,
    data_type: "input",
    type: "text",
  },
  {
    name: t("column.tnved"),
    key: "tnved_code",
    checked: true,
    is_sortable: false,
    data_type: "input",
    type: "text",
  },
  {
    name: t("column.status"),
    key: "is_active",
    checked: true,
    is_sortable: false,
    data_type: "isActive",
  },
  {
    name: t("column.volume"),
    key: "volume",
    checked: true,
    is_sortable: false,
    data_type: "volumeInputs",
  },
]);

// Methods
const applyToAllProducts = (updater: (product: ProductsModel) => void) => {
  enteredData.value.forEach((product) => {
    updater(product);
  });
};

const changeTotalInput = (value: any, type: string) => {
  switch (type) {
    case "volume":
      volumeAllItemDimension.value = {
        ...volumeAllItemDimension.value,
        ...value,
      };
      applyToAllProducts((product) => {
        product.item_dimension = { ...product.item_dimension, ...value };
      });
      break;
    case "quantity":
      commonQuantity.value = value;
      applyToAllProducts((product) => {
        product.quantity_in_package = value;
      });
      break;
    case "code":
      commonCode.value = value;
      applyToAllProducts((product) => {
        product.code = value;
      });
      break;
    case "status":
      commonStatus.value = value;
      applyToAllProducts((product) => {
        product.is_active = value;
      });
      break;
    case "barCode":
      commonBarCode.value = value;
      applyToAllProducts((product) => {
        product.bar_code = value;
      });
      break;
    case "tnvedCode":
      commonTnvedCode.value = value;
      applyToAllProducts((product) => {
        product.tnved_code = value;
      });
      break;
  }
};

const setAllVolumeUnitId = (id: number) => {
  selectAllVolumeUnitId.value = id;
};

const setCommonDefaultName = (value: string) => {
  commonDefaultName.value = value;
  applyToAllProducts((product) => {
    product.default_name = value;
  });
};

const setCommonNameL10n = (value: ProductsModel["name_l10n"]) => {
  commonNameL10n.value = value || {};
  applyToAllProducts((product) => {
    product.name_l10n = { ...(value || {}) };
  });
};

function filterProductCategoryStates(idx: number) {
  return [
    {
      name: "",
      key: "product-category",
      isSingleSelect: true,
      required: true,
      get data() {
        return filterStore.productCategory || [];
      },
      get getSelectedData() {
        return enteredData.value[idx].category_id;
      },
      set setSelectedData(value: string) {
        enteredData.value[idx].category_id = value;
      },
    },
  ];
}

function filterUnitStates(idx: number) {
  return [
    {
      name: "",
      key: "units",
      isSingleSelect: true,
      required: true,
      get data() {
        return filterStore.units || [];
      },
      get getSelectedData() {
        return enteredData.value[idx].unit_id;
      },
      set setSelectedData(value: string) {
        enteredData.value[idx].unit_id = value;
      },
    },
  ];
}

function filterProductGroupStates(idx: number) {
  return [
    {
      name: "",
      key: "product-group",
      isSingleSelect: true,
      get data() {
        return filterStore.productGroup || [];
      },
      get getSelectedData() {
        return enteredData.value[idx].product_group_id;
      },
      set setSelectedData(value: string) {
        enteredData.value[idx].product_group_id = value;
      },
    },
  ];
}

function filterTradeDirectionStates(idx: number) {
  return [
    {
      name: "",
      key: \`trade-directions-\${idx}\`,
      storeKey: "trade-directions",
      get data() {
        return filterStore.tradeDirections || [];
      },
      get getSelectedData() {
        return enteredData.value[idx].trade_direction_id_arr || [];
      },
      set setSelectedData(value: string[]) {
        enteredData.value[idx].trade_direction_id_arr = Array.isArray(value)
          ? [...value]
          : [];
      },
    },
  ];
}

function filterSegmentStates(idx: number) {
  return [
    {
      name: "",
      key: "segments",
      isSingleSelect: true,
      get data() {
        return filterStore.segments || [];
      },
      get getSelectedData() {
        return enteredData.value[idx].segment_id;
      },
      set setSelectedData(value: string) {
        enteredData.value[idx].segment_id = value;
      },
    },
  ];
}

function filterBrandStates(idx: number) {
  return [
    {
      name: "",
      key: "brands",
      isSingleSelect: true,
      get data() {
        return filterStore.brands || [];
      },
      get getSelectedData() {
        return enteredData.value[idx].brand_id;
      },
      set setSelectedData(value: string) {
        enteredData.value[idx].brand_id = value;
      },
    },
  ];
}

const filterTotalProductCategoriesStates = ref([
  {
    name: "",
    key: "product-category",
    get data() {
      return filterStore.productCategory || [];
    },
    get getSelectedData() {
      return filterStore.selectedSingleProductCategories;
    },
    set setSelectedData(value: string) {
      filterStore.selectedSingleProductCategories = value;
      applyToAllProducts((product) => {
        product.category_id = value;
      });
    },
    isSingleSelect: true,
  },
]);

const filterTotalUnitStates = ref([
  {
    name: "",
    key: "units",
    isSingleSelect: true,
    get data() {
      return filterStore.units || [];
    },
    get getSelectedData() {
      return filterStore.selectedSingleUnits;
    },
    set setSelectedData(value: string) {
      filterStore.selectedSingleUnits = value;
      applyToAllProducts((product) => {
        product.unit_id = value;
      });
    },
  },
]);

const filterTotalProductGroupStates = ref([
  {
    name: "",
    key: "product-group",
    isSingleSelect: true,
    get data() {
      return filterStore.productGroup || [];
    },
    get getSelectedData() {
      return filterStore.selectedSingleProductGroup;
    },
    set setSelectedData(value: string) {
      filterStore.selectedSingleProductGroup = value;
      applyToAllProducts((product) => {
        product.product_group_id = value;
      });
    },
  },
]);

const filterTotalTradeDirectionStates = ref([
  {
    name: "",
    key: "trade-directions-total",
    storeKey: "trade-directions",
    get data() {
      return filterStore.tradeDirections || [];
    },
    get getSelectedData() {
      return filterStore.selectedTradeDirections || [];
    },
    set setSelectedData(value: string[]) {
      const selections = Array.isArray(value) ? [...value] : [];
      filterStore.selectedTradeDirections = selections;
      applyToAllProducts((product) => {
        product.trade_direction_id_arr = [...selections];
      });
    },
  },
]);

const filterTotalSegmentStates = ref([
  {
    name: "",
    key: "segments-total",
    storeKey: "segments",
    isSingleSelect: true,
    get data() {
      return filterStore.segments || [];
    },
    get getSelectedData() {
      return filterStore.singleSelectedSegment;
    },
    set setSelectedData(value: string | null) {
      filterStore.singleSelectedSegment = value;
      applyToAllProducts((product) => {
        product.segment_id = value ?? null;
      });
    },
  },
]);

const filterTotalBrandStates = ref([
  {
    name: "",
    key: "brands-total",
    storeKey: "brands",
    isSingleSelect: true,
    get data() {
      return filterStore.brands || [];
    },
    get getSelectedData() {
      return filterStore.singleSelectedBrand;
    },
    set setSelectedData(value: string | null) {
      filterStore.singleSelectedBrand = value;
      applyToAllProducts((product) => {
        product.brand_id = value ?? undefined;
      });
    },
  },
]);

function addMore() {
  enteredData.value.push(createEmptyProduct());
}

function onDelete(index: any) {
  if (enteredData.value?.length > 1) {
    enteredData.value.splice(index, 1);
  }
}

const normalizeProductForSave = (product: ProductsModel): ProductsModel => {
  const normalizedName = product.default_name || product.name || "";

  return {
    ...product,
    default_name: normalizedName,
    name_l10n: product.name_l10n || {},
    code: product.code == null ? null : String(product.code),
  };
};

const save = async () => {
  isBtnLoading.value = true;

  try {
    const results = await Promise.all(
      enteredData.value?.map(async (product, index) => {
        const payload = normalizeProductForSave(product);
        const res = await productsStore.onAddMultipleProducts(payload);
        return res !== "error" ? index : null; // Return index if successful, null otherwise
      }),
    );

    enteredData.value = enteredData.value.filter(
      (_, index) => !results.includes(index),
    );
    if (enteredData.value.length === 0) {
      navigateTo("/settings/products");
      setDefaultValues();
    }
    notify({ type: "success", title: t("save") });
  } catch (error) {
    notify({ type: "error", title: t("error") });
  } finally {
    isBtnLoading.value = false;
  }
};

const setDefaultValues = () => {
  filterStore.selectedSingleProductCategories = null;
  filterStore.selectedSingleUnits = null;
  filterStore.selectedSingleProductGroup = null;
  filterStore.singleSelectedBrand = null;
  filterStore.singleSelectedSegment = null;
  filterStore.selectedTradeDirections = [];
  commonDefaultName.value = "";
  commonNameL10n.value = {};
  commonQuantity.value = null;
  commonCode.value = null;
  volumeAllItemDimension.value = createEmptyDimensions();
  selectAllVolumeUnitId.value = 1;
  enteredData.value = [createEmptyProduct()];
};
<\/script>
`;export{e as default};
