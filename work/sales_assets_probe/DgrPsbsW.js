const n=`<template>
  <div>
    <div class="table-content-container">
      <div class="table-content-header">
        <table-sort-columns
          :save-key="questionsColumn"
          :templates="auditQuestionStore.templates"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="auditQuestionStore.templates"
          :save-key="questionsColumn"
        />
        <page-size-btn
          :current-size="auditQuestionStore.params.page_size"
          @setPageSize="auditQuestionStore.setPageSize"
        />
        <search-input
          @change="auditQuestionStore.search"
          :value="auditQuestionStore.params.search"
        />
        <excel-btn
          @click="auditQuestionStore.onDownloadExcelFile"
          :loading="auditQuestionStore.isExcelFileDownloading"
        />
        <RefreshBtn @click="refresh" :loading="auditQuestionStore.loading" />
      </div>
      <div class="table-content-body">
        <data-table
          :headers="auditQuestionStore.templates"
          :sorted="auditQuestionStore.params.order_by"
          :loading="auditQuestionStore.loading"
          :is-empty="!auditQuestionStore.data?.items.length"
          @sort="auditQuestionStore.sortData"
        >
          <template #body>
            <c-tr v-for="data in auditQuestionStore.data?.items" :key="data">
              <c-td-no-edit
                v-for="key in auditQuestionStore.templates"
                :key="key"
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
                <div v-else-if="key.key === 'name'">
                  <link-component
                    isLinkable
                    :value="data[key.key]"
                    @click="openDetailDialog(data?.id)"
                  />
                </div>
                <div v-else-if="key.type === 'number'">
                  {{ getFormattedAmount(data[key.key]) }}
                </div>
                <div
                  v-else-if="key.key === 'action'"
                  class="flex items-center gap-x-3"
                >
                  <rounded-icon-btn
                    v-if="hasAccess2SaveQuestionFormUsers"
                    :tooltip="t('settings.attach')"
                    icon-file-name="UserAdd"
                    type="info"
                    @click="openPositionDialog(data.id)"
                  />
                  <rounded-icon-btn
                    v-if="hasAccess2QuestionUpdate"
                    type="edit"
                    :iconSize="20"
                    @click="editAuditQuestion(data.id)"
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
          :current-size="auditQuestionStore.params.page_size"
          :total-count="auditQuestionStore.data?.total_count"
          :page-number="auditQuestionStore.data?.page_number"
        />
        <page-index
          :available-pages="auditQuestionStore.data?.total_pages"
          :current-page="auditQuestionStore.data?.page_number"
          @setPage="auditQuestionStore.setPage"
        />
      </div>
    </div>
    <transition name="modal">
      <div v-if="questionFormId">
        <AuditSettingsQuestionsPositonDialog
          :questionFormId="questionFormId"
          @closeDialog="closeQuestionPositionDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="questionIdForDetail">
        <AuditSettingsQuestionsDetailDialog
          :questionIdForDetail="questionIdForDetail"
          @closeDialog="closeQuestionDetailDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useEventBus } from "~/composables/EventBus/eventBus";
import type { Template } from "~/interfaces/ui/template";
import { AuditEventKeys } from "~/variable/event-key-constants";
import { questionsColumn } from "~/variable/column-constants";
import { useI18n } from "vue-i18n";
import { useAuditSettingsAccess } from "~/composables/access/audit/audit-settings";

// props
const props = defineProps<{
  isActive: boolean;
}>();

// Store
const { t } = useI18n();
const { isActive } = toRefs(props);
const auditQuestionStore = useAuditQuestionStore(isActive.value.toString());

// State
const router = useRouter();
const eventBus = useEventBus();
const updateListEventKey = AuditEventKeys.QUESTION_TABLE_UPDATE;
const questionFormId = ref<string | null>(null);
const questionIdForDetail = ref<string | null>(null);
const { hasAccess2QuestionUpdate, hasAccess2SaveQuestionFormUsers } =
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
  auditQuestionStore.templates = param;
};

const getData = async () => {
  await auditQuestionStore.getData(isActive.value.toString());
};

const refresh = async () => {
  await auditQuestionStore.refresh();
};

const editAuditQuestion = (id: string) => {
  router.push({
    path: "/audit/settings/questions/create-questions",
    query: { id: id },
  });
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

const openPositionDialog = (id: string) => {
  questionFormId.value = id;
};

const closeQuestionPositionDialog = () => {
  questionFormId.value = null;
};

const openDetailDialog = (id: string) => {
  questionIdForDetail.value = id;
};

const closeQuestionDetailDialog = () => {
  questionIdForDetail.value = null;
};
<\/script>
`;export{n as default};
