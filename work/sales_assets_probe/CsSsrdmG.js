const n=`<template>
  <flex-row
    class="items-center justify-between gap-2 py-1 px-2 border border-color-neutral-200 rounded-lg text-neutral-600"
    :class="{
      'checkbox-select-item border-none text-neutral-950': isDropdownItem,
      'flex-col items-start': showSingleIndicator,
    }"
  >
    <div class="truncate text-xs">
      {{ title }}
    </div>
    <flex-row class="items-center gap-1">
      <div
        v-for="indicator in indicatorItems"
        :key="indicator.id"
        v-tooltip="indicator.tooltip"
        :class="indicator.isActive ? 'bg-green-500' : 'bg-neutral-500'"
        class="w-3 h-3 rounded-full flex items-center justify-center"
      >
        <component
          :is="getIconComponent(indicator.isActive)"
          color="white"
          :size="48"
          class="w-3 h-3"
          :class="indicator.isActive ? 'scale-110' : 'scale-150'"
        />
      </div>
    </flex-row>
  </flex-row>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  title: string;
  isConfirmedByManager?: boolean;
  isConfirmedBySupervisor?: boolean;
  isDropdownItem?: boolean;
  onlySupervisor?: boolean;
  onlyManager?: boolean;
}>();

// states
const { t } = useI18n();

const showSingleIndicator = computed(() => {
  return (
    (props.onlyManager && !props.onlySupervisor) ||
    (props.onlySupervisor && !props.onlyManager)
  );
});

const indicatorItems = computed(() => {
  const items = [
    {
      id: 1,
      tooltip: props.isConfirmedByManager
        ? t("audit.report_audit.confirmed_by_manager")
        : t("audit.report_audit.not_confirmed_by_manager"),
      isActive: props.isConfirmedByManager,
    },
    {
      id: 2,
      tooltip: props.isConfirmedBySupervisor
        ? t("audit.report_audit.confirmed_by_supervisor")
        : t("audit.report_audit.not_confirmed_by_supervisor"),
      isActive: props.isConfirmedBySupervisor,
    },
  ];

  return items.filter((item) => {
    if (props.onlySupervisor && !props.onlyManager) {
      return item.id === 2;
    }
    if (props.onlyManager && !props.onlySupervisor) {
      return item.id === 1;
    }
    return true; // Show both indicators by default
  });
});

// methods
const getIconComponent = (isActive: boolean) => {
  return isActive
    ? defineAsyncComponent(() => import("@/components/icon/Check.vue"))
    : defineAsyncComponent(() => import("@/components/icon/X.vue"));
};
<\/script>
`;export{n as default};
