const n=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="props.id ? t('edit') : t('clients.add')"
      :loading="clientCategoriesStore.loadingUpdate"
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
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import type { ClientCategoryModel } from "~/interfaces/api/settings/client-category-model";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";

// Store
const clientCategoriesStore = useClientCategoriesStore("");

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
const updateListEventKey = SettingsEventKeys.CLIENT_CATEGORIES_TABLE_UPDATE;

const data = ref<ClientCategoryModel>({
  id: undefined,
  name: "",
  default_name: "",
  name_l10n: {},
  description: "",
  default_description: "",
  description_l10n: {},
  code: null,
  is_active: true,
});
const initialDetailData = ref(); // used to store the detail data on edit

// Hooks
const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

onBeforeMount(async () => {
  if (props.id) {
    await getDetail();
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
  const res = await clientCategoriesStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active);
    notify({ title: "Сохранено!" });
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getDetail = async () => {
  data.value = await clientCategoriesStore.detailClientCategory(props.id);
  initialDetailData.value = { ...data.value };
};

const closeDialog = () => {
  emit("closeDialog");
};
<\/script>
`;export{n as default};
