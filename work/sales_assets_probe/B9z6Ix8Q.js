const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <table-sort-columns
        :save-key="rolePositionsHeader"
        :templates="rolePositionsStore.templates"
        @onChangeTableHeaders="onChangeTableHeaders"
      />
      <show-hide-column
        :headers="rolePositionsStore.templates"
        :save-key="rolePositionsHeader"
      />
      <page-size-btn
        :current-size="rolePositionsStore.params.page_size"
        :total-count="rolePositionsStore.data?.total_count"
        :page-number="rolePositionsStore.data?.page_number"
        @setPageSize="rolePositionsStore.setPageSize"
      />
      <excel-btn
        @click="rolePositionsStore.onDownloadExcelFile"
        :loading="rolePositionsStore.isExcelFileDownloading"
      />
      <RefreshBtn @click="refresh" :loading="rolePositionsStore.isLoading" />
    </div>
    <div class="table-content-body">
      <data-table
        :headers="rolePositionsStore.templates"
        @sort="rolePositionsStore.sortData"
        :sorted="rolePositionsStore.params.order_by"
        :loading="rolePositionsStore.isLoading"
        :is-empty="!rolePositionsStore.data?.items?.length"
      >
        <template #body>
          <c-tr v-for="data in rolePositionsStore.data?.items" :key="data.id">
            <c-td-no-edit
              v-for="column in rolePositionsStore.templates"
              :key="column.key"
              :is-checked="column.checked"
              :type="column.type"
            >
              <div
                v-if="column.key === 'action'"
                class="flex items-center gap-2"
              >
                <rounded-icon-btn
                  type="edit"
                  :iconSize="20"
                  @click="openEditDialog(data.id)"
                />
              </div>
              <template v-if="column.key === 'role'">
                {{ getRoleName(data.role) }}
              </template>
              <template v-else>
                {{ getDataValue(data, column.key, column?.type) }}
              </template>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="rolePositionsStore.params.page_size"
        :total-count="rolePositionsStore.data?.total_count"
        :page-number="rolePositionsStore.data?.page_number"
      />
      <page-index
        :available-pages="rolePositionsStore.data?.total_pages"
        :current-page="rolePositionsStore.data?.page_number"
        @setPage="rolePositionsStore.setPage"
      />
    </div>
  </div>

  <transition name="modal">
    <div v-if="editingId">
      <settings-role-positions-data-dialog
        :id="editingId"
        @closeDialog="closeEditDialog"
        @clearFetchedTab="clearFetchedTab"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { rolePositionsHeader } from "~/variable/column-constants";
import { getDataValue, getFormattedAmount } from "#imports";

// Types
type Props = {
  isActive: boolean;
};

type Emits = {
  (e: "clearFetchedTab", isActive: boolean): void;
};

// Props
const props = defineProps<Props>();

// Emits
const emit = defineEmits<Emits>();

// Store
const { isActive } = toRefs(props);
const rolePositionsStore = useRolePositionsStore(isActive.value.toString());
const { getRoles } = rolePositionsStore;

// Composable
const eventBus = useEventBus();

// State
const editingId = ref<string | null>();
const updateListEventKey = SettingsEventKeys.ROLE_POSITIONS_TABLE_UPDATE;

// Hooks
onMounted(async () => {
  await Promise.all([getData(), getRoles()]);
});

eventBus.on(updateListEventKey, async (updatedIsActive) => {
  if (updatedIsActive === isActive.value) {
    await getData();
  }
});

// Methods
const onChangeTableHeaders = (param: Template[]) => {
  rolePositionsStore.templates = param;
};

const openEditDialog = (id: string) => {
  editingId.value = id;
};

const closeEditDialog = () => {
  editingId.value = null;
};

const clearFetchedTab = (isActive: boolean) => {
  emit("clearFetchedTab", isActive);
};

const refresh = async () => {
  await rolePositionsStore.refresh();
};

const getData = async () => {
  await rolePositionsStore.getData(isActive.value.toString());
};

const getRoleName = (roleId: number) => {
  const role = rolePositionsStore.roles.find((r) => r.id === roleId);
  return role ? role.name : "";
};
<\/script>
`;export{e as default};
