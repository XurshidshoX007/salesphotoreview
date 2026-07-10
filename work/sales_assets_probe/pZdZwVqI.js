const e=`<template>
  <form @submit.prevent="getRecommendationsByCost" class="flex flex-col gap-5">
    <flex-row class="items-center gap-5">
      <flex-row class="items-center flex-wrap gap-4">
        <div class="w-50">
          <DropdownsByFilterStates :filter-states="currencyFilterStates" />
        </div>
        <flex-row>
          <DInput
            required
            type="number"
            :value="targetSum"
            :label="t('cash.expeditor_debt.target_sum')"
            class="w-50 target-sum-input"
            @change="targetSum = $event"
          />
          <m-btn
            type="submit"
            group="blue"
            class="search-recommendation-btn"
            :loading="isRecommendationsLoading"
            >{{ t("cash.expeditor_debt.search_recommendation") }}</m-btn
          >
        </flex-row>
      </flex-row>
    </flex-row>
    <flex-row
      v-show="recommendationMenuItems.length"
      class="items-center gap-4 flex-wrap"
    >
      <page-title-20
        :title="t('cash.expeditor_debt.recommendations_by_cost') + ':'"
      />
      <FlexibleItemsMenu
        indicator-mode
        :loading="isRecommendationsLoading"
        :auto-select="false"
        :items-arr="recommendationMenuItems"
        :active-item-id="activeRecommendationId"
        @on-change-active-item="setActiveRecommendationId"
      />
    </flex-row>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { WriteOffRecomendationByCostModel } from "~/interfaces/api/cashboxes/expeditor-debt-model";
import type { BaseCurrencyModel } from "~/interfaces/api/settings/base-currency-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import { defaultDropdownParams } from "~/variable/params";

// props
const props = defineProps<{
  expId: string;
}>();

// emits
const emit = defineEmits<{
  (e: "on-change-currency-id", currencyId: string): void;
  (
    e: "on-set-recommendation-write-offs",
    recommendation:
      | WriteOffRecomendationByCostModel["write_off_products"]
      | null,
  ): void;
}>();

// store
const expeditorDebtStore = useExpeditorDebtStore("main");

const { t } = useI18n();
const targetSum = ref<number | null>(null);
const recommendationsByCost = ref<WriteOffRecomendationByCostModel[]>();
const isRecommendationsLoading = ref(false);
const activeRecommendationId = ref<string>("");

const currencies = ref<DropdownItemsModelByType<BaseCurrencyModel>>();
const selectedCurrencyId = ref<string>("");
const isCurrenciesLoading = ref(false);
const currencyFilterStates = ref([
  {
    name: t("column.currency"),
    key: "currencies",
    isSingleSelect: true,
    required: true,
    get isLoading() {
      return isCurrenciesLoading.value;
    },
    get data() {
      return currencies.value || [];
    },
    get getSelectedData() {
      return selectedCurrencyId.value;
    },
    set setSelectedData(value: string) {
      selectedCurrencyId.value = value;
    },
  },
]);

// hooks
onMounted(async () => {
  await getCurrencies();
  autoSelectDefaultCurrency();
});

watch(selectedCurrencyId, async (newCurrencyId) => {
  if (newCurrencyId) {
    emit("onChangeCurrencyId", newCurrencyId);
  }
});

const recommendationMenuItems = computed(() => {
  return (
    recommendationsByCost.value?.map((item, index) => ({
      id: index.toString(),
      name: getFormattedAmount(item.recommended_cost.toString()),
    })) || []
  );
});

// methods
const setActiveRecommendationId = (id: string) => {
  activeRecommendationId.value = id; // id = index of the recommendation
  const recommendation = recommendationsByCost.value?.[parseInt(id)];
  if (recommendation)
    emit("on-set-recommendation-write-offs", recommendation.write_off_products);
  else emit("on-set-recommendation-write-offs", null);
};

const getRecommendationsByCost = async () => {
  setActiveRecommendationId(""); // Reset active recommendation
  isRecommendationsLoading.value = true;
  recommendationsByCost.value = await expeditorDebtStore.getRecomendationByCost(
    props.expId,
    selectedCurrencyId.value,
    targetSum.value!,
  );
  isRecommendationsLoading.value = false;
};

const getCurrencies = async () => {
  isCurrenciesLoading.value = true;
  currencies.value = await expeditorDebtStore.getCurrencies(
    defaultDropdownParams,
  );
  isCurrenciesLoading.value = false;
};

const autoSelectDefaultCurrency = () => {
  if (currencies.value) {
    selectedCurrencyId.value =
      currencies.value?.items.find((item) => item.is_default)?.id ||
      currencies.value.items[0]?.id ||
      "";
  }
};
<\/script>

<style scoped lang="scss">
:deep(.target-sum-input input) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  border-right: none;
}

:deep(.search-recommendation-btn) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  border-left: none;

  &:hover {
    border-left: none;
  }
}
</style>
`;export{e as default};
