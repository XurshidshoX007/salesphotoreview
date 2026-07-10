const e=`<template>
  <d-modal
    :name="t('audit.report_audit.problem_details')"
    :loading="isLoading"
    data-container-width="40%"
    @close-dialog="closeDialog"
  >
    <flex-col class="gap-5">
      <DropdownsByFilterStates :filter-states="filterStates" />
      <flex-row class="items-center justify-between flex-wrap gap-2">
        <flex-row class="items-center gap-2.5">
          {{ t("column.manager") }}
          <AuditAuditReportProblemItem
            only-manager
            :is-confirmed-by-manager="selectedIssue?.is_confirmed_by_manager"
            :title="
              selectedIssue?.is_confirmed_by_manager
                ? t('audit.report_audit.confirmed')
                : t('audit.report_audit.not_confirmed')
            "
          />
        </flex-row>
        <flex-row class="items-center gap-2.5">
          {{ t("sidebar.supervisor") }}
          <AuditAuditReportProblemItem
            only-supervisor
            :title="
              selectedIssue?.is_confirmed_by_supervisor
                ? t('audit.report_audit.confirmed')
                : t('audit.report_audit.not_confirmed')
            "
            :is-confirmed-by-supervisor="
              selectedIssue?.is_confirmed_by_supervisor
            "
          />
        </flex-row>
      </flex-row>
      <flex-col v-if="selectedIssue?.confirmations?.length" class="gap-1 5">
        {{ t("audit.report_audit.list_of_problem_approvers") }}
        <div
          class="w-full overflow-auto rounded-large border-primary-gray border"
        >
          <data-table
            :headers="headers"
            :loading="isLoading"
            with-information-above-header
          >
            <template #body>
              <c-tr
                v-for="confirmation in selectedIssue?.confirmations"
                :key="confirmation.user.id"
                class="last-border-b-0"
              >
                <c-td-no-edit
                  v-for="key in headers"
                  :key="key.key"
                  :type="key.type"
                  :is-checked="key.checked"
                >
                  {{
                    getDataValue(
                      confirmation,
                      key.accessorKey || key.key,
                      key.type
                    )
                  }}
                </c-td-no-edit>
              </c-tr>
            </template>
          </data-table>
        </div>
      </flex-col>
    </flex-col>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { IdentifiedIssueListModel } from "~/interfaces/api/audit/audit-report/list-model";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";
import type { Template } from "~/interfaces/ui/template";
import { getDataValue } from "~/utils/helpers";

// props
const props = defineProps<{
  getDetail: () => Promise<IdentifiedIssueListModel[] | undefined>;
  selectedProblemId?: string;
}>();

// emits
const emit = defineEmits<{
  (e: "close-dialog"): void;
}>();

// states
const { t } = useI18n();
const details = ref<IdentifiedIssueListModel[]>([]);
const isLoading = ref<boolean>(false);
const selectedIssueId = ref<string | null>(null);

const headers = ref<Template[]>([
  {
    name: t("audit.report_audit.user"),
    key: "user",
    checked: true,
    type: "object",
    accessorKey: "user.name",
    is_sortable: false,
  },
  {
    name: t("audit.report_audit.role"),
    key: "user",
    checked: true,
    type: "object",
    accessorKey: "user.role",
    is_sortable: false,
  },
  {
    name: t("audit.report_audit.confirmation_date"),
    key: "confirmation_date",
    type: "date",
    checked: true,
    is_sortable: false,
  },
]);

// hooks
const selectedIssue = computed(() => {
  return details.value.find((item) => item.issue.id === selectedIssueId.value);
});

const filterStates = computed<FilterStateModel[]>(() => {
  if (!details.value || details.value.length === 0) {
    return [];
  }
  return [
    {
      name: t("audit.problems"),
      key: "issue",
      isSingleSelect: true,
      data: { items: details.value.map((item) => item.issue) || [] },
      get getSelectedData() {
        return selectedIssueId.value ?? "";
      },
      set setSelectedData(value: string) {
        selectedIssueId.value = value;
      },
    },
  ];
});

onMounted(async () => {
  await getDetail();
  if (!props.selectedProblemId) autoSelectFirstIssue();
  else selectedIssueId.value = props.selectedProblemId;
});

// methods
const closeDialog = () => {
  emit("close-dialog");
};

const getDetail = async () => {
  isLoading.value = true;
  details.value = (await props.getDetail()) || [];
  isLoading.value = false;
};

const autoSelectFirstIssue = () => {
  if (details.value.length > 0) {
    selectedIssueId.value = details.value[0].issue.id;
  }
};
<\/script>
`;export{e as default};
