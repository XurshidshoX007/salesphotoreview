const n=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="data?.id ? t('edit') : t('clients.add')"
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-5">
        <shared-localized-input
          required
          :label="t('column.name')"
          v-model:base="data.default_name"
          v-model:translations="data.name_l10n"
        />
        <d-input
          :label="t('labels.sort')"
          type="number"
          pattern-type="sort"
          :value="data.sort"
          @change="data.sort = $event"
        />
        <d-input
          :label="t('column.code')"
          pattern-type="code"
          :value="data.code"
          @change="data.code = $event"
        />
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="data.default_description"
          v-model:translations="data.description_l10n"
        />
        <SharedProductsByCategorySelection
          type="productCategories"
          :categories="productCategories?.items"
          :products="products"
          :selectedProducts="data.product_id_arr"
          @onAllSelect="onAllSelect"
          @onSelect="selectProduct"
          @selectAllCheckboxFunction="selectAllCheckboxFunction"
        />
        <Switch :active="data.is_active" @change="data.is_active = $event" />
      </flex-col>
      <template #footer>
        <m-btn :loading="isLoadingBtn" class="w-full" type="submit">
          {{ data?.id ? t("save") : t("clients.add") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import type { ProductsModel } from "~/interfaces/api/settings/products-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import { defaultDropdownParams } from "~/variable/params";
import type { ProductCategoryModel } from "~/interfaces/api/settings/product-category-model";

// Store
const tarasActiveStore = useTarasStore("main");
const dialogStore = useDialogStore("taras");
// Props and Emit
const emit = defineEmits(["closeDialog"]);
// props
import { useI18n } from "vue-i18n";

// State
const { t } = useI18n();
const isLoadingBtn = ref(false);
const products = ref<DropdownItemsModelByType<ProductsModel>>();
const productCategories = ref<DropdownItemsModelByType<ProductCategoryModel>>();
const checkProduct = ref(false);

const productsParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});

const productCategoriesParams = ref<defaultDropdownParamsType>({
  ...defaultDropdownParams,
});

type SelectedProduct = { product_id: string; product_name?: string };

const data = ref<{
  id?: string;
  name: string | null;
  default_name: string;
  name_l10n: Record<string, string>;
  code: string | null;
  description: string | null;
  default_description: string;
  description_l10n: Record<string, string>;
  sort: number | null;
  product_id_arr: SelectedProduct[];
  is_active: boolean;
}>({
  id: undefined,
  name: null,
  default_name: "",
  name_l10n: {},
  code: null,
  description: null,
  default_description: "",
  description_l10n: {},
  sort: null,
  product_id_arr: [],
  is_active: true,
});

// hooks
onBeforeMount(async () => {
  if (dialogStore.singleData !== null) {
    const detail = await tarasActiveStore.getDetail(dialogStore.singleData.id);
    if (detail) {
      data.value = {
        ...data.value,
        ...(detail as any),
      };
    }
    data.value.product_id_arr = (data.value.product_id_arr || []).map(
      (item: any) => {
        return typeof item === "string" ? { product_id: item } : item;
      },
    );
  }
});

onMounted(async () => {
  await Promise.all([getProducts(), getProductCategories()]);
});

// methods
const closeDialog = () => emit("closeDialog");

const onAllSelect = async (
  categoryId: string,
  type: string,
  isChecked: boolean,
) => {
  const filteredProductIds = products.value?.items
    .filter((product: any) => product?.category?.id === categoryId)
    ?.map((product) => {
      return {
        id: product.id,
        name: product.name,
      };
    });

  if (!isChecked) {
    data.value.product_id_arr = data.value.product_id_arr.filter(
      (product) =>
        !filteredProductIds?.find((r) => r.id === product.product_id),
    );
  } else {
    data.value.product_id_arr = [
      ...data.value.product_id_arr,
      ...(filteredProductIds || [])
        .filter((id) => id.id !== undefined && id.id !== null)
        .map((id) => ({
          product_id: String(id.id),
          product_name: id.name,
        })),
    ];
  }
};
const selectProduct = (id: any, index: any) => {
  if (data.value.product_id_arr.find((i) => i.product_id === id)) {
    data.value.product_id_arr.splice(index, 1);
    checkProduct.value = false;
  } else {
    data.value.product_id_arr.push({ product_id: id });
    checkProduct.value = true;
  }
};

const save = async (e: any) => {
  e.preventDefault();
  const payload = {
    ...data.value,
    product_id_arr: data.value.product_id_arr?.map((item) => {
      return item.product_id;
    }),
  };
  await tarasActiveStore.add(payload as any);
  await tarasActiveStore.refresh();
  notify({ title: t("saved"), type: "success" });
  dialogStore.closeDialog();
};

const getProducts = async () => {
  products.value = await tarasActiveStore.getProducts(productsParams.value);
};

const getProductCategories = async () => {
  productCategories.value = await tarasActiveStore.getProductCategory(
    productCategoriesParams.value,
  );
};
const selectAllCheckboxFunction = async (type: string, isChecked: boolean) => {
  productCategories?.value?.items.map((item: any) => {
    onAllSelect(item.id, type, isChecked);
  });
};
<\/script>
`;export{n as default};
