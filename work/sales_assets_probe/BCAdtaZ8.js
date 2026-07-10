const e=`<template>
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
        <d-input
          type="text"
          :label="t('column.code')"
          pattern-type="code"
          :value="data.code"
          @change="data.code = $event"
        />
        <d-input
          pattern-type="sort"
          type="number"
          :label="t('labels.sort')"
          :value="data.sort"
          @change="data.sort = $event"
        />
        <shared-localized-input
          :label="t('column.comment')"
          v-model:base="data.default_description"
          v-model:translations="data.description_l10n"
        />
        <div
          class="flex items-center justify-between rounded-lg border-1 w-full pr-0.2 pl-3"
        >
          <div>
            <span v-if="videoFiles">
              {{ videoFiles.name }}
            </span>
            <input
              ref="file"
              id="file_upload_id"
              style="display: none"
              type="file"
              multiple
              @change="onFileChanged($event)"
            />
            <!-- accept="video/*" -->
          </div>
          <div class="justify-self-end">
            <m-btn type="button" @click="upload">
              {{ t("settings.upload_video") }}
            </m-btn>
          </div>
        </div>
        <Switch :active="data.is_active" @change="onChangeActivity" />
      </flex-col>
      <template #footer>
        <m-btn class="w-full" type="submit">
          {{ !data.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { defaultDropdownParamsType } from "~/interfaces/api/params/list-parameters";
import { defaultDropdownParams, dropdownParamsAll } from "~/variable/params";
import type { KnowledgeBaseModel } from "~/interfaces/api/settings/knowledge-base-mode";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { notify } from "@kyvg/vue3-notification";

// props
const props = defineProps<{
  id?: string;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// store
const knowledgeBaseStore = useKnowledgeBaseStore("main");

//state
const { t } = useI18n();

let videoFiles = ref<File[]>([]);
const knowledgeCategories = ref<any>(null);
const roles = ref<{ items: any[] | undefined }>({ items: undefined });
const isBtnLoading = ref(false);
const isLoading = ref<boolean>(false);
const eventBus = useEventBus();
const updateListEventKey = SettingsEventKeys.KNOWLADGE_BASE_TABLE_UPDATE;
const dropdownParams = ref(
  props.id ? { ...dropdownParamsAll } : { ...defaultDropdownParams },
);

const knowledgeCategoriesParams = ref<defaultDropdownParamsType>(
  dropdownParams.value,
);

const data = ref<KnowledgeBaseModel>({
  name: "",
  default_name: "",
  name_l10n: {},
  is_active: true,
  user_role_id_arr: [],
  code: null,
  sort: null,
  description: null,
  default_description: null,
  description_l10n: {},
  category_id: "",
  file_id_arr: [],
});
const initialDetailData = ref<
  (KnowledgeBaseModel & { category?: { id: string } }) | null
>(null);

const filterStates = ref([
  {
    name: t("settings.role"),
    key: "role",
    required: true,
    get data() {
      return roles.value || [];
    },
    get getSelectedData() {
      return data.value.user_role_id_arr;
    },
    set setSelectedData(value: number[]) {
      data.value.user_role_id_arr = value;
    },
  },
  {
    name: t("settings_sidebar.knowledge_base_type"),
    key: "knowledge-categories",
    isSingleSelect: true,
    required: true,
    get data() {
      return knowledgeCategories.value || [];
    },
    get getSelectedData() {
      return data.value.category_id;
    },
    set setSelectedData(value: string) {
      data.value.category_id = value;
    },
    onLoadElse: async () => await onLoadElseKnowledgeCategories(),
  },
]);

// hooks
const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

onBeforeMount(async () => {
  if (props.id) {
    isLoading.value = true;
    await Promise.all([getDetail(), getKnowledgeCategoriesList(), getRoles()]);
    setDetail();
    isLoading.value = false;
  }
});

// methods
// file-upload
const upload = () => {
  const file = document.getElementById("file_upload_id");
  if (file) {
    file.click();
  }
};

const onFileChanged = (e: any) => {
  const target = e.target;
  if (target && target.files) {
    videoFiles.value = Array.from(target.files);
  }
};

const onUploadPhotoFiles = async () => {
  if (videoFiles.value.length > 0) {
    const uploadPromises = videoFiles.value.map(async (file: File) => {
      try {
        const videoFileRes = await knowledgeBaseStore.onVideoFileUpload(file);
        return videoFileRes?.data?.id;
      } catch (error) {
        notify({ title: t("labels.failed_to_upload_file"), type: "error" });
      }
    });

    const uploadedFileIds = (await Promise.all(uploadPromises)).filter(
      (id) => id !== undefined,
    );

    if (uploadedFileIds.length > 0) {
      data.value.file_id_arr = uploadedFileIds as string[];
    }
  }
};
// end file-upload

const updateListByActiveState = (isActive: boolean) => {
  if (isActiveStateChangedOnEdit.value) {
    eventBus.emit(updateListEventKey, !isActive);
    emit("clearFetchedTab", !isActive);
    return;
  }
  eventBus.emit(updateListEventKey, isActive);
};

const onChangeActivity = (value: boolean) => {
  data.value.is_active = value;
};

const setDetail = () => {
  data.value.user_role_id_arr =
    initialDetailData.value?.user_roles?.map((item) => item.id) || [];

  const {
    category,
    code,
    default_description,
    default_name,
    description,
    description_l10n,
    id,
    is_active,
    name,
    name_l10n,
    sort,
  } = initialDetailData.value!;

  data.value.category_id = category?.id || "";
  data.value.code = code;
  data.value.description = description;
  data.value.default_description = default_description || description;
  data.value.description_l10n = description_l10n || {};
  data.value.id = id;
  data.value.is_active = is_active;
  data.value.name = name;
  data.value.default_name = default_name || name;
  data.value.name_l10n = name_l10n || {};
  data.value.sort = sort;
};

const getDetail = async () => {
  initialDetailData.value = await knowledgeBaseStore.getDetail(props.id!);
};

const save = async (e: any) => {
  isBtnLoading.value = true;
  await onUploadPhotoFiles();

  const res = await knowledgeBaseStore.add(data.value);
  if (res !== "error") {
    updateListByActiveState(data.value.is_active);
    closeDialog();
  }
  isBtnLoading.value = false;
};

const onOpenDropdown = async (state: string, value: any) => {
  if (state === "role" && !roles.value.items) {
    await getRoles();
    return;
  } else if (state === "knowledge-categories" && !knowledgeCategories.value) {
    await getKnowledgeCategoriesList();
    return;
  }
};

const getKnowledgeCategoriesList = async () => {
  // dropdown with pagination
  knowledgeCategories.value =
    await knowledgeBaseStore.getKnowledgeCategoriesList(
      knowledgeCategoriesParams.value,
    );
};

const onLoadElseKnowledgeCategories = async () => {
  (knowledgeCategoriesParams.value as any).page_size = +10;
  const data = await knowledgeBaseStore.getKnowledgeCategoriesList(
    knowledgeCategoriesParams.value,
  );
  knowledgeCategories.value = knowledgeCategories.value.concat(data);
};

const getRoles = async () => {
  roles.value.items = await knowledgeBaseStore.getRoles();
};

const closeDialog = () => {
  emit("closeDialog");
};
<\/script>
`;export{e as default};
