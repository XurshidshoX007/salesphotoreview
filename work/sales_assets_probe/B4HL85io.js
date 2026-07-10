const n=`<template>
  <rounded-white-container without-padding class="p-5 gap-2.5">
    <div class="text-neutral-950 font-medium">
      {{ t("settings.discount.discount_term") }}
    </div>
    <flex-col v-for="(term, index) in terms" :key="index" class="gap-4">
      <flex-col class="gap-2.5">
        <div class="text-sm text-neutral-950">
          {{ t("condition") }} ({{ index + 1 }})
        </div>
        <flex-row class="items-center gap-4">
          <d-input
            type="number"
            :disabled="props.disabled"
            required
            :label="t('settings.discount.min_count_in_order')"
            :value="term.min"
            class="flex-1"
            @change="term.min = $event"
          />
          <d-input
            type="number"
            :disabled="props.disabled"
            required
            :label="t('settings.discount.max_count_in_order')"
            :value="term.discount_count_limit"
            class="flex-1"
            @change="term.discount_count_limit = $event"
          />
          <d-input
            type="number"
            :disabled="props.disabled"
            required
            :label="t('settings.discount.category_count')"
            :value="term.min_product_category_count"
            class="flex-1"
            @change="term.min_product_category_count = $event"
          />
          <d-input
            type="number"
            :disabled="props.disabled"
            required
            :max="100"
            :min="0"
            :label="t('settings.discount.discount_percentage')"
            :value="term.rebate"
            class="flex-1"
            @change="term.rebate = $event"
          >
            <template #suffix>%</template>
          </d-input>

          <IconTrash
            v-if="index !== 0"
            :size="22"
            class="text-red-600 cursor-pointer"
            @click="removeTerm(index)"
          />
        </flex-row>
      </flex-col>
    </flex-col>
    <div>
      <m-btn
        group="outlined"
        :disabled="props.disabled"
        @click="addTerm"
        class="justify-self-end"
        >{{ t("add_more") }} <IconPlus />
      </m-btn>
    </div>
  </rounded-white-container>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// types
type EmptyTermType = {
  min: number | null;
  rebate: number | null;
  discount_count_limit: number | null;
  min_product_category_count: number | null;
};

// props
const props = defineProps<{
  initialTermsInfo?: DiscountTermsModel[];
  disabled?: boolean;
}>();

// emits
const emit = defineEmits<{
  (e: "updateTerms", value: DiscountTermsModel[]): void;
}>();

// states
const { t } = useI18n();

const createEmptyTerm = (): EmptyTermType => ({
  min: null,
  rebate: null,
  discount_count_limit: null,
  min_product_category_count: null,
});

const cloneTerms = (value?: DiscountTermsModel[]) =>
  value?.map((term) => ({ ...term })) || [];

const terms = ref<(DiscountTermsModel | EmptyTermType)[]>([createEmptyTerm()]);

// hooks
const emitTerms = computed<DiscountTermsModel[]>(() =>
  terms.value.filter(
    (t): t is DiscountTermsModel =>
      t.min !== null &&
      t.rebate !== null &&
      t.discount_count_limit !== null &&
      t.min_product_category_count !== null,
  ),
);

watch(
  () => props.initialTermsInfo,
  (value) => {
    const nextTerms = cloneTerms(value);
    terms.value = nextTerms.length ? nextTerms : [createEmptyTerm()];
  },
  { deep: true, immediate: true },
);

watch(
  emitTerms,
  (value) => {
    emit("updateTerms", value);
  },
  { deep: true },
);

// methods
const addTerm = () => {
  if (props.disabled) return;
  terms.value.push({
    min: null,
    rebate: null,
    discount_count_limit: null,
    min_product_category_count: null,
  });
};

const removeTerm = (index: number) => {
  if (props.disabled) return;
  terms.value.splice(index, 1);
};
<\/script>
`;export{n as default};
