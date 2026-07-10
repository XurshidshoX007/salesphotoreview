const n=`<template>
  <d-modal
    :name="t('invoices.details')"
    :loading="clientsPaymentStore.isDetailLoading"
    @close-dialog="closeDialog"
  >
    <div class="detail-content">
      <div class="section">
        <div class="key">{{ t("column.payment_id") }}</div>
        <div class="value">
          {{ paymentCancellationDetail?.income_payment?.visual_id }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("column.created_date") }}</div>
        <div class="value">
          {{
            getFormattedDate(
              paymentCancellationDetail?.created_date,
              "DD.MM.YYYY HH:mm",
            )
          }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("column.completed_date") }}</div>
        <div class="value">
          {{
            getFormattedDate(
              paymentCancellationDetail?.completed_date,
              "DD.MM.YYYY HH:mm",
            )
          }}
        </div>
      </div>
      <div class="section">
        <div class="key">
          {{ t("settings_sidebar.payment_cancellation_reason") }}
        </div>
        <div class="value">
          {{ paymentCancellationDetail?.payment_cancellation_reason?.name }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("column.access_with_username") }}</div>
        <div class="value">
          {{ paymentCancellationDetail?.accessed_for_user?.name }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("column.status") }}</div>
        <div class="value">
          <StatusBtnForTable
            readonly
            :status-data="paymentCancellationDetail?.status"
          />
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("column.created_by") }}</div>
        <div class="value">
          {{ paymentCancellationDetail?.created_by?.name }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("column.comment") }}</div>
        <div class="value">
          {{ paymentCancellationDetail?.comment }}
        </div>
      </div>
    </div>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const clientsPaymentStore = useClientsPaymentStore("main");

// props
const props = defineProps<{
  id: string;
}>();

// emits
const emit = defineEmits(["closeDialog"]);

// state
const { t } = useI18n();

const paymentCancellationDetail = ref(null);

// hooks

onMounted(async () => {
  paymentCancellationDetail.value =
    await clientsPaymentStore.paymentCancellationDetail(props.id);
});

// methods

const closeDialog = () => {
  emit("closeDialog");
};
<\/script>

<style scoped lang="scss">
.detail-content {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100px;
  position: relative;
  justify-content: space-between;

  .section {
    display: flex;
    align-items: center;
    border-bottom: 1px solid #e1e4e4;
    justify-content: space-between;
    width: 100%;
    padding: 8px 0px;

    .key {
      color: #8fa0a0;
      font-size: 14px;
      font-family: "Inter", sans-serif;
      font-weight: 400;
    }

    .value {
      color: #000000;
      font-size: 14px;
      font-family: "Inter", sans-serif;
      font-weight: 400;
      text-align: end;
    }
  }

  .section:last-child {
    border-bottom: none;
  }

  .terms-table {
    width: 100%;
    border: 1px solid #d2d7d7;
    border-radius: 12px;
    overflow: hidden;
  }

  .title {
    color: rgba(0, 0, 0, 1);
    font-size: 18px;
    font-weight: 400;
    font-family: "Inter", sans-serif;
    width: 100%;
    margin: 12px 0px;
  }
}
</style>
`;export{n as default};
