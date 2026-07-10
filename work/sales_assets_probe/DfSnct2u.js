const n=`<template>
  <div class="request-automation-details-dialog">
    <d-modal
      dataContainerWidth="1000px"
      :name="dialogTitle"
      :loading="isLoading"
      only-close-dialog
      @closeDialog="closeDialog"
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-10">
        <!-- Left column -->
        <div>
          <flex-row class="justify-between items-center border-b py-3">
            <span class="text-sm text-neutral-600">{{ t("column.name") }}</span>
            <Tag variant="outlined" color="gray" size="large">
              {{ detail?.name || "-" }}
            </Tag>
          </flex-row>

          <flex-row class="justify-between items-center border-b py-3">
            <span class="text-sm text-neutral-600">{{
              t("settings_sidebar.territory")
            }}</span>
            <ShowMore
              v-if="detail?.territory_names?.length"
              :data="detail.territory_names"
              :show-count="2"
              size="large"
              color="white"
            />
            <Tag
              v-else
              class="px-4"
              variant="outlined"
              color="gray"
              size="large"
            >
              -
            </Tag>
          </flex-row>

          <flex-row class="justify-between items-center border-b py-3">
            <span class="text-sm text-neutral-600">{{
              t("sidebar.warehouse")
            }}</span>
            <ShowMore
              v-if="detail?.warehouse_names?.length"
              :data="detail?.warehouse_names"
              :show-count="2"
              size="large"
              color="white"
            />
            <Tag
              v-else
              class="px-4"
              variant="outlined"
              color="gray"
              size="large"
            >
              -
            </Tag>
          </flex-row>

          <flex-row class="justify-between items-center border-b py-3">
            <span class="text-sm text-neutral-600">{{
              t("settings_sidebar.trade_direction")
            }}</span>
            <ShowMore
              v-if="detail?.trade_direction_names?.length"
              :data="detail?.trade_direction_names"
              :show-count="2"
              size="large"
              color="white"
            />
            <Tag
              v-else
              class="px-4"
              variant="outlined"
              color="gray"
              size="large"
            >
              -
            </Tag>
          </flex-row>

          <flex-row class="justify-between items-center border-b py-3">
            <span class="text-sm text-neutral-600">{{
              t("users.agents.agent")
            }}</span>

            <ShowMore
              v-if="detail?.agents?.length"
              :data="detail.agents"
              :show-count="3"
              group="avatar"
            />
          </flex-row>

          <flex-row class="justify-between items-center border-b py-3">
            <span class="text-sm text-neutral-600">{{
              t("column.amount_from")
            }}</span>
            <Tag
              v-if="detail?.amount_from"
              variant="outlined"
              color="gray"
              size="large"
            >
              {{ getFormattedAmount(detail.amount_from) }}
              {{ detail?.base_currency_name }}
            </Tag>
          </flex-row>

          <flex-row class="justify-between items-center border-b py-3">
            <span class="text-sm text-neutral-600">{{
              t("column.amount_to")
            }}</span>
            <Tag
              v-if="detail?.amount_to"
              variant="outlined"
              color="gray"
              size="large"
            >
              {{ getFormattedAmount(detail.amount_to) }}
              {{ detail?.base_currency_name }}
            </Tag>
          </flex-row>

          <div class="my-3">
            <Switch :active="detail?.is_active" :disabled="true" />
          </div>
        </div>

        <!-- Right column -->
        <div>
          <flex-row class="justify-between items-center border-b py-3">
            <span class="text-sm text-neutral-600">{{
              t("settings_sidebar.payment_method")
            }}</span>
            <div>
              <ShowMore
                v-if="detail?.currency_names?.length"
                :data="detail.currency_names"
                :show-count="2"
                size="large"
                color="white"
              />
              <Tag
                v-else
                class="px-4"
                variant="outlined"
                color="gray"
                size="large"
              >
                -
              </Tag>
            </div>
          </flex-row>

          <flex-row class="justify-between items-center border-b py-3">
            <span class="text-sm text-neutral-600">{{
              t("column.consignation")
            }}</span>
            <Tag variant="outlined" color="gray" size="large">
              {{
                typeof detail?.for_consignation === "boolean"
                  ? detail?.for_consignation
                    ? t("yes")
                    : t("no")
                  : t("filters.all")
              }}
            </Tag>
          </flex-row>

          <flex-row class="justify-between items-center border-b py-3">
            <span class="text-sm text-neutral-600">{{
              t("orders.request_automation.order_type")
            }}</span>
            <ShowMore
              v-if="detail?.order_type_names.length"
              :data="detail?.order_type_names"
              :show-count="2"
              size="large"
              color="white"
            />
            <Tag
              v-else
              class="px-4"
              variant="outlined"
              color="gray"
              size="large"
            >
              -
            </Tag>
          </flex-row>

          <flex-row class="justify-between items-center border-b py-3">
            <span class="text-sm text-neutral-600">{{
              t("orders.request_automation.order_source")
            }}</span>
            <ShowMore
              v-if="detail?.client_platform_names.length"
              :data="detail?.client_platform_names"
              :show-count="2"
              size="large"
              color="white"
            />
            <Tag
              v-else
              class="px-4"
              variant="outlined"
              color="gray"
              size="large"
            >
              -
            </Tag>
          </flex-row>

          <flex-row class="justify-between items-center border-b py-3">
            <span class="text-sm text-neutral-600">{{
              t("column.comment")
            }}</span>
            <Tag variant="outlined" color="gray" size="large">{{
              detail?.description || "-"
            }}</Tag>
          </flex-row>

          <div class="bg-neutral-100 rounded-xl mt-3 p-4">
            <div class="text-base text-neutral-950 font-medium mb-1">
              {{ t("orders.request_automation.expected_shipping_date") }}
            </div>

            <flex-row
              class="justify-between items-center border-b py-2.5 flex-wrap"
            >
              <span class="text-sm text-neutral-600">{{
                t("orders.request_automation.execution_type")
              }}</span>
              <Tag variant="outlined" color="gray" size="large">
                {{ expectedShippingDateCalculationTypeName || "-" }}
              </Tag>
            </flex-row>

            <flex-row class="justify-between items-center pt-2.5">
              <span class="text-sm text-neutral-600">{{
                t("orders.request_automation.exact_time")
              }}</span>
              <Tag variant="outlined" color="gray" size="large">
                {{ detail?.exact_time || "-" }}
              </Tag>
            </flex-row>
          </div>
        </div>
      </div>
    </d-modal>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getFormattedAmount } from "~/utils/filter";
import type { OrderRequestAutomationDetailModel } from "~/interfaces/api/orders/order-request-automation-model";

// Props
interface Props {
  id: string;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits(["closeDialog"]);

// Composables
const { t } = useI18n();

// Stores
const baseStore = useRequestAutomationStore("detail");

// States
const detail = ref<OrderRequestAutomationDetailModel>();
const isLoading = ref(false);

// Hooks
const dialogTitle = computed(
  () => \`\${t("labels.detailed_information")} - \${detail.value?.name}\`,
);

const expectedShippingDateCalculationTypeName = computed<string>(() => {
  const id = detail.value?.expected_shipping_date_calculation_type;
  return (
    baseStore.expectedShippingDateCalculationTypes.items?.find(
      (item) => item.id === id,
    )?.name ?? "-"
  );
});

onMounted(async () => {
  await Promise.all([
    !baseStore.expectedShippingDateCalculationTypes.items &&
      baseStore.getExpectedShippingDateCalculationType(),
  ]);
  if (props.id) fetchDetail();
});

// Methods
const fetchDetail = async () => {
  isLoading.value = true;
  try {
    const { data } = await baseStore.getDetail(props.id);
    if (data) detail.value = data;
  } catch (error) {
    console.log(error);
  } finally {
    isLoading.value = false;
  }
};

const closeDialog = () => emit("closeDialog");
<\/script>

<style scoped lang="scss">
.request-automation-details-dialog {
  :deep(.modal-body-content) {
    overflow-y: unset !important;
  }
}
</style>
`;export{n as default};
