const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header justify-between">
      <div class="table-content-btn-group">
        <TableSortColumns
          :templates="headers"
          :save-key="clientQRCodeHeader"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn :headers="headers" :save-key="clientQRCodeHeader" />
        <PageSizeBtn
          :current-size="clientsQRCodeStore.params.page_size"
          :total-count="clientsQRCodeStore.data?.total_count"
          :page-number="clientsQRCodeStore.data?.page_number"
          @setPageSize="clientsQRCodeStore.setPageSize"
        />
        <SearchInput
          :value="clientsQRCodeStore.params.search"
          @change="clientsQRCodeStore.search"
        />
        <ExcelBtn
          :loading="clientsQRCodeStore.isExcelFileDownloading"
          @click="clientsQRCodeStore.onDownloadExcelFile"
        />
        <RefreshBtn
          :loading="clientsQRCodeStore.isLoading"
          @click="clientsQRCodeStore.refresh"
        />
      </div>
      <div class="flex flex-wrap gap-4 ml-auto *:first:!w-48">
        <dropdowns-by-filter-states :filter-states="printSizesState" />
        <m-btn
          v-if="hasAccess2PrintQRCode"
          group="orange"
          class="h-10"
          :disabled="!canPrintSelectedQRCodes"
          @click="openMultipleQRCodeDialog"
        >
          {{ t("clients.print_selected_qr_codes") }} <IconPrinter />
        </m-btn>
        <m-btn
          v-if="hasAccess2GenerateClientQRCode"
          class="h-10"
          @click="onQrCodesGenerateDialog"
        >
          {{ t("clients.generate_qr_codes") }} <IconQRCode />
        </m-btn>
      </div>
    </div>
    <div class="table-content-body">
      <data-table
        :headers="headers"
        :sorted="clientsQRCodeStore.params.order_by"
        :loading="clientsQRCodeStore.isLoading"
        :check="isTableAllChecked"
        :indeterminate="isTableIndeterminate"
        :is-empty="!clientsQRCodeStore.data?.items?.length"
        @sort="clientsQRCodeStore.sortData"
        @get-all-id="selectAllItems"
      >
        <template #body>
          <c-tr v-for="item in clientsQRCodeStore.data?.items" :key="item.id">
            <c-td-no-edit
              v-for="column in headers"
              :key="column.key"
              :type="column.type"
              :is-checked="column.checked"
            >
              <Checkbox
                v-if="column.key === 'checkbox'"
                :id="item.id"
                :checked="isRowChecked(item.id)"
                @change="onSelectRow($event, item.id)"
              />
              <div v-else-if="column.key === 'qr_code'">
                <m-btn
                  @click="openQRCodePrintDialog(item)"
                  group="outlined"
                  class="!size-[30px] !p-0 !rounded-lg"
                >
                  <IconQRCode class="text-neutral-600" />
                </m-btn>
              </div>
              <div v-else-if="column.key === 'client'">
                <LinkComponent
                  v-if="item.client"
                  :value="item.client.name"
                  :to="\`/clients/about-clients/\${item.client.id}\`"
                  :is-linkable="hasAccess2GetClientDetails"
                />
              </div>
              <div v-else-if="column.key === 'status'">
                <StatusBtnForTable
                  :status-data="item.status"
                  :data-id="item.id"
                  :available-statuses-by-id="statuses"
                  :is-setting-status-loading="isSettingStatusLoading"
                  :readonly="!hasAccess2ChangeQRCodeStatus"
                  @on-change-status-by-id="
                    onChangeQRCodeStatus($event, item.id)
                  "
                />
              </div>
              <div v-else-if="column.key === 'action'">
                <m-btn
                  v-if="!!item.client && hasAccess2AttachDetachQRCode"
                  group="outlined"
                  class="h-7 !py-0 !gap-1 !rounded-lg"
                  @click="openDetachDialog(item)"
                >
                  <IconPaperClipOff class="text-[#E82F2F]" />
                  {{ t("clients.detach") }}
                </m-btn>
                <m-btn
                  v-else-if="hasAccess2AttachDetachQRCode"
                  group="outlined"
                  class="h-7 !py-0 !gap-1 !rounded-lg"
                  @click="openAttachDialog(item)"
                >
                  <IconPaperClip class="text-primary-600" />
                  {{ t("clients.attach") }}
                </m-btn>
              </div>
              <div v-else>
                {{
                  getDataValue(
                    item,
                    column.accessorKey || column.key,
                    column.type
                  )
                }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="clientsQRCodeStore.params?.page_size"
        :page-number="clientsQRCodeStore?.data?.page_number"
        :total-count="clientsQRCodeStore?.data?.total_count"
      />
      <page-index
        :available-pages="clientsQRCodeStore?.data?.total_pages"
        :current-page="clientsQRCodeStore?.data?.page_number"
        @setPage="clientsQRCodeStore.setPage"
      />
    </div>

    <transition name="modal">
      <div v-if="isQRCodePrintDialogOpen && selectedQRCode">
        <SharedPrintDialog
          :name="t('column.qr_code')"
          :print-styles="qrCodePrintStyles"
          @close-dialog="closeQRCodePrintDialog"
          @on-after-print="updateStatusToPrinted"
        >
          <template #content>
            <QrcodeVue
              :value="selectedQRCode.payload"
              render-as="svg"
              :size="360"
              class="p-7 border rounded-[32px] border-neutral-200"
            />
          </template>
        </SharedPrintDialog>
      </div>
    </transition>
    <transition name="modal">
      <div v-if="selectedQRCodes.length">
        <SharedPrintDialog
          :name="t('column.qr_codes')"
          :print-styles="qrCodePrintStyles"
          @close-dialog="closeMultipleQRCodeDialog"
          @on-after-print="updateMultipleStatusToPrinted"
        >
          <template #content>
            <div class="flex flex-wrap gap-5 print:gap-0">
              <div v-for="item in selectedQRCodes" :key="item.id">
                <QrcodeVue
                  :size="150"
                  :value="item.payload"
                  render-as="svg"
                  class="p-2.5 border rounded-large border-neutral-200"
                />
              </div>
            </div>
          </template>
        </SharedPrintDialog>
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isQRCodesGenerateDialogOpen">
        <ClientsQRCodeGenerateDialog
          @closeDialog="closeQrCodesGenerateDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isDetachDialogOpen">
        <ClientsQrCodeDetachDialog
          :is-detach-loading="isDetachLoading"
          @close-dialog="closeDetachDialog"
          @on-detach-qr-code="onDetachQRCode"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isAttachDialogOpen">
        <ClientsQrCodeAttachDialog
          @close-dialog="closeAttachDialog"
          @on-attach-qr-code="onAttachQRCode"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isCustomPrintSizeDialogOpen">
        <clients-qr-code-custom-print-size-dialog
          :initial-value="customPrintInitialValue"
          @close-dialog="isCustomPrintSizeDialogOpen = false"
          @save="onSaveCustomPrintSize"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useClientsAccess } from "~/composables/access/clients/clients";
