const n=`<template>
  <flex-row class="items-center gap-4">
    <m-btn
      @click="() => emits('downloadExcel')"
      group="border"
      class="!border-neutral-200 !py-2"
    >
      <IconLoading
        v-if="loading"
        :loading="true"
        color="#299B9B"
        :width="4"
        :height="4"
      />
      <div v-else class="w-4">
        <IconDownload />
      </div>
      <div class="truncate">
        {{ t("settings.download_template") }}
      </div>
    </m-btn>

    <m-btn
      @click="uploadSelectFile"
      group="border"
      class="!border-neutral-200 !py-2"
    >
      <div class="w-4">
        <IconUpload />
      </div>
      <div class="truncate max-w-56 w-full">
        {{ selectFile ? selectFile.name : t("labels.select_excel_file") }}
      </div>
    </m-btn>
  </flex-row>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// Props

defineProps<{
  selectFile: File | null;
  loading: boolean;
}>();

// Emits

const emits = defineEmits<{
  (e: "downloadExcel"): Promise<any>;
}>();

// Composable
const { t } = useI18n();

// Metods

function uploadSelectFile() {
  document.getElementById("file_upload_id_bottom")?.click();
}
<\/script>
`;export{n as default};
