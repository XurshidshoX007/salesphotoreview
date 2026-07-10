const n=`<template>
  <d-modal
    only-close-dialog
    data-container-width="800px"
    :loading="isLoading"
    :name="props.modalName || t('users.attach_un_attach_all_configuration')"
    @closeDialog="closeDialog"
  >
    <div class="grid grid-cols-2 gap-x-6">
      <div class="space-y-4">
        <div v-for="config in configs" :key="config.Group">
          <div
            :class="{
              'w-full px-4 py-2 rounded-lg border border-primary-600 text-[#424f4f] hover:bg-primary-600 hover:text-white cursor-pointer': true,
              'bg-primary-600 text-white hover:opacity-90':
                activeConfig?.Group === config.Group,
            }"
            @click="activeConfig = config"
          >
            {{ config.Group }}
          </div>
        </div>
      </div>
      <div v-if="activeConfig" class="space-y-2">
        <div v-for="item in activeConfig.Config" :key="item.Key">
          <component
            :is="fields[item.Value].component"
            v-bind="resolvedFieldProps(item)"
            v-on="resolvedFieldEvents(item)"
          />
        </div>
      </div>
    </div>
    <template v-if="props.allowToAttach" #footer>
      <div class="flex justify-between">
        <m-btn group="delete" @click="handleReset">
          {{ t("users.reset_settings") }}
        </m-btn>
        <div class="flex gap-3">
          <m-btn
            v-if="props.selectedEmployeeIds?.length"
            :loading="isSavingForSelected"
            @click="onSaveForSelected"
          >
            {{ t("users.agents.save_for_only_selected") }}
          </m-btn>
          <m-btn :loading="isSaving" @click="onSave">
            {{ props.id ? t("save") : t("users.agents.save_for_all") }}
          </m-btn>
        </div>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import type { Checkbox, DInput } from "#components";
import { notify } from "@kyvg/vue3-notification";
import type { AxiosResponse } from "axios";
import { useI18n } from "vue-i18n";
import { useAccessesService } from "~/composables/access/accesses";
import type {
  ConfigDetailsModel,
  ConfigModel,
  ConfigsGroupDetailsModel,
  ConfigValueModel,
  ConfigFormType,
} from "~/interfaces/api/users/configurations";
import { WIDGET_TYPES } from "~/variable/static-constants";

type Props = {
  id?: string;
  modalName?: string;
  allowToAttach: boolean;
  selectedEmployeeIds?: string[];
  getConfigs: () => Promise<AxiosResponse<ConfigsGroupDetailsModel[]>>;
  getConfigValues?: (id: string) => Promise<AxiosResponse<ConfigValueModel[]>>;
  onSave: (
    configs: ConfigModel[],
    selectedEmployeeIds?: string[],
  ) => Promise<AxiosResponse<void>>;
  getExtraProps?: (
    config: ConfigDetailsModel,
    methodData: ConfigFormType,
  ) => Record<string, unknown>;
};

type Emits = {
  (e: "close-dialog"): void;
};

// Props
const props = defineProps<Props>();

// Emits
const emit = defineEmits<Emits>();

// States
const { t } = useI18n();
const { isAdmin } = useAccessesService();

const configs = ref<ConfigsGroupDetailsModel[]>([]);
const configValues = ref<ConfigValueModel[]>([]);
const activeConfig = ref<ConfigsGroupDetailsModel>();
const methodData = ref<ConfigFormType>({});
const isConfigurationLoading = ref(false);
const isValuesLoading = ref(false);
const isSaving = ref(false);
const isSavingForSelected = ref(false);

const fields = reactive({
  [WIDGET_TYPES.CHECKBOX]: {
    component: "Checkbox",
    props: {},
  },
  [WIDGET_TYPES.INTEGER]: {
    component: "DInput",
    props: {
      type: "number",
    },
  },
});

// Hooks
onMounted(() => {
  handleConfigs();
  handleConfigValues();
});

const isLoading = computed(
  () =>
    isConfigurationLoading.value ||
    isValuesLoading.value ||
    isSaving.value ||
    isSavingForSelected.value,
);

watch([configValues, configs], ([newConfigValues, newConfigs]) => {
  if (newConfigValues.length && newConfigs.length) {
    setInitialValues();
  }
});

// Methods
const closeDialog = () => emit("close-dialog");

const isFieldDisabled = (config: ConfigDetailsModel): boolean => {
  const isAdminOnlyField = config.AdminOnlyConfig === true;
  const hasAttachPermission = props.allowToAttach;
  const userIsAdmin = isAdmin.value;

  // Field is disabled if: user lacks attach permission OR (field is admin-only AND user is not admin)
  return !hasAttachPermission || (isAdminOnlyField && !userIsAdmin);
};

const onSave = async () => {
  try {
    isSaving.value = true;

    await props.onSave(getDataToRequest());

    notify({ title: t("users.success_update_conf"), type: "success" });
    closeDialog();
  } catch (error) {
    console.error("Error saving configurations:", error);
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isSaving.value = false;
  }
};

const onSaveForSelected = async () => {
  try {
    isSavingForSelected.value = true;

    await props.onSave(getDataToRequest(), props.selectedEmployeeIds);

    notify({ title: t("users.success_update_conf"), type: "success" });
    closeDialog();
  } catch (error) {
    console.error("Error saving configurations for selected:", error);
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isSavingForSelected.value = false;
  }
};

const resolvedFieldProps = (config: ConfigDetailsModel) => {
  const item = methodData.value[config.Key];
  let baseProps = {};

  switch (item.type) {
    case WIDGET_TYPES.CHECKBOX: {
      baseProps = {
        ...fields[item.type].props,
        title: config.Name,
        checked: item.value,
        disabled: isFieldDisabled(config),
      } as InstanceType<typeof Checkbox>["$props"];
      break;
    }
    case WIDGET_TYPES.INTEGER: {
      baseProps = {
        ...fields[item.type].props,
        label: config.Name,
        value: item.value,
        type: "number",
        disabled: isFieldDisabled(config),
      } as InstanceType<typeof DInput>["$props"];
      break;
    }
  }

  const extraProps = props.getExtraProps?.(config, methodData.value) || {};
  return { ...baseProps, ...extraProps };
};

const resolvedFieldEvents = (config: ConfigDetailsModel) => {
  const item = methodData.value[config.Key];

  switch (item.type) {
    case WIDGET_TYPES.CHECKBOX:
      return {
        change: (value: boolean) => (item.value = value),
      };
    case WIDGET_TYPES.INTEGER:
      return {
        change: (value: number) => (item.value = value),
      };
  }
};

const handleReset = () => {
  methodData.value = configs.value.reduce<ConfigFormType>((acc, config) => {
    config.Config.forEach((item) => {
      switch (item.Value) {
        case WIDGET_TYPES.CHECKBOX:
          acc[item.Key] = {
            key: item.Key,
            type: item.Value,
            value: false,
          };
          break;
        case WIDGET_TYPES.INTEGER:
          acc[item.Key] = {
            key: item.Key,
            type: item.Value,
          };
          break;
      }
    });
    return acc;
  }, {});
};

const getDataToRequest = (): ConfigModel[] => {
  return configs.value
    .flatMap((item) => item.Config)
    .map((config) => {
      const item = methodData.value[config.Key];

      switch (item.type) {
        case WIDGET_TYPES.CHECKBOX:
        case WIDGET_TYPES.INTEGER:
          return {
            Key: config.Key,
            Name: config.Name,
            Value: item.value?.toString() || "",
          };
      }
    });
};

const handleConfigs = async () => {
  isConfigurationLoading.value = true;
  try {
    const { data } = await props.getConfigs();

    activeConfig.value = data.at(0);
    configs.value = data;
    handleReset();
  } catch (error) {
    console.error("Error fetching configurations:", error);
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isConfigurationLoading.value = false;
  }
};

const handleConfigValues = async () => {
  if (!props.id || !props.getConfigValues) return;

  isValuesLoading.value = true;
  try {
    const { data } = await props.getConfigValues(props.id);

    configValues.value = data;
  } catch (error) {
    console.error("Error fetching configuration values:", error);
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isValuesLoading.value = false;
  }
};

const setInitialValues = () => {
  for (const configValue of configValues.value) {
    const item = methodData.value[configValue.Key];
    if (item) {
      switch (item.type) {
        case WIDGET_TYPES.CHECKBOX:
          item.value = configValue.Value === "true";
          break;
        case WIDGET_TYPES.INTEGER:
          item.value = configValue.Value
            ? Number(configValue.Value)
            : undefined;
          break;
      }
    }
  }
};
<\/script>
`;export{n as default};
