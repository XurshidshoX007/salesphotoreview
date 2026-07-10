const e=`<template>
  <div>
    <form @submit.prevent="onSave">
      <flex-col class="page-gap">
        <div class="flex items-center justify-between flex-wrap">
          <page-title :title="t('cash.exchange_rates')" />

          <div v-if="allowToEdit" class="flex justify-end items-center">
            <div v-if="editState" class="flex flex-row gap-x-4 items-center">
              <m-btn group="outlined" @click="changeEditState">
                {{ t("reports.cancel") }}
              </m-btn>

              <m-btn :loading="isBtnLoading" type="submit">{{
                t("save")
              }}</m-btn>
            </div>
            <m-btn v-else @click="changeEditState">{{ t("edit") }} </m-btn>
          </div>
        </div>
        <div class="table-content-container overflow-hidden">
          <div class="table-content-body exchange-table-body">
            <data-table
              :headers="exchangeRateStore.headers"
              :loading="exchangeRateStore.isLoading"
              :isEmpty="!exchangeRateStore.data?.length"
              with-information-above-header
            >
              <template #body>
                <template
                  v-for="(data, index) in exchangeRateStore.data"
                  :key="data?.id"
                >
                  <c-tr>
                    <c-td-no-edit
                      v-for="key in exchangeRateStore.headers"
                      :key="key"
                      :is-checked="key.checked"
                      :type="key.type"
                    >
                      <div v-if="key.key === 'sell_rate'">
                        <div class="flex items-center gap-x-2" v-if="editState">
                          <div>
                            1 {{ data?.from_base_currency?.name }}
                            <span>=</span>
                          </div>
                          <d-input
                            type="number"
                            :value="data[key.key]"
                            :required="data[key.key] <= 0"
                            min="0"
                            class="w-fit"
                            @change="data[key.key] = $event"
                            status="test"
                          />
                          {{ data?.to_base_currency?.name }}
                        </div>
                        <div v-else>
                          1 {{ data?.from_base_currency?.name }} =
                          {{ getFormattedAmount(data[key.key]) }}
                          {{ data?.to_base_currency?.name }}
                        </div>
                      </div>
                      <div v-else-if="key.key === 'purchase_rate'">
                        <div v-if="editState" class="flex items-center gap-x-2">
                          <d-input
                            type="number"
                            :value="data[key.key]"
                            :required="data[key.key] <= 0"
                            min="0"
                            class="w-fit"
                            @change="data[key.key] = $event"
                            status="test"
                          />
                          <div>
                            {{ data?.to_base_currency?.name }}
                            <span
                              >= 1 {{ data?.from_base_currency?.name }}</span
                            >
                          </div>
                        </div>
                        <div v-else>
                          {{ getFormattedAmount(data[key.key]) }}
                          {{ data?.to_base_currency?.name }} = 1
                          {{ data?.from_base_currency?.name }}
                        </div>
                      </div>
                      <div v-else>
                        {{ data[key.key] }}
                      </div>
                    </c-td-no-edit>
                  </c-tr>
                </template>
              </template>
            </data-table>
          </div>
        </div>
      </flex-col>
    </form>
  </div>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";

// stores
const exchangeRateStore = useExchangeRateStore("main");

const props = defineProps<{
  allowToEdit: boolean;
}>();

// states
const { t } = useI18n();
const isBtnLoading = ref<boolean>(false);
const editState = ref(false);

// hooks
onMounted(async () => await exchangeRateStore.getData());

// methods
const onSave = async () => {
  const invalidRates = exchangeRateStore.data!.some(
    ({ sell_rate, purchase_rate }) => sell_rate <= 0 || purchase_rate <= 0,
  );

  if (invalidRates) {
    return;
  }

  isBtnLoading.value = true;
  const data = exchangeRateStore.data!.map(
    ({ from_base_currency, to_base_currency, sell_rate, purchase_rate }) => ({
      from_base_currency_id: from_base_currency.id,
      to_base_currency_id: to_base_currency.id,
      sell_rate,
      purchase_rate,
    }),
  );

  const resStatus = await exchangeRateStore.add(data);
  await exchangeRateStore.refresh();
  isBtnLoading.value = false;

  if (resStatus && resStatus > 199 && resStatus < 300) {
    notify({ title: t("saved"), type: "success" });
  } else {
    notify({ title: t("error"), type: "error" });
  }
  changeEditState();
};

const changeEditState = () => {
  editState.value = !editState.value;
};
<\/script>

<style scoped>
.exchange-table-body {
  padding-bottom: 0 !important;
}
</style>
`;export{e as default};
