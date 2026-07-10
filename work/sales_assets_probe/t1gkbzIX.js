const e=`<template>
  <div class="table-content-container h-fit">
    <div class="table-content-header justify-between">
      <div class="flex items-center gap-x-4">
        <table-sort-columns
          :templates="headers"
          :save-key="auditReportDetailBySurvey"
          @onChangeTableHeaders="onChangeTableHeaders"
        />
        <ShowHideColumn
          :headers="headers"
          :save-key="auditReportDetailBySurvey"
        />
        <RefreshBtn :loading="isLoading" @click="fetchSurveyData" />
      </div>
      <m-btn group="primary" class="w-full sm:w-fit" @click="onEditSurvey">
        {{ t("edit") }}
      </m-btn>
    </div>
    <div class="table-content-body">
      <data-table
        :headers="headers"
        :loading="isLoading"
        :is-empty="isDataEmpty"
      >
        <template #body>
          <c-tr
            v-for="item in data?.questions"
            :key="item.id"
            class="last-border-b-0"
          >
            <c-td-no-edit
              v-for="header in headers"
              :key="header.key"
              :type="header.type"
              :is-checked="header.checked"
            >
              <div v-if="header.key !== 'answer'">
                {{ getValue(item, header.key, header.type) }}
              </div>
              <div v-else>
                <div v-if="item.answer">
                  {{ getAnswerVal(item) }}
                </div>
                <TagsComponent :data="getVariantTxtArr(item)" />
              </div>
            </c-td-no-edit>
          </c-tr>
        </template>
      </data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { auditReportDetailBySurvey } from "~/variable/column-constants";
import type { Template } from "~/interfaces/ui/template";
import type { BySurveyIdModel } from "~/interfaces/api/audit/audit-report/detail-models";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";
import { QuestionType } from "~/variable/static-constants";

// props
const props = defineProps<{
  visitId: string;
  surveyId: string;
  isSurveyDataUpdate?: boolean;
}>();

// emits
const emit = defineEmits<{
  (e: "onEdit", data: boolean): void;
}>();

// stores
const visitDetailStore = useAuditReportDetailStore("main");

// states
const { t } = useI18n();
const isLoading = ref(false);
const questionTypes = ref<ConstantModel[]>([]);

const data = ref<BySurveyIdModel>();

const headers = ref<Template[]>([
  {
    name: t("audit.question"),
    key: "question",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("audit.answer"),
    key: "answer",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("column.type"),
    key: "field_type",
    checked: true,
    is_sortable: false,
  },
  {
    name: t("labels.is_required"),
    key: "comment",
    type: "boolean",
    checked: true,
    is_sortable: false,
  },
]);

const isDataEmpty = computed(() => {
  return !data.value || !Object.keys(data.value).length;
});

// methods
const getValue = (
  data: BySurveyIdModel["questions"][number],
  key: string,
  type?: string
) => {
  const value = getDataValue<BySurveyIdModel["questions"][number]>(
    data as BySurveyIdModel["questions"][number],
    key,
    type
  );
  if (key === "field_type") {
    return getFieldTypeName(value as number);
  } else if (type === "boolean") {
    return value ? t("filters.yes") : t("filters.no");
  }
  return value;
};

const getAnswerVal = (item: BySurveyIdModel["questions"][number]) => {
  if (item.field_type === QuestionType.YES_NO) {
    return item.answer.toLowerCase() === "true"
      ? t("filters.yes")
      : t("filters.no");
  }
  return item.answer;
};

const getVariantTxtArr = (item: BySurveyIdModel["questions"][number]) => {
  if (
    item.field_type === QuestionType.RADIO_SELECT ||
    item.field_type === QuestionType.MULTIPLE_SELECT
  )
    return (
      item.variants.map((variant) => {
        // variant_answer is exist take it other ways take variant_text
        if (variant.variant_answer) return variant.variant_answer;
        return variant.variant_text;
      }) || []
    );

  if (item.field_type === QuestionType.SHELF_SHARE) {
    return item.variants.map((variant) => {
      return \`\${variant.variant_text}: \${variant.variant_answer}%\`;
    });
  }
  return item.variants?.map((variant) => variant.variant_text) || [];
};

const onChangeTableHeaders = (newValue: Template[]) => {
  headers.value = newValue;
};

async function fetchSurveyData() {
  isLoading.value = true;
  data.value = (await visitDetailStore.getSurveyTableData(
    props.visitId,
    props.surveyId
  )) as BySurveyIdModel;
  isLoading.value = false;
}

const getQuestionTypes = async () => {
  questionTypes.value = (await visitDetailStore.getQuestionTypes()) || [];
};

const getFieldTypeName = (typeId: number) => {
  return questionTypes.value.find((item) => item.id === typeId)?.name || "";
};

const onEditSurvey = () => {
  emit("onEdit", true);
};

// hooks
onMounted(async () => await getQuestionTypes());

watch(
  () => props.surveyId,
  async () => {
    if (props.surveyId) {
      await fetchSurveyData();
    }
  },
  { immediate: true }
);

watch(
  () => props.isSurveyDataUpdate,
  async (val) => {
    if (val) {
      await fetchSurveyData();
    }
  },
  { immediate: true }
);
<\/script>

<style scoped>
.table-content-body {
  padding-bottom: 0;
}
</style>
`;export{e as default};
