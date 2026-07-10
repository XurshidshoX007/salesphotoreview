const n=`<template>
  <form @submit.prevent="save">
    <d-modal
      dataContainerWidth="1000px"
      :name="
        props.id
          ? t('orders.request_automation.update_condition')
          : t('orders.request_automation.add_condition')
      "
      only-close-dialog
      @closeDialog="closeDialog"
      :loading="isDetailLoading"
    >
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <!-- Left column -->
        <flex-col class="gap-5">
          <shared-localized-input
            required
            :label="t('column.name')"
            v-model:base="formData.name.default"
            v-model:translations="formData.name.l10n"
          />

          <DropdownsByFilterStates
            ref="mainDropdownRef"
            :filterStates="mainDropdownStates"
            @onOpenDropdown="onOpenDropdown"
          />

          <div class="flex gap-4">
            <d-input
              class="flex-1 d-input--wide-suffix"
              type="number"
              :label="t('column.amount_from')"
              :value="formData.range.from_value"
              @change="(v) => (formData.range.from_value = v)"
            >
              <template #suffix>
                <DropdownMenu
                  v-model="formData.base_currency_id"
                  :options="baseCurrenciesList"
                  variant="select"
                  checkable
                  :content-width="110"
                  check-color="#299B9B"
                >
                  <template #trigger="{ selectedOption }">
                    <div
                      v-if="selectedOption"
                      class="text-xs font-semibold text-primary-600 border border-neutral-200 rounded-md px-1.5 py-0.5"
                    >
                      {{ selectedOption?.label }}
                    </div>
                  </template>
                </DropdownMenu>
              </template>
            </d-input>

            <d-input
              class="flex-1 d-input--wide-suffix"
              type="number"
              :label="t('column.amount_to')"
              :value="formData.range.to_value"
              @change="(v) => (formData.range.to_value = v)"
            >
              <template #suffix>
                <DropdownMenu
                  v-model="formData.base_currency_id"
                  :options="baseCurrenciesList"
                  variant="select"
                  checkable
                  :content-width="110"
                  check-color="#299B9B"
                >
                  <template #trigger="{ selectedOption }">
                    <div
                      v-if="selectedOption"
                      class="text-xs font-semibold text-primary-600 border border-neutral-200 rounded-md px-1.5 py-0.5"
                    >
                      {{ selectedOption?.label }}
                    </div>
                  </template>
                </DropdownMenu>
              </template>
            </d-input>
          </div>

          <DropdownsByFilterStates
            :filterStates="paymentMethodStates"
            @onOpenDropdown="onOpenDropdown"
          />

          <Switch
            :active="formData.is_active"
            @change="formData.is_active = $event"
          />
        </flex-col>

        <!-- Right column -->
        <flex-col class="gap-5">
          <!-- Consignation - component not ready yet -->
          <div>
            <RadioBtn
              :label="t('column.consignation')"
              :items="consignationFilterTypes"
              :selectedItem="formData.for_consignation"
              @onSelectItemId="onSelectConsignationType"
            />
          </div>

          <CheckboxGroup
            required
            :error="errors.order_type_arr"
            :error-message="t('labels.required')"
            :label="t('orders.request_automation.order_type')"
            :items="baseStore.orderTypes"
            v-model:selectedItems="formData.order_type_arr"
            @update:selectedItems="errors.order_type_arr = false"
          />

          <CheckboxGroup
            required
            :error="errors.client_platform_arr"
            :error-message="t('labels.required')"
            :label="t('orders.request_automation.order_source')"
            :items="baseStore.clientPlatforms"
            v-model:selectedItems="formData.client_platform_arr"
            @update:selectedItems="errors.client_platform_arr = false"
          />

          <shared-localized-input
            :label="t('column.comment')"
            v-model:base="formData.description.default"
            v-model:translations="formData.description.l10n"
          />

          <div class="bg-neutral-100 mt-3 p-4 rounded-xl">
            <p class="text-base font-semibold text-neutral-950 mb-4">
              {{ t("orders.request_automation.expected_shipping_date") }}
            </p>

            <flex-col class="gap-4">
              <DropdownsByFilterStates
                :filterStates="executionTypeStates"
                @onOpenDropdown="onOpenDropdown"
              />

              <flex-col v-if="shippingDateCalculation" class="gap-3">
                <time-picker
                  required
                  v-if="shippingDateCalculation === 1"
                  :selected-time="formData.date_calculation_option.exact_time"
                  class="w-50"
                  @on-select-time="handleSelectTime"
                  :placeholder="t('orders.request_automation.exact_time')"
                />

                <DInput
                  v-else-if="shippingDateCalculation === 2"
                  required
                  type="number"
                  :value="formData.date_calculation_option.hour_value"
                  :label="t('orders.request_automation.n_hour')"
                  class="w-50"
                  @change="formData.date_calculation_option.hour_value = $event"
                  :max="1000"
                />

                <flex-row
                  v-else-if="shippingDateCalculation === 3"
                  class="gap-4"
                >
                  <DInput
                    required
                    type="number"
                    :value="formData.date_calculation_option.day_value"
                    :label="t('orders.request_automation.n_day')"
                    class="w-50"
                    @change="
                      formData.date_calculation_option.day_value = $event
                    "
                    :max="100"
                  />

                  <time-picker
                    :selected-time="formData.date_calculation_option.exact_time"
                    class="w-50"
                    @on-select-time="handleSelectTime"
                    :placeholder="t('orders.request_automation.exact_time')"
                  />
                </flex-row>

                <flex-row
                  v-else-if="shippingDateCalculation === 4"
                  class="gap-4"
                >
                  <DInput
                    required
                    type="number"
                    :value="formData.date_calculation_option.day_value"
                    :label="t('orders.request_automation.n_day')"
                    class="w-50"
                    @change="
                      formData.date_calculation_option.day_value = $event
                    "
                    :max="100"
                  />
                </flex-row>

                <flex-row
                  v-if="shippingDateCalculation !== 2"
                  class="items-center gap-2"
                >
                  <IconWarning color="#FF8901" />
                  <span class="text-xs text-neutral-600">
                    {{
                      t(
                        "orders.request_automation.time_exceeds_condition_triggered",
                      )
                    }}
                  </span>
                </flex-row>
              </flex-col>
            </flex-col>
          </div>
        </flex-col>
      </div>

      <template #footer>
        <div v-if="hasAccess2Save" class="flex justify-end">
          <m-btn
            @click="validate"
            type="submit"
            :loading="isBtnLoading"
            class="min-w-34"
          >
            {{ props.id ? t("save") : t("clients.add") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import type { DropdownsByFilterStates } from "#components";
import {
  FOR_CONSIGNATION_TYPES,
  type ForConsignationApiValue,
  type ForConsignationType,
  type OrderRequestAutomationFormModel,
} from "~/interfaces/api/orders/order-request-automation-model";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { OrderEventKeys } from "~/variable/event-key-constants";
import { useRequestAutomationAccess } from "~/composables/access/orders/request-automation";

// Props
interface Props {
  id?: string;
  isActive?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isActive: undefined,
});

// Emits
const emit = defineEmits<{
  (e: "closeDialog"): void;
  (e: "clearFetchedTab"): void;
}>();

// Stores
const baseStore = useRequestAutomationStore("main");

// Composables
const { t } = useI18n();
const eventBus = useEventBus();
const { baseCurrencies } = storeToRefs(baseStore);
const { hasAccess2Save } = useRequestAutomationAccess();

// Enums

enum MAIN_TABS {
  LIMITCONDITION = 1,
  AUTOCONFIRM = 2,
}

// Constants

const consignationTypeLabels = {
  [FOR_CONSIGNATION_TYPES.All]: "filters.all",
  [FOR_CONSIGNATION_TYPES.Yes]: "filters.yes",
  [FOR_CONSIGNATION_TYPES.No]: "filters.no",
} satisfies Record<ForConsignationType, string>;

const consignationApiValueByType = {
  [FOR_CONSIGNATION_TYPES.All]: null,
  [FOR_CONSIGNATION_TYPES.Yes]: true,
  [FOR_CONSIGNATION_TYPES.No]: false,
} satisfies Record<ForConsignationType, ForConsignationApiValue>;

const consignationTypeByApiValue = {
  true: FOR_CONSIGNATION_TYPES.Yes,
  false: FOR_CONSIGNATION_TYPES.No,
} satisfies Record<\`\${boolean}\`, ForConsignationType>;

const consignationFilterTypes = computed(() =>
  Object.entries(consignationTypeLabels).map(([id, label]) => ({
    id: id as ForConsignationType,
    name: t(label),
  })),
);

const toConsignationApiValue = (type: ForConsignationType) =>
  consignationApiValueByType[type];

const toConsignationType = (
  value: ForConsignationApiValue | ForConsignationType,
): ForConsignationType =>
  typeof value === "string"
    ? value
    : typeof value === "boolean"
      ? consignationTypeByApiValue[String(value) as \`\${boolean}\`]
      : FOR_CONSIGNATION_TYPES.All;

const isForConsignationType = (
  value: OrderRequestAutomationFormModel["for_consignation"],
): value is ForConsignationType => typeof value === "string";

// States
const mainDropdownRef = ref<InstanceType<
  typeof DropdownsByFilterStates
> | null>(null);
const isBtnLoading = ref(false);
const isDetailLoading = ref(false);

const errors = reactive({
  order_type_arr: false,
  client_platform_arr: false,
});

const formData = ref<OrderRequestAutomationFormModel>({
  is_active: true,
  name: { default: "", l10n: {} },
  territory_id_arr: [],
  warehouse_id_arr: [],
  trade_direction_id_arr: [],
  agent_id_arr: [],
  range: { from_value: null, to_value: null },
  base_currency_id: null,
  currency_id_arr: [],
  for_consignation: FOR_CONSIGNATION_TYPES.All,
  order_type_arr: [],
  client_platform_arr: [],
  description: { default: "", l10n: {} },
  date_calculation_option: {
    expected_shipping_date_calculation_type: null,
    day_value: null,
    hour_value: null,
    exact_time: null,
  },
});

// Dropdown states
const mainDropdownStates = ref([
  {
    name: t("settings_sidebar.territory"),
    key: "territories",
    get isLoading() {
      return isDetailLoading.value;
    },
    get data() {
      return baseStore.territories || [];
    },
    get getSelectedData() {
      return formData.value.territory_id_arr || [];
    },
    set setSelectedData(value: string[]) {
      formData.value.territory_id_arr = value;
    },
    isTreeView: true,
    checked: true,
  },
  {
    name: t("sidebar.warehouse"),
    key: "warehouse",
    get data() {
      return baseStore.warehouses || [];
    },
    get getSelectedData() {
      return formData.value.warehouse_id_arr || [];
    },
    set setSelectedData(value: string[]) {
      formData.value.warehouse_id_arr = value;
    },
  },
  {
    name: t("settings_sidebar.trade_direction"),
    key: "trade_direction",
    get data() {
      return baseStore.tradeDirections || [];
    },
    get getSelectedData() {
      return formData.value.trade_direction_id_arr || [];
    },
    set setSelectedData(value: string[]) {
      formData.value.trade_direction_id_arr = value;
    },
  },
  {
    name: t("orders.request_automation.agent"),
    key: "agent",
    get data() {
      return baseStore.agents || [];
    },
    get getSelectedData() {
      return formData.value.agent_id_arr || [];
    },
    set setSelectedData(value: string[]) {
      formData.value.agent_id_arr = value;
    },
  },
]);

const paymentMethodStates = ref([
  {
    name: t("settings_sidebar.payment_method"),
    key: "payment_method",
    get data() {
      return baseStore.currencies || [];
    },
    get getSelectedData() {
      return formData.value.currency_id_arr || [];
    },
    set setSelectedData(value: string[]) {
      formData.value.currency_id_arr = value;
    },
  },
]);

const executionTypeStates = ref([
  {
    required: true,
    name: t("orders.request_automation.execution_type"),
    key: "calculation-types",
    get data() {
      return baseStore.expectedShippingDateCalculationTypes || [];
    },
    get getSelectedData() {
      return shippingDateCalculation.value || [];
    },
    set setSelectedData(value: number) {
      formData.value.date_calculation_option.expected_shipping_date_calculation_type =
        value;
    },
    isSingleSelect: true,
  },
]);

// Hooks
const baseCurrenciesList = computed(() => {
  return baseCurrencies.value?.items?.map((currency) => ({
    value: currency.id,
    label: currency.name,
  }));
});

const shippingDateCalculation = computed(
  () =>
    formData.value.date_calculation_option
      .expected_shipping_date_calculation_type,
);

onMounted(async () => {
  await Promise.all([
    baseStore.getOrderTypes(),
    baseStore.getClientPlatforms(),
  ]);

  if (!baseCurrencies.value) {
    await baseStore.getBaseCurrency();
  }

  formData.value.base_currency_id =
    baseCurrencies.value?.items?.find((currency) => currency.is_default)?.id ??
    null;

  if (props.id) {
    await loadDetail(props.id);
  }
});

// Methods
const handleSelectTime = (selectedTime: {
  hours: number;
  minutes: number;
  seconds: number;
}) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  formData.value.date_calculation_option.exact_time = \`\${pad(selectedTime.hours)}:\${pad(selectedTime.minutes)}:\${pad(selectedTime.seconds ?? 0)}\`;
};

const onSelectConsignationType = (v: ForConsignationType) => {
  formData.value.for_consignation = v;
};

const onOpenDropdown = async (state: string) => {
  if (state === "payment_method") {
    if (!baseStore.currencies) await baseStore.getCurrencies();
  } else if (state === "territories") {
    if (!baseStore.territories) await baseStore.getTerritories();
  } else if (state === "warehouse") {
    if (!baseStore.warehouses) await baseStore.getWarehouses();
  } else if (state === "trade_direction") {
    if (!baseStore.tradeDirections) await baseStore.getTradeDirections();
  } else if (state === "agent") {
    if (!baseStore.agents) await baseStore.getAgents();
  } else if (state === "calculation-types") {
    if (!baseStore.expectedShippingDateCalculationTypes.items)
      await baseStore.getExpectedShippingDateCalculationType();
  }
};

const closeDialog = () => {
  mainDropdownRef.value?.onClearFilter();
  emit("closeDialog");
};

const validate = () => {
  errors.order_type_arr = formData.value.order_type_arr.length === 0;
  errors.client_platform_arr = formData.value.client_platform_arr.length === 0;
  return !errors.order_type_arr && !errors.client_platform_arr;
};

const save = async () => {
  if (!validate()) return;
  isBtnLoading.value = true;
  try {
    const {
      expected_shipping_date_calculation_type: type,
      exact_time,
      hour_value,
      day_value,
    } = formData.value.date_calculation_option;

    type DateCalcOption = typeof formData.value.date_calculation_option;
    const calculationMap: Record<number, DateCalcOption> = {
      1: {
        expected_shipping_date_calculation_type: 1,
        exact_time,
        hour_value: null,
        day_value: null,
      },
      2: {
        expected_shipping_date_calculation_type: 2,
        hour_value,
        exact_time: null,
        day_value: null,
      },
      3: {
        expected_shipping_date_calculation_type: 3,
        day_value,
        exact_time,
        hour_value: null,
      },
      4: {
        expected_shipping_date_calculation_type: 4,
        day_value,
        exact_time: null,
        hour_value: null,
      },
    };

    const date_calculation_option: DateCalcOption = (typeof type === "number"
      ? calculationMap[type]
      : undefined) ?? {
      expected_shipping_date_calculation_type: null,
      day_value: null,
      hour_value: null,
      exact_time: null,
    };

    const payload = {
      ...formData.value,
      for_consignation: toConsignationApiValue(
        isForConsignationType(formData.value.for_consignation)
          ? formData.value.for_consignation
          : toConsignationType(formData.value.for_consignation),
      ),
      date_calculation_option,
    };

    if (props.id) {
      await baseStore.update({ ...payload, id: props.id });
      updateListEmit();
    } else {
      await baseStore.create(payload);
      refreshListEmit();
    }

    closeDialog();
  } finally {
    isBtnLoading.value = false;
  }
};

const refreshListEmit = () => {
  emit("clearFetchedTab");
  nextTick(() => {
    eventBus.emit(OrderEventKeys.REQUEST_AUTOMATION_TABLE_UPDATE, {
      activeTab: MAIN_TABS.AUTOCONFIRM,
    });
  });
};

const updateListEmit = () => {
  eventBus.emit(OrderEventKeys.REQUEST_AUTOMATION_TABLE_UPDATE, {
    activeTab: MAIN_TABS.AUTOCONFIRM,
    isActive: props.isActive,
  });
};

const loadOptions = async () => {
  const promises: Promise<any>[] = [];
  if (!baseStore.currencies) promises.push(baseStore.getCurrencies());
  if (!baseStore.territories) promises.push(baseStore.getTerritories());
  if (!baseStore.warehouses) promises.push(baseStore.getWarehouses());
  if (!baseStore.tradeDirections) promises.push(baseStore.getTradeDirections());
  if (!baseStore.agents) promises.push(baseStore.getAgents());
  if (!baseStore.expectedShippingDateCalculationTypes?.items)
    promises.push(baseStore.getExpectedShippingDateCalculationType());

  if (promises.length > 0) {
    await Promise.all(promises);
  }
};

const loadDetail = async (id: string) => {
  isDetailLoading.value = true;
  try {
    await loadOptions();
    const { data } = await baseStore.getById(id);

    formData.value = {
      is_active: data.is_active,
      name: data.name,
      territory_id_arr: data.territory_id_arr || [],
      warehouse_id_arr: data.warehouse_id_arr || [],
      trade_direction_id_arr: data.trade_direction_id_arr || [],
      agent_id_arr: data.agent_id_arr || [],
      range: data.range,
      base_currency_id: data.base_currency_id,
      currency_id_arr: data.currency_id_arr || [],
      for_consignation: toConsignationType(data.for_consignation),
      order_type_arr: data.order_type_arr || [],
      client_platform_arr: data.client_platform_arr || [],
      description: data.description,
      date_calculation_option: data.date_calculation_option,
    };
  } catch (error) {
    console.error("Error loading detail:", error);
  } finally {
    isDetailLoading.value = false;
  }
};
<\/script>

<style scoped lang="scss">
.d-input--wide-suffix :deep(input.input-with-suffix) {
  padding-right: 64px !important;
}
</style>
`;export{n as default};
