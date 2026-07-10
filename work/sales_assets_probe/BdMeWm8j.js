const n=`<template>
  <d-modal name="Деталь" :loading="loading" @closeDialog="closeDialog">
    <div class="w-full relative max-h-[80vh] overflow-auto pr-4">
      <div v-if="!loading" class="detail-content">
        <div class="section">
          <div class="key">{{ t("labels.name") }}</div>
          <div class="value">
            {{ detailData?.name }}
          </div>
        </div>
        <div class="section">
          <div class="key">{{ t("active") }}</div>
          <div class="value">
            {{ detailData?.is_active ? t("active") : t("not_active") }}
          </div>
        </div>

        <div class="section">
          <div class="key">{{ t("labels.sort") }}</div>
          <div class="value">
            {{ detailData?.sort }}
          </div>
        </div>

        <div class="section">
          <div class="key">{{ t("column.code") }}</div>
          <div class="value">
            {{ detailData?.code }}
          </div>
        </div>
        <div class="section">
          <div class="key">{{ t("settings.products") }}</div>
          <div class="value">
            {{ getProducts }}
          </div>
        </div>
      </div>
    </div>
  </d-modal>
</template>

<script setup lang="ts">
// props
import { useI18n } from "vue-i18n";

const props = defineProps({
  detailData: Object,
  loading: Boolean,
});

// state
const { t } = useI18n();

const emit = defineEmits(["closeDialog"]);

// methods

const closeDialog = () => {
  emit("closeDialog");
};

const getProducts = computed(() => {
  return props.detailData?.products?.map((item) => item.name)?.join(", ");
});
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
    gap: 15px;
    padding: 8px 0px;

    .key {
      color: #8fa0a0;
      font-size: 14px;
      font-family: "Inter", sans-serif;
      font-weight: 400;
      padding: 0 10px;
    }

    .value {
      text-align: end;
      color: #000000;
      font-size: 14px;
      font-family: "Inter", sans-serif;
      font-weight: 400;
    }
  }

  .section:last-child {
    border-bottom: none;

    .value {
      color: #299b9b;
    }
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