import { clientQRCodeHeader } from "~/variable/column-constants";
import QrcodeVue from "qrcode.vue";
import { useI18n } from "vue-i18n";
import {
  CM_TO_PIXELS,
  printDefaultOptions,
  QRCodeStatus,
} from "~/variable/static-constants";
import { notify } from "@kyvg/vue3-notification";
import type { PrintSizeType } from "~/interfaces/api/clients/client-qr-code-model";
import { getDataValue } from "~/utils/helpers";

// store
const clientsQRCodeStore = useClientsQRCodeStore();

// access
const {
  hasAccess2ChangeQRCodeStatus,
  hasAccess2GenerateClientQRCode,
  hasAccess2PrintQRCode,
  hasAccess2AttachDetachQRCode,
  hasAccess2Detail: hasAccess2GetClientDetails,
} = useClientsAccess();

// states
const { t } = useI18n();
const selectedQRCode = ref<ClientQrCodeModel | null>();
const selectedQRCodes = ref<ClientQrCodeModel[]>([]);
const isSettingStatusLoading = ref(false);
const isQRCodePrintDialogOpen = ref(false);
const isQRCodesGenerateDialogOpen = ref(false);
const isDetachDialogOpen = ref(false);
const isAttachDialogOpen = ref(false);
const isDetachLoading = ref(false);
const isCustomPrintSizeDialogOpen = ref(false);
const printSize = ref(printDefaultOptions[0]);

