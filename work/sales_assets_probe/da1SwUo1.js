const e=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="auditorClientProductReviewColumn"
          :templates="auditReviewConfigStore.templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="auditReviewConfigStore.templates"
          :save-key="auditorClientProductReviewColumn"
        />
        <page-size-btn
          :current-size="auditReviewConfigStore.params.page_size"
          @setPageSize="auditReviewConfigStore.setPageSize"
        />
        <search-input
          @change="auditReviewConfigStore.search"
          :value="auditReviewConfigStore.params.search"
        />
        <excel-btn
          @click="auditReviewConfigStore.onDownloadExcelFile"
          :loading="auditReviewConfigStore.isExcelFileDownloading"
        />
        <RefreshBtn
          @click="refresh"
          :loading="auditReviewConfigStore.loading"
        />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="auditReviewConfigStore.templates"
          :sorted="auditReviewConfigStore.params.order_by"
          :loading="auditReviewConfigStore.loading"
          :is-empty="!auditReviewConfigStore.data?.items.length"
          @sort="auditReviewConfigStore.sortData"
        >
          <template #body>
            <c-tr
              v-for="data in auditReviewConfigStore.data?.items"
              :key="data.id"
            >
              <c-td-no-edit
                v-for="key in auditReviewConfigStore.templates"
                :key="key.key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.key === 'is_required_to_fill'">
                  <StatusBtnForTable
                    readonly
                    :statusData="
                      getStatusDataByRequiredField(data.is_required_to_fill)
                    "
                  />
                </div>
                <div v-else-if="key.type === 'number'">
                  {{ getFormattedAmount(data[key.key]) }}
                </div>
                <div v-else-if="key.type === 'date'">
                  {{ getFormattedDate(data[key.key], "DD.MM.YYYY HH:mm:ss") }}
                </div>
                <div
                  v-else-if="key.key === 'action'"
                  class="flex items-center gap-x-3"
                >
                  <rounded-icon-btn
                    v-if="hasAccess2SaveAuditUsers"
                    icon-file-name="UserAdd"
                    :tooltip="t('settings.attach')"
                    type="info"
                    @click="openPositionDialog(data.id)"
                  />
                  <rounded-icon-btn
                    v-if="hasAccess2AuditUpdate"
                    type="edit"
                    :iconSize="20"
                    @click="openEditDialog(data.id)"
                  />
                </div>
                <div v-else>
                  {{ data[key.key] }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="auditReviewConfigStore.params.page_size"
          :total-count="auditReviewConfigStore.data?.total_count"
          :page-number="auditReviewConfigStore.data?.page_number"
        />
        <page-index
          :available-pages="auditReviewConfigStore.data?.total_pages"
          :current-page="auditReviewConfigStore.data?.page_number"
          @setPage="auditReviewConfigStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="editingId">
        <AuditSettingsAuditDialog
          :id="editingId"
          @closeDialog="closeEditDialog"
          @clearFetchedTab="clearFetchedTab"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="configId">
        <AuditSettingsAuditPositonDialog
          :configId="configId"
          @close-dialog="closePositionDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useEventBus } from "~/composables/EventBus/eventBus";
import type { Template } from "~/interfaces/ui/template";
import { AuditEventKeys } from "~/variable/event-key-constants";
import { auditorClientProductReviewColumn } from "~/variable/column-constants";
import { useI18n } from "vue-i18n";
import { useAuditSettingsAccess } from "~/composables/access/audit/audit-settings";
import { getFormattedDate } from "~/utils/formatters";
import { getFormattedAmount } from "~/utils/filter";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// Store
const { isActive } = toRefs(props);
const auditReviewConfigStore = useAuditReviewConfigStore(
  isActive.value.toString(),
);

// emits
const emit = defineEmits(["clearFetchedTab"]);

// State
const { t } = useI18n();
const router = useRouter();
const eventBus = useEventBus();
const updateListEventKey = AuditEventKeys.AUDIT_TABLE_UPDATE;
const configId = ref<string | null>(null);
const editingId = ref<string>("");
const { hasAccess2AuditUpdate, hasAccess2SaveAuditUsers } =
  useAuditSettingsAccess();

// hooks
eventBus.on(updateListEventKey, async (updatedIsActive) => {
  if (updatedIsActive === isActive.value) {
    await getData();
  }
});

onMounted(async () => {
  await getData();
});

// Methods
const onChangeTableHeaders = (param: Template[]) => {
  auditReviewConfigStore.templates = param;
};

const getData = async () => {
  await auditReviewConfigStore.getData(isActive.value.toString());
};

const refresh = async () => {
  await auditReviewConfigStore.refresh();
};

const getStatusDataByRequiredField = (is_required_to_fill: boolean) => {
  if (is_required_to_fill) {
    return {
      hex_color: "#23C00A",
      name: t("filters.yes"),
      key: "active",
    };
  }
  return {
    hex_color: "#BD7F06",
    name: t("filters.no"),
    key: "no_active",
  };
};

const openEditDialog = (id: string) => {
  editingId.value = id;
};

const closeEditDialog = () => {
  editingId.value = "";
};

const clearFetchedTab = (isActive: boolean) => {
  emit("clearFetchedTab", isActive);
};

const openPositionDialog = (id: string) => {
  configId.value = id;
};

const closePositionDialog = () => {
  configId.value = null;
};
<\/script>
`;export{e as default};
