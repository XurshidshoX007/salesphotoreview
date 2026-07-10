const e=`<template>
  <form @submit.prevent="onSave">
    <d-modal
      onlyCloseDialog
      :name="t('invoices.settings_shipping_invoice')"
      @close-dialog="closeDialog"
    >
      <flex-col class="gap-4">
        <DInputDatePicker
          without-time
          disabled-past-dates
          :value="data.shipping_date"
          :label="t('column.shipped_date')"
          @change="changeShippingDate"
        />
        <DropdownsByFilterStates
          ref="DropdownComponent"
          :key="data.warehouse_id"
          :filter-states="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <Checkbox
          id="expeditor_confirmation"
          :checked="data.is_expeditor_confirmation_required"
          :title="t('invoices.expeditor_confirmation')"
          @change="data.is_expeditor_confirmation_required = $event"
        />
        <Checkbox
          id="warehouseman_confirmation"
          :checked="data.is_warehouseman_confirmation_required"
          :title="t('invoices.warehouseman_confirmation')"
          @change="data.is_warehouseman_confirmation_required = $event"
        />
        <Checkbox
          id="operator_confirmation"
          :checked="data.is_operator_confirmation_required"
          :title="t('invoices.operator_confirmation')"
          @change="data.is_operator_confirmation_required = $event"
        />
        <d-input
          type="text"
          pattern-type="comment"
          :label="t('column.comment')"
          :value="data.comment"
          @change="(value) => (data.comment = value)"
        />
      </flex-col>
      <template #footer>
        <m-btn
          :loading="isLoading"
          type="submit"
          class="w-full"
          :disabled="!checkConfirm"
        >
          {{ t("create") }}
        </m-btn>
      </template>
      <transition name="modal">
        <div v-if="responseResults?.length > 0">
          <InvoicesShippingGenerateResponseResultDialog
            :responseResults="responseResults"
            @closeDialog="closeResponseResultDialog"
          />
        </div>
      </transition>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type {
  ShipmentGenerateExpeditorListModel,
  ShipmentGenerateModel,
} from "~/interfaces/api/invoices/shipping/shipment/shipment-model";
import type { DropdownsByFilterStates } from "#components";
import { defaultDropdownParams } from "~/variable/params";
import { parallelReqsByBatches } from "~/utils/async-parallel";
import { useNotification } from "@kyvg/vue3-notification";
const { notify } = useNotification();
// store
const shippingInvoiceStore = useShippingInvoicesStore("main");

// emits
const emit = defineEmits(["closeDialog", "refresh"]);

const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);

// states
const { t } = useI18n();

const isLoading = ref(false);

const responseResults = ref([]);

const data = ref<ShipmentGenerateModel>({
  warehouse_id: null,
  expeditor_id_arr: [],
  shipping_date: null,
  is_expeditor_confirmation_required: false,
  is_warehouseman_confirmation_required: false,
  is_operator_confirmation_required: false,
  comment: null,
});

const paramsGenerateExpeditor = computed(() => {
  return {
    ...defaultDropdownParams,
    warehouse_id: data.value.warehouse_id,
    expected_shipping_date: data.value.shipping_date,
    order_by: {
      field: "available_orders_to_shipment_invoice_count",
      is_asc: false,
    },
    filter: [
      {
        field: "is_active",
        value: ["true"],
      },
    ],
  };
});

const filterStates = computed(() => {
  return [
    {
      name: t("sidebar.warehouse"),
      key: "warehouses",
      get data() {
        return shippingInvoiceStore.warehousesData || [];
      },
      isSingleSelect: true,
      required: true,
      get getSelectedData() {
        return data.value.warehouse_id;
      },
      set setSelectedData(id: string) {
        data.value.warehouse_id = id;
      },
    },
    {
      customFilterItems: defineAsyncComponent(
        () => import("@/components/invoices/shipping/GenerateFilterItems.vue")
      ),
      name: t("filters.expeditor"),
      key: "expeditors",
      order: 4,
      disabled: !data.value.warehouse_id,
      required: true,
      get data() {
        return shippingInvoiceStore.expeditorData || [];
      },
      get getSelectedData() {
        return data.value.expeditor_id_arr;
      },
      set setSelectedData(id: string[]) {
        data.value.expeditor_id_arr = id;
      },
      isItemsDisabled: (item: ShipmentGenerateExpeditorListModel) => {
        return item?.available_orders_to_shipment_invoice_count === 0;
      },
    },
  ];
});

// methods
const onOpenDropdown = async (state: string, value: any) => {
  if (state === "expeditors" && !shippingInvoiceStore.expeditorData) {
    await getExpeditor();
  } else if (state === "warehouses" && !shippingInvoiceStore.warehousesData) {
    await shippingInvoiceStore.getWarehouses();
  }
};

const getExpeditor = async () => {
  await shippingInvoiceStore.getGenerateExpeditorList(
    paramsGenerateExpeditor.value
  );
};

const closeDialog = () => {
  emit("closeDialog");
};

const changeShippingDate = async (date: string) => {
  data.value.shipping_date = date;
};

const checkConfirm = computed(() => {
  return (
    data.value.is_expeditor_confirmation_required ||
    data.value.is_warehouseman_confirmation_required ||
    data.value.is_operator_confirmation_required
  );
});

const onSave = async () => {
  isLoading.value = true;

  const orderIds = [...data.value.expeditor_id_arr];
  const { expeditor_id_arr, ...restPayload } = data.value;

  responseResults.value = orderIds.map((id) => ({
    expeditor_id: id,
    status: null,
    message: null,
    loading: true,
  }));

  await parallelReqsByBatches(10, orderIds, async (orderId) => {
    const generateData = {
      ...restPayload,
      expeditor_id: orderId,
    };

    try {
      const result = await shippingInvoiceStore.shipmentGenerate(generateData);
      const isSuccessful = result?.statusText === "OK";

      const index = responseResults.value.findIndex(
        (r) => r.expeditor_id === orderId
      );
      if (index !== -1) {
        responseResults.value[index] = {
          expeditor_id: orderId,
          status: result?.statusText,
          message: isSuccessful ? undefined : result?.data?.Messages?.[0],
          loading: false,
        };
      }

      if (isSuccessful) {
        const idx = data.value.expeditor_id_arr.findIndex(
          (id) => id === orderId
        );
        if (idx !== -1) {
          data.value.expeditor_id_arr.splice(idx, 1);
        }
      }
    } catch (err) {
      const index = responseResults.value.findIndex(
        (r) => r.expeditor_id === orderId
      );
      if (index !== -1) {
        responseResults.value[index] = {
          expeditor_id: orderId,
          status: "ERROR",
          message: err?.response?.data?.Messages?.[0],
          loading: false,
        };
      }
    }
  });
  await getExpeditor();
  refresh();
  notify({ title: t("successfully"), type: "success" });
  isLoading.value = false;
};

const refresh = () => {
  emit("refresh");
};

const closeResponseResultDialog = () => {
  responseResults.value = [];
  data.value.expeditor_id_arr = [];
  DropdownComponent.value!.onClearFilter();
};

// hooks

watch(
  () => paramsGenerateExpeditor.value,
  async () => {
    if (
      paramsGenerateExpeditor.value.warehouse_id &&
      paramsGenerateExpeditor.value.expected_shipping_date
    ) {
      data.value.expeditor_id_arr = [];
      await getExpeditor();
    }
  }
);
<\/script>
`;export{e as default};
