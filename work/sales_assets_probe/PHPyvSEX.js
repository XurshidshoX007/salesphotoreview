const n=`<template>
  <div class="month-picker-container">
    <div class="month-picker">
      <VueDatePicker
        :format="formatDate"
        v-model="selectedMonth"
        :year-range="[2020, currentYear + 1]"
        month-picker
        locale="ru"
        auto-apply
        position="left"
        teleport
        :clearable="false"
        @open="onOpen"
      >
      </VueDatePicker>
      <div class="left-section" @click="navigateToPreviousMonth">
        <div class="icon">
          <icon-arrow-left-calendar />
        </div>
      </div>
      <div class="right-section" @click="navigateToNextMonth">
        <div class="icon">
          <icon-arrow-right-calendar />
        </div>
      </div>
    </div>
    <div class="label">{{ labelText }}</div>
  </div>
</template>

<script setup lang="ts">
import VueDatePicker from "@vuepic/vue-datepicker";
import moment from "moment";
import { useI18n } from "vue-i18n";
import { variableData } from "~/variable/variable";

// Types
interface MonthYear {
  month: number;
  year: number;
}

// Emits
const emit = defineEmits<{
  changeMonth: [value: { year: number; month: number }];
  changeFormatDate: [value: string];
}>();

// Props
const props = defineProps<{
  value?: MonthYear | null | undefined;
  label?: string;
}>();

// States
const { t } = useI18n();

const labelText = computed(
  () => props.label ?? t("labels.month_and_year"),
);
const { isActive } = variableData;

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth(); // 0-based (0-11)
const selectedMonth = ref<MonthYear>(initializeMonthYear());

const russianMonths = ref([
  { key: "Янв.", id: "01", fullName: "Январь" },
  { key: "Февр.", id: "02", fullName: "Февраль" },
  { key: "Март", id: "03", fullName: "Март" },
  { key: "Апр.", id: "04", fullName: "Апрель" },
  { key: "Май", id: "05", fullName: "Май" },
  { key: "Июнь", id: "06", fullName: "Июнь" },
  { key: "Июль", id: "07", fullName: "Июль" },
  { key: "Авг.", id: "08", fullName: "Август" },
  { key: "Сен.", id: "09", fullName: "Сентябрь" },
  { key: "Окт.", id: "10", fullName: "Октябрь" },
  { key: "Ноя.", id: "11", fullName: "Ноябрь" },
  { key: "Дек.", id: "12", fullName: "Декабрь" },
]);

// Hooks
const isClearable = computed(() => {
  return (
    selectedMonth.value.month !== currentMonth ||
    selectedMonth.value.year !== currentYear
  );
});

watch(
  () => props.value,
  (newValue, oldValue) => {
    let convertedValue: MonthYear | null = null;

    if (newValue) {
      if (isExternalMonthYear(newValue)) {
        convertedValue = convertToInternalMonthYear(newValue);
      } else if (isValidMonthYear(newValue)) {
        convertedValue = { ...newValue };
      }
    }

    if (convertedValue) {
      const isDifferent =
        selectedMonth.value.month !== convertedValue.month ||
        selectedMonth.value.year !== convertedValue.year;
      if (isDifferent) {
        selectedMonth.value = convertedValue;
      }
    } else if (!newValue && oldValue) {
      // Only set to default if transitioning from a valid value to falsy
      selectedMonth.value = createDefaultMonthYear();
    }
  },
  { deep: true },
);

watch(
  selectedMonth,
  (newValue, oldValue) => {
    if (
      newValue &&
      oldValue &&
      (newValue.month !== oldValue.month || newValue.year !== oldValue.year)
    ) {
      emitMonthChange();
    }
  },
  { deep: true },
);

onMounted(() => {
  emitMonthChange();
});

// methods
const convertToInternalMonthYear = (external: MonthYear): MonthYear => {
  return {
    month: external.month > 0 ? external.month - 1 : external.month,
    year: external.year,
  };
};

function isExternalMonthYear(value: MonthYear): boolean {
  return (
    value &&
    typeof value.month === "number" &&
    value.month >= 1 &&
    value.month <= 12
  );
}

function createDefaultMonthYear(): MonthYear {
  return {
    month: new Date().getMonth(), // 0-based
    year: new Date().getFullYear(),
  };
}

function initializeMonthYear(): MonthYear {
  if (props.value) {
    if (isExternalMonthYear(props.value)) {
      return convertToInternalMonthYear(props.value);
    } else if (isValidMonthYear(props.value)) {
      return { ...props.value };
    }
  }
  return createDefaultMonthYear();
}

function isValidMonthYear(value: MonthYear): value is MonthYear {
  return (
    value &&
    typeof value === "object" &&
    typeof value.month === "number" &&
    typeof value.year === "number" &&
    value.month >= 0 &&
    value.month <= 11 && // 0-based month validation
    value.year >= 1900 &&
    value.year <= 3000
  );
}

function getFormattedMonth(monthIndex: number): string {
  const monthData = russianMonths.value[monthIndex];
  return monthData ? monthData.key : moment().month(monthIndex).format("MMM");
}

const onOpen = (): void => {
  isActive.value = false;
};

const formatDate = (date: Date | moment.Moment): string => {
  const momentDate = moment(date);
  const monthIndex = momentDate.month();
  const year = momentDate.year();
  const formattedMonth = getFormattedMonth(monthIndex);
  const formattedString = \`\${formattedMonth} \${year}\`;

  emit("changeFormatDate", formattedString);
  return formattedString;
};

const emitMonthChange = (): void => {
  if (!selectedMonth.value) return;

  const monthYearData = {
    year: selectedMonth.value.year,
    month: selectedMonth.value.month + 1,
  };

  emit("changeMonth", monthYearData);
};

const updateMonthByDelta = (deltaMonths: number): void => {
  if (!selectedMonth.value) return;

  const currentDate = new Date(
    selectedMonth.value.year,
    selectedMonth.value.month,
  );
  currentDate.setMonth(currentDate.getMonth() + deltaMonths);

  selectedMonth.value = {
    month: currentDate.getMonth(),
    year: currentDate.getFullYear(),
  };
};

const navigateToNextMonth = (): void => {
  updateMonthByDelta(1);
};

const navigateToPreviousMonth = (): void => {
  updateMonthByDelta(-1);
};

const setToDefault = (): void => {
  selectedMonth.value = createDefaultMonthYear();
};

defineExpose({
  setToDefault,
  isClearable,
  selectedMonth: readonly(selectedMonth),
});
<\/script>

<style lang="scss">
.dp__arrow_top {
  position: absolute;
  left: 200px !important;
}

.month-picker-container {
  position: relative;

  .month-picker {
    user-select: none;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    width: 100%;

    .dp__input_readonly {
      padding: 8px 2px 8px 65px !important;
      position: relative !important;
    }

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
        color: #424f4f;
        opacity: 1;
        font-family: "Inter", sans-serif;
        font-weight: 400;
        font-size: 14px;
        padding-left: 6px;
        background: #fafdfd;
        width: 100% !important;
      }

      input::placeholder {
        color: #424f4f;
        opacity: 1;
        font-family: "Inter", sans-serif;
        font-weight: 400;
        font-size: 14px;
      }

      .dp__input_icon {
        left: 32px !important;
      }
    }

    .dp__outer_menu_wrap {
      position: absolute;
      left: 0 !important;
      transform: translateX(0);
      top: 50.5px;
      z-index: 111 !important;
    }

    .dp__arrow_top {
      position: absolute;
      left: 0px !important;
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
      border-left: 1px solid #d2d7d7;

      &:hover {
        background-color: rgba(41, 155, 155, 0.1);
      }
    }

    .left-section {
      left: 0;
      padding-right: 3px;
      border-right: 1px solid #d2d7d7;
      border-left: none;
    }

    .right-section {
      right: 0;

      .icon {
        float: right;
        padding-left: 2px;
      }
    }

    .icon .dp__icon {
      width: 18px;
      height: 18px;
      color: #299b9b;
    }
  }

  .label {
    position: absolute;
    left: 40px;
    top: -10px;
    padding: 0 5px;
    background-image: linear-gradient(
      180deg,
      theme("colors.neutral.0"),
      #fafdfd
    );
    font-family: "Inter", sans-serif;
    font-size: 13px;
    color: #424f4f;
    font-weight: 400;
  }
}
</style>
`;export{n as default};
