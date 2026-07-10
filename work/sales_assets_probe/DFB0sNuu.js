const n=`<template>
  <d-modal
    only-close-dialog
    dataContainerWidth="800px"
    :loading="isLoading"
    :name="props.modalName || t('users.attach_un_attach_select_configuration')"
    @closeDialog="closeDialog"
  >
    <template #header-button>
      <div class="relative flex-1">
        <div class="absolute -top-2.5 left-[-200px]">
          <Tooltip
            position="right"
            :tooltip="t('users.configs.attach_detach_info')"
          >
            <IconInfoCircle color="#057CD1" />
          </Tooltip>
        </div>
      </div>
    </template>

    <div class="grid grid-cols-2 gap-x-6">
      <div class="space-y-4">
        <div v-for="config in configs" :key="config.Group">
          <div
            :class="
              cn(
                'w-full px-4 py-2 rounded-t-lg border bg-primary-600 text-white hover:opacity-90 cursor-pointer',
                { 'rounded-b-lg': activeConfig !== config.Group }
              )
            "
            @click="toggleConfigGroup(config)"
          >
            {{ config.Group }}
          </div>
          <div
            v-if="activeConfig === config.Group"
            class="border border-gray-40 border-t-0 bg-input rounded-b-lg"
          >
            <template v-for="item in config.Config" :key="item.Key">
              <div
                v-if="!methodData[item.Key]"
                class="cursor-pointer px-4 py-1 select-none"
                @click="toggleConfig(item)"
              >
                {{ item.Name }}
              </div>
            </template>
          </div>
        </div>
      </div>
      <div class="space-y-4">
        <template v-for="config in configs" :key="config.Group">
          <div v-if="isSomeConfigsSelected(config.Config)">
            <div class="w-full px-4 py-2 rounded-t-lg border bg-[#f1fefe]">
              {{ config.Group }}
            </div>
            <div
              class="border border-gray-40 border-t-0 bg-input rounded-b-lg p-2.5 space-y-3"
            >
              <template v-for="item in config.Config" :key="item.Key">
                <div
                  v-if="methodData[item.Key]"
                  class="select-none flex items-center gap-2"
                >
                  <div
                    class="cursor-pointer transition-transform hover:-translate-x-0.5"
                    @click="toggleConfig(item)"
                  >
                    <IconArrowLeft />
                  </div>
                  <div class="flex-1">
                    <component
                      :is="fields[item.Value].component"
                      v-bind="resolvedFieldProps(item)"
                      v-on="resolvedFieldEvents(item)"
                    />
                  </div>
                </div>
              </template>
            </div>
          </div>
        </template>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <m-btn
          v-if="props.selectedEmployeeIds?.length"
          :loading="isSavingForSelected"
          @click="onSaveForSelected"
        >
          {{ t("users.agents.save_for_only_selected") }}
        </m-btn>
        <m-btn :loading="isSaving" @click="onSave">
          {{ t("users.agents.save_for_all") }}
        </m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import type { Checkbox, DInput } from "#components";
import { notify } from "@kyvg/vue3-notification";
import type { AxiosResponse } from "axios";
import { useI18n } from "vue-i18n";
import { cn } from "~/utils/helpers";
import { WIDGET_TYPES } from "~/variable/static-constants";
import type {
  ConfigDetailsModel,
  ConfigFormType,
  ConfigModel,
  ConfigsGroupDetailsModel,
} from "~/interfaces/api/users/configurations";

type Props = {
  modalName?: string;
  allowToAttach: boolean;
  selectedEmployeeIds?: string[];
  dependencies?: Record<number, number[]>;
  getConfigs: () => Promise<AxiosResponse<ConfigsGroupDetailsModel[]>>;
  getExtraProps?: (
    config: ConfigModel,
    methodData: ConfigFormType
  ) => Record<string, unknown>;
  onSave: (
    configs: ConfigModel[],
    selectedEmployeeIds?: string[]
  ) => Promise<AxiosResponse<void>>;
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

const configs = ref<ConfigsGroupDetailsModel[]>([]);
const activeConfig = ref<string | null>();
const methodData = ref<ConfigFormType>({});
const isFetchingConfigurationLoading = ref(false);
const isSaving = ref(false);
const isSavingForSelected = ref(false);

const fields = reactive({
  [WIDGET_TYPES.CHECKBOX]: {
    component: "Checkbox",
    props: {
      disabled: !props.allowToAttach,
    },
  },
  [WIDGET_TYPES.INTEGER]: {
    component: "DInput",
    props: {
      type: "number",
      disabled: !props.allowToAttach,
    },
  },
});

// Hooks
onMounted(() => {
  handleConfigs();
});

const isLoading = computed(() => {
  return (
    isFetchingConfigurationLoading.value ||
    isSaving.value ||
    isSavingForSelected.value
  );
});

// Methods
const closeDialog = () => emit("close-dialog");

const handleConfigs = async () => {
  isFetchingConfigurationLoading.value = true;
  try {
    const { data } = await props.getConfigs();

    configs.value = data;
  } catch (error) {
    console.error("Error fetching configurations:", error);
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isFetchingConfigurationLoading.value = false;
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
      } as InstanceType<typeof Checkbox>["$props"];
      break;
    }
    case WIDGET_TYPES.INTEGER: {
      baseProps = {
        ...fields[item.type].props,
        label: config.Name,
        value: item.value,
        type: "number",
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

const toggleConfig = (config: ConfigDetailsModel) => {
  if (methodData.value[config.Key]) {
    delete methodData.value[config.Key];
    props.dependencies?.[config.Key]?.forEach((dependentKey) => {
      delete methodData.value[dependentKey];
    });
  } else {
    methodData.value[config.Key] = getDefaultValue(config);
    props.dependencies?.[config.Key]?.forEach((dependentKey) => {
      const dependentConfig = configs.value
        .flatMap((group) => group.Config)
        .find((item) => item.Key === dependentKey);
      if (dependentConfig) {
        methodData.value[dependentKey] = getDefaultValue(dependentConfig);
      }
    });
  }
};

const getDefaultValue = (config: ConfigDetailsModel) => {
  switch (config.Value) {
    case WIDGET_TYPES.CHECKBOX:
      return {
        key: config.Key,
        type: WIDGET_TYPES.CHECKBOX,
        value: false,
      };
    case WIDGET_TYPES.INTEGER:
      return {
        key: config.Key,
        type: WIDGET_TYPES.INTEGER,
      };
  }
};

const toggleConfigGroup = (configGroup: ConfigsGroupDetailsModel) => {
  if (activeConfig.value === configGroup.Group) {
    activeConfig.value = null;
  } else {
    activeConfig.value = configGroup.Group;
  }
};

const isSomeConfigsSelected = (configs: ConfigDetailsModel[]) => {
  return configs.some((config) => methodData.value[config.Key]);
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

const getDataToRequest = () => {
  return configs.value
    .flatMap((item) => item.Config)
    .reduce<ConfigModel[]>((acc, config) => {
      if (!methodData.value[config.Key]) {
        return acc;
      }

      const item = methodData.value[config.Key];

      switch (item.type) {
        case WIDGET_TYPES.CHECKBOX:
        case WIDGET_TYPES.INTEGER:
          acc.push({
            Key: config.Key,
            Name: config.Name,
            Value: item.value?.toString() || "",
          });
      }

      return acc;
    }, []);
};
<\/script>
`;export{n as default};
