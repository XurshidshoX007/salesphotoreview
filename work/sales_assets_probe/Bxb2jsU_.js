const n=`<template>
  <form @submit.prevent="onSave">
    <d-modal
      :name="t('reports.universal_sales_report.save_to_fav_page')"
      @close-dialog="closeDialog"
    >
      <flex-col class="gap-4">
        <d-input
          required
          :label="t('column.name')"
          :value="name"
          @change="name = $event"
        />
        <d-input
          :label="t('labels.sort')"
          :value="sort"
          @change="sort = $event"
        />
      </flex-col>
      <template #footer>
        <m-btn type="submit" :loading="isSaveBtnLoading" class="w-full">
          {{ t("reports.universal_sales_report.save_as_fav_page") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  isSaveBtnLoading?: boolean;
}>();

// emits
const emit = defineEmits<{
  (e: "close-dialog"): void;
  (e: "on-save", payload: { name: string; sort?: number }): void;
}>();

// states
const { t } = useI18n();
const name = ref<string>("");
const sort = ref<number | undefined>(undefined);

// methods
const closeDialog = () => {
  emit("close-dialog");
};

const onSave = () => {
  emit("on-save", { name: name.value, sort: sort.value });
};
<\/script>
`;export{n as default};
