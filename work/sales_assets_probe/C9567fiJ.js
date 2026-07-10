const e=`<template>
  <d-modal
    data-container-width="884px"
    :name="t('sessions.terminate_selected_sessions')"
    :loading="props.isLoading"
    @close-dialog="closeDialog"
  >
    <div class="table-content-container overflow-hidden mb-5">
      <div class="table-content-body">
        <data-table
          :headers="headers"
          with-information-above-header
          :is-empty="!items.length"
          :check="isTableAllChecked"
          :indeterminate="isTableIndeterminate"
          @get-all-id="getAllItemIds"
        >
          <template #body>
            <c-tr
              v-for="data in items"
              :key="data.id"
              class="border-t-1 border-b-0"
            >
              <c-td-no-edit
                v-for="column in headers"
                :key="column.key"
                :is-checked="column.checked"
                :type="column.type"
              >
                <Checkbox
                  v-if="column.key === 'checkbox' && !!data.id"
                  :id="data.id"
                  :checked="selectedItemIds.includes(data.id)"
                  @change="onSelectItem($event, data.id)"
                />
                <div
                  v-else-if="column.key === 'active_session_count'"
                  class="rounded-md border border-nautral-200 py-1 px-2 flex items-center gap-1 text-xs w-fit"
                >
                  <IconDevices class="text-primary-600" />
                  <span>{{ data.active_session_count }}</span>
                </div>
                <div v-else>
                  {{ getValue(data, column.key, column.type) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
    </div>

    <div class="flex justify-end gap-2.5">
      <m-btn
        :disabled="!canTerminateSelected"
        group="border"
        class="!border-red-500 hover:!bg-red-500/10 !text-red-500"
        @click="openTerminateDeviceApproveDialog"
      >
        {{ t("sessions.terminate_selected_sessions") }}
      </m-btn>
      <m-btn group="delete" @click="openTerminateAllDialog">
        <IconDeviceDelete />
        {{ t("sessions.terminate_all_sessions") }}
      </m-btn>
    </div>
  </d-modal>
  <transition name="modal">
    <div v-if="isTerminateAllDialogOpen">
      <ConfirmationDialog
        :text="t('sessions.you_are_terminating_all_sessions')"
        :is-save-btn-loading="isTerminateLoading"
        @on-save="terminateAllSessions"
        @close-dialog="closeTerminateAllDialog"
      />
    </div>
  </transition>
  <transition name="modal">
    <div v-if="isTerminateSelectedDialogOpen">
      <ConfirmationDialog
        :text="t('sessions.you_are_terminating_selected_sessions')"
        :is-save-btn-loading="isTerminateLoading"
        @on-save="terminateSelectedSessions"
        @close-dialog="closeTerminateSelectedDialog"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { SessionsTerminateItemModel } from "~/interfaces/api/sessions/sessions-modal";

type Props = {
  items: SessionsTerminateItemModel[];
  isLoading?: boolean;
};

type Emits = {
  (e: "closeDialog"): void;
  (e: "onSuccess"): void;
};

// props
const props = defineProps<Props>();

// emits
const emit = defineEmits<Emits>();

// stores
const multipleSessionsStore = useMultipleSessionsStore();

// composables
const { t } = useI18n();

// state
const items = ref<SessionsTerminateItemModel[]>([]);
const isTerminateLoading = ref(false);
const isTerminateSelectedDialogOpen = ref(false);
const isTerminateAllDialogOpen = ref(false);
const selectedItemIds = ref<string[]>([]);

// hooks
onUnmounted(() => {
  multipleSessionsStore.$dispose();
});

watch(
  () => props.items,
  (newItems) => {
    if (newItems?.length) {
      items.value = [...newItems];
      selectedItemIds.value = newItems.map((item) => item.id);
    }
  },
  { immediate: true }
);

const isTableAllChecked = computed(() => {
  return (
    !!items.value.length &&
    items.value.every((item) => selectedItemIds.value.includes(item.id))
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !items.value.length) {
    return false;
  }

  return items.value.some((item) => selectedItemIds.value.includes(item.id));
});

const canTerminateSelected = computed(() => {
  return isTableAllChecked.value || isTableIndeterminate.value;
});

const headers = computed(() =>
  multipleSessionsStore.headers.filter(
    (item) => item.key !== "allowed_active_session_count"
  )
);

// methods
const closeDialog = () => emit("closeDialog");

const onSuccess = () => emit("onSuccess");

const getValue = (
  data: SessionsTerminateItemModel,
  key: string,
  type?: string
) => {
  return getDataValue<SessionsTerminateItemModel>(data, key, type);
};

const openTerminateDeviceApproveDialog = () => {
  isTerminateSelectedDialogOpen.value = true;
};

const openTerminateAllDialog = () => {
  isTerminateAllDialogOpen.value = true;
};

const closeTerminateAllDialog = () => {
  isTerminateAllDialogOpen.value = false;
};

const closeTerminateSelectedDialog = () => {
  isTerminateSelectedDialogOpen.value = false;
};

const getAllItemIds = (isChecked: boolean) => {
  if (isChecked) {
    selectedItemIds.value = items.value.map((item) => item.id);
  } else {
    selectedItemIds.value = [];
  }
};

const onSelectItem = (value: boolean, id: string) => {
  if (value) {
    selectedItemIds.value.push(id);
  } else {
    selectedItemIds.value = selectedItemIds.value.filter((item) => item !== id);
  }
};

const handleTerminateSessions = async () => {
  isTerminateLoading.value = true;

  try {
    await multipleSessionsStore.terminateSessions(selectedItemIds.value);

    items.value = items.value.filter(
      (item) => !selectedItemIds.value.includes(item.id)
    );

    notify({ title: t("successfully"), type: "success" });
    onSuccess();
  } catch (error) {
    console.log(error);
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isTerminateLoading.value = false;

    closeTerminateAllDialog();
    closeTerminateSelectedDialog();
  }
};

const terminateSelectedSessions = () => handleTerminateSessions();

const terminateAllSessions = () => {
  getAllItemIds(true);
  terminateSelectedSessions();
};
<\/script>

<style scoped lang="scss">
.table-content-body {
  max-height: 400px;
  overflow-y: auto;
  padding-bottom: 0;
}

.table-content-body::-webkit-scrollbar {
  width: 10px;
}

.table-content-body::-webkit-scrollbar-track {
  background: #fafafa;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  margin-top: 10px;
}

.table-content-body::-webkit-scrollbar-thumb {
  border-radius: 10px;
  border: 3px solid transparent;
  background-clip: padding-box;
}
</style>
`;export{e as default};
