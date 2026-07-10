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
          :label="t('labels.sort')"
          type="number"
          pattern-type="sort"
          :value="data.sort"
          @change="data.sort = $event"
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
        <Switch
          :title="t('column.use_in_order_proposal')"
          :active="data.can_be_used_in_order_suggestion"
          @change="data.can_be_used_in_order_suggestion = $event"
        />
      </flex-col>
      <template #footer>
        <m-btn class="w-full" :loading="isLoadingBtn" type="submit">
          {{ !data.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { TradeDirectionsModel } from "~/interfaces/api/settings/trade-directions-model";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";

// store
const tradeDirectionsStore = useTradeDirectionsStore("");

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// states
const { t } = useI18n();
const eventBus = useEventBus();
const isLoadingBtn = ref(false);
const isLoading = ref(false);
const updateListEventKey = SettingsEventKeys.TRADE_DIRECTION_TABLE_UPDATE;

const data = ref<Partial<TradeDirectionsModel>>({
  id: undefined,
  name: "",
  default_name: "",
  name_l10n: {},
  sort: null,
  code: null,
  description: null,
  default_description: "",
  description_l10n: {},
  is_active: true,
  can_be_used_in_order_suggestion: false,
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
  isLoadingBtn.value = true;
  await tradeDirectionsStore.add(data.value);
  updateListByActiveState(data.value.is_active!);
  closeDialog();
  isLoadingBtn.value = false;
};

const getDetail = async () => {
  initialDetailData.value = await tradeDirectionsStore.getDetail(props.id!);
  data.value = { ...initialDetailData.value };
};
<\/script>
`;export{n as default};
