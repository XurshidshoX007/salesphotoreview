const e=`<template>
  <form @submit.prevent="onCreateInv" class="w-full">
    <rounded-white-container class="page-gap">
      <!-- Products -->
      <flex-col class="gap-2">
        <page-title-20
          :title="t('invoices.return.returning_products_expeditor')"
        />
        <div class="table-content-container overflow-auto">
          <data-table
            with-information-above-header
            :headers="productsHeaders"
            :loading="isLoading"
            :is-empty="!data?.length"
            class="rounded-lg"
          >
            <template #body>
              <template v-for="item in currentData" :key="item.id">
                <c-tr class="last-border-b-0">
                  <c-td-no-edit v-for="key in productsHeaders" :key="key.key">
                    <div
                      v-if="key.key === 'name'"
                      class="flex items-center gap-1 cursor-pointer w-fit"
                      @click="toggleExpand(item.id)"
                    >
                      <IconArrowRighti
                        class="transition-transform"
                        :class="
                          isItemExpanded(item.id) ? 'rotate-90' : 'rotate-0'
                        "
                      />
                      {{ item.name }}
                    </div>
                    <div v-else-if="key.key === 'count'" class="text-end">
                      {{ getTotalProductsCount(item.products) }}
                    </div>
                    <div v-else-if="key.key === 'confirmed'" class="text-end">
                      {{ getTotalProductsConfirmed(item.products) }}
                    </div>
                  </c-td-no-edit>
                </c-tr>
                <template v-if="isItemExpanded(item.id)">
                  <c-tr
                    v-for="product in item.products"
                    :key="product.id"
                    class="last-border-b-0"
                  >
                    <c-td-no-edit
                      v-for="key in productsHeaders"
                      :key="key.key"
                      :type="key.type"
                      :is-checked="key.checked"
                      :right="key.right"
                    >
                      <div v-if="key.key === 'confirmed'">
                        <div v-if="props.readonly" class="text-end">
                          {{ product.confirmed }}
                        </div>
                        <d-input
                          v-else
                          type="number"
                          :max="product.count"
                          :value="product.confirmed"
                          class="w-fit justify-self-end"
                          @change="onChangeConfirmedCount(product, $event)"
                        />
                      </div>
                      <div
                        v-else-if="isNumType(product[key.key])"
                        class="text-end"
                      >
                        {{ getFormattedAmount(product[key.key]) }}
                        {{ key.key === "price" ? product.currency.code : "" }}
                      </div>
                      <div
                        v-else
                        :class="{
                          'pl-12': key.key === 'name',
                        }"
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

      <!-- Debt products -->
      <flex-col v-if="debtProducts.length" class="gap-2">
        <page-title-20
          :title="t('invoices.return.product_debts_expeditor')"
          class="text-red-3"
        />
        <div class="table-content-container overflow-auto">
          <data-table with-information-above-header :headers="debtHeaders">
            <template #body>
              <template v-for="item in debtProducts" :key="item.id">
                <c-tr class="last-border-b-0">
                  <c-td-no-edit v-for="key in debtHeaders" :key="key.key">
                    <div v-if="key.key === 'name'">
                      {{ item.product_name }}
                    </div>
                    <div v-else-if="key.key === 'debt'" class="text-end">
                      {{ item.debt }}
                    </div>
                  </c-td-no-edit>
                </c-tr>
              </template>
            </template>
          </data-table>
        </div>
      </flex-col>
    </rounded-white-container>
    <m-btn
      v-show="!props.readonly"
      type="submit"
      class="justify-self-end mt-3"
      >{{ t("invoices.return.generate") }}</m-btn
    >
  </form>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { PreviewModel } from "~/interfaces/api/invoices/shipping/return/preiview-model";
import type { Template } from "~/interfaces/ui/template";

// types
type DebtProductType = {
  product_id: string;
  product_name: string;
  debt: number;
  price: number;
  currency_id: string;
};

type ModifiedProductType =
  PreviewModel["returning_product_categories"][0]["products"][0] & {
    confirmed: number;
  };

type ModifiedDataType = PreviewModel["returning_product_categories"][0] & {
  products: ModifiedProductType[];
};

// props
const props = defineProps<{
  data: PreviewModel["returning_product_categories"] | undefined;
  isLoading: boolean;
  readonly: boolean;
  expeditorId: string;
}>();

// emits
const emit = defineEmits(["summarize"]);

// states
const { t } = useI18n();
const modifiedData = ref<Record<string, ModifiedDataType[]>>({});
const expandedItems = ref(new Set<string>());
const debtProducts = ref<Array<DebtProductType>>([]);

const productsHeaders = ref<Template[]>([
  {
    name: t("column.name"),
    key: "name",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("column.price"),
    key: "price",
    checked: true,
    right: true,
    is_sortable: false,
  },
  {
    name: t("invoices.return.count"),
    key: "count",
    checked: true,
    right: true,
    is_sortable: false,
  },
  {
    name: t("invoices.return.confirmed"),
    key: "confirmed",
    checked: true,
    right: true,
    is_sortable: false,
  },
]);

const debtHeaders = ref<Template[]>([
  {
    name: t("column.name"),
    key: "name",
    is_sortable: false,
    checked: true,
  },
  {
    name: t("column.debt"),
    key: "debt",
    is_sortable: false,
    checked: true,
    right: true,
  },
]);

// hooks
watch(
  () => props.data,
  () => {
    expandAllItems();
    updateModifiedData();
    props.readonly ? updateDebtProducts() : setEmptyDebtProducts();
  }
);

const expeditorId = computed(() => props.expeditorId);

const currentData = computed(() => modifiedData.value[expeditorId.value]);

// methods
const updateModifiedData = () => {
  if (modifiedData.value[expeditorId.value]) return;

  modifiedData.value[expeditorId.value] = props.data?.map((item) => ({
    ...item,
    products: item.products.map((product) => ({
      ...product,
      confirmed: product.count,
    })),
  })) as ModifiedDataType[];
};

const setEmptyDebtProducts = () => {
  debtProducts.value = [];
};

const toggleExpand = (id: string) => {
  if (expandedItems.value.has(id)) {
    expandedItems.value.delete(id);
  } else {
    expandedItems.value.add(id);
  }
};

const isItemExpanded = (id: string) => expandedItems.value.has(id);

const expandAllItems = () => {
  expandedItems.value = new Set(props.data?.map((item) => item.id) ?? []);
};

const isNumType = (value: unknown) => {
  return typeof value === "number";
};

const getTotalProductsCount = (products: ModifiedProductType[]) => {
  const totalAmount = products?.reduce((acc, item) => acc + item.count, 0);
  return getFormattedAmount(totalAmount);
};

const getTotalProductsConfirmed = (products: ModifiedProductType[]) => {
  const totalAmount = products?.reduce((acc, item) => acc + item.confirmed, 0);
  return getFormattedAmount(totalAmount);
};

const onChangeConfirmedCount = (
  product: ModifiedProductType,
  newValue: number
) => {
  newValue ?? (newValue = 0);
  product.confirmed = newValue;
  updateDebtProducts();
};

const updateDebtProducts = () => {
  debtProducts.value =
    modifiedData.value[expeditorId.value].reduce(
      (acc, item: ModifiedDataType) => {
        const products = item.products.filter(
          (product: ModifiedProductType) => product.count > product.confirmed
        );
        return acc.concat(
          products.map((product) => ({
            product_name: product.name,
            product_id: product.id,
            debt: product.count - product.confirmed,
            price: product.price,
            currency_id: product.currency.id,
          }))
        );
      },
      [] as DebtProductType[]
    ) ?? [];
};

const onCreateInv = async () => {
  if (props.readonly) return;
  const productsPayload = modifiedData.value[expeditorId.value]?.flatMap(
    (item: ModifiedDataType) =>
      item.products.map((product: ModifiedProductType) => ({
        id: product.id,
        count: product.confirmed,
      }))
  );

  const debtProductsPayload = debtProducts.value.map((item) => ({
    product_id: item.product_id,
    debt: item.debt,
    price: item.price,
    currency_id: item.currency_id,
  }));

  emit("summarize", {
    products: productsPayload,
    debtProducts: debtProductsPayload,
  });
};
<\/script>
`;export{e as default};
