const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header justify-between">
        <div class="table-content-btn-group">
          <table-sort-columns
            :templates="agentStore.templates"
            :save-key="isActiveAgents ? agentsHeader : agentsDeletedHeader"
            @onChangeTableHeaders="onChangeTableHeaders"
          />
          <show-hide-column
            :headers="agentStore.templates"
            :save-key="isActiveAgents ? agentsHeader : agentsDeletedHeader"
          />
          <page-size-btn
            :current-size="agentStore.params.page_size"
            :total-count="agentStore.data?.total_count"
            :page-number="agentStore.data?.page_number"
            @setPageSize="agentStore.setPageSize"
          />
          <search-input
            @change="agentStore.search"
            :value="agentStore.params.search"
          />
          <excel-btn
            @click="agentStore.onDownloadExcelFile"
            :loading="agentStore.isExcelFileDownloading"
          />
          <RefreshBtn @click="refresh" :loading="agentStore.isLoading" />
        </div>
        <slot name="header-btn"></slot>
      </div>
      <div class="table-content-body">
        <data-table
          :headers="agentStore.templates"
          :sorted="agentStore.params.order_by"
          :loading="agentStore.isLoading"
          :check="isTableAllChecked"
          :indeterminate="isTableIndeterminate"
          :is-empty="!agentStore?.data?.items?.length"
          @sort="agentStore.sortData"
          @getAllId="getAllAgentsId"
        >
          <template #body>
            <c-tr
              v-for="(data, index) in agentStore.data?.items"
              :key="data.id"
            >
              <c-td-no-edit
                v-for="key in agentStore.templates"
                :key="key"
                :type="key.type"
                :is-checked="key.checked"
              >
                <Checkbox
                  v-if="key.key === 'checkbox' && data['is_active']"
                  :id="data.id"
                  :checked="isTableChecked(data.id)"
                  @change="onSelectAgent($event, data)"
                />
                <div v-else-if="key.key === 'application_access'">
                  <div v-if="hasAccess2ChangeAppAccess" class="max-w-48">
                    <Switch
                      :title="t('users.on_off')"
                      :active="data?.application_access"
                      @change="onChangeAppAccess(data)"
                    />
                  </div>
                  <div v-else>
                    {{ data[key.key] ? t("filters.yes") : t("filters.no") }}
                  </div>
                </div>
                <div v-else-if="key.key === 'agent_type_id'">
                  {{ data["agent_type_name"] }}
                </div>
                <div
                  v-else-if="key.key === 'products_count'"
                  :class="data['products_count'] > 0 && 'font-semibold '"
                >
                  {{
                    data["products_count"] > 0
                      ? \`\${data["products_count"]} \${t("count")}.\`
                      : t("users.no_limits")
                  }}
                </div>
                <show-more
                  v-else-if="key.type === 'array'"
                  :show-count="2"
                  :data="data[key.key] || []"
                />

                <div v-else-if="key.key === 'filter'">
                  <div class="w-30">
                    <Switch
                      :title="t('users.on_off')"
                      :active="data?.is_filter"
                      @change="onChangeFilterActivity(data['id'], $event)"
                    />
                  </div>
                </div>
                <div v-else-if="key.type === 'boolean'">
                  {{ data[key.key] ? t("filters.yes") : t("filters.no") }}
                </div>
                <div v-else-if="key.type === 'date'">
                  {{ getFormattedDate(data[key.key], "DD.MM.YYYY") }}
                </div>
                <div v-else-if="key.key === 'last_sync'">
                  {{ getFormattedDate(data[key.key], "DD.MM.YYYY HH:mm:ss") }}
                </div>
                <div
                  v-else-if="key.key === 'active_session_count'"
                  class="flex justify-center"
                >
                  <div
                    class="rounded-md px-2.5"
                    :class="{
                      'cursor-pointer hover:bg-primary-50 transition-all text-primary-600':
                        hasAccess2GetActiveSessions,
                    }"
                    @click="openSessionsListDialog(data)"
                  >
                    {{ data.active_session_count }}
                  </div>
                </div>
                <div
                  v-else-if="key.key === 'allowed_active_session_count'"
                  class="flex justify-center"
                >
                  {{ data.allowed_active_session_count }}
                </div>
                <div v-else-if="key.key === 'action'">
                  <div
                    v-if="data['is_active'] === true"
                    class="flex items-center pl-0 justify-end gap-x-2"
                  >
                    <div v-show="hasAccess2ViewConfigs">
                      <rounded-icon-btn
                        type="configuration"
                        :icon-size="20"
                        @click="openedConfigId = data.id"
                      />
                    </div>
                    <div v-show="hasAccess2Paket(data?.products_count)">
                      <rounded-icon-btn
                        icon="user-block"
                        type="outlined"
                        :tooltip="agentLimitReturnName(data)"
                        @click="() => onOpenLimitDialog(data.id)"
                      />
                    </div>

                    <div v-show="hasAccess2Update">
                      <rounded-icon-btn
                        type="edit"
                        :iconSize="20"
                        @click="editingId = data.id"
                      />
                    </div>
                    <div v-show="hasAccess2DeActivate">
                      <rounded-icon-btn
                        icon="not-active"
                        type="danger"
                        icon-size="18"
                        :tooltip="t('users.deactivate')"
                        @click="deActivatingId = data.id"
                      />
                    </div>
                  </div>
                  <div v-else>
                    <div :key="index" class="flex items-center gap-x-3">
                      <div v-show="hasAccess2Activate">
                        <rounded-icon-btn
                          icon="refresh"
                          type="outlined"
                          :tooltip="t('users.restore')"
                          @click="restore(data?.id)"
                        />
                      </div>
                      <div v-show="hasAccess2Operations">
                        <rounded-icon-btn
                          type="info"
                          @click="openedOperationsId = data?.id"
                        />
                      </div>
                      <div v-show="hasAccess2Update">
                        <rounded-icon-btn
                          type="edit"
                          :iconSize="20"
                          @click="editingId = data.id"
                        />
                      </div>
                      <div v-show="hasAccess2Delete">
                        <rounded-icon-btn
                          type="danger"
                          @click="deletingId = data?.id"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else :class="{ 'text-end': key.right }">
                  {{ getDataValue(data, key.accessorKey || key.key, key.type) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="agentStore.params.page_size"
          :total-count="agentStore.data?.total_count"
          :page-number="agentStore.data?.page_number"
        />
        <page-index
          :available-pages="agentStore.data?.total_pages"
          :current-page="agentStore.data?.page_number"
          @setPage="agentStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="deActivatingId">
        <users-agents-agent-delete-dialog
          :delete-content-text="t('users.agents.deactivate_agent')"
          @onSelectExit="deActivatingId = ''"
          @onSelectDelete="deActivate"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="agentsLimitDialog.id">
        <users-agents-limit-dialog
          :agent-info="agentsLimitDialog"
          :allow-to-update="hasAccess2UpdatePaket || hasAccess2FullPaket"
          :openLimitForAgentCreate="openLimitForAgentCreate"
          @closeDialog="onCloseLimitDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="openedConfigId">
        <UsersAgentsConfigurationCompanyDialog
          :allow-to-attach="hasAccess2AttachConfigs"
          :id="openedConfigId"
          @closeDialog="openedConfigId = ''"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="editingId">
        <users-agents-dialog-body
          :modal-name="t('edit')"
          :id="editingId"
          :allow-to-update="hasAccess2Update || hasAccess2FullPaket"
          :agent-limit-data-for-agent-create="agentLimitDataForAgentCreate"
          @setSelectedData="setSelectedData"
          @closeDialog="onCloseDialog"
          @openAgentLimit="openAgentLimit"
          @refresh="refresh"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="openedOperationsId">
        <users-agents-operations-modal
          :id="openedOperationsId"
          @closeDialog="openedOperationsId = ''"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="deletingId">
        <users-agents-agent-delete-dialog
          is-agree
          is-deleted-icon
          :delete-content-text="t('users.agents.remove_agent')"
          @onSelectExit="deletingId = ''"
          @onSelectDelete="onDeleteAgent(deletingId)"
        />
      </div>
    </transition>
  </div>
  <transition name="modal">
    <div v-if="sessionsUser">
      <SharedSessionsListDialog
        :user-id="sessionsUser.id"
        :limit="sessionsUser.allowed_active_session_count"
        :can-terminate="hasAccess2TerminateSessions"
        :can-update-limit="hasAccess2UpdateSessionLimit"
        @close-dialog="closeSessionsListDialog"
        @on-success="onSuccessSessionsDialog"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useAgentAccess } from "~/composables/access/users/agent-accesses";
import { UsersEventKeys } from "~/variable/event-key-constants";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { onAddFieldToFilter } from "~/utils/store-params";
import type { AgentModel } from "~/interfaces/api/users/agent/agent-model";
import { getDataValue } from "#imports";
import { agentsDeletedHeader, agentsHeader } from "~/variable/column-constants";

// types
type UpdateListPayload = {
  isActiveEvent?: boolean;
  selectedWarehouses?: string[];
  selectedTradeDirections?: string[];
  selectedRolePositions?: string[];
  selectedBranches?: string[];
};

// props
const props = defineProps({
  isActive: Boolean,
  agentLimitDataForAgentCreate: {
    type: Object as () => {
      product_id_arr: Array<{ product_id: string }>;
      price_type_id_arr: Array<{ price_type_id: string }>;
    },
    default: () => ({
      product_id_arr: [],
      price_type_id_arr: [],
    }),
  },
});

// emits
const emit = defineEmits([
  "clearFetchedTab",
  "openAgentLimit",
  "onCloseDialog",
  "setSelectedData",
]);

// stores
const { isActive } = toRefs(props);
const agentStore = useAgentsStore(isActive.value.toString());

// composables
const {
  hasAccess2Update,
  hasAccess2Delete,
  hasAccess2ViewConfigs,
  hasAccess2DeActivate,
  hasAccess2Activate,
  hasAccess2Operations,
  hasAccess2FullPaket,
  hasAccess2PaketDetail,
  hasAccess2UpdatePaket,
  hasAccess2AttachConfigs,
  hasAccess2ChangeAppAccess,
  hasAccess2TerminateSessions,
  hasAccess2GetActiveSessions,
  hasAccess2UpdateSessionLimit,
} = useAgentAccess();

const { t } = useI18n();
const eventBus = useEventBus();

// states
let isAc = ref(false);
const openedOperationsId = ref("");
const openedConfigId = ref("");
const deActivatingId = ref<string>("");
const editingId = ref<string>("");
const deletingId = ref<string>("");
const sessionsUser = ref<AgentModel | null>();

const openLimitForAgentCreate = ref(false);

const agentsLimitDialog = ref({
  id: "",
  isWithoutLimit: false,
});

// constants
const updateListEventKey = UsersEventKeys.AGENT_TABLE_UPDATE;

// hooks
eventBus.on(updateListEventKey, handleUpdateList);
onBeforeUnmount(() => {
  eventBus.off(updateListEventKey, handleUpdateList);
});

const isActiveAgents = computed(() => {
  return agentStore?.data?.items[0]?.is_active;
});

const selectedAgentIds = computed(() =>
  agentStore.editMultipleDialog.reduce<Record<string, boolean>>((acc, item) => {
    acc[item.id] = true;
    return acc;
  }, {}),
);

const isTableAllChecked = computed(() => {
  const items = agentStore.data?.items || [];
  return (
    items.length > 0 && items.every((item) => selectedAgentIds.value[item.id])
  );
});

const isTableIndeterminate = computed(() => {
  const items = agentStore.data?.items || [];
  return (
    items.length > 0 &&
    !isTableAllChecked.value &&
    items.some((item) => selectedAgentIds.value[item.id])
  );
});

// methods
const onCloseDialog = () => {
  emit("onCloseDialog");
  editingId.value = "";
};

const setSelectedData = (data) => {
  emit("setSelectedData", data);
};

const openAgentLimit = (id: string) => {
  emit("openAgentLimit", id);
};

const onChangeFilterActivity = (id, result) => {
  isAc.value = !isAc.value;
  agentStore.changeFilterAppearance(id, result);
};

const onOpenLimitDialog = (id: string) => {
  agentsLimitDialog.value.id = id;
  agentsLimitDialog.value.isWithoutLimit = true;
};

const closeSessionsListDialog = () => {
  sessionsUser.value = null;
};

const onSuccessSessionsDialog = () => {
  refresh();
};

const onCloseLimitDialog = async () => {
  agentsLimitDialog.value.id = "";
  agentsLimitDialog.value.isWithoutLimit = false;
  await refresh();
};

const restore = async (id) => {
  await agentStore.agentRestore(id);
  clearFetchedTab(2);
};

const deActivate = async () => {
  await agentStore.deActivate(deActivatingId.value);
  deActivatingId.value = "";
  clearFetchedTab(1);
};

const onChangeAppAccess = async (data: AgentModel) => {
  data.application_access = !data.application_access; // optimistic update
  const id = data.id;
  const hasAccess = data.application_access;
  const res = await agentStore.changeAppAccess(id!, hasAccess);
  if (res !== "error") {
    notify({ title: t("saved") });
  }
  await refresh();
};

const onDeleteAgent = async (id: string) => {
  const res = await agentStore.fullDeleteAgent(id);
  if (res !== "error") {
    notify({ title: t("toast.deleted"), type: "success" });
    deletingId.value = "";
    await refresh();
  } else {
    notify({ title: t("toast.error"), type: "error" });
  }
};

const onChangeTableHeaders = (value) => {
  if (isActiveAgents.value) {
    agentStore.headersActive = value;
  } else {
    agentStore.headersInactive = value;
  }
};

const getAllAgentsId = (check: boolean) => {
  if (check) {
    agentStore.editMultipleDialog =
      agentStore.data?.items.map((agent) => {
        return {
          id: agent.id,
          full_name: \`\${agent?.full_name}\`,
        };
      }) || [];
  } else {
    agentStore.setNullMultipleDialog();
  }
};

const isTableChecked = (id: string) => {
  return !!agentStore.editMultipleDialog.find((item) => item.id === id);
};

const onSelectAgent = (isChecked: boolean, agent: AgentModel) => {
  const { editMultipleDialog } = agentStore;

  if (isChecked) {
    if (!editMultipleDialog.some((item) => item.id === agent.id)) {
      if (!agent.id) return;

      editMultipleDialog.push({
        id: agent.id,
        full_name: agent.full_name,
        active_session_count: agent.active_session_count,
        allowed_active_session_count: agent.allowed_active_session_count,
      });
    }
  } else {
    agentStore.editMultipleDialog = editMultipleDialog.filter(
      (item) => item.id !== agent.id,
    );
  }
};

const refresh = async () => {
  await agentStore.refresh();
};

const hasAccess2Paket = () => {
  if (hasAccess2FullPaket.value) return true;
  if (hasAccess2UpdatePaket.value) return true;
  return hasAccess2PaketDetail.value;
};

const agentLimitReturnName = (data: AgentModel) => {
  return (data.price_type_name_arr && data.price_type_name_arr.length > 0) ||
    data.products_count > 0
    ? t("users.change_limits")
    : t("users.create_limit");
};

const clearFetchedTab = (isActive: boolean) => {
  emit("clearFetchedTab", isActive);
};

const openSessionsListDialog = (data: AgentModel) => {
  if (!hasAccess2GetActiveSessions.value) return;

  sessionsUser.value = data;
};

function applyFilters(filters?: UpdateListPayload) {
  agentStore.params.trade_direction_id_arr =
    filters?.selectedTradeDirections || [];
  agentStore.params.warehouse_id_arr = filters?.selectedWarehouses || [];
  onAddFieldToFilter(
    agentStore.params,
    "role_position_id",
    filters?.selectedRolePositions || [],
  );
  onAddFieldToFilter(
    agentStore.params,
    "branch_id",
    filters?.selectedBranches || [],
  );
  agentStore.params.filter = [...agentStore.params.filter!];
}

async function getData() {
  await agentStore.getData(String(isActive.value));
}

async function handleUpdateList(payload: UpdateListPayload) {
  const { isActiveEvent } = payload;
  if (isActiveEvent === isActive.value) {
    applyFilters(payload);
    await getData();
  }
}
<\/script>
`;export{e as default};
