const e=`<template>
  <form @submit.prevent="onSave">
    <d-modal
      :name="t('settings.create_markup_cash')"
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-5">
        <DropdownsByFilterStates
          :filterStates="filterStates"
          @onOpenDropdown="filterStore.onOpenDropdown"
          @search="filterStore.onSearchDropdown"
        />
        <d-input
          :label="t('settings.percent')"
          type="number"
          :value="rate"
          required
          @change="rate = $event"
        />
      </flex-col>
      <template #footer>
        <m-btn class="w-full" type="submit" :loading="priceStore.loadingSave">
          {{ t("clients.add") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useSettingsPriceAccess } from "~/composables/access/settings/price/price";

// Store
const priceStore = usePriceStore("true");
const filterStore = useFiltersStore("/settings/prices/add");

// emits
const emit = defineEmits(["closeDialog"]);

// State
const { t } = useI18n();
const rate = ref();
const roundingAccuraccies = ref({
  items: [
    {
      id: 100,
      name: "100",
    },
    {
      id: 10,
      name: "10",
    },
    {
      id: 0,
      name: "0",
    },
    {
      id: 0.1,
      name: "0.1",
    },
    {
      id: 0.01,
      name: "0.01",
    },
  ],
});

const selectedRoundingAccuraccies = ref(0.01);

let filterStates = ref([
  {
    name: t("settings_sidebar.price_type"),
    key: "price-type",
    isSingleSelect: true,
    required: true,
    get data() {
      return filterStore.priceTypes || [];
    },
    get getSelectedData() {
      return filterStore.selectedSinglePriceTypes;
    },
    set setSelectedData(value: string) {
      filterStore.selectedSinglePriceTypes = value;
    },
  },
  {
    name: t("settings_sidebar.product_category"),
    key: "product-category",
    required: true,
    get data() {
      return filterStore.productCategory || [];
    },
    get getSelectedData() {
      return filterStore.selectedProductCategorieis;
    },
    set setSelectedData(value: string[]) {
      filterStore.selectedProductCategorieis = value;
    },
  },
  {
    name: t("column.method"),
    key: "price-method",
    isSingleSelect: true,
    required: true,
    get data() {
      return filterStore.priceMethod || [];
    },
    get getSelectedData() {
      return filterStore.selectedPriceMethod;
    },
    set setSelectedData(value: string) {
      filterStore.selectedPriceMethod = value;
    },
  },
  {
    name: t("column.rounding_method"),
    key: "rounding-method",
    isSingleSelect: true,
    required: true,
    get data() {
      return filterStore.roundingMethod || [];
    },
    get getSelectedData() {
      return filterStore.selectedRoundingMethod;
    },
    set setSelectedData(value: string) {
      filterStore.selectedRoundingMethod = value;
    },
  },
  {
    name: t("column.rounding_accuracy"),
    key: "rounding-method",
    isSingleSelect: true,
    required: true,
    get data() {
      return roundingAccuraccies.value || [];
    },
    get getSelectedData() {
      return selectedRoundingAccuraccies.value;
    },
    set setSelectedData(value: number) {
      selectedRoundingAccuraccies.value = value;
    },
  },
]);

// Hooks
onMounted(async () => {
  await filterStore.getPriceTypes();
  await filterStore.getRoundingMethods();
});

const onSave = async () => {
  const data = {
    price_type_id: filterStore.selectedSinglePriceTypes,
    product_category_id_arr: filterStore.selectedProductCategorieis,
    set_price_method: filterStore.selectedPriceMethod,
    rate: rate.value,
    midpoint_rounding: filterStore.selectedRoundingMethod,
    rounding_accuracy: selectedRoundingAccuraccies.value,
  };

  await priceStore.setMarginPrice(data);
  closeDialog();
};

const closeDialog = () => emit("closeDialog");
<\/script>
`;export{e as default};
