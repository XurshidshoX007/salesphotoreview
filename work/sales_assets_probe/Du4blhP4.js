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
          :label="t('column.code')"
          type="text"
          pattern-type="code"
          :value="data.code"
          @change="data.code = $event"
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
import { useI18n } from "vue-i18n";
import { notify } from "@kyvg/vue3-notification";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import type { SalesChannelsModel } from "~/interfaces/api/settings/salles-channels-model";

// stores
const salesChannelsStore = useSalesChannelsStore("main");

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// states
const { t } = useI18n();
const eventBus = useEventBus();
const isLoading = ref<boolean>(false);
const isBtnLoading = ref<boolean>(false);
const updateListEventKey = SettingsEventKeys.SALES_CHANNEL_TABLE_UPDATE;

const data = ref<SalesChannelsModel>({
  id: undefined,
  name: "",
  default_name: "",
  name_l10n: {},
  code: null,
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
    isLoading.value = true;
    await getDetail();
    isLoading.value = false;
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

const save = async () => {
  isBtnLoading.value = true;
  const res = await salesChannelsStore.add(data.value);
  if (res !== "error") {
    notify({ title: t("success"), type: "success" });
    updateListByActiveState(data.value.is_active);
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getDetail = async () => {
  initialDetailData.value = await salesChannelsStore.getDetail(props.id!);
  data.value = { ...initialDetailData.value };
};
<\/script>
`;export{n as default};
