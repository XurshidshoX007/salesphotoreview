const n=`<template>
  <div class="rounded-large border border-neutral-200 p-5">
    <flex-col class="gap-6 relative">
      <div class="flex justify-between">
        <div class="font-medium text-neutral-600">
          {{ \`\${t("audit.question")} #\${qIndex + 1}\` }}
        </div>
      </div>
      <AuditSettingsQuestionsCreateQuestionsCondition
        :data="data"
        :questions="questions"
        :q-index="qIndex"
        @update:data="(val) => emit('update:data', val)"
      >
        <template #icons>
          <rounded-icon-btn
            v-if="isMovableToTop(qIndex)"
            v-tooltip="{
              text: t('up'),
            }"
            icon-file-name="ArrowSmallUp"
            @click="onMoveToTop(qIndex)"
          />
          <rounded-icon-btn
            v-if="isMovableToDown(qIndex)"
            v-tooltip="{
              text: t('down'),
            }"
            icon-file-name="ArrowSmallDown"
            @click="onMoveToDown(qIndex)"
          />
          <rounded-icon-btn
            v-tooltip="{
              text: t('deleted'),
            }"
            type="danger"
            @click="deleteQuestionCard(qIndex)"
          />
        </template>
      </AuditSettingsQuestionsCreateQuestionsCondition>
      <div class="grid grid-cols-2 gap-x-3 items-center">
        <d-input
          :value="data.question"
          :label="t('column.name')"
          type="text"
          required
          @change="emitUpdate({ question: $event })"
        />
        <dropdowns-by-filter-states
          :filter-states="getFilterState()"
          @on-open-dropdown="onOpenDropdown"
        />
      </div>
      <div v-if="data.field_type && isOptionCardShowable(data.field_type)">
        <div class="font-medium text-xs mb-3">{{ t("audit.options") }}</div>
        <div class="items-center space-y-3">
          <div
            v-for="(option, optionIndex) in data.variants"
            :key="option.id"
            class="w-full grid grid-cols-2 gap-x-3 items-center"
          >
            <d-input
              :value="option.variant_text"
              :label="optionInputLabel(option, optionIndex)"
              type="text"
              required
              class="w-full"
              @change="updateVariantText($event, optionIndex)"
            />
            <div class="flex items-center gap-x-3">
              <checkbox
                v-if="isOurProduct(data.field_type)"
                :title="t('audit.our_product')"
                :id="'our_product' + optionIndex + qIndex"
                :checked="!!option.is_our_product"
                class="mt-3"
                @change="updateIsOurProduct($event, optionIndex)"
              />
              <rounded-icon-btn
                v-tooltip="{
                  text: t('deleted'),
                }"
                size="md"
                type="danger"
                icon-file-name="x-delete"
                @click="deleteOptionItem(qIndex, optionIndex)"
              />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div
              class="flex items-center fs-14 text-teal-600 text-sm cursor-pointer w-fit"
              @click="addOptionItem"
            >
              <icon-plus color="#299B9B" />
              {{ t("add_more") }}
            </div>
            <div
              v-if="isFieldForOther"
              class="flex items-center fs-14 text-teal-600 text-sm cursor-pointer w-fit"
              @click="addOptionItem('other')"
            >
              <icon-plus color="#299B9B" />
              {{ t("audit.addFieldsForOther") }}
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <Checkbox
          :id="qIndex + 'card_is_active'"
          :title="t('active')"
          :checked="data.is_active"
          @change="emitUpdate({ is_active: $event })"
        />
        <Checkbox
          :id="qIndex + 'card_is_required'"
          :title="t('audit.required')"
          :checked="data.is_required"
          @change="emitUpdate({ is_required: $event })"
        />
      </div>
    </flex-col>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { QuestionType } from "~/variable/static-constants";
import type {
  QuestionModel,
  VariantsModel,
} from "~/interfaces/api/audit/settings/question/question-model";
import type { FilterStateModel } from "~/interfaces/ui/filter-states-model";

// types
interface Props {
  data: QuestionModel;
  questions: QuestionModel[];
  qIndex: number;
}

// props
const props = withDefaults(defineProps<Props>(), {});

// emits
const emit = defineEmits<{
  (e: "update:data", value: QuestionModel): void;
  (e: "update:questions", value: QuestionModel[]): void;
  (e: "onMovable", value: boolean): void;
}>();

const auditQuestionStore = useAuditQuestionStore("main");

const { t } = useI18n();

const isFieldForOther = computed(() => {
  return props.data.variants.length &&
    !props.data.variants[props.data.variants.length - 1]?.has_answer_input
    ? true
    : false;
});

const optionInputLabel = (option: VariantsModel, oInd: number) => {
  return option.has_answer_input
    ? t("other")
    : \`\${t("audit.option")} \${oInd + 1}\`;
};

const getFilterState = (): FilterStateModel[] => {
  return [
    {
      name: t("column.type"),
      key: "types",
      required: true,
      isSingleSelect: true,
      get data() {
        return auditQuestionStore.dateTypes || [];
      },
      get getSelectedData() {
        return props.data.field_type || undefined;
      },
      set setSelectedData(value: number) {
        const shouldClearVariants = [
          QuestionType.NUMBER,
          QuestionType.TEXT,
          QuestionType.YES_NO,
        ].includes(value);

        const questionsCopy = [...props.questions];
        for (const { display_conditions } of questionsCopy) {
          const disp = display_conditions.find(
            ({ related_question_id }) => related_question_id === props.data.id
          );
          if (disp) {
            Object.assign(disp, {
              related_question_field_type: value,
              answer: "",
              is_equal: true,
              variant_id_arr: [],
            });
          }
        }
        emitUpdateQuestions(questionsCopy);

        if (shouldClearVariants) {
          emitUpdate({ field_type: value, variants: [] });
        } else {
          emitUpdate({ field_type: value });
        }
      },
    },
  ];
};

const isMovableToDown = (qInd: number) => {
  const isLast = qInd === props.questions.length - 1;
  if (isLast) return false;

  const nextQuestion = props.questions[qInd + 1];

  if (qInd === 0 && nextQuestion.display_conditions.length > 0) {
    return false;
  }

  return true;
};

const isMovableToTop = (qInd: number) => {
  const isFirst = qInd === 0;
  if (isFirst) return false;

  const currentQuestion = props.questions[qInd];

  if (qInd === 1 && currentQuestion.display_conditions.length > 0) {
    return false;
  }

  return true;
};

const onMoveToDown = (qIndex: number) => {
  const questionsCopy = [...props.questions];
  if (qIndex < questionsCopy.length - 1) {
    emit("onMovable", true);
    [questionsCopy[qIndex], questionsCopy[qIndex + 1]] = [
      questionsCopy[qIndex + 1],
      questionsCopy[qIndex],
    ];
    questionsCopy.forEach((q, i) => (q.sort = i + 1));
    emitUpdateQuestions(questionsCopy);
  }
};

const onMoveToTop = (qIndex: number) => {
  const questionsCopy = [...props.questions];
  if (qIndex > 0) {
    emit("onMovable", true);
    [questionsCopy[qIndex], questionsCopy[qIndex - 1]] = [
      questionsCopy[qIndex - 1],
      questionsCopy[qIndex],
    ];
    questionsCopy.forEach((q, i) => (q.sort = i + 1));
    emitUpdateQuestions(questionsCopy);
  }
};

const deleteQuestionCard = (index: number) => {
  const questionsCopy = [...props.questions];
  const questionId = questionsCopy[index].id;

  questionsCopy.splice(index, 1);

  for (const q of questionsCopy) {
    for (const disp of q.display_conditions) {
      if (disp.related_question_id === questionId) {
        Object.assign(disp, {
          related_question_id: "",
          answer: "",
          is_equal: true,
        });
      }
    }
  }

  emitUpdateQuestions(questionsCopy);
};

const onOpenDropdown = async (state: string) => {
  if (state === "types" && !auditQuestionStore.dateTypes.items) {
    await auditQuestionStore.getQuestionTypes();
    return;
  }
};

const isOptionCardShowable = (field_type?: number) => {
  if (!field_type) return false;
  return [
    QuestionType.RADIO_SELECT,
    QuestionType.MULTIPLE_SELECT,
    QuestionType.SINGLE_SELECT,
    QuestionType.SHELF_SHARE,
  ].includes(field_type);
};

const isOurProduct = (field_type: number) => {
  return field_type === QuestionType.SHELF_SHARE;
};

const deleteOptionItem = (index: number, optionIndex: number) => {
  const questionsCopy = [...props.questions];
  const removedVariantId = questionsCopy[index].variants?.[optionIndex].id;

  questionsCopy[index].variants?.splice(optionIndex, 1);

  for (const { display_conditions } of questionsCopy) {
    for (const disp of display_conditions) {
      if (disp.variant_id_arr.length) {
        disp.variant_id_arr = disp.variant_id_arr.filter(
          (v) => v !== removedVariantId
        );
      }
    }
  }

  emitUpdateQuestions(questionsCopy);
};

const addOptionItem = (type?: string) => {
  const updatedVariants = [...(props.data.variants ?? [])];
  const lastVariant = updatedVariants.at(-1);
  const variant = {
    is_active: true,
    variant_text: null,
    is_our_product: false,
    sort: null,
    id: uuidv4(),
    has_answer_input: type === "other",
  };

  const insertIndex =
    !variant.has_answer_input && lastVariant?.has_answer_input
      ? updatedVariants.length - 1
      : updatedVariants.length;

  updatedVariants.splice(insertIndex, 0, variant);

  emitUpdate({ variants: updatedVariants });
};

const updateVariantText = (text: string, index: number) => {
  const updatedVariants = [...props.data.variants];
  updatedVariants[index].variant_text = text;
  emitUpdate({ variants: updatedVariants });
};

const updateIsOurProduct = (val: boolean, index: number) => {
  const updatedVariants = [...props.data.variants];
  updatedVariants[index].is_our_product = val;
  emitUpdate({ variants: updatedVariants });
};

const emitUpdate = (patch: Partial<QuestionModel>) => {
  emit("update:data", { ...props.data, ...patch });
};

const emitUpdateQuestions = (patch: QuestionModel[]) => {
  emit("update:questions", patch);
};
<\/script>
`;export{n as default};
