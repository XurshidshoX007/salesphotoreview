const n=`<template>
  <div
    v-if="isQuestion"
    class="rounded-xl border border-neutral-200 p-5 space-y-5"
  >
    <div class="title">{{ data.question }}</div>
    <div class="space-y-3">
      <dropdowns-by-filter-states
        v-if="isDropdownSelect(data.field_type)"
        :filter-states="getVariantState()"
      />
      <d-input
        v-if="data.field_type === QuestionType.NUMBER"
        :value="answerValue"
        type="number"
        :required="data.is_required"
        @change="setSingleAnswer"
      />
      <d-input
        v-if="data.field_type === QuestionType.TEXT"
        :value="answerValue"
        type="text"
        :required="data.is_required"
        @change="setSingleAnswer"
      />
      <div
        v-if="data.field_type === QuestionType.SHELF_SHARE || isAnswerInput"
        class="space-y-3"
      >
        <div v-for="item in answerRequiredInputs" :key="item.variant_id || ''">
          <d-input
            :value="item.answer"
            :label="data.variants.find((el) => el.id === item.variant_id)?.name"
            :type="isAnswerInput ? 'text' : 'number'"
            :required="data.is_required"
            :min="!isAnswerInput ? 1 : ''"
            :max="!isAnswerInput ? 100 : ''"
            @change="setChildAnswer(item, $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { QuestionType } from "~/variable/static-constants";
import { debounce } from "~/utils/helpers";
import type {
  AnswerReq,
  SurveyQuestion,
} from "~/interfaces/api/audit/audit-report/detail-models";

// types
interface Props {
  data: SurveyQuestion;
  itemReq: AnswerReq[];
  isQuestion?: boolean;
}

interface EmitUpdateAnswer {
  payload: AnswerReq[];
  questionId: string;
}

// props
const props = withDefaults(defineProps<Props>(), {
  isQuestion: true,
});

// emits
const emit = defineEmits<{
  (e: "onChange", value: AnswerReq[], questionId: string): void;
  (e: "updateAnswers", data: EmitUpdateAnswer): void;
}>();

// states
const { t } = useI18n();

const yesNo = [
  {
    id: "true",
    name: "Да",
  },
  {
    id: "false",
    name: "Нет",
  },
];

const answers = computed(() => props.itemReq);

const isAnswerInput = computed(() => {
  if (props.data.field_type === QuestionType.SHELF_SHARE) return false;

  const inputVariant = props.data.variants.find((el) => el.has_answer_input);
  if (!inputVariant) return false;

  return answers.value.some((ans) => ans.variant_id === inputVariant.id);
});

const answerRequiredInputs = computed(() => {
  if (props.data.field_type === QuestionType.SHELF_SHARE) return answers.value;
  const variantIds = props.data.variants
    .filter((el) => el.has_answer_input)
    .map((el) => el.id);
  const result = answers.value.filter((el) =>
    variantIds.includes(el.variant_id as string),
  );

  return result;
});

const answerValue = computed(() => {
  return answers.value.length === 1 ? answers.value[0].answer : "";
});

// methods
const isDropdownSelect = (type: number) => {
  return [
    QuestionType.MULTIPLE_SELECT,
    QuestionType.SHELF_SHARE,
    QuestionType.SINGLE_SELECT,
    QuestionType.RADIO_SELECT,
    QuestionType.YES_NO,
  ].includes(type);
};

const isMultiSelect = (type: number) => {
  return [QuestionType.MULTIPLE_SELECT, QuestionType.SHELF_SHARE].includes(
    type,
  );
};

const getVariantState = () => {
  const isYesNo = props.data.field_type === QuestionType.YES_NO;
  return [
    {
      name: t("audit.variants"),
      key: "variants",
      required: props.data.is_required,
      isSingleSelect: !isMultiSelect(props.data.field_type as number),
      get data() {
        return { items: isYesNo ? yesNo : props.data.variants };
      },
      get getSelectedData() {
        if (QuestionType.YES_NO === props.data.field_type) {
          return answers.value[0]?.answer;
        }
        if (isMultiSelect(props.data.field_type)) {
          return answers.value.map((e) => e.variant_id);
        }
        return answers.value[0]?.variant_id;
      },
      set setSelectedData(value: string | string[]) {
        switch (true) {
          case Array.isArray(value):
            setMultiAnswers(value);
            break;

          case QuestionType.YES_NO === props.data.field_type:
            setSingleAnswer(value);
            break;

          default:
            setMultiAnswers([value]);
            break;
        }
      },
    },
  ];
};

const setSingleAnswer = (val: string | number) => {
  emit("updateAnswers", {
    payload: [
      {
        answer: \`\${val}\`,
        variant_id: null,
        question_id: props.data.id,
      },
    ],
    questionId: props.data.id,
  });
};

const setMultiAnswers = (itemIds: string[]) => {
  const answersReq: AnswerReq[] = [];
  for (const e of itemIds) {
    const found = answers.value.find((el) => el.variant_id === e);
    answersReq.push({
      answer: found?.answer ?? null,
      variant_id: e,
      question_id: props.data.id,
    });
  }
  emit("updateAnswers", {
    payload: answersReq,
    questionId: props.data.id,
  });
};

const setChildAnswer = debounce((item: AnswerReq, val: string | number) => {
  const answersReq = answers.value.map((el) => {
    if (el.variant_id === item.variant_id) {
      return {
        ...el,
        answer: val.toString(),
      };
    }
    return el;
  });
  emit("updateAnswers", {
    payload: answersReq,
    questionId: props.data.id,
  });
});

// hooks
watch(
  () => props.isQuestion,
  (val) => {
    if (!val) {
      answers.value.splice(0, answers.value.length - 1);
      emit("onChange", answers.value, props.data.id);
    }
  },
);
<\/script>

<style scoped lang="scss">
.title {
  @apply font-medium text-lg text-neutral-950;
}
</style>
`;export{n as default};
