const e=`<template>
  <div>
    <div class="rounded-lg bg-white border-grey overflow-hidden">
      <div class="overflow-auto">
        <data-table
          withInformationAboveHeader
          :headers="templates"
          :is-empty="!bonusData?.length"
        >
          <template #body>
            <template v-for="(data, index) in bonusData" :key="index">
              <c-tr>
                <c-td-no-edit
                  v-for="key in templates"
                  :key="key"
                  :is-checked="key.checked"
                  :header-key="key.key"
                  class="border-r-1"
                >
                  <div v-if="key.key === 'modified_date'">
                    {{ getFormattedDate(data[key.key], "YYYY.MM.DD hh:mm") }}
                  </div>
                  <div v-else-if="key.key === 'bonus'">
                    {{ data[key.key]?.name }}
                  </div>
                  <div v-else-if="key.key === 'product'">
                    {{ data[key.key]?.name }}
                  </div>
                  <div v-else-if="key.key === 'count'" class="text-end">
                    {{ getFormattedAmount(data[key.key]) }}
                  </div>
                  <div v-else-if="key.key === 'bonus_product_state'">
                    {{ data[key.key]?.name }}
                  </div>
                  <div v-else-if="key.key === 'author'" class="text-end">
                    {{ data[key.key]?.name }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </template>
        </data-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";

const props = defineProps({
  bonusData: Array,
});
const { t } = useI18n();
const templates = ref([
  {
    name: t("column.date"),
    checked: true,
    key: "modified_date",
    borderX: true,
    is_sortable: false,
  },
  {
    name: t("column.bonus_name"),
    checked: true,
    key: "bonus",
    borderX: true,
    is_sortable: false,
  },
  {
    name: t("settings_sidebar.products"),
    checked: true,
    key: "product",
    borderX: true,
    is_sortable: false,
  },
  {
    name: t("column.quantity"),
    checked: true,
    key: "count",
    right: true,
    borderX: true,
    is_sortable: false,
  },
  {
    name: t("column.action"),
    checked: true,
    key: "bonus_product_state",
    borderX: true,
    is_sortable: false,
  },
  {
    name: t("column.executor"),
    checked: true,
    key: "author",
    right: true,
    is_sortable: false,
  },
]);
<\/script>

<style scoped>
tr:last-child {
  border-bottom: none;
}
td:last-child {
  border-right: none;
}
</style>
`;export{e as default};
