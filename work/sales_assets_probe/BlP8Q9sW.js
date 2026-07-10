const e=`<template>
  <d-modal
    :name="t('reports.show_hide_reports_menu')"
    @closeDialog="closeDialog"
  >
    <template #header>
      <search-input @change="search" />
    </template>
    <flex-col class="gap-4 w-full">
      <Checkbox
        id="choose_all"
        :checked="allSelected"
        @change="onAllSelect"
        :title="t('filters.choose_all')"
      />
      <template v-for="item in searchResults" :key="item.action || item.url">
        <Checkbox
          :checked="!!item?.isShowable"
          :title="item.name"
          :disabled="item?.disabled"
          @change="item.isShowable = !item.isShowable"
        />
      </template>
    </flex-col>
    <template #footer>
      <m-btn @click="onSave" class="w-full">{{ t("save") }}</m-btn>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import {
  setCheckedItemsToLocalByKey,
  getCheckedItemsByKey,
} from "~/utils/local-storage";
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  itemsArr: Array<object>;
  menuKey: string;
}>();
const { t } = useI18n();

const allSelected = ref(false);

// emits
const emit = defineEmits(["closeDialog", "updateChildren"]);

// hooks
const keyName = computed(() => \`sidebar-\${props.menuKey}-menus\`);

const items = computed(() => {
  return (
    getCheckedItemsByKey(keyName.value) ||
    JSON.parse(JSON.stringify(props.itemsArr))
  );
});

const openedConfigState = computed(() => {
  switch (props.menuKey) {
    case "reports": {
      return items.value.filter(
        (item) => item.action !== "open-report-settings-dialog"
      );
    }
    default:
      return [];
  }
});

const nonRemovableItems = computed(() => {
  switch (props.menuKey) {
    case "reports": {
      return items.value.filter(
        (item) => item.action === "open-report-settings-dialog"
      );
    }
    default:
      return [];
  }
});

const searchResults = ref(openedConfigState.value);

const search = (value: string) => {
  if (!openedConfigState.value) return;
  searchResults.value = openedConfigState.value.filter((item) =>
    item.Name.toUpperCase()?.includes(value.toUpperCase())
  );
};

const onAllSelect = () => {
  allSelected.value = !allSelected.value;
  const newLists = openedConfigState.value?.map((item) => {
    if (!item.disabled) {
      item.isShowable = allSelected.value;
    }
    return item;
  });

  openedConfigState.value = newLists;
};

const onSave = () => {
  setCheckedItemsToLocalByKey(keyName.value, [
    ...openedConfigState.value,
    ...nonRemovableItems.value,
  ]);
  emit("updateChildren", props.menuKey, [
    ...openedConfigState.value,
    ...nonRemovableItems.value,
  ]);
  closeDialog();
  notify({ title: "Сохранено!", type: "success" });
};

const closeDialog = () => emit("closeDialog");
<\/script>
`;export{e as default};
