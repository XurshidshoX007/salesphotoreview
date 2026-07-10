const n=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="props.id ? t('edit') : t('clients.add')"
      :loading="salaryAllowanceDeductionStore.loadingDetailData"
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-5">
        <shared-localized-input
          required
          :label="t('column.name')"
          v-model:base="data.default_name"
          v-model:translations="data.name_l10n"
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
          pattern-type="sort"
          :label="t('labels.sort')"
          :value="data.sort"
          @change="data.sort = $event"
        />
        <DropdownsByFilterStates
          :filter-states="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="data.default_description"
          v-model:translations="data.description_l10n"
        />
        <Switch :active="data.is_active" @change="changeActivity" />
      </flex-col>
      <template #footer>
        <m-btn
          :loading="salaryAllowanceDeductionStore.loadingSaveData"
          class="w-full"
          type="submit"
        >
          {{ !data.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import type { SalaryAllowanceDeductionSaveModel } from "~/interfaces/api/settings/salary-bonus/salary-bonus-model";

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// store
const salaryAllowanceDeductionStore = useSalaryAllowanceDeductionStore("main");

// state
const { t } = useI18n();
const eventBus = useEventBus();
const initialDetailData = ref();
const updateListEventKey =
  SettingsEventKeys.SALARY_ALLOWANCE_DEDUCTION_TABLE_UPDATE;

const data = ref<SalaryAllowanceDeductionSaveModel>({
  id: undefined,
  name: null,
  default_name: "",
  name_l10n: {},
  code: null,
  is_active: true,
  sort: null,
  description: null,
  default_description: null,
  description_l10n: {},
  type: null,
  calculation_type: null,
});

const filterStates = ref([
  {
    name: t("users.type"),
    key: "type",
    isSingleSelect: true,
    required: true,
    get data() {
      return (
        salaryAllowanceDeductionStore.salaryAllowanceDeductionTypeData || []
      );
    },
    get getSelectedData() {
      return data.value.type;
    },
    set setSelectedData(value: number) {
      data.value.type = value;
    },
  },
  {
    name: t("settings.calculation_type"),
    key: "calculation_type",
    isSingleSelect: true,
    required: true,
    get data() {
      return (
        salaryAllowanceDeductionStore.salaryAllowanceDeductionCalculationTypeData ||
        []
      );
    },
    get getSelectedData() {
      return data.value.calculation_type;
    },
    set setSelectedData(value: number) {
      data.value.calculation_type = value;
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
    await Promise.all([
      salaryAllowanceDeductionStore.getSalaryAllowanceDeductionCalculationType(),
      salaryAllowanceDeductionStore.getSalaryAllowanceDeductionType(),
      getDetail(),
    ]);
  }
});

// methods
const closeDialog = () => {
  emit("closeDialog");
};

const updateListByActiveState = (isActive: boolean) => {
  if (isActiveStateChangedOnEdit.value) {
    eventBus.emit(updateListEventKey, !isActive);
    emit("clearFetchedTab", !isActive);
    return;
  }
  eventBus.emit(updateListEventKey, isActive);
};

const onOpenDropdown = async (key: string) => {
  if (
    key === "type" &&
    !salaryAllowanceDeductionStore.salaryAllowanceDeductionTypeData
  ) {
    await salaryAllowanceDeductionStore.getSalaryAllowanceDeductionType();
  } else if (
    key === "calculation_type" &&
    !salaryAllowanceDeductionStore.salaryAllowanceDeductionCalculationTypeData
  ) {
    await salaryAllowanceDeductionStore.getSalaryAllowanceDeductionCalculationType();
  }
};

const save = async () => {
  const res = await salaryAllowanceDeductionStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    notify({ title: t("saved"), type: "success" });
    closeDialog();
  }
};

const getDetail = async () => {
  initialDetailData.value = await salaryAllowanceDeductionStore.getDetail(
    props.id!,
  );
  data.value = { ...initialDetailData.value };
};

const changeActivity = (isActive: boolean) => {
  data.value.is_active = isActive;
};
<\/script>
`;export{n as default};
