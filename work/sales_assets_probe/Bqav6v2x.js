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
        <DropdownsByFilterStates
          :filterStates="filterStates"
          @onOpenDropdown="onOpenDropdown"
        />
        <Switch :active="data.is_active" @change="data.is_active = $event" />
      </flex-col>
      <template #footer>
        <m-btn :loading="isBtnLoading" class="w-full" type="submit">
          {{ !props.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import type { KnowledgeCategoryModel } from "~/interfaces/api/settings/knowledge-category-model";
import { useI18n } from "vue-i18n";
import type { RoleModel } from "~/interfaces/api/settings/role-model";
import { notify } from "@kyvg/vue3-notification";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// store
const knowledgeCategoriesActiveStore = useKnowledgeCategoriesStore("main");

// state
const { t } = useI18n();
const eventBus = useEventBus();
const isLoading = ref<boolean>(false);
const isBtnLoading = ref<boolean>(false);
const updateListEventKey = SettingsEventKeys.KNOWLADGE_CATEGORIES_TABLE_UPDATE;

const roles = ref<Record<"items", RoleModel[] | undefined>>({
  items: undefined,
});

const data = ref<Partial<KnowledgeCategoryModel> & { role_id_arr: string[] }>({
  name: "",
  default_name: "",
  name_l10n: {},
  is_active: true,
  role_id_arr: [],
  sort: null,
  code: null,
  description: null,
  default_description: null,
  description_l10n: {},
});
const initialDetailData = ref(); // used to store the detail data on edit

const filterStates = ref([
  {
    name: "Роль",
    key: "role",
    required: true,
    get data() {
      return roles.value || [];
    },
    get getSelectedData() {
      return data.value.role_id_arr || [];
    },
    set setSelectedData(value: string[]) {
      data.value.role_id_arr = value;
    },
  },
]);

// hooks
const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

onBeforeMount(async () => {
  if (props.id) {
    await Promise.all([getDetail(), getRoles()]);
    setDetail();
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

const onOpenDropdown = async (state: string, value: any) => {
  if (state === "role" && !roles.value.items) {
    await getRoles();
  }
};

const save = async () => {
  isBtnLoading.value = true;
  const res = await knowledgeCategoriesActiveStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active!);
    notify({ title: t("saved"), type: "success" });
    closeDialog();
  }
  isBtnLoading.value = false;
};

const getDetail = async () => {
  initialDetailData.value = await knowledgeCategoriesActiveStore.getDetail(
    props.id!,
  );
};

const setDetail = () => {
  const {
    id,
    code,
    default_description,
    default_name,
    description,
    description_l10n,
    is_active,
    name,
    name_l10n,
    sort,
    roles,
  } = initialDetailData.value;

  const role_id_arr = roles.map(
    (role: Record<"id" | "name", string | number>) => role.id,
  );

  data.value = {
    id,
    code,
    description,
    default_description: default_description || description,
    description_l10n: description_l10n || {},
    is_active,
    name,
    default_name: default_name || name,
    name_l10n: name_l10n || {},
    sort,
    role_id_arr,
  };
};

const getRoles = async () => {
  roles.value.items = await knowledgeCategoriesActiveStore.getRoles();
};
<\/script>
`;export{n as default};
