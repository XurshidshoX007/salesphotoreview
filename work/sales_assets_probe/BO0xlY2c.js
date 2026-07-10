const e=`<template>
  <div
    class="d-input-datepicker-content"
    :class="
      ((withoutDefault && !date) || withoutChangeCalendar) &&
      'd-input-without-default-datepicker-content'
    "
    :title="label"
  >
    <div
      :class="{
        'calendar-input-left': disabled,
        'calendar-input': !disabled,
        error: isInvalid,
      }"
    >
      <input
        type="text"
        class="hidden"
        :tabindex="-1"
        :required="required"
        :value="date"
        @invalid.prevent="validateDate"
      />
      <VueDatePicker
        ref="datePickerRef"
        v-model="date"
        locale="ru"
        auto-apply
        time-picker-inline
        teleport
        :required="required"
        :format="computedFormat"
        :placeholder="title"
        :enable-time-picker="!withoutTime"
        :space-confirm="withoutTime"
        :disabled="disabled"
        :year-range="[2020, new Date().getFullYear() + 1]"
        :min-date="computedMinDate"
        :max-date="computedMaxDate"
        :position="datePickerPosition"
        :clearable="clearable"
        @update:model-value="handleDateChange"
        @cleared="validateDate"
        @open="onOpen"
        @blur="handleBlur"
        @click="handleInputClick"
      />
      <div
        v-if="date && !withoutChangeCalendar"
        class="left-section"
        :class="[
          disabled && 'pointer-events-none',
          cursorNotAllowedPrevBtn && 'cursor-not-allowed',
        ]"
        @click="setPrevDay"
      >
        <div class="icon">
          <icon-arrow-left-calendar />
        </div>
      </div>
      <div
        v-if="date && !withoutChangeCalendar"
        class="right-section"
        :class="[
          disabled && 'pointer-events-none',
          cursorNotAllowedNextBtn && 'cursor-not-allowed',
        ]"
        @click="setNextDay"
      >
        <div class="icon">
          <icon-arrow-right-calendar />
        </div>
      </div>
    </div>
    <div
      v-if="!withoutLabel"
      class="label"
      :class="labelClass"
      @click="handleFocus"
    >
      <IconCalendarSVG />
      <div class="title">
        {{ label || t("column.date") }}
      </div>
    </div>
  </div>
</template>

<script setup>
import "@vuepic/vue-datepicker/dist/main.css";
import VueDatePicker from "@vuepic/vue-datepicker";
import moment from "moment";
import { getFormattedDate } from "~/utils/formatters";
import { setDateTimeByKey, getDateTimeByKey } from "~/utils/local-storage";
import { dateConstants } from "~/variable/date";
import { variableData } from "~/variable/variable";
import { useI18n } from "vue-i18n";
const { isActive } = variableData;

// props
const props = defineProps({
  disabled: Boolean,
  value: String,
  withoutTime: Boolean,
  required: Boolean,
  title: String,
  withoutDefault: Boolean,
  withoutChangeCalendar: Boolean,
  saveKey: String,
  minDate: String,
  maxDate: String,
  label: String,
  withoutLabel: Boolean,
  clearable: Boolean,
  disabledPastDates: Boolean,
  disableFutureDates: Boolean,
});

// emits
const emit = defineEmits(["change"]);

const getInitialDate = (value) => {
  if (!value) return null;

  // Date-only values should stay in local date space; UTC conversion can shift a day.
  if (props.withoutTime) {
    return moment(value).format(valueFormat.value);
  }

  const isUtcDateTime = moment.parseZone(value).utcOffset() === 0;

  return isUtcDateTime
    ? moment(value).local().format(valueFormat.value)
    : moment(value).utc().format(valueFormat.value);
};

// states
const { t } = useI18n();

const datePickerRef = ref();

const isFocused = ref(false);
const isSyncingFromProps = ref(false);
const isOpeningMenu = ref(false);
const lastPropValue = ref(null);
const lastEmittedValue = ref(null);

const valueFormat = computed(() =>
  props.withoutTime ? "YYYY-MM-DD" : "YYYY-MM-DDTHH:mm",
);

const emitFormat = computed(() =>
  props.withoutTime ? "YYYY-MM-DD" : "YYYY-MM-DDTHH:mm:ss.SSS[Z]",
);

const date = ref(props.value ? getInitialDate(props.value) : null);
const isInvalid = ref(false);

const screenWidth = ref(process.client ? window.innerWidth : 1024); // fallback for SSR

// hooks
const labelClass = computed(() => {
  if (isFocused.value || date.value) {
    return "focused";
  }
  return "";
});

const datePickerPosition = computed(() => {
  return screenWidth.value <= 1024 ? "right" : "left";
});

const computedMinDate = computed(() => {
  if (props.disabledPastDates) {
    return new Date();
  }
  return props.minDate ? new Date(props.minDate) : null;
});

const computedMaxDate = computed(() => {
  if (props.disableFutureDates) {
    return new Date();
  }
  return props.maxDate ? new Date(props.maxDate) : null;
});

const minTime = computed(() =>
  getMinOrMaxTime(date.value, computedMinDate.value),
);
const maxTime = computed(() =>
  getMinOrMaxTime(date.value, computedMaxDate.value),
);

const computedFormat = computed(() => {
  const { months } = dateConstants();
  if (date.value) {
    const monthItem = months.find(
      (item) => item.id === getFormattedDate(date.value, "MM"),
    );
    const checkMonth = monthItem ? monthItem.key : "";
    const formattedDate = getFormattedDate(date.value, "DD");
    const formattedYear = getFormattedDate(date.value, "YYYY");
    const formattedTime = getFormattedDate(date.value, "HH:mm");
    return \`\${formattedDate} \${checkMonth} \${formattedYear}\${
      props.withoutTime ? "" : " " + formattedTime
    }\`;
  } else {
    return props.title;
  }
});

const normalizeDateValue = (value) => {
  if (!value) return null;

  const parsedDate = moment(value);
  if (!parsedDate.isValid()) return null;

  if (props.withoutTime) {
    return parsedDate.format("YYYY-MM-DD");
  }

  return parsedDate.utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
};

watch(
  () => props.value,
  (newValue, oldValue) => {
    lastPropValue.value = normalizeDateValue(newValue);
    // Emit default value only when transitioning to an empty value.
    if (!newValue && !props.withoutDefault && oldValue !== newValue) {
      const defaultValue = props.withoutTime
        ? moment().format(emitFormat.value)
        : moment().utc().format(emitFormat.value);
      emit("change", defaultValue);
      lastEmittedValue.value = normalizeDateValue(defaultValue);
    }
  },
  { immediate: true },
);

watch(
  () => props.value,
  () => {
    isSyncingFromProps.value = true;
    date.value = props.value ? getInitialDate(props.value) : null;
    lastPropValue.value = normalizeDateValue(props.value);
    Promise.resolve().then(() => {
      isSyncingFromProps.value = false;
    });

    if (props.value) {
      isFocused.value = true;
    }
  },
);

onMounted(() => {
  if (props.saveKey) setSavedDate();
  else if (!props.withoutDefault && props.value) setDefaultDate();
  defaultLabelPosition();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});

// Methods
const defaultLabelPosition = () => {
  if (props.value) {
    isFocused.value = true;
  } else if (props.withoutDefault && props.title) {
    isFocused.value = true;
  } else if (props.withoutDefault) {
    isFocused.value = false;
  }
};

const handleResize = () => {
  screenWidth.value = window.innerWidth;
};

const getMinOrMaxTime = (currentDate, boundaryDate) => {
  if (currentDate && boundaryDate && isSameDay(currentDate, boundaryDate)) {
    return {
      hours: boundaryDate.getHours(),
      minutes: boundaryDate.getMinutes(),
    };
  }
  return null;
};

const isSameDay = (date1, date2) => {
  return moment(date1).isSame(date2, "day");
};

const handleDateChange = (selectedDate) => {
  if (isSyncingFromProps.value) return;

  // if (!selectedDate) {
  //   emit("change", null);
  //   return;
  // }

  // const selectedMoment = moment(selectedDate);
  // const minMoment = moment(props.minDate);
  // const maxMoment = moment(props.maxDate);

  // if (isSameDay(selectedDate, computedMinDate.value)) {
  //   if (selectedMoment.isBefore(minMoment)) {
  //     selectedMoment.hour(minMoment.hour()).minute(minMoment.minute());
  //   }
  // }

  // if (isSameDay(selectedDate, computedMaxDate.value)) {
  //   if (selectedMoment.isAfter(maxMoment)) {
  //     selectedMomen t.hour(maxMoment.hour()).minute(maxMoment.minute());
  //   }
  // }

  // date.value = selectedMoment.toDate();

  // emit("change", selectedMoment.utc().format(emitFormat.value));
  // if (props.saveKey) setDateTimeByKey(props.saveKey, selectedMoment.toDate());
  // setValid();
  const nextValue = selectedDate
    ? props.withoutTime
      ? moment(selectedDate).format(emitFormat.value)
      : moment(selectedDate).utc().format(emitFormat.value)
    : null;

  const normalizedNextValue = normalizeDateValue(nextValue);
  if (
    normalizedNextValue === lastPropValue.value ||
    normalizedNextValue === lastEmittedValue.value
  )
    return;

  emit("change", nextValue);
  lastEmittedValue.value = normalizedNextValue;

  if (props.saveKey) setDateTimeByKey(props.saveKey, selectedDate);
  setValid();
};

const validateDate = () => {
  isInvalid.value = props.required && !date.value;
};

const setDefaultDate = () => {
  if (!props.value) return;
  date.value = getInitialDate(props.value);
};

const setSavedDate = () => {
  const savedDate = getDateTimeByKey(props.saveKey);
  date.value = savedDate ? new Date(savedDate) : new Date();

  if (savedDate) {
    const savedValue = props.withoutTime
      ? moment(savedDate).format(emitFormat.value)
      : moment(savedDate).utc().format(emitFormat.value);
    emit("change", savedValue);
    lastEmittedValue.value = normalizeDateValue(savedValue);
  }
};

const isClearable = () => {
  return (
    moment().format("YYYY-MM-DD") !== moment(date.value).format("YYYY-MM-DD")
  );
};

const onReset = () => {
  date.value = new Date();
  handleDateChange(date.value);
};

const setValid = () => {
  isInvalid.value = false;
};

const onOpen = () => {
  isActive.value = false;
  isFocused.value = true;
};

const updateDateByDays = (days) => {
  date.value = moment(date.value).add(days, "day").toDate();
  if (props.withoutTime) {
    const nextValue = moment(date.value).format(emitFormat.value);
    emit("change", nextValue);
    lastEmittedValue.value = normalizeDateValue(nextValue);
    return;
  }
  const nextValue = moment.utc(date.value).format(emitFormat.value);
  emit("change", nextValue);
  lastEmittedValue.value = normalizeDateValue(nextValue);
};

const setNextDay = () => {
  const isAfterMaxDate = computedMaxDate.value
    ? moment(date.value)
        .add(1, "day")
        .isSameOrAfter(computedMaxDate.value, "day")
    : false;
  if (isAfterMaxDate) return;
  updateDateByDays(1);
};

const setPrevDay = () => {
  const isBeforeMinDate = computedMinDate.value
    ? moment(date.value)
        .add(-1, "day")
        .isSameOrBefore(computedMinDate.value, "day")
    : false;

  if (isBeforeMinDate) return;
  updateDateByDays(-1);
};

const cursorNotAllowedPrevBtn = computed(() => {
  const isBeforeMinDate = computedMinDate.value
    ? moment(date.value)
        .add(-1, "day")
        .isSameOrBefore(computedMinDate.value, "day")
    : false;

  return isBeforeMinDate;
});

const cursorNotAllowedNextBtn = computed(() => {
  const isAfterMaxDate = computedMaxDate.value
    ? moment(date.value)
        .add(1, "day")
        .isSameOrAfter(computedMaxDate.value, "day")
    : false;
  return isAfterMaxDate;
});

const handleInputClick = () => {
  isFocused.value = true;
  onOpen();
};

const handleFocus = () => {
  if (isOpeningMenu.value) return;

  isOpeningMenu.value = true;
  isFocused.value = true;
  datePickerRef.value?.openMenu();
  onOpen();
  Promise.resolve().then(() => {
    isOpeningMenu.value = false;
  });
};

const handleBlur = () => {
  if (!date.value && !props.title) {
    isFocused.value = false;
  }
};

defineExpose({ onReset, isClearable });
<\/script>

<style lang="scss">
.calendar-input.error {
  .dp__input_wrap {
    input {
      border: 1px solid #ff0000 !important;
    }
  }
}

.d-input-datepicker-content,
.d-input-without-default-datepicker-content {
  position: relative;

  .dp__input_readonly {
    padding: 9px 2px 9px 45px !important;
    position: relative !important;
  }

  .dp__icon {
    display: none;
  }

  .dp__clear_icon {
    display: block;
    color: theme("colors.neutral.600");
    right: 32px !important;
  }

  .label {
    position: absolute;
    left: 40px;
    top: 50%;
    transform: translateY(-50%);
    padding: 0 5px;
    user-select: none;
    background: theme("colors.neutral.0");
    font-family: "Inter", sans-serif;
    font-size: 13px;
    color: theme("colors.neutral.600");
    font-weight: 400;
    display: flex;
    align-items: center;
    gap: 0 4px;
    transition: all 0.3s ease;
    cursor: pointer;
    max-width: calc(100% - 12px);

    .title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &.focused {
      left: 11px;
      top: 0;
      line-height: 16px;
      transition: top 0.3s;
    }
  }

  .calendar-input {
    overflow: hidden;
    user-select: none;
    border-radius: 10px;
    position: relative;
    cursor: pointer;
    width: 100%;

    .dp__calendar_row {
      margin: 0 !important;
    }

    .dp__calendar_header_separator {
      margin-bottom: 5px !important;
    }

    .dp--menu-wrapper {
      width: fit-content;
      position: absolute;
      right: 0;
    }

    .dp__input_wrap {
      width: 100% !important;

      input {
        color: theme("colors.neutral.600");
        opacity: 1;
        font-family: "Inter", sans-serif;
        font-weight: 400;
        font-size: 14px;
        line-height: 20px;
        padding-left: 6px;
        background: theme("colors.neutral.0");
        width: 100% !important;
        border-radius: 10px;
      }

      input::placeholder {
        color: theme("colors.neutral.600");
        opacity: 1;
        font-family: "Inter", sans-serif;
        font-weight: 400;
        font-size: 14px;
      }

      .dp__input_icon {
        left: 32px !important;
      }

      .dp__clear_icon {
        right: 32px !important;
      }
    }

    .dp__outer_menu_wrap {
      position: absolute;
      left: 0 !important;
      transform: translateX(0);
      top: 50.5px;
      z-index: 111 !important;
    }

    .right-section,
    .left-section {
      height: 39.5px;
      width: 36px;
      transition:
        right 0.3s ease-in-out,
        left 0.3s ease-in-out,
        background 0.3s ease-in-out;
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 11;
      border-left: 1px solid #e1e4e4;
      right: 0;
    }

    .left-section {
      padding-right: 3px;
      border-right: 1px solid #e1e4e4;
      left: 0;
    }

    .right-section .icon {
      float: right;
      padding-left: 2px;
    }

    .icon .dp__icon {
      width: 18px;
      height: 18px;
      color: theme("colors.teal.600");
    }
  }

  .calendar-input-left {
    position: relative;
    width: 100%;
    opacity: 0.7;

    .label {
      position: absolute;
      left: 11px;
      transform: translateY(-50%);
      top: 50%;
      padding: 0 5px;
      background: theme("colors.neutral.0");
      font-family: "Inter", sans-serif;
      font-size: 13px;
      color: theme("colors.neutral.600");
      font-weight: 400;
      transition:
        top 0.3s,
        font-size 0.3s;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0 4px;
      max-width: calc(100% - 12px);

      .title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &.focused {
        left: 11px;
        top: 0;
        line-height: 16px;
        transition: top 0.3s;
      }
    }

    .dp__input_wrap {
      input {
        color: #abaeae;
        font-family: "Inter", sans-serif;
        font-weight: 400;
        font-size: 14px;
        background: theme("colors.neutral.0");
        border-radius: 10px;
      }

      input::placeholder {
        color: theme("colors.neutral.600");
        opacity: 1;
        font-family: "Inter", sans-serif;
        font-weight: 400;
        font-size: 14px;
      }

      .dp__input_icon {
        left: 32px !important;
      }

      .dp__clear_icon {
        right: 32px !important;
      }
    }

    .right-section,
    .left-section {
      height: 39.5px;
      width: 34px;
      transition:
        right 0.3s ease-in-out,
        left 0.3s ease-in-out,
        background 0.3s ease-in-out;
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 1px;
      z-index: 11;
      border-left: 1px solid theme("colors.neutral.200");
      right: 0;
    }

    .left-section {
      border-right: 1px solid theme("colors.neutral.200");
      border-left: none;
      left: 0;
    }

    .right-section .icon {
      float: right;
      padding-left: 2px;
    }

    .icon .dp__icon {
      width: 18px;
      height: 18px;
      color: theme("colors.teal.600");
    }
  }
}

.d-input-without-default-datepicker-content {
  .calendar-input.error {
    .dp__input_wrap {
      input {
        border: 1px solid #ff0000 !important;
      }
    }
  }
  .label {
    left: 11px;
    transition: all 0.3s ease;
    max-width: calc(100% - 12px);

    .title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  .dp__input_readonly {
    padding: 8px 2px 8px 15px !important;
  }
  .calendar-input {
    position: relative;

    .dp__input_wrap {
      width: 100% !important;

      .dp__input_icon {
        left: 3px !important;
      }
    }
  }
}

@media only screen and (max-width: 576px) {
  .d-input-datepicker-content,
  .d-input-without-default-datepicker-content {
    width: 100% !important;
    .dp__input_readonly {
      width: 100%;
      padding: 6px 2px 6px 35px !important;
    }
  }

  .d-input-datepicker-content,
  .d-input-without-default-datepicker-content {
    position: relative;

    .calendar-input-left {
      .right-section,
      .left-section {
        height: 36px;
      }
    }

    .calendar-input {
      .right-section,
      .left-section {
        height: 36px;
      }
    }

    .dp__input_readonly {
      padding: 6px 2px 6px 65px !important;
      position: relative !important;
    }
  }
}
</style>
`;export{e as default};
