const n=`<template>
  <form @submit.prevent="onSave">
    <d-modal
      :name="t('users.attach_un_attach_select_configuration')"
      dataContainerWidth="800px"
      :loading="isLoading || isSaving"
      only-close-dialog
      @closeDialog="closeDialog"
    >
      <template #header-button>
        <div class="position-relative">
          <div class="position-absolute top-[-11px] left-[-200px]">
            <Tooltip
              position="right"
              :tooltip="t('users.agents.attach_un_attach_info')"
            >
              <icon-info-circle color="#057CD1" />
            </Tooltip>
          </div>
        </div>
      </template>
      <div class="configuration-container-for-attach">
        <div class="configuration-category-content">
          <div v-for="config in getConfigs(configs)" :key="config.Group">
            <div
              :class="
                isGroupItem(config.Group)
                  ? 'category-btn-active'
                  : 'category-btn'
              "
              @click="setActiveGroup(config.Group)"
            >
              {{ config.Group }}
            </div>
            <div v-if="isGroupItem(config.Group)" class="category-content">
              <div
                v-for="configItem in getConfigItems(config.Config)"
                class="config-item"
                @click="changeConfigItem(configItem?.Key, true, null)"
              >
                {{ configItem?.Name }}
              </div>
            </div>
          </div>
        </div>
        <div class="configuration-configs-content">
          <div
            v-for="(config, indexA) in getConfigsForAttach(configs)"
            :key="config.Group"
          >
            <div class="config-group-name">
              {{ config.Group }}
            </div>
            <div class="config-items">
              <div
                v-for="(item, index) in getConfigItemsForAttach(
                  config.Config,
                  true,
                )"
                :key="item.Key"
                class="py-1.5"
              >
                <div class="flex items-center gap-x-2">
                  <div
                    class="cursor-pointer py-2 px-1"
                    @click="changeConfigItem(item?.Key, false, config.Group)"
                  >
                    <icon-arrow-left />
                  </div>
                  <div v-if="item.Value === 'checkbox'" class="w-full">
                    <Checkbox
                      v-if="item.Key === configsKey.Follow"
                      :id="item.Key"
                      :checked="getCheckboxValue(inputValues[item.Key].Value)"
                      :title="item.Name"
                      :disabled="!allowToAttach"
                      @change="inputValues[item.Key].Value = $event"
                    />
                    <Checkbox
                      v-else
                      :id="item.Key"
                      :checked="getCheckboxValue(inputValues[item.Key].Value)"
                      :title="item.Name"
                      :disabled="!allowToAttach"
                      @change="inputValues[item.Key].Value = $event"
                    />
                  </div>
                  <div
                    v-if="item.Value === 'text' || item.Value === 'integer'"
                    class="input-config-item w-full"
                  >
                    <d-input
                      v-if="item.Key === configsKey.IntervalSeconds"
                      type="number"
                      :label="item.Name"
                      :id="item.Name"
                      :value="inputValues[item.Key].Value"
                      :disabled="
                        !allowToAttach ||
                        !getCheckboxValue(inputValues[configsKey.Follow].Value)
                      "
                      @change="inputValues[item.Key].Value = $event.toString()"
                    />
                    <d-input
                      v-else
                      type="number"
                      :label="item.Name"
                      :id="item.Name"
                      :value="inputValues[item.Key].Value"
                      :disabled="!allowToAttach"
                      @change="inputValues[item.Key].Value = $event.toString()"
                    />
                  </div>

                  <div
                    v-if="item.Value === 'multiselect'"
                    class="input-config-item w-full"
                  >
                    <DropdownsByFilterStates
                      :key="item.Key"
                      :filterStates="getCurrencyByIdx(item.Name, item.Key)"
                    />
                  </div>
                  <div v-if="item.Value === 'singleselect'" class="w-full">
                    <DropdownsByFilterStates
                      :filterStates="
                        getPaymentFormTermTypeByIdx(item.Name, item.Key)
                      "
                    />
                  </div>
                </div>
                <div
                  v-if="
                    item.Key === configsKey.termPayment &&
                    (selectedTermType === 1 || selectedTermType === 4)
                  "
                  class="input-config-item w-full pt-3 pl-7.5"
                >
                  <d-input
                    :label="termTypeInputLabel"
                    :value="termTypeInputValues"
                    :max="maxTermDaysInput()"
                    required
                    type="number"
                    :disabled="!allowToAttach"
                    @change="changeTermDays"
                  />
                </div>
              </div>
              <div class="flex justify-between">
                <div
                  v-for="(item, index) in getConfigItemsForAttach(
                    config.Config,
                    false,
                  )"
                  :key="index"
                  class="py-1"
                >
                  <div
                    v-if="item.Value === 'time'"
                    class="w-[96%] flex items-center gap-x-2"
                  >
                    <div
                      class="cursor-pointer py-2 px-1"
                      @click="changeConfigItem(item?.Key, false, config.Group)"
                    >
                      <icon-arrow-left />
                    </div>
                    <TimePicker
                      class="w-full justify-start"
                      :disabled="!allowToAttach"
                      :selected-time="inputValues[item.Key].Value"
                      @onSelectTime="onSelectTime(item.Key, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template v-if="allowToAttach" #footer>
        <div class="flex gap-3 justify-end items-center">
          <m-btn
            v-if="isSelectedFromTable"
            :loading="isSavingForSelected"
            @click="saveForSelected"
          >
            {{ t("users.agents.save_for_only_selected") }}
          </m-btn>
          <m-btn type="submit" :loading="isSaving">
            {{ t("users.agents.save_for_all") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { dropdownParamsActive } from "~/variable/params";
import { useI18n } from "vue-i18n";
import type { DropdownsByFilterStates } from "#components";
import type {
  AgentConfigsModel,
  ConfigModel,
} from "~/interfaces/api/users/agent/Configuration";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";
import type { CurrencyModel } from "~/interfaces/api/settings/currency-model";
// store
const agentsStore = useAgentsStore("true");
const activeGroups = ref<string[]>([]);

// props
const props = defineProps({
  allowToAttach: Boolean,
});
// emits
const emit = defineEmits(["closeDialog"]);

// states
const { t } = useI18n();
const isLoading = ref<boolean>(false);
const configs = ref<AgentConfigsModel[]>();
const agentConfigById = ref();
const currencies = ref<DropdownItemsModelByType<CurrencyModel>>();
const currenciesForConsignation =
  ref<DropdownItemsModelByType<CurrencyModel>>();
const paymentForConsignationTermType = ref<{
  items: { ConstantModel: ConstantModel; days?: number } | [];
}>({ items: [] });
const orderBonusFillType = ref({ items: [] });
const selectedTermType = ref<number | null>(null);
const isSavingForSelected = ref<boolean>(false);
const isSaving = ref<boolean>(false);

enum configsKey {
  syncFrom = 1401,
  syncTo = 1402,
  termPayment = 600,
  fillingBonusProductType = 601,
  MethodSuccessPayment = 1500,
  PaymentMethodForConsignment = 1107,
  Follow = 305,
  IntervalSeconds = 306,
}

// methods

const getCurrencyByIdx = (name: string, key: number) => {
  switch (key) {
    case configsKey.MethodSuccessPayment:
      return [
        {
          name: name,
          key: \`currency\`,
          required: true,
          disabled: !props?.allowToAttach,
          get data() {
            return currencies.value || [];
          },
          get getSelectedData() {
            return inputValues.value[key].Value;
          },
          set setSelectedData(value: string[]) {
            onSelectMultiselectItems(key, value);
          },
        },
      ];
    case configsKey.PaymentMethodForConsignment:
      return [
        {
          name: name,
          key: \`currency_for_consignment\`,
          required: true,
          disabled: !props?.allowToAttach,
          get data() {
            return currenciesForConsignation.value || [];
          },
          get getSelectedData() {
            return inputValues.value[key].Value;
          },
          set setSelectedData(value: string[]) {
            onSelectMultiselectItems(key, value);
          },
        },
      ];
  }
};

const getPaymentFormTermTypeByIdx = (name: string, key: number) => {
  switch (key) {
    case configsKey.termPayment:
      return [
        {
          name: name,
          key: "term-type",
          isSingleSelect: true,
          required: true,
          disabled: !props?.allowToAttach,
          get data() {
            return paymentForConsignationTermType.value || [];
          },
          get getSelectedData() {
            return selectedTermType.value;
          },
          set setSelectedData(value: number) {
            selectedTermType.value = value;
          },
        },
      ];
    case configsKey.fillingBonusProductType:
      return [
        {
          name: name,
          key: "term-filling-type",
          isSingleSelect: true,
          required: true,
          disabled: !props?.allowToAttach,
          get data() {
            return orderBonusFillType.value || [];
          },
          get getSelectedData() {
            return (
              (inputValues.value[key].Value &&
                Number(inputValues.value[key].Value)) ||
              null
            );
          },
          set setSelectedData(value: string) {
            inputValues.value[key].Value = value.toString();
          },
        },
      ];
  }
};
// hooks

onMounted(async () => {
  isLoading.value = true;
  try {
    const [
      currenciesData,
      configsData,
      paymentTermType,
      orderBonusFillTypeData,
    ] = await Promise.all([
      agentsStore.getCurrencies(),
      agentsStore.getAgentsConfigsAll(),
      agentsStore.getPaymentForConsignationTermType(),
      agentsStore.getOrderBonusFillType(),
    ]);
    paymentForConsignationTermType.value.items = paymentTermType;
    orderBonusFillType.value.items = orderBonusFillTypeData;
    currencies.value = currenciesData;
    currenciesForConsignation.value = JSON.parse(
      JSON.stringify(currenciesData),
    );
    configs.value = configsData;
  } catch (e) {
    console.log(e);
  } finally {
    isLoading.value = false;
  }
});

const isAgentConfigs = computed(() => agentConfigById.value?.length > 0);

const inputValues = computed<ConfigModel[]>(() => {
  const values = ref([]);
  configs.value.forEach((config) => {
    config.Config.forEach((item) => {
      if (
        item.Value === "text" ||
        item.Value === "integer" ||
        item.Value === "double"
      ) {
        values.value[item.Key] = {
          Value: isAgentConfigs.value
            ? getAgentValueById(item.Key, item.Value)
            : "",
          Key: item.Key,
          Name: item.Name,
        };
      } else if (item.Value === "time") {
        values.value[item.Key] = {
          Value: isAgentConfigs.value
            ? getAgentValueById(item.Key, item.Value)
            : getDefaultTimePickerValues(item.Key),
          Key: item.Key,
          Name: item.Name,
        };
      } else if (item.Value === "checkbox") {
        values.value[item.Key] = {
          Value: isAgentConfigs.value
            ? getAgentValueById(item.Key, item.Value) === "true"
            : "false",
          Key: item.Key,
          Name: item.Name,
        };
      } else if (item.Value === "multiselect") {
        values.value[item.Key] = {
          Name: item.Name,
          Value: isAgentConfigs.value
            ? getAgentValueById(item.Key, item.Value)
            : [],
          Key: item.Key,
        };
      } else if (
        item.Value === "singleselect" &&
        item.Key === configsKey.termPayment
      ) {
        values.value[item.Key] = {
          Name: item.Name,
          Value: isAgentConfigs.value
            ? getAgentValueById(item.Key, item.Value) &&
              JSON.parse(getAgentValueById(item.Key))
            : null,
          Key: item.Key,
        };
      } else if (item.Value === "singleselect") {
        values.value[item.Key] = {
          Name: item.Name,
          Value: isAgentConfigs.value
            ? getAgentValueById(item.Key, item.Value)
            : "",
          Key: item.Key,
        };
      }
    });
  });
  return values.value;
});

const isSelectedFromTable = computed(() => {
  return agentsStore.editMultipleDialog.length > 0;
});

const filteredConfigValues = computed(() => {
  return inputValues.value
    .map((item) => {
      const targetConfig = configs.value
        .flatMap((config) => config.Config || [])
        .find((config) => config.Key === item.Key);

      // Skip items where \`is_attach\` is true
      if (!targetConfig?.is_attach) return null;

      if (item.Key === configsKey.termPayment) {
        item.Value = JSON.stringify({
          type: selectedTermType.value,
          days: getTermDays(),
        });
      }

      if (Array.isArray(item.Value)) {
        item.Value = item.Value.join(", ");
      } else if (typeof item.Value === "boolean") {
        item.Value = item.Value.toString();
      }

      return item;
    })
    .filter(Boolean); // Remove null values from the array
});

const termTypeInputValues = computed(() => {
  return (
    paymentForConsignationTermType.value.items[selectedTermType.value - 1]
      ?.days || ""
  );
});

const termTypeInputLabel = computed(() => {
  return paymentForConsignationTermType.value.items[selectedTermType.value - 1]
    ?.name;
});

// methods

const getDefaultTimePickerValues = (key: number) => {
  switch (key) {
    case configsKey.syncFrom:
      return "08:00";
    case configsKey.syncTo:
      return "18:00";
    default:
      return "";
  }
};

const setActiveGroup = (group: string) => {
  const groupItem = activeGroups.value.find((item) => item === group);
  if (groupItem) {
    activeGroups.value = activeGroups.value.filter(
      (item) => item !== groupItem,
    );
  } else {
    activeGroups.value.push(group);
  }
};

const isGroupItem = (group: string) => {
  return !!activeGroups.value.find((item) => item === group);
};

const onSave = async () => {
  isSaving.value = true;
  let res = await postConfigToAllAgents(filteredConfigValues.value);
  if (res !== "error") {
    closeDialog();
  }
  isSaving.value = false;
};

const saveForSelected = async () => {
  isSavingForSelected.value = true;
  const postData = {
    employee_id_arr: agentsStore.editMultipleDialog.map((item) => item.id),
    config_values: filteredConfigValues.value,
  };
  const res = await agentsStore.attachAgentConfigsAll(postData);
  isSavingForSelected.value = false;
  closeDialog();
  await agentsStore.refresh();
};

const closeDialog = () => emit("closeDialog");

const postConfigToAllAgents = async (configValues: ConfigModel[]) => {
  const postData = {
    employee_id_arr: [],
    config_values: configValues,
  };
  const res = await agentsStore.attachAgentConfigsAll(postData);
  return res;
};

const getAgentValueById = (itemKey: string, type: string) => {
  const [value] = agentConfigById.value.filter((item) => item.Key === itemKey);
  if (type === "multiselect") {
    return value?.Value !== "" ? value?.Value.split(", ") : [];
  } else {
    return value?.Value;
  }
};

const onSelectTime = (
  key: number,
  selectedTime: { hours: number; minutes: number },
) => {
  const { hours, minutes } = selectedTime;
  inputValues.value[key].Value = \`\${hours} : \${minutes}\`;
};

const onSelectMultiselectItems = (itemKey: string, newVal: string[]) => {
  inputValues.value[itemKey].Value = newVal;
};

const changeTermDays = (days: number) => {
  setTermDays(days);
};

const getCheckboxValue = (checked: boolean | string) => {
  if (typeof checked === "boolean") {
    return checked;
  } else {
    return checked === "true";
  }
};

const getTermDays = () => {
  let selectedTermDays =
    paymentForConsignationTermType.value.items[selectedTermType.value - 1];
  return selectedTermDays?.days || null;
};

const setTermDays = (days: number) => {
  if (days && paymentForConsignationTermType.value.items?.length > 0) {
    paymentForConsignationTermType.value.items[selectedTermType.value - 1][
      "days"
    ] = days;
  }
};

const maxTermDaysInput = () => {
  if (selectedTermType.value === 1) {
    return 31;
  } else {
    return getNextMonthDays();
  }
};

const getNextMonthDays = () => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const nextMonth = (currentMonth + 1) % 12;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
  return daysInNextMonth;
};

const getConfigs = (configs: AgentConfigsModel[]) => {
  return configs?.filter((item) => getConfigItems(item.Config)?.length > 0);
};

const getConfigsForAttach = (configs: AgentConfigsModel[]) =>
  configs?.filter(
    (item) =>
      item.Config &&
      getConfigItemsForAttach(item.Config, true).length +
        getConfigItemsForAttach(item.Config, false).length >
        0,
  );

const getConfigItems = (configs: ConfigModel[]) =>
  configs.filter((item) => !item?.is_attach);

const getConfigItemsForAttach = (
  configs: ConfigModel[],
  withoutTime: boolean,
) => {
  if (withoutTime) {
    return configs.filter((item) => item?.is_attach && item.Value !== "time");
  } else {
    return configs.filter((item) => item?.is_attach);
  }
};

const changeConfigItem = (
  key: number,
  is_attach: boolean,
  group: string | null,
) => {
  const targetConfig = configs.value
    .flatMap((item) => item.Config || [])
    .find((config) => config.Key === key);

  if (targetConfig) {
    targetConfig.is_attach = is_attach;
  }

  if (group && !is_attach && !activeGroups.value.includes(group)) {
    setActiveGroup(group);
  }
};
<\/script>

<style scoped lang="scss">
.configuration-container-for-attach {
  display: flex;
  justify-content: space-between;
  gap: 0 24px;

  .configuration-category-content {
    display: flex;
    flex-direction: column;
    width: 50%;
    overflow-y: auto;
    gap: 16px;

    .category-btn {
      width: 100%;
      padding: 9px 16px;
      border-radius: 8px;
      background: #299b9b;
      cursor: pointer;
      font-family: "Inter", sans-serif;
      font-size: 16px;
      font-weight: 400;
      user-select: none;
      color: white;
    }

    .category-btn-active {
      width: 100%;
      padding: 9px 16px;
      border-radius: 8px 8px 0 0;
      cursor: pointer;
      font-family: "Inter", sans-serif;
      font-size: 16px;
      font-weight: 400;
      color: white;
      background: #299b9b;
      user-select: none;
    }

    .category-btn:hover {
      color: white;
      background: #299b9b;
    }

    .category-btn-active:hover {
      opacity: 0.9;
    }

    .category-content {
      width: 100%;
      border: 1px solid #e1e4e4;
      border-top: none;
      background: #fafdfd;
      border-radius: 0 0 8px 8px;

      .config-item {
        font-family: "Inter", sans-serif;
        font-size: 16px;
        font-weight: 400;
        color: #424f4f;
        cursor: pointer;
        user-select: none;
        padding: 4px 16px;
      }

      .config-item:hover {
        color: #299b9b;
      }
    }
  }

  .configuration-configs-content {
    display: flex;
    flex-flow: column;
    gap: 16px;
    width: 50%;

    .config-group-name {
      width: 100%;
      padding: 9px 16px;
      border-radius: 8px 8px 0 0;
      font-family: "Inter", sans-serif;
      font-size: 16px;
      font-weight: 400;
      color: #424f4f;
      border: 1px solid #e1e4e4;
      background: #f1fefe;
      user-select: none;
    }

    .config-items {
      display: flex;
      border-radius: 0 0 8px 8px;
      border: 1px solid #e1e4e4;
      border-top: none;
      padding: 4px;
      flex-direction: column;
    }
  }
}
</style>
`;export{n as default};
