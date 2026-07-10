const e=`<template>
  <rounded-white-container without-padding class="p-5">
    <flex-row class="items-center gap-5">
      <back-btn without-title @click="router.go(-1)" />
      <page-title-20 :title="t('settings.discount.creating_discount')" />
    </flex-row>
    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <shared-localized-input
        required
        :label="t('settings.discount.discount_name')"
        v-model:base="basicFormInfo.default_name"
        v-model:translations="basicFormInfo.name_l10n"
      />
      <dropdowns-by-filter-states
        :filter-states="filterStates"
        @on-open-dropdown="onOpenDropdown"
      />
      <flex-row class="items-center justify-between gap-4">
        <d-input-date-picker
          required
          without-change-calendar
          :label="t('settings.discount.start_date')"
          :value="basicFormInfo.valid_from"
          without-default
          :disabled="props.isUsed || false"
          @change="setValidFrom"
        />
        <d-input-date-picker
          required
          without-change-calendar
          :label="t('settings.discount.end_date')"
          :value="basicFormInfo.valid_to"
          without-default
          @change="setValidTo"
        />
      </flex-row>
      <Switch
        :active="basicFormInfo.is_active"
        @change="basicFormInfo.is_active = $event"
      />
    </div>
  </rounded-white-container>
</template>

<script setup lang="ts">
import moment from "moment";
import { useI18n } from "vue-i18n";
import type { BasicFormInfoType } from "~/interfaces/api/settings/discount-model";

// store
const discountStore = useDiscountStore("main");

// props
const props = defineProps<{
  initialBasicFormInfo?: BasicFormInfoType;
  isUsed?: boolean;
}>();

// emits
const emit = defineEmits<{
  (e: "updateBasicFormInfo", value: BasicFormInfoType): void;
}>();

// states
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const discountTypes = ref<ConstantModel[]>();
const clientCategories = ref<DropdownItemsModelByType<DropdownModel>>();
const tradeDirections = ref<DropdownItemsModelByType<DropdownModel>>();
const priceTypes = ref<DropdownItemsModelByType<DropdownModel>>();
const currencies = ref<DropdownItemsModelByType<DropdownModel>>();
const agents = ref<DropdownItemsModelByType<DropdownModel>>();
const clientTypes = ref<DropdownItemsModelByType<DropdownModel>>();

const createEmptyBasicFormInfo = (): BasicFormInfoType => ({
  name: "",
  default_name: "",
  name_l10n: {},
  type: null as unknown as number,
  client_category_ids: [],
  currency_ids: [],
  agent_ids: [],
  price_type_ids: [],
  product_ids: [],
  trade_direction_ids: [],
  client_type_ids: [],
  valid_from: "",
  valid_to: "",
  is_active: true,
});

const basicFormInfo = reactive<BasicFormInfoType>(
  props.initialBasicFormInfo
    ? { ...props.initialBasicFormInfo }
    : createEmptyBasicFormInfo(),
);

const filterStates = ref<FilterStateModel[]>([
  {
    name: t("column.discount_type"),
    key: "discountTypes",
    isSingleSelect: true,
    required: true,
    get disabled() {
      return props.isUsed || false;
    },
    get data() {
      return { items: discountTypes.value };
    },
    get getSelectedData() {
      return basicFormInfo.type;
    },
    set setSelectedData(value: number) {
      basicFormInfo.type = value;
    },
  },
  {
    name: t("settings_sidebar.client_category"),
    key: "clientCategories",
    get disabled() {
      return props.isUsed || false;
    },
    get data() {
      return clientCategories.value;
    },
    get getSelectedData() {
      return basicFormInfo.client_category_ids;
    },
    set setSelectedData(value: string[]) {
      basicFormInfo.client_category_ids = value;
    },
  },
  {
    name: t("settings_sidebar.trade_direction"),
    key: "tradeDirections",
    get disabled() {
      return props.isUsed || false;
    },
    get data() {
      return tradeDirections.value;
    },
    get getSelectedData() {
      return basicFormInfo.trade_direction_ids;
    },
    set setSelectedData(value: string[]) {
      basicFormInfo.trade_direction_ids = value;
    },
  },
  {
    name: t("settings_sidebar.price_type"),
    key: "priceTypes",
    get disabled() {
      return props.isUsed || false;
    },
    get data() {
      return priceTypes.value;
    },
    get getSelectedData() {
      return basicFormInfo.price_type_ids;
    },
    set setSelectedData(value: string[]) {
      basicFormInfo.price_type_ids = value;
    },
  },
  {
    name: t("settings_sidebar.payment_method"),
    key: "currencies",
    get disabled() {
      return props.isUsed || false;
    },
    get data() {
      return currencies.value;
    },
    get getSelectedData() {
      return basicFormInfo.currency_ids;
    },
    set setSelectedData(value: string[]) {
      basicFormInfo.currency_ids = value;
    },
  },
  {
    name: t("settings_sidebar.client_type"),
    key: "clientTypes",
    get disabled() {
      return props.isUsed || false;
    },
    get data() {
      return clientTypes.value;
    },
    get getSelectedData() {
      return basicFormInfo.client_type_ids;
    },
    set setSelectedData(value: string[]) {
      basicFormInfo.client_type_ids = value;
    },
  },
  {
    name: t("settings.discount.agents"),
    key: "agents",
    get disabled() {
      return props.isUsed || false;
    },
    get data() {
      return agents.value;
    },
    get getSelectedData() {
      return basicFormInfo.agent_ids;
    },
    set setSelectedData(value: string[]) {
      basicFormInfo.agent_ids = value;
    },
  },
]);

// hooks
watch(
  () => props.initialBasicFormInfo,
  (value) => {
    Object.assign(basicFormInfo, value || createEmptyBasicFormInfo());
  },
  { deep: true, immediate: true },
);

watch(
  basicFormInfo,
  () => {
    emit("updateBasicFormInfo", basicFormInfo);
  },
  { deep: true },
);

onMounted(async () => {
  if (route.query.id) {
    await getDiscountTypes();
  }
});

// methods
const setValidFrom = (value: string) => {
  basicFormInfo.valid_from = moment(value).startOf("day").toISOString();
};

const setValidTo = (value: string) => {
  basicFormInfo.valid_to = moment(value).endOf("day").toISOString();
};

const onOpenDropdown = async (state: string) => {
  if (state === "discountTypes" && !discountTypes.value) {
    await getDiscountTypes();
  } else if (state === "clientCategories" && !clientCategories.value) {
    await getClientCategories();
  } else if (state === "tradeDirections" && !tradeDirections.value) {
    await getTradeDirections();
  } else if (state === "priceTypes" && !priceTypes.value) {
    await getPriceTypes();
  } else if (state === "currencies" && !currencies.value) {
    await getCurrencies();
  } else if (state === "agents" && !agents.value) {
    await getAgents();
  } else if (state === "clientTypes" && !clientTypes.value) {
    await getClientTypes();
  }
};

const getDiscountTypes = async () => {
  discountTypes.value = await discountStore.getDiscountTypes();
};

const getClientCategories = async () => {
  clientCategories.value = await discountStore.getClientCategories();
};

const getTradeDirections = async () => {
  tradeDirections.value = await discountStore.getTradeDirections();
};

const getPriceTypes = async () => {
  priceTypes.value = await discountStore.getPriceTypes();
};

const getCurrencies = async () => {
  currencies.value = await discountStore.getCurrencies();
};

const getAgents = async () => {
  agents.value = await discountStore.getAgents();
};

const getClientTypes = async () => {
  clientTypes.value = await discountStore.getClientTypes();
};
<\/script>
`;export{e as default};
