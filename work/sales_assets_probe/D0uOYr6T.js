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
              <template
                v-for="item in props.data"
                :key="item?.debt_invoice?.id"
              >
                <c-tr class="last-border-b-0">
                  <c-td-no-edit v-for="key in productsHeaders" :key="key.key">
                    <div v-if="key.type === 'object'">
                      {{
                        key.accessorKey
                          ? getNestedValue(item, key.accessorKey)
                          : getObjectValue(item, key.key)?.name
                      }}
                    </div>
                    <div v-else-if="key.type === 'number'" class="text-end">
                      {{ getFormattedAmount(getObjectValue(item, key.key)) }}
                    </div>
                    <div v-else-if="key.key === 'writeOff'">
                      <template v-if="props.readonly">
                        <div class="text-end">
                          {{ getWriteOffProductCount(item) }}
                        </div>
                      </template>
                      <template v-else>
                        <d-input
                          type="number"
                          :max="item.current_debt"
                          :value="getWriteOffProductCount(item)"
                          class="w-fit justify-self-end"
                          @change="onChangeWriteOffCount(item, $event)"
                        />
                      </template>
                    </div>
                    <div v-else>
                      {{ getObjectValue(item, key.key) }}
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
import type { WriteOffPreviewModel } from "~/interfaces/api/invoices/shipping/write-off/preview-model";
import type { Template } from "~/interfaces/ui/template";
import { getFormattedAmount } from "~/utils/filter";
import { getNestedValue } from "~/utils/helpers";

// props
const props = defineProps<{
  data: WriteOffPreviewModel[];
  isLoading: boolean;
  readonly: boolean;
  expeditorId: string;
}>();

// emits
const emit = defineEmits<{
  (
    e: "summarize",
    payload: Array<{
      write_off_count: number;
      debt_invoice_id: string;
      product_id: string;
    }>
  ): void;
}>();

// states
const { t } = useI18n();

const writeOffProducts = reactive<
  Record<
    string,
    Array<{
      debt_invoice_id: string;
      product_id: string;
      write_off_count: number;
    }>
  >
>({});

const productsHeaders = ref<(Template & { accessorKey?: string })[]>([
  {
    name: t("invoices.invoice_id"),
    key: "debt_invoice",
    type: "object",
    accessorKey: "debt_invoice.visual_id",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("column.name"),
    key: "product",
    type: "object",
    accessorKey: "product.name",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("column.code"),
    key: "product",
    checked: true,
    type: "object",
    accessorKey: "product.code",
    is_sortable: false,
  },
  {
    name: t("cash.expeditor_debt.current_debt"),
    key: "current_debt",
    type: "number",
    checked: true,
    right: true,
    is_sortable: false,
  },
  {
    name: t("invoices.write_off.write_off"),
    key: "writeOff",
    checked: true,
    right: true,
    is_sortable: false,
  },
]);

const getWriteOffProductCount = (item: WriteOffPreviewModel) => {
  if (!writeOffProducts[props.expeditorId]) return null;

  const product = writeOffProducts[props.expeditorId].find(
    (product) =>
      product.debt_invoice_id === item.debt_invoice.id &&
      product.product_id === item.product.id
  );

  return product ? product.write_off_count : null;
};

const getObjectValue = (item: WriteOffPreviewModel, key: string) => {
  return item[key as keyof WriteOffPreviewModel];
};

// methods
const onChangeWriteOffCount = (
  item: WriteOffPreviewModel,
  newValue: number
) => {
  newValue ?? (newValue = 0);

  if (!writeOffProducts[props.expeditorId]) {
    writeOffProducts[props.expeditorId] = [];
  }

  const existProduct = writeOffProducts[props.expeditorId].find(
    (product) =>
      product.debt_invoice_id === item.debt_invoice.id &&
      product.product_id === item.product.id
  );

  if (existProduct) {
    existProduct.write_off_count = newValue;
  } else {
    writeOffProducts[props.expeditorId].push({
      debt_invoice_id: item.debt_invoice.id,
      product_id: item.product.id,
      write_off_count: newValue,
    });
  }
};

const onCreateInv = async () => {
  if (props.readonly) return;

  emit("summarize", writeOffProducts[props.expeditorId] || []);
};
<\/script>
`;export{e as default};
