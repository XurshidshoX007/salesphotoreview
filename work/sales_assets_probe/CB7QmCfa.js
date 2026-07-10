const n=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="props.id ? t('edit') : t('clients.add')"
      :loading="unitsStore.loadingUpdate"
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
          :label="t('labels.headings')"
          :required="true"
          :value="data?.title"
          @change="data.title = $event"
        />
        <d-input
          type="text"
          pattern-type="code"
          :label="t('column.code')"
          :value="data?.code"
          @change="data.code = $event"
        />
        <d-input
          type="number"
          pattern-type="sort"
          :label="t('labels.sort')"
          :value="data?.sort"
          @change="data.sort = $event"
        />
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="data.default_description"
          v-model:translations="data.description_l10n"
        />
        <Switch :active="data.is_active" @change="data.is_active = $event" />
      </flex-col>
      <template #footer>
        <m-btn class="w-full" type="submit" :loading="isBtnLoading">
          {{ !data.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import type { UnitModel } from "~/interfaces/api/settings/unit-model";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";

// Sotre
const unitsStore = useUnitsStore("");

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// State
const { t } = useI18n();
const eventBus = useEventBus();
const isBtnLoading = ref<boolean>(false);
const updateListEventKey = SettingsEventKeys.UNITS_TABLE_UPDATE;

const data = ref<Partial<UnitModel>>({
  id: undefined,
  default_name: "",
  name_l10n: {},
  code: null,
  title: "",
  default_description: undefined,
  description_l10n: {},
  is_active: true,
  sort: null,
});
const initialDetailData = ref(); // used to store the detail data on edit

// Hooks
const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

onMounted(async () => {
  if (props.id) {
    await getDetail(props.id);
  }
});

// Methods
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
  const res = await unitsStore.add(data.value);
  isBtnLoading.value = false;
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    notify({ title: t("saved") });
    closeDialog();
  }
};

const getDetail = async (id: string) => {
  initialDetailData.value = await unitsStore.getById(id);
  data.value = { ...initialDetailData.value };
};

const closeDialog = () => {
  emit("closeDialog");
};
<\/script>
`;export{n as default};
