const n=`<template>
  <form @submit.prevent="save">
    <d-modal
      :name="!data.id ? t('edit') : t('clients.add')"
      :loading="isLoading"
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-5">
        <shared-localized-input
          required
          auto-focus
          :label="t('column.name')"
          v-model:base="data.default_name"
          v-model:translations="data.name_l10n"
        />
        <DropdownsByFilterStates
          :filterStates="typeFilterStates"
          @on-open-dropdown="onOpenDropdown"
        />
        <d-input
          :label="t('column.code')"
          type="text"
          pattern-type="code"
          :value="data.code"
          @change="data.code = $event"
        />
        <d-input
          :label="t('labels.sort')"
          type="number"
          pattern-type="sort"
          :value="data.sort"
          @change="data.sort = $event"
        />
        <d-input
          :label="t('column.comment')"
          pattern-type="comment"
          :value="data.description"
          @change="data.description = $event"
        />
        <Switch :active="data.is_active" @change="onChangeActivity" />
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
import { ReasonTypes } from "~/variable/static-constants";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";
import type { NoteModel } from "~/interfaces/api/settings/note";

// store
const notesStore = useAuditNotesStore("main");

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits<{
  (e: "clearFetchedTab", data: boolean): void;
  (e: "closeDialog"): void;
}>();

// state
const { t } = useI18n();
const eventBus = useEventBus();
const isBtnLoading = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const updateListEventKey = SettingsEventKeys.ORDER_COMMENTS_TABLE_UPDATE;
const types = ref<ConstantModel[]>([]);

const initialDetailData = ref();

// hooks
const config = computed(() => {
  return {
    defaultSelectedTypes: [ReasonTypes.AUDIT_NOTE_TYPES],
    filteredTypes: {
      items:
        types.value?.filter(
          (type: ConstantModel) => type.id === ReasonTypes.AUDIT_NOTE_TYPES,
        ) || [],
    },
  };
});

const data = ref<Partial<NoteModel>>({
  id: undefined,
  name: "",
  default_name: "",
  name_l10n: {},
  code: null,
  sort: null,
  is_active: true,
  description: null,
  types: config.value.defaultSelectedTypes,
});

const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

const typeFilterStates = ref([
  {
    name: t("column.type"),
    key: "types",
    required: true,
    get disabled() {
      return true;
    },
    get data() {
      return config.value.filteredTypes;
    },
    get getSelectedData() {
      return data.value.types;
    },
    set setSelectedData(value: number[]) {
      data.value.types = value;
    },
  },
]);

// methods
const closeDialog = () => {
  emit("closeDialog");
};

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

const onOpenDropdown = async (key: string, value: unknown) => {
  if (key === "types" && !types.value.length) {
    await getTypes();
  }
};

const save = async () => {
  isBtnLoading.value = true;
  const res = await notesStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    notify({ title: t("toast.success"), type: "success" });
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getDetail = async () => {
  initialDetailData.value = await notesStore.getDetail(props.id!);
  data.value = { ...initialDetailData.value };
};

const getTypes = async () => {
  const data = await notesStore.getTypes();
  if (data) types.value = data;
};

onMounted(async () => {
  await getTypes();
  if (props.id) {
    await getDetail();
  }
});
<\/script>
`;export{n as default};
