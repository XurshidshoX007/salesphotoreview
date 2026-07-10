const n=`<template>
  <d-modal
    :name="t('cash.initial_balance_import_excel')"
    @closeDialog="closeDialog"
    only-close-dialog
  >
    <flex-col class="gap-5">
      <div class="flex items-center gap-x-3">
        <excel-btn
          :text="t('settings.download_template')"
          :loading="clientsInitialBalanceStore.isTemplateDownloadExcelLoading"
          class="w-full"
          @click="clientsInitialBalanceStore.downloadTemplateExcel"
        />
        <m-btn
          group="border"
          class="w-full"
          @dragover.prevent="onDragOver"
          @drop.prevent="onDrop"
          @click="uploadSelectFile"
        >
          <div class="w-[10%]">
            <IconUpload />
          </div>
          <div class="truncate">
            {{
              (selectFile && selectFile.name) || t("labels.select_excel_file")
            }}
          </div>
        </m-btn>
      </div>
      <div>
        <m-btn
          :loading="clientsInitialBalanceStore.isSaveExcelLoading"
          class="w-full"
          @click="onFinish"
        >
          {{ t("save") }}
        </m-btn>
        <input
          id="file_upload_id_bottom"
          accept=".xlsx , .xls"
          ref="file"
          @change="onFileChanged($event)"
          style="display: none"
          capture
          type="file"
        />
      </div>
    </flex-col>
  </d-modal>
</template>

<script setup lang="ts">
// emits
import { useI18n } from "vue-i18n";
import { useNotification } from "@kyvg/vue3-notification";

// store
const clientsInitialBalanceStore = useClientsInitialBalanceStore("main");

// emit
const emit = defineEmits(["closeDialog"]);

// state
const { notify } = useNotification();

const { t } = useI18n();
let selectFile = ref<File>();

// methods
const closeDialog = () => {
  emit("closeDialog");
};

function uploadSelectFile() {
  document.getElementById("file_upload_id_bottom").click();
}

function onFileChanged(e: any) {
  const target = e.target;
  if (target && target.files) {
    selectFile.value = target.files[0];
  }
}

const onFinish = async () => {
  if (!selectFile.value) {
    notify({ type: "error", title: t("labels.select_file") });
    return;
  }

  let formData = new FormData();
  formData.append("file", selectFile.value);

  try {
    const response = await clientsInitialBalanceStore.saveExcel(formData);

    if (response !== "error") {
      clientsInitialBalanceStore.excelFailedResponse = response;
    }

    closeDialog();

    await clientsInitialBalanceStore.refresh();
  } catch (e) {
    console.error(e);
  }
};

const onDrop = (event) => {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  if (file) {
    selectFile.value = file;
  }
};

const onDragOver = (event) => {
  event.preventDefault();
};
<\/script>
`;export{n as default};
