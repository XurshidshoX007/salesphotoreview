const n=`<template>
  <rounded-white-container class="flex flex-col justify-between">
    <div class="h-full">
      <div class="flex items-center justify-between py-2">
        <page-title20 :title="title" />
        <div>
          <nuxt-link
            :to="{
              path: '/orders/orders/details',
              query: { ...route.query, detailType: orderType },
            }"
          >
            <m-btn>{{ t("orders.view") }}</m-btn>
          </nuxt-link>
        </div>
      </div>
      <div class="bg-white rounded-lg relative w-full border">
        <div class="overflow-auto rounded-lg">
          <data-table
            :headers="headers"
            :loading="isLoading"
            :is-empty="!products?.length"
            withInformationAboveHeader
          >
            <template #body>
              <c-tr v-for="(data, index) in products" :key="data">
                <c-td-no-edit v-for="key in headers" :key="key">
                  <div>
                    <div v-if="key.key === 'no'">{{ ++index }}</div>
                    <div v-if="typeof data[key.key] === 'object'">
                      {{ data[key.key]?.name }}
                    </div>
                    <div v-else>{{ data[key.key] }}</div>
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
            <template #footer>
              <c-tr v-if="!!products?.length" class="border-b-0 bg-[#FAFDFD]">
                <c-td-no-edit v-for="key in headers">
                  <div v-if="key.key === 'no'" class="fs-14 font-semibold">
                    {{ t("column.total") }}
                  </div>
                  <div
                    v-else-if="key.key === 'count'"
                    class="fs-14 font-semibold"
                  >
                    <div class="fs-14 font-semibold">
                      {{ totalAmounts?.count }} шт
                    </div>
                  </div>
                  <div
                    v-else-if="key.key === 'cost'"
                    class="fs-14 font-semibold"
                  >
                    {{ getFormattedAmount(totalAmounts?.cost) }} сум
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </data-table>
        </div>
      </div>
    </div>
  </rounded-white-container>
</template>

<script setup>
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";

// state
const { t } = useI18n();
const route = useRoute();

// props
const props = defineProps({
  orderType: Number,
  title: String,
  totalAmounts: Object,
  headers: Array,
  products: Array,
  isLoading: Boolean,
});
<\/script>
`;export{n as default};
