const e=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="data?.id ? t('edit') : t('clients.add')"
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
        <DropdownsByFilterStates
          :filterStates="typeFilterStates"
          @on-open-dropdown="onOpenDropdown"
        />
        <d-input
          :label="t('column.code')"
          pattern-type="code"
          :value="data.code"
          @change="data.code = $event"
        />
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="data.default_description"
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
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { ReasonTypes } from "~/variable/static-constants";
import { types as PageTypes } from "@/components/shared/settings/reasons/propsTypes";
import type { ReturnExchangeReasonPostModel } from "~/interfaces/api/settings/return-exchange-reason-model";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";

// props
const props = defineProps<{
  id?: string;
  pageType: PageTypes;
}>();

// emits
const emit = defineEmits<{
  (e: "clearFetchedTab", isActive: boolean): void;
  (e: "closeDialog"): void;
}>();

// store
const reasonsStore = useSharedReasonsStore("");
const updateListEventKey = SettingsEventKeys.ORDER_REASONS_TABLE_UPDATE;

const { t } = useI18n();
const eventBus = useEventBus();
const isLoading = ref<boolean>(false);
const isBtnLoading = ref<boolean>(false);
const types = ref<ConstantModel[]>();

// Configuration based on pageType
const defaultSelectedTypes = computed<number[]>(() => {
  switch (props.pageType) {
    case PageTypes.SETTINGS:
      return [];
    case PageTypes.AUDIT_REASONS:
      return [ReasonTypes.AUDIT_REASONS];
    case PageTypes.AUDIT_PROBLEMS:
      return [ReasonTypes.AUDIT_PROBLEMS];
    default:
      return [];
  }
});

const filteredTypeItems = computed<ConstantModel[]>(() => {
  switch (props.pageType) {
    case PageTypes.SETTINGS:
      return (types.value ?? []) as ConstantModel[];
    case PageTypes.AUDIT_REASONS:
      return (types.value ?? []).filter(
        (type: ConstantModel) => type.id === ReasonTypes.AUDIT_REASONS,
      );
    case PageTypes.AUDIT_PROBLEMS:
      return (types.value ?? []).filter(
        (type: ConstantModel) => type.id === ReasonTypes.AUDIT_PROBLEMS,
      );
    default:
      return [];
  }
});

const config = computed(() => {
  switch (props.pageType) {
    case PageTypes.SETTINGS:
      return {
        defaultSelectedTypes: defaultSelectedTypes.value,
        shouldDisableTypeSelection: props.pageType !== PageTypes.SETTINGS,
        shouldLoadTypesOnMount: false,
        filteredTypes: {
          items: types.value,
        },
        getTypes: getOrderTypes,
      };
    case PageTypes.AUDIT_REASONS:
    case PageTypes.AUDIT_PROBLEMS:
      return {
        defaultSelectedTypes: defaultSelectedTypes.value,
        shouldDisableTypeSelection: true,
        shouldLoadTypesOnMount: true,
        filteredTypes: {
          items: filteredTypeItems.value,
        },
        getTypes: getAllTypes,
      };
    default:
      return {
        defaultSelectedTypes: [],
        shouldDisableTypeSelection: false,
        shouldLoadTypesOnMount: false,
        filteredTypes: { items: [] },
        getTypes: async () => {},
      };
  }
});

const typeFilterStates = ref([
  {
    name: t("column.type"),
    key: "types",
    required: true,
    get disabled() {
      return config.value.shouldDisableTypeSelection;
    },
    get data() {
      return config.value.filteredTypes;
    },
    get getSelectedData() {
      return data.value.types;
    },
    set setSelectedData(value: number[]) {
      data.value.types = value;
    },
  },
]);

const data = ref<ReturnExchangeReasonPostModel>({
  id: undefined,
  name: "",
  default_name: "",
  name_l10n: {},
  code: null,
  description: "",
  default_description: "",
  description_l10n: {},
  is_active: true,
  types: config.value.defaultSelectedTypes,
});
const initialDetailData = ref(); // used to store the detail data on edit

// hooks
const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

// Methods
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

const onOpenDropdown = async (key: string, value: unknown) => {
  if (key === "types" && !types.value) {
    await config.value.getTypes();
  }
};

const save = async () => {
  isBtnLoading.value = true;
  const res = await reasonsStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    notify({ title: t("saved"), type: "success" });
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getDetail = async () => {
  isLoading.value = true;
  initialDetailData.value = await reasonsStore.getDetail(props.id!);
  data.value = { ...initialDetailData.value };
  isLoading.value = false;
};

async function getOrderTypes() {
  types.value = (await reasonsStore.getOrderTypes()) || [];
}

async function getAllTypes() {
  types.value = (await reasonsStore.getAllTypes()) || [];
}

onMounted(async () => {
  console.log(props.id);

  if (config.value.shouldLoadTypesOnMount) await config.value.getTypes();
  if (props.id) {
    await Promise.all([getDetail(), config.value.getTypes()]);
  }
});
<\/script>
`;export{e as default};
