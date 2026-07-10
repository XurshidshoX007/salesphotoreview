const n=`<template>
  <form @submit.prevent="save">
    <d-modal
      :name="!data.id ? t('add') : t('edit')"
      :loading="segmentsActiveStore.loadingUpdate"
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
          :label="t('column.code')"
          type="text"
          pattern-type="code"
          :value="data.code"
          @change="data.code = $event"
        />
        <Switch :active="data.is_active" @change="onChangeIsActive" />
      </flex-col>
      <template #footer>
        <m-btn :loading="isBtnLoading" type="submit" class="w-full">
          {{ !data.id ? t("add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import type { Segments } from "~/interfaces/api/settings/segments";
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
const segmentsActiveStore = useSegmentsStore("main");

// states
const { t } = useI18n();
const eventBus = useEventBus();
const isBtnLoading = ref<boolean>(false);
const updateListEventKey = SettingsEventKeys.SEGMENT_TABLE_UPDATE;

const data = ref<Segments>({
  id: undefined,
  name: "",
  default_name: "",
  name_l10n: {},
  code: null,
  is_active: true,
});
const initialDetailData = ref();

// hooks
const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

onBeforeMount(async () => {
  if (props.id) {
    await getDetail();
  }
});

// methods
const updateListByActiveState = (isActive: boolean) => {
  if (isActiveStateChangedOnEdit.value) {
    eventBus.emit(updateListEventKey, !isActive);
    emit("clearFetchedTab", !isActive);
    return;
  }
  eventBus.emit(updateListEventKey, isActive);
};

const closeDialog = () => {
  emit("closeDialog");
};

const onChangeIsActive = (newVal: boolean) => {
  data.value.is_active = newVal;
};

const save = async () => {
  isBtnLoading.value = true;
  const res = await segmentsActiveStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    notify({ title: t("saved"), type: "success" });
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getDetail = async () => {
  initialDetailData.value = await segmentsActiveStore.getDetail(props.id!);
  data.value = { ...initialDetailData.value };
};
<\/script>
`;export{n as default};
