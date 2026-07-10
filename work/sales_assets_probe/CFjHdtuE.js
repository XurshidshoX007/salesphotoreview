const n=`<template>
  <div class="justify-self-end cursor-pointer w-full">
    <menu-btn sizeFree without-padding @onChangeIsActive="onChangeMenuIsActive">
      <template #btn>
        <div
          v-tooltip="{
            text: t('labels.download_the_current_state_of_the_label_on_excel'),
            placement: 'top-start',
          }"
          class="flex excel-btn-bg gap-2 items-center justify-center px-3 py-[9px] rounded-lg hover:bg-green-100 transition-all"
        >
          <IconExcelSVG />
          <div>
            <icon-arrow-bottom
              :class="
                isMenuActive
                  ? 'transition-all transform rotate-180'
                  : 'transition-all transform rotate-0'
              "
            />
          </div>
        </div>
      </template>
      <template #content>
        <div>
          <div
            v-for="item in availableFiles"
            :key="item.id"
            class="p-3 flex items-center cursor-pointer justify-between border-b hover:bg-[#299B9B0D]"
            :class="item.loading && 'pointer-events-none'"
            v-show="item?.hasAccess"
            @click="onDownloadExcel(item.id)"
          >
            <div class="flex items-center gap-x-2">
              <icon-loading
                v-show="item.loading"
                :loading="item.loading"
                :width="4"
                :height="4"
              />
              <icon-download v-show="!item.loading" />
              <div class="label fs-14">{{ item?.name }}</div>
            </div>
          </div>
        </div>
      </template>
    </menu-btn>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useShippingInvoiceAccess } from "~/composables/access/invoices/shipping-access";
import type { FileStateModel } from "~/interfaces/ui/FileStateModel";

// store
const invoicesStore = useInvoicesStore("main");

// props
const props = defineProps<{ invoiceId?: string }>();

// emits
const emit = defineEmits(["onDownloadExcel"]);

// states
const { t } = useI18n();
const { hasAccess2Excel217, hasAccess2Excel520 } = useShippingInvoiceAccess();
const isMenuActive = ref(false);
const fileStates = ref<FileStateModel[]>(
  getCheckedItemsByKey(invoicesStore.fileStateKey) || invoicesStore.fileStates,
);

// hooks
const availableFiles = computed(() => {
  return fileStates.value
    .map((fileState) => ({
      ...fileState,
      hasAccess:
        fileState.id === 217
          ? hasAccess2Excel217.value
          : fileState.id === 520
            ? hasAccess2Excel520.value
            : true,
    }))
    .filter((fileState) => fileState.hasAccess);
});

const onChangeMenuIsActive = (value: boolean) => {
  isMenuActive.value = value;
};

const toggleFileLoading = (id: number, loading: boolean) => {
  const file = fileStates.value.find((item) => item.id === id);
  if (file) {
    file.loading = loading;
  }
};

const onDownloadExcel = async (id: number) => {
  if (!id || !props.invoiceId) return;
  toggleFileLoading(id, true);
  await invoicesStore.downloadShippingInvoice(id, [props.invoiceId]);
  toggleFileLoading(id, false);
};
<\/script>
`;export{n as default};
