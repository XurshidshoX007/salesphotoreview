const n=`<template>
  <d-modal
    only-close-dialog
    :name="t('clients.updating_clients_with_excel')"
    data-container-width="700px"
    @closeDialog="closeDialog"
  >
    <template #header-button>
      <div class="header-button-btn">
        <excel-btn
          :text="(templateFile && templateFile.name) || 'Скачать шаблон'"
          :loading="clientStore.isExcelFileClientUpdateDownloading"
          @click="clientStore.downloadTemplateExcelForUpdate"
        />
      </div>
    </template>
    <div class="flex justify-between items-center gap-4">
      <m-btn
        @dragover.prevent="onDragOver"
        @drop.prevent="onDrop"
        @click="uploadSelectFile"
        group="border"
        class="w-[48%]"
      >
        <div class="w-[10%]">
          <IconUpload />
        </div>
        <div class="truncate">
          {{ (selectFile && selectFile.name) || t("labels.select_excel_file") }}
        </div>
      </m-btn>
      <m-btn
        class="w-[48%]"
        :loading="clientStore.isSaveExcelLoading"
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
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useNotification } from "@kyvg/vue3-notification";

// store
const clientStore = useClientsStore("main");

// emits
const emit = defineEmits(["closeDialog"]);

// states
const { notify } = useNotification();
const { t } = useI18n();
let templateFile = ref<File>();
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
  if (selectFile.value) {
    let formData = new FormData();
    formData.append("file", selectFile.value);
    const res = await clientStore.updateExcel(formData);
    const errorCode = res?.response?.data?.ErrorCode;
    if (errorCode) {
      const errorData = res?.response?.data;
      clientStore.clientExcelErrorData = errorData;
    }
  } else {
    notify({ type: "error", title: t("labels.select_file") });
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

<style scoped lang="scss">
//*{
//  user-select: none;
//}
.excel-description {
  font-weight: 400;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  color: #424f4f;
}

.label {
  font-size: 12px;
  color: #8fa0a0;
  font-family: "Inter", sans-serif;
  font-weight: 400;
}

.header-button-btn {
  position: relative;

  .option-file {
    position: absolute;
    top: calc(100% + 2px);
    right: 0;
    background-color: #fafdfd;
    box-shadow: 0px 4px 18px 0px #00000014;
    z-index: 11;
    border-radius: 8px;
    border: 1px solid #d2d7d7;

    .section {
      color: #424f4f;
      font-weight: 400;
      font-family: "Inter", sans-serif;
      font-size: 14px;
      cursor: pointer;
      padding: 10px;
      border-bottom: 1px solid #e1e4e4;
      text-wrap: nowrap;
    }

    .section:last-child {
      border-bottom: 0;
    }

    .section:hover {
      background: #299b9b0d;
      color: #299b9b;
    }
  }

  .option-file:hover {
    color: #299b9b;
  }

  .download {
    height: 100%;
    background: rgb(189, 246, 218);
    border-radius: 0 8px 8px 0;
    padding: 7px 13px;
    cursor: pointer;
  }
}
</style>
`;export{n as default};
