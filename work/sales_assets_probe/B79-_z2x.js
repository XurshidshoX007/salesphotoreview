const n=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="id ? t('edit') : t('clients.add')"
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
          :label="t('labels.sort')"
          :value="data.sort"
          pattern-type="sort"
          @change="data.sort = $event"
        />
        <Switch :active="data.is_active" @change="onChangeActivity" />
        <Switch
          :title="t('settings.is_default')"
          :active="data.is_default"
          @change="data.is_default = $event"
        />
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
import type { BaseCurrencyModel } from "~/interfaces/api/base-currency-model";

// Store
const currenciesStore = useBaseCurrenciesStore("main");

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
const updateListEventKey = SettingsEventKeys.BASE_CURRENCY_TABLE_UPDATE;

const data = ref<BaseCurrencyModel>({
  id: undefined,
  code: null,
  name: "",
  default_name: "",
  name_l10n: {},
  sort: null,
  is_active: true,
  is_default: false,
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

// Methods
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
  const res = await currenciesStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active);
    notify({ title: "Сохранено!", type: "success" });
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getDetail = async () => {
  initialDetailData.value = await currenciesStore.getDetailCurrency(props.id);
  data.value = { ...initialDetailData.value };
};

const closeDialog = () => {
  emit("closeDialog");
};
<\/script>
`;export{n as default};
