const n=`<template>
  <div>
    <menu-btn v-if="isShowGroupProcessing" size-free without-padding>
      <template #btn>
        <m-btn @click="showDropdown" group="border">
          <IconFrame result />
          {{ t("clients.group_processing") }}
        </m-btn>
      </template>
      <template #content>
        <div class="agent-page-group">
          <div class="account-body">
            <div
              v-if="hasAccess2ViewConfigs"
              class="item-lang"
              @click="isCompanyConfigurationDialogOpen = true"
            >
              <icon-settings-alt :size="20" />
              {{ t("users.attach_un_attach_all_configuration") }}
            </div>
            <div
              v-if="hasAccess2ViewConfigs"
              class="item-lang"
              @click="openAttachUnattachConfiguration"
            >
              <icon-settings-alt :size="20" />
              {{ t("users.attach_un_attach_select_configuration") }}
            </div>
            <div
              v-if="hasAccess2UpdatePaket || hasAccess2FullPaket"
              class="item-lang"
              @click="openMultipleLimitDialog"
            >
              {{ t("users.agent_limits") }}
            </div>
            <div
              v-if="hasAccess2UpdatePaket || hasAccess2FullPaket"
              class="item-lang"
              @click="openAddRemoveLimitDialog"
            >
              {{ t("users.agents.add_remove_products_to_agent_product_list") }}
            </div>
            <div
              v-if="hasAccess2AttachTradeDirectionList"
              class="item-lang"
              @click="tradeDirectionFunction"
            >
              {{ t("users.trade_direction_action") }}
            </div>
            <div
              class="item-lang"
              v-if="hasAccess2OrderConsignationList"
              @click="consignationNavigateFunction"
            >
              {{ t("users.consignment_action") }}
            </div>
            <div
              v-if="hasAccess2TerminateSessions"
              class="item-lang"
              @click="openTerminateSessionsDialog"
            >
              <div v-if="isSessionAgentsLoading" class="size-4">
                <icon-loading
                  :loading="isSessionAgentsLoading"
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
              class="item-lang"
              @click="openUpdateSessionsLimitDialog"
            >
              <div v-if="isSessionAgentsLoading" class="size-4">
                <icon-loading
                  :loading="isSessionAgentsLoading"
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
      </template>
    </menu-btn>
    <transition name="modal">
      <div v-if="isTradeDirectionDialogOpen">
        <UsersAgentsAttachTradeDirection
          :modal-name="t('users.trade_direction_action')"
          @closeDialog="closeTradeDirection"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isConsignationDialogOpen">
        <UsersAgentsConsignationDIalog
          :modal-name="t('users.consignment_action')"
          :allow-to-save="hasAccess2SaveConsignation"
          @closeDialog="closeAgentConsignation"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isCompanyConfigurationDialogOpen">
        <UsersAgentsConfigurationCompanyDialog
          :allow-to-attach="hasAccess2AttachConfigs"
          @closeDialog="isCompanyConfigurationDialogOpen = false"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isAttachUnattachConfigurationDialogOpen">
        <UsersAgentsAttachUnattachConfiguration
          :allow-to-attach="hasAccess2AttachConfigs"
          @closeDialog="closeAttachUnattachConfiguration"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isAddRemoveLimitDialogOpen">
        <UsersAgentsAgentAddRemoveLimitDialog
          :allow-to-update="hasAccess2UpdatePaket || hasAccess2FullPaket"
          @closeDialog="closeAddRemoveLimitDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isTerminateSessionsDialogOpen">
        <SharedSessionsTerminateDialog
          :items="sessionAgents"
          :is-loading="isSessionAgentsLoading"
          @close-dialog="closeTerminateSessionsDialog"
          @on-success="onSuccessTerminateSessions"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="isUpdateSessionsLimitDialogOpen">
        <SharedSessionsLimitDialog
          :items="sessionAgents"
          :is-loading="isSessionAgentsLoading"
          @closeDialog="closeSessionsLimitDialog"
          @on-success="onSuccessUpdateSessionsLimit"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useAgentAccess } from "~/composables/access/users/agent-accesses";
import { useI18n } from "vue-i18n";

// store

const agentStore = useAgentsStore("true");

// emits
const emit = defineEmits(["openMultipleLimitDialog"]);

// state
const { t } = useI18n();
const openPersonal = ref(false);
const isCompanyConfigurationDialogOpen = ref<boolean>(false);
const isConsignationDialogOpen = ref(false);
const isTradeDirectionDialogOpen = ref<boolean>(false);
const isAttachUnattachConfigurationDialogOpen = ref<boolean>(false);
const isAddRemoveLimitDialogOpen = ref<boolean>(false);
const isTerminateSessionsDialogOpen = ref<boolean>(false);
const isUpdateSessionsLimitDialogOpen = ref<boolean>(false);
const isSessionAgentsLoading = ref(false);
const sessionAgents = ref<AgentModel[]>([]);
const allAgents = ref<AgentModel[]>([]);

const {
  hasAccess2UpdatePaket,
  hasAccess2FullPaket,
  hasAccess2OrderConsignationList,
  hasAccess2AttachTradeDirectionList,
  hasAccess2ViewConfigs,
  hasAccess2AttachConfigs,
  hasAccess2SaveConsignation,
  hasAccess2TerminateSessions,
  hasAccess2UpdateSessionLimit,
} = useAgentAccess();

// hooks

const isShowGroupProcessing = computed(() => {
  return (
    hasAccess2ViewConfigs.value ||
    hasAccess2UpdatePaket.value ||
    hasAccess2FullPaket.value ||
    hasAccess2AttachTradeDirectionList.value ||
    hasAccess2OrderConsignationList.value ||
    hasAccess2TerminateSessions.value ||
    hasAccess2UpdateSessionLimit.value
  );
});

// methods

const showDropdown = () => {
  openPersonal.value = !openPersonal.value;
};

const openMultipleLimitDialog = () => {
  emit("openMultipleLimitDialog");
};

const openAddRemoveLimitDialog = () => {
  isAddRemoveLimitDialogOpen.value = true;
};

const consignationNavigateFunction = () => {
  isConsignationDialogOpen.value = true;
};

const tradeDirectionFunction = () => {
  isTradeDirectionDialogOpen.value = true;
};

const openAttachUnattachConfiguration = () => {
  isAttachUnattachConfigurationDialogOpen.value = true;
};

const closeAgentConsignation = () => {
  isConsignationDialogOpen.value = false;
  agentStore.setNullMultipleDialog();
};

const closeTradeDirection = () => {
  isTradeDirectionDialogOpen.value = false;
  agentStore.setNullMultipleDialog();
};

const closeAttachUnattachConfiguration = () => {
  isAttachUnattachConfigurationDialogOpen.value = false;
};

const closeAddRemoveLimitDialog = () => {
  isAddRemoveLimitDialogOpen.value = false;
  agentStore.setNullMultipleDialog();
};

const openTerminateSessionsDialog = () => {
  isTerminateSessionsDialogOpen.value = true;
  fetchSessionAgents();
};

const openUpdateSessionsLimitDialog = () => {
  isUpdateSessionsLimitDialogOpen.value = true;
  fetchSessionAgents();
};

const fetchSessionAgents = async () => {
  if (isSessionAgentsLoading.value || !agentStore.data) return;

  isSessionAgentsLoading.value = true;

  try {
    if (agentStore.editMultipleDialog.length === 0) {
      if (allAgents.value.length) {
        sessionAgents.value = allAgents.value;
        return;
      }

      const response = await agentStore.getList({
        ...agentStore.params,
        page: 1,
        page_size: agentStore.data.total_count,
      });

      allAgents.value = response.data.items;
      sessionAgents.value = response.data.items;
    } else {
      sessionAgents.value =
        agentStore.data.items.filter((item) =>
          agentStore.editMultipleDialog.some(
            (dialogItem) => dialogItem.id === item.id,
          ),
        ) || [];
    }
  } finally {
    isSessionAgentsLoading.value = false;
  }
};

const closeTerminateSessionsDialog = () => {
  isTerminateSessionsDialogOpen.value = false;
};

const onSuccessTerminateSessions = () => {
  closeTerminateSessionsDialog();
  sessionAgents.value = [];
  allAgents.value = [];
  agentStore.refresh();
};

const closeSessionsLimitDialog = () => {
  isUpdateSessionsLimitDialogOpen.value = false;
};

const onSuccessUpdateSessionsLimit = () => {
  closeSessionsLimitDialog();
  sessionAgents.value = [];
  allAgents.value = [];
  agentStore.refresh();
};
<\/script>

<style lang="scss" scoped>
.agent-page-group {
  .item-lang {
    cursor: pointer;
    color: #000;
    font-size: 13px;
    font-family: "Inter", sans-serif;
    font-weight: 400;
    text-wrap: nowrap;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 0 8px;
    border-bottom: 1px solid #e1e4e4;
  }

  .item-lang:hover {
    background: rgba(41, 155, 155, 0.05);
    color: theme("colors.primary.600");
  }
  .item-lang:last-child {
    border-bottom: none;
  }
}

@media screen and (max-width: 992px) {
  .agent-page-group {
    right: 100%;
    transform: translateX(100%);
  }
}
</style>
`;export{n as default};
