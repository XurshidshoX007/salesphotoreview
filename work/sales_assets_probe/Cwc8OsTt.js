const n=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="data?.id ? t('edit') : t('clients.add')"
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
          :label="t('column.code')"
          type="text"
          pattern-type="code"
          :value="data.code"
          @change="data.code = $event"
        />
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="data.default_description"
          v-model:translations="data.description_l10n"
        />
        <Switch :active="data.is_active" @change="data.is_active = $event" />
      </flex-col>
      <template #footer>
        <m-btn :loading="isBtnLoading" class="w-full" type="submit">
          {{ !data.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
  <LoadingModal v-if="isLoading" />
</template>

<script setup lang="ts">
import type { PhotoReportCategoryModel } from "~/interfaces/api/settings/photo-report-category-model";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { notify } from "@kyvg/vue3-notification";

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

const photoReportCategoriesStore = usePhotoReportCategoriesStore("");

// state
const { t } = useI18n();
const isBtnLoading = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const eventBus = useEventBus();
const updateListEventKey =
  SettingsEventKeys.PHOTO_REPORT_CATEGORIES_TABLE_UPDATE;

const data = ref<Partial<PhotoReportCategoryModel>>({
  id: undefined,
  name: "",
  default_name: "",
  name_l10n: {},
  code: null,
  description: "",
  default_description: "",
  description_l10n: {},
  is_active: true,
});
const initialDetailData = ref(); // used to store the detail data on edit

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

const closeDialog = () => {
  emit("closeDialog");
};

// methods
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
  const res = await photoReportCategoriesStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    notify({ title: t("saved"), type: "success" });
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getDetail = async () => {
  isLoading.value = true;
  initialDetailData.value = await photoReportCategoriesStore.getDetail(
    props.id!,
  );
  data.value = { ...initialDetailData.value };
  isLoading.value = false;
};
<\/script>
`;export{n as default};
