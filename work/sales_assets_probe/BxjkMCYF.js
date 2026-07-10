const s=`<template>
  <div v-if="isShowGroupProcessing">
    <div v-click-outside="closeDropdown" class="relative">
      <m-btn @click="toggle" class="right" group="border">
        <IconFrame result />
        {{ t("clients.group_processing") }}
      </m-btn>
      <div v-if="isDropdownOpen" class="group-processing">
        <div
          v-if="hasAccess2UpdateConfiguration"
          class="processing-item"
          @click="isAttachDetachAllConfigsDialogOpen = true"
        >
          <icon-settings-alt :size="20" />
          {{ t("users.attach_un_attach_all_configuration") }}
        </div>
        <div
          v-if="hasAccess2UpdateConfiguration"
          class="processing-item"
          @click="isAttachDetachSelectedConfigsDialogOpen = true"
        >
          <icon-settings-alt :size="20" />
          {{ t("users.attach_un_attach_select_configuration") }}
        </div>
        <div
          v-if="hasAccess2TerminateSessions"
          class="processing-item"
          @click="openTerminateSessionsDialog"
        >
          <div v-if="isSessionAuditorsLoading" class="size-4">
            <icon-loading
              :loading="isSessionAuditorsLoading"
              :width="4"
              :height="4"
              color="#6B7280"
            />
          </div>
          <icon-device-delete v-else class="text-[#6B7280]" />
          {{ t("sessions.terminate_selected_sessions") }}
        </div>
        <div
          v-if="hasAccess2UpdateSessionLimit"
          class="processing-item"
          @click="openUpdateSessionsLimitDialog"
        >
          <div v-if="isSessionAuditorsLoading" class="size-4">
            <icon-loading
              :loading="isSessionAuditorsLoading"
              :width="4"
              :height="4"
              color="#6B7280"
            />
          </div>
          <icon-device-up-down v-else class="text-[#6B7280]" />
          {{ t("sessions.changing_limits") }}
        </div>
      </div>
    </div>

    <transition name="modal">
      <div v-if="isTerminateSessionsDialogOpen">
        <SharedSessionsTerminateDialog
          :items="sessionAuditors"
          :is-loading="isSessionAuditorsLoading"
          @close-dialog="closeTerminateSessionsDialog"
          @on-success="onSuccessTerminateSessions"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isUpdateSessionsLimitDialogOpen">
        <SharedSessionsLimitDialog
          :items="sessionAuditors"
          :is-loading="isSessionAuditorsLoading"
          @close-dialog="closeSessionsLimitDialog"
          @on-success="onSuccessUpdateSessionsLimit"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isAttachDetachAllConfigsDialogOpen">
        <SharedUsersConfigurationDialog
          :allow-to-attach="hasAccess2ConfigurationList"
          :selected-employee-ids="
            auditorsStore.editMultipleDialog.map((item) => item.id)
          "
          :get-configs="auditorsStore.getConfigs"
          :on-save="
            (configs, ids) => auditorsStore.batchPostConfigs(ids || [], configs)
          "
          @close-dialog="isAttachDetachAllConfigsDialogOpen = false"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isAttachDetachSelectedConfigsDialogOpen">
        <SharedUsersConfigurationSelectionDialog
          :allow-to-attach="hasAccess2ConfigurationList"
          :selected-employee-ids="
            auditorsStore.editMultipleDialog.map((item) => item.id)
          "
          :get-configs="auditorsStore.getConfigs"
          :on-save="
            (configs, ids) => auditorsStore.batchConfigs(ids || [], configs)
          "
          @close-dialog="isAttachDetachSelectedConfigsDialogOpen = false"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ConfigFormType } from "~/interfaces/api/users/configurations";
import { useAuditorAccess } from "~/composables/access/users/auditors-access";

// store
const auditorsStore = useAuditorsStore("true");

// access
const {
  hasAccess2TerminateSessions,
  hasAccess2UpdateSessionLimit,
  hasAccess2UpdateConfiguration,
  hasAccess2ConfigurationList,
} = useAuditorAccess();

// state
const { t } = useI18n();

const isDropdownOpen = ref(false);
const isTerminateSessionsDialogOpen = ref(false);
const isUpdateSessionsLimitDialogOpen = ref(false);
const isAttachDetachAllConfigsDialogOpen = ref(false);
const isAttachDetachSelectedConfigsDialogOpen = ref(false);
const isSessionAuditorsLoading = ref(false);
const sessionAuditors = ref<AuditorModel[]>([]);
const allAuditors = ref<AuditorModel[]>([]);

// hooks
const isShowGroupProcessing = computed(() => {
  return (
    hasAccess2TerminateSessions.value || hasAccess2UpdateSessionLimit.value
  );
});

// methods
const toggle = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const closeDropdown = () => {
  isDropdownOpen.value = false;
};

const openTerminateSessionsDialog = () => {
  isTerminateSessionsDialogOpen.value = true;
  fetchSessionAuditors();
};

const openUpdateSessionsLimitDialog = () => {
  isUpdateSessionsLimitDialogOpen.value = true;
  fetchSessionAuditors();
};

const closeTerminateSessionsDialog = () => {
  isTerminateSessionsDialogOpen.value = false;
};

const onSuccessTerminateSessions = () => {
  closeTerminateSessionsDialog();
  sessionAuditors.value = [];
  allAuditors.value = [];
  auditorsStore.refresh();
};

const closeSessionsLimitDialog = () => {
  isUpdateSessionsLimitDialogOpen.value = false;
};

const onSuccessUpdateSessionsLimit = () => {
  closeSessionsLimitDialog();
  sessionAuditors.value = [];
  allAuditors.value = [];
  auditorsStore.refresh();
};

const fetchSessionAuditors = async () => {
  if (isSessionAuditorsLoading.value || !auditorsStore.data) return;

  isSessionAuditorsLoading.value = true;

  try {
    if (auditorsStore.editMultipleDialog.length === 0) {
      if (allAuditors.value.length) {
        sessionAuditors.value = allAuditors.value;
        return;
      }

      const response = await auditorsStore.getList({
        ...auditorsStore.params,
        page: 1,
        page_size: auditorsStore.data.total_count,
      });

      sessionAuditors.value = response.data.items;
      allAuditors.value = response.data.items;
    } else {
      sessionAuditors.value = auditorsStore.data.items.filter((item) =>
        auditorsStore.editMultipleDialog.some(
          (selected) => selected.id === item.id,
        ),
      );
    }
  } finally {
    isSessionAuditorsLoading.value = false;
  }
};
<\/script>
`;export{s as default};
