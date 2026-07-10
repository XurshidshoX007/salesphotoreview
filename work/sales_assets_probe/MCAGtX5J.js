const n=`<template>
  <flex-row class="gap-5">
    <flex-col class="page-gap w-2/5 pb-2">
      <dropdowns-by-filter-states
        :filter-states="categoryFilterStates"
        @onOpenDropdown="onOpenDropdown"
      />
      <shared-localized-input
        required
        :label="t('column.name')"
        v-model:base="productFormData.default_name"
        v-model:translations="productFormData.name_l10n"
      />
      <dropdowns-by-filter-states
        :filter-states="unitsFilterStates"
        @onOpenDropdown="onOpenDropdown"
      />
      <d-input
        type="number"
        :label="t('labels.weight')"
        :value="productFormData.weight"
        @change="productFormData.weight = $event"
      />
      <d-input
        type="text"
        :label="t('column.code')"
        pattern-type="code"
        :value="productFormData.code"
        @change="productFormData.code = $event"
      />
      <Switch
        :active="productFormData.is_active"
        @change="productFormData.is_active = $event"
      />
    </flex-col>
    <flex-row
      class="page-gap w-3/5 bg-neutral-50 p-3 rounded-xl justify-between"
    >
      <flex-col class="page-gap w-1/2 justify-between">
        <flex-col class="page-gap">
          <d-input
            key="width"
            id="width"
            type="number"
            :label="\`\${t('labels.width')} (\${currentVolumeUnit})\`"
            :value="productFormData.item_dimension?.width"
            :after-point-length="5"
            @input="setInputValue($event.target.value, 'width')"
          />
          <d-input
            key="thickness"
            id="thickness"
            type="number"
            :label="\`\${t('labels.thickness')} (\${currentVolumeUnit})\`"
            :value="productFormData.item_dimension?.thickness"
            :after-point-length="5"
            @input="setInputValue($event.target.value, 'thickness')"
          />
          <d-input
            key="length"
            id="length"
            type="number"
            :label="\`\${t('labels.length')} (\${currentVolumeUnit})\`"
            :after-point-length="5"
            :value="productFormData.item_dimension?.length"
            @input="setInputValue($event.target.value, 'length')"
          />
        </flex-col>

        <RadioBtn
          class="w-fit bg-white"
          :items="volumeUnits"
          :selected-item="selectedVolumeUnitId"
          @onSelectItemId="changeVolumeUnit"
        />
      </flex-col>
      <flex-col class="page-gap w-1/2 justify-end items-end relative">
        <img
          src="@/assets/svg/EmptyBox.svg"
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-9xl object-contain"
        />

        <div class="volume-container">
          <div class="title">{{ t("column.volume") }}:</div>
          <Tag size="small" color="gray">
            {{ getVolume() }} {{ currentVolumeUnit }}3
          </Tag>
        </div>
      </flex-col>
    </flex-row>
  </flex-row>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useI18n } from "vue-i18n";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { ProductCategoryModel } from "~/interfaces/api/settings/product-category-model";
import type { UnitModel } from "~/interfaces/api/settings/unit-model";
import {
  defaultDropdownParams,
  dropdownParamsAll,
  productCategoryDropdownParams,
} from "~/variable/params";

// Props
const props = defineProps<{
  id?: string;
}>();

// Types
enum UnitEnums {
  M = 1,
  Sm = 2,
}

// Stores
const productsStore = useProductsStore("new-product");

// Composables
const { t } = useI18n();

// States
const { productFormData } = storeToRefs(productsStore);
const categories = ref<DropdownItemsModelByType<ProductCategoryModel>>();
const units = ref<DropdownItemsModelByType<UnitModel>>();
const selectedVolumeUnitId = ref<number>(UnitEnums.M);

const categoryFilterStates = ref([
  {
    name: t("column.category"),
    key: "categories",
    required: true,
    isSingleSelect: true,
    get data() {
      return categories.value || [];
    },
    get getSelectedData() {
      return productFormData.value.category_id;
    },
    set setSelectedData(value: string) {
      productFormData.value.category_id = value;
    },
  },
]);

const unitsFilterStates = ref([
  {
    name: t("settings_sidebar.units"),
    key: "units",
    required: true,
    isSingleSelect: true,
    get data() {
      return units.value || [];
    },
    get getSelectedData() {
      return productFormData.value.unit_id;
    },
    set setSelectedData(value: string) {
      productFormData.value.unit_id = value;
    },
  },
]);

const dropdownParams = ref(
  props.id ? { ...dropdownParamsAll } : { ...defaultDropdownParams },
);

const dropdownParamsProductCategory = ref(
  props.id
    ? {
        ...dropdownParamsAll,
        filter: [
          ...(dropdownParamsAll.filter || []),
          {
            field: "is_sub_category",
            value: ["false"],
          },
        ],
      }
    : { ...productCategoryDropdownParams },
);

const unitsParams = ref<defaultDropdownParamsType>(dropdownParams.value);
const categoriesParams = ref<defaultDropdownParamsType>(
  dropdownParamsProductCategory.value,
);
const volumeUnits = ref([
  {
    name: t("labels.in_meter"),
    id: UnitEnums.M,
    unitName: t("settings.m"),
  },
  {
    name: t("labels.in_centimeter"),
    id: UnitEnums.Sm,
    unitName: t("settings.cm"),
  },
]);

const loadCategories = async () => {
  if (categories.value?.items.length) return categories.value;
  categories.value = await productsStore.getProductCategories(
    categoriesParams.value,
  );
  return categories.value;
};

const loadUnits = async () => {
  if (units.value?.items.length) return units.value;
  units.value = await productsStore.getUnits(unitsParams.value);
  return units.value;
};

// Hooks
onMounted(async () => {
  if (props.id) {
    await Promise.all([loadCategories(), loadUnits()]);
  }
});

const currentVolumeUnit = computed(
  () =>
    volumeUnits.value?.find((unit) => unit.id === selectedVolumeUnitId.value)
      ?.unitName,
);

const volumeType = computed(() =>
  selectedVolumeUnitId.value !== UnitEnums.M ? 1000000 : 1,
);
// Methods

const changeVolumeUnit = () => {
  selectedVolumeUnitId.value =
    selectedVolumeUnitId.value === UnitEnums.M ? UnitEnums.Sm : 1;
};

const onOpenDropdown = async (state: string) => {
  if (state === "categories") {
    await loadCategories();
    return;
  }
  if (state === "units") {
    await loadUnits();
  }
  return;
};

const getVolume = () => {
  if (!productFormData.value.item_dimension) return 0;
  const { width, thickness, length } = productFormData.value.item_dimension;
  if (!Boolean(width && thickness && length)) return 0;

  return getFormattedAmount((width! * thickness! * length!) / volumeType.value);
};

const setInputValue = (
  value: string,
  type: "length" | "width" | "thickness",
) => {
  if (productFormData.value.item_dimension) {
    productFormData.value.item_dimension[type] = Number(
      value.replace(/\\s/g, ""),
    );
  }
};
<\/script>

<style scoped lang="scss">
.volume-container {
  display: flex;
  align-items: center;
  gap: 0 8px;
  flex-wrap: wrap;

  .title {
    font-size: 16px;
    font-family: "Inter", sans-serif;
    font-weight: 400;
    color: #299b9b;
  }

  .value {
    font-size: 14px;
    font-family: "Inter", sans-serif;
    font-weight: 400;
    color: #424f4f;
  }
}
</style>
`;export{n as default};
