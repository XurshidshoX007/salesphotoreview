const e=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="props.id ? t('edit') : t('clients.add')"
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
          :filterStates="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <d-input
          :label="t('column.code')"
          pattern-type="code"
          type="text"
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
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="data.default_description"
          v-model:translations="data.description_l10n"
        />
        <Switch :active="data.is_active" @change="data.is_active = $event" />
        <Switch
          :title="t('orders.manual')"
          :active="data.hand_edit"
          @change="data.hand_edit = $event"
        />
        <Switch
          :title="t('settings.available_clients')"
          :active="data.for_client"
          @change="data.for_client = $event"
        />
      </flex-col>
      <template #footer>
        <m-btn :loading="loadingBtn" class="w-full" type="submit">
          {{ props.id ? t("save") : t("clients.add") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import type { DropdownsByFilterStates } from "#components";
import { notify } from "@kyvg/vue3-notification";
import type { PriceTypesModels } from "~/interfaces/api/settings/price-types-models";
import type { CurrencyModel } from "~/interfaces/api/settings/currency-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";
import { useI18n } from "vue-i18n";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import type { AppResponse } from "~/interfaces/api/response/app-response";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";

// Store
const priceTypeStore = usePriceTypesStore("");

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// State
const { t } = useI18n();
const eventBus = useEventBus();
const loadingBtn = ref(false);
const currencies = ref<DropdownItemsModelByType<CurrencyModel>>();
const updateListEventKey = SettingsEventKeys.PRICE_TYPES_TABLE_UPDATE;
const dropdownParams = ref(
  props.id ? { ...dropdownParamsAll } : { ...defaultDropdownParams },
);

const tradeTypes = ref<Partial<AppResponse<ConstantModel>>>({
  items: undefined,
});

const currenciesParams = ref<defaultDropdownParamsType>(dropdownParams.value);

const data = ref<Partial<PriceTypesModels>>({
  id: undefined,
  name: "",
  default_name: "",
  name_l10n: {},
  code: null,
  type: null as unknown as number,
  currency_id: "",
  description: "",
  default_description: "",
  description_l10n: {},
  sort: null,
  hand_edit: false,
  for_client: true,
  is_active: true,
});
const initialDetailData = ref(); // used to store the detail data on edit

const filterStates = ref([
  {
    name: t("settings_sidebar.payment_method"),
    key: "currencies",
    isSingleSelect: true,
    disabled: !!props.id,
    get data() {
      return currencies.value || [];
    },
    get getSelectedData() {
      return data.value.currency_id;
    },
    set setSelectedData(value: string) {
      data.value.currency_id = value;
    },
    required: true,
  },
  {
    name: t("column.type"),
    key: "tradeType",
    isSingleSelect: true,
    disabled: !!props.id,
    required: true,
    get data() {
      return tradeTypes.value || [];
    },
    get getSelectedData() {
      return data.value.type;
    },
    set setSelectedData(value: number) {
      data.value.type = value;
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
    await Promise.all([getDetail(props.id), getCurrencies()]);
  }
  await getTradeTypes();
});

// Methods
const closeDialog = () => {
  emit("closeDialog");
};

const onOpenDropdown = async (key: string) => {
  if (key === "currencies" && !currencies.value) {
    await getCurrencies();
  }
  if (key === "tradeType" && !tradeTypes.value.items) {
    await getTradeTypes();
    return;
  }
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
  loadingBtn.value = true;
  const res = await priceTypeStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    notify({ title: t("saved"), type: "success" });
    closeDialog();
  }
  loadingBtn.value = false;
};

const getDetail = async (id: string) => {
  initialDetailData.value = await priceTypeStore.getById(id);
  data.value = { ...initialDetailData.value };
};

const getTradeTypes = async () => {
  tradeTypes.value.items = await priceTypeStore.getTradeTypes();
};

const getCurrencies = async () => {
  currencies.value = await priceTypeStore.getCurrency(currenciesParams.value);
};
<\/script>
`;export{e as default};
