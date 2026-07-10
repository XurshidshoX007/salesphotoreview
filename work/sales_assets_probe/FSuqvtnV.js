const e=`<template>
  <d-modal
    data-container-width="1140px"
    :name="t('sessions.active_sessions')"
    only-close-dialog
    @close-dialog="closeDialog"
  >
    <div
      v-show="props.canUpdateLimit"
      class="flex justify-between items-center mb-5"
    >
      <div class="flex items-center gap-2.5">
        <div>{{ t("sessions.max_sessions_count") }}</div>
        <div
          class="rounded-md border border-nautral-200 py-1 px-2 flex items-center gap-1 text-xs"
        >
          <IconDevices class="text-primary-600" />
          <span>{{ limit }}</span>
        </div>
      </div>

      <CountButtons :default-value="limit" :on-change="handleLimitChange">
        <template #actions>
          <m-btn :loading="isLimitLoading" @click="handleLimitUpdate(limit)">
            {{ t("save") }}
          </m-btn>
        </template>
      </CountButtons>
    </div>

    <div class="table-content-container mb-5">
      <div class="table-content-body">
        <data-table
          :headers="sessionsStore.headers"
          :sorted="sessionsStore.params.order_by"
          :loading="sessionsStore.isLoading"
          :is-empty="!sessionsStore?.data?.items?.length"
          :check="isTableAllChecked"
          :indeterminate="isTableIndeterminate"
          @get-all-id="getAllItemIds"
        >
          <template #body>
            <c-tr v-for="data in sessionsStore.data?.items" :key="data.id">
              <c-td-no-edit
                v-for="column in sessionsStore.headers"
                :key="column.key"
              >
                <Checkbox
                  v-if="column.key === 'checkbox' && !!data.id"
                  :id="data.id"
                  :checked="isItemChecked(data.id)"
                  @change="onCheckItem($event, data.id)"
                />
                <div>
                  {{ getValue(data, column.key, column.type) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div
        v-if="
          sessionsStore.data?.total_pages && sessionsStore.data?.total_pages > 1
        "
        class="table-content-footer"
      >
        <curren-page-btn
          :current-page="sessionsStore.params.page_size"
          :total-count="sessionsStore.data?.total_count"
          :page-number="sessionsStore.data?.page_number"
        />
        <page-index
          :available-pages="sessionsStore.data?.total_pages"
          :current-page="sessionsStore.data?.page_number"
          @setPage="sessionsStore.setPage"
        />
      </div>
    </div>
    <div class="flex justify-end gap-2.5">
      <m-btn
        v-show="canTerminate"
        :disabled="!canRemoveSelected"
        :loading="isTerminateDeviceLoading"
        group="border"
        class="!border-red-500 hover:!bg-red-500/10 !text-red-500"
        @click="openTerminateDeviceApproveDialog"
      >
        {{ t("sessions.terminate_selected_sessions") }}
      </m-btn>
      <m-btn
        v-show="canTerminate"
        :loading="isTerminateAllLoading"
        group="delete"
        @click="openTerminateAllDialog"
      >
        <IconDeviceDelete />
        {{ t("sessions.terminate_all_sessions") }}
      </m-btn>
    </div>
  </d-modal>
  <transition name="modal">
    <div v-if="isTerminateAllDialogOpen">
      <ConfirmationDialog
        :text="t('sessions.you_are_terminating_all_sessions')"
        :is-save-btn-loading="isTerminateAllLoading"
        @on-save="terminateAllSessions"
        @close-dialog="closeTerminateAllDialog"
      />
    </div>
  </transition>
  <transition name="modal">
    <div v-if="isTerminateDeviceDialogOpen">
      <ConfirmationDialog
        :text="t('sessions.terminate_selected_sessions')"
        :is-save-btn-loading="isTerminateDeviceLoading"
        @on-save="terminateDeviceSessions"
        @close-dialog="closeTerminateDeviceDialog"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { SessionModel } from "#imports";
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useSessionStore } from "~/stores/sessions/session.store";

type Props = {
  userId: string;
  limit: number;
  canTerminate: boolean;
  canUpdateLimit: boolean;
};

type Emirs = {
  (e: "closeDialog"): void;
  (e: "onSuccess"): void;
};

// props
const props = defineProps<Props>();

// emits
const emit = defineEmits<Emirs>();

// stores
const sessionsStore = useSessionStore(props.userId);

// state
const { t } = useI18n();

const isTerminateAllDialogOpen = ref(false);
const isTerminateDeviceDialogOpen = ref(false);
const isTerminateAllLoading = ref(false);
const isTerminateDeviceLoading = ref(false);
const selectedDevicesIds = ref<string[]>([]);
const limit = ref(props.limit);
const isLimitLoading = ref(false);

// hooks
onMounted(async () => {
  await sessionsStore.getData();
});

const canRemoveSelected = computed(() => {
  return selectedDevicesIds.value.length > 0;
});

const isTableAllChecked = computed(() => {
  return (
    !!sessionsStore.data?.items?.length &&
    sessionsStore.data?.items?.every((item) =>
      selectedDevicesIds.value.includes(item.id)
    )
  );
});

const isTableIndeterminate = computed(() => {
  if (isTableAllChecked.value || !sessionsStore.data?.items?.length) {
    return false;
  }

  return sessionsStore.data?.items?.some((item) =>
    selectedDevicesIds.value.includes(item.id)
  );
});

// methods
const closeDialog = () => emit("closeDialog");

const onSuccess = () => emit("onSuccess");

const getValue = (data: SessionModel, key: string, type?: string) => {
  return getDataValue<SessionModel>(data, key, type);
};

const openTerminateAllDialog = () => {
  isTerminateAllDialogOpen.value = true;
};

const closeTerminateAllDialog = () => {
  isTerminateAllDialogOpen.value = false;
};

const openTerminateDeviceApproveDialog = () => {
  isTerminateDeviceDialogOpen.value = true;
};

const closeTerminateDeviceDialog = () => {
  isTerminateDeviceDialogOpen.value = false;
};

const terminateAllSessions = async () => {
  isTerminateAllLoading.value = true;

  try {
    await sessionsStore.terminateAllSessions();

    notify({ title: t("successfully"), type: "success" });
    onSuccess();
    closeTerminateAllDialog();
    sessionsStore.refresh();
  } catch (_) {
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isTerminateAllLoading.value = false;
  }
};

const terminateDeviceSessions = async () => {
  isTerminateDeviceLoading.value = true;

  try {
    await sessionsStore.terminateDeviceSessions(selectedDevicesIds.value);

    notify({ title: t("successfully"), type: "success" });
    onSuccess();
    closeTerminateDeviceDialog();
    sessionsStore.refresh();
  } catch (_) {
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isTerminateDeviceLoading.value = false;
  }
};

const isItemChecked = (id: string) => {
  return selectedDevicesIds.value.includes(id);
};

const onCheckItem = (checked: boolean, id: string) => {
  if (checked) {
    selectedDevicesIds.value.push(id);
  } else {
    selectedDevicesIds.value = selectedDevicesIds.value.filter(
      (item) => item !== id
    );
  }
};

const getAllItemIds = (checked: boolean) => {
  if (checked) {
    selectedDevicesIds.value =
      sessionsStore.data?.items?.map((item) => item.id) || [];
  } else {
    selectedDevicesIds.value = [];
  }
};

const handleLimitChange = (value: number) => {
  limit.value = value;
};

const handleLimitUpdate = async (value: number) => {
  try {
    isLimitLoading.value = true;

    await sessionsStore.updateSessionLimit(value);

    notify({ title: t("successfully"), type: "success" });
    onSuccess();
    closeDialog();
  } catch (error) {
    notify({ title: t("toast.error"), type: "error" });
    throw error;
  } finally {
    limit.value = value;
    isLimitLoading.value = false;
  }
};
<\/script>
`;export{e as default};
