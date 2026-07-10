const n=`<template>
  <div class="card-container">
    <div class="base-card client_base_card">
      <div class="content">
        <div class="value">
          {{
            getFormattedAmount(salesDashboardStore.dataClientBase?.total_client)
          }}
        </div>
        <div class="name">
          {{ t("dashboard.current_customer_base") }}
        </div>
      </div>
    </div>
    <div class="base-card by_plane_card">
      <div class="content">
        <div class="value">
          {{ getFormattedAmount(salesDashboardStore.dataClientBase?.tcb) }}
        </div>
        <div class="name">
          {{ t("dashboard.okb_by_plan") }}
        </div>
      </div>
    </div>
    <div class="base-card acb_order_card">
      <div class="content">
        <div class="value">
          {{ getFormattedAmount(salesDashboardStore.dataClientBase?.acb) }}
        </div>
        <div class="name">
          {{ t("dashboard.akb_orders") }}
        </div>
      </div>
    </div>
    <div class="base-card percentage_card">
      <div class="content">
        <div class="value">
          {{ getFormattedAmount(salesDashboardStore.dataClientBase?.percent) }}
        </div>
        <div class="name">
          {{ t("dashboard.okb_percentage") }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// stores
const salesDashboardStore = useDashboardSalesStore("main");

// state
const { t } = useI18n();
<\/script>

<style scoped lang="scss">
.card-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  user-select: none;
  gap: 20px;

  .base-card {
    padding: 20px;
    border-radius: 12px;
    width: 320px;
    display: flex;
    align-items: center;
    justify-content: center;

    .content {
      text-align: center;

      .value {
        font-family: "Inter", sans-serif;
        font-size: 24px;
        font-weight: 600;
      }

      .name {
        font-weight: 400;
        font-size: 16px;
        font-family: "Inter", sans-serif;
        color: #8fa0a0;
      }
    }
  }

  .base-card:hover {
    opacity: 0.8;
  }

  .client_base_card {
    background: #299b9b1a;
    border: 1px solid #299b9b;

    .content {
      .value {
        color: #000000;
      }
    }
  }

  .by_plane_card {
    background: #ffe8e8;
    border: 1px solid #ff0000;

    .content {
      .value {
        color: #ff0000;
      }
    }
  }
  .acb_order_card {
    background: #fff9ef;
    border: 1px solid #ffc400;

    .content {
      .value {
        color: #492e02;
      }
    }
  }
  .percentage_card {
    background: #ddf0de;

    border: 1px solid #207f2e;

    .content {
      .value {
        color: #004f04;
      }
    }
  }
}
</style>
`;export{n as default};
