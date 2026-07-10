const n=`<template>
  <form id="app" class="w-full" @submit.prevent="save">
    <DModal
      :name="props.id ? t('edit') : t('clients.add')"
      :loading="clientTypeStore.loadingUpdate"
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
          pattern-type="code"
          type="text"
          :value="data.code"
          @change="data.code = $event"
        />

        <div class="flex items-center justify-between">
          <div class="fs-14">{{ t("labels.color") }}</div>
          <div class="flex items-center gap-x-2">
            <div class="input-color-container cursor-pointer border-grey">
              <input v-model="data.color" class="input-color" type="color" />
            </div>
          </div>
        </div>
        <Switch :active="data.is_active" @change="data.is_active = $event" />
      </flex-col>
      <template #footer>
        <m-btn :loading="isBtnLoading" class="w-full" type="submit">
          {{ !data.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </DModal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import type { ClientTypeModel } from "~/interfaces/api/clients/client-type-model";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";

// store
const { t } = useI18n();
const clientTypeStore = useClientTypesStore("");

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// states
const isBtnLoading = ref<boolean>(false);
const eventBus = useEventBus();
const updateListEventKey = SettingsEventKeys.CLIENT_TYPES_TABLE_UPDATE;

const data = ref<ClientTypeModel>({
  id: undefined,
  name: null,
  default_name: "",
  name_l10n: {},
  color: null,
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

const save = async () => {
  isBtnLoading.value = true;
  const res = await clientTypeStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active);
    notify({ title: t("saved") });
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getDetail = async () => {
  initialDetailData.value = await clientTypeStore.detailClientCategory(
    props.id!,
  );
  data.value = { ...initialDetailData.value };
};

const closeDialog = () => {
  emit("closeDialog");
};
<\/script>

<style scoped>
.input-color-container {
  position: relative;
  overflow: hidden;
  width: 28px;
  height: 28px;
  border-radius: 8px;
}

.input-color {
  position: absolute;
  right: -8px;
  top: -8px;
  width: 56px;
  height: 56px;
  border: none;
}
</style>
`;export{n as default};
