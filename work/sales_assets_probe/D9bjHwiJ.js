const e=`<template>
  <form id="formId" @submit.prevent="onSave" novalidate>
    <div class="table-content-container !border-none py-3 space-y-3">
      <div class="font-medium text-xl mx-3">
        {{ t("audit.auditor_changes") }}
      </div>
      <div v-if="reviewDetail" class="border-t border-neutral-200 mx-3"></div>

      <MultiTab :tabs="tabs" v-model:active="activeTab">
        <template #header-wrapper="{ tabsList }">
          <div class="flex justify-between items-center mx-3">
            <div class="font-medium text-lg">
              {{ reviewDetail?.review_config.name }}
            </div>
            <component :is="tabsList" />
          </div>
        </template>
        <template v-for="tab in tabs" :key="tab.key" #[tab.key]>
          <div :id="tab.key" class="overflow-auto">
            <div class="min-w-200">
              <div
                v-if="isLoading"
                class="w-full flex justify-center items-center min-h-96"
              >
                <icon-loading :loading="true" :width="14" :height="14" />
              </div>
              <div v-if="reviewDetail">
                <AuditAuditReportDetailUpdateAuditorProduct
                  v-for="item in reviewDetail[tab.key]"
                  :key="item.product.id"
                  :data="item"
                  :item-req="getReqItem(item.product.id)"
                  :check-types="checkTypes"
                  :is-required-to-fill="reviewDetail.is_required_to_fill"
                  :is-reason-required="reviewDetail.is_reason_required"
                />
              </div>
            </div>
          </div>
        </template>
      </MultiTab>
      <div v-if="reviewDetail" class="flex items-center justify-end gap-3 mx-3">
        <m-btn group="outlined" class="w-full sm:w-fit" @click="onClose">
          {{ t("clients.cancel") }}
        </m-btn>
        <m-btn type="submit" :loading="isBtnLoading" class="w-full sm:w-fit">
          {{ t("save") }}
        </m-btn>
      </div>
    </div>
  </form>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";
import { auditReasonsDropdownParams } from "~/variable/params";
import type {
  AuditProduct,
  AuditProductReq,
  ProductReview,
  ProductReviewReq,
} from "~/interfaces/api/audit/audit-report/detail-models";

// types
interface Props {
  visitId: string;
  configId: string;
}

interface Tab {
  title: string;
  key: "products" | "concurrent_products";
}

// props
const props = defineProps<Props>();

// emits
const emit = defineEmits<{
  (e: "onClose"): void;
  (e: "onRefresh"): void;
}>();

// stores
const visitDetailStore = useAuditReportDetailStore("main");

// states
const { t } = useI18n();

const activeTab = ref("products");
const isLoading = ref(false);
const isBtnLoading = ref(false);
const checkTypes = ref<ConstantModel[]>([]);
const reviewDetail = ref<ProductReview>();
const reviewDetailReq = ref<ProductReviewReq>({
  id: "",
  details: [],
});

const tabs = reactive<Tab[]>([
  { title: t("audit.our_products"), key: "products" },
  { title: t("audit.other_products"), key: "concurrent_products" },
]);

// methods
const onClose = () => emit("onClose");

const getReqItem = (id: string) => {
  return reviewDetailReq.value.details.find(
    (el) => (el.product_id || el.concurrent_product_id) === id
  ) as AuditProductReq;
};

const getCheckTypes = async () => {
  checkTypes.value =
    (await visitDetailStore.getCheckTypes()) as ConstantModel[];
};

const fetchProductReviewDetail = async () => {
  const data = await visitDetailStore.getProductReviewDetail({
    visitId: props.visitId,
    reviewConfigId: props.configId,
  });
  reviewDetail.value = data;
  reviewDetailReq.value = getTransformedData();
};

const validateForm = async () => {
  for (const tab of tabs) {
    const element = document.getElementById(tab.key) as HTMLElement;
    const inputs = element.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      (input as HTMLInputElement).reportValidity();
    });

    const firstInvalid = element.querySelector(
      \`#\${tab.key} :invalid\`
    ) as HTMLElement | null;
    if (firstInvalid) {
      activeTab.value = tab.key;
      await nextTick();
      firstInvalid.focus();
      return false;
    }
  }
  return true;
};

const getTransformedData = () => {
  const mapProductToDetail = (
    product: AuditProduct,
    isConcurrent: boolean = false
  ): ProductReviewReq["details"][number] => ({
    id: product.detail_id,
    product_id: isConcurrent ? null : product.product.id,
    concurrent_product_id: isConcurrent ? product.product.id : null,
    product_exists: product.product_exists || false,
    reason_id_arr: product.product_exists
      ? []
      : (product.reasons || []).map((el) => el.id),
    checks: product.product_exists
      ? product.checks
          .filter((el) => el.checked_count)
          .map((el) => ({
            check_type: el.check_type,
            checked_count: el.checked_count,
          }))
      : [],
  });

  const params: ProductReviewReq = {
    id: reviewDetail.value?.client_product_review_id || "",
    details: [
      ...(reviewDetail.value?.products || []).map((p) => mapProductToDetail(p)),
      ...(reviewDetail.value?.concurrent_products || []).map((p) =>
        mapProductToDetail(p, true)
      ),
    ],
  };
  return params;
};

const onSave = async () => {
  const isValid = await validateForm();
  if (!isValid) return;

  if (reviewDetail.value) {
    isBtnLoading.value = true;

    const res = await visitDetailStore.updateProductReviewDetail(
      reviewDetailReq.value
    );
    isBtnLoading.value = false;
    if (res !== "error") {
      emit("onRefresh");
    }
  }
};

// hooks
onMounted(async () => {
  isLoading.value = true;
  await Promise.all([
    getCheckTypes(),
    fetchProductReviewDetail(),
    visitDetailStore.getReasons(auditReasonsDropdownParams),
  ]);
  isLoading.value = false;
});
<\/script>

<style scoped lang="scss">
.title {
  @apply font-medium text-lg text-neutral-950;
}
</style>
`;export{e as default};
