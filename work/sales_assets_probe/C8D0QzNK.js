const n=`<template>
  <form id="app" class="w-full" @submit.prevent="save">
    <d-modal
      :name="props.id ? t('edit') : t('clients.add')"
      :loading="currenciesStore.updateLoading"
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
          type="number"
          pattern-type="sort"
          :label="t('labels.sort')"
          :value="data.sort"
          @change="data.sort = $event"
        />
        <d-input
          type="text"
          pattern-type="code"
          :label="t('column.code')"
          :value="data.code"
          @change="data.code = $event"
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
        <div class="flex justify-between items-center">
          <div class="fs-14">{{ t("labels.color") }}</div>
          <input
            v-model="data.hex_color"
            type="color"
            id="change-color"
            class="collapse"
          />
          <label
            :style="{ backgroundColor: data.hex_color }"
            for="change-color"
            class="w-8 h-8 rounded-large border-grey"
          ></label>
        </div>
        <Switch :active="data.is_active" @change="data.is_active = $event" />
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
import type { CurrencyModel } from "~/interfaces/api/settings/currency-model";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";

// Store
const currenciesStore = useCurrenciesStore("");

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// State
const { t } = useI18n();
const eventBus = useEventBus();
const currency = ref<DropdownItemsModelByType<CurrencyModel>>();
const updateListEventKey = SettingsEventKeys.CURRENCY_TABLE_UPDATE;
let isBtnLoading = ref<boolean>(false);

const dropdownParams = ref(
  props.id ? { ...dropdownParamsAll } : { ...defaultDropdownParams },
);

const currenciesParams = ref<defaultDropdownParamsType>(dropdownParams.value);

const data = ref<Partial<CurrencyModel>>({
  id: undefined,
  name: "",
  default_name: "",
  name_l10n: {},
  code: null,
  description: null,
  default_description: null,
  description_l10n: {},
  sort: null,
  base_currency_id: "",
  hex_color: "#d4d4d4",
  is_active: true,
});

const initialDetailData = ref(); // used to store the detail data on edit

const filterStates = ref([
  {
    name: t("settings_sidebar.currencies"),
    required: true,
    disabled: props?.id,
    isSingleSelect: true,
    key: "currency",
    get data() {
      return currency.value || [];
    },
    get getSelectedData() {
      return data.value.base_currency_id;
    },
    set setSelectedData(value: string) {
      data.value.base_currency_id = value;
    },
  },
]);

// Hooks
const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

onMounted(async () => {
  if (props.id) {
    await Promise.all([getDetail(), getCurrency()]);
  }
});

// Methods
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
  const res = await currenciesStore.add(data.value);
  isBtnLoading.value = false;
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    notify({ title: t("save") });
    closeDialog();
  }
};

const getDetail = async () => {
  initialDetailData.value = await currenciesStore.getById(props.id!);
  data.value = { ...initialDetailData.value };
};

const onOpenDropdown = async (state: any) => {
  if (state === "currency" && !currency.value) {
    await getCurrency();
    return;
  }
  return;
};

const getCurrency = async () => {
  currency.value = await currenciesStore.getCurrency(currenciesParams.value);
};
<\/script>
`;export{n as default};
