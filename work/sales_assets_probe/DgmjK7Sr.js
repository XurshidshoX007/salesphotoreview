const e=`<template>
  <flex-col class="gap-4">
    <flex-row class="gap-4">
      <div class="w-2/3 grid grid-cols-2 gap-4 items-start">
        <dropdowns-by-filter-states
          :filter-states="additionalTabFilterStates"
          @onOpenDropdown="onOpenDropdown"
        />

        <d-input
          type="text"
          :label="t('column.ikpu_code')"
          :value="productFormData.ikpu_code"
          @change="productFormData.ikpu_code = $event"
        />
      </div>
      <flex-col class="gap-4 w-1/3">
        <d-input
          type="number"
          pattern-type="sort"
          :label="t('labels.sort')"
          :value="productFormData.sort"
          @change="productFormData.sort = $event"
        />

        <d-input
          type="text"
          :label="t('column.sap_code')"
          :value="productFormData.sub_code"
          @change="productFormData.sub_code = $event"
        />
        <d-input
          type="text"
          :label="t('column.barcode')"
          :value="productFormData.bar_code"
          @change="productFormData.bar_code = $event"
        />
      </flex-col>
    </flex-row>

    <flex-row class="w-full justify-end">
      <Switch
        class="w-1/3"
        :title="t('column.mml')"
        :active="productFormData.mml"
        @change="productFormData.mml = $event"
      />
    </flex-row>
  </flex-col>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { ProductGroupsModel } from "~/interfaces/api/settings/product-groups-model";
import type { BoxTypeModel } from "~/interfaces/api/settings/box-type-model";
import type { TradeDirectionsModel } from "~/interfaces/api/settings/trade-directions-model";
import type { BrandModel } from "~/interfaces/api/settings/brand-model";
import type { Segments } from "~/interfaces/api/settings/segments";
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";

// Props
const props = defineProps<{
  id?: string;
}>();

// Stores
const productsStore = useProductsStore("new-product");

// Composables
const { t } = useI18n();

// States
const { productFormData } = storeToRefs(productsStore);
const productGroups = ref<DropdownItemsModelByType<ProductGroupsModel>>();
const boxTypes = ref<DropdownItemsModelByType<BoxTypeModel>>();
const tradeDirections = ref<DropdownItemsModelByType<TradeDirectionsModel>>();
const brands = ref<DropdownItemsModelByType<BrandModel>>();
const segments = ref<DropdownItemsModelByType<Segments>>();

const additionalTabFilterStates = ref([
  {
    name: t("labels.product_group"),
    key: "product-group",
    isSingleSelect: true,
    get data() {
      return productGroups.value || [];
    },
    get getSelectedData() {
      return productFormData.value.product_group_id;
    },
    set setSelectedData(value: string) {
      productFormData.value.product_group_id = value;
    },
  },
  {
    name: t("settings_sidebar.box_type"),
    key: "box-types",
    isSingleSelect: true,
    get data() {
      return boxTypes.value || [];
    },
    get getSelectedData() {
      return productFormData.value.box_type_id;
    },
    set setSelectedData(value: string) {
      productFormData.value.box_type_id = value;
    },
  },
  {
    name: t("settings.segment"),
    key: "segments",
    isSingleSelect: true,
    get data() {
      return segments.value || [];
    },
    get getSelectedData() {
      return productFormData.value.segment_id;
    },
    set setSelectedData(value: string) {
      productFormData.value.segment_id = value;
    },
  },
  {
    name: t("settings_sidebar.trade_direction"),
    key: "trade-directions",
    get data() {
      return tradeDirections.value || [];
    },
    get getSelectedData() {
      return productFormData.value.trade_direction_id_arr || [];
    },
    set setSelectedData(value: string[]) {
      productFormData.value.trade_direction_id_arr = value;
    },
  },
  {
    name: t("settings.brand"),
    key: "brands",
    isSingleSelect: true,
    get data() {
      return brands.value || [];
    },
    get getSelectedData() {
      return productFormData.value.brand_id;
    },
    set setSelectedData(value: string) {
      productFormData.value.brand_id = value;
    },
  },
]);

const dropdownParams = ref<defaultDropdownParamsType>(
  props.id ? { ...dropdownParamsAll } : { ...defaultDropdownParams },
);

const loadProductGroups = async () => {
  if (productGroups.value?.items.length) return productGroups.value;
  productGroups.value = await productsStore.getProductGroups(
    dropdownParams.value,
  );
  return productGroups.value;
};

const loadBoxTypes = async () => {
  if (boxTypes.value?.items.length) return boxTypes.value;
  boxTypes.value = await productsStore.getBoxTypes(dropdownParams.value);
  return boxTypes.value;
};

const loadTradeDirections = async () => {
  if (tradeDirections.value?.items.length) return tradeDirections.value;
  tradeDirections.value = await productsStore.getTradeDirections(
    dropdownParams.value,
  );
  return tradeDirections.value;
};

const loadBrands = async () => {
  if (brands.value?.items.length) return brands.value;
  brands.value = await productsStore.getBrands(dropdownParams.value);
  return brands.value;
};

const loadSegments = async () => {
  if (segments.value?.items.length) return segments.value;
  segments.value = await productsStore.getSegments(dropdownParams.value);
  return segments.value;
};

// Hookds
onMounted(async () => {
  if (props.id) {
    await Promise.all([
      loadProductGroups(),
      loadBoxTypes(),
      loadTradeDirections(),
      loadBrands(),
      loadSegments(),
    ]);
  }
});

// Methods
const onOpenDropdown = async (state: string) => {
  if (state === "product-group") {
    await loadProductGroups();
    return;
  }
  if (state === "box-types") {
    await loadBoxTypes();
    return;
  }
  if (state === "trade-directions") {
    await loadTradeDirections();
    return;
  }
  if (state === "brands") {
    await loadBrands();
    return;
  }
  if (state === "segments") {
    await loadSegments();
  }
  return;
};
<\/script>
`;export{e as default};
