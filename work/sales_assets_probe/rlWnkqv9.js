const t=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title20 :title="t('sidebar.day_visit_report')" />
      <MonthPicker
        @change-month="changeMonthPicker"
        @changeFormatDate="changeFormat"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useReportDailyVisitStore } from "~/stores/reports/visits/dail-visit-report";

const emit = defineEmits(["onSetFilters", "changeFormat"]);

// store
const reportDailyVisitStore = useReportDailyVisitStore("main");

// States

const { t } = useI18n();

// Methods
const changeFormat = (format: string) => {
  emit("changeFormat", format);
};

const changeMonthPicker = (month_year: { year: number; month: number }) => {
  if (month_year) {
    reportDailyVisitStore.params.Year = month_year.year;
    reportDailyVisitStore.params.Month = month_year.month;
  }
};
<\/script>
`;export{t as default};
