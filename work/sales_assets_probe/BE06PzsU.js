const n=`<template>
  <form @submit.prevent="save">
    <d-modal
      :name="props.id ? t('edit') : t('clients.add')"
      :loading="productActiveStore.loadingUpdate"
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
          @change="(value) => (data.sort = value)"
        />
        <DropdownsByFilterStates
          :filterStates="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="data.default_description"
          v-model:translations="data.description_l10n"
        />
        <Switch :active="data.is_active" @change="onChangeActive" />
      </flex-col>
      <template #footer>
        <m-btn :loading="saveLoading" class="w-full" type="submit">
          {{ props.id ? t("save") : t("clients.add") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import type { DropdownsByFilterStates } from "#components";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { ProductCategoryModel } from "~/interfaces/api/settings/product-category-model";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import { useI18n } from "vue-i18n";
import {
  dropdownParamsAll,
  productCategoryDropdownParams,
} from "~/variable/params";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { notify } from "@kyvg/vue3-notification";

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// store
const productActiveStore = useCategoryGroupsStore("main");

// state
const { t } = useI18n();
const eventBus = useEventBus();
const saveLoading = ref(false);
const productCategory = ref<DropdownItemsModelByType<ProductCategoryModel>>();
const updateListEventKey =
  SettingsEventKeys.PRODUCT_CATEGORY_GROUP_CATEGORY_TABLE_UPDATE;

const dropdownParams = ref(
  props.id
    ? {
        ...dropdownParamsAll,
        filter: [
          ...(dropdownParamsAll.filter || []),
          {
            field: "is_sub_category",
            value: ["false"],
          },
        ],
      }
    : { ...productCategoryDropdownParams },
);

const productCategoryParams = ref<defaultDropdownParamsType>(
  dropdownParams.value,
);

const data = ref({
  is_active: true,
  id: undefined,
  name: "",
  default_name: "",
  name_l10n: {},
  category_id_arr: [] as string[],
  categories: [] as Array<{ category_id: string }>,
  sort: null,
  description: null,
  default_description: "",
  description_l10n: {},
});
const initialDetailData = ref();

const filterStates = ref([
  {
    name: t("column.category"),
    key: "product-category",
    required: true,
    get data() {
      return productCategory.value || [];
    },
    get getSelectedData() {
      return data.value.category_id_arr;
    },
    set setSelectedData(value: string[]) {
      data.value.category_id_arr = value;
    },
  },
]);

// hooks
const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

onBeforeMount(async () => {
  if (props.id) {
    await Promise.all([getDetail(), getProductCategory()]);
  }
});

// Methods
const updateListByActiveState = (isActive: boolean) => {
  if (isActiveStateChangedOnEdit.value) {
    eventBus.emit(updateListEventKey, !isActive);
    emit("clearFetchedTab", !isActive);
    return;
  }
  eventBus.emit(updateListEventKey, isActive);
};

const closeDialog = () => {
  emit("closeDialog");
};

const onChangeActive = (value: boolean) => {
  data.value.is_active = value;
};

const onOpenDropdown = async (key: string) => {
  if (key === "product-category" && !productCategory.value) {
    await getProductCategory();
  }
};

const getProductCategory = async () => {
  productCategory.value = await productActiveStore.getProductCategory(
    productCategoryParams.value,
  );
};

const getDetail = async () => {
  initialDetailData.value = await productActiveStore.getDetailData(props.id!);

  data.value = {
    ...initialDetailData.value,
    category_id_arr: initialDetailData.value?.categories?.map(
      (item: { id: string }) => {
        return item.id;
      },
    ),
  };
};

const save = async () => {
  saveLoading.value = true;
  const payload = {
    ...data.value,
    categories: data.value.category_id_arr.map((category_id) => ({
      category_id,
    })),
  };
  const res = await productActiveStore.add(payload as any);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active);
    notify({ title: t("saved"), type: "success" });
    closeDialog();
  }
  saveLoading.value = false;
};
<\/script>
`;export{n as default};
