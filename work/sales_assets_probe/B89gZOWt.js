const e=`<template>
  <d-modal
    :name="t('column.order_detail_id') + visualId"
    @closeDialog="closeDialog"
    :dataContainerWidth="'90%'"
  >
    <flex-col class="page-gap">
      <FlexibleItemsMenu
        tab-mode
        :items-arr="categories"
        :active-item-id="activeCategoryId"
        @onChangeActiveItem="onChangeCategory"
      />
      <div class="overflow-auto rounded-lg border-1">
        <data-table
          :headers="returnExpeditorsStore.byOrdersDetailHeaders"
          :loading="returnExpeditorsStore.isOrderByDetailLoading"
          :isEmpty="!products.length"
          with-information-above-header
        >
          <template #body>
            <template
              v-for="(data, index) in products"
              :key="data?.product?.id"
            >
              <c-tr>
                <c-td-no-edit
                  v-for="key in returnExpeditorsStore.byOrdersDetailHeaders"
                  :key="key.key"
                >
                  <div v-if="key.key === 'order_number'">
                    {{ ++index }}
                  </div>
                  <div v-else-if="typeof data[key.key] === 'object'">
                    {{ data[key.key]?.name }}
                  </div>
                  <div
                    v-else
                    :class="{ 'text-end': typeof data[key.key] === 'number' }"
                  >
                    {{ getFormattedAmount(data[key.key]) }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </template>
        </data-table>
      </div>
    </flex-col>
  </d-modal>
</template>

<script setup lang="ts">
import type { ReportsExpeditorReturnByOrdersDetailModel } from "~/interfaces/api/reports/return-expeditors/by-orders-detail.model";
import { useI18n } from "vue-i18n";

// store
const returnExpeditorsStore = useReportsReturnExpeditorsStore("main");

// props
const props = defineProps<{
  id: string;
}>();

// emits
const emit = defineEmits(["closeDialog"]);

// state
const { t } = useI18n();
const detail = ref<ReportsExpeditorReturnByOrdersDetailModel[]>();
const activeCategoryId = ref<string>();

// hooks
const visualId = computed(
  () =>
    returnExpeditorsStore.byOrdersData?.items?.find(
      (order) => order.order_id === props.id,
    )?.visual_id,
);

const categories = computed(() => {
  if (!detail.value) return [];
  const categoryMap = new Map();
  detail.value.forEach((item) => {
    categoryMap.set(item.category.id, item.category);
  });
  return Array.from(categoryMap.values());
});

const products = computed(() => {
  if (!detail.value) return [];
  return detail.value
    .filter((item) => item.category.id === activeCategoryId.value)
    .flatMap((filteredItem) => filteredItem.products);
});

watchEffect(() => {
  if (categories.value.length) {
    activeCategoryId.value = categories.value[0].id;
  }
});

onMounted(async () => await getDetail());

// methods
const closeDialog = () => emit("closeDialog");

const getDetail = async () => {
  detail.value = await returnExpeditorsStore.getByOrdersDetailById(props.id);
};

const onChangeCategory = (newId: string) => (activeCategoryId.value = newId);
<\/script>
`;export{e as default};
