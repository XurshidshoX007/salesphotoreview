const n=`<template>
  <d-modal
    :name="t('audit.positions')"
    dataContainerWidth="800px"
    @close-dialog="closeDialog"
  >
    <AuditSettingsQuestionsPositonDataTable :questionFormId="questionFormId" />
    <template #footer>
      <div class="flex justify-end">
        <m-btn :laoding="isLoadingBtn" @click="onSave">
          {{ t("save") }}
        </m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { notify } from "@kyvg/vue3-notification";

// store

const auditQuestionStore = useAuditQuestionStore("main");
//  props

const prop = defineProps<{
  questionFormId: string;
}>();

// states

const { t } = useI18n();
const isLoadingBtn = ref<boolean>(false);

const data = computed(() => {
  return {
    question_form_id: prop.questionFormId,
    user_id_arr: auditQuestionStore.userIdArr,
  };
});
// emits
const emit = defineEmits(["closeDialog"]);

// methods

const closeDialog = () => {
  emit("closeDialog");
};

const onSave = async () => {
  isLoadingBtn.value = true;
  try {
    const res = await auditQuestionStore.questionFormSave(data.value);
    if (res !== "error") {
      notify({
        title: t("save"),
        type: "success",
      });
    }
    auditQuestionStore.userIdArr = [];
    await auditQuestionStore.getQuestionPositionData();
    closeDialog();
  } catch (err) {
    notify({ title: t("error"), type: "error" });
    console.error(err);
  } finally {
    isLoadingBtn.value = false;
  }
};
<\/script>
`;export{n as default};
