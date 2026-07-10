const e=`<template>
  <flex-row class="gap-4 max-md:flex-wrap">
    <rounded-white-container without-padding class="p-5 gap-2.5">
      <div class="text-neutral-950 font-medium">
        {{ t("settings.discount.condition_of_use") }}
      </div>
      <dropdowns-by-filter-states :filter-states="audienceState" />
      <div v-if="isNthOrderBased" class="grid grid-cols-2 gap-4">
        <DInput
          required
          :disabled="props.disabled"
          type="number"
          :label="t('settings.discount.n_value')"
          :value="nthOrderBasedInfo.nth_value"
          @change="nthOrderBasedInfo.nth_value = $event"
        />
        <DropdownsByFilterStates :filter-states="statusAndTypeStates" />
        <DInput
          required
          :disabled="props.disabled"
          type="number"
          :label="t('settings.discount.min_order_sum')"
          :value="nthOrderBasedInfo.order_min_cost_without_discount"
          @change="nthOrderBasedInfo.order_min_cost_without_discount = $event"
        />
        <DInputDatePicker
          required
          :disabled="props.disabled"
          :value="nthOrderBasedInfo.order_date_from"
          :label="t('settings.discount.order_date_from')"
          @change="nthOrderBasedInfo.order_date_from = $event"
        />
      </div>
    </rounded-white-container>
    <rounded-white-container without-padding class="p-5">
      <div class="text-neutral-950 font-medium">
        {{ t("settings.discount.for_whom") }}
      </div>
      <RadioBtn
        :disabled="props.disabled"
        :items="discountAudienceOptions"
        :selected-item="audienceInfo.discount_audience"
      />
    </rounded-white-container>
  </flex-row>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import {
  DiscountAudience,
  DiscountReprovidingTypes,
  DiscountNthOrderBasedType,
} from "~/variable/static-constants";
import type {
  DiscountAudienceInfoType,
  DiscountOrderBasedTermModel,
} from "~/interfaces/api/settings/discount-model";

// types
type AudienceInfoType = Pick<
  DiscountListModel,
  "discount_audience" | "discount_reproviding_type"
>;

type EmitValueType = DiscountAudienceInfoType;

type EditableNthOrderBasedInfo = Omit<
  DiscountOrderBasedTermModel,
  "order_min_cost_without_discount" | "nth_value"
> & {
  order_min_cost_without_discount: number | null;
  nth_value: number | null;
};

// props
const props = defineProps<{
  initialAudienceInfo?: DiscountAudienceInfoType;
  initialNthOrderBasedTerm?: DiscountOrderBasedTermModel;
  disabled?: boolean;
  getAudienceOptions: () => Promise<ConstantModel[] | undefined>;
  getReprovidingTypes: () => Promise<ConstantModel[] | undefined>;
  getOrderStatuses: () => Promise<ConstantModel[] | undefined>;
  getNthOrderBasedTypes: () => Promise<ConstantModel[] | undefined>;
}>();

// emits
const emit = defineEmits<{
  (e: "updateAudienceInfo", value: EmitValueType): void;
}>();

// states
const { t } = useI18n();
const discountAudienceOptions = ref<ConstantModel[] | undefined>(undefined);
const reprovidingTypes = ref<ConstantModel[] | undefined>(undefined);
const orderStatuses = ref<ConstantModel[] | undefined>(undefined);
const nthBasedOrderTypes = ref<ConstantModel[] | undefined>(undefined);
const isNthDataLoaded = ref(false);

const createDefaultAudienceInfo = (): AudienceInfoType => ({
  discount_audience: DiscountAudience.PUBLIC,
  discount_reproviding_type: DiscountReprovidingTypes.FOR_EACH_HEADER,
});

const createDefaultNthOrderBasedInfo = (): EditableNthOrderBasedInfo => ({
  order_status_arr: [],
  order_date_from: "",
  type: DiscountNthOrderBasedType.EVERY_NTH_ORDER,
  order_min_cost_without_discount: null as number | null,
  nth_value: null as number | null,
});

const audienceInfo = reactive<AudienceInfoType>(createDefaultAudienceInfo());

const nthOrderBasedInfo = reactive<EditableNthOrderBasedInfo>(
  createDefaultNthOrderBasedInfo()
);

const audienceState = ref<FilterStateModel[]>([
  {
    name: "",
    key: "discountAudience",
    isSingleSelect: true,
    get disabled() {
      return props.disabled || false;
    },
    get data() {
      return { items: reprovidingTypes.value };
    },
    get getSelectedData() {
      return audienceInfo.discount_reproviding_type;
    },
    set setSelectedData(value: number) {
      audienceInfo.discount_reproviding_type = value;
    },
  },
]);

const statusAndTypeStates = ref<FilterStateModel[]>([
  {
    name: t("column.type"),
    key: "discountAudience",
    get disabled() {
      return props.disabled || false;
    },
    isSingleSelect: true,
    required: true,
    get data() {
      return { items: nthBasedOrderTypes.value };
    },
    get getSelectedData() {
      return nthOrderBasedInfo.type;
    },
    set setSelectedData(value: number) {
      nthOrderBasedInfo.type = value;
    },
  },
  {
    name: t("column.order_status"),
    key: "order-statuses",
    get disabled() {
      return props.disabled || false;
    },
    required: true,
    get data() {
      return { items: orderStatuses.value };
    },
    get getSelectedData() {
      return nthOrderBasedInfo.order_status_arr;
    },
    set setSelectedData(value: number[]) {
      nthOrderBasedInfo.order_status_arr = value;
    },
  },
]);

// hooks
const isNthOrderBased = computed(() => {
  return (
    audienceInfo.discount_reproviding_type ===
    DiscountReprovidingTypes.NTH_ORDER_BASED
  );
});

const emitPayload = computed<EmitValueType>(() => {
  const base: EmitValueType = {
    discount_audience: audienceInfo.discount_audience,
    discount_reproviding_type: audienceInfo.discount_reproviding_type,
  };

  if (isNthOrderBased.value) {
    base.nth_order_based_term =
      nthOrderBasedInfo as DiscountOrderBasedTermModel;
  }

  return base;
});

watch(
  () => audienceInfo.discount_reproviding_type,
  async () => {
    if (isNthOrderBased.value && !isNthDataLoaded.value) {
      await Promise.all([getOrderStatuses(), getNthOrderBasedTypes()]);
      isNthDataLoaded.value = true;
    }
  }
);

watch(
  emitPayload,
  (value) => {
    emit("updateAudienceInfo", value);
  },
  { deep: true, immediate: true }
);

onMounted(async () => {
  await Promise.all([getAudienceOptions(), getReprovidingTypes()]);
});

watch(
  () => props.initialAudienceInfo,
  (value) => {
    const source = value || createDefaultAudienceInfo();
    audienceInfo.discount_audience = source.discount_audience;
    audienceInfo.discount_reproviding_type = source.discount_reproviding_type;
  },
  { deep: true, immediate: true }
);

watch(
  () => props.initialNthOrderBasedTerm,
  (value) => {
    Object.assign(nthOrderBasedInfo, value || createDefaultNthOrderBasedInfo());
  },
  { deep: true, immediate: true }
);

// methods
const getAudienceOptions = async () => {
  discountAudienceOptions.value = await props.getAudienceOptions();
};

const getReprovidingTypes = async () => {
  reprovidingTypes.value = await props.getReprovidingTypes();
};

const getOrderStatuses = async () => {
  orderStatuses.value = await props.getOrderStatuses();
};

const getNthOrderBasedTypes = async () => {
  nthBasedOrderTypes.value = await props.getNthOrderBasedTypes();
};
<\/script>
`;export{e as default};
