const e=`<template>
  <form @submit.prevent="onSave">
    <d-modal
      :name="modalName || t('users.attach_un_attach_all_configuration')"
      dataContainerWidth="800px"
      :loading="isLoading || isSaving"
      only-close-dialog
      @closeDialog="closeDialog"
    >
      <div class="configuration-container">
        <div class="configuration-category-content">
          <div v-for="config in configs" :key="config.Group">
            <div
              :class="
                config.Group === activeGroup
                  ? 'category-btn-active'
                  : 'category-btn'
              "
              @click="setActiveGroup(config.Group)"
            >
              {{ config.Group }}
            </div>
          </div>
        </div>
        <div class="configuration-configs-content">
          <div v-for="config in configs" :key="config.Group">
            <div class="config-items" v-show="config.Group === activeGroup">
              <div
                v-for="(item, index) in config.Config?.filter(
                  (item) => item.Value !== 'time',
                )"
                :key="item.Key"
              >
                <div v-if="item.Value === 'checkbox'">
                  <Checkbox
                    v-if="item.Key === configsKey.Follow"
                    :id="item.Key"
                    :checked="getCheckboxValue(inputValues[item.Key].Value)"
                    :title="item.Name"
                    :disabled="isFieldDisabled(item.Key)"
                    @change="inputValues[item.Key].Value = $event"
                  />
                  <Checkbox
                    v-else
                    :id="item.Key"
                    :checked="getCheckboxValue(inputValues[item.Key].Value)"
                    :title="item.Name"
                    :disabled="isFieldDisabled(item.Key)"
                    @change="inputValues[item.Key].Value = $event"
                  />
                </div>
                <div
                  v-if="item.Value === 'text' || item.Value === 'integer'"
                  class="input-config-item"
                >
                  <d-input
                    v-if="item.Key === configsKey.IntervalSeconds"
                    type="number"
                    :label="item.Name"
                    :id="item.Name"
                    :value="inputValues[item.Key].Value"
                    :disabled="
                      isFieldDisabled(item.Key) ||
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
                    :disabled="isFieldDisabled(item.Key)"
                    @change="inputValues[item.Key].Value = $event.toString()"
                  />
                </div>

                <div
                  v-if="item.Value === 'multiselect'"
                  class="input-config-item"
                >
                  <DropdownsByFilterStates
                    :key="item.Key"
                    :filterStates="getCurrencyByIdx(item.Name, item.Key)"
                  />
                </div>
                <flex-col class="gap-4">
                  <DropdownsByFilterStates
                    v-if="item.Value === 'singleselect'"
                    :filterStates="
                      getPaymentFormTermTypeByIdx(item.Name, item.Key)
                    "
                  />
                  <div
                    v-if="
                      item.Key === configsKey.termPayment &&
                      (selectedTermType === 1 || selectedTermType === 4)
                    "
                    class="input-config-item"
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
                </flex-col>
              </div>
              <div class="flex justify-between">
                <div v-for="item in config.Config" :key="item">
                  <div v-if="item.Value === 'time'" class="w-[96%]">
                    <TimePicker
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
        <div class="flex justify-between">
          <m-btn group="delete" @click="cancelAllConfigs">
            {{ t("users.reset_settings") }}
          </m-btn>
          <div class="flex gap-3">
            <m-btn
              v-if="isSelectedFromTable"
              :loading="isSavingForSelected"
              @click="saveForSelected"
            >
              {{ t("users.agents.save_for_only_selected") }}
            </m-btn>
            <m-btn
              type="submit"
              :loading="isSaving"
              @click="checkSelectedTermType"
            >
              {{ props.id ? t("save") : t("users.agents.save_for_all") }}
            </m-btn>
          </div>
        </div>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useNotification } from "@kyvg/vue3-notification";
import { dropdownParamsActive } from "~/variable/params";
import { useI18n } from "vue-i18n";
import type { DropdownsByFilterStates } from "#components";
import { useAccessesService } from "~/composables/access/accesses";

// types
type ConfigItem = {
  Key: number;
  Name: string;
  Value: string;
  AdminOnlyConfig: boolean;
};

// store
const agentsStore = useAgentsStore("true");
const activeGroup = ref<null | string>(null);

// props
const props = defineProps({
  id: String,
  modalName: String,
  allowToAttach: Boolean,
});

// emits
const emit = defineEmits(["closeDialog"]);

// composables
const { t } = useI18n();
const { notify } = useNotification();
const { isAdmin } = useAccessesService();

// states
const isLoading = ref<boolean>(false);
const configs = ref<Array<{ Config: ConfigItem[]; Group: string }>>([]);
const agentConfigById = ref();
const currencies = ref();
const currenciesForConsignation = ref();
const paymentForConsignationTermType = ref({ items: [] });
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
const isFieldDisabled = (configKey: number): boolean => {
  const configItem = configs.value
    ?.flatMap((config) => config.Config)
    .find((item) => item.Key === configKey);

  const isAdminOnlyField = configItem?.AdminOnlyConfig === true;
  const hasAttachPermission = props.allowToAttach;
  const userIsAdmin = isAdmin.value;

  // Field is disabled if: user lacks attach permission OR (field is admin-only AND user is not admin)
  return !hasAttachPermission || (isAdminOnlyField && !userIsAdmin);
};

const getCurrencyByIdx = (name: string, key: number) => {
  switch (key) {
    case configsKey.MethodSuccessPayment:
      return [
        {
          name: name,
          key: \`currency\`,
          disabled: isFieldDisabled(key),
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
          disabled: isFieldDisabled(key),
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

const getPaymentFormTermTypeByIdx = (name: string, key: string) => {
  const keyNum = Number(key);
  switch (key) {
    case configsKey.termPayment:
      return [
        {
          name: name,
          key: "term-type",
          isSingleSelect: true,
          required: true,
          disabled: isFieldDisabled(keyNum),
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
          disabled: isFieldDisabled(keyNum),
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
    if (props.id) {
      agentConfigById.value = await agentsStore.getConfigById(props.id);
      selectedTermType.value = getAgentValueById(configsKey.termPayment, null)
        ? JSON.parse(getAgentValueById(configsKey.termPayment, null))?.type
        : null;
    }
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
    if (props.id && getAgentValueById(configsKey.termPayment, null)) {
      setTermDays(
        JSON.parse(getAgentValueById(configsKey.termPayment, null))?.days,
      );
    }
    currencies.value = currenciesData;
    currenciesForConsignation.value = JSON.parse(
      JSON.stringify(currenciesData),
    );
    configs.value = configsData;
    activeGroup.value = configsData[0]?.Group;
  } catch (e) {
    console.log(e);
  } finally {
    isLoading.value = false;
  }
});

const modalName = computed(() => {
  if (!props.id) return undefined;
  const itemId = props.id;
  const itemName = agentsStore.data?.items?.find(
    (item) => item.id === itemId,
  )?.full_name;
  return t("users.configurations") + ": " + itemName;
});

const isAgentConfigs = computed(() => agentConfigById.value?.length > 0);

const inputValues = computed(() => {
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
            : getConfigurationInputValue(item.Key),
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
  const data = inputValues.value.filter((item) => {
    if (item.Key === configsKey.termPayment) {
      item.Value = JSON.stringify({
        type: selectedTermType.value,
        days: getTermDays(),
      });
    }
    if (typeof item.Value === "object") {
      item.Value = item.Value.join(", ");
    }
    if (typeof item.Value === "boolean") {
      item.Value = item.Value.toString();
    }
    return item;
  });

  return data;
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

const setActiveGroup = (e: string) => {
  activeGroup.value = e;
};

const checkSelectedTermType = () => {
  if (!selectedTermType.value) {
    const requiredConfig = configs.value.find((config) =>
      config.Config?.some((item) => item.Key === configsKey.termPayment),
    );
    setActiveGroup(requiredConfig?.Group);
  }
};

const onSave = async () => {
  isSaving.value = true;
  let res = null;
  if (props.id) {
    res = await postConfigToExactAgent(filteredConfigValues.value);
  } else {
    res = await postConfigToAllAgents(filteredConfigValues.value);
  }
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
  const res = await agentsStore.postAgentsConfigsAll(postData);
  isSavingForSelected.value = false;
  closeDialog();
  await agentsStore.refresh();
};

const closeDialog = () => emit("closeDialog");

const postConfigToAllAgents = async (configValues) => {
  const postData = {
    employee_id_arr: [],
    config_values: configValues,
  };
  const res = await agentsStore.postAgentsConfigsAll(postData);
  return res;
};

const postConfigToExactAgent = async (configValues) => {
  const res = await agentsStore.postConfigById(props.id, configValues);
  if (res !== "error") {
    notify({ title: t("users.success_update_conf"), type: "success" });
  }
  return res;
};

const getAgentValueById = (itemKey: number, type: string) => {
  const [value] = agentConfigById.value.filter((item) => item.Key === itemKey);
  if (type === "multiselect") {
    return value?.Value !== "" ? value?.Value?.split(", ") : [];
  } else {
    return value?.Value;
  }
};

const getConfigurationInputValue = (itemKey: number) => {
  if (itemKey === configsKey.IntervalSeconds) {
    return "10";
  }
  return "";
};

const cancelAllConfigs = () => {
  configs.value.forEach((config) => {
    config.Config.forEach((item) => {
      if (item.Value === "text" || item.Value === "integer") {
        inputValues.value[item.Key].Value = "";
      } else if (item.Value === "checkbox") {
        inputValues.value[item.Key].Value = false;
      } else if (item.Value === "multiselect") {
        onSelectMultiselectItems(item.Key, []);
      }
    });
  });
};

const onSelectTime = (key, selectedTime) => {
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
<\/script>

<style scoped lang="scss">
.configuration-container {
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
      border: 1px solid #299b9b;
      cursor: pointer;
      font-family: "Inter", sans-serif;
      font-size: 16px;
      font-weight: 400;
      user-select: none;
      color: #424f4f;
    }
    .category-btn-active {
      width: 100%;
      padding: 9px 16px;
      border-radius: 8px;
      border: 1px solid #299b9b;
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
  }

  .configuration-configs-content {
    width: 50%;

    .config-items {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .input-config-item {
        padding-bottom: 4px;
      }
    }
  }
}

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px #e1e4e4;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
}
</style>
`;export{e as default};
