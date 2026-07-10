const n=`<template>
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
        <div class="key">{{ t("column.category") }}</div>
        <div class="value">
          {{ detailData?.category?.name }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("settings_sidebar.units") }}</div>
        <div class="value">
          {{ detailData?.unit?.name }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("labels.quantity_in_package") }}</div>
        <div class="value">
          {{ detailData?.quantity_in_package }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("labels.weight") }}</div>
        <div class="value">
          {{ detailData?.weight }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("labels.sort") }}</div>
        <div class="value">
          {{ detailData?.sort }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("column.volume") }}</div>
        <div class="value">
          {{ detailData?.volume }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("settings_sidebar.sales_channel") }}</div>
        <div class="value">
          {{ detailData?.sales_channel?.name }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("labels.box_type") }}</div>
        <div class="value">
          {{ detailData?.box_type?.name }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("column.code") }}</div>
        <div class="value">
          {{ detailData?.code }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("column.sap_code") }}</div>
        <div class="value">
          {{ detailData?.sub_code }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("labels.bar_code") }}</div>
        <div class="value">
          {{ detailData?.bar_code }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("column.ikpu_code") }}</div>
        <div class="value">
          {{ detailData?.ikpu_code }}
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("column.mml") }}</div>
        <div class="value">
          {{ detailData?.mml ? "Есть" : "Нет" }}
        </div>
      </div>
    </div>
    <div class="detail-content" v-else>
      <div class="section">
        <div class="key">{{ t("labels.name") }}</div>
        <div class="value w-47">
          <SkeletonRows class="p-0" :padding="1" :rows="1" height="22px" />
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("settings.valid") }}</div>
        <div class="value w-47">
          <SkeletonRows class="p-0" :padding="1" :rows="1" height="22px" />
        </div>
      </div>
      <div class="section">
        <div class="key">{{ t("column.bonus_type") }}</div>
        <div class="value w-47">
          <SkeletonRows class="p-0" :padding="1" :rows="1" height="22px" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProductsModel } from "~/interfaces/api/settings/products-model";
import { useI18n } from "vue-i18n";

// store
const productsStore = useAuditProductsStore("main");

// props
const props = defineProps({
  id: String,
});

// state
const { t } = useI18n();
const loading = ref(false);
let detailData = ref<ProductsModel>();

onMounted(async () => {
  loading.value = true;
  detailData.value = await productsStore.getById(props.id);
  loading.value = false;
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
    padding: 8px 0px;

    .key {
      color: #8fa0a0;
      font-size: 14px;
      font-family: "Inter", sans-serif;
      font-weight: 400;
      padding: 0 10px;
    }

    .value {
      color: #000000;
      font-size: 14px;
      font-family: "Inter", sans-serif;
      font-weight: 400;
      padding: 0 10px;
      text-align: end;
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
