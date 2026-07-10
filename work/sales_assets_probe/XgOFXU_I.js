const n=`<template>
  <rounded-white-container without-flex-col without-padding class="p-6">
    <ReportsUniversalSalesReportSavedReportsBlock
      v-if="!tableHasValue"
      @on-choose-config="onChooseConfig"
    />
    <ReportsUniversalSalesReportPivot
      v-else
      key="pivotComponent"
      ref="pivotComponent"
      :toolbar="true"
      :report="flexMonsterConfig"
      :beforetoolbarcreated="customizeToolbar"
      :selected-config="selectedConfig"
      :loading="isLoading"
      class="h-full"
    />
  </rounded-white-container>
  <transition name="modal">
    <div v-if="isSaveReportDialogOpen">
      <ReportsUniversalSalesReportSaveDialog
        :is-save-loading="isReportSaveLoading"
        @onSave="onSaveReport"
        @closeDialog="isSaveReportDialogOpen = false"
      />
    </div>
  </transition>
  <transition name="modal">
    <div v-if="savedReportsDialogOpen">
      <ReportsUniversalSalesReportSavedReportsDialog
        @onChooseConfig="onChooseConfig"
        @closeDialog="savedReportsDialogOpen = false"
      />
    </div>
  </transition>
  <transition name="modal">
    <div v-if="isFormatDateDialogOpen">
      <ReportsUniversalSalesReportFormatDateDialog
        :chosen-format="selectedDateFormat"
        @onChooseFormat="onChooseDateFormat"
        @closeDialog="isFormatDateDialogOpen = false"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { ReportsUniversalSalesReportPivot } from "#components";
import {
  dateFormat,
  expandCell,
  minimizeCell,
  openFolder,
  setings,
  upload,
  save,
  expandScreen,
  format,
  field,
  minimizeScreen,
} from "~/components/reports/universal-sales-report/Icons";
import type { UserConfigModel } from "~/interfaces/api/reports/universal-sales-reports/user-config-model";
import type { SupportedCulturesModel } from "#imports";

// props
const props = defineProps<{
  reportType: "bonus" | "return" | "sales" | "cashbox";
  flexMonsterConfig: object | undefined;
  tableColumns: string[];
  selectedDateFormat?: string;
  isLoading?: boolean;
  selectedConfig?: UserConfigModel;
}>();

// emits
const emit = defineEmits([
  "configureFlexMonster",
  "onSelectConfig",
  "onSelectDateFormat",
]);

// types
type UserConfigData = {
  default_name: string;
  name_l10n: SupportedCulturesModel;
  is_public: boolean;
};

// store
const universalSalesReportStore = useUniversalReportsStore("main");

// child-components
const pivotComponent = ref<typeof ReportsUniversalSalesReportPivot | null>(
  null,
);

// states
const { t } = useI18n();
const route = useRoute();
const isSaveReportDialogOpen = ref<boolean>(false);
const isReportSaveLoading = ref<boolean>(false);
const savedReportsDialogOpen = ref<boolean>(false);
const isFormatDateDialogOpen = ref<boolean>(false);
const isExpanded = ref<boolean>(false);

// hooks
const tableHasValue = computed(() => {
  return universalSalesReportStore.data;
});

onMounted(() => {
  if (tableHasValue.value && route.query?.configId) {
    const configId = route.query?.configId;
    const config = universalSalesReportStore.userConfigByReportType?.find(
      (config) => config.id === configId,
    );
    if (config) {
      emit("onSelectConfig", configId);
    }
  }
});

// methods
// toolbar customization
const customizeToolbar = (toolbar: any) => {
  const tabs = toolbar.getTabs();

  toolbar.getTabs = () => {
    // charts tab
    const chartsTab = tabs.find((tab: any) => tab.id === "fm-tab-charts");
    chartsTab.menu = null;
    chartsTab.visible = false;

    // save tab
    const saveTab = tabs.find((tab: any) => tab.id === "fm-tab-save");
    saveTab.handler = customSaveHandler;
    saveTab.icon = save;
    saveTab.id = "fm-tab-save-lalaku";
    saveTab.title = "Сох. как";

    // open tab
    const openTab = tabs.find((tab: any) => tab.id === "fm-tab-open");
    openTab.menu = null;
    openTab.handler = customOpenHandler;
    openTab.icon = openFolder;
    openTab.id = "fm-tab-open-lalaku";
    openTab.title = "Отчёты";

    // export tab
    const exportTab = tabs.find((tab: any) => tab.id === "fm-tab-export");
    exportTab.icon = upload;

    // grid tab
    const gridTab = tabs.find((tab: any) => tab.id === "fm-tab-grid");
    gridTab.visible = false;

    // options tab
    const optionsTab = tabs.find((tab: any) => tab.id === "fm-tab-options");
    optionsTab.icon = setings;

    // fromat tab
    const formatTab = tabs.find((tab: any) => tab.id === "fm-tab-format");
    formatTab.icon = format;
    formatTab.id = "fm-tab-format-lalaku";
    formatTab.title = "Формат";

    // fields tab
    const fieldsTab = tabs.find((tab: any) => tab.id === "fm-tab-fields");
    fieldsTab.icon = field;

    toolbar.icons = {
      ...toolbar.icons,
      ExpandIcon: expandCell,
      MinimizeIcon: minimizeCell,
      fullscreen: expandScreen,
      minimize: minimizeScreen,
    };

    const formatDateBtn = {
      id: "fm-tab-format-date",
      icon: dateFormat,
      title: t("reports.universal_sales_report.format_date_dialog_title"),
      handler: customFormatHandler,
      rightGroup: true,
      visible: props.reportType === "bonus",
    };

    const expandMinimizeCellBtn = {
      id: "fm-tab-expand",
      get icon() {
        return !isExpanded.value ? expandCell : minimizeCell;
      },
      get title() {
        return !isExpanded.value
          ? t("reports.universal_sales_report.expand_cell")
          : t("reports.universal_sales_report.minimize_cell");
      },
      handler: expandMinimizeCellHandler,
    };

    tabs.unshift(formatDateBtn);
    tabs.push(expandMinimizeCellBtn);
    return tabs.filter((tab: any) => !tab.hasOwnProperty("divider"));
  };
};

const expandMinimizeCellHandler = () => {
  const pivot = pivotComponent.value;
  if (pivot) {
    if (isExpanded.value) {
      pivot.minimizeCell();
    } else {
      pivot.expandCell(props.tableColumns);
    }
    isExpanded.value = !isExpanded.value;
    pivot.refreshToolbar();
  }
};

const customSaveHandler = () => {
  isSaveReportDialogOpen.value = true;
};

const customOpenHandler = () => {
  savedReportsDialogOpen.value = true;
};

const customFormatHandler = () => {
  isFormatDateDialogOpen.value = true;
};

const onChooseDateFormat = (format: string) => {
  emit("onSelectDateFormat", format);
  emit("configureFlexMonster");
};

const onChooseConfig = (configId: string) => {
  emit("onSelectConfig", configId);
};

const onSaveReport = async (userConfigData: UserConfigData) => {
  const userConfig = pivotComponent.value?.getUserConfig();
  const data = {
    ...userConfigData,
    configuration: { ...userConfig, date_format: props.selectedDateFormat },
  };
  await postUserConfigs(data);
};

const postUserConfigs = async (
  data: UserConfigData & { configuration: unknown },
) => {
  isReportSaveLoading.value = true;
  const res = await universalSalesReportStore.postUserConfigs(data);
  isReportSaveLoading.value = false;
  if (res !== "error") {
    isSaveReportDialogOpen.value = false;
    notify({
      title: t("reports.universal_sales_report.report_saved"),
      type: "success",
    });
  } else {
    notify({
      title: t("error"),
      type: "error",
    });
  }
};

const onDeleteChosenConfig = async () => {
  if (!props.selectedConfig && props.selectedConfig!.id === "default") return;
  const res = await universalSalesReportStore.deleteUserConfig(
    props.selectedConfig!.id,
  );
  if (res !== "error") {
    notify({
      title: t("reports.universal_sales_report.report_deleted"),
      type: "success",
    });
    emit("onSelectConfig", "default");
  } else {
    notify({
      title: t("error"),
      type: "error",
    });
  }
};

defineExpose({
  onDeleteChosenConfig,
});
<\/script>
`;export{n as default};
