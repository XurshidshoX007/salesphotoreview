const n=`<template>
  <form id="app" @submit.prevent="save">
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
          :label="t('labels.sort')"
          type="number"
          pattern-type="sort"
          :value="data.sort"
          @change="data.sort = $event"
        />
        <DropdownsByFilterStates
          :filterStates="inventoryGroupFilterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <d-input
          :label="t('column.code')"
          pattern-type="code"
          :value="data.code"
          @change="data.code = $event"
        />
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="defaultDescriptionBase"
          v-model:translations="data.description_l10n"
        />
        <Switch :active="data.is_active" @change="onChangeActivity" />
      </flex-col>
      <template #footer>
        <m-btn :loading="isBtnLoading" class="w-full" type="submit">
          {{ !data.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import type { DropdownsByFilterStates } from "#components";
import type { InventoryTypeModel } from "~/interfaces/api/clients/inventory-type-model";
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

const { t } = useI18n();
const eventBus = useEventBus();
const inventoryTypesStore = useInventoryTypesStore("");
const isBtnLoading = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const inventoryGroup = ref<DropdownItemsModelByType<InventoryTypeModel>>();
const updateListEventKey = SettingsEventKeys.INIVENTORY_TYPES_TABLE_UPDATE;
const dropdownParams = ref(
  props.id ? { ...dropdownParamsAll } : { ...defaultDropdownParams },
);

const inventoryGroupParams = ref<defaultDropdownParamsType>(
  dropdownParams.value,
);

const data = ref<Partial<InventoryTypeModel>>({
  id: undefined,
  name: "",
  default_name: "",
  name_l10n: {},
  sort: null,
  code: null,
  description: null,
  default_description: undefined,
  description_l10n: {},
  is_active: true,
  inventory_group_id: "",
});
const initialDetailData = ref(); // used to store the detail data on edit

const defaultDescriptionBase = computed({
  get: () => data.value.default_description || undefined,
  set: (value?: string) => {
    data.value.default_description = value;
  },
});

const inventoryGroupFilterStates = ref([
  {
    name: t("column.inventory_group"),
    key: "inventory-group",
    isSingleSelect: true,
    required: true,
    get data() {
      return inventoryGroup.value || [];
    },
    get getSelectedData() {
      return data.value.inventory_group_id;
    },
    set setSelectedData(value: string) {
      data.value.inventory_group_id = value;
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
    isLoading.value = true;
    await Promise.all([getDetail(), getInventoryGroup()]);
    isLoading.value = false;
  }
});

// methods
const closeDialog = () => {
  emit("closeDialog");
};

const onChangeActivity = (isActive: boolean) => {
  data.value.is_active = isActive;
};

const updateListByActiveState = (isActive: boolean) => {
  if (isActiveStateChangedOnEdit.value) {
    eventBus.emit(updateListEventKey, !isActive);
    emit("clearFetchedTab", !isActive);
    return;
  }
  eventBus.emit(updateListEventKey, isActive);
};

const save = async (e: any) => {
  isBtnLoading.value = true;
  const res = await inventoryTypesStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    notify({ title: t("saved"), type: "success" });
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getDetail = async () => {
  initialDetailData.value = await inventoryTypesStore.getDetail(props.id!);
  data.value = { ...initialDetailData.value };
};

const onOpenDropdown = async (key: string) => {
  if (key === "inventory-group" && !inventoryGroup.value) {
    await getInventoryGroup();
  }
};

const getInventoryGroup = async () => {
  inventoryGroup.value = await inventoryTypesStore.getInventoryGroup(
    inventoryGroupParams.value,
  );
};
<\/script>
`;export{n as default};
