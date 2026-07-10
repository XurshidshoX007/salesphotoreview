const n=`<template>
  <transition :css="isTransition" name="toggle-accordion" mode="out-in">
    <flex-col
      v-if="isCondition"
      class="pb-3 mb-3 gap-y-3 border-b"
      :class="isCondition ? 'pt-1.5' : ''"
    >
      <div
        v-for="(item, ind) in data.display_conditions"
        :key="ind"
        class="xl:flex items-center gap-3 grid grid-cols-12"
        :class="isBottomBorder(ind)"
      >
        <div class="xl:max-w-55 col-span-6 w-full">
          <dropdowns-by-filter-states :filter-states="getQuestionState(ind)" />
        </div>
        <div
          class="xl:max-w-50 w-full"
          :class="
            item.related_question_field_type ? 'col-span-6' : 'col-span-5'
          "
        >
          <radio-btn
            :name="\`\${data.question}-\${ind}\`"
            :items="statuses"
            :selected-item="selectedRadioItem(item)"
            @on-select-item-id="onSelectRadio(ind, $event === 1)"
          />
        </div>
        <div
          v-if="item.related_question_field_type"
          class="xl:max-w-55 col-span-6 w-full"
        >
          <dropdowns-by-filter-states
            v-if="isDropdownSelect(item.related_question_field_type)"
            :filter-states="getVariantState(item, ind)"
          />
          <d-input
            v-if="item.related_question_field_type === QuestionType.NUMBER"
            :value="item.answer"
            :label="t('audit.answerToTheQuestion')"
            type="number"
            required
            @change="updateAnswer(ind, $event)"
          />
          <d-input
            v-if="item.related_question_field_type === QuestionType.TEXT"
            :value="item.answer"
            :label="t('audit.answerToTheQuestion')"
            type="text"
            required
            @change="updateAnswer(ind, $event)"
          />
        </div>
        <div
          :class="
            item.related_question_field_type ? 'col-span-6' : 'col-span-1'
          "
        >
          <div class="flex items-center justify-end">
            <rounded-icon-btn
              v-tooltip="{
                text: t('deleted'),
              }"
              type="danger"
              size="md"
              icon-file-name="x-delete"
              @click="deleteCondition(ind)"
            />
          </div>
        </div>
      </div>
      <div
        v-if="isAvailableToAddExtraCondition"
        class="flex items-center text-teal-600 cursor-pointer text-sm"
        @click="addNewCondition"
      >
        <icon-plus color="#299B9B" />
        {{ t("add_more") }}
      </div>
    </flex-col>
  </transition>
  <div class="absolute top-0 right-0 flex items-center gap-x-3">
    <m-btn
      v-if="isShuffleIcon"
      class="!p-1 !gap-1"
      :group="!isCondition ? 'outlined' : ''"
      @click="toggleShuffle"
    >
      <icon-shuffle :color="isCondition ? '#FFFFFF' : '#525866'" />
      <span class="px-1">
        {{ t("connect") }}
      </span>
    </m-btn>
    <slot name="icons"></slot>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import type {
  QuestionModel,
  DisplayCondition,
} from "~/interfaces/api/audit/settings/question/question-model";
import { QuestionType } from "~/variable/static-constants";

// types
interface Props {
  data: QuestionModel;
  questions: QuestionModel[];
  qIndex: number;
}

enum STATUSES {
  EQUAL = 1,
  NOT_EQUAL = 2,
}

// props
const props = withDefaults(defineProps<Props>(), {});

// emits
const emit = defineEmits<{
  (e: "update:data", value: QuestionModel): void;
}>();

// states
const { t } = useI18n();

const isTransition = ref(false);
const isCondition = ref(false);
const availableQuestions = ref<QuestionModel[]>([]);

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

const statuses = ref([
  {
    id: STATUSES.EQUAL,
    name: "Равно",
  },
  {
    id: STATUSES.NOT_EQUAL,
    name: "Не равно",
  },
]);

const isAvailableToAddExtraCondition = computed(() => {
  return (
    props.data.display_conditions.length < props.questions.length - 1 &&
    availableQuestions.value.length - 1 > 0
  );
});

const isShuffleIcon = computed(() => {
  const hasAvailableQuestions =
    props.qIndex > 0 &&
    props.questions.length > 1 &&
    props.questions.some((e) => e.id !== props.data.id && e.question) &&
    availableQuestions.value.length > 0;

  if (hasAvailableQuestions) {
    return true;
  }
});

const onSelectRadio = (condInd: number, isEqual: boolean) => {
  const updated = [...props.data.display_conditions];
  updated[condInd] = { ...updated[condInd], is_equal: isEqual };

  emitUpdate({ display_conditions: updated });
};

const updateAnswer = (ind: number, val: string | number) => {
  const updated = [...props.data.display_conditions];
  updated[ind] = { ...updated[ind], answer: \`\${val}\` };

  emitUpdate({ display_conditions: updated });
};

const emitUpdate = (patch: Partial<QuestionModel>) => {
  emit("update:data", { ...props.data, ...patch });
};

const isBottomBorder = (ind: number) => {
  return ind < props.data.display_conditions.length - 1
    ? "border-b lg:border-none"
    : "";
};

const getVariants = (ind: number) => {
  return (
    props.questions.find(
      (el) => el.id === props.data.display_conditions[ind].related_question_id
    )?.variants || []
  ).map((e) => {
    return { name: e.variant_text, id: e.id };
  });
};

const getFilteredQuestions = (questionId: string, conditionInd: number) => {
  const connectedQuestionIndexes = props.questions.flatMap((el, index) =>
    el.display_conditions.some(
      (item) => item.related_question_id === questionId
    )
      ? [index]
      : []
  );
  return props.questions.filter(
    (e, index) =>
      e.id !== questionId &&
      e.question &&
      !props.data.display_conditions
        .filter((_, index) => index !== conditionInd)
        .map((e) => e.related_question_id)
        .includes(e.id || "") &&
      !connectedQuestionIndexes.includes(index)
  );
};

const getQuestionState = (conditionInd: number) => {
  const updated = [...props.data.display_conditions];
  const condition = { ...updated[conditionInd] };

  return [
    {
      name: t("audit.questions"),
      key: "questions",
      required: true,
      isSingleSelect: true,

      get data() {
        return {
          items: getFilteredQuestions(props.data.id || "", conditionInd).map(
            (el) => ({
              ...el,
              name: el.question,
            })
          ),
        };
      },

      get getSelectedData() {
        return condition.related_question_id;
      },

      set setSelectedData(value: string) {
        condition.related_question_id = value;
        condition.question_id = props.data.id || "";
        condition.related_question_field_type =
          props.questions.find((q) => q.id === value)?.field_type || undefined;

        updated[conditionInd] = condition;
        emitUpdate({ display_conditions: updated });
      },
    },
  ];
};

const getVariantState = (element: DisplayCondition, ind: number) => {
  const updated = [...props.data.display_conditions];
  const condition = { ...updated[ind] };
  const fieldType = element.related_question_field_type;

  const isMultiSelect =
    fieldType === QuestionType.MULTIPLE_SELECT ||
    fieldType === QuestionType.SHELF_SHARE;

  const isYesNo = fieldType === QuestionType.YES_NO;

  return [
    {
      name: t("audit.variants"),
      key: "variants",
      required: true,
      isSingleSelect: !isMultiSelect,
      get data() {
        return { items: isYesNo ? yesNo : getVariants(ind) };
      },
      get getSelectedData() {
        if (isYesNo) return condition.answer;
        return isMultiSelect
          ? condition.variant_id_arr
          : condition.variant_id_arr[0];
      },
      get disabled() {
        return !condition.related_question_id;
      },
      set setSelectedData(value: string | string[]) {
        if (isYesNo) {
          condition.answer = value as string;
        } else {
          if (Array.isArray(value)) condition.variant_id_arr = value;
          else condition.variant_id_arr = [value];
        }

        updated[ind] = condition;
        emitUpdate({ display_conditions: updated });
      },
    },
  ];
};

const deleteCondition = (ind: number) => {
  const updatedConditions = [...props.data.display_conditions];

  if (updatedConditions.length > 1) {
    updatedConditions.splice(ind, 1);
    emitUpdate({ display_conditions: updatedConditions });
    return;
  }
  emitUpdate({ display_conditions: [] });
  isCondition.value = false;
  return;
};

const isDropdownSelect = (type: number) => {
  return [
    QuestionType.MULTIPLE_SELECT,
    QuestionType.SHELF_SHARE,
    QuestionType.SINGLE_SELECT,
    QuestionType.RADIO_SELECT,
    QuestionType.YES_NO,
  ].includes(type);
};

const selectedRadioItem = (item: DisplayCondition) => {
  return item.is_equal ? STATUSES.EQUAL : STATUSES.NOT_EQUAL;
};

const addNewCondition = () => {
  const updatedConditions = [...props.data.display_conditions];
  updatedConditions.push({
    question_id: "",
    related_question_id: "",
    is_equal: true,
    answer: "",
    variant_id_arr: [],
    related_question_field_type: undefined,
  });
  emitUpdate({ display_conditions: updatedConditions });
};

const toggleShuffle = () => {
  const displayConditions = props.data.display_conditions || [];

  let newConditions = displayConditions;

  if (isCondition.value && displayConditions.length > 0) {
    newConditions = displayConditions.filter(
      (cond) => cond.related_question_id
    );
  }

  if (!displayConditions.length) {
    newConditions = [
      {
        question_id: "",
        related_question_id: "",
        is_equal: true,
        answer: "",
        variant_id_arr: [],
        related_question_field_type: undefined,
      },
    ];
  }
  isCondition.value = !isCondition.value;
  emitUpdate({
    display_conditions: newConditions,
  });
  isTransition.value = !isTransition.value;
};

const setVariantIdArr = () => {
  emitUpdate({ display_conditions: props.data.display_conditions });
};

onMounted(() => {
  if (props.data.display_conditions.length > 0) isCondition.value = true;
  setVariantIdArr();
});

watchEffect(() => {
  if (!isCondition.value) {
    availableQuestions.value = getFilteredQuestions(props.data?.id || "", 0);
  } else
    props.data.display_conditions.forEach((_, i) => {
      availableQuestions.value = getFilteredQuestions(props.data.id || "", i);
    });
});
<\/script>
`;export{n as default};
