const e=`<template>
  <div class="order-download-content">
    <div class="download-content-top">
      <div class="content-header">
        <div class="content-header-left">
          <Checkbox
            :title="t('orders.separate_by_sheets')"
            :checked="isSeparateActive"
            disabled
            @change="changeSeparateCheckbox"
          />
        </div>
        <m-btn @click="changeToggle">
          {{ t("orders.upload_as_one_file") }}
        </m-btn>
      </div>
    </div>
    <div class="download-content-body">
      <transition name="toggle-accordion">
        <div v-show="isToggleOpen" class="container-box">
          <div class="content-box">
            <div class="content-box-body">
              <div
                v-for="(item, index) in downloadDropdownStates"
                :key="item.key"
                class="download-box"
              >
                <div class="card-title">
                  {{ item.name }}
                </div>
                <div class="card-body">
                  <RadioBtn
                    ref="RadioBtnComponent"
                    group="column"
                    :items="getDownloadItems(item.data_key)"
                    @onSelectItemId="item.fileId = $event"
                  />
                </div>
                <div @click="clearRadioBtnData(index)" class="card-footer">
                  {{ t("orders.take_off") }}
                </div>
              </div>
            </div>
            <div class="content-box-footer">
              <m-btn
                :loading="ordersStore.isCommonDownloadExcelLoading"
                @click="commonDownloadExcel"
              >
                {{ t("orders.download") }}
              </m-btn>
            </div>
          </div>
        </div>
      </transition>
    </div>
    <div class="download-content-bottom">
      <flex-col class="gap-4">
        <page-title20 :title="t('orders.upload_as_files')" />
        <div
          class="grid items-center justify-between page-gap sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full"
        >
          <DownloadDropdown
            v-for="item in downloadDropdownStates"
            :key="item.key"
            :data="item"
            :is-loading="ordersStore.isInvoicesDownloadExcelLoading"
            @onOpenDialog="onIconClick"
            @setSelectedItem="setSelectedData"
          />
        </div>
      </flex-col>
    </div>
  </div>
  <transition name="modal">
    <div v-if="openedConfig">
      <d-modal :name="openedConfigName" @closeDialog="openedConfig = undefined">
        <flex-col class="gap-3 w-full">
          <div
            v-for="item in openedConfigState"
            :key="item.id"
            class="border rounded-lg bg-lotion"
          >
            <!-- TO-DO: Remove disabled, when all files will be ready from backend -->
            <div class="flex items-center justify-between p-3">
              <Checkbox
                :disabled="item?.disabled !== false"
                :checked="item.checked"
                :id="item.id"
                :title="item.name"
                @change="item.checked = $event"
              />
              <div v-if="item?.settings?.length || item?.settings_radio">
                <div
                  class="px-2 cursor-pointer"
                  @click="onOpenSettingsById(item.id)"
                >
                  <icon-settings-alt />
                </div>
              </div>
            </div>
            <div v-if="item?.settings">
              <transition name="toggle-accordion">
                <div v-if="isItemOpen(item.id)" class="bg-white rounded-b-lg">
                  <div class="flex flex-col gap-1 p-3 rounded-b-lg">
                    <div>
                      <Checkbox
                        title="Выбрать все"
                        :id="'select-all' + item.id"
                        :checked="isAllSettingsCheckedById(item.id)"
                        @change="onSelectAllSettingsById(item.id, $event)"
                      />
                    </div>
                    <div
                      v-for="(setting, index) in item?.settings"
                      :key="setting.key"
                    >
                      <Checkbox
                        :checked="setting.checked"
                        v-model="setting.checked"
                        :id="setting.key + index + item.id"
                        :title="setting.name"
                      />
                    </div>
                  </div>
                </div>
              </transition>
            </div>
            <div v-if="item?.settings_radio?.length">
              <transition name="toggle-accordion">
                <flex-col
                  v-if="isItemOpen(item.id)"
                  class="bg-white rounded-b-lg pl-3 mb-3 gap-5"
                >
                  <div
                    v-for="(radioItem, index) in item.settings_radio"
                    :key="index"
                  >
                    <i-title>{{ radioItem?.title }}</i-title>
                    <RadioBtn
                      :items="radioItem.items"
                      :selectedItem="radioItem.selected_value"
                      :name="radioItem.key"
                      group="column"
                      @onSelectItemId="radioItem.selected_value = $event"
                    />
                  </div>
                </flex-col>
              </transition>
            </div>
          </div>
        </flex-col>
        <template #footer>
          <m-btn @click="onSaveCheckedFileState" class="w-full"
            >{{ t("save") }}
          </m-btn>
        </template>
      </d-modal>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { notify, useNotification } from "@kyvg/vue3-notification";
import {
  setCheckedItemsToLocalByKey,
  getCheckedItemsByKey,
} from "~/utils/local-storage";
import type { RadioBtn, DropdownsByFilterStates } from "#components";
import type { FileStateModel } from "~/interfaces/ui/FileStateModel";
import { useI18n } from "vue-i18n";

const RadioBtnComponent = ref<typeof RadioBtn | null>(null);

// store
const ordersStore = useOrdersStore("main");

// states
const { t } = useI18n();
const isSeparateActive = ref(true);
const openedConfig = ref<string>();
const openedConfigState = ref<Array<FileStateModel>>();
const openedItemSettingsIds = ref<Array<number | string>>([]);
const isToggleOpen = ref(false);

const downloadDropdownStates = ref([
  {
    name: t("orders.loading_warehouse"),
    key: "warehouse-manager",
    data_key: "order-download-warehouse-manager-files",
    get data() {
      return {
        items: getDownloadItems("order-download-warehouse-manager-files"),
      };
    },
  },
  {
    name: t("orders.loading_forwarder"),
    key: "expeditor",
    data_key: "order-download-expeditor-files",
    get data() {
      return {
        items: getDownloadItems("order-download-expeditor-files"),
      };
    },
  },
  {
    name: t("orders.invoices"),
    key: "invoice",
    data_key: "order-download-invoice-files",
    get data() {
      return {
        items: getDownloadItems("order-download-invoice-files"),
      };
    },
  },
  {
    name: t("orders.register"),
    key: "registry",
    data_key: "order-download-registry-files",
    get data() {
      return {
        items: getDownloadItems("order-download-registry-files"),
      };
    },
  },
]);

// hooks
const keyNameOfLocal = computed(
  () => \`order-download-\${openedConfig.value}-files\`,
);

const openedConfigName = computed(() => {
  switch (openedConfig.value) {
    case "warehouse-manager":
      return t("orders.loading_warehouse");
    case "expeditor":
      return t("orders.loading_forwarder");
    case "invoice":
      return t("orders.invoices");
    case "registry":
      return t("orders.register");
    default:
      return t("orders.loading");
  }
});

watchEffect(() => {
  if (openedConfig.value) {
    setOpenedConfigState();
  }
});

// methods

const changeSeparateCheckbox = (value: boolean) => {
  isSeparateActive.value = value;
};

const clearRadioBtnData = (index: number) => {
  RadioBtnComponent.value[index].onClear();
};

const setSelectedData = (key: string, fileId: number) => {
  onDownloadSelectedFile(key, fileId);
};

const getDownloadItems = (type: string) => {
  const fileStatesMap = {
    "order-download-warehouse-manager-files":
      ordersStore.warehouseManagerFileStates,
    "order-download-expeditor-files": ordersStore.expeditorFileStates,
    "order-download-invoice-files": ordersStore.invoiceFileStates,
    "order-download-registry-files": ordersStore.registryFileStates,
  };

  const localFileState = getCheckedFileStateFromLocal(type)?.filter(
    (item) => item.checked,
  );

  return localFileState?.length
    ? localFileState
    : fileStatesMap[type]?.filter((item) => item.checked) || [];
};

const setOpenedConfigState = () => {
  switch (openedConfig.value) {
    case "warehouse-manager":
      openedConfigState.value =
        getCheckedFileStateFromLocal(keyNameOfLocal.value) ||
        ordersStore.warehouseManagerFileStates;
      break;
    case "expeditor":
      openedConfigState.value =
        getCheckedFileStateFromLocal(keyNameOfLocal.value) ||
        ordersStore.expeditorFileStates;
      break;
    case "invoice":
      openedConfigState.value =
        getCheckedFileStateFromLocal(keyNameOfLocal.value) ||
        ordersStore.invoiceFileStates;
      break;
    case "registry":
      openedConfigState.value =
        getCheckedFileStateFromLocal(keyNameOfLocal.value) ||
        ordersStore.registryFileStates;
      break;
    default:
      openedConfigState.value = [];
      break;
  }
};

const commonDownloadExcel = async () => {
  if (ordersStore.orderIds?.length > 0) {
    let commonDownloadExcelPayload = {
      order_id_arr: ordersStore.orderIds,
      common_filter_arr: [],
    };
    downloadDropdownStates.value?.map((item) => {
      if (item?.fileId) {
        const parsedCheckboxSettings = getParsedFileCheckboxSettings(
          item.key,
          item?.fileId,
        );
        const parsedRadioSettings = getParsedFileRadioSettings(
          item.key,
          item?.fileId,
        );
        const settingsObj = {
          ...parsedCheckboxSettings,
          ...parsedRadioSettings,
        };
        commonDownloadExcelPayload.common_filter_arr.push({
          order_excel_type: item.fileId,
          data: settingsObj,
        });
      }
    });
    if (commonDownloadExcelPayload.common_filter_arr.length > 0) {
      await ordersStore.onDownloadCommonInvoice(commonDownloadExcelPayload);
    } else {
      notify({ title: "Выберите один из файлов", type: "error" });
    }
  } else {
    const { notify } = useNotification();
    notify({ title: t("first_select_order"), type: "error" });
  }
};

const onDownloadSelectedFile = async (key: string, fileId: number) => {
  if (ordersStore.orderIds?.length > 0) {
    const parsedCheckboxSettings = getParsedFileCheckboxSettings(key, fileId);
    const parsedRadioSettings = getParsedFileRadioSettings(key, fileId);
    const settingsObj = {
      ...parsedCheckboxSettings,
      ...parsedRadioSettings,
    };
    await ordersStore.onDownloadInvoice(
      key,
      fileId,
      ordersStore.orderIds,
      settingsObj,
    );
  } else {
    const { notify } = useNotification();
    notify({ title: t("first_select_order"), type: "error" });
  }
};

const getParsedFileCheckboxSettings = (
  key: string,
  fileId: number | string,
) => {
  let checkboxSettings:
    | Array<{
        name: string;
        checked: boolean;
        key: string;
      }>
    | undefined = undefined;
  const checkedItemsFromLocal = getCheckedFileStateFromLocal(
    \`order-download-\${key}-files\`,
  );
  if (checkedItemsFromLocal) {
    checkboxSettings = checkedItemsFromLocal.find(
      (item) => item.id === fileId,
    )?.settings;
  } else {
    checkboxSettings = ordersStore.getFileCheckboxSettingsById(key, fileId);
  }
  return checkboxSettings
    ? convertCheckboxSettingsArrToObj(checkboxSettings)
    : undefined;
};

const getParsedFileRadioSettings = (key: string, fileId: number | string) => {
  let radioSettings:
    | Array<{
        title: string;
        selected_value: number;
        key: string;
        items: Array<{
          id: number;
          name: string;
        }>;
      }>
    | undefined = undefined;
  const checkedItemsFromLocal = getCheckedFileStateFromLocal(
    \`order-download-\${key}-files\`,
  );
  if (checkedItemsFromLocal) {
    radioSettings = checkedItemsFromLocal.find(
      (item) => item.id === fileId,
    )?.settings_radio;
  } else {
    radioSettings = ordersStore.getFileRadioSettingsById(key, fileId);
  }

  return radioSettings
    ? radioSettings.reduce((obj, item) => {
        obj[item.key] = item.selected_value;
        return obj;
      }, {})
    : undefined;
};

const convertCheckboxSettingsArrToObj = (
  settings: Array<{
    name: string;
    checked: boolean;
    key: string;
  }>,
) => {
  const settingsObj: Record<string, boolean> = {};
  settings?.forEach((item) => {
    settingsObj[item.key] = item.checked;
  });
  return settingsObj;
};

const onIconClick = (state: string) => {
  openedConfig.value = state;
};

const setCheckedFileStateToLocal = (
  key: string,
  fileState: Array<FileStateModel>,
) => setCheckedItemsToLocalByKey(key, fileState);

const getCheckedFileStateFromLocal = (
  key: string,
): Array<FileStateModel> | null => getCheckedItemsByKey(key);

const onSaveCheckedFileState = () => {
  setCheckedFileStateToLocal(keyNameOfLocal.value, openedConfigState.value);
  openedConfig.value = undefined;
  notify({ title: t("save"), type: "success" });
};

const isItemOpen = (id: number | string) => {
  return openedItemSettingsIds.value?.includes(id);
};

const onOpenSettingsById = (id: number | string) => {
  if (!isItemOpen(id)) {
    openedItemSettingsIds.value.push(id);
  } else {
    openedItemSettingsIds.value = openedItemSettingsIds.value.filter(
      (_id) => _id !== id,
    );
  }
};

const isAllSettingsCheckedById = (id: number | string) => {
  return !!openedConfigState.value
    .find((item) => item.id === id)
    ?.settings?.every((setting) => setting.checked);
};

const onSelectAllSettingsById = (id: number | string, isChecked: boolean) => {
  openedConfigState.value
    .find((item) => item.id === id)
    ?.settings?.forEach((setting) => (setting.checked = isChecked));
};

const changeToggle = () => {
  isToggleOpen.value = !isToggleOpen.value;
};
<\/script>

<style scoped lang="scss">
.order-download-content {
  background: white;
  border-radius: 8px;
  border: 1px solid #e1e4e4;
  display: grid;
  gap: 20px;
  margin-top: 12px;

  .download-content-top {
    padding: 20px 20px 0;

    .content-header {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;

      .content-header-left {
        display: flex;
        align-items: center;
        gap: 0 20px;
      }
    }
  }

  .download-content-body {
    border-bottom: 1px solid #e1e4e4;

    .container-box {
      margin-bottom: 20px;
      padding: 0 20px;

      .content-box {
        border: 1px solid #e1e4e4;
        border-radius: 8px;

        .content-box-body {
          display: flex;
          align-items: start;
          justify-content: space-between;

          .download-box {
            padding: 16px;
            height: 100%;
            width: 25%;

            .card-title {
              font-size: 20px;
              font-family: "Inter", sans-serif;
              font-weight: 500;
              color: #000000;
              padding-bottom: 8px;
              border-bottom: 1px solid #e1e4e4;
            }

            .card-body {
              width: fit-content;
              padding-top: 12px;
            }

            .card-footer {
              color: red;
              font-weight: 400;
              font-family: "Inter", sans-serif;
              font-size: 13px;
              cursor: pointer;
              padding: 12px 26px 0;
            }
          }

          .download-box:last-child {
            border-right: 0;
          }
        }

        .content-box-footer {
          display: flex;
          align-items: center;
          justify-content: end;
          gap: 16px;
          padding: 16px;
          border-top: 1px solid #e1e4e4;
        }
      }
    }
  }

  .download-content-bottom {
    padding: 0 20px 20px;
  }
}
</style>
`;export{e as default};
