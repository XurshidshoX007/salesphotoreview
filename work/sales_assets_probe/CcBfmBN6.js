const n=`<template>
  <div class="flex items-center justify-between flex-wrap w-full gap-3">
    <div class="w-full flex items-center justify-between gap-4 flex-wrap">
      <Checkbox
        id="for-consigination"
        :title="t('column.consignation')"
        :checked="toggle"
        :disabled="!amountLimit > 0 || disabledConsignationLimit"
        @change="onToggle"
      />
      <DInputDatePicker
        v-if="toggle"
        :label="t('column.term')"
        without-time
        :without-default="!route.query.id"
        required
        :value="consignationTerm"
        @change="emit('changeConsignationTerm', $event)"
      />
    </div>
    <div
      v-if="!isLoading"
      class="w-full text-sm flex gap-2 items-center justify-end"
      :class="amountLimit > 0 ? 'text-primary-600' : 'text-red-3'"
    >
      {{ t("orders.limit_consignment") }}:
      <div class="flex items-center gap-2">
        {{
          getFormattedAmount(amountLimit)?.toString() ||
          t("orders.not_installed")
        }}
        <div class="text-sm">
          {{ currencyCode }}
        </div>
      </div>
    </div>
    <SkeletonRows v-show="isLoading" :rows="1" :max-row-width="180" />
  </div>
</template>

<script setup lang="ts">
// props
import { useI18n } from "vue-i18n";

const props = defineProps<{
  toggle: boolean;
  consignationTerm: boolean;
  amountLimit: number;
  currencyCode: string;
  isLoading: boolean;
  disabledConsignationLimit: boolean;
}>();
const route = useRoute();
const { t } = useI18n();
// emits
const emit = defineEmits(["onToggle", "changeConsignationTerm"]);

// methods
const onToggle = (isChecked: boolean) => emit("onToggle", isChecked);
<\/script>
`;export{n as default};
