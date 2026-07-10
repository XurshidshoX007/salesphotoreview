const n=`<template>
  <div>
    <flex-col class="gap-4">
      <div class="formula-text">
        {{ t("plan.settings_up_formula_selected_agent_kpi_group") }}
      </div>
      <div class="create-formula-container">
        <div class="left-content">
          <div class="content-header">
            <search-input
              has-placeholder
              :value="searchValue"
              @change="changeSearch"
            />
          </div>
          <div class="body-container">
            <div class="content-body">
              <div
                v-for="item in searchData"
                class="parameter-tag"
                @click="calculatorTagWrite(item.key)"
              >
                {{ item.name }}
              </div>
              <div v-if="searchData?.length === 0">
                <no-data size="medium" />
              </div>
            </div>
          </div>
        </div>
        <div class="right-content">
          <div class="calculator-container">
            <users-bonus-and-salary-settings-formula-block
              v-if="calculationObject.length"
              :calc="calculationObject[0]"
              :rest="calculationObject.slice(1)"
              :level="0"
              :style="\`width: \${cardWidth}px;\`"
              :parameter-type="props.parameterType"
              @change-formula-card-active="changeFormulaCardActive"
              @changeFormulaCardCaretIndex="changeFormulaCardCaretIndex"
            />
          </div>
          <div class="footer-keyboard">
            <div class="keyboard-header">
              <div
                v-for="key in headerKeyboards"
                :key="key"
                class="keyboard-header-item"
                @click="keyboardClick(key.id)"
              >
                {{ key.value }}
              </div>
            </div>
            <div class="keyboard-main">
              <div class="section">
                <div
                  v-for="key in numberKeyboards"
                  class="keyboard-header-item bg-[#EAEDF1]"
                  :class="
                    key.id === 10
                      ? 'keyboard-header-item-long'
                      : 'keyboard-header-item'
                  "
                  @click="keyboardClick(key.id)"
                >
                  {{ key.value }}
                </div>
              </div>
              <div class="section">
                <div
                  v-for="key in actionKeyboards"
                  :class="
                    key.id === 'equality'
                      ? 'keyboard-header-item-long'
                      : 'keyboard-header-item'
                  "
                  @click="keyboardClick(key.id)"
                >
                  {{ key.value }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </flex-col>
    <transition name="modal">
      <div v-if="isDeleteIfMethod">
        <UsersBonusAndSalarySettingsConfirmDialog
          @closeDialog="confirmCloseDialog"
          @confirm="removeIfMethodCondition"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";
import type {
  Branch,
  CalcItem,
  Condition,
  Formula,
  FormulaDetail,
} from "~/interfaces/api/global/formula-calculator-model";

// emits
const emit = defineEmits<{ (e: "closeDialog"): void }>();

// props

const props = defineProps<{
  parameterType: ConstantModel[];
  formulaData: Formula;
  errorCode: string[];
}>();

// states
const { t } = useI18n();

const searchValue = ref<string | null>(null);

const isDeleteIfMethod = ref<boolean>(false);

const CalculationType = {
  IfMethod: "IfMethod",
  ElseMethod: "ElseMethod",
  SimpleHeadMethod: "SimpleHeadMethod",
  ElseIfMethod: "ElseIfMethod",
};

const FormulaExpressionType = {
  Condition: 1,
  Value: 2,
};

const CalculationMethodType = {
  LeftParenthesis: "(",
  RightParenthesis: ")",
  Plus: "+",
  Minus: "-",
  LessThan: "<",
  GreaterThan: ">",
  Percent: "%",
  Not: "!",
  Multiplication: "*",
  Divisional: "/",
  Equality: "=",
  Backspace: "<-",
  AllClose: "AC",
  IfMethodView: "ЕСЛИ",
  IfMethodWrite: "ЕСЛИ (",
};

const headerKeyboards = ref([
  {
    id: "backspace",
    value: CalculationMethodType.Backspace,
  },
  {
    id: "all-close",
    value: CalculationMethodType.AllClose,
  },
  {
    id: "if-method",
    value: CalculationMethodType.IfMethodView,
  },
]);

const numberKeyboards = ref([
  { id: 1, value: "7" },
  { id: 2, value: "8" },
  { id: 3, value: "9" },
  { id: 4, value: "4" },
  { id: 5, value: "5" },
  { id: 6, value: "6" },
  { id: 7, value: "1" },
  { id: 8, value: "2" },
  { id: 9, value: "3" },
  { id: 10, value: "0" },
  { id: 11, value: "." },
]);

const actionKeyboards = ref([
  {
    id: "left-parenthesis",
    value: CalculationMethodType.LeftParenthesis,
  },
  {
    id: "right-parenthesis",
    value: CalculationMethodType.RightParenthesis,
  },
  {
    id: "plus",
    value: CalculationMethodType.Plus,
  },
  {
    id: "minus",
    value: CalculationMethodType.Minus,
  },
  {
    id: "less-than",
    value: CalculationMethodType.LessThan,
  },
  {
    id: "greater-than",
    value: CalculationMethodType.GreaterThan,
  },
  {
    id: "percent",
    value: CalculationMethodType.Percent,
  },
  {
    id: "not",
    value: CalculationMethodType.Not,
  },
  {
    id: "multiplication",
    value: CalculationMethodType.Multiplication,
  },
  {
    id: "divisional",
    value: CalculationMethodType.Divisional,
  },
  {
    id: "equality",
    value: CalculationMethodType.Equality,
  },
]);

const calculationObject = ref<CalcItem[]>([
  {
    id: uuidv4(),
    group_id: null,
    then: {
      id: uuidv4(),
      is_active: true,
      is_invalid: false,
      type: CalculationType.SimpleHeadMethod,
      caretIndex: 0,
      condition: [],
    },
    else: {
      id: null,
      is_active: false,
      is_invalid: false,
      type: CalculationType.SimpleHeadMethod,
      caretIndex: null,
      condition: [],
    },
  },
]);

// methods

const changeFormulaCardActive = (id: string) => {
  calculationObject.value = calculationObject.value.map((item) => ({
    ...item,
    then: {
      ...item.then,
      is_active: item.then.id === id,
      caretIndex: item.then.id === id ? item.then.condition.length : null,
    },
    else: {
      ...item.else,
      is_active: item.else.id === id,
      caretIndex: item.else.id === id ? item.else.condition.length : null,
    },
  }));
};

const changeFormulaCardCaretIndex = (index: number, id: string) => {
  calculationObject.value = calculationObject.value.map((item) => {
    const isThen = item.then.id === id;
    const isElse = item.else.id === id;

    return {
      ...item,
      then: {
        ...item.then,
        is_active: isThen,
        caretIndex: isThen ? index : null,
      },
      else: {
        ...item.else,
        is_active: isElse,
        caretIndex: isElse ? index : null,
      },
    };
  });
};

const keyboardClick = (id: string | number) => {
  // 1. All-close
  if (id === "all-close") {
    calculationObject.value = [
      {
        id: uuidv4(),
        group_id: null,
        then: {
          id: uuidv4(),
          is_active: false,
          is_invalid: false,
          type: CalculationType.SimpleHeadMethod,
          caretIndex: null,
          condition: [],
        },
        else: {
          id: null,
          is_active: false,
          is_invalid: false,
          type: CalculationType.SimpleHeadMethod,
          caretIndex: null,
          condition: [],
        },
      },
    ];
    return;
  }

  // 2. Backspace
  if (id === "backspace") {
    removeLastCondition();
    return;
  }

  if (id === "delete") {
    removeNextCondition();
  }

  // 3. Action keyboard
  const actionKey = actionKeyboards.value.find((item) => item.id === id);
  if (actionKey) {
    calculatorActionWrite(actionKey.id);
    return;
  }

  // 4. Number keyboard
  const numberKey = numberKeyboards.value.find((item) => item.id === id);
  if (numberKey) {
    calculatorNumberWrite(numberKey.id);
    return;
  }

  // 5. Default: operator
  calculatorOperatorWrite(id);
};

const calculatorTagWrite = (key: string) => {
  const currentTag = props.parameterType.find((item) => item.key === key);
  if (!currentTag) return;

  const activeFormulaCard = calculationObject.value.find(
    (item) => item.then.is_active || item.else?.is_active
  );
  if (!activeFormulaCard) return;

  const target = activeFormulaCard.then.is_active
    ? activeFormulaCard.then
    : activeFormulaCard.else;
  if (!target) return;

  const newCondition = { type: "tag", value: currentTag.key };

  if (typeof target.caretIndex === "number" && target.caretIndex >= 0) {
    const index = Math.min(target.caretIndex, target.condition.length);
    target.condition.splice(index, 0, newCondition);
    target.caretIndex = index + 1;
    target.is_invalid = false;
  } else {
    target.condition.push(newCondition);
    target.caretIndex = target.condition.length;
  }
};

const calculatorNumberWrite = (id: number) => {
  const key = numberKeyboards.value.find((item) => item.id === id)?.value;
  if (key == null) return;

  const activeFormulaCard = calculationObject.value.find(
    (item) => item.then.is_active || item.else?.is_active
  );
  if (!activeFormulaCard) return;

  const target = activeFormulaCard.then.is_active
    ? activeFormulaCard.then
    : activeFormulaCard.else;
  if (!target) return;

  const index =
    typeof target.caretIndex === "number" && target.caretIndex >= 0
      ? target.caretIndex
      : target.condition.length;

  const last = target.condition[index - 1];

  if (last?.type === "number") {
    let strVal = String(last.value);
    const [integerPart] = strVal.split(".");

    if (key !== "." && integerPart.length >= 12 && !strVal.includes(".")) {
      return;
    }

    if (key === ".") {
      if (!strVal.includes(".")) {
        last.value = strVal + ".";
      }
    } else {
      if (strVal.includes(".")) {
        last.value = strVal + key;
      } else {
        last.value = String(Number(strVal) * 10 + Number(key));
      }
    }
    target.caretIndex = index;
  } else {
    const newCondition = {
      type: "number",
      value: key === "." ? "0." : String(key),
    };
    target.condition.splice(index, 0, newCondition);
    target.caretIndex = index + 1;
    target.is_invalid = false;
  }
};

const calculatorActionWrite = (id: string | number) => {
  const key = actionKeyboards.value.find((item) => item.id === id).value;
  const activeFormulaCard = calculationObject.value.find(
    (item) => item.then.is_active || item.else?.is_active
  );
  if (!activeFormulaCard) return;

  const target = activeFormulaCard.then.is_active
    ? activeFormulaCard.then
    : activeFormulaCard.else;
  if (!target) return;

  const newCondition = { type: "action", value: key };

  if (typeof target.caretIndex === "number") {
    const index = target.caretIndex;
    if (index >= 0 && index <= target.condition.length) {
      target.condition.splice(index, 0, newCondition);
      target.caretIndex = index + 1;
      target.is_invalid = false;
      return;
    }
  }

  target.condition.push(newCondition);
  target.caretIndex = target.condition.length;
};

const calculatorOperatorWrite = (id: string | number) => {
  const activeFormulaCard = calculationObject.value.find(
    (item) => item.then.is_active || item.else.is_active
  );

  if (!activeFormulaCard) return;
  if (activeFormulaCard.then.is_active) {
    if (
      activeFormulaCard.then.condition?.find(
        (item) => item.type === "operation"
      )
    )
      return;
    activeFormulaCard.then.condition.unshift({
      type: "operation",
      value: CalculationMethodType.IfMethodWrite,
    });
    activeFormulaCard.then.caretIndex = activeFormulaCard.then.caretIndex + 1;
  } else {
    if (
      activeFormulaCard.else.condition?.find(
        (item) => item.type === "operation"
      )
    )
      return;
    activeFormulaCard.else.condition.unshift({
      type: "operation",
      value: CalculationMethodType.IfMethodWrite,
    });
    activeFormulaCard.else.caretIndex = activeFormulaCard.else.caretIndex + 1;
  }

  if (id === "if-method") {
    calculationObject.value.push({
      group_id: activeFormulaCard.then.is_active
        ? activeFormulaCard.then.id
        : activeFormulaCard.else.id,
      then: {
        id: uuidv4(),
        is_active: false,
        is_invalid: false,
        type: CalculationType.IfMethod,
        caretIndex: null,
        condition: [],
      },
      else: {
        id: uuidv4(),
        is_active: false,
        is_invalid: false,
        type: activeFormulaCard.then.is_active
          ? CalculationType.ElseMethod
          : CalculationType.ElseIfMethod,
        caretIndex: null,
        condition: [],
      },
    });
    return;
  }
};

const removeLastCondition = () => {
  const activeFormulaCard = calculationObject.value.find(
    (item) => item.then.is_active || item.else?.is_active
  );
  if (!activeFormulaCard) return;

  const target = activeFormulaCard.then.is_active
    ? activeFormulaCard.then
    : activeFormulaCard.else;

  if (!target || target.condition.length === 0) return;

  const conditions = target.condition?.map((item) => item.value);

  if (
    conditions?.includes(CalculationMethodType.IfMethodWrite) &&
    target.caretIndex === 1
  ) {
    isDeleteIfMethod.value = true;
    return;
  }

  if (typeof target.caretIndex === "number") {
    const index = target.caretIndex - 1;
    if (index >= 0 && index < target.condition.length) {
      const cond = target.condition[index];
      if (cond.type === "number") {
        let strVal = String(cond.value);

        strVal = strVal.slice(0, -1);

        if (
          strVal === "" ||
          strVal === "-" ||
          strVal === "0" ||
          strVal === "0."
        ) {
          target.condition.splice(index, 1);
          target.caretIndex = Math.max(index, 0);
          target.is_invalid = false;
        } else {
          cond.value = strVal.includes(".") ? strVal : Number(strVal);
        }
      } else {
        target.condition.splice(index, 1);
        target.caretIndex = Math.max(index, 0);
        target.is_invalid = false;
      }
    }
  } else {
    target.condition.pop();
  }
};

const removeIfMethodCondition = () => {
  const activeFormulaCard = calculationObject.value.find(
    (item) => item.then.is_active || item.else?.is_active
  );
  if (!activeFormulaCard) return;

  const target = activeFormulaCard.then.is_active
    ? activeFormulaCard.then
    : activeFormulaCard.else;

  if (!target || target.condition.length === 0) return;

  calculationObject.value = calculationObject.value.filter(
    (obj) => obj.group_id !== target.id
  );

  if (typeof target.caretIndex === "number") {
    const index = target.caretIndex - 1;
    if (index >= 0 && index < target.condition.length) {
      target.condition.splice(index, 1);
      target.caretIndex = Math.max(index, 0);
      target.is_invalid = false;
    }
    return;
  }
  target.condition.pop();
  target.caretIndex = null;
};

const removeNextCondition = () => {
  const activeFormulaCard = calculationObject.value.find(
    (item) => item.then.is_active || item.else?.is_active
  );
  if (!activeFormulaCard) return;

  const target = activeFormulaCard.then.is_active
    ? activeFormulaCard.then
    : activeFormulaCard.else;

  if (!target || target.condition.length === 0) return;

  const conditions = target.condition?.map((item) => item.value);

  if (
    conditions?.includes(CalculationMethodType.IfMethodWrite) &&
    target.caretIndex === 0
  ) {
    calculationObject.value = calculationObject.value.filter(
      (obj) => obj.group_id !== target.id
    );

    if (typeof target.caretIndex === "number") {
      const index = target.caretIndex;
      if (index >= 0 && index < target.condition.length) {
        target.condition.splice(index, 1);
      }
      return;
    }
    target.condition.shift();
    target.caretIndex = null;
    target.is_invalid = false;
    return;
  }

  if (typeof target.caretIndex === "number") {
    const index = target.caretIndex;
    if (index >= 0 && index < target.condition.length) {
      const cond = target.condition[index];
      if (cond.type === "number") {
        let strVal = String(cond.value);

        strVal = strVal.slice(1);

        if (
          strVal === "" ||
          strVal === "-" ||
          strVal === "0" ||
          strVal === "0."
        ) {
          target.condition.splice(index, 1);
        } else {
          cond.value = strVal.includes(".") ? strVal : Number(strVal);
        }
      } else {
        target.condition.splice(index, 1);
      }
    }
  } else {
    target.condition.shift();
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  const key = e.key;

  if (
    numberKeyboards.value.find((item) => item.value === key) ||
    actionKeyboards.value.find((item) => item.value === key) ||
    headerKeyboards.value.find((item) => item.value === key)
  ) {
    const allKeyboards = [
      ...numberKeyboards.value,
      ...actionKeyboards.value,
      ...headerKeyboards.value,
    ];

    keyboardClick(allKeyboards.find((item) => item.value === key).id);
  }

  if (key === "Backspace") {
    keyboardClick("backspace");
  }

  if (key === "Delete") {
    keyboardClick("delete");
  }

  if (key === "Enter") {
    keyboardClick("equality");
  }

  if (
    key === "ArrowRight" ||
    key === "ArrowUp" ||
    key === "ArrowDown" ||
    key === "Home" ||
    key === "End" ||
    key === "ArrowLeft"
  ) {
    caretIndexAction(key);
  }
};

// builds list to make cursor move up/down correctly

const buildTraversalList = (
  items: CalcItem[],
  parentId: string | null = null
) => {
  const result = [];

  for (const item of items) {
    if (item.group_id === parentId) {
      if (item.then?.id) {
        result.push({ parentId: item.id, block: "then", data: item.then });
        result.push(...buildTraversalList(items, item.then.id));
      }

      if (item.else?.id) {
        result.push({ parentId: item.id, block: "else", data: item.else });
        result.push(...buildTraversalList(items, item.else.id));
      }
    }
  }

  return result;
};

const caretIndexAction = (key: string) => {
  const flatList = buildTraversalList(calculationObject.value, null);

  const activeIndex = flatList.findIndex((b) => b.data.is_active);
  if (activeIndex === -1) return;

  const activeBlock = flatList[activeIndex];
  const { caretIndex, condition } = activeBlock.data;

  if (key === "ArrowRight") {
    activeBlock.data.caretIndex = Math.min(caretIndex + 1, condition.length);
  } else if (key === "ArrowLeft") {
    const operation = condition.find((item) => item.type === "operation");
    activeBlock.data.caretIndex = Math.max(caretIndex - 1, operation ? 1 : 0);
  } else if (key === "ArrowUp" || key === "ArrowDown") {
    const nextIndex =
      key === "ArrowUp"
        ? Math.max(activeIndex - 1, 0)
        : Math.min(activeIndex + 1, flatList.length - 1);

    if (nextIndex !== activeIndex) {
      calculationObject.value = calculationObject.value.map((item) => {
        const thenActive =
          flatList[nextIndex].block === "then" &&
          item.then.id === flatList[nextIndex].data.id;
        const elseActive =
          flatList[nextIndex].block === "else" &&
          item.else.id === flatList[nextIndex].data.id;

        return {
          ...item,
          then: {
            ...item.then,
            is_active: thenActive,
            caretIndex: thenActive
              ? item.then.condition.length
              : item.then.caretIndex,
          },
          else: {
            ...item.else,
            is_active: elseActive,
            caretIndex: elseActive
              ? item.else.condition.length
              : item.else.caretIndex,
          },
        };
      });
    }
  } else if (key === "Home") {
    const operation = condition.find((item) => item.type === "operation");
    activeBlock.data.caretIndex = operation ? 1 : 0;
  } else if (key === "End") {
    activeBlock.data.caretIndex = condition.length;
  }
};

const changeSearch = (value: string | null) => {
  searchValue.value = value;
};

const transformToTree = (data: CalcItem[]) => {
  type FormulaDetailWithId = FormulaDetail & { id: string };

  const root = data.find((item) => item.group_id === null);
  if (!root) return null;

  const getBranchType = (id: string) => {
    const children = calculationObject.value.find(
      (item) => item.group_id === id
    );
    return children
      ? FormulaExpressionType.Condition
      : FormulaExpressionType.Value;
  };

  const getCondition = (condition: Condition[]) => {
    return condition.reduce((acc, item) => {
      if (item.type === "operation") return acc;

      const newItem = {
        ...item,
        value: item.type === "number" ? item.value.toString() : item.value,
      };

      acc.push(newItem);
      return acc;
    }, [] as Condition[]);
  };

  const buildBranch = (branch: Branch): FormulaDetailWithId | null => {
    if (!branch.id) return null;
    const node: FormulaDetailWithId = {
      id: branch.id,
      expressions: getCondition(branch.condition),
      type: getBranchType(branch.id as string),
      children: [],
    };

    const childItem = data.find((item) => item.group_id === branch.id);
    if (childItem) {
      const thenChild = buildBranch(childItem.then);
      const elseChild = buildBranch(childItem.else);

      if (thenChild) node.children.push(thenChild);
      if (elseChild) node.children.push(elseChild);
    }

    return node;
  };

  const children: FormulaDetailWithId[] = [];
  if (root.then.id) {
    const childItem = data.find((item) => item.group_id === root.then.id);
    if (childItem) {
      const thenChild = buildBranch(childItem.then);
      const elseChild = buildBranch(childItem.else);

      if (thenChild) children.push(thenChild);
      if (elseChild) children.push(elseChild);
    }
  }

  return {
    id: root.then.id,
    expressions: getCondition(root.then.condition),
    type: getBranchType(root.then.id),
    children,
  };
};

const resultCalculatorForSave = () => {
  return transformToTree(calculationObject.value);
};

const transformToArray = (root: FormulaDetail) => {
  const result = [];

  const normalizeCondition = (condition: Condition[], type: number) => {
    if (!Array.isArray(condition)) return [];

    return condition.map((exp) => ({
      ...exp,
      value: exp.type === "number" ? Number(exp.value) : exp.value,
    }));
  };

  const getFormattedCondition = (condition: Condition[], type: number) => {
    const normalized = normalizeCondition(condition, type);
    return type === FormulaExpressionType.Condition
      ? [
          { type: "operation", value: CalculationMethodType.IfMethodWrite },
          ...normalized,
        ]
      : normalized;
  };

  const createNodeStructure = (
    id: string,
    groupId: string | null,
    condition: Condition[],
    nodeType: number
  ) => {
    const isRoot = groupId === null;
    const thenType = isRoot
      ? CalculationType.SimpleHeadMethod
      : CalculationType.IfMethod;
    const elseType =
      nodeType === FormulaExpressionType.Condition
        ? CalculationType.ElseIfMethod
        : CalculationType.ElseMethod;

    return {
      id,
      group_id: groupId,
      then: {
        id: uuidv4(),
        is_active: false,
        type: thenType,
        caretIndex: null,
        condition: getFormattedCondition(condition, nodeType),
      },
      else: {
        id: nodeType === FormulaExpressionType.Condition ? uuidv4() : null,
        is_active: false,
        type: elseType,
        caretIndex: null,
        condition: [],
      },
    };
  };

  const buildNode = (node: FormulaDetail, parentId: string | null = null) => {
    if (!node) return;

    const nodeId = uuidv4();
    const currentNode = createNodeStructure(
      nodeId,
      parentId,
      node.expressions,
      node.type
    );

    result.push(currentNode);

    if (node.children?.length) {
      const [thenChild, elseChild] = node.children;

      // Process THEN branch
      if (thenChild) {
        currentNode.then.condition = getFormattedCondition(
          thenChild.expressions,
          thenChild.type
        );
        if (thenChild.children?.length) {
          buildNode(thenChild, currentNode.then.id);
        }
      }

      if (elseChild) {
        currentNode.else.condition = getFormattedCondition(
          elseChild.expressions,
          elseChild.type
        );
        if (elseChild.children?.length) {
          buildNode(elseChild, currentNode.else.id);
        }
      }
    }
  };

  if (root.children?.length) {
    buildNode(root, null);
  }

  const rootNode = createNodeStructure(
    uuidv4(),
    null,
    root.expressions,
    root.type
  );
  result.unshift(rootNode);

  if (result.length > 1) {
    result[1].group_id = rootNode.then.id;
    result[1].then.type = CalculationType.IfMethod;
  }

  result[0].else.id = null;
  result[0].then.caretIndex = result[0].then.condition.length;
  result[0].then.is_active = true;

  return result;
};

const confirmCloseDialog = () => {
  isDeleteIfMethod.value = false;
};

const setInvalidCards = (errorData: string[]) => {
  const errorSet = new Set(errorData);
  calculationObject.value.forEach((item) => {
    if (errorSet.has(item.then.id)) item.then.is_invalid = true;
    if (errorSet.has(item.else.id)) item.else.is_invalid = true;
  });
};

// hooks

const searchData = computed(() => {
  const query = searchValue.value?.trim().toLowerCase();
  return query
    ? props.parameterType.filter((item) =>
        item.name.toLowerCase().includes(query)
      )
    : props.parameterType;
});

const cardWidth = computed(() => {
  return calculationObject.value.length * 160 + 16;
});

watch(
  () => props.formulaData,
  (newValue) => {
    if (newValue) {
      calculationObject.value = transformToArray(newValue?.detail);
    }
  }
);

watch(
  () => props.errorCode,
  (newValue) => {
    if (newValue) {
      setInvalidCards(newValue);
    }
  }
);

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyDown);
});

defineExpose({
  resultCalculatorForSave,
});
<\/script>

<style scoped lang="scss">
button {
  transition: 0.2s;
}

.filter-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(205px, 1fr));
  grid-gap: 16px;
  align-items: end;
}

.formula-text {
  font-size: 14px;
  color: theme("colors.neutral.600");
  opacity: 0.5;
}

.create-formula-container {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;

  .left-content {
    width: 326px;
    overflow: hidden;
    max-height: 600px;
    border-radius: 12px;
    border: 1px solid theme("colors.neutral.200");

    .content-header {
      padding: 12px;
      border-bottom: 1px solid theme("colors.neutral.200");
    }

    .body-container {
      padding-right: 6px;

      ::-webkit-scrollbar {
        width: 6px;
        height: 8px;
      }

      ::-webkit-scrollbar-track {
        height: 8px;
        background: #e1e4e4;
      }

      ::-webkit-scrollbar-thumb {
        background: #299b9b;
        height: 8px;
      }

      .content-body {
        padding: 12px 6px 12px 12px;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 535px;

        .parameter-tag {
          padding: 4px;
          border: 1px solid theme("colors.neutral.200");
          border-radius: 8px;
          cursor: pointer;
          font-family: "Inter", sans-serif;
          font-weight: 500;
          font-size: 14px;
          color: theme("colors.neutral.600");
          user-select: none;
        }

        .parameter-tag:hover {
          background: theme("colors.neutral.100");
        }
      }
    }
  }

  .right-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: calc(100% - 276px);

    .calculator-container {
      width: 100%;
      border-radius: 12px;
      border: 1px solid theme("colors.neutral.200");
      background: #fafbfc;
      height: 330px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      overflow: auto;
    }

    .footer-keyboard {
      border-radius: 12px;
      border: 1px solid theme("colors.neutral.200");
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;

      .keyboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;

        .keyboard-header-item {
          border-radius: 10px;
          height: 40px;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: "Inter", sans-serif;
          color: theme("colors.neutral.600");
          font-weight: 500;
          cursor: pointer;
          border: 1px solid theme("colors.neutral.200");
          user-select: none;
        }

        .keyboard-header-item:hover {
          background: theme("colors.neutral.100");
        }
      }

      .keyboard-main {
        display: flex;
        align-items: center;
        gap: 16px;

        .section {
          width: 50%;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 8px;

          .keyboard-header-item,
          .keyboard-header-item-long {
            border-radius: 10px;
            height: 40px;
            width: calc(100% / 3 - 16px / 3);
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: "Inter", sans-serif;
            color: theme("colors.neutral.600");
            font-weight: 500;
            cursor: pointer;
            border: 1px solid theme("colors.neutral.200");
            user-select: none;
          }

          .keyboard-header-item-long {
            width: calc(200% / 3 - 4px);
          }

          .keyboard-header-item:hover,
          .keyboard-header-item-long:hover {
            background: theme("colors.neutral.100");
          }
        }
      }
    }
  }
}
</style>
`;export{n as default};