const printSizesState = ref([
  {
    key: "print-sizes",
    isSingleSelect: true,
    get data() {
      return {
        items: printOptions,
      };
    },
    get getSelectedData() {
      return printSize.value.id;
    },
    set setSelectedData(value: string) {
      if (value === "custom") {
        isCustomPrintSizeDialogOpen.value = true;
      } else {
        printSize.value =
          printOptions.value.find((option) => option.id === value) ||
          printDefaultOptions[0];

        setCheckedItemsToLocalByKey(QR_CODE_SIZE_STORE_KEY, printSize.value);
      }
    },
  },
]);

// constants
const QR_CODE_SIZE_STORE_KEY = "clients-qr-code-print-size";

const statuses = [
  {
    id: QRCodeStatus.READY_TO_PRINT,
    name: t("clients.qr_codes.ready_to_print"),
  },
  {
    id: QRCodeStatus.PRINTED,
    name: t("clients.qr_codes.printed"),
  },
];

// hooks
onMounted(() => {
  printSize.value =
    getCheckedItemsByKey(QR_CODE_SIZE_STORE_KEY) || printDefaultOptions[0];
});

const isTableAllChecked = computed(() => {
  return (
    !!clientsQRCodeStore.data?.items.length &&
    clientsQRCodeStore.data.items.every((item) =>
      clientsQRCodeStore.selectedItemIds.includes(item.id)
    )
  );
});

const isTableIndeterminate = computed(() => {
  return (
    !isTableAllChecked.value &&
    !!clientsQRCodeStore.data?.items.length &&
    clientsQRCodeStore.data.items.some((item) =>
      clientsQRCodeStore.selectedItemIds.includes(item.id)
    )
  );
});

const canPrintSelectedQRCodes = computed(
  () => !!clientsQRCodeStore.selectedItemIds.length
);

const headers = computed(() => {
  return clientsQRCodeStore.templates.filter((template) =>
    template.type === "action" ? hasAccess2AttachDetachQRCode.value : true
  );
});

