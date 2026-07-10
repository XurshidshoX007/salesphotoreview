const e=`<template>
  <div class="space-y-2.5">
    <card
      variant="outlined"
      :classes="{
        root: 'border-2 border-primary-300 min-h-64',
      }"
    >
      <template #header>
        {{ t("reports.report_builder.available_fields") }}
      </template>

      <skeleton-block
        v-if="isAvailableFieldLoading"
        v-for="id in 2"
        :key="id"
        class="m-4"
      />
      <VueDraggable
        v-else
        v-model="salesReportStore.availableFields"
        :animation="150"
        ghost-class="ghost"
        group="fields"
        class="flex flex-wrap gap-4 min-h-12 w-full"
      >
        <div
          v-for="item in salesReportStore.availableFields"
          :key="item.key"
          :class="fieldClassName"
        >
          {{ item.name }}
        </div>
      </VueDraggable>
    </card>

    <div class="flex items-center justify-center gap-2.5">
      {{ t("reports.report_builder.drag_value") }}
      <icon-cursor-pointer />
    </div>

    <div class="grid grid-cols-2 gap-5">
      <card
        variant="outlined"
        :classes="{
          root: 'min-h-48',
        }"
      >
        <template #header> {{ t("reports.report_builder.column") }} </template>

        <VueDraggable
          v-model="salesReportStore.columnFields"
          :animation="150"
          ghost-class="ghost"
          group="fields"
          class="flex flex-wrap gap-4 min-h-12 w-full"
        >
          <div
            v-for="item in salesReportStore.columnFields"
            :key="item.key"
            :class="fieldClassName"
          >
            {{ item.name }}
          </div>
        </VueDraggable>
      </card>

      <card
        variant="outlined"
        :classes="{
          root: 'min-h-48',
        }"
      >
        <template #header> {{ t("reports.report_builder.row") }} </template>

        <VueDraggable
          v-model="salesReportStore.rowFields"
          :animation="150"
          ghost-class="ghost"
          group="fields"
          class="flex flex-wrap gap-4 min-h-12 w-full"
        >
          <div
            v-for="item in salesReportStore.rowFields"
            :key="item.key"
            :class="fieldClassName"
          >
            {{ item.name }}
          </div>
        </VueDraggable>
      </card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueDraggable } from "vue-draggable-plus";
import { useI18n } from "vue-i18n";

// Composables
const { t } = useI18n();

// Constants
const fieldClassName =
  "text-sm flex items-center min-w-52 h-12 cursor-grab !break-normal !whitespace-normal bg-[#eaedf1] text-neutral-600 hover:bg-[#dde1e6] active:bg-[#d1d5db] p-2.5 rounded-[10px]";

// Stores
const salesReportStore = useSalesReportStore("main");
const filtersStore = useFiltersStore("/reports/report-builder");

// Hooks
const isAvailableFieldLoading = computed(() => {
  return !Array.isArray(filtersStore.reportAvailableFieldTypes);
});
<\/script>

<style>
.ghost {
  background-color: #eaedf1 !important;
  opacity: 0.5;
}
</style>
`;export{e as default};
