const n=`<template>
  <form @submit.prevent="onSave">
    <d-modal
      :name="t('reports.report_builder.save_report_builder')"
      @close-dialog="onCloseDialog"
    >
      <d-input
        required
        :label="t('labels.name')"
        :value="reportName"
        @change="reportName = $event"
      />

      <template #footer>
        <m-btn type="submit" :loading="isLoading" class="w-full">
          {{ t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// Types
type Props = {
  initialReportName?: string;
  isLoading?: boolean;
};

type Emits = {
  (e: "close-dialog"): void;
  (e: "save", reportName: string): void;
};

// Props
const props = defineProps<Props>();

// Emits
const emits = defineEmits<Emits>();

// Composables
const { t } = useI18n();

// States
const reportName = ref(props.initialReportName || "");

// Methods
const onCloseDialog = () => emits("close-dialog");

const onSave = () => {
  emits("save", reportName.value);
};
<\/script>
`;export{n as default};
