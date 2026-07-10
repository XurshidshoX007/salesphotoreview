const n=`<template>
  <d-modal
    :name="t('column.dependent_bonuses')"
    :loading="isLoading"
    @closeDialog="onCancel"
  >
    <flex-col class="gap-4">
      <SearchInput @change="searchingValue = $event" no-debounce />
      <flex-col
        v-if="validDependencyBonuses?.length"
        class="max-h-[77vh] overflow-auto relative"
      >
        <flex-col class="gap-3 justify-center">
          <Checkbox
            id="all-select"
            :title="t('filters.choose_all')"
            :checked="isAllSelected"
            @change="onAllSelect"
          />
          <Checkbox
            v-for="validBonus in filteredDependencyBonuses"
            :key="validBonus.bonus_id"
            :id="validBonus.bonus_id"
            :title="validBonus?.bonus_name"
            :checked="!!validBonus?.is_dependent"
            @change="validBonus.is_dependent = $event"
          />
        </flex-col>
      </flex-col>
      <flex-row
        v-else
        class="w-full items-center justify-center text-2xl font-semibold"
      >
        {{ t("empty") }}
      </flex-row>
    </flex-col>
    <template #footer>
      <div class="w-full flex items-center justify-between">
        <m-btn group="outlined" @click="onCancel">{{
          t("clients.cancel")
        }}</m-btn>
        <m-btn :loading="isBtnLoading" @click="onSave">{{ t("save") }}</m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import type { BonusValidForDependency } from "~/interfaces/api/settings/bonus-valid-dependency-model";
import { useI18n } from "vue-i18n";

// stores
const bonusStore = useBonusesStore("true");

// props
const props = defineProps<{
  id: string;
}>();

// emits
const emit = defineEmits(["closeDialog"]);

// states
const { t } = useI18n();
const validDependencyBonuses = ref<BonusValidForDependency[]>();
const isLoading = ref<boolean>(false);
const isBtnLoading = ref<boolean>(false);
const searchingValue = ref<string>("");

// hooks
const isAllSelected = computed(
  () => !!validDependencyBonuses.value?.every((item) => item.is_dependent),
);

const dependentBonusIds = computed(() => {
  if (!validDependencyBonuses.value?.length) return [];
  return validDependencyBonuses.value
    .filter((validBonus) => validBonus.is_dependent)
    .map((filteredBonus) => filteredBonus.bonus_id);
});

const filteredDependencyBonuses = computed(() => {
  if (!validDependencyBonuses.value?.length) return [];
  if (!searchingValue.value) return validDependencyBonuses.value;
  return validDependencyBonuses.value.filter((item) =>
    item.bonus_name.toLowerCase().includes(searchingValue.value.toLowerCase()),
  );
});

onMounted(async () => {
  isLoading.value = true;
  await getValidDependencyBonuses();
  isLoading.value = false;
});

// methods
const onCancel = () => {
  emit("closeDialog");
};

const onAllSelect = (isChecked: boolean) => {
  validDependencyBonuses.value?.forEach(
    (item) => (item.is_dependent = isChecked),
  );
};

const getValidDependencyBonuses = async () => {
  if (!props.id) return;
  validDependencyBonuses.value =
    (await bonusStore.getValidForDependencyById(props.id)) || [];
};

const onSave = async () => {
  const payload = {
    bonus_id: props.id,
    dependent_bonus_id_arr: dependentBonusIds.value,
  };
  isBtnLoading.value = true;
  let res = await bonusStore.attachDependentBonus(payload);
  isBtnLoading.value = false;
  if (res !== "error") {
    emit("closeDialog");
    await bonusStore.refresh();
  }
};
<\/script>
`;export{n as default};
