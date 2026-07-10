const n=`<template>
  <div :class="{ 'without-style-input': withoutStyle, borderless: borderless }">
    <div class="form-field">
      <div
        v-if="hasPrefix"
        class="absolute z-19 flex justify-start w-fit top-2.5 left-2"
      >
        <slot name="prefix"></slot>
      </div>
      <label
        style="pointer-events: none"
        :class="[
          isFocused ? 'focused' : '',
          (patternType === 'comment' && 'top-[20px]') || 'top-[50%]',
          disabled && 'disabled_label',
          invalid && 'invalid_label',
          hasPrefix && 'label-with-prefix',
        ]"
        :title="label"
        class="truncate"
        @click="handleFocus"
      >
        <div class="title truncate">
          {{ invalid ? errorMessage : label }}
        </div>
      </label>
      <textarea
        ref="dInput"
        v-if="patternType === 'comment'"
        id="comment"
        v-model="_value"
        :required="required"
        :readonly="readonly"
        :class="[
          disabled && 'disabled-input',
          invalid && 'invalid-input',
          hasPrefix && 'input-with-prefix',
          hasSuffix && 'input-with-suffix',
        ]"
        :disabled="disabled"
        @invalid="requiredCheck(true)"
        @input="handleTextareaInput"
        @blur="onBlur($event.target.value)"
        @focus="onFocus"
      />
      <input
        v-else
        ref="dInput"
        :disabled="disabled"
        :readonly="readonly"
        :id="id"
        :type="_type"
        v-model="_value"
        :pattern="inputPattern"
        :required="required"
        :min="min"
        :max="max"
        :maxlength="props.maxLength"
        :autocomplete="autocomplete"
        :step="step"
        :placeholder="placeholder"
        class="border"
        :class="{
          'disabled-input': props.disabled,
          'invalid-input': invalid,
          'text-end': props.type === 'number',
          'border-neutral-200': !props.borderColorClass,
          'input-with-prefix': hasPrefix,
          'input-with-suffix':
            hasSuffix || type === 'password' || checkCodeInput,
          [props.borderColorClass]: props.borderColorClass,
        }"
        v-maska:[maskOptionsForm]
        @invalid="requiredCheck(true)"
        @input="requiredCheck(false)"
        @focusout="!_value && requiredCheck(true)"
        @blur="onBlur($event.target.value)"
        @focus="onFocus"
      />
      <div v-if="checkCodeInput" class="code-length">
        {{ _value?.length || 0 }} / 20
      </div>
      <div
        v-if="type === 'password'"
        class="absolute cursor-pointer z-19 flex justify-end w-fit top-2 right-2"
      >
        <IconEye
          v-show="_type === 'text'"
          @click="_type = 'password'"
          class="text-primary-600"
        />
        <IconCloseEye v-show="_type === 'password'" @click="_type = 'text'" />
      </div>
      <div
        v-if="hasSuffix"
        class="absolute z-19 flex justify-end w-fit top-2.5 right-2"
      >
        <slot name="suffix"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getFormattedAmount } from "~/utils/filter";
import { useI18n } from "vue-i18n";
// import type { Slot } from "vue";

// props
const props = defineProps({
  id: {
    type: String,
    required: false,
  },
  type: {
    type: String,
    required: false,
  },
  value: {
    required: false,
  },
  required: {
    type: Boolean,
    required: false,
  },
  autocomplete: {
    required: false,
    type: String,
  },
  withoutStyle: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  min: [Boolean, Number, String],
  max: [Boolean, Number, String],
  maxLength: Number,
  label: String,
  step: String,
  acceptNegative: Boolean,
  acceptZero: Boolean,
  patternType: String,
  afterPointLength: Number,
  focusable: Boolean,
  placeholder: String,
  borderless: Boolean,
  borderColorClass: String,
});

// types
// type InputSlots = {
//   prefix?: Slot;
//   suffix?: Slot;
// };

// slots
// defineSlots<InputSlots>();
const slots = useSlots();

// states
const { t } = useI18n();
const _value = ref(props.value);
let invalid = ref(false);
const invalidMaxLength = ref(null);
const dInput = ref(null);
const isFocused = ref(false);
const inputValue = ref(null);
const errorMessage = ref(\`\${props.title || props?.label || ""} *\`);

const _type = ref(null);

const emit = defineEmits(["change", "blur", "focus"]);

const hasPrefix = computed(() => !!slots.prefix);
const hasSuffix = computed(() => !!slots.suffix);

const maxInputAmount = computed(() => {
  if (props.type === "number") {
    if (props.max || props.max === 0) {
      return props.max;
    } else if (props.patternType === "sort") {
      return 1000000000;
    }
    return 1000000000000;
  }
});

const inputPattern = computed(() => {
  const patternLogin = /^[a-zA-Z0-9_]{3,}$/;
  const patternPINFL = /^[0-9]{14,}$/;
  const patternCode = /^[a-zA-Z0-9_-]{2,}$/;
  const patternNumberType = /^[a-zA-Z_-]*$/;
  const patternPassword = /^[a-zA-Z0-9_]{4,}$/;
  const patternSort = /^\\s*(?:[0-9]\\s*|[1-9]\\s*[0-9]{0,3}\\s*)$/;
  const patternEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;

  let pattern = null;

  if (props.id === "login") {
    pattern = patternLogin;
  } else if (props.patternType === "code") {
    pattern = patternCode;
  } else if (props.patternType === "pinfl") {
    pattern = patternPINFL;
  } else if (props.type === "number" && invalid.value) {
    pattern = patternNumberType;
  } else if (props.type === "password") {
    pattern = patternPassword;
  } else if (props.patternType === "sort" && invalid.value) {
    pattern = patternSort;
  } else if (props.patternType === "email" && invalid.value) {
    pattern = patternEmail;
  }

  if (!pattern) return null;

  if (_value.value === null || _value.value === "") {
    return null;
  }

  const isValid = pattern.test(_value.value);

  return isValid ? pattern.source : true;
});

const maskOptionsForm = computed(() => {
  if (
    props.patternType &&
    props.patternType !== "sort" &&
    props.patternType !== "email"
  ) {
    return {
      preProcess: (val) => {
        if (props.patternType === "pinfl") {
          const isValidDigits = /^[0-9]*$/.test(val);
          invalid.value = !isValidDigits;
          return val.replace(/\\D/g, "");
        }

        const isValid = /^[a-zA-Z0-9_-]*$/.test(val);
        invalid.value = !isValid;
        return val;
      },
      postProcess: (val) => {
        const trimmedVal = val.substring(
          0,
          props.patternType === "pinfl" ? 14 : 20,
        );

        if (trimmedVal === "") return null;

        if (props.patternType === "pinfl") {
          if (trimmedVal.length < 14) {
            errorMessage.value = t("labels.enter_pinfl_least_14_digits");
            invalid.value = true;
            return trimmedVal;
          }
        } else if (
          (props.id === "login" ||
            props.type === "password" ||
            props.patternType === "code") &&
          !invalid.value
        ) {
          const minLength = props.id === "login" ? 3 : 2;
          const inputType =
            props.id === "login"
              ? "логин"
              : props.id !== "password"
                ? "кода"
                : "пароль";

          if (trimmedVal.length < minLength) {
            errorMessage.value = \`Введите \${inputType} длиной не менее \${minLength} символов.\`;
            invalid.value = true;
            return trimmedVal;
          }
        }

        if (invalid.value) {
          const inputType =
            props.id === "login"
              ? "логина"
              : props.id !== "password"
                ? "кода"
                : "пароля";
          errorMessage.value = \`Недопустимый символ для ввода \${inputType}\`;
          return trimmedVal;
        }

        return trimmedVal;
      },
    };
  } else if (props.type === "number") {
    return {
      eager: props.acceptNegative,
      preProcess: (val) => {
        let result = val.replace(/[^\\d.-]/g, "");

        if (props.acceptNegative) {
          result = result.replace(/(?!^-)[-]/g, "");
        }
        return result;
      },
      postProcess: (val, rawValue) => {
        if (!val) return null;
        let numericVal = val.replace(/[^\\d.]/g, "");

        if (props.acceptNegative) {
          numericVal = val.replace(/[^\\d.-]/g, "");
          numericVal = numericVal.replace(/(?!^-)[-]/g, "");
          if (numericVal === "-") return numericVal;
        }

        const dotCount = (numericVal.match(/\\./g) || []).length;
        if (dotCount > 1) {
          numericVal = numericVal.substring(0, numericVal.lastIndexOf("."));
        }

        numericVal = numericVal.replace(/^0+(\\d+)/, "$1");

        let parts = numericVal.split(".");

        let integerPart = Number(parts[0].replace(/\\s/g, ""));

        if (integerPart > 10000000000000) {
          integerPart = Math.floor(integerPart / 10);
        }

        parts[0] = formatNumber(integerPart);

        if (parts[1]) {
          if (props.step !== "any") {
            parts[1] = parts[1].slice(0, props.afterPointLength || 2);
          }
        }

        return parts.join(".");
      },
    };
  } else if (props.type === "tel") {
    return {
      mask: "+998 (##) ###-##-##",
      unmask: false,
      preProcess: (val) => val,
      postProcess: (val) => val,
      eager: false,
      normalized: true,
      tokens: {
        "#": { pattern: /\\d/, transform: (n) => n },
      },
    };
  }
});

const checkCodeInput = computed(() => {
  if (props.type === "password") return false;
  return props.patternType === "code" || props.patternType === "login";
});

// methods

const handleFocus = () => {
  isFocused.value = true;
};

const handleBlur = () => {
  if (!inputValue.value) {
    isFocused.value = false;
  }
};

const requiredCheck = (value) => {
  if (props.patternType === "pinfl") {
    const requiredField =
      props.value !== null && props.value !== "" && props.value.length < 14;
    invalid.value = requiredField;
    errorMessage.value = t("labels.enter_pinfl_least_14_digits");
  } else if (props.patternType !== "code") {
    const numValue = _value.value?.toString().replace(/\\s/g, "");
    const numericValue = numValue !== "" ? Number(numValue) : null;

    if (props.type === "number" && props.required) {
      if (_value.value === "" || (numericValue <= 0 && !props.acceptZero)) {
        errorMessage.value = \`\${props.title || props?.label || ""} *\`;
        return (invalid.value = true);
      }
      if (props.acceptZero && numericValue < 0) {
        return (invalid.value = true);
      }
    }

    if (props.type === "number" && _value.value !== "") {
      if (maxInputAmount.value < numericValue) {
        errorMessage.value = \`Макс:\${getFormattedAmount(maxInputAmount.value)}\`;
        return (invalid.value = true);
      }
    }

    if (
      props.type === "number" &&
      (props.min || props.min === 0) &&
      _value.value !== ""
    ) {
      if (props.min > numericValue) {
        errorMessage.value = \`Мин:\${getFormattedAmount(props.min)}\`;
        return (invalid.value = true);
      }
    }

    if (_value.value?.toString().trim()?.length === 0) {
      _value.value = "";
      value = true;
    }

    invalid.value = props.required ? value : props.required;
  } else if (
    props.patternType === "code" &&
    props.required &&
    !_value.value?.toString()?.trim()
  ) {
    invalid.value = props.required;
    errorMessage.value = props.label || props.title;
  }
};

const maxLengthCheck = () => {
  if (_value.value && _value.value.toString().length > props.maxLength) {
    _value.value = _value.value
      .toString()
      .split("")
      .slice(0, props.maxLength)
      .join("");
  } else {
    invalidMaxLength.value = null;
  }
};

const formatNumber = (value) => {
  if (!isNaN(value) && value !== null) {
    const [integerPart, fractionalPart] = value.toString().split(".");

    const formattedInteger = integerPart.replace(/\\B(?=(\\d{3})+(?!\\d))/g, " ");

    const formattedNumber = fractionalPart
      ? \`\${formattedInteger}.\${fractionalPart}\`
      : formattedInteger;
    return formattedNumber;
  }
};

watch(
  () => props.value,
  (newValue) => {
    _value.value = props.type === "number" ? formatNumber(newValue) : newValue;
    if (props.value === "" || props.value === null) {
      return;
    }
    isFocused.value = true;
    if (props.patternType === "comment") {
      nextTick(() => {
        resizeTextarea();
      });
    }
  },
);

const onFocus = () => {
  emit("focus");
  handleFocus();
};

const onBlur = (value) => {
  if (props.type === "tel") {
    const unmaskedValue = value ? value.replace(/\\D/g, "") : "";
    emit("blur", unmaskedValue);
  } else {
    emit("blur", value.replace(/[^\\d]/g, ""));
  }
  handleBlur();
};

const hasMixedCharacters = (str) => {
  return /[^0-9.]/.test(str);
};

const extractNumber = (str) => {
  const match = str?.match(/^-?\\d+(\\.\\d+)?/);
  if (!match) return null;
  return match ? parseFloat(match[0]) : null;
};

const preserveCursorPosition = (inputEl, oldValue, newValue, oldPos) => {
  if (!inputEl) return;

  let offset = 0;
  if (oldValue && newValue) {
    offset = newValue.length - oldValue.length;
    if (offset < 0) offset = 0;
  }
  setTimeout(() => {
    const newPos = Math.min(oldPos + offset, newValue?.length || 0);
    inputEl.setSelectionRange(newPos, newPos);
  }, 0);
};

const focusInput = () => {
  dInput.value?.focus();
};

const resizeTextarea = () => {
  if (dInput.value && props.patternType === "comment") {
    dInput.value.style.height = "auto";
    dInput.value.style.height = dInput.value.scrollHeight + "px";
  }
};

const handleTextareaInput = (event) => {
  requiredCheck(false);
  resizeTextarea();
};

watch(
  () => invalid.value,
  (newValue) => {
    if (invalid.value) {
      isFocused.value = true;
    }
  },
);

watch(_value, async (value, oldValue) => {
  const inputEl = dInput.value;
  const cursorPos =
    inputEl && props.type === "tel" ? inputEl.selectionStart : null;
  const prevValue = oldValue;

  if (value === "") {
    invalid.value = true;
    requiredCheck(true);
  }

  inputValue.value = value;
  if (props.type === "number") {
    let newValue = value?.replace(/\\s/g, "");
    if (hasMixedCharacters(newValue)) {
      emit("change", extractNumber(newValue));
    } else {
      if (typeof Number(newValue) === "number") {
        if (!isNaN(Number(newValue))) {
          emit("change", newValue !== "" ? Number(newValue) : null);
        }
      } else {
        emit("change", value === "0" && props.acceptZero ? 0 : null);
      }
    }
  } else if (props.patternType === "code") {
    if (typeof value === "number") {
      emit("change", value.toString());
    } else if (_value.value === "") {
      emit("change", null);
    } else {
      emit("change", value);
    }
  } else if (props.type === "tel") {
    const unmaskedValue = _value.value ? _value.value.replace(/\\D/g, "") : "";
    emit("change", unmaskedValue);
  } else {
    emit("change", value);
  }

  if (props.type === "tel" && cursorPos !== null && inputEl) {
    preserveCursorPosition(inputEl, prevValue, value, cursorPos);
  }
});

watchEffect(() => {
  if (props.maxLength) {
    maxLengthCheck();
  }
});

onMounted(() => {
  if (props.value || props.value === 0) {
    isFocused.value = true;
    inputValue.value = props.value;
  }
  if (props.type === "password") {
    _type.value = "password";
  } else if (props.patternType === "email") {
    _type.value = "email";
  } else {
    _type.value = "text";
  }
  handleLabelOnAutoComplete();
  if (props.focusable) {
    focusInput();
  }
  if (props.patternType === "comment") {
    nextTick(() => {
      resizeTextarea();
    });
  }
});

watch(
  () => [props.max, props.min],
  () => {
    nextTick(() => {
      requiredCheck(false);
    });
  },
);

const handleLabelOnAutoComplete = () => {
  if (props.autocomplete) {
    const inputElement = document.getElementById(props.id);
    if (inputElement) {
      checkAutofillState(inputElement);

      const timeoutDuration = 800;
      const startTime = performance.now();

      const checkForAutofill = () => {
        if (inputElement.matches(":-webkit-autofill")) {
          isFocused.value = true;
        } else if (performance.now() - startTime < timeoutDuration) {
          requestAnimationFrame(checkForAutofill);
        }
      };
      requestAnimationFrame(checkForAutofill);
    }
  }
};

const checkAutofillState = (inputElement) => {
  if (inputElement.matches(":-webkit-autofill")) {
    isFocused.value = true;
  }
};

defineExpose({
  focus: focusInput,
});
<\/script>

<style scoped lang="scss">
.form-field {
  position: relative;

  input {
    padding: 10px 12px;
    width: 100%;
    max-width: 100%;
    min-width: 100px;
    border-radius: 8px;
    font-weight: 400;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    color: theme("colors.neutral.950");
    line-height: 18px;
    outline: none;
    user-select: none;

    /* Add padding when prefix exists */
    &.input-with-prefix {
      padding-left: 40px;
    }

    /* Add padding when suffix exists */
    &.input-with-suffix {
      padding-right: 40px;
    }

    /* For number inputs with suffix, ensure proper alignment */
    &.text-end.input-with-suffix {
      padding-right: 50px;
    }

    &:focus {
      color: theme("colors.neutral.950");

      label {
        background-image: none !important;
        background-color: theme("colors.neutral.0") !important;
        transition: all 0.3s ease-in-out;
      }
    }

    &.invalid-input,
    &.invalid-input:focus {
      border: 1px solid red;
      background-color: theme("colors.neutral.0") !important;
    }

    &.disabled-input {
      pointer-events: none;
      color: theme("colors.neutral.300") !important;
      background: theme("colors.neutral.50") !important;
    }

    @media only screen and (max-width: 576px) {
      height: 36px;
    }
  }

  &:focus-within label {
    background-image: linear-gradient(
      0deg,
      #fafbfc 0%,
      #ffffff 100%
    ) !important;
  }

  label {
    position: absolute;
    transform: translateY(-50%);
    left: 11px;
    transition:
      top 0.3s,
      font-size 0.3s;
    max-width: calc(100% - 45px);
    padding: 0 5px;
    user-select: none;
    background-image: none !important;
    background-color: theme("colors.neutral.0") !important;

    /* Adjust label position when prefix exists */
    &.label-with-prefix {
      left: 35px;
    }

    .title {
      color: theme("colors.neutral.600");
      font-size: 14px;
      font-family: "Inter", sans-serif;
      line-height: 16px;
      font-weight: 400;
      transition:
        top 0.3s,
        font-size 0.3s;
    }

    &.focused {
      left: 11px;
      top: 0;
      line-height: 16px;
      transition:
        top 0.3s,
        font-size 0.3s;

      /* Keep label in normal position when focused even with prefix */
      &.label-with-prefix {
        left: 11px;
      }

      .title {
        font-size: 12px;
        transition:
          top 0.3s,
          font-size 0.3s;
      }
    }

    &.disabled_label {
      z-index: 1;
      color: theme("colors.neutral.300") !important;
      background-color: theme("colors.neutral.0") !important;

      .title {
        color: theme("colors.neutral.300") !important;
      }
    }

    &.invalid_label {
      background-image: none !important;
      background-color: theme("colors.neutral.0") !important;

      .title {
        color: theme("colors.red.500");
      }
    }
  }

  textarea {
    // min-height: 60px;
    width: 100%;
    min-width: 200px;
    border-radius: 8px;
    border: 1px solid #d2d7d7;
    background-color: theme("colors.neutral.0");
    font-weight: 400;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    color: theme("colors.neutral.950");
    outline: none;
    padding: 9px 12px;
    overflow-y: auto;
    resize: vertical;

    /* Add padding when prefix/suffix exists */
    &.input-with-prefix {
      padding-left: 40px;
    }

    &.input-with-suffix {
      padding-right: 40px;
    }

    &.invalid-input {
      border: 1px solid red;
    }

    &:focus {
      color: theme("colors.neutral.950");
    }
  }

  .code-length {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 10px;
    font-size: 13px;
    color: #8fa0a0;
    font-family: "Inter", sans-serif;
    font-weight: 400;
    line-height: 8px;
  }
}

.without-style-input {
  .form-field {
    position: relative;

    input {
      padding: 10px 12px;
      width: 100%;
      max-width: 100%;
      min-width: 100px;
      border-radius: 8px;
      background-color: transparent;
      border: none;
      font-weight: 400;
      font-family: "Inter", sans-serif;
      font-size: 14px;
      color: theme("colors.neutral.950") !important;
      outline: none;

      &.invalid-input,
      &.invalid-input:focus {
        border: none;
        background-color: theme("colors.neutral.0") !important;
      }
    }

    input:focus,
    input:hover {
      background-color: transparent !important;
    }
  }
}

.borderless {
  input {
    border: none !important;
  }

  textarea {
    border: none !important;
  }
}

input:-webkit-autofill,
input:-webkit-autofill,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  box-shadow: inset 0 0 20px 20px #fafdfd;
}
</style>
`;export{n as default};
