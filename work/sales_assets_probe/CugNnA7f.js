const n=`<template>
  <div class="access-branch-dialog-modal">
    <d-modal
      with-out-header
      data-container-width="896px"
      @close-dialog="closeDialog"
    >
      <template #header>
        <div
          class="flex items-center gap-2 rounded-t-xl text-neutral-400 p-5 bg-red-lotion border-b -mt-3 -mx-2"
        >
          <span> {{ t("access.attach_branch") }}: </span>
          <span class="font-semibold text-neutral-950">{{ props.name }}</span>

          <icon-x
            class="cursor-pointer shrink-0 [&>path]:stroke-neutral-600 ml-auto"
            @click="closeDialog"
          />
        </div>

        <div class="flex gap-4 p-3">
          <search-input
            no-debounce
            class="grow"
            @change="searchingValue = $event"
          />
        </div>
      </template>

      <div class="w-full p-1">
        <div v-if="isLoading" class="flex flex-col gap-4 w-full pb-4">
          <skeleton-block v-for="i in 6" :key="i" height="40px" width="300px" />
        </div>

        <div v-else-if="!dataList.length">
          <div class="grid place-items-center p-8">
            <icon-process :size="96" />
            <page-title
              size="lg"
              weight="600"
              class="w-60 text-center"
              :title="t('access.no_available_branches')"
            />
          </div>
        </div>

        <div v-else-if="!filteredData.length">
          <div class="grid place-items-center p-8">
            <icon-search-x :size="96" />
            <page-title
              size="lg"
              weight="600"
              class="w-52 text-center"
              :title="t('access.nothing_found_by_query')"
            />
          </div>
        </div>

        <radio-group
          v-else
          class="gap-6"
          v-model="selectedBranchId"
          :items="filteredData"
        />
      </div>

      <template #footer>
        <div class="flex gap-4 items-center justify-end">
          <m-btn
            class="!bg-neutral-200 !border-neutral-200 !text-neutral-600"
            @click="closeDialog"
          >
            {{ t("cancel") }}
          </m-btn>
          <m-btn
            :disabled="!props.canSave"
            :loading="isSaving"
            @click="onSaveAttach"
          >
            {{ t("save") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </div>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { AccessBranchCheckModel } from "~/interfaces/api/access/branch-model";

// Props
const props = defineProps<{
  name?: string;
  canSave?: boolean;
}>();

// Emits
const emit = defineEmits(["closeDialog"]);

// Store
const accessStore = useAccessUsersStore();

// Composables
const { t } = useI18n();

// State
const dataList = ref<AccessBranchCheckModel[]>([]);
const selectedBranchId = ref<string>("");
const isSaving = ref<boolean>(false);
const isLoading = ref<boolean>(false);
const searchingValue = ref<string>("");

// Computed
const filteredData = computed(() => {
  let result = dataList.value;

  if (searchingValue.value) {
    const term = searchingValue.value.toLowerCase();
    result = result.filter((item) => item.name.toLowerCase().includes(term));
  }

  return result.map((item) => ({
    id: item.id,
    name: item.name,
    disabled: !item.is_active && selectedBranchId.value !== item.id,
    inactive: !item.is_active && selectedBranchId.value === item.id,
  }));
});

// Hooks
onMounted(async () => {
  await getDataList();
  collectCheckedId();
});

// Methods
const closeDialog = () => emit("closeDialog");

const onSaveAttach = async () => {
  isSaving.value = true;

  try {
    await accessStore.onAttachBranch({
      branch_id: selectedBranchId.value,
      user_id_arr: [accessStore.activeUserId],
    });

    emit("closeDialog");
    notify({ title: t("toast.success"), type: "success" });
  } catch (error) {
    console.log(error);
  } finally {
    isSaving.value = false;
  }
};

const getDataList = async () => {
  isLoading.value = true;
  const branches = await accessStore.getUserBranches();
  dataList.value = branches || [];
  isLoading.value = false;
};

const collectCheckedId = () => {
  const checked = dataList.value.find((item) => item.is_checked);
  if (checked) {
    selectedBranchId.value = checked.id;
  }
};
<\/script>

<style lang="scss">
.access-branch-dialog-modal .modal-body-content {
  margin: 0 -8px;
  padding: 16px !important;
  @apply border-t border-neutral-200;
}
</style>
`;export{n as default};
