const n=`<template>
  <div class="table-content-container !border-none h-fit p-5 space-y-5">
    <div class="font-medium text-xl">
      {{ t("audit.survey_changes") }}
    </div>
    <div class="border-t border-neutral-200"></div>
    <div class="font-medium text-lg">
      {{ surveyDetail?.question_form.name }}
    </div>
    <div
      v-if="isLoading"
      class="w-full flex justify-center items-center min-h-96"
    >
      <icon-loading :loading="true" :width="14" :height="14" />
    </div>
    <div v-else>
      <form @submit.prevent="onSave" class="space-y-5">
        <AuditAuditReportDetailUpdateSurveyQuestion
          v-for="question in surveyDetail?.questions"
          :key="question.id"
          :data="question"
          :item-req="getItemReq(question.id)"
          :is-question="isQuestionVisible(question)"
          @update-answers="onUpdateAnswers"
        />
        <div class="flex items-center justify-end gap-3">
          <m-btn group="outlined" class="w-full sm:w-fit" @click="onClose">
            {{ t("clients.cancel") }}
          </m-btn>
          <m-btn type="submit" :loading="isBtnLoading" class="w-full sm:w-fit">
            {{ t("save") }}
          </m-btn>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import type {
  AnswerReq,
  SurveyDetail,
  SurveyDetailReq,
  SurveyQuestion,
} from "~/interfaces/api/audit/audit-report/detail-models";

// types
interface Props {
  visitId: string;
  questionId: string;
}

// props
const props = defineProps<Props>();

// emits
const emit = defineEmits<{
  (e: "onClose"): void;
  (e: "onRefresh"): void;
}>();

// store
const visitDetailStore = useAuditReportDetailStore("main");

// state
const { t } = useI18n();

const isLoading = ref(false);
const surveyDetail = ref<SurveyDetail>();
const isBtnLoading = ref(false);

const surveyDetailReq = ref<SurveyDetailReq>({
  id: surveyDetail.value?.id || "",
  answers: [],
});

const transformResponseData = computed(() => {
  const normalizedAnswers: AnswerReq[] = [];

  for (const item of surveyDetail.value?.questions || []) {
    if (item.variants.length) {
      item.variants
        .filter((el) => el.is_answered)
        .forEach((variant, index) => {
          normalizedAnswers.push({
            question_id: item.id,
            variant_id: variant.id,
            answer: variant.variant_answer,
          });
        });
      continue;
    } else {
      normalizedAnswers.push({
        answer: item.answer,
        question_id: item.id,
        variant_id: null,
      });
    }
  }
  return normalizedAnswers;
});

// methods
const onClose = () => emit("onClose");

const getItemReq = (id: string) => {
  return surveyDetailReq.value.answers.filter((el) => el.question_id === id);
};

const removeAnswers = (answeredReqs: AnswerReq[]) => {
  answeredReqs.forEach((el) => {
    const foundInd = surveyDetailReq.value.answers.findIndex(
      (ans) => ans.question_id === el.question_id,
    );
    if (foundInd > -1) surveyDetailReq.value.answers.splice(foundInd, 1);
  });
};

const isQuestionVisible = (question: SurveyQuestion): boolean => {
  const answers = surveyDetailReq.value.answers;
  const answeredForThisQuestion = getAnsweredByQuestionId(question.id, answers);

  if (!question.display_conditions.length) return true;

  return question.display_conditions.every((condition) =>
    validateCondition(condition, answers, answeredForThisQuestion),
  );
};

const getAnsweredByQuestionId = (questionId: string, answers: AnswerReq[]) =>
  answers.filter((a) => a.question_id === questionId);

const validateCondition = (
  condition: SurveyQuestion["display_conditions"][number],
  allAnswers: AnswerReq[],
  currentQuestionAnswers: AnswerReq[],
): boolean => {
  const { answer, is_equal, related_question_id, variant_id_arr } = condition;

  const relatedAnswers = getAnsweredByQuestionId(
    related_question_id,
    allAnswers,
  );

  if (!relatedAnswers.length) return invalidate(currentQuestionAnswers);

  if (variant_id_arr.length) {
    return validateVariantCondition(
      variant_id_arr,
      relatedAnswers,
      is_equal,
      currentQuestionAnswers,
    );
  }

  if (answer) {
    return validateAnswerCondition(
      answer,
      relatedAnswers,
      is_equal,
      currentQuestionAnswers,
    );
  }

  return invalidate(currentQuestionAnswers);
};

const validateVariantCondition = (
  requiredVariantIds: string[],
  relatedAnswers: AnswerReq[],
  isEqual: boolean,
  answeredReqs: AnswerReq[],
): boolean => {
  const relatedVariantIDs = relatedAnswers.map((a) => a.variant_id);
  const conditionMet = isEqual
    ? requiredVariantIds.every((id) => relatedVariantIDs.includes(id))
    : requiredVariantIds.every((id) => !relatedVariantIDs.includes(id));

  return conditionMet ? true : invalidate(answeredReqs);
};

const validateAnswerCondition = (
  expectedAnswer: string,
  relatedAnswers: AnswerReq[],
  isEqual: boolean,
  answeredReqs: AnswerReq[],
): boolean => {
  const relatedAnswer = relatedAnswers[0];
  if (!relatedAnswer) return invalidate(answeredReqs);

  const conditionMet = isEqual
    ? expectedAnswer === relatedAnswer.answer
    : expectedAnswer !== relatedAnswer.answer;

  return conditionMet ? true : invalidate(answeredReqs);
};

const invalidate = (answeredReqs: AnswerReq[]): false => {
  removeAnswers(answeredReqs);
  return false;
};

const onUpdateAnswers = ({
  payload,
  questionId,
}: {
  payload: AnswerReq[];
  questionId: string;
}) => {
  const filteredAnswersReq = surveyDetailReq.value.answers.filter(
    (el) => el.question_id !== questionId,
  );
  for (const element of payload) {
    filteredAnswersReq.push(element);
  }
  surveyDetailReq.value.answers = filteredAnswersReq;
};

const onSave = async () => {
  isBtnLoading.value = true;
  const request = {
    id: surveyDetailReq.value.id,
    answers: surveyDetailReq.value.answers.filter(
      (el) => el.answer || el.variant_id,
    ),
  };
  const res = await visitDetailStore.updateSurveyDetail(request);
  isBtnLoading.value = false;
  if (res !== "error") emit("onRefresh");
};

const fetchSurveyDetail = async () => {
  isLoading.value = true;
  const data = await visitDetailStore.getSurveyDetail({
    visitId: props.visitId,
    questionFormId: props.questionId,
  });
  surveyDetail.value = data;
  surveyDetailReq.value = {
    id: data.id,
    answers: transformResponseData.value,
  };
  isLoading.value = false;
};

// hooks
onMounted(() => {
  fetchSurveyDetail();
});
<\/script>

<style scoped lang="scss">
.title {
  @apply font-medium text-lg text-neutral-950;
}
</style>
`;export{n as default};
