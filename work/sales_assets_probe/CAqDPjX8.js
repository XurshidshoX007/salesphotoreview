const n=`<template>
  <div v-if="data?.length" class="history-page-content">
    <div class="history-page-content-a">
      <div class="table-content">
        <div
          v-for="(header, index) in headers"
          :key="header.key"
          class="table-column-history"
        >
          <div
            class="child-column-history"
            :class="[
              'z-2',
              (index % 2 === 1 && 'bg-[#FAFDFD]') || 'bg-white',
              index + 1 === headers?.length && 'border-b-1',
            ]"
            :style="[index === 0 && 'box-shadow: none']"
          >
            {{ header.name }}
          </div>
          <div
            v-for="(data, index2) in data"
            :key="data?.id"
            class="child-column-history"
            :class="[
              index % 2 === 1 && 'bg-[#FAFDFD]',
              index2 + 1 !== data.length && 'border-r-1',
              index + 1 === headers?.length && 'border-b-1',
            ]"
            :style="[index === 0 && 'box-shadow: none']"
          >
            <div
              v-if="
                (header.key === 'status' && data?.status) ||
                (header.key === 'payment_status' && data?.payment_status)
              "
            >
              <StatusBtnForTable
                v-if="header.key === 'status'"
                :status-data="getStatusDataByName(data?.status?.name, 'order')"
                :readonly="true"
              />
              <StatusBtnForTable
                v-else-if="header.key === 'payment_status'"
                :status-data="
                  getStatusDataByName(
                    data?.payment_status?.name,
                    'client-payment'
                  )
                "
                :readonly="true"
              />
            </div>
            <div
              v-else-if="
                header.key === 'for_consignation' &&
                data?.for_consignation !== null
              "
              class="section"
            >
              <div v-if="data?.for_consignation">
                {{ t("filters.yes") }}
              </div>
              <div v-else>
                {{ t("filters.no") }}
              </div>
            </div>
            <div
              v-else-if="header.key === 'modified_by'"
              :title="data[header.key]?.name"
              class="section w-60 break-words"
            >
              {{ data[header.key]?.name }}
            </div>
            <div v-else-if="header.key === 'client_agents'" class="section">
              <div
                v-for="team in data[header.key]"
                :key="team"
                class="command-row border-b last-border-b-0 pb-2 mb-2 last-pb-0 last-mb-0"
                :data-ordinal="team?.ordinal_number"
              >
                <div>{{ t("sidebar.team") }} {{ team?.ordinal_number }}:</div>
                <div v-show="!team?.agent?.name && !team?.expeditor?.name">
                  ({{ t("empty") }})
                </div>
                <div v-show="team?.agent?.name">
                  <span class="font-semibold"
                    >{{ t("users.agents.agent") }}:</span
                  >
                  {{ team?.agent?.name }}
                  <div v-if="team?.visit_days?.length">
                    ({{ getFormattedVisitDays(team?.visit_days) }})
                  </div>
                </div>
                <div v-show="team?.expeditor?.name">
                  <span class="font-semibold"
                    >{{ t("filters.expeditor") }}:</span
                  >
                  {{ team?.expeditor?.name }}
                </div>
              </div>
            </div>
            <div
              v-else-if="
                typeof data[header.key] === 'object' &&
                !header.key?.includes('date')
              "
              class="section"
            >
              {{ data[header.key]?.name }}
            </div>
            <div
              v-else-if="
                header.key?.includes('date') ||
                header.key === 'consignation_term'
              "
              :class="
                (header.key === 'last_modified_date' && 'section-h') ||
                'section'
              "
            >
              {{
                getFormattedDate(
                  data[header.key] ||
                    (header.key === "last_modified_date" &&
                      data["created_date"]),
                  "DD.MM.YYYY HH:mm:ss"
                )
              }}
            </div>
            <div v-else-if="header.key === 'visual_id'" class="section">
              {{ data[header.key] > 0 ? data[header.key] : "" }}
            </div>
            <div
              v-else-if="typeof data[header.key] === 'number'"
              class="section"
            >
              {{ getFormattedAmount(data[header.key]) }}
            </div>
            <div class="section" v-else-if="header.key === 'is_active'">
              {{ data[header.key] ? t("yes") : t("filters.no") }}
            </div>
            <div class="section" v-else>
              {{ data[header.key] }}
            </div>
          </div>
        </div>
        <div class="font-semibold text-[18px] p-2 sticky left-0 w-full">
          <slot name="composition"></slot>
        </div>
        <template v-for="(bonusData, bonusIndex) in bonusWithoutBonusProduct">
          <div
            v-for="header in productsHeaders"
            :key="header.key"
            class="table-column-history"
          >
            <div
              class="child-column-history z-5"
              :class="[
                (bonusIndex % 2 === 1 && 'bg-[#FAFDFD]') || 'bg-white',
                bonusIndex + 1 === bonusWithoutBonusProduct?.length &&
                  'border-b-1',
              ]"
            >
              <div>
                <div>{{ bonusData[0][header.key] }}</div>
                <div
                  class="fw-6"
                  :class="
                    (bonusData[0]['type_id'] === 3 && 'text-[#E47200]') ||
                    (bonusData[0]['type_id'] === 2 && 'text-[#640617]') ||
                    'text-[#299B9B]'
                  "
                >
                  {{ bonusData[0]["type_name"] }}
                </div>
              </div>
            </div>
            <div
              v-for="data in bonusData"
              :key="data?.id"
              class="child-column-history"
              :class="[
                bonusIndex % 2 === 1 && 'bg-[#FAFDFD]',
                bonusIndex + 1 === bonusWithoutBonusProduct?.length &&
                  'border-b-1',
              ]"
            >
              <div class="section" v-if="checkData(data)">
                <div>
                  {{ t("column.quantity") }}:
                  <span class="text-black fw-5"
                    >{{ getFormattedAmount(data?.count) }}
                    {{ t("count") }}</span
                  >
                </div>
                <div>
                  {{ t("column.price") }}:
                  <span class="text-black fw-5"
                    >{{ getFormattedAmount(data?.price) }}сум</span
                  >
                </div>
                <div>
                  {{ t("column.volume") }}:
                  <span class="text-black fw-5">{{
                    getFormattedAmount(data?.volume)
                  }}</span>
                </div>
                <div>
                  {{ t("column.sum") }}:
                  <span class="text-black fw-5"
                    >{{ getFormattedAmount(data?.cost) }}сум</span
                  >
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getFormattedDate } from "~/utils/formatters";
import type { OrderStatusModel } from "~/interfaces/api/orders/order-status-model";
import { getFormattedAmount } from "../../../utils/filter";
import { getLibConstantsByKey } from "~/utils/local-storage";
import { useI18n } from "vue-i18n";
// props
const props = defineProps({
  headers: Array,
  productsHeaders: Array,
  data: Array,
  bonusWithoutBonusProduct: Array,
  productIndex: Number,
});

// state
const { t } = useI18n();
const statusConstants = ref<OrderStatusModel[]>([]);
const statusPaymentConstants = ref<OrderStatusModel[]>([]);
// hooks
onMounted(async () => {
  statusConstants.value = await getLibConstantsByKey("OrderStatus");
  statusPaymentConstants.value = await getLibConstantsByKey("PaymentStatus");
});

// methods
const getStatusDataByName = (name: string, type: string) => {
  if (type === "order") {
    return statusConstants.value?.find((status) => status.name === name);
  } else {
    return statusPaymentConstants.value?.find((status) => status.name === name);
  }
};
const checkData = (data: any) => {
  return data?.cost || data?.count || data.volume;
};

const getFormattedVisitDays = (visitDays: string[]) => {
  return visitDays.join(", ");
};

const setEqualCommandRowHeights = () => {
  nextTick(() => {
    const rowGroups = {};
    const rows = document.querySelectorAll(".command-row");

    rows.forEach((row) => {
      const ordinal = row.getAttribute("data-ordinal");
      if (!rowGroups[ordinal]) {
        rowGroups[ordinal] = [];
      }
      rowGroups[ordinal].push(row);
    });

    Object.values(rowGroups).forEach((group) => {
      let maxHeight = 0;

      group.forEach((row) => {
        row.style.height = "auto";
        maxHeight = Math.max(maxHeight, row.offsetHeight);
      });

      group.forEach((row) => {
        row.style.height = \`\${maxHeight}px\`;
      });
    });
  });
};

const onHistoryTableScroll = () => {
  const childDivs = document.querySelectorAll<HTMLElement>(
    ".table-column-history"
  );
  const parentDiv = document.querySelector<HTMLElement>(
    ".history-page-content"
  );
  const parentDivTop = document.querySelector<HTMLElement>(
    ".history-page-content-a"
  );
  if (!parentDiv || !parentDivTop || !childDivs) return;
  const isDataLengthGreaterThanEight =
    props?.data?.length && props?.data?.length > 8;

  childDivs.forEach((childDiv) => {
    childDiv.style.width = isDataLengthGreaterThanEight
      ? "fit-content"
      : "100%";
  });

  parentDiv.style.paddingBottom = isDataLengthGreaterThanEight ? "6px" : "0px";
  parentDivTop.style.paddingBottom = isDataLengthGreaterThanEight
    ? "6px"
    : "0px";
};

onMounted(() => {
  setEqualCommandRowHeights();
  window.addEventListener("resize", setEqualCommandRowHeights);
  onHistoryTableScroll();
});

onUnmounted(() => {
  window.removeEventListener("resize", setEqualCommandRowHeights);
});
<\/script>

<style lang="scss" scoped>
.history-page-content {
  width: 100%;
  flex-grow: initial;
  position: relative;
  border-radius: 8px;

  .history-page-content-a {
    width: 100%;
    overflow: auto;
    position: relative;
    border-radius: 8px;
    border: 1px solid #e1e4e4;

    .table-content {
      display: table;

      .table-column-history {
        display: table-row;

        .child-column-history {
          position: sticky;
          left: 0;
          display: table-cell;
          align-items: start;
          min-width: 260px;
          width: 100%;
          font-size: 12px;
          color: #8fa0a0;
          font-family: "Inter", sans-serif;
          padding: 6px;
          height: fit-content;
          border-right: 1px solid #e5e7eb;
          will-change: transform;
          box-shadow: inset 0 1px 0 #e5e7eb;

          .section {
            font-size: 13px;
            color: #424f4f;
            font-family: "Inter", sans-serif;
          }

          .section-h {
            font-size: 14px;
            font-weight: 600;
            font-family: "Inter", sans-serif;
            color: #299b9b;
          }
        }

        .child-column-history-section {
          position: sticky;
          left: 0;
          display: table-cell;
          align-items: center;
          min-width: 200px;
          width: 100%;
          font-size: 13px;
          font-weight: 500;
          color: #424f4f;
          font-family: "Inter", sans-serif;
          padding: 5px;
          border-right: 1px solid #e5e7eb;
          overflow: clip;
          will-change: transform;
          box-shadow: inset 0 1px 0 #e5e7eb;

          .section {
            font-size: 13px;
            color: #424f4f;
            font-family: "Inter", sans-serif;
          }

          .section-h {
            font-size: 14px;
            font-weight: 600;
            font-family: "Inter", sans-serif;
            color: #299b9b;
          }
        }

        .child-column-history:last-child {
          border-right: none !important;
        }
      }

      .table-column-history:hover {
        background: #f6f6f6 !important;

        .child-column-history {
          background: #f6f6f6 !important;
        }

        .child-column-history-section {
          background: #f6f6f6 !important;
        }
      }
    }
  }
}

@media only screen and (max-width: 767px) {
  .history-page-content {
    .history-page-content-a {
      .table-content {
        .table-column-history {
          .child-column-history {
            position: static;
          }
          .child-column-history-section {
            position: static;
          }
        }
      }
    }
  }
}
</style>
`;export{n as default};
