const n=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="data?.id ? t('edit') : t('clients.add')"
      :loading="productSubCategoryStore.loadingUpdate"
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
          :value="data.code"
          pattern-type="code"
          @change="data.code = $event"
        />
        <d-input
          :label="t('labels.sort')"
          pattern-type="sort"
          type="number"
          :value="data.sort"
          @change="data.sort = $event"
        />
        <DropdownsByFilterStates
          :filter-states="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <shared-localized-input
          :label="t('column.comment')"
          class="w-full"
          v-model:base="data.default_description"
          v-model:translations="data.description_l10n"
        />
        <Switch :active="data.is_active" @change="onChangeActive" />
      </flex-col>
      <template #footer>
        <m-btn :loading="saveLoading" class="w-full" type="submit">
          {{ !data?.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import type { ProductCategoryModel } from "~/interfaces/api/settings/product-category-model";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// store
const productSubCategoryStore = useProductSubCategoryStore("main");

// state
const { t } = useI18n();
const eventBus = useEventBus();
const saveLoading = ref(false);
const updateListEventKey =
  SettingsEventKeys.PRODUCT_CATEGORY_SUBCATEGORY_TABLE_UPDATE;
const units = ref();

const data = ref<Partial<ProductCategoryModel>>({
  id: undefined,
  name: null,
  default_name: "",
  name_l10n: {},
  code: null,
  unit_id: null,
  description: null,
  default_description: "",
  description_l10n: {},
  sort: null,
  is_active: true,
  is_sub_category: true,
});
const initialDetailData = ref();

const filterStates = ref([
  {
    name: t("settings_sidebar.units"),
    key: "units",
    isSingleSelect: true,
    required: true,
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
]);

// hooks
const unitsParams = computed(() => {
  return props.id
    ? { ...dropdownParamsAll, ...defaultDropdownParams }
    : defaultDropdownParams;
});

const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

onBeforeMount(async () => {
  if (props.id) {
    await Promise.all([getDetail(), getUnits()]);
  }
});

// methods
const updateListByActiveState = (isActive: boolean) => {
  if (isActiveStateChangedOnEdit.value) {
    eventBus.emit(updateListEventKey, !isActive);
    emit("clearFetchedTab", !isActive);
    return;
  }
  eventBus.emit(updateListEventKey, isActive);
};

const onChangeActive = (value: boolean) => {
  data.value.is_active = value;
};

const closeDialog = () => {
  emit("closeDialog");
};

const onOpenDropdown = async (key: string) => {
  if (key === "units" && !units.value) {
    await getUnits();
  } else return;
};

const getUnits = async () => {
  units.value = await productSubCategoryStore.getUnits(unitsParams.value);
};

const getDetail = async () => {
  data.value = await productSubCategoryStore.detailProductCategory(props.id!);
};

const save = async () => {
  saveLoading.value = true;
  const res = await productSubCategoryStore.add(data.value as any);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    notify({ title: t("saved"), type: "success" });
    closeDialog();
  }
  saveLoading.value = false;
};
<\/script>
`;export{n as default};
