const n=`<template>
  <form @submit.prevent="save">
    <d-modal
      :name="!data.id ? t('clients.add') : t('edit')"
      data-container-width="740px"
      :loading="isGetByIdLoading"
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-5">
        <FlexibleItemsMenu
          tab-mode
          :items-arr="tabItems"
          :active-item-id="activeTab"
          @onChangeActiveItem="onChangeTab"
        />
        <div v-show="activeTab === 1" class="w-full grid grid-cols-2 gap-4">
          <flex-col class="gap-6">
            <dropdowns-by-filter-states
              :filter-states="mainTabFilterStates"
              @onOpenDropdown="onOpenDropdown"
            />
          </flex-col>
          <flex-col class="gap-6">
            <shared-localized-input
              required
              :label="t('column.name')"
              v-model:base="data.default_name"
              v-model:translations="data.name_l10n"
            />
            <d-input
              type="number"
              :label="t('labels.weight')"
              :value="data.weight"
              @change="data.weight = $event"
            />
            <d-input
              type="number"
              :label="t('column.volume')"
              :value="data.volume"
              required
              @change="data.volume = $event"
            />
          </flex-col>

          <div class="col-span-2">
            <div
              class="flex items-center justify-between rounded-lg border-1 w-full pr-0.2 pl-3"
            >
              <div>
                <span v-if="photoFile">
                  {{ photoFile.name }}
                </span>
                <input
                  id="file_upload_id"
                  accept="image/*"
                  ref="file"
                  @change="onFileChanged($event)"
                  style="display: none"
                  capture
                  type="file"
                />
              </div>
              <div class="justify-self-end">
                <m-btn type="button" @click="upload">
                  {{ t("settings.upload_image") }}
                </m-btn>
              </div>
            </div>
          </div>
        </div>
        <div v-show="activeTab === 2" class="w-full grid grid-cols-2 gap-4">
          <flex-col class="gap-5">
            <dropdowns-by-filter-states
              :filter-states="additionalTabFilterStates"
              @onOpenDropdown="onOpenDropdown"
            />
            <Switch
              :title="t('column.mml')"
              :active="data.mml"
              @change="data.mml = $event"
            />
          </flex-col>
          <flex-col class="gap-5">
            <d-input
              type="number"
              :label="t('column.quantity_for_block')"
              :value="data.quantity_in_package"
              @change="data.quantity_in_package = $event"
            />
            <d-input
              type="number"
              pattern-type="sort"
              :label="t('labels.sort')"
              :value="data.sort"
              @change="data.sort = $event"
            />
            <d-input
              type="text"
              :label="t('column.code')"
              pattern-type="code"
              :value="data.code"
              @change="data.code = $event"
            />
            <d-input
              type="text"
              :label="t('column.sap_code')"
              :value="data.sap_code"
              @change="data.sap_code = $event"
            />
            <d-input
              type="text"
              :label="t('column.barcode')"
              :value="data.bar_code"
              @change="data.bar_code = $event"
            />
          </flex-col>
        </div>
      </flex-col>
      <template #footer>
        <div class="flex justify-between items-center">
          <div class="w-30">
            <Switch
              :active="data.is_active"
              @change="data.is_active = $event"
            />
          </div>
          <m-btn :loading="isBtnLoading" type="submit">
            {{ !data.id ? t("clients.add") : t("save") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import type { BoxTypeModel } from "~/interfaces/api/settings/box-type-model";
import type { BrandModel } from "~/interfaces/api/settings/brand-model";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import type { ProductCategoryModel } from "~/interfaces/api/settings/product-category-model";
import type { ProductGroupsModel } from "~/interfaces/api/settings/product-groups-model";
import type { Segments } from "~/interfaces/api/settings/segments";
import type { TradeDirectionsModel } from "~/interfaces/api/settings/trade-directions-model";
import type { UnitModel } from "~/interfaces/api/settings/unit-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import { notify } from "@kyvg/vue3-notification";
import {
  defaultDropdownParams,
  dropdownParamsAll,
  productCategoryDropdownParams,
} from "~/variable/params";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { AuditEventKeys } from "~/variable/event-key-constants";
import type { AuditorSettingsProductSaveModel } from "~/interfaces/api/audit/settings/product/concurrent-product-model";

// Stores
const productsStore = useAuditProductsStore("main");

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// states
const { t } = useI18n();
const eventBus = useEventBus();
const isGetByIdLoading = ref<boolean>(false);
const isBtnLoading = ref<boolean>(false);
const category = ref<DropdownItemsModelByType<ProductCategoryModel>>();
const units = ref<DropdownItemsModelByType<UnitModel>>();
const productGroups = ref<DropdownItemsModelByType<ProductGroupsModel>>();
const tradeDirections = ref<DropdownItemsModelByType<TradeDirectionsModel>>();
const boxTypes = ref<DropdownItemsModelByType<BoxTypeModel>>();
const brands = ref<DropdownItemsModelByType<BrandModel>>();
const segments = ref<DropdownItemsModelByType<Segments>>();
const updateListEventKey = AuditEventKeys.PRODUCTS_CONCURRENT_TABLE_UPDATE;
let activeTab = ref<number>(1);
let photoFile = ref<File>();
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

const tabItems = ref([
  {
    id: 1,
    name: t("clients.general_data"),
  },
  {
    id: 2,
    name: t("clients.additional_data"),
  },
]);

const data = ref<AuditorSettingsProductSaveModel>({
  name: null,
  default_name: "",
  name_l10n: {},
  category_id: null,
  unit_id: null,
  volume: null,
  quantity_in_package: null,
  weight: null,
  sort: null,
  box_type_id: null,
  product_group_id: null,
  trade_direction_id: null,
  code: null,
  sap_code: null,
  bar_code: null,
  image_id: null,
  brand_id: null,
  manufacturer_id: null,
  packaging_type_id: null,
  segment_id: null,
  additional_group_id: null,
  is_active: true,
  mml: false,
  is_local: false,
});
const initialDetailData = ref(); // used to store the detail data on edit

// const subCategoryParams = ref<defaultDropdownParamsType>({ ...defaultDropdownParams });
const tradeDirectionsParams = ref<defaultDropdownParamsType>(
  dropdownParams.value,
);

const categoriesParams = ref<defaultDropdownParamsType>(
  dropdownParamsProductCategory.value,
);

const productGroupsParams = ref<defaultDropdownParamsType>(
  dropdownParams.value,
);

const unitsParams = ref<defaultDropdownParamsType>(dropdownParams.value);

const boxTypesParams = ref<defaultDropdownParamsType>(dropdownParams.value);

const brandsParams = ref<defaultDropdownParamsType>(dropdownParams.value);

const segmentsParams = ref<defaultDropdownParamsType>(dropdownParams.value);

const mainTabFilterStates = ref([
  {
    name: t("column.category"),
    key: "categories",
    required: true,
    isSingleSelect: true,
    get data() {
      return category.value || [];
    },
    get getSelectedData() {
      return data.value.category_id;
    },
    set setSelectedData(value: string) {
      data.value.category_id = value;
    },
  },
  {
    name: t("settings_sidebar.units"),
    key: "units",
    required: true,
    isSingleSelect: true,
    get data() {
      return units.value || [];
    },
    get getSelectedData() {
      return data.value.unit_id;
    },
    set setSelectedData(value: string) {
      data.value.unit_id = value;
    },
  },
  {
    name: t("column.product_group"),
    key: "product-group",
    required: true,
    isSingleSelect: true,
    get data() {
      return productGroups.value || [];
    },
    get getSelectedData() {
      return data.value.product_group_id;
    },
    set setSelectedData(value: string) {
      data.value.product_group_id = value;
    },
  },
]);

const additionalTabFilterStates = ref([
  {
    name: t("settings_sidebar.box_type"),
    key: "box-types",
    isSingleSelect: true,
    get data() {
      return boxTypes.value || [];
    },
    get getSelectedData() {
      return data.value.box_type_id;
    },
    set setSelectedData(value: string) {
      data.value.box_type_id = value;
    },
  },
  {
    name: t("settings_sidebar.trade_direction"),
    key: "trade-directions",
    isSingleSelect: true,
    get data() {
      return tradeDirections.value || [];
    },
    get getSelectedData() {
      return data.value.trade_direction_id;
    },
    set setSelectedData(value: string) {
      data.value.trade_direction_id = value;
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
      return data.value.brand_id;
    },
    set setSelectedData(value: string) {
      data.value.brand_id = value;
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
      return data.value.segment_id;
    },
    set setSelectedData(value: string) {
      data.value.segment_id = value;
    },
  },
]);

// hooks
const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

onMounted(async () => {
  if (props.id) {
    await Promise.all([
      getById(),
      getCategories(),
      getUnits(),
      getProductGroups(),
      getBoxTypes(),
      getTradeDirections(),
      getBrands(),
      getSegments(),
    ]);
  }
});

// Methods
const upload = () => {
  const file = document.getElementById("file_upload_id");
  if (file) {
    file.click();
  }
};

const onFileChanged = (e: any) => {
  const target = e.target;
  if (target && target.files) {
    photoFile.value = target.files[0];
  }
};

const onUploadPhotoFile = async () => {
  let photoFileData = null;
  if (photoFile.value) {
    const formData = new FormData();
    formData.append("form_file", photoFile.value);
    photoFileData = await productsStore.onPhotoFileUpload(formData);
  }
  if (photoFileData) {
    data.value.image_id = photoFileData?.data?.id;
  }
};

const closeDialog = () => {
  emit("closeDialog");
};

const updateListByActiveState = (isActive: boolean) => {
  if (isActiveStateChangedOnEdit.value) {
    eventBus.emit(updateListEventKey, !isActive);
    emit("clearFetchedTab", !isActive);
    return;
  }
  eventBus.emit(updateListEventKey, isActive);
};

const save = async () => {
  isBtnLoading.value = true;
  await onUploadPhotoFile();
  const res = await productsStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    notify({ title: t("saved"), type: "success" });
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getById = async () => {
  isGetByIdLoading.value = true;
  initialDetailData.value = await productsStore.getById(props.id!);
  data.value = { ...initialDetailData.value };
  isGetByIdLoading.value = false;
};

const onOpenDropdown = async (state: string, value: unknown) => {
  if (state === "product-group" && !productGroups.value) {
    await getProductGroups();
    return;
  }
  if (state === "categories" && !category.value) {
    await getCategories();
    return;
  }
  if (state === "units" && !units.value) {
    await getUnits();
  }
  if (state === "box-types" && !boxTypes.value) {
    await getBoxTypes();
  }
  if (state === "trade-directions" && !tradeDirections.value) {
    await getTradeDirections();
  }
  if (state === "brands" && !brands.value) {
    await getBrands();
  }
  if (state === "segments" && !segments.value) {
    await getSegments();
  }
  return;
};

const getCategories = async () => {
  category.value = await productsStore.getProductCategories(
    categoriesParams.value,
  );
};

const getProductGroups = async () => {
  productGroups.value = await productsStore.getProductGroups(
    productGroupsParams.value,
  );
};

const getUnits = async () => {
  units.value = await productsStore.getUnits(unitsParams.value);
};

const getBoxTypes = async () => {
  boxTypes.value = await productsStore.getBoxTypes(boxTypesParams.value);
};

const getTradeDirections = async () => {
  tradeDirections.value = await productsStore.getTradeDirections(
    tradeDirectionsParams.value,
  );
};

const getBrands = async () => {
  brands.value = await productsStore.getBrands(brandsParams.value);
};

const getSegments = async () => {
  segments.value = await productsStore.getSegments(segmentsParams.value);
};

const onChangeTab = (value: number) => {
  activeTab.value = value;
};
<\/script>
`;export{n as default};