const printOptions = computed(() => {
  const isCustomSizeSelected = printSize.value.id === "custom";
  const customSizeName = isCustomSizeSelected
    ? \`\${t("clients.qr_codes.other")} (\${printSize.value.width} x \${printSize.value.height})\`
    : \`\${t("clients.qr_codes.other")}\`;

  return [...printDefaultOptions, { id: "custom", name: customSizeName }];
});

const customPrintInitialValue = computed(() => {
  if (
    printSize.value.id === "custom" &&
    printSize.value.width &&
    printSize.value.height
  ) {
    return {
      width: printSize.value.width,
      height: printSize.value.height,
    };
  }
});

const qrCodePrintStyles = computed(() => {
  const width = printSize.value.width || printDefaultOptions[0].width;
  const height = printSize.value.height || printDefaultOptions[0].height;

  if (!width || !height) return "";

  const defaultSize = 130 / CM_TO_PIXELS; // 130 pixels in cm
  const ratio = Math.min(width / defaultSize, height / defaultSize);

  const padding = (10 / CM_TO_PIXELS) * ratio;
  const radius = (12 / CM_TO_PIXELS) * ratio;

  return \`
    svg {
      padding: \${padding}cm !important;
      border: 1px solid #E1E4EA !important;
      border-radius: \${radius}cm !important;
      width: \${width}cm !important;
      height: \${height}cm !important;
      max-width: \${width}cm !important;
      max-height: \${height}cm !important;
    }
  \`;
});

// methods
const isRowChecked = (id: string) => {
  return clientsQRCodeStore.selectedItemIds.includes(id);
};

const onSelectRow = (isChecked: boolean, id: string) => {
  if (isChecked) {
    clientsQRCodeStore.selectedItemIds.push(id);
  } else {
    clientsQRCodeStore.selectedItemIds =
      clientsQRCodeStore.selectedItemIds.filter((itemId) => itemId !== id);
  }
};

const openQRCodePrintDialog = (data: ClientQrCodeModel) => {
  isQRCodePrintDialogOpen.value = true;
  selectedQRCode.value = data;
};

const closeQRCodePrintDialog = () => {
  isQRCodePrintDialogOpen.value = false;
  selectedQRCode.value = null;
};

const openMultipleQRCodeDialog = () => {
  selectedQRCodes.value =
    clientsQRCodeStore.data?.items.filter((item) =>
      clientsQRCodeStore.selectedItemIds.includes(item.id)
    ) || [];
};

const closeMultipleQRCodeDialog = () => {
  selectedQRCodes.value = [];
};

const onChangeTableHeaders = (value: Template[]) => {
  clientsQRCodeStore.templates = value;
};

const selectAllItems = (isChecked: boolean) => {
  if (isChecked) {
    clientsQRCodeStore.data?.items.forEach((item) => {
      clientsQRCodeStore.selectedItemIds.push(item.id);
    });
  } else {
    clientsQRCodeStore.selectedItemIds = [];
  }
};

const updateStatusToPrinted = async () => {
  if (
    !hasAccess2ChangeQRCodeStatus.value ||
    !selectedQRCode.value ||
    selectedQRCode.value.status.id !== QRCodeStatus.READY_TO_PRINT
  )
    return;

  try {
    await clientsQRCodeStore.updateStatus(
      selectedQRCode.value.id,
      QRCodeStatus.PRINTED
    );

    notify({ title: t("toast.saved"), type: "success" });
  } catch (error) {
    console.error(error);
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    await clientsQRCodeStore.refresh();
  }
};

const updateMultipleStatusToPrinted = async () => {
  if (!hasAccess2ChangeQRCodeStatus.value) return;

  const qrCodes = selectedQRCodes.value.filter(
    (item) => item.status.id === QRCodeStatus.READY_TO_PRINT
  );

  if (!qrCodes.length) return;

  try {
    await clientsQRCodeStore.updateMultipleStatus(
      qrCodes.map((item) => item.id),
      QRCodeStatus.PRINTED
    );

    notify({ title: t("toast.saved"), type: "success" });
  } catch (error) {
    console.error(error);
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    await clientsQRCodeStore.refresh();
  }
};

const onChangeQRCodeStatus = async (status: QRCodeStatus, id: string) => {
  isSettingStatusLoading.value = true;

  try {
    await clientsQRCodeStore.updateStatus(id, status);

    notify({ title: t("toast.success"), type: "success" });

    await clientsQRCodeStore.refresh();
  } catch (error) {
    console.error(error);
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isSettingStatusLoading.value = false;
  }
};

const onQrCodesGenerateDialog = () => {
  isQRCodesGenerateDialogOpen.value = true;
};

const closeQrCodesGenerateDialog = () => {
  isQRCodesGenerateDialogOpen.value = false;
};

const openDetachDialog = (data: ClientQrCodeModel) => {
  isDetachDialogOpen.value = true;
  selectedQRCode.value = data;
};

const closeDetachDialog = () => {
  isDetachDialogOpen.value = false;
  selectedQRCode.value = null;
};

const onDetachQRCode = async () => {
  if (!selectedQRCode.value || !selectedQRCode.value.client) return;

  isDetachLoading.value = true;

  try {
    await clientsQRCodeStore.detachQRCode(selectedQRCode.value.client.id);

    notify({ title: t("toast.success"), type: "success" });
    clientsQRCodeStore.refresh();
  } catch (error) {
    console.error(error);
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isDetachLoading.value = false;
    closeDetachDialog();
  }
};

const openAttachDialog = (data: ClientQrCodeModel) => {
  isAttachDialogOpen.value = true;
  selectedQRCode.value = data;
};

const closeAttachDialog = () => {
  isAttachDialogOpen.value = false;
  selectedQRCode.value = null;
};

const onAttachQRCode = async (clientId: string) => {
  if (!selectedQRCode.value) return;
  clientsQRCodeStore.isQRCodeAttachLoading = true;

  try {
    await clientsQRCodeStore.attachQRCode({
      clientId,
      payload: selectedQRCode.value.payload,
    });

    notify({ title: t("toast.success"), type: "success" });
    clientsQRCodeStore.refresh();
  } catch (error) {
    console.error(error);
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    clientsQRCodeStore.isQRCodeAttachLoading = false;
    closeAttachDialog();
  }
};

const onSaveCustomPrintSize = (data: PrintSizeType) => {
  printSize.value = {
    id: "custom",
    width: data.width,
    height: data.height,
  };

  setCheckedItemsToLocalByKey(QR_CODE_SIZE_STORE_KEY, printSize.value);
};
<\/script>
`;export{e as default};
