const e=`<template>
  <d-modal :name="t('users.configurations')" @closeDialog="closeDialog">
    <flex-col class="gap-3 w-full">
      <div
        v-for="item in fileStates"
        :key="item.id"
        class="border rounded-lg bg-lotion"
      >
        <div class="flex items-center justify-between p-3">
          <Checkbox
            :checked="item.checked"
            :id="item.id"
            :title="item.name"
            @change="onCheckItem(item.id, $event)"
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
                  :key="item.id"
                  :items="radioItem.items"
                  :selectedItem="radioItem.selected_value"
                  :name="radioItem.key + item.id"
                  group="column"
                  @onSelectItemId="
                    onSelectRadioItem(item.id, radioItem.key, $event)
                  "
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
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { FileStateModel } from "~/interfaces/ui/FileStateModel";

// props
const props = defineProps<{
  fileStates: FileStateModel[];
}>();

// emits
const emit = defineEmits(["closeDialog", "updateFileStates"]);

// store
const invoicesStore = useInvoicesStore("main");

// states
const { t } = useI18n();
const openedItemSettingsIds = ref<Array<number>>([]);

// methods
const closeDialog = () => {
  emit("closeDialog");
};

const setCheckedFileStateToLocal = (
  key: string,
  fileState: Array<FileStateModel>,
) => setCheckedItemsToLocalByKey(key, fileState);

const onSaveCheckedFileState = () => {
  setCheckedFileStateToLocal(invoicesStore.fileStateKey, props.fileStates);
  closeDialog();
  notify({ title: t("toast.saved"), type: "success" });
  emit("updateFileStates");
};

const isItemOpen = (id: number) => {
  return openedItemSettingsIds.value?.includes(id);
};

const onOpenSettingsById = (id: number) => {
  if (!isItemOpen(id)) {
    openedItemSettingsIds.value.push(id);
  } else {
    openedItemSettingsIds.value = openedItemSettingsIds.value.filter(
      (_id) => _id !== id,
    );
  }
};

const onCheckItem = (id: number, checked: boolean) => {
  const item = props.fileStates.find((item) => item.id === id);
  if (item) {
    item.checked = checked;
  }
};

const onSelectRadioItem = (itemId: number, radioKey: string, value: number) => {
  const item = props.fileStates.find((item) => item.id === itemId);
  if (item) {
    const radioItem = item.settings_radio?.find(
      (radioItem) => radioItem.key === radioKey,
    );
    if (radioItem) {
      radioItem.selected_value = value;
    }
  }
};

const isAllSettingsCheckedById = (id: number) => {
  return !!props.fileStates
    .find((item) => item.id === id)
    ?.settings?.every((setting) => setting.checked);
};

const onSelectAllSettingsById = (id: number, isChecked: boolean) => {
  props.fileStates
    .find((item) => item.id === id)
    ?.settings?.forEach((setting) => (setting.checked = isChecked));
};
<\/script>
`;export{e as default};
