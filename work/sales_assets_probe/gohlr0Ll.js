const e=`<template>
  <div>
    <DownloadDropdown
      :data="checkedFiles"
      btn-size-type="medium"
      :is-loading="isDownloading"
      :disabled="isDownloading"
      @onOpenDialog="openConfigDialog"
      @setSelectedItem="onDownloadCheckedItems"
    />
    <transition name="modal">
      <div v-if="isConfigDialogOpen">
        <InvoicesAssemblyInvConfigDialog
          :file-states="availableFiles"
          @close-dialog="closeInvConfigDialog"
          @update-file-states="updateFileStates"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { getCheckedItemsByKey } from "~/utils/local-storage";
import { useShippingInvoiceAccess } from "~/composables/access/invoices/shipping-access";
import type { FileStateModel } from "~/interfaces/ui/FileStateModel";

// props
const props = defineProps<{
  invoiceIds: string[];
}>();

// store
const invoicesStore = useInvoicesStore("main");

// states
const { t } = useI18n();
const { hasAccess2Excel217, hasAccess2Excel520 } = useShippingInvoiceAccess();
const isConfigDialogOpen = ref(false);
const isDownloading = ref(false);
const fileStates = ref<FileStateModel[]>(
  getCheckedItemsByKey(invoicesStore.fileStateKey) || invoicesStore.fileStates,
);
// hooks
const availableFiles = computed<Array<FileStateModel & { hasAccess: boolean }>>(
  () => {
    return fileStates.value
      .map((fileState) => {
        if (fileState.id === 217) {
          return {
            ...fileState,
            hasAccess: hasAccess2Excel217.value,
          } as FileStateModel & { hasAccess: boolean };
        } else if (fileState.id === 520) {
          return {
            ...fileState,
            hasAccess: hasAccess2Excel520.value,
          } as FileStateModel & { hasAccess: boolean };
        } else {
          return { ...fileState, hasAccess: false } as FileStateModel & {
            hasAccess: boolean;
          };
        }
      })
      .filter(
        (item: FileStateModel & { hasAccess: boolean }) => item.hasAccess,
      );
  },
);

const checkedFiles = computed(() => ({
  name: t("invoices.download_excel"),
  key: "excel",
  data: {
    items: availableFiles.value
      .filter((item: FileStateModel) => !!item.checked)
      .map((item: FileStateModel) => ({
        id: item.id,
        name: item.name,
        checked: item.checked,
      })),
  },
}));

// methods
const openConfigDialog = () => {
  isConfigDialogOpen.value = true;
};

const closeInvConfigDialog = () => {
  isConfigDialogOpen.value = false;
};

const onDownloadCheckedItems = async (key: string, fileNum: number) => {
  if (!props.invoiceIds?.length) {
    notify({
      title: t("invoices.select_minimally_one_invoice_to_download_excel"),
      type: "error",
    });
    return;
  }

  isDownloading.value = true;
  await invoicesStore.downloadShippingInvoice(fileNum, props.invoiceIds);
  isDownloading.value = false;
};

const updateFileStates = () => {
  fileStates.value =
    getCheckedItemsByKey(invoicesStore.fileStateKey) ||
    invoicesStore.fileStates;
};
<\/script>
`;export{e as default};
