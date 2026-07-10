const n=`<template>
  <div class="pivot relative" :class="{ loading: loading }">
    <icon-loading
      :loading="loading"
      :width="14"
      :height="14"
      class="absolute top-[55%] left-[50%] z-50"
    />
    <Pivot
      height="calc(100vh - 335px)"
      :report="reports"
      :global="globalObject"
      ref="container"
      id="pivotContainer"
      toolbar
      :beforetoolbarcreated="beforetoolbarcreated"
      :licenseKey="licenseKey"
    />
  </div>
</template>

<script setup lang="ts">
import Pivot from "vue-flexmonster/vue3";
import "flexmonster/flexmonster.css";
import type { UserConfigModel } from "~/interfaces/api/reports/universal-sales-reports/user-config-model";

// props
const props = defineProps<{
  report?: Object;
  selectedConfig?: UserConfigModel;
  beforetoolbarcreated: Function;
  loading?: boolean;
}>();

// states
const container = ref(null);

// hooks
const reports = computed(() => props.report);

const licenseKey = computed(() => {
  const isDevelopment = process.env.NODE_ENV === "development";
  const currentDomain = window.location.hostname;
  const { flexmonsterLicensKeys } = useRuntimeConfig().public;
  return isDevelopment
    ? flexmonsterLicensKeys["development"]
    : flexmonsterLicensKeys[currentDomain] || flexmonsterLicensKeys.default;
});

const globalObject = computed(() => {
  return {
    localization: "https://cdn.webdatarocks.com/loc/ru.json",
  };
});

watch(reports, () => {
  refreshReport();
});

watch(
  () => props.selectedConfig,
  (newConfig) => {
    if (newConfig) {
      setConfig(newConfig);
    }
  }
);

// methods
const getUserConfig = () => {
  const userConfig = container.value?.flexmonster.getReport({
    withDefaults: true,
  });
  return { slice: userConfig?.slice, options: userConfig?.options };
};

const refreshReport = () => {
  const currentConfig = getUserConfig();
  container.value?.flexmonster.setReport({
    ...reports.value,
    slice: currentConfig?.slice || reports.value.slice,
    options: currentConfig?.options || reports.value.options,
  });
};

const setConfig = (config: UserConfigModel) => {
  container.value?.flexmonster.setReport({
    ...reports.value,
    slice: config?.configuration.slice,
    options: config?.configuration.options,
  });
};

const expandCell = (tuple: string[]) => {
  container.value?.flexmonster.expandCell("rows", tuple);
  container.value?.flexmonster.expandAllData(true);
};

const minimizeCell = () => {
  container.value?.flexmonster.collapseAllData();
};

const refreshToolbar = () => {
  container.value?.flexmonster.toolbar._redrawToolbar();
};

defineExpose({
  getUserConfig,
  expandCell,
  minimizeCell,
  setConfig,
  refreshToolbar,
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
