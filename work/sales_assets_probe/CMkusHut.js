const n=`<template>
  <d-modal
    :name="t('dashboard.combination_configuration')"
    :loading="currenciesStore.loadingExchangeRate"
    @closeDialog="closeDialog"
  >
    <div class="combination-container">
      <div v-if="isEmpty" class="empty-data">
        {{ t("empty") }}
      </div>

      <div
        class="option-item"
        v-for="item in exchangeRateCurrency"
        :key="item[0]?.from_base_currency?.id"
      >
        <div
          @click="
            changeCurrency(
              \`\${item[0]?.from_base_currency?.id}_\${item[0]?.to_base_currency?.id}\`,
            )
          "
          class="section"
        >
          <div
            :class="(item[0]?.show_on_filter && 'circle-active') || 'circle'"
          ></div>
          <div class="title">
            {{ item[0]?.from_base_currency?.name }} =>
            {{ item[0]?.to_base_currency?.name }}
          </div>
        </div>
        <div
          class="section"
          @click="
            changeCurrency(
              \`\${item[1]?.from_base_currency?.id}_\${item[1]?.to_base_currency?.id}\`,
            )
          "
        >
          <div
            :class="(item[1]?.show_on_filter && 'circle-active') || 'circle'"
          />
          <div class="title">
            {{ item[1]?.from_base_currency?.name }} =>
            {{ item[1]?.to_base_currency?.name }}
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <m-btn
        :loading="currenciesStore.loadingExchangeSave"
        class="w-full"
        @click="saveExchangeRateCurrency"
      >
        {{ t("save") }}
      </m-btn>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { notify } from "@kyvg/vue3-notification";

const emit = defineEmits(["closeDialog"]);

// stores
const currenciesStore = useBaseCurrenciesStore("main");

// State
const { t } = useI18n();
const exchangeRateCurrency = ref();

// hooks
const isEmpty = computed(() => !exchangeRateCurrency.value?.length);

// methods
onMounted(async () => {
  exchangeRateCurrency.value = await currenciesStore.getExchangeRate();
});

const closeDialog = () => {
  emit("closeDialog");
};

const changeCurrency = (id: string) => {
  exchangeRateCurrency.value = exchangeRateCurrency.value?.map((item: any) => {
    const [first, second] = item;

    if (
      \`\${first?.from_base_currency?.id}_\${first?.to_base_currency?.id}\` === id
    ) {
      first.show_on_filter = true;
      second.show_on_filter = false;
    } else if (
      \`\${second?.from_base_currency?.id}_\${second?.to_base_currency?.id}\` === id
    ) {
      first.show_on_filter = false;
      second.show_on_filter = true;
    }

    return item;
  });
};

const saveExchangeRateCurrency = async () => {
  const forSaveData = ref([]);
  exchangeRateCurrency.value?.map((item: any) => {
    if (item[0]?.show_on_filter) {
      forSaveData.value.push({
        show_on_filter: true,
        from_base_currency_id: item[0]?.from_base_currency?.id,
        to_base_currency_id: item[0]?.to_base_currency?.id,
      });
    } else if (item[1]?.show_on_filter) {
      forSaveData.value.push({
        show_on_filter: true,
        from_base_currency_id: item[1]?.from_base_currency?.id,
        to_base_currency_id: item[1]?.to_base_currency?.id,
      });
    }
  });
  if (forSaveData.value?.length === exchangeRateCurrency.value?.length) {
    await currenciesStore.saveExchangeRateCurrency(forSaveData.value);
    closeDialog();
  } else {
    notify({
      type: "error",
      title: \`\${t("labels.please_select_all_combinations")}!!!\`,
    });
  }
};
<\/script>

<style scoped lang="scss">
.combination-container {
  width: 100%;
  gap: 15px;
  display: flex;
  flex-wrap: wrap;
  column-gap: initial;

  .option-item {
    width: 100%;
    display: flex;
    align-items: center;
    border-radius: 8px;
    padding: 11px 26px;
    background: #f4f9f9;
    gap: 0px 20px;
    border: 1px solid #d2d7d7;

    .section {
      width: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: start;
      gap: 10px;

      .circle {
        border: 1px solid #d2d7d7;
        width: 18px;
        height: 18px;
        background-color: #fff;
        border-radius: 50%;
      }

      .circle-active {
        border: 1px solid #d2d7d7;
        width: 18px;
        height: 18px;
        background-color: #299b9b;
        padding: 1px;
        border-radius: 50%;

        .active {
          background-color: #299b9b;
          border-radius: 50%;
          width: 100%;
          height: 100%;
        }
      }

      .title {
        width: calc(100% - 50px);
        color: #424f4f;
        font-family: Inter, sans-serif;
        font-size: 14px;
        font-style: normal;
        font-weight: 400;
        line-height: 140%;
      }
    }
  }
}

::-webkit-scrollbar {
  width: 6px;
  border-radius: 28px;
  height: 8px;
}

::-webkit-scrollbar-track {
  height: 8px;
  background: #fafdfd;
  border-radius: 28px;
}

::-webkit-scrollbar-thumb {
  background: #299b9b;
  border-radius: 28px;
  height: 8px;
}
</style>
`;export{n as default};
