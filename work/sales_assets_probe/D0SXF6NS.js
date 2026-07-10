const e=`<template>
  <d-modal
    :name="t('invoices.details')"
    @close-dialog="closeDialog"
    data-container-width="80%"
    :loading="isLoading"
  >
    <div class="table-content-container">
      <div class="table-content-header">
        <div class="flex items-center gap-3">
          <div>{{ t("invoices.invoice_id") }}:</div>
          <div v-for="(invoice, index) in invoices" :key="invoice.id">
            <div class="inline">
              {{ invoice.visual_id }} -
              <status-btn-for-table
                :status-data="invoice.status"
                :data-id="invoice.id"
                readonly
              />
              <span v-show="index !== invoices.length - 1"> , </span>
            </div>
          </div>
        </div>
      </div>
      <div class="table-content-body">
        <data-table
          :headers="headers"
          :loading="isLoading"
          :is-empty="!details?.products?.length"
        >
          <template #body>
            <template v-for="data in details?.products" :key="data.id">
              <c-tr class="border-b-0">
                <c-td-no-edit
                  v-for="header in headers"
                  :key="header.key"
                  class="border-x first-border-l-none last-border-r-none"
                >
                  <div v-if="header?.isDynamic">
                    <div
                      v-for="collector in data.collector_counts"
                      :key="collector.collector.id"
                    >
                      <div v-if="!collector"></div>
                      <div v-else-if="header.key === collector.collector.id">
                        {{ collector.count }}
                      </div>
                    </div>
                  </div>
                  <div v-else>
                    {{ data[header.key] }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </template>
        </data-table>
      </div>
    </div>
    <template #footer>
      <m-btn
        v-if="isSetCheckedBtnShowable"
        :loading="isSetCheckedLoading"
        class="justify-self-end"
        @click="setCheckedAll"
      >
        {{ t("invoices.all_invoices_checked") }}
      </m-btn>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { Template } from "~/interfaces/ui/template";
import type {
  CollectorCountsModel,
  InvoicesDetails,
  ProductsModel,
} from "~/interfaces/api/invoices/assembly/details-model";
import { useAssemblyAccess } from "~/composables/access/invoices/assembly-access";
import type { IdNameModel } from "~/interfaces/api/IdNameModel";

// props
const props = defineProps<{
  ids: string[];
}>();

// emits
const emit = defineEmits(["closeDialog", "setChecked"]);

// store
const invoicesStore = useInvoicesStore("main");

// states
const { t } = useI18n();
const { hasAccess2Check } = useAssemblyAccess();
const details = ref<InvoicesDetails>();
const isLoading = ref(false);
const isSetCheckedLoading = ref(false);

// hooks
const invoices = computed(() => details.value?.invoices || []);

const collectors = computed(() => {
  const products = details.value?.products || [];
  const allCollectors = extractCollectors(products);
  return getUniqueCollectors(allCollectors);
});

const isSetCheckedBtnShowable = computed(() => {
  if (!hasAccess2Check.value) return false;

  const hasUncheckedInvoice = invoices.value.some(
    (inv) => inv.status.id !== invoicesStore.StatusIds.checked
  );

  const isAllCollected = invoices.value.every(
    (inv) => inv.status.id === invoicesStore.StatusIds.collected
  );

  return hasUncheckedInvoice && isAllCollected;
});

const headers = computed<Array<Template & { isDynamic?: boolean }>>(() => {
  let headers = [
    {
      name: t("invoices.product"),
      key: "name",
      checked: true,
      borderX: true,
      is_sortable: false,
    },
    {
      name: t("column.code"),
      key: "code",
      checked: true,
      borderX: true,
      is_sortable: false,
    },
    {
      name: t("settings.count"),
      key: "count",
      checked: true,
      is_sortable: false,
    },
  ];

  if (collectors.value?.length) {
    headers = [
      ...headers,
      ...collectors.value.map((collector) => {
        return {
          name: collector.name,
          key: collector.id,
          checked: true,
          is_sortable: false,
          isDynamic: true,
        };
      }),
    ];
  }

  return headers;
});

onMounted(async () => {
  isLoading.value = true;
  await getDetails();
  isLoading.value = false;
});

// methods
const getUniqueCollectors = (collectors: IdNameModel[]) => {
  return collectors.filter(
    (collector, index, self) =>
      index === self.findIndex((c) => c.id === collector.id)
  );
};

const extractCollectors = (products: ProductsModel[]) => {
  return products.flatMap(
    (product) =>
      product.collector_counts
        ?.map((c: CollectorCountsModel) => c.collector)
        .filter(Boolean) || []
  );
};

const closeDialog = () => {
  emit("closeDialog");
};

const getDetails = async () => {
  const response = await invoicesStore.getDetails(props.ids);
  if (typeof response !== "string" && response) {
    details.value = response;
  }
};

const setCheckedAll = async () => {
  isSetCheckedLoading.value = true;
  const invoicesIds = invoices.value.map((inv) => inv.id);
  await invoicesStore.setChecked(invoicesIds);
  await getDetails();
  isSetCheckedLoading.value = false;
  emit("setChecked", invoicesIds);
};
<\/script>

<style scoped lang="scss">
.table-content-container {
  overflow: hidden;

  .table-content-body {
    padding-bottom: 0 !important;
  }
}
</style>
`;export{e as default};
