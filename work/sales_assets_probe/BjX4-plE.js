const e=`<template>
  <form @submit.prevent="save">
    <d-modal
      :name="props.id ? t('edit') : t('clients.add')"
      :loading="isLoading"
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-5">
        <shared-localized-input
          required
          :label="t('column.name')"
          v-model:base="data.default_name"
          v-model:translations="data.name_l10n"
        />
        <d-input
          :label="t('column.code')"
          type="text"
          pattern-type="code"
          :value="data.code"
          @change="data.code = $event"
        />
        <d-input
          :label="t('labels.sort')"
          type="number"
          pattern-type="sort"
          :value="data.sort"
          @change="data.sort = $event"
        />
        <dropdowns-by-filter-states
          :filter-states="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="data.default_description"
          v-model:translations="data.description_l10n"
        />
        <Switch :active="data.is_active" @change="onChangeActivity" />
      </flex-col>
      <template #footer>
        <m-btn :loading="isBtnLoading" type="submit" class="w-full">
          {{ !data.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
    <transition name="modal">
      <div v-if="replacementProductGroupStore.productPriceError">
        <SettingsProductsReplacementProductGroupErrorTableDialog
          :is-required-price="!!replacementProductGroupStore.editId"
          :error-data="replacementProductGroupStore.productPriceError"
          @closeDialog="closeProductPriceErrorModal"
        />
      </div>
    </transition>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { notify } from "@kyvg/vue3-notification";
import type { ReplacementProductGroupUpdateModel } from "~/interfaces/api/orders/replacement-product-group-model";
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";

// Store
const replacementProductGroupStore = useReplacementProductGroupStore("main");

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// State
const { t } = useI18n();
const eventBus = useEventBus();
const isBtnLoading = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const updateListEventKey =
  SettingsEventKeys.REPLACEMENT_PRODUCT_GROUP_TABLE_UPDATE;
const products = ref<DropdownItemsModelByType<DropdownModel>>();
const priceTypes = ref<DropdownItemsModelByType<DropdownModel>>();
const dropdownParams = ref(
  props.id
    ? { ...dropdownParamsAll, replacement_product_group_id: props.id }
    : { ...defaultDropdownParams },
);
const priceTypeDropdownParams = ref(
  props.id ? { ...dropdownParamsAll } : { ...defaultDropdownParams },
);

const data = ref<Partial<ReplacementProductGroupUpdateModel>>({
  id: undefined,
  name: null,
  default_name: "",
  name_l10n: {},
  code: null,
  sort: null,
  is_active: true,
  description: null,
  default_description: "",
  description_l10n: {},
  product_id_arr: [],
  price_type_id_arr: [],
});
const initialDetailData = ref(); // used to store the detail data on edit

const filterStates = ref<FilterStateModel[]>([
  {
    name: t("settings.products"),
    required: true,
    key: "products",
    get data() {
      return products.value || [];
    },
    get getSelectedData() {
      return data.value.product_id_arr;
    },
    set setSelectedData(value: string[]) {
      data.value.product_id_arr = value;
    },
  },
  {
    name: t("settings_sidebar.price_type"),
    key: "price-type",
    required: true,
    get data() {
      return priceTypes.value || [];
    },
    get getSelectedData() {
      return data.value.price_type_id_arr;
    },
    set setSelectedData(value: string[]) {
      data.value.price_type_id_arr = value;
    },
  },
]);

// Hooks
const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

onBeforeMount(async () => {
  if (props.id) {
    replacementProductGroupStore.editId = props.id;
    await Promise.all([getDetail(), getProducts(), getPriceTypes()]);
  }
});

// Methods
const updateListByActiveState = (isActive: boolean) => {
  if (isActiveStateChangedOnEdit.value) {
    eventBus.emit(updateListEventKey, !isActive);
    emit("clearFetchedTab", !isActive);
    return;
  }
  eventBus.emit(updateListEventKey, isActive);
};

const closeDialog = () => {
  emit("closeDialog");
};

const save = async () => {
  isBtnLoading.value = true;
  const res = await replacementProductGroupStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    notify({ title: t("saved"), type: "success" });
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getDetail = async () => {
  isLoading.value = true;
  initialDetailData.value =
    await replacementProductGroupStore.getDetailForUpdate(props.id!);
  data.value = { ...initialDetailData.value };
  isLoading.value = false;
};

const onOpenDropdown = async (state: any) => {
  if (state === "products" && !products.value) {
    await getProducts();
    return;
  }
  if (state === "price-type" && !priceTypes.value) {
    await getPriceTypes();
    return;
  }
  return;
};

const getProducts = async () => {
  const data = await replacementProductGroupStore.getProducts(
    dropdownParams.value as any,
  );
  products.value = { items: data };
};

const getPriceTypes = async () => {
  const data = await replacementProductGroupStore.getPriceTypes(
    priceTypeDropdownParams.value,
  );
  priceTypes.value = data;
};

const closeProductPriceErrorModal = () => {
  replacementProductGroupStore.productPriceError = null;
  replacementProductGroupStore.editId = null;
};

const onChangeActivity = (value: boolean) => {
  data.value.is_active = value;
};
<\/script>
`;export{e as default};
