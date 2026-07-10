const n=`<template>
  <div class="visit-marker-balloon">
    <div class="absolute -top-0 -right-0 cursor-pointer" @click="closeBalloon">
      <IconX color="#525866" />
    </div>

    <div v-if="isLoading" class="loading-container">
      <icon-loading :loading="isLoading" :width="12" :height="12" />
    </div>

    <div v-else-if="visitData" class="balloon-content">
      <!-- Header -->
      <div class="client-name">
        {{ visitData.place_name }}
      </div>

      <div class="header-section">
        <!-- Place Type -->
        <div class="bordered-item text-neutral-600">
          <div
            class="circle"
            :style="\`background:\${visitData.place_type?.hex_color};\`"
          />
          <div class="title">
            {{ visitData.place_type?.name }}
          </div>
        </div>

        <!-- Photo Report Button -->
        <flex-row class="gap-2">
          <div
            v-tooltip="
              visitData.has_photo_reports
                ? t('gps.photo_report_yes')
                : t('gps.photo_report_no')
            "
          >
            <icon-camera
              v-if="visitData.has_photo_reports"
              class="cursor-pointer"
              @click="handlePhotoReportClick"
            />
            <icon-hide-camera v-else :size="24" />
          </div>
          <div v-tooltip="t('gps.show_client_location')">
            <icon-location
              :size="20"
              class="text-[#05A9A9] fill-transparent hover:fill-[#05A9A9] transition-colors cursor-pointer inline-block"
              @click="handleLocationClick"
            />
          </div>
        </flex-row>
      </div>

      <!-- Refueling Section -->
      <div v-if="isRefuelingPlace" class="body-section">
        <icon-refueling />
        {{ t("gps.refueling") }}
      </div>

      <!-- Order Groups -->
      <template v-if="visitData.order_groups?.length">
        <template v-for="item in visitData.order_groups" :key="item.order_type">
          <flex-col class="gap-2.5">
            <flex-row class="justify-between items-center font-medium">
              <flex-row class="gap-1">
                <icon-add-file />
                {{ t("gps.orders") }}
              </flex-row>
              <status-btn-for-table
                :status-data="getOrderActionType(item.order_type)"
                readonly
              />
            </flex-row>
            <flex-row v-if="item.orders?.length" class="text-sm font-medium">
              <span class="text-primary-600">[</span
              ><LinkComponent
                v-for="order in item.orders"
                :key="order.id"
                :to="\`/orders/orders/details?id=\${order.id}\`"
                target
                :value="order.visual_id"
                non-copyable
              /><span class="text-primary-600">]</span>
            </flex-row>
          </flex-col>
          <div class="table-container">
            <table class="table-content">
              <c-tr class="bg-neutral-50 border-t-0">
                <c-td-no-edit v-for="header in tableHeaders" :key="header.key">
                  <order-by-universal :name="header.name" without-order-by />
                </c-td-no-edit>
              </c-tr>
              <c-tr v-for="(data, index) in item.details" :key="index">
                <c-td-no-edit v-for="header in tableHeaders" :key="header.key">
                  <div v-if="header.key === 'category'">
                    {{ getCellValue(data, header.key) }}
                  </div>
                  <div v-else>
                    {{ getFormattedAmount(getCellValue(data, header.key)) }}
                  </div>
                </c-td-no-edit>
              </c-tr>
              <c-tr class="bg-neutral-50 border-b-0">
                <c-td-no-edit v-for="header in tableHeaders" :key="header.key">
                  <div v-if="header.key === 'category'" class="fw-6">Итого</div>
                  <div v-else class="fw-6">
                    {{
                      getFormattedAmount(getOrderGroupValue(item, header.key))
                    }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </table>
          </div>
        </template>
      </template>

      <!-- Payment Section -->
      <template v-if="hasPayments">
        <div class="body-section">
          <icon-payment />
          Оплата
        </div>
        <div class="table-container">
          <table class="table-content">
            <c-tr class="bg-neutral-50 border-t-0">
              <c-td-no-edit v-for="header in paymentHeaders" :key="header.key">
                <order-by-universal :name="header.name" without-order-by />
              </c-td-no-edit>
            </c-tr>
            <c-tr
              v-for="(data, index) in visitData.payment_request.items"
              :key="index"
            >
              <c-td-no-edit v-for="header in paymentHeaders" :key="header.key">
                <div v-if="header.key === 'visual_id'">
                  {{ getPaymentValue(data, header.key) }}
                </div>
                <div v-else-if="header.key === 'amount'">
                  {{ getFormattedAmount(data.amount) }}
                </div>
                <div v-else>
                  {{ getPaymentValue(data, header.key) }}
                </div>
              </c-td-no-edit>
            </c-tr>
            <c-tr class="bg-neutral-50 border-b-0">
              <c-td-no-edit v-for="header in paymentHeaders" :key="header.key">
                <div v-if="header.key === 'payment_method_name'" class="fw-6">
                  Итого
                </div>
                <div v-else-if="header.key === 'amount'" class="fw-6">
                  {{
                    getFormattedAmount(
                      visitData.payment_request.total?.converted_amount,
                    )
                  }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </table>
        </div>
      </template>

      <!-- Invoices Section -->
      <div
        v-for="(item, index) in visitData.confirmed_invoices"
        :key="index"
        class="body-section"
      >
        {{ item.invoice_type?.name }}
        <span> {{ getInvoiceIds(item.invoices) }}</span>
      </div>

      <!-- Location Info -->
      <div class="section-item">
        <div class="key">Локация:</div>
        <div v-if="!visitData.location" class="value">
          <div class="bordered-item text-red-550">
            {{ t("not_available") }}
          </div>
        </div>
        <div v-else class="value gap-1.5">
          <span>{{ formatLocation(visitData.location) }}</span>
          <copy-btn :value="formatLocation(visitData.location)" />
        </div>
      </div>

      <!-- Time Info -->
      <div v-if="visitData.tracked_time?.from" class="section-item">
        <div class="key">{{ t("column.time") }}:</div>
        <div class="value gap-2.5">
          [{{ getFormattedDate(visitData.tracked_time.from, "HH:mm") }}-{{
            getFormattedDate(visitData.tracked_time.to, "HH:mm")
          }}]
          <div class="bordered-item text-neutral-600">
            {{
              getDifferenceTime(
                visitData.tracked_time.from,
                visitData.tracked_time.to,
              )
            }}
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-section">
        <div v-if="visitData.network_type" class="bordered-item">
          <icon-wifi />
          {{ visitData.network_type }}
        </div>
        <div v-if="visitData.charge" class="bordered-item">
          <icon-charge :percent="visitData.charge" />
          {{ visitData.charge }}%
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="error-state">
      <p>Ошибка загрузки данных</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { VisitDetailModel } from "~/interfaces/api/gps/GPS-model";
import { getFormattedAmount } from "~/utils/filter";
import { formatLocation, getFormattedDate } from "~/utils/formatters";

// Types
interface Props {
  onSetOpenPhotoReport?: () => void;
  closeBalloon: () => void;
  openClientMarkerBalloon?: () => void;
}

interface OrderItem {
  visual_id: string;
}

interface InvoiceItem {
  visual_id: string;
}

// Store and Props
const gpsStore = useGPSStore("main");
const props = defineProps<Props>();

// Emit
const emit = defineEmits<{
  (e: "setOpenPhotoReport"): void;
}>();

const { t } = useI18n();

// Loading state
const isLoading = computed(() => gpsStore.isVisitOrderInfoLoading);

// Visit data
const visitData = computed<VisitDetailModel | undefined>(
  () => gpsStore.orderInfoData,
);

const orderActionTypes = computed(
  () => gpsStore.orderVisitOrderActionType?.items || [],
);

// Computed properties
const isRefuelingPlace = computed(() => visitData.value?.place_type?.id === 4);

const hasPayments = computed(() => {
  const items = visitData.value?.payment_request?.items;
  return Array.isArray(items) && items.length > 0;
});

// Table headers
const tableHeaders = [
  { name: "Категория", key: "category" },
  { name: "Кол-во", key: "count" },
  { name: "Сумма", key: "converted_cost" },
];

const paymentHeaders = [
  { name: "Способ опл.", key: "payment_method_name" },
  { name: "ID заказа", key: "visual_id" },
  { name: "Сумма", key: "amount" },
];

// Utility functions
const getOrderActionType = (
  orderActionTypeId: number,
): typeof orderActionType | undefined => {
  const orderActionType = orderActionTypes.value.find(
    (item) => item.id === orderActionTypeId,
  );
  return orderActionType;
};

const getInvoiceIds = (invoices: InvoiceItem[]): string => {
  if (!invoices?.length) return "";
  const ids = invoices.map((invoice) => invoice.visual_id);
  return \`[\${ids.join(", ")}]\`;
};

// Value getters for table cells
const getCellValue = (data: any, key: string): any => {
  if (key === "category") {
    return data.category?.name || "";
  }
  return data[key] || "";
};

const getOrderGroupValue = (item: any, key: string): any => {
  if (key === "category") return "";
  return item[key] || "";
};

const getPaymentValue = (data: any, key: string): any => {
  if (key === "visual_id") {
    return data.order?.visual_id || "";
  }
  return data[key] || "";
};

// Event handlers
const handlePhotoReportClick = () => {
  emit("setOpenPhotoReport");
};

const closeBalloon = () => {
  props.closeBalloon();
};

const handleLocationClick = () => {
  props.openClientMarkerBalloon?.();
  props.closeBalloon();
};

onMounted(async () => {
  await gpsStore.getVisitOrderActionType();
});

const getDifferenceTime = (from: string, to: string): string => {
  if (!from || !to) return "";
  const diff = (new Date(to).getTime() - new Date(from).getTime()) / 60000;
  const h = Math.floor(diff / 60),
    m = Math.floor(diff % 60);
  return \`\${h ? \`\${h} \${t("hours_short")} \` : ""}\${m} \${t("minutes_short")}\`;
};
<\/script>

<style lang="scss" scoped>
.visit-marker-balloon {
  width: 366px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  position: relative;
  font-family: "Inter", sans-serif;

  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }

  .error-state {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100px;
    color: theme("colors.red.500");
    text-align: center;
  }

  .balloon-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 70vh;
    overflow-y: auto;
  }

  .client-name {
    font-family: "Inter", sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: theme("colors.neutral.950");
  }

  .header-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
    border-bottom: 1px solid theme("colors.neutral.200");
  }

  .bordered-item {
    border: 1px solid theme("colors.neutral.200");
    border-radius: 6px;
    padding: 4px 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-family: "Inter", sans-serif;
    font-weight: 500;
    color: theme("colors.neutral.600");

    .circle {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background-color: red;
    }

    .title {
      font-weight: 500;
      font-size: 12px;
      white-space: nowrap;
      font-family: "Inter", sans-serif;
      color: theme("colors.neutral.600");
    }
  }

  .body-section {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-family: "Inter", sans-serif;
    color: theme("colors.neutral.950");
    font-weight: 500;

    span {
      color: theme("colors.neutral.600");
    }
  }

  .section-item {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .key {
      color: theme("colors.neutral.600");
      font-size: 12px;
      font-family: "Inter", sans-serif;
      font-weight: 400;
    }

    .value {
      color: theme("colors.neutral.950");
      font-size: 12px;
      font-family: "Inter", sans-serif;
      font-weight: 500;
      display: flex;
      align-items: center;
    }
  }

  .footer-section {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: 10px;
  }

  .table-container {
    width: 100%;
    border-radius: 12px !important;
    border: 1px solid theme("colors.neutral.200");

    .table-content {
      width: 100%;
      overflow: hidden;
      border-radius: 12px !important;
    }
  }
}
</style>
`;export{n as default};
