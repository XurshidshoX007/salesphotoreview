const e=`<template>
  <d-modal
    :name="t('reports.universal_sales_report.enter_report_name')"
    data-container-height="400px"
    @closeDialog="closeDialog"
  >
    <flex-col
      class="w-full gap-4 transition-transform has-[.localized-input--open]:h-66"
    >
      <shared-localized-input
        :base="reportName"
        :translations="reportNameL10n"
        @update:base="reportName = $event"
        @update:translations="reportNameL10n = $event"
      />
      <Checkbox
        v-if="hasAccessToMakePublic"
        :title="t('reports.universal_sales_report.is_public')"
        :checked="isPublic"
        @change="isPublic = $event"
      />
    </flex-col>
    <template #footer>
      <div class="flex justify-between w-full">
        <m-btn group="outlined" @click="closeDialog">{{
          t("reports.cancel")
        }}</m-btn>
        <m-btn
          :disabled="!reportName"
          :loading="isSaveLoading"
          @click="onSave"
          >{{ t("save") }}</m-btn
        >
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useAccessesService } from "~/composables/access/accesses";
import type { SupportedCulturesModel } from "~/interfaces/api/global/supported-cultures-model";

// props
const props = defineProps({
  isSaveLoading: Boolean,
});

//emits
const emit = defineEmits(["closeDialog", "onSave"]);

// states
const { t } = useI18n();
const { isAdmin } = useAccessesService();
const reportName = ref<string>("");
const reportNameL10n = ref<SupportedCulturesModel>({});
const isPublic = ref<boolean>(false);

// hooks
const hasAccessToMakePublic = computed(() => {
  return isAdmin.value;
});

// methods
const closeDialog = (): void => emit("closeDialog");

const onSave = (): void =>
  emit("onSave", {
    default_name: reportName.value,
    name_l10n: reportNameL10n.value,
    is_public: isPublic.value,
  });
<\/script>
`;export{e as default};
