const e=`<template>
  <div class="w-full relative">
    <div
      v-if="!loading"
      class="flex min-h-[100px] w-full flex-col justify-between rounded-xl border border-neutral-200 bg-white px-4 py-1"
    >
      <div
        v-for="row in detailRows"
        :key="row.label"
        class="flex min-h-[52px] w-full items-center justify-between gap-4 border-b border-neutral-200 last:border-b-0"
      >
        <div class="px-0 text-sm font-normal text-neutral-600">
          {{ row.label }}
        </div>

        <Tag
          color="gray"
          size="large"
          class="max-w-[60%] justify-center overflow-hidden text-ellipsis rounded-lg border-neutral-200 px-2.5 font-normal text-neutral-950"
        >
          {{ row.value }}
        </Tag>
      </div>
    </div>
    <div
      v-else
      class="flex min-h-[100px] w-full flex-col justify-between rounded-xl border border-neutral-200 bg-white px-4 py-1"
    >
      <div
        v-for="row in skeletonRows"
        :key="row"
        class="flex min-h-[52px] w-full items-center justify-between gap-4 border-b border-neutral-200 last:border-b-0"
      >
        <div class="px-0 text-sm font-normal text-neutral-600">
          {{ row }}
        </div>
        <div class="w-47">
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
const productsStore = useProductsStore("");

// props
const props = defineProps<{
  id: string;
}>();

// state
const { t } = useI18n();
const loading = ref(false);
const detailData = ref<ProductsModel & Record<string, any>>();

const fallbackValue = (value: unknown) => {
  return value === null || value === undefined || value === "" ? "-" : value;
};

const fallbackBoolean = (
  value: unknown,
  trueText: string,
  falseText: string,
) => {
  if (value === true) return trueText;
  if (value === false) return falseText;

  return "-";
};

const detailRows = computed(() => [
  {
    label: t("labels.name"),
    value: fallbackValue(
      detailData.value?.default_name || detailData.value?.name,
    ),
  },
  {
    label: t("active"),
    value: fallbackBoolean(
      detailData.value?.is_active,
      t("active"),
      t("not_active"),
    ),
  },
  {
    label: t("column.category"),
    value: fallbackValue(detailData.value?.category?.name),
  },
  {
    label: t("settings_sidebar.units"),
    value: fallbackValue(
      detailData.value?.unit?.name || detailData.value?.unit?.id,
    ),
  },
  {
    label: t("labels.quantity_in_package"),
    value: fallbackValue(detailData.value?.quantity_in_package),
  },
  {
    label: t("labels.weight"),
    value: fallbackValue(detailData.value?.weight),
  },
  {
    label: t("labels.sort"),
    value: fallbackValue(detailData.value?.sort),
  },
  {
    label: t("column.volume"),
    value: fallbackValue(detailData.value?.volume),
  },
  {
    label: t("settings_sidebar.sales_channel"),
    value: fallbackValue(detailData.value?.sales_channel?.name),
  },
  {
    label: t("labels.box_type"),
    value: fallbackValue(detailData.value?.box_type?.name),
  },
  {
    label: t("column.code"),
    value: fallbackValue(detailData.value?.code),
  },
  {
    label: t("column.sap_code"),
    value: fallbackValue(detailData.value?.sub_code),
  },
  {
    label: t("labels.bar_code"),
    value: fallbackValue(detailData.value?.bar_code),
  },
  {
    label: t("column.ikpu_code"),
    value: fallbackValue(detailData.value?.ikpu_code),
  },
  {
    label: t("column.tnved"),
    value: fallbackValue(detailData.value?.tnved_code),
  },
  {
    label: t("column.mml"),
    value: fallbackBoolean(detailData.value?.mml, "Есть", "Нет"),
  },
]);

const skeletonRows = ref([
  t("labels.name"),
  t("settings.valid"),
  t("column.bonus_type"),
]);

onMounted(async () => {
  loading.value = true;
  detailData.value = await productsStore.getById(props.id);
  loading.value = false;
});
<\/script>
`;export{e as default};
