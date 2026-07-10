const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header justify-between">
      <div class="table-content-btn-group">
        <table-sort-columns
          :save-key="orderRefundHeader"
          :templates="createOrdersStore.headersForOrderRefundTable"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="createOrdersStore.headersForOrderRefundTable"
        />
        <page-size-btn
          :current-size="createOrdersStore.paramsForOrderRefund.page_size"
          :total-count="createOrdersStore.data?.total_count"
          :page-number="createOrdersStore.data?.page_number"
          @setPageSize="createOrdersStore.setPageSizeForOrderRefund"
        />
        <search-input
          @change="createOrdersStore.searchForOrderRefund"
          :value="createOrdersStore.paramsForOrderRefund.search"
        />
        <excel-btn />
        <RefreshBtn
          @click="createOrdersStore.refreshForOrderRefund"
          :loading="createOrdersStore.isLoading"
        />
      </div>
    </div>
    <div class="table-content-body">
      <data-table
        :headers="createOrdersStore.headersForOrderRefundTable"
        :loading="createOrdersStore.isLoading"
        :isEmpty="!createOrdersStore.dataOrderRefund?.items?.length"
        :sorted="createOrdersStore.paramsForOrderRefund.order_by"
        @sort="createOrdersStore.sortDataForRefund"
      >
        <template #body>
          <template
            v-for="data in createOrdersStore?.dataOrderRefund?.items"
            :key="data.id"
          >
            <c-tr
              class="cursor-pointer"
              :class="checkOrderProductAvailableCount(data.id) && 'opacity-50'"
              @click="onSelectOrder(data.id)"
            >
              <c-td-no-edit
                v-for="key in createOrdersStore.headersForOrderRefundTable"
                :key="key.key"
                :header-key="key.key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.type === 'date'">
                  {{ getFormattedDate(data[key.key], "DD.MM.YYYY HH:mm") }}
                </div>

                <div v-else-if="key.key === 'products'">
                  <div class="text-nowrap">
                    <table>
                      <tbody>
                        <template
                          v-for="product in getTemplateData(data[key.key])"
                        >
                          <tr>
                            <td class="w-100 pr-2">
                              {{ product.name }}
                            </td>
                            <td class="px-2 fw-6">
                              <div
                                v-tooltip="{
                                  text: t('settings.count'),
                                  placement: 'top',
                                }"
                                style="float: right"
                              >
                                {{ product.count }}
                              </div>
                            </td>
                            <td style="color: #8fa0a0" class="px-2 fw-6">
                              <div
                                v-tooltip="{
                                  text: t('column.available_count_for_return'),
                                  placement: 'top',
                                  nowrap: true,
                                }"
                                style="float: right"
                              >
                                {{ product.available_count_for_return }}
                              </div>
                            </td>
                          </tr>
                        </template>
                      </tbody>
                    </table>
                  </div>
                  <transition
                    :name="getToggleAccordionName(data[key.key]?.length)"
                  >
                    <div
                      v-if="getProductsData(data)?.length > 0"
                      class="text-nowrap"
                    >
                      <table>
                        <tbody>
                          <template v-for="product in getProductsData(data)">
                            <tr>
                              <td class="w-100 pr-2">
                                {{ product.name }}
                              </td>
                              <td class="px-2 fw-6">
                                <tooltip
                                  position="top"
                                  :tooltip="t('settings.count')"
                                  style="float: right"
                                >
                                  {{ product.count }}
                                </tooltip>
                              </td>
                              <td style="color: #8fa0a0" class="px-2 fw-6">
                                <tooltip
                                  nowrap
                                  position="top"
                                  :tooltip="
                                    t('column.available_count_for_return')
                                  "
                                  style="float: right"
                                >
                                  {{ product.available_count_for_return }}
                                </tooltip>
                              </td>
                            </tr>
                          </template>
                        </tbody>
                      </table>
                    </div>
                  </transition>
                  <div
                    v-if="data[key.key]?.length > 15"
                    class="text-primary-600 flex gap-x-2 items-center"
                    @click.stop="toggleProducts(data?.show_more, data.id)"
                  >
                    <IconArrowBottom
                      class="cursor-pointer"
                      :class="[
                        (data?.show_more && 'rotate-180 transition-all') ||
                          'rotate-0 transition-all',
                      ]"
                    />
                    <span v-if="!data?.show_more"
                      >{{ t("orders.show_more") }}
                      {{ data[key.key]?.length - 15 }}</span
                    >
                    <span v-else>{{ t("orders.close") }}</span>
                  </div>
                </div>

                <div v-else-if="key.type === 'boolean'">
                  {{ data[key.key] ? "Есть" : "Нет" }}
                </div>

                <div v-else>
                  {{ data[key.key] }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="createOrdersStore.paramsForOrderRefund.page_size"
        :total-count="createOrdersStore.dataOrderRefund?.total_count"
        :page-number="createOrdersStore.dataOrderRefund?.page_number"
      />
      <page-index
        :available-pages="createOrdersStore.dataOrderRefund?.total_pages"
        :current-page="createOrdersStore.dataOrderRefund?.page_number"
        @setPage="createOrdersStore.setPageForOrderRefund"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { useI18n } from "vue-i18n";
import { getFormattedDate } from "~/utils/formatters";
import type { ProductsModel } from "~/interfaces/api/settings/products-model";
import { orderRefundHeader } from "~/variable/column-constants";

// store
const createOrdersStore = useCreateOrdersStore("main");
// emits
const emit = defineEmits(["onSelectItemId", "closeDialog"]);
//props
const props = defineProps({
  isWithClient: Boolean,
});
// State
const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const queryKey = computed(() => {
  const keys = Object.keys(route.query);
  return keys[0];
});

// methods

const checkOrderProductAvailableCount = (orderId: string) => {
  const checkOrder = createOrdersStore.dataOrderRefund?.items?.find(
    (item) => item.id === orderId,
  );
  const totAvailableCount = checkOrder?.products?.reduce(
    (a, b) => a + b.available_count_for_return,
    0,
  );
  return totAvailableCount === 0;
};

function onSelectOrder(orderId: string) {
  if (queryKey.value !== "refundable-order") {
    emit("onSelectItemId", orderId);
  } else if (props.isWithClient && route.query["refundable-order"]) {
    emit("onSelectItemId", orderId);
  } else {
    const queryKey = Object.keys(route.query)?.join("");

    if (route.query[queryKey]) {
      return;
    } else {
      router.push({
        path: "/orders/create-orders/creating-orders-refund",
        query: { [queryKey]: orderId },
      });
    }
    emit("closeDialog");
  }
}

const onChangeTableHeaders = (newHeaders: Template[]) => {
  createOrdersStore.headersForOrderRefundTable = newHeaders;
};

const getProductsData = (data: ProductsModel[]) => {
  return data?.show_more ? data.products?.slice(15) : [];
};

const toggleProducts = (showMore: boolean, orderId: string) => {
  const checkOrder = createOrdersStore.dataOrderRefund?.items?.find(
    (item) => item.id === orderId,
  );
  checkOrder.show_more = !showMore;
};

const getToggleAccordionName = (dataCount: number) => {
  if (dataCount < 25) {
    return "toggle-accordion-100";
  } else if (dataCount < 35) {
    return "toggle-accordion-200";
  } else if (dataCount < 45) {
    return "toggle-accordion-300";
  } else {
    return "toggle-accordion";
  }
};

const getTemplateData = (data: ProductsModel[]) => {
  return data?.slice(0, 15);
};
<\/script>
`;export{e as default};
