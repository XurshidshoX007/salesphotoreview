const e=`<template>
  <d-modal
    :name="dialogTitle"
    data-container-width="533px"
    @close-dialog="closeDialog"
    class="upload-zone"
    only-close-dialog
  >
    <div
      class="dashed-box"
      :class="[
        isOver
          ? 'bg-neutral-200'
          : isSaveLoading
            ? 'bg-white'
            : 'bg-neutral-50',
      ]"
    >
      <SettingsProductsExcelDialogSuccess
        v-if="isUploadingSucces"
        :file-name="selectedFile?.name"
        :size="selectedFile?.size"
        @clear-file="handleClearFile"
      />
      <flex-col
        v-else
        class="items-center px-4 py-6 transition-all"
        @dragenter="isOver = true"
        @dragleave="onDragLeave"
        @dragover.prevent
        @drop.prevent="handleDrop"
      >
        <template v-if="errorMessage">
          <SettingsProductsExcelDialogError
            :error="errorMessage"
            :file-name="selectedFile?.name"
            :size="selectedFile?.size"
            @clear-file="handleClearFile"
          />

          <SettingsProductsExcelDialogActions
            :select-file="selectedFile"
            :loading="productsStore.isTemplateDownloadExcelLoading"
            @download-excel="downloadExcel"
          />
        </template>
        <template v-else-if="isSaveLoading">
          <SettingsProductsExcelDialogPending
            :file-name="selectedFile?.name"
            :size="selectedFile?.size"
            @clear-file="handleClearFile"
          />
        </template>
        <template v-else>
          <SettingsProductsExcelDialogChooseFile />

          <SettingsProductsExcelDialogActions
            :select-file="selectedFile"
            :loading="productsStore.isTemplateDownloadExcelLoading"
            @download-excel="downloadExcel"
          />
        </template>
      </flex-col>
    </div>

    <input
      ref="fileUploadIdBottom"
      id="file_upload_id_bottom"
      accept=".xlsx , .xls"
      @change="onFileChanged"
      style="display: none"
      capture
      type="file"
    />
    <template #footer>
      <flex-row class="items-center justify-end">
        <m-btn v-if="isUploadingSucces" @click="closeDialog">
          {{ t("save") }}
        </m-btn>
        <m-btn v-else :loading="isSaveLoading" @click="onFinish">{{
          t("upload")
        }}</m-btn>
      </flex-row>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { ErrorCode } from "~/variable/error-code-contants";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import type { Ref } from "vue";

// Props
interface Props {
  type: "create" | "update";
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: "closeDialog"): void;
}>();

// Composables
const { t } = useI18n();
const eventBus = useEventBus();

// Stores
const productsStore = useProductsStore("main");

// States
const isOver = ref(false);
const fileUploadIdBottom = ref();
const selectedFile = ref<File | null>(null);
const isSaveLoading = ref(false);
const errorMessage = ref<string>("");
const isUploadingSucces = ref<boolean>(false);
const updateListEventKey = SettingsEventKeys.PRODUCTS_TABLE_UPDATE;

const externalParams = inject<Ref<FilterParams[]>>(
  "externalParams",
  ref<FilterParams[]>([]),
);
const activeTab = inject<Ref<number>>("activeTab", ref<number>(1));

// Hooks
const dialogTitle = computed(() => {
  return props.type === "create"
    ? t("settings.product.import_from_excel")
    : t("settings.product.update_from_excel");
});

// Methods
const downloadExcel = () => {
  if (props.type === "create") productsStore.downloadImportFromExcelTemplate();
  else if (props.type === "update") {
    productsStore.downloadUpdateFromExcelTemplate([
      {
        field: "is_active",
        value: [String(activeTab?.value === 1)],
      },
      ...(externalParams?.value || []),
    ]);
  }
};

const handleClearFile = () => {
  isUploadingSucces.value = false;
  selectedFile.value = null;
  errorMessage.value = "";
  fileUploadIdBottom.value.value = "";
};

const onDragLeave = (event: any) => {
  if (!event.currentTarget.contains(event.relatedTarget)) {
    isOver.value = false;
  }
};

function handleDrop(event: any) {
  isOver.value = false;
  const dataTransfer = event.dataTransfer;
  const droppedFiles = [...event.dataTransfer.files];

  const excelFiles = droppedFiles?.filter((file: any) => {
    const fileName = file.name.toLowerCase();
    return fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
  });

  if (dataTransfer && excelFiles.length) {
    handleClearFile();
    selectedFile.value = excelFiles[0];
  }
}

function onFileChanged(e: any) {
  const target = e.target;
  if (target && target.files.length) {
    errorMessage.value = "";
    selectedFile.value = target.files[0];
  }
}

const closeDialog = () => {
  emit("closeDialog");
};

const parseImportError = (error: any, t: (key: string) => string): string => {
  const errorCode = error?.response?.data?.ErrorCode;
  const errorData = error?.response?.data?.ErrorData;
  const messages = error?.response?.data?.Messages;

  if (errorCode === ErrorCode.ImportDataForCreatingProductsIsIncorrect) {
    const errorDataMap: Record<string, string> = {
      DuplicatedCodes: "duplicated_codes",
      NotCorrectCategoryCodes: "not_correct_category_codes",
      NotCorrectUnitCodes: "not_correct_unit_codes",
      NotCorrectSegmentCodes: "not_correct_segment_codes",
      NotCorrectBrandCodes: "not_correct_brand_codes",
      NotCorrectGroupCodes: "not_correct_group_codes",
      NotFilledRequiredNameFieldsCount: "not_filled_required_name_fields",
      NotFilledRequiredCategoryCodeCount: "not_filled_required_category_code",
      NotFilledRequiredUnitCodeCount: "not_filled_required_unit_code",
    };

    if (errorData && typeof errorData === "object") {
      for (const key in errorData) {
        if (errorDataMap[key]) {
          const value = errorData[key];

          // Handle array values
          if (Array.isArray(value) && value.length) {
            return \`\${t(\`settings.import_errors.\${errorDataMap[key]}\`)}: \${value.join(", ")}\`;
          }

          // Handle numeric values
          if (typeof value === "number" && value > 0) {
            return \`\${t(\`settings.import_errors.\${errorDataMap[key]}\`)}: \${value}\`;
          }
        }
      }
    }

    return t("settings.import_failed");
  }

  if (Array.isArray(messages) && messages.length) {
    return messages.join(", ");
  }

  return t("settings.import_failed");
};

const importProducts = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  if (props.type === "create") {
    return productsStore.importFromExcel(formData);
  } else if (props.type === "update") {
    return productsStore.updateFromExcel(formData);
  }
};

const onFinish = async () => {
  if (!selectedFile.value) {
    notify({
      title: t("settings.select_excel_file_for_import"),
      type: "error",
    });
    return;
  }

  isSaveLoading.value = true;
  errorMessage.value = "";

  try {
    await importProducts(selectedFile.value);

    notify({
      title: t("toast.saved"),
      type: "success",
    });

    eventBus.emit(updateListEventKey);
    isUploadingSucces.value = true;
  } catch (error: any) {
    const message = parseImportError(error, t);

    errorMessage.value = message;

    notify({
      title: message,
      type: "error",
    });
  } finally {
    isSaveLoading.value = false;
  }
};
<\/script>

<style scoped>
.dashed-box {
  background-image: url("@/assets/svg/dashed-background.svg");
  border-radius: 10px;
  overflow: hidden;
}
</style>
`;export{e as default};
