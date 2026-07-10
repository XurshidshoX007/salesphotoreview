const e=`<template>
  <d-modal :name="dialogName" :loading="isLoading" @close-dialog="closeDialog">
    <flex-col class="gap-4">
      <flex-row
        v-for="(item, key) of formattedDetail"
        :key="key"
        class="justify-between items-center border-b last-border-b-0 py-2"
      >
        <div>
          {{ key }}
        </div>
        <div>
          {{ item }}
        </div>
      </flex-row>
    </flex-col>
    <template v-if="hasAccess2PaymentUpdate || hasAccess2PaymentDelete" #footer>
      <flex-row class="items-center justify-end gap-4">
        <rounded-icon-btn
          v-if="hasAccess2PaymentDelete"
          type="danger"
          size="md"
          @click="onDelete"
        />
        <m-btn v-if="hasAccess2PaymentUpdate" @click="onEdit">
          <IconEdit :size="20" class="text-white" />
          {{ t("edit") }}
        </m-btn>
      </flex-row>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { DetailModel } from "~/interfaces/api/supplier/payment-models";
import { getFormattedDate } from "~/utils/formatters";
import { getFormattedAmount } from "~/utils/filter";
import { useSuppliersAccess } from "~/composables/access/suppliers/suppliers";

// props
const props = defineProps<{
  id: string;
}>();

// emits
const emit = defineEmits<{
  (e: "close-dialog"): void;
  (e: "open-edit-dialog", id: string): void;
  (e: "open-delete-confirmation", id: string): void;
}>();

// stores
const supplierPaymentsStore = useSupplierPaymentsStore("main");

// accesses
const { hasAccess2PaymentUpdate, hasAccess2PaymentDelete } =
  useSuppliersAccess();

// states
const { t } = useI18n();
const detail = ref<DetailModel | undefined>(undefined);
const isLoading = ref<boolean>(false);

// hooks
const formattedDetail = computed(() => {
  if (!detail.value) return undefined;
  return {
    [t("column.id")]: detail.value.visual_id,
    [t("column.supplier")]: detail.value.supplier?.name,
    [t("suppliers.payment.payment_amount")]: getFormattedAmount(
      detail.value.payment_amount,
    ),
    [t("settings_sidebar.payment_method")]: detail.value.currency_name,
    [t("column.comment")]: detail.value.description,
    [t("column.created_date")]: getFormattedDate(detail.value.created_date),
    [t("column.created_by")]: detail.value.created_by,
  };
});

const dialogName = computed((): string => {
  return t("clients.payment") + " № " + (detail.value?.visual_id || "");
});

onMounted(async () => {
  if (!props.id) return;
  await getDetail();
});

// methods
const getDetail = async () => {
  isLoading.value = true;
  detail.value = await (supplierPaymentsStore.getDetailById(props.id) || []);
  isLoading.value = false;
};

const closeDialog = () => {
  emit("close-dialog");
};

const onEdit = () => {
  emit("open-edit-dialog", props.id);
  closeDialog();
};

const onDelete = () => {
  emit("open-delete-confirmation", props.id);
  closeDialog();
};
<\/script>
`;export{e as default};
