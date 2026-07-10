const n=`<template>
  <div class="slider-range-container">
    <div class="gap-4 mb-2 grid grid-cols-2">
      <div class="flex gap-2 border-b-1 items-center">
        <span class="fs-14 text-gray-400"> {{ t("filters.from") }} </span>
        <d-input
          type="number"
          without-style
          style="min-width: 100px"
          :value="rangeAmountValue[0]"
          :max="max || 1000000000000000"
          @change="rangeAmountValue[0] = $event"
        />
      </div>
      <div class="flex gap-2 border-b-1 items-center">
        <span class="text-gray-400"> {{ t("filters.to") }} </span>
        <d-input
          type="number"
          without-style
          style="min-width: 100px"
          :max="max || 1000000000000000"
          :value="rangeAmountValue[1]"
          @change="rangeAmountValue[1] = $event"
        />
      </div>
    </div>
    <div class="slider-range-container-slider">
      <VueSlider
        v-model="rangeAmountValue"
        :max="max"
        :min="min"
        :tooltip-formatter="(val) => getFormattedAmount(val)"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VueSlider from "vue-3-slider-component";
import { useI18n } from "vue-i18n";
import { getFormattedAmount } from "~/utils/filter";
import { sliderSummaFromToState } from "~/variable/column-constants";

// props
const props = defineProps<{
  rangeAmount: number[];
  min: number;
  max: number;
  filterStorageKey?: string;
}>();
// emits
const emit = defineEmits(["onRangeAmount", "addSliderFilterState"]);

// state
const { t } = useI18n();
const rangeAmountValue = ref(props.rangeAmount);

// methods

const isChecked = (key: string) => {
  if (savedFilterStatesByKey.value[key]?.checked === undefined) return true;
  return savedFilterStatesByKey.value[key]?.checked;
};

const addAmountSlider = () => {
  emit("addSliderFilterState", [dropdownsBySliderState.value]);
};
// hooks
const savedFilterStatesByKey = computed(
  (): Record<string, { name: string; checked: boolean }> => {
    if (!props.filterStorageKey) return {};
    const checkedFilters = getCheckedItemsByKey(props.filterStorageKey);
    return checkedFilters || {};
  },
);

const dropdownsBySliderState = computed(() => {
  return {
    key: sliderSummaFromToState,
    name: t("labels.summa_from_to"),
    checked: isChecked(sliderSummaFromToState),
    hide: true,
  };
});

watch(
  () => rangeAmountValue.value,
  () => {
    emit("onRangeAmount", rangeAmountValue.value);
  },
);

onMounted(() => {
  addAmountSlider();
});
<\/script>

<style lang="scss" scoped>
.vue-slider-process {
  background: #299b9b !important;
}

.vue-slider-dot-tooltip-inner {
  background: #299b9b !important;
  border-color: #299b9b !important;
}

.vue-slider-rail {
  background: #e1e4e4 !important;
}

.slider-range-container {
  input {
    background: transparent !important;
  }
  input:focus {
    background: transparent !important;
  }
}

@media only screen and (max-width: 767px) {
  .slider-range-container {
    .slider-range-container-slider {
      padding: 0 36px;
    }
  }
}
</style>
`;export{n as default};
