const n=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="props.id ? t('edit') : t('clients.add')"
      :loading="productActiveStore.loadingUpdate"
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
          pattern-type="sort"
          type="number"
          :value="data.sort"
          @change="data.sort = $event"
        />
        <DropdownsByFilterStates
          :filterStates="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="data.default_description"
          v-model:translations="data.description_l10n"
        />
        <Switch :active="data.is_active" @change="onChangeActive" />
      </flex-col>
      <template #footer>
        <m-btn :loading="isLoadingBtn" class="w-full" type="submit">
          {{ !data?.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import type { DropdownsByFilterStates } from "#components";
import type { ProductCategoryModel } from "~/interfaces/api/settings/product-category-model";
import type { UnitModel } from "~/interfaces/api/settings/unit-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// Stores
const productActiveStore = useProductCategoryStore("");

// State
const { t } = useI18n();
const eventBus = useEventBus();
const isLoadingBtn = ref(false);
const updateListEventKey = SettingsEventKeys.PRODUCT_CATEGORY_TABLE_UPDATE;
const units = ref<DropdownItemsModelByType<UnitModel>>();
const dropdownParams = ref(
  props.id ? { ...dropdownParamsAll } : { ...defaultDropdownParams },
);

const unitsParams = ref<defaultDropdownParamsType>(dropdownParams.value);

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
  is_sub_category: false,
});
const initialDetailData = ref(); // used to store the detail data on edit

let filterStates = ref([
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

const onOpenDropdown = async (key: string) => {
  if (key === "units" && !units.value) {
    await getUnits();
  }
};

const getUnits = async () => {
  units.value = await productActiveStore.getUnits(unitsParams.value);
};

const save = async () => {
  isLoadingBtn.value = true;
  const res = await productActiveStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    notify({ title: t("saved"), type: "success" });
    closeDialog();
  }
  isLoadingBtn.value = false;
};

const getDetail = async () => {
  initialDetailData.value = await productActiveStore.detailProductCategory(
    props.id!,
  );
  data.value = { ...initialDetailData.value };
};

const onChangeActive = (isActive: boolean) => {
  data.value.is_active = isActive;
};

const closeDialog = () => emit("closeDialog");
<\/script>
`;export{n as default};
