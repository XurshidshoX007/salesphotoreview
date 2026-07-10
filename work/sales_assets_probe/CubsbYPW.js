const n=`<template>
  <form @submit.prevent="onSave">
    <d-modal :name="t('labels.consignation_change')" @closeDialog="closeDialog">
      <flex-col class="gap-5">
        <div class="section">
          <div class="key">{{ t("column.visual_id") }}:</div>
          <div class="value">{{ visualId }}</div>
          <div v-if="visualIds" class="value">
            <show-more :data="formattedVisualIds" :show-count="5" />
          </div>
        </div>

        <Checkbox
          v-if="isCheckboxShowable"
          :checked="forConsignation"
          :title="t('column.consignation')"
          id="update-consignation-term"
          @change="updateForConsignation($event)"
        />

        <DInputDatePicker
          v-if="forConsignation"
          :label="t('column.consignation_term')"
          required
          clearable
          :value="consignationTerm"
          :without-default="!consignationTerm"
          :min-date="orderDate"
          @change="(newDate) => (consignationTerm = newDate)"
        />
      </flex-col>

      <template #footer>
        <m-btn
          class="w-full"
          :loading="orderStore.isChangeConsignationLoading"
          type="submit"
        >
          {{ t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, toRefs, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import type { OrdersModel } from "~/interfaces/api/orders/orders-model";

// Store
const orderStore = useOrdersStore("main");

// Emit
const emit = defineEmits<{
  (e: "closeDialog"): void;
  (
    e: "save",
    payload: { forConsignation: boolean; consignationTerm: string | undefined },
  ): void;
}>();

// Props
type BaseData = Pick<
  OrdersModel,
  "id" | "visual_id" | "consignation_term" | "order_date" | "for_consignation"
> & { isTermOnly: boolean };

type Props =
  | {
      type: "single";
      data: BaseData;
      visualIds?: string[];
      refreshData: () => Promise<void>;
    }
  | {
      type: "multi";
      visualIds: string[];
      data?: undefined;
      refreshData: () => Promise<void>;
    };

const props = defineProps<Props>();

// Local i18n
const { t } = useI18n();

// Extract props data if "single"
const dataFields = computed(() => {
  if (props.type === "single" && props.data) {
    const {
      id,
      visual_id,
      consignation_term,
      order_date,
      for_consignation,
      isTermOnly,
    } = toRefs(props.data);

    return {
      id,
      visualId: visual_id,
      consignationTerm: consignation_term,
      orderDate: order_date,
      forConsignation: for_consignation,
      isTermOnly,
    };
  }

  return {};
});

const { id, visualId, orderDate, isTermOnly } = dataFields.value as {
  id?: Ref<number>;
  visualId?: Ref<string>;
  orderDate?: Ref<string>;
  isTermOnly?: Ref<boolean>;
};

// Use a ref for multi mode to simplify
const localForConsignation = ref<boolean>(true);
const localConsignationTerm = ref<string | undefined>(undefined);

// Computed forConsignation
const forConsignation = computed({
  get: () => {
    if (props.type === "single")
      return dataFields.value.forConsignation?.value ?? false;
    return localForConsignation.value;
  },
  set: (val: boolean) => {
    if (props.type === "single" && dataFields.value.forConsignation) {
      dataFields.value.forConsignation.value = val;
    } else {
      localForConsignation.value = val;
    }
  },
});

// Computed consignationTerm
const consignationTerm = computed({
  get: () => {
    if (props.type === "single")
      return dataFields.value.consignationTerm?.value ?? undefined;
    return localConsignationTerm.value;
  },
  set: (val: string | undefined) => {
    if (props.type === "single" && dataFields.value.consignationTerm) {
      dataFields.value.consignationTerm.value = val;
    } else {
      localConsignationTerm.value = val;
    }
  },
});

const formattedVisualIds = computed(() => {
  if (props.type === "multi") {
    return props.visualIds.map((id) => id.toString());
  }
  return [];
});

// Update handler for checkbox
const updateForConsignation = (val: boolean) => {
  forConsignation.value = val;
  // Reset consignationTerm when forConsignation is false
  if (!val) {
    consignationTerm.value = undefined;
  }
};

const comment = ref<string>("");

const isCheckboxShowable = computed(() => {
  if (props.type === "single") {
    return !isTermOnly?.value;
  }
  return true;
});

const closeDialog = () => {
  emit("closeDialog");
};

const onSave = async () => {
  if (props.type === "single") {
    if (id) {
      const payload = {
        forConsignation: forConsignation.value,
        orderId: id.value.toString(),
        comment: comment.value,
        consignationTerm: forConsignation.value
          ? consignationTerm.value
          : undefined,
      };

      const response = await orderStore.changeConsignation(payload);
      if (response !== "error") {
        await props.refreshData();
        closeDialog();
      }
    }
  } else {
    emit("save", {
      forConsignation: forConsignation.value,
      consignationTerm: forConsignation.value
        ? consignationTerm.value
        : undefined,
    });
    emit("closeDialog");
  }
};
<\/script>

<style scoped lang="scss">
.section {
  display: flex;
  align-items: center;
  gap: 0 8px;

  .key {
    font-size: 16px;
    font-family: "Inter", sans-serif;
    color: #8fa0a0;
    font-weight: 400;
  }

  .value {
    font-family: "Inter", sans-serif;
    font-weight: 600;
    color: #424f4f;
    font-size: 16px;
    text-align: end;
  }
}
</style>
`;export{n as default};
