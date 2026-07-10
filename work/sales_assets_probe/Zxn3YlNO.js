const n=`<template>
  <d-modal
    :name="t('clients.information_about_action')"
    @closeDialog="closeDialog"
  >
    <flex-col class="gap-5">
      <page-title20
        :title="
          isSaved
            ? t('clients.successfully_create')
            : t('clients.changes_saved_successfully')
        "
      />
      <div class="flex justify-end">
        <m-btn @click="$emit('closeDialog')">{{
          t("clients.window_closed")
        }}</m-btn>
      </div>
    </flex-col>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const props = defineProps({
  isSaved: Boolean,
});

const { t } = useI18n();
// emit
const emit = defineEmits(["closeDialog"]);

// methods
const closeDialog = () => emit("closeDialog");
<\/script>
`;export{n as default};
