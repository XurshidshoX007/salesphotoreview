const n=`<template>
  <d-modal
    :name="t('audit.positions')"
    dataContainerWidth="800px"
    @close-dialog="closeDialog"
  >
    <AuditSettingsAuditPositonDataTable :configId="configId" :key="configId" />
    <template #footer>
      <div class="flex justify-end">
        <m-btn :loading="isLoadingBtn" @click="onSave">
          {{ t("save") }}
        </m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { notify } from "@kyvg/vue3-notification";

//  props
const prop = defineProps<{
  configId: string;
}>();

// store
const auditReviewConfigStore = useAuditReviewConfigStore(
  "main" + prop.configId,
);
// emits
const emit = defineEmits<{
  (e: "closeDialog"): void;
}>();

// states
const { t } = useI18n();
const isLoadingBtn = ref<boolean>(false);

const data = computed(() => {
  return {
    config_id: prop.configId,
    user_id_arr: auditReviewConfigStore.userIdArr,
  };
});

// methods
const closeDialog = () => {
  emit("closeDialog");
};

const onSave = async () => {
  isLoadingBtn.value = true;
  try {
    const res = await auditReviewConfigStore.auditUsersSave(data.value);
    if (res !== "error") {
      notify({
        title: t("toast.success"),
        type: "success",
      });
      closeDialog();
    } else {
      auditReviewConfigStore.userIdArr = [];
    }
  } catch (err) {
    notify({ title: t("error"), type: "error" });
    console.error(err);
  } finally {
    isLoadingBtn.value = false;
  }
};
<\/script>
`;export{n as default};
