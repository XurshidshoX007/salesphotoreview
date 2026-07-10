const n=`<template>
  <div class="pivot relative" :class="{ loading }">
    <icon-loading
      v-if="loading"
      :loading="loading"
      :width="14"
      :height="14"
      class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
    />
    <Pivot
      ref="pivotRef"
      :height="height"
      :report="report"
      :global="globalObject"
      :toolbar="toolbar"
      :licenseKey="licenseKey"
      :customizeCell="customizeCell"
      :beforetoolbarcreated="beforeToolbarCreated"
      :ready="onReady"
      :reportcomplete="onReportComplete"
    />
  </div>
</template>

<script setup lang="ts">
import Pivot from "vue-flexmonster/vue3";
import type { PivotInstance } from "vue-flexmonster/vue3";
import type Flexmonster from "flexmonster";
import "flexmonster/flexmonster.css";

// Types
type Props = {
  report?: Flexmonster.Report;
  height?: string | number;
  loading?: boolean;
  toolbar?: boolean;
  customizeCell?: (
    cell: Flexmonster.CellBuilder,
    data: Flexmonster.CellData
  ) => void;
  beforeToolbarCreated?: (toolbar: Flexmonster.Toolbar) => void;
};

type Emits = {
  (e: "ready", instance: Flexmonster.Pivot): void;
  (e: "reportComplete"): void;
};

export interface PivotTableExpose {
  getInstance: () => Flexmonster.Pivot | undefined;
}

// Props
const props = withDefaults(defineProps<Props>(), {
  height: "calc(100vh - 335px)",
  loading: false,
  toolbar: false,
});

// Emits
const emit = defineEmits<Emits>();

// States
const pivotRef = ref<PivotInstance | null>(null);

// Hooks
watch(
  () => props.report,
  (newReport) => {
    if (newReport && pivotRef.value?.flexmonster) {
      pivotRef.value.flexmonster.setReport(newReport);
    }
  }
);

const licenseKey = computed(() => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const currentDomain = window.location.hostname;
  const { flexmonsterLicensKeys } = useRuntimeConfig().public;

  if (isDevelopment) {
    return flexmonsterLicensKeys["development"];
  }

  return (
    (flexmonsterLicensKeys as Record<string, string>)[currentDomain] ||
    flexmonsterLicensKeys.default
  );
});

const globalObject = computed<Flexmonster.Report>(() => ({
  localization: "https://cdn.webdatarocks.com/loc/ru.json",
}));

// Methods
const onReady = () => {
  if (pivotRef.value?.flexmonster) {
    emit("ready", pivotRef.value.flexmonster);
  }
};

const onReportComplete = () => emit("reportComplete");

const beforeToolbarCreated = (toolbar: Flexmonster.Toolbar) => {
  props.beforeToolbarCreated?.(toolbar);
};

// Exposed methods
const getInstance = (): Flexmonster.Pivot | undefined => {
  return pivotRef.value?.flexmonster;
};

defineExpose<PivotTableExpose>({
  getInstance,
});
<\/script>

<style lang="scss">
// Scrollbar customization
:root {
  --scrollbar-width-height: 12px;
}

.fm-scroll-pane::-webkit-scrollbar {
  background: #d6cee4;
  width: var(--scrollbar-width-height);
  height: var(--scrollbar-width-height);
}

.fm-scroll-pane::-webkit-scrollbar-track {
  width: 100%;
  height: 100%;
}

.fm-scroll-pane::-webkit-scrollbar-thumb {
  background: #299b9b;
  border-radius: 0px;
}

.fm-scroll-pane::-webkit-scrollbar-corner {
  background: #d6cee4;
}

.fm-scroll-content[style*="0px"] {
  right: var(--scrollbar-width-height) !important;
  bottom: var(--scrollbar-width-height) !important;
  position: absolute !important;
}

// Header customization
.fm-header {
  background: #f4f9f9 !important;
}

// border-radius customization
.fm-grid-view {
  border-radius: 10px !important;
}

#fm-pivot-view {
  border-radius: 10px !important;
}

.fm-btn-open-fields {
  border-top-right-radius: 10px !important;
}

@media all and (display-mode: fullscreen) {
  .fm-grid-view {
    border-radius: 0px !important;
  }

  #fm-pivot-view {
    border-radius: 0px !important;
  }

  .fm-btn-open-fields {
    border-top-right-radius: 0px !important;
  }
}

// Toolbar customization
.fm-toolbar-group-left,
.fm-toolbar-group-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.fm-branding-bar {
  display: none;
}

#fm-toolbar-wrapper #fm-toolbar #fm-tab-connect {
  margin-left: 1px;
  display: none;
}

#fm-toolbar-wrapper #fm-toolbar #fm-tab-export-csv {
  display: none;
}

#fm-toolbar-wrapper #fm-toolbar #fm-tab-export-image {
  display: none;
}

#fm-toolbar-wrapper #fm-toolbar #fm-tab-export-html {
  display: none;
}

.pivot {
  width: 100%;

  #fm-tab-connect {
    display: none;
  }

  &.loading {
    pointer-events: none;
    opacity: 0.5;
  }
}
</style>
`;export{n as default};
