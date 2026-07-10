const n=`<template>
  <form @submit.prevent="onSave">
    <d-modal :name="t('settings.prolong_bonuses')" @closeDialog="closeDialog">
      <d-input-date-picker
        :value="extendingDate"
        :label="t('column.valid_to')"
        placeholder="Выберите дату"
        @change="extendingDate = $event"
      />
      <template #footer>
        <m-btn type="submit" :loading="isBtnLoading" class="w-full">{{
          t("save")
        }}</m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";

// store
const bonusStore = useBonusesStore("main");

// props
const props = defineProps<{
  selectedIds: string[];
}>();

// emits
const emit = defineEmits(["closeDialog", "refreshTable"]);

// states
const { t } = useI18n();
const extendingDate = ref<string>("");
const isBtnLoading = ref<boolean>(false);

// methods
const closeDialog = () => {
  emit("closeDialog");
};

const onSave = async () => {
  isBtnLoading.value = true;
  const data = {
    bonus_id_arr: props.selectedIds,
    valid_to: extendingDate.value,
  };
  const res = await bonusStore.prolongBonuses(data);
  if (res !== "error") {
    closeDialog();
    emit("refreshTable");
    notify({ type: "success", title: t("common.success") });
  } else {
    notify({ type: "error", title: t("common.error") });
  }
  isBtnLoading.value = false;
};
<\/script>
`;export{n as default};
