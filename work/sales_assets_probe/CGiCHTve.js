const e=`<template>
  <form @submit.prevent="onSave">
    <d-modal
      data-container-width="90%"
      :name="modalTitle"
      @close-dialog="closeDialog"
    >
      <flex-col class="gap-4 h-[60vh]">
        <DashboardCashboxExpeditorDebtRecommendationBlock
          :exp-id="props.expeditor.id"
          @on-change-currency-id="onChangeCurrencyId"
          @on-set-recommendation-write-offs="setRecommendationWriteOffs"
        />
        <div class="pb-4">
          <div class="table-content-container">
            <div
              class="table-content-header items-center justify-between flex-wrap"
            >
              <SearchInput
                no-debounce
                :value="searchingValue"
                @change="searchingValue = $event"
                class="w-62.5"
              />
              <flex-row class="items-center justify-end gap-4 flex-wrap">
                <div class="w-62.5">
                  <DropdownsByFilterStates
                    ref="ProductDropdown"
                    :filter-states="productFilterStates"
                    class="w-full"
                    @on-open-dropdown="onOpenDropdown"
                  />
                </div>
                <DatePicker
                  ref="DatePickerComponent"
                  empty-initial-range
                  @on-apply="selectedDateRange = $event"
                  @click.stop
                />
                <ResetFilterBtn
                  :is-filter-clearable="isFilterClearable"
                  @onClearFilter="onClearFilter"
                />
              </flex-row>
            </div>
            <div class="table-content-body">
              <data-table
                :headers="headers"
                :loading="isTableLoading"
                :is-empty="!filteredInvoices.length"
              >
                <template #body>
                  <c-tr
                    v-for="data in filteredInvoices"
                    :key="data.id"
                    class="last-border-b-0"
                  >
                    <c-td-no-edit v-for="key in headers" :key="key.key">
                      <div v-if="key.type === 'object'">
                        {{
                          key.accessorKey
                            ? getNestedValue(
                                data,
                                key.accessorKey,
                                key?.innerType
                              )
                            : getDataValue(data, key.key)?.name
                        }}
                      </div>
                      <div v-else-if="key.type === 'number'" class="text-end">
                        {{ getFormattedAmount(getDataValue(data, key.key)) }}
                      </div>
                      <div v-else-if="key.key === 'write_off_input'">
                        <d-input
                          :value="writeOffData[data.id]?.write_off_count"
                          type="number"
                          :min="0"
                          :max="data.current_debt"
                          step="0.01"
                          :label="t('warehouse.write_off')"
                          class="w-full"
                          @change="changeWriteOffCount(data, $event)"
                        />
                      </div>
                      <div v-else>
                        {{ getDataValue(data, key.key) }}
                      </div>
                    </c-td-no-edit>
                  </c-tr>
                </template>
              </data-table>
            </div>
          </div>
        </div>
      </flex-col>

      <template #footer>
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="text-lg font-semibold">
            {{ t("cash.expeditor_debt.total_writing_off_sum") }}:
            {{ getFormattedAmount(totalWritingOffSum) }}
          </div>
          <div class="footer-content-container float-right">
            <div class="footer-content">
              <DInput
                :value="postData.comment"
                :label="t('column.comment')"
                @change="onChangeComment"
              />
              <DropdownsByFilterStates
                :filter-states="footerFilterStates"
                @on-open-dropdown="onOpenDropdown"
              />
              <m-btn type="submit" :loading="isSaveLoading">
                {{ t("save") }}
              </m-btn>
            </div>
          </div>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import moment from "moment";
import { useI18n } from "vue-i18n";
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";
import { getFormattedAmount } from "~/utils/filter";
import { getNestedValue } from "~/utils/helpers";
import { notify } from "@kyvg/vue3-notification";
import type {
  PostWriteOffModel,
  WriteOffAvailableInvoicesModel,
  WriteOffRecomendationByCostModel,
} from "~/interfaces/api/cashboxes/expeditor-debt-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { Template } from "~/interfaces/ui/template";
import type { CashboxesModel } from "~/interfaces/api/cashboxes/cashboxes-model";
import type { ProductsModel } from "~/interfaces/api/settings/products-model";
import type { DateRangeModel } from "~/interfaces/ui/date-range-model";
import type { DatePicker, DropdownsByFilterStates } from "#components";
import type { IdNameModel } from "~/interfaces/api/IdNameModel";
import type { CurrencyModel } from "~/interfaces/api/settings/currency-model";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";

// types
type WriteOffProductsCount = {
  product_id: string;
  write_off_count: number;
  debt_invoice_id: string;
};

// props
const props = defineProps<{
  expeditor: IdNameModel;
}>();

// emits
const emit = defineEmits<{
  (e: "close-dialog"): void;
}>();

// store
const expeditorDebtStore = useExpeditorDebtStore("main");

// child-components
const DatePickerComponent = ref<InstanceType<typeof DatePicker>>();
const ProductDropdown = ref<InstanceType<typeof DropdownsByFilterStates>>();
// states
const { t } = useI18n();

const availableInvoices = ref<WriteOffAvailableInvoicesModel[]>([]);
const isTableLoading = ref(false);
const writeOffData = ref<Record<string, WriteOffProductsCount>>({});
const cashboxes = ref<DropdownItemsModelByType<CashboxesModel>>();
const paymentMethods = ref<DropdownItemsModelByType<CurrencyModel>>();
const isSaveLoading = ref(false);

const searchingValue = ref<string>("");
const selectedDateRange = ref<DateRangeModel>();
const products = ref<DropdownItemsModelByType<ProductsModel>>();
const selectedProducts = ref<string[]>([]);

const paymentMethodParams = ref<defaultDropdownParamsType>(
  defaultDropdownParams
);

const postData = ref<PostWriteOffModel>({
  expeditor_id: props.expeditor.id,
  cash_box_id: "",
  amount: 0,
  payment_method_id: "",
  comment: null,
  write_off_products: [] as Array<WriteOffProductsCount>,
});

const footerFilterStates = ref([
  {
    name: t("column.cash"),
    key: "cashboxes",
    isSingleSelect: true,
    required: true,
    get data() {
      return cashboxes || [];
    },
    get getSelectedData() {
      return postData.value.cash_box_id;
    },
    set setSelectedData(value: string) {
      postData.value.cash_box_id = value;
    },
  },
  {
    name: t("settings_sidebar.payment_method"),
    key: "payment-methods",
    isSingleSelect: true,
    required: true,
    get data() {
      return paymentMethods.value || [];
    },
    get getSelectedData() {
      return postData.value.payment_method_id;
    },
    set setSelectedData(value: string) {
      postData.value.payment_method_id = value;
    },
  },
]);

const productFilterStates = ref([
  {
    name: t("settings_sidebar.products"),
    key: "products",
    get data() {
      return products || [];
    },
    get getSelectedData() {
      return selectedProducts.value;
    },
    set setSelectedData(value: string[]) {
      selectedProducts.value = value;
    },
  },
]);

const headers = ref<
  (Template & { accessorKey?: string; innerType?: string })[]
>([
  {
    name: t("cash.expeditor_debt.invoice_created_date"),
    key: "debt_invoice",
    type: "object",
    innerType: "date",
    accessorKey: "debt_invoice.created_date",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("cash.expeditor_debt.invoice_id"),
    key: "debt_invoice",
    type: "object",
    accessorKey: "debt_invoice.visual_id",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("settings_sidebar.payment_method"),
    key: "currency",
    type: "object",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("column.product"),
    key: "product",
    type: "object",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("cash.expeditor_debt.current_debt"),
    key: "current_debt",
    type: "number",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("column.price"),
    key: "price",
    type: "number",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("cash.expeditor_debt.write_off_count"),
    key: "write_off_input",
    type: "input",
    checked: true,
    is_sortable: false,
  },
]);

// hooks
const filteredInvoices = computed<WriteOffAvailableInvoicesModel[]>(() => {
  let filtered = [...availableInvoices.value];

  // Search filter
  if (searchingValue.value.trim()) {
    const searchTerm = searchingValue.value.toLowerCase().trim();
    filtered = filtered.filter((invoice) => {
      const matches =
        invoice.debt_invoice.visual_id?.toLowerCase().includes(searchTerm) ||
        invoice.product.name?.toLowerCase().includes(searchTerm) ||
        invoice.currency.name?.toLowerCase().includes(searchTerm) ||
        invoice.price.toString().includes(searchTerm) ||
        invoice.debt_invoice.created_date.toLowerCase().includes(searchTerm) ||
        invoice.current_debt.toString().includes(searchTerm);
      return matches;
    });
  }

  // Product filter
  if (selectedProducts.value.length > 0) {
    filtered = filtered.filter((invoice) =>
      selectedProducts.value.includes(invoice.product.id)
    );
  }

  // Date range filter
  if (selectedDateRange.value?.fromDate && selectedDateRange.value?.toDate) {
    const { fromDate, toDate } = selectedDateRange.value;

    filtered = filtered.filter((invoice) => {
      try {
        const invoiceDate = moment(invoice.debt_invoice.created_date);
        const startDate = moment(fromDate).startOf("day");
        const endDate = moment(toDate).endOf("day");

        // Check if dates are valid
        if (
          !invoiceDate.isValid() ||
          !startDate.isValid() ||
          !endDate.isValid()
        ) {
          console.warn("Invalid date format:", {
            invoice: invoice.debt_invoice.created_date,
            from: fromDate,
            to: toDate,
          });
          return false;
        }

        return invoiceDate.isBetween(startDate, endDate, null, "[]");
      } catch (error) {
        console.error("Date filtering error:", error);
        return false;
      }
    });
  }

  return filtered;
});

const modalTitle = computed(() => {
  return (
    t("cash.expeditor_debt.write_off_debts_from_expeditor") +
      ": " +
      props.expeditor.name || ""
  );
});

const totalWritingOffSum = computed<number>(() => {
  return Object.keys(writeOffData.value).reduce((acc, key) => {
    const item = writeOffData.value[key];
    if (item.write_off_count > 0) {
      const invoice = availableInvoices.value.find((inv) => inv.id === key);
      if (invoice) {
        return acc + item.write_off_count * invoice.price;
      }
    }
    return acc;
  }, 0);
});

watch(
  [searchingValue, selectedProducts, selectedDateRange],
  () => {
    // Clear writeOffData for items that are no longer visible due to filtering
    const filteredIds = new Set(
      filteredInvoices.value.map((invoice) => invoice.id)
    );
    Object.keys(writeOffData.value).forEach((id) => {
      if (!filteredIds.has(id)) {
        delete writeOffData.value[id];
      }
    });
  },
  { deep: true }
);

const isFilterClearable = computed(() => {
  return !(
    searchingValue.value ||
    selectedProducts.value.length > 0 ||
    (selectedDateRange.value &&
      (selectedDateRange.value.fromDate || selectedDateRange.value.toDate))
  );
});

// methods
const closeDialog = () => {
  emit("close-dialog");
};

const getDataValue = (data: WriteOffAvailableInvoicesModel, key: string) => {
  return (data as any)[key];
};

const onChangeComment = (value: string) => {
  postData.value.comment = value;
};

const onClearFilter = () => {
  searchingValue.value = "";
  selectedDateRange.value = {} as DateRangeModel;
  selectedProducts.value = [];
  writeOffData.value = {};
  DatePickerComponent.value?.onReset();
  ProductDropdown.value?.onClearFilter();
};

const changeWriteOffCount = (
  data: WriteOffAvailableInvoicesModel,
  value: number
) => {
  const writeOffCount = value;

  writeOffData.value[data.id] = {
    product_id: data.product.id,
    write_off_count: writeOffCount,
    debt_invoice_id: data.debt_invoice.id,
  };
};

const setRecommendationWriteOffs = (
  recommendations: WriteOffRecomendationByCostModel["write_off_products"] | null
) => {
  if (recommendations) {
    const filteredRecommendations = recommendations.filter((item) =>
      filteredInvoices.value.some((invoice) => invoice.id === item.id)
    );
    writeOffData.value = {};
    filteredRecommendations.forEach((item) => {
      if (!writeOffData.value[item.id])
        writeOffData.value[item.id] = {} as WriteOffProductsCount;
      writeOffData.value[item.id].write_off_count =
        item.recommended_write_off_count;
    });
  } else {
    writeOffData.value = {};
  }
};

const preparePostData = () => {
  postData.value.write_off_products = Object.values(writeOffData.value).filter(
    (item) => item.write_off_count > 0
  );
  postData.value.amount = totalWritingOffSum.value;
};

const onSave = async () => {
  preparePostData();
  if (!postData.value.write_off_products.length) {
    notify({
      title: t("cash.expeditor_debt.required_min_write_off_amount_is_one"),
      type: "error",
    });
    return;
  }
  isSaveLoading.value = true;
  const res = await expeditorDebtStore.postWriteOff(postData.value);
  if (res !== "error") {
    closeDialog();
    notify({
      title: t("toast.saved"),
      type: "success",
    });
    expeditorDebtStore.refresh();
  }
  isSaveLoading.value = false;
};

const onOpenDropdown = async (key: string) => {
  if (key === "cashboxes" && !cashboxes.value) {
    await getCashboxes();
  } else if (key === "products" && !products.value) {
    await getProducts();
  } else if (key === "payment-methods" && !paymentMethods.value) {
    await getPaymentMethods();
  }
};

const onChangeCurrencyId = async (newCurrencyId: string) => {
  if (newCurrencyId) {
    postData.value.payment_method_id = "";
    paymentMethodParams.value.filter = [
      {
        field: "currency_id",
        value: [newCurrencyId],
      },
    ];
    await getAvailableInvoices(newCurrencyId);
    paymentMethods.value && (await getPaymentMethods());
  }
};

const getAvailableInvoices = async (currId: string) => {
  isTableLoading.value = true;
  availableInvoices.value =
    (await expeditorDebtStore.getAvailableInvoices(
      props.expeditor.id,
      currId
    )) || [];
  isTableLoading.value = false;
};

const getCashboxes = async () => {
  cashboxes.value = await expeditorDebtStore.getCashboxes(
    defaultDropdownParams
  );
};

const getProducts = async () => {
  products.value = await expeditorDebtStore.getProducts(dropdownParamsAll);
};

const getPaymentMethods = async () => {
  paymentMethods.value = await expeditorDebtStore.getPaymentMethods(
    paymentMethodParams.value
  );
};
<\/script>

<style lang="scss" scoped>
.footer-content-container {
  display: flex;
  flex-direction: column;
  justify-content: end;
  float: right;
  width: 70%;
  gap: 20px;
  .footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 22%));
    grid-gap: 20px;
    justify-content: end;
    grid-column-end: -1;
  }
}
</style>
`;export{e as default};
