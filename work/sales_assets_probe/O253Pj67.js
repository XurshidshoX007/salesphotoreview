const n=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="props.id ? t('edit') : t('clients.add')"
      :loading="isLoading"
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
          type="text"
          :label="t('settings.short_name')"
          :value="data.short_name"
          @change="data.short_name = $event"
        />
        <d-input
          type="number"
          pattern-type="sort"
          :label="t('labels.sort')"
          :value="data.sort"
          @change="(value) => (data.sort = value)"
        />
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="data.default_description"
          v-model:translations="data.description_l10n"
        />
        <Switch :active="data.is_active" @change="changeActivity" />
      </flex-col>
      <template #footer>
        <m-btn :loading="isBtnLoading" class="w-full" type="submit">
          {{ !data.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import type { BoxTypeModel } from "~/interfaces/api/settings/box-type-model";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// store
const boxTypesStore = useBoxTypesStore("");

// state
const { t } = useI18n();
const eventBus = useEventBus();
const isLoading = ref<boolean>(false);
const isBtnLoading = ref<boolean>(false);
const updateListEventKey = SettingsEventKeys.BOX_TYPES_TABLE_UPDATE;

const data = ref<Partial<BoxTypeModel>>({
  id: undefined,
  name: "",
  default_name: "",
  name_l10n: {},
  short_name: "",
  code: null,
  is_active: true,
  sort: null,
  description: null,
  default_description: null,
  description_l10n: {},
});
const initialDetailData = ref(); // used to store the detail data on edit

// hooks
const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

onBeforeMount(async () => {
  if (props.id) {
    isLoading.value = true;
    await getDetail();
    isLoading.value = false;
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

const save = async () => {
  isBtnLoading.value = true;
  const res = await boxTypesStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    notify({ title: t("saved"), type: "success" });
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getDetail = async () => {
  initialDetailData.value = await boxTypesStore.getDetail(props.id!);
  data.value = { ...initialDetailData.value };
};

const changeActivity = (isActive: boolean) => {
  data.value.is_active = isActive;
};
<\/script>
`;export{n as default};
