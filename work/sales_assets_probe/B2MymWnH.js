const e=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="id ? t('edit') : t('clients.add')"
      :loading="expenseStore.isDetailExpenseTypeLoading"
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-5">
        <shared-localized-input
          required
          :label="t('column.name')"
          v-model:base="data.default_name"
          v-model:translations="data.name_l10n"
        />
        <DropdownsByFilterStates
          :filterStates="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <d-input
          type="text"
          :label="t('column.code')"
          pattern-type="code"
          :value="data.code"
          @change="data.code = $event"
        />
        <d-input
          type="number"
          :label="t('labels.sort')"
          :value="data.sort"
          pattern-type="sort"
          @change="data.sort = $event"
        />
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="data.default_description"
          v-model:translations="data.description_l10n"
        />
        <Switch :active="data.is_active" @change="onChangeActivity" />
      </flex-col>
      <template #footer>
        <m-btn :loading="isBtnLoading" class="w-full" type="submit">
          {{ !id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { useEventBus } from "~/composables/EventBus/eventBus";
import type { ExpenseTypeListModel } from "~/interfaces/api/settings/expense/expense-model";

// Store
const expenseStore = useSettingsExpanse("main");

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// State
const { t } = useI18n();
const eventBus = useEventBus();
const isBtnLoading = ref(false);
const updateListEventKey = SettingsEventKeys.EXPENSE_TYPE_TABLE_UPDATE;

const data = ref<ExpenseTypeListModel>({
  id: undefined,
  code: null,
  name: "",
  default_name: "",
  name_l10n: {},
  description: "",
  default_description: "",
  description_l10n: {},
  sort: null,
  is_active: true,
  is_sys_data: false,
  expense_category_id: null,
});
const initialDetailData = ref(); // used to store the detail data on edit

const filterStates = ref([
  {
    name: t("column.expense_category_name"),
    key: "expense-category-name",
    isSingleSelect: true,
    required: true,
    get data() {
      return expenseStore.expenseCategory || [];
    },
    get getSelectedData() {
      return data.value.expense_category_id;
    },
    set setSelectedData(value: string) {
      data.value.expense_category_id = value;
    },
  },
]);

// hooks
const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

onBeforeMount(async () => {
  if (props.id) {
    await getDetail();
    await expenseStore.getDropdownExpenseCategory();
  }
});

// Methods
const onOpenDropdown = async (state: string, value: unknown) => {
  if (state === "expense-category-name" && !expenseStore.expenseCategory) {
    await expenseStore.getDropdownExpenseCategory();
    return;
  }
};

const onChangeActivity = (isActive: boolean) => {
  data.value.is_active = isActive;
};

const updateListByActiveState = (isActive: boolean) => {
  if (isActiveStateChangedOnEdit.value) {
    eventBus.emit(updateListEventKey, !isActive);
    emit("clearFetchedTab", !isActive);
    return;
  }
  eventBus.emit(updateListEventKey, isActive);
};

const save = async () => {
  isBtnLoading.value = true;
  const res = await expenseStore.addExpenseType(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active);
    notify({ title: t("save"), type: "success" });
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getDetail = async () => {
  initialDetailData.value = await expenseStore.getDetailExpenseType(props.id!);
  data.value = { ...initialDetailData.value };
};

const closeDialog = () => {
  emit("closeDialog");
};
<\/script>
`;export{e as default};
