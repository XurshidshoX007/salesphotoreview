const e=`<template>
  <d-modal
    :name="t('audit.report_audit.problem_confirmation')"
    :loading="isLoading"
    @close-dialog="closeDialog"
  >
    <flex-col class="gap-1">
      {{ t("audit.report_audit.you_are_confirming_following_issues") }}:
      <ItemsSelectByCheckbox
        :items="items"
        :selected-items="allCheckedItems"
        :loading="isLoading"
        @on-change-selected-items="onSelectItems"
      />
    </flex-col>
    <template #footer>
      <flex-row class="items-center justify-between">
        <cancel-btn @click="closeDialog">
          {{ t("cancel") }}
        </cancel-btn>
        <m-btn :loading="isSaveBtnLoading" @click="onSave">{{
          t("save")
        }}</m-btn>
      </flex-row>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { ref, computed, onMounted } from "vue";
import type { IdentifiedIssueConfirmListModel } from "~/interfaces/api/audit/audit-report/list-model";
import { getFormattedDate } from "~/utils/formatters";

// types
interface SelectableItem {
  id: string | number;
  name: string;
  disabled?: boolean;
  tooltip?: string;
  showWarning?: boolean;
}

interface Props {
  isSaveBtnLoading?: boolean;
  getConfirmProblems: () => Promise<
    IdentifiedIssueConfirmListModel[] | "error" | undefined
  >;
}

interface Emits {
  (e: "close-dialog"): void;
  (e: "save", selectedProblems: string[]): void;
}

// props
const props = defineProps<Props>();

// emits
const emit = defineEmits<Emits>();

// States
const { t } = useI18n();
const selectedProblems = ref<string[]>([]);
const isLoading = ref<boolean>(false);
const problems = ref<IdentifiedIssueConfirmListModel[]>([]);

// Computed properties
const items = computed((): SelectableItem[] => {
  if (!problems.value || !Array.isArray(problems.value)) return [];
  return problems.value.map(({ issue, is_confirmed, confirmed_date }) => ({
    id: issue.id,
    name: issue.name,
    disabled: is_confirmed,
    tooltip: !is_confirmed
      ? undefined
      : t("audit.report_audit.confirmed_in") +
        \` \${getFormattedDate(confirmed_date)}\`,
  }));
});

const alreadyConfirmedItems = computed((): string[] => {
  return problems.value
    .filter((item) => item.is_confirmed)
    .map(({ issue }) => issue.id);
});

const allCheckedItems = computed((): string[] => [
  ...selectedProblems.value,
  ...alreadyConfirmedItems.value,
]);

onMounted(async () => {
  await getProblemConfirmList();
  autoSelectUnConfirmedProblems();
});

// Methods
const closeDialog = (): void => {
  emit("close-dialog");
};

const onSave = async (): Promise<void> => {
  emit("save", selectedProblems.value);
};

const onSelectItems = (ids: (string | number)[]): void => {
  // filter by disabled items in items and ensure string type
  selectedProblems.value = ids
    .filter((id) =>
      items.value.some((item) => item.id === id && !item.disabled)
    )
    .map((id) => String(id)); // Ensure string type
};

const autoSelectUnConfirmedProblems = (): void => {
  const unConfirmedProblems = problems.value.filter(
    (item) => !item.is_confirmed
  );
  selectedProblems.value = unConfirmedProblems.map(({ issue }) => issue.id);
};

const getProblemConfirmList = async (): Promise<void> => {
  isLoading.value = true;
  const result = await props.getConfirmProblems();
  isLoading.value = false;

  if (result === "error") {
    notify({
      type: "error",
      title: t("toast.error"),
    });
    closeDialog();
    return;
  }

  problems.value = result || [];
};
<\/script>
`;export{e as default};
