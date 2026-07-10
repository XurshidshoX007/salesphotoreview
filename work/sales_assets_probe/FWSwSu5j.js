const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      <div class="table-content-btn-group">
        <table-sort-columns
          :templates="auditReportStore.templates"
          :save-key="auditReport"
          @on-change-table-headers="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="auditReportStore.templates"
          :save-key="auditReport"
        />
        <page-size-btn
          :current-size="auditReportStore.params.page_size"
          :total-count="auditReportStore.data?.total_count"
          :page-number="auditReportStore.data?.page_number"
          @setPageSize="auditReportStore.setPageSize"
        />
        <search-input
          :value="auditReportStore.params.search"
          @change="auditReportStore.search"
        />
        <excel-btn
          :loading="auditReportStore.isExcelFileDownloading"
          @click="auditReportStore.onDownloadExcelFile"
        />
        <RefreshBtn
          @click="auditReportStore.refresh"
          :loading="auditReportStore.isLoading"
        />
      </div>
    </div>
    <div class="table-content-body">
      <data-table
        :headers="auditReportStore.templates"
        :loading="auditReportStore.isLoading"
        :is-empty="!auditReportStore.data?.items?.length"
        :sorted="auditReportStore.params.order_by"
        @sort="auditReportStore.sortData"
      >
        <template #body>
          <c-tr v-for="data in auditReportStore.data?.items" :key="data.id">
            <c-td-no-edit
              v-for="key in auditReportStore.templates"
              :key="key.key"
              :type="key.type"
              :is-checked="key.checked"
            >
              <StatusBtnForTable
                v-if="key.key === 'issue_priority'"
                :status-data="data.issue_priority"
                readonly
              />
              <div v-else-if="key.key === 'identified_issues'">
                <show-more :data="data.identified_issues" :show-count="1">
                  <template #item="{ item }">
                    <AuditAuditReportProblemItem
                      :title="getItemProperty(item, 'issue_name')"
                      :is-confirmed-by-manager="
                        getItemProperty(item, 'is_confirmed_by_manager')
                      "
                      :is-confirmed-by-supervisor="
                        getItemProperty(item, 'is_confirmed_by_supervisor')
                      "
                      @click="
                        openProblemDetailDialog(
                          data.id,
                          getItemProperty(item, 'issue_id')
                        )
                      "
                      class="cursor-pointer"
                    />
                  </template>
                  <template #dropdown-item="{ item }">
                    <AuditAuditReportProblemItem
                      :title="getItemProperty(item, 'issue_name')"
                      :is-confirmed-by-manager="
                        getItemProperty(item, 'is_confirmed_by_manager')
                      "
                      :is-confirmed-by-supervisor="
                        getItemProperty(item, 'is_confirmed_by_supervisor')
                      "
                      is-dropdown-item
                      @click="
                        openProblemDetailDialog(
                          data.id,
                          getItemProperty(item, 'issue_id')
                        )
                      "
                    />
                  </template>
                </show-more>
              </div>

              <show-more
                v-else-if="key.type === 'array'"
                :data="getArrayValue(data, key.key)"
              />
              <LinkComponent
                v-else-if="key.key === 'visual_id'"
                non-copyable
                :value="getVisualId(data)"
                :to="\`/audit/audit-report/\${data.id}\`"
              />
              <RoundedIconBtn
                v-else-if="
                  key.key === 'action' && data.identified_issues.length
                "
                icon="check"
                :tooltip="t('audit.report_audit.confirm_problem')"
                @click="openConfirmDialog(data.id)"
              />
              <div v-else>
                {{ getValue(data, key.key, key.type) }}
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
    <div class="table-content-footer">
      <curren-page-btn
        :current-size="auditReportStore.params.page_size"
        :total-count="auditReportStore.data?.total_count"
        :page-number="auditReportStore.data?.page_number"
      />
      <page-index
        :available-pages="auditReportStore.data?.total_pages"
        :current-page="auditReportStore.data?.page_number"
        @setPage="auditReportStore.setPage"
      />
    </div>
    <transition name="modal">
      <div v-if="problemDetailDialogData">
        <AuditAuditReportProblemDetail
          :get-detail="getProblemDetail"
          :selected-problem-id="problemDetailDialogData.problemId"
          @close-dialog="closeProblemDetailDialog"
        />
      </div>
    </transition>
    <transition name="modal">
      <div v-if="confirmingItemId">
        <AuditAuditReportProblemConfirmDialog
          :get-confirm-problems="getProblemConfirmList"
          :is-save-btn-loading="isProblemConfirmLoading"
          @save="onConfirmProblem"
          @close-dialog="closeConfirmDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type {
  DailyReportVisitListModel,
  IdentifiedIssueConfirmListModel,
} from "~/interfaces/api/audit/audit-report/list-model";
import type { Template } from "~/interfaces/ui/template";
import { getDataValue } from "~/utils/helpers";
import { auditReport } from "~/variable/column-constants";
import { formatTime } from "~/utils/formatters";

// store
const auditReportStore = useAuditReportStore("main");

// states
const { t } = useI18n();
const draggable = ref(false);
const confirmingItemId = ref<string | null>(null);
const isProblemConfirmLoading = ref<boolean>(false);

const problemDetailDialogData = ref<{
  visitId: string;
  problemId: string;
} | null>(null);

// methods
const getValue = (
  data: DailyReportVisitListModel,
  key: string,
  type?: string
) => {
  const value = getDataValue(data, key, type);
  if (key === "spent_time") {
    return formatTime(value as string, t);
  }
  return value;
};

const getVisualId = (data: DailyReportVisitListModel): string => {
  return getValue(data, "visual_id") as string;
};

const getArrayValue = (data: DailyReportVisitListModel, key: string) => {
  const value = getValue(data, key);
  return Array.isArray(value) ? value : [];
};

const getItemProperty = (item: any, property: string) => {
  return item?.[property];
};

const onChangeTableHeaders = (newValue: Template[]) => {
  auditReportStore.templates = newValue;
  closeDraggableDialog();
};

const closeDraggableDialog = () => {
  draggable.value = false;
};

const openProblemDetailDialog = (visitId: string, problemId: string) => {
  problemDetailDialogData.value = { visitId, problemId };
};

const closeProblemDetailDialog = () => {
  problemDetailDialogData.value = null;
};

const openConfirmDialog = (visitId: string) => {
  confirmingItemId.value = visitId;
};

const closeConfirmDialog = () => {
  confirmingItemId.value = null;
};

const getProblemDetail = async () => {
  if (!problemDetailDialogData.value) return;
  return await auditReportStore.getIdentifiedIssueList(
    problemDetailDialogData.value.visitId
  );
};

const getProblemConfirmList = async (): Promise<
  IdentifiedIssueConfirmListModel[] | "error" | undefined
> => {
  if (!confirmingItemId.value) return;
  return await auditReportStore.getIdentifiedIssueConfirmList(
    confirmingItemId.value
  );
};

const onConfirmProblem = async (confirmingProblems: string[]) => {
  if (!confirmingProblems.length) {
    closeConfirmDialog();
    return;
  }

  if (!confirmingItemId.value) return;
  isProblemConfirmLoading.value = true;

  await auditReportStore.confirmIdentifiedIssue(
    confirmingItemId.value,
    confirmingProblems || []
  );
  notify({
    title: t("audit.report_audit.confirmed") + " !",
    type: "success",
  });
  closeConfirmDialog();
  isProblemConfirmLoading.value = false;
  await auditReportStore.refresh();
};
<\/script>
`;export{e as default};
