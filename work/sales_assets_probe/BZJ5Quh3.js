const e=`<template>
  <d-modal
    :name="dialogName"
    :loading="isLoading"
    @close-dialog="closeDialog"
    data-container-width="850px"
  >
    <flex-col class="items-center gap-5">
      <div class="w-full flex gap-4">
        <flex-col class="w-1/2">
          <div
            v-for="(value, key) in mainDetails"
            :key="key"
            class="w-full border-b last-border-b-0"
          >
            <div
              v-if="value && key !== 'invoices.warehouse_blocks'"
              class="flex items-center justify-between py-2"
            >
              <div>{{ t(key) }}</div>
              <div v-if="key === 'column.type' || key === 'column.status'">
                <status-btn-for-table :status-data="value" readonly />
              </div>
              <div
                v-else-if="key === 'column.visual_id'"
                class="flex items-center gap-2 flex-wrap"
              >
                <div
                  v-for="(item, index) in mainDetails['column.visual_id']"
                  :key="item.id"
                  class="flex items-center cursor-pointer relative group mr-1"
                >
                  <tooltip :tooltip="item?.type?.name" position="top">
                    <LinkComponent
                      :to="{
                        path: '/orders/orders/details',
                        query: { id: item.id, type: item.type.id },
                      }"
                      :style="{ color: item.type.hex_color }"
                    >
                      {{ item.visual_id }}
                    </LinkComponent>
                  </tooltip>
                  <span
                    v-show="index < mainDetails['column.visual_id'].length - 1"
                    >,</span
                  >
                </div>
              </div>
              <div v-else>
                {{ value }}
              </div>
            </div>
            <div
              v-else-if="
                key === 'invoices.warehouse_blocks' && value?.length > 0
              "
              class="flex items-center justify-between py-2"
            >
              <div>{{ t(key) }}</div>
              <show-more :data="value" />
            </div>
          </div>
        </flex-col>
        <flex-col class="w-1/2 gap-4">
          <div>
            <div
              v-for="(value, key) in confirmationDetails"
              :key="key"
              class="w-full border-b last-border-b-0"
            >
              <div v-if="value" class="flex items-center justify-between py-2">
                <div>{{ t(key) }}</div>
                <div>{{ value }}</div>
              </div>
            </div>
          </div>
          <div class="table-content-container">
            <data-table
              :headers="confirmHeaders"
              :loading="isLoading"
              :is-empty="!detail?.confirmation_request.confirmations?.length"
              with-information-above-header
            >
              <template #body>
                <template
                  v-for="data in detail?.confirmation_request.confirmations"
                  :key="data.id"
                >
                  <c-tr class="last-border-b-0">
                    <c-td-no-edit
                      v-for="key in confirmHeaders"
                      :key="key.key"
                      :type="key.type"
                      :is-checked="key.checked"
                    >
                      <div v-if="key.key === 'confirmed_date'">
                        {{ getFormattedDate(data[key.key]) }}
                      </div>
                      <div v-else-if="key.key === 'user_name'">
                        {{ data.user?.name }}
                      </div>
                      <div v-else-if="key.key === 'user_code'">
                        {{ data.user?.code }}
                      </div>
                    </c-td-no-edit>
                  </c-tr>
                </template>
              </template>
            </data-table>
          </div>
        </flex-col>
      </div>
      <div class="w-full table-content-container">
        <data-table
          :headers="productsHeaders"
          :loading="isLoading"
          :is-empty="!detail?.invoice_categories?.length"
          with-information-above-header
        >
          <template #body>
            <template
              v-for="(data, index) in detail?.invoice_categories"
              :key="data.category_name"
            >
              <c-tr class="last-border-b-0">
                <c-td-no-edit
                  v-for="key in productsHeaders"
                  :key="key.key"
                  :type="key.type"
                  :is-checked="key.checked"
                >
                  <div
                    v-if="key.key === 'name'"
                    @click="toggleExpand(data.category_name + index)"
                    class="flex items-center gap-1 cursor-pointer"
                  >
                    <IconArrowRighti
                      class="transition-transform"
                      :class="
                        isCategoryExpanded(data.category_name + index)
                          ? 'rotate-90'
                          : 'rotate-0'
                      "
                    />
                    {{ data.category_name }}
                  </div>
                  <div v-else-if="key.key === 'count'" class="text-end">
                    {{ getTotalProductsCount(data.products) }}
                  </div>
                </c-td-no-edit>
              </c-tr>
              <template v-if="isCategoryExpanded(data.category_name + index)">
                <c-tr
                  v-for="product in data.products"
                  :key="product.product_name"
                  class="last-border-b-0"
                >
                  <c-td-no-edit
                    v-for="key in productsHeaders"
                    :key="key.key"
                    :type="key.type"
                    :is-checked="key.checked"
                    :right="key.right"
                  >
                    <div v-if="key.key === 'name'" class="pl-12">
                      {{ product.product_name }}
                    </div>
                    <div
                      v-else
                      :class="{ 'text-end': isNumType(product[key.key]) }"
                    >
                      {{ product[key.key] }}
                    </div>
                  </c-td-no-edit>
                </c-tr>
              </template>
            </template>
          </template>
        </data-table>
      </div>
    </flex-col>
  </d-modal>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { ShippingInvoiceDetailModel } from "~/interfaces/api/invoices/shipping/shipping-invoice-detail-model";
import type { ShippingInvoiceListModel } from "~/interfaces/api/invoices/shipping/shipping-invoice-list-model";
import type { Template } from "~/interfaces/ui/template";

// props
const props = defineProps<{
  id: string;
  type?: "return";
}>();

// emits
const emit = defineEmits(["closeDialog"]);

// stores
const shippingInvoiceStore = useShippingInvoicesStore("main");
const returnInvoiceStore = useReturnInvoicesStore("main");

// states
const { t } = useI18n();
const detail = ref<ShippingInvoiceDetailModel>();
const isLoading = ref(false);
const expandedCategories = ref<string[]>([]);

const productsHeaders = ref<Template[]>([
  {
    name: t("column.name"),
    key: "name",
    is_sortable: false,
    checked: true,
  },
  {
    name: t("column.code"),
    key: "product_code",
    is_sortable: false,
    checked: true,
  },
  {
    name: t("settings.count"),
    key: "count",
    is_sortable: false,
    checked: true,
    right: true,
  },
]);

const confirmHeaders = ref<Template[]>([
  {
    name: t("invoices.confirmed_date"),
    key: "confirmed_date",
    is_sortable: false,
    checked: true,
  },
  {
    name: t("invoices.confirmed_by"),
    key: "user_name",
    is_sortable: false,
    checked: true,
  },
  {
    name: t("invoices.user_code"),
    key: "user_code",
    is_sortable: false,
    checked: true,
  },
]);

// hooks
const dialogName = computed(() => {
  const store =
    props.type === "return" ? returnInvoiceStore : shippingInvoiceStore;
  const visualId = store.data?.items.find(
    (item: ShippingInvoiceListModel) => item.id === props.id
  )?.visual_id;

  return t("invoices.details") + \`: \${visualId || ""}\`;
});

const mainDetails = computed(() => ({
  "invoices.id": detail.value?.visual_id,
  "filters.expeditor": detail.value?.expeditor_name,
  "column.shipped_date": getFormattedDate(
    detail.value?.shipping_date,
    "DD.MM.YYYY HH:mm"
  ),
  "invoices.confirmed_shipped_date": getFormattedDate(
    detail.value?.confirmed_shipping_date,
    "DD.MM.YYYY HH:mm"
  ),
  "warehouse.warehouse": detail.value?.warehouse_name,
  "column.status": detail.value?.status,
  "column.type": detail.value?.type,
  "invoices.warehouse_blocks": detail.value?.warehouse_blocks?.map(
    (item) => item.name
  ),
  "column.visual_id": detail.value
    ?.invoice_orders as ShippingInvoiceDetailModel["invoice_orders"],
}));

const confirmationDetails = computed(() => ({
  "invoices.expeditor_confirmation": detail.value?.confirmation_request
    ?.is_expeditor_confirmation_required
    ? t("filters.yes")
    : t("filters.no"),
  "invoices.warehouseman_confirmation": detail.value?.confirmation_request
    ?.is_warehouseman_confirmation_required
    ? t("filters.yes")
    : t("filters.no"),
  "invoices.operator_confirmation": detail.value?.confirmation_request
    ?.is_operator_confirmation_required
    ? t("filters.yes")
    : t("filters.no"),
  "invoices.confirmed_date": getFormattedDate(
    detail.value?.confirmed_date,
    "DD.MM.YYYY HH:mm"
  ),
}));

onMounted(async () => {
  isLoading.value = true;
  await getDetail();
  isLoading.value = false;
  expandAllCategories();
});

// methods
const toggleExpand = (id: string) => {
  if (isCategoryExpanded(id)) {
    expandedCategories.value = expandedCategories.value.filter(
      (item) => item !== id
    );
  } else {
    expandedCategories.value.push(id);
  }
};

const isCategoryExpanded = (id: string) => {
  return expandedCategories.value.includes(id);
};

const expandAllCategories = () => {
  expandedCategories.value =
    detail.value?.invoice_categories.map(
      (item, index) => item.category_name + index
    ) ?? [];
};

const closeDialog = () => {
  emit("closeDialog");
};

const handleError = () => {
  notify({
    type: "error",
    title: t("toast.error"),
  });
  closeDialog();
};

const isNumType = (value: unknown) => {
  return typeof value === "number";
};

const getTotalProductsCount = (
  products: ShippingInvoiceDetailModel["invoice_categories"][0]["products"]
) => {
  const totalAmount = products.reduce((acc, item) => acc + item.count, 0);
  return getFormattedAmount(totalAmount);
};

const getDetail = async () => {
  const res =
    props.type === "return"
      ? await returnInvoiceStore.getDetail(props.id)
      : await shippingInvoiceStore.getDetail(props.id);
  if (res === "error") {
    handleError();
    return;
  }
  detail.value = res as ShippingInvoiceDetailModel;
};
<\/script>

<style scoped>
.table-content-container {
  overflow: hidden;
  padding: 0;
}
</style>
`;export{e as default};
