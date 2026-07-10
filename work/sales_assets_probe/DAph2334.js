const n=`<template>
  <div class="chart-card-content">
    <div class="total-summa-card">
      <div class="summa-card-body">
        <div
          v-for="(item, index) in supervisorStore.totalCost"
          :key="item.id"
          :class="(item.is_summary && 'first-summa_card') || 'section_card'"
        >
          <div
            class="card_header"
            :style="\`background:\${getCardBackgroundColor(
              index,
              item.is_summary,
            )};border-bottom: 1px solid \${getCardBackgroundColor(
              index,
              item.is_summary,
            )}\`"
          >
            <div
              class="key"
              :style="\`color:\${getCardColor(index, item.is_summary)};\`"
            >
              {{
                (item.is_summary && t("column.total_sum")) || item.currency.name
              }}
            </div>
          </div>
          <div class="card_body">
            <div class="summa">
              {{ getFormattedAmount(item.total_amount) }}
              {{ item.currency?.code }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="cards-container">
      <div :class="supervisorStore.isLoadingCard && 'opacity-50'" class="cards">
        <div
          v-for="item in supervisorStore.cards"
          :key="item.id"
          class="data-card"
          :style="[
            item.hex_color
              ? \`background:\${item.hex_color + '1A'};\`
              : 'background: white;',
            \`border: 1px solid \${item?.hex_color};\`,
          ]"
        >
          <div class="type">
            {{ item.type.name }}
          </div>
          <div :style="\`color:\${item.hex_color}\`" class="percentage">
            {{ item.percentage }} %
          </div>
          <div class="footer">
            <div class="plan">
              <div class="key">
                {{ t("column.plan") }}
              </div>
              <div class="value">
                {{ getFormattedAmount(item.visit.planned_count) }}
              </div>
            </div>
            <div class="plan cursor-pointer">
              <div class="show-more">
                <div class="item">По плану: {{ item.fact.planned_count }}</div>
                <div class="item">
                  Вне плана: {{ item.fact.not_planned_count }}
                </div>
              </div>
              <div class="arr"></div>
              <div class="key">
                {{ t("column.fact") }}
              </div>
              <div class="value text-end">
                {{ getFormattedAmount(item.fact.planned_count) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        v-if="supervisorStore.isLoadingCard"
        class="absolute top-[25%] left-[50%]"
      >
        <icon-loading :loading="true" :width="15" :height="15" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getFormattedDate } from "~/utils/formatters";
import { dateConstants } from "~/variable/date";
const { months } = dateConstants();
const supervisorStore = useSupervisorStore("main");
const isDataFetching = ref(false);

//props
const props = defineProps({
  checkGroupedName: String,
  isActive: Boolean,
  params: Object,
});

// state

const { t } = useI18n();
const summaCardColors = ref([
  "#299B9B",
  "#0B8C18",
  "#D48C1E",
  "#BB72F4",
  "#1B2CC3",
  "#3B0763",
  "#BD7F06",
]);

// methods
const getFormat = (dateValue: string) => {
  if (dateValue) {
    const monthItem = months.find(
      (item) => item.id === getFormattedDate(dateValue, "MM"),
    );
    const checkMonth = monthItem ? monthItem.key : "";
    return \`\${getFormattedDate(dateValue, "DD")} \${checkMonth}\`;
  }
};

const getCardBackgroundColor = (index: number, is_summary: boolean) => {
  return is_summary
    ? summaCardColors.value[index]
    : summaCardColors.value[index] + "2A";
};

const getCardColor = (index: number, is_summary: boolean) => {
  return is_summary ? null : summaCardColors.value[index];
};
// hooks

const getFromDate = computed(() => {
  return \`\${t("dashboard.total_amount_applications")} \${getFormat(
    props.params?.date_range?.from,
  )}\`;
});

onMounted(async () => {
  if (!isDataFetching.value && props.params?.date_range.from) {
    isDataFetching.value = true;
    try {
      await supervisorStore.getDashboardCards(props.params);
      await supervisorStore.getDashboardTotalSumma(props.params);
    } finally {
      isDataFetching.value = false;
    }
  }
});

watch(
  () => props.params,
  async (newParams, oldParams) => {
    if (newParams) {
      if (!isDataFetching.value) {
        isDataFetching.value = true;
        try {
          await supervisorStore.getDashboardTotalSumma(props.params);
          await supervisorStore.getDashboardCards(props.params);
        } finally {
          isDataFetching.value = false;
        }
      }
    }
  },
  { deep: true },
);
<\/script>

<style scoped lang="scss">
.chart-card-content {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;

  .total-summa-card {
    width: 100%;

    .card-title {
      font-family: "Inter", sans-serif;
      font-size: 24px;
      font-weight: 600;
      color: #424f4f;
      padding-bottom: 12px;
    }

    .summa-card-body {
      width: 100%;
      flex-wrap: wrap;
      display: grid;
      grid-template-columns: repeat(
        auto-fill,
        minmax(280px, 1fr)
      ); /* Ensures a minimum width of 260px */
      grid-gap: 24px;

      .first-summa_card {
        border-radius: 8px;
        background: white;
        width: 100%;
        .card_header {
          display: flex;
          padding: 10px 12px;
          align-items: center;
          border-radius: 8px 8px 0 0;

          .key {
            color: white;
            font-weight: 400;
            font-family: "Inter", sans-serif;
            font-size: 16px;
          }
        }
        .card_body {
          display: flex;
          align-items: center;
          padding: 20px 12px;
          justify-content: center;

          .summa {
            font-family: "Inter", sans-serif;
            font-weight: 600;
            color: #424f4f;
            font-size: 28px;
          }
        }
      }

      .section_card {
        border-radius: 8px;
        background: white;
        width: 100%;

        .card_header {
          padding: 10px 12px;
          display: flex;
          align-items: center;
          border-radius: 8px 8px 0 0;

          .key {
            color: #8fa0a0;
            font-weight: 400;
            font-family: "Inter", sans-serif;
            font-size: 16px;
          }
        }

        .card_body {
          display: flex;
          align-items: center;
          padding: 20px 12px;
          justify-content: center;

          .summa {
            font-family: "Inter", sans-serif;
            font-weight: 600;
            color: #424f4f;
            font-size: 28px;
          }
        }
      }
    }
  }

  .chart-content {
    width: calc(50% - 12px);
    background-color: white;
    border-radius: 12px;
    padding: 16px;

    .title-chart {
      display: flex;
      justify-content: center;
    }
  }

  .cards-container {
    min-height: 146px;
    width: 100%;
    position: relative;

    .cards {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      width: 100%;
      flex-wrap: wrap;

      .data-card {
        width: calc(25% - 24px);
        border-radius: 8px;
        align-content: space-between;
        padding: 16px 18px;

        .type {
          font-weight: 400;
          font-family: "Inter", sans-serif;
          font-size: 16px;
          color: #000;
        }

        .percentage {
          padding: 14px 0;
          font-size: 20px;
          font-family: "Inter", sans-serif;
          font-weight: 600;
          line-height: 24px;
        }

        .footer {
          display: flex;
          justify-content: space-between;
          align-content: center;

          .plan {
            position: relative;

            .arr {
              display: none;
              width: 10px;
              height: 10px;
              position: absolute;
              top: -10px;
              left: 10px;
              transform: rotate(45deg);
              background: white;
            }

            .show-more {
              display: none;
              box-shadow: 0px 6px 12px 0px #00000014;
              border-radius: 6px;
              position: absolute;
              top: -5px;
              transform: translateY(-100%);
              right: 0;
              padding: 4px 12px;
              background: white;

              .item {
                display: flex;
                font-size: 14px;
                font-family: "Inter", sans-serif;
                font-weight: 400;
                color: #424f4f;
                text-wrap: nowrap;
              }
            }

            .key {
              color: #424f4f;
              font-weight: 400;
              font-size: 14px;
              font-family: "Inter", sans-serif;
            }

            .value {
              color: #000;
              font-weight: 500;
              font-size: 15px;
              font-family: "Inter", sans-serif;
            }
          }

          .plan:hover {
            .arr {
              display: block;
            }

            .show-more {
              display: block;
            }
          }
        }
      }
    }

    @media screen and (max-width: 576px) {
      .cards {
        gap: 20px;

        .data-card {
          width: 100% !important;
        }
      }
    }

    @media (min-width: 577px) and (max-width: 1260px) {
      .cards {
        gap: 20px;

        .data-card {
          width: calc(50% - 10px) !important;
        }
      }
    }
  }
}

@media only screen and (max-width: 767px) {
  .chart-card-content {
    gap: 16px;

    .total-summa-card {
      .card-title {
        font-size: 18px;
      }

      .summa-card-body {
        gap: 16px;

        .first-summa_card,
        .section_card {
          .card_header {
            .key {
              font-size: 14px;
            }
          }
          .card_body {
            .summa {
              font-size: 20px;
            }
          }
        }
      }
    }
  }
}
</style>
`;export{n as default};
