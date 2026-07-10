const n=`<template>
  <d-modal :name="modalName || t('column.approve')" @closeDialog="closeDialog">
    <div v-if="page === 'no-bonus'" class="flex justify-between">
      <flex-col class="page-gap justify-center">
        <div class="text-2xl text-center">
          {{ text }}
        </div>
        <div class="text-2xl text-center">{{ description }} ?</div>
      </flex-col>
    </div>
    <flex-col v-else-if="page === 'order-return'" class="w-full gap-7.5">
      <div class="text-2xl text-center font-semibold">
        {{ t("orders.are_you_sure") }}
      </div>
      <div>{{ t("orders.you_confirm_the_return_cant_change") }}</div>
    </flex-col>
    <div v-else class="w-full font-semibold text-center py-4">
      {{ text }}
      <div class="text-center">{{ description }}</div>
    </div>
    <template #footer>
      <div
        v-if="page === 'no-bonus'"
        class="flex page-gap items-center justify-between"
      >
        <m-btn class="w-full" @click="closeDialog">{{ t("filters.no") }}</m-btn>
        <m-btn class="w-full" :loading="isSaveBtnLoading" @click="onSave"
          >{{ t("orders.confirm") }}
        </m-btn>
      </div>
      <div
        v-else-if="page === 'order-return'"
        class="flex justify-between items-center"
      >
        <m-btn @click="onSave" :loading="isSaveBtnLoading">
          {{ t("orders.only_save") }}
        </m-btn>
        <m-btn @click="onSaveAndApprove" :loading="isSaveAndApproveBtnLoading">
          {{ t("orders.save_and_confirm") }}
        </m-btn>
      </div>
      <div v-else class="flex justify-between">
        <m-btn group="outlined" @click="closeDialog">
          {{ t("filters.no") }}</m-btn
        >
        <m-btn :loading="isSaveBtnLoading" @click="onSave">
          {{ t("filters.yes") }}
        </m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  isSaveBtnLoading?: boolean;
  isSaveAndApproveBtnLoading?: boolean;
  modalName?: string;
  text?: string;
  description?: string;
  page?: string;
}>();

// emit
const emit = defineEmits(["closeDialog", "onSave", "onSaveAndApprove"]);

// states
const { t } = useI18n();

// methods
const closeDialog = () => emit("closeDialog");

const onSave = () => emit("onSave");

const onSaveAndApprove = () => {
  emit("onSaveAndApprove");
};
<\/script>
`;export{n as default};
