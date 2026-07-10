const n=`<template>
  <form @submit.prevent="onSave">
    <d-modal :name="name" @closeDialog="closeDialog">
      <flex-col class="gap-5">
        <d-input
          :label="t('column.order_count')"
          type="number"
          :max="500"
          focusable
          :value="orderGenerationData.orderCount"
          @change="orderGenerationData.orderCount = $event"
        />
        <DInputDatePicker
          :label="t('column.order_date')"
          :value="orderGenerationData.orderDate"
          without-default
          @change="(newDate) => (orderGenerationData.orderDate = newDate)"
        />
      </flex-col>
      <template #footer>
        <m-btn :loading="isSaveBtnLoading" class="w-full" type="submit">
          {{ t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
// props
import { useI18n } from "vue-i18n";

const props = defineProps<{
  name: string;
  isSaveBtnLoading: boolean;
}>();

// emits
const emit = defineEmits(["onSave", "closeDialog"]);

// state
const orderGenerationData = ref({
  orderCount: null,
  orderDate: null,
});
const { t } = useI18n();

// methods
const onSave = () => emit("onSave", orderGenerationData.value);

const closeDialog = () => emit("closeDialog");
<\/script>
`;export{n as default};
