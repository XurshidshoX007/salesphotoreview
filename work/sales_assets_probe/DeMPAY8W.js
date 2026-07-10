const n=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="props.id ? t('edit') : t('clients.add')"
      :loading="isLoading"
      @closeDialog="onCloseDialog"
    >
      <div class="space-y-5">
        <shared-localized-input
          required
          :label="t('column.name')"
          v-model:base="data.default_name"
          v-model:translations="data.name_l10n"
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
      </div>
      <template #footer>
        <m-btn class="w-full" type="submit" :loading="isSaving">
          {{ props.id ? t("save") : t("clients.add") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import type {
  BranchCreateModel,
  BranchModel,
  BranchUpdateModel,
} from "~/interfaces/api/settings/branch-model";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";

// Types
type Props = {
  id?: string;
};

type Emits = {
  (e: "closeDialog"): void;
  (e: "clearFetchedTab", isActive: boolean): void;
};

// Store
const branchesStore = useBranchesStore("");

// Props
const props = defineProps<Props>();

// Emits
const emit = defineEmits<Emits>();

// Constants
const updateListEventKey = SettingsEventKeys.BRANCHES_TABLE_UPDATE;

// State
const { t } = useI18n();
const eventBus = useEventBus();
const isLoading = ref(false);
const isSaving = ref(false);

const data = ref<Partial<BranchModel>>({
  id: undefined,
  name: "",
  default_name: "",
  name_l10n: {},
  code: undefined,
  description: undefined,
  default_description: undefined,
  description_l10n: {},
  is_active: true,
  sort: undefined,
});

const initialDetailData = ref<BranchModel | undefined>();

// Hooks
onMounted(async () => {
  if (props.id) {
    await getDetail(props.id);
  }
});

const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
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
  try {
    isSaving.value = true;

    if (props.id) {
      await branchesStore.edit(data.value as BranchUpdateModel);
    } else {
      await branchesStore.add(data.value as BranchCreateModel);
    }

    updateListByActiveState(data.value.is_active!);
    notify({ title: t("saved") });
    onCloseDialog();
  } catch (error) {
    console.error(error);
    notify({ type: "error", title: t("error") });
  } finally {
    isSaving.value = false;
  }
};

const getDetail = async (id: string) => {
  const response = await branchesStore.getById(id);
  initialDetailData.value = response.data;
  data.value = { ...response.data };
};

const onCloseDialog = () => emit("closeDialog");
<\/script>
`;export{n as default};
