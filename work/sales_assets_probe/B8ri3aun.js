const n=`<template>
  <div class="filter-content-container">
    <div class="filter-content-header">
      <page-title :title="t('plan.setting_plans.setting_plans')" />
      <MonthPicker @changeMonth="changeMonthYear" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { MonthYearModel } from "~/interfaces/api/planning/settings-plan-model-OLD";

// emits
const emit = defineEmits(["setMonthPicker"]);

// state
const { t } = useI18n();

// methods
const changeMonthYear = async (data: MonthYearModel) => {
  emit("setMonthPicker", data);
};
<\/script>
`;export{n as default};
