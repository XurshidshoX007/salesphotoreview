const n=`<template>
  <flex-row class="gap-3 items-center">
    <flex-row class="items-center gap-4 flex-wrap">
      <m-btn
        id="default"
        group="blue"
        :disabled="!!loadingConfigId"
        :loading="isDataLoading && loadingConfigId === 'default'"
        @click="onChooseConfig('default')"
        >{{ t("reports.universal_sales_report.default") }}</m-btn
      >
      <m-btn
        v-for="config in savedConfigs"
        :key="config.id"
        :group="!config?.is_public ? 'blue' : undefined"
        :disabled="!!loadingConfigId"
        :loading="isDataLoading && loadingConfigId === config.id"
        @click="onChooseConfig(config)"
        >{{ config?.name }}</m-btn
      >
    </flex-row>
    <SkeletonBlock
      v-show="isLoading"
      v-for="i in 3"
      :key="i"
      height="42px"
      width="150px"
    />
  </flex-row>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { UserConfigModel } from "~/interfaces/api/reports/universal-sales-reports/user-config-model";

// store
const universalSalesReportStore = useUniversalReportsStore("main");

// emits
const emit = defineEmits(["closeDialog", "onChooseConfig"]);

// states
const { t } = useI18n();
const route = useRoute();
const isLoading = ref<boolean>(false);
const loadingConfigId = ref<string | null>(null);

// hooks
const savedConfigs = computed<UserConfigModel[]>(() => {
  if (!universalSalesReportStore.userConfigByReportType) return [];
  return universalSalesReportStore.userConfigByReportType || [];
});

const isDataLoading = computed(() => {
  return universalSalesReportStore.isDataLoading && !!loadingConfigId.value;
});

watch(
  () => route.query?.configId,
  () => {
    setConfigIdFromQuery();
  },
);

onBeforeMount(async () => {
  if (universalSalesReportStore.userConfigByReportType) return;
  await fetchUserConfigs();
  setConfigIdFromQuery();
});

// methods
const closeDialog = (): void => emit("closeDialog");

const setConfigIdFromQuery = () => {
  const configId = route.query?.configId;
  if (!configId) return;
  const config = savedConfigs.value.find((config) => config.id === configId);
  loadingConfigId.value = configId as string;
  emit("onChooseConfig", config ? configId : "default");
};

const fetchUserConfigs = async () => {
  isLoading.value = true;
  await universalSalesReportStore.getUserConfigs();
  isLoading.value = false;
};

const onChooseConfig = async (selectedConfig: UserConfigModel | "default") => {
  emit(
    "onChooseConfig",
    selectedConfig === "default" ? "default" : selectedConfig.id,
  );
  loadingConfigId.value =
    selectedConfig === "default" ? "default" : selectedConfig.id;
  closeDialog();
};
<\/script>
`;export{n as default};
