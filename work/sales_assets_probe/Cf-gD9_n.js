const n=`<template>
  <div class="form-field">
    <div
      :class="{ 'disabled-calendar-input': disabled }"
      class="calendar-container"
      v-click-outside="closeCalendar"
    >
      <div class="calendar-input">
        <div class="left-section" @click="navigateToPreviousDay">
          <div class="icon">
            <icon-arrow-left-calendar />
          </div>
        </div>
        <div class="center-content" @click="toggleCalendar">
          {{ displayedDateRange }}
        </div>
        <div class="right-section" @click="navigateToNextDay">
          <div class="icon">
            <icon-arrow-right-calendar />
          </div>
        </div>
      </div>

      <div v-if="openCalendar" class="range-calendar-content">
        <div class="left-content" v-if="currentView === 'select-date'">
          <VueDatePicker
            v-model="selectedDateRange"
            range
            :multi-calendars="{ solo: true }"
            :year-range="[2020, new Date().getFullYear() + 1]"
            locale="ru"
            :enable-time-picker="false"
            position="left"
            :disabled="disabled"
            :min-date="minDateObject"
            :max-date="maxDateObject"
            auto-apply
            inline
            @update:model-value="handleDateSelection"
          />
        </div>

        <div class="left-content" v-if="currentView === 'select-month'">
          <VueDatePicker
            v-model="selectedMonthRange"
            :year-range="[2020, new Date().getFullYear() + 1]"
            month-picker
            range
            locale="ru"
            position="left"
            :disabled="disabled"
            :min-date="minDateObject"
            :max-date="maxDateObject"
            auto-apply
            inline
            @update:model-value="handleMonthSelection"
          />
        </div>

        <div class="right-content">
          <div
            v-for="preset in visiblePresets"
            :key="preset.key"
            @click="handlePresetClick(preset)"
            :class="['item', { 'item-a': preset.key === currentView }]"
          >
            {{ preset.label }}
          </div>
          <div class="arr"></div>
        </div>
      </div>

      <div class="label">
        <IconCalendarSVG />
        {{ label || t("column.date") }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import "@vuepic/vue-datepicker/dist/main.css";
import moment from "moment";
import { useI18n } from "vue-i18n";
import VueDatePicker from "@vuepic/vue-datepicker";

const { t } = useI18n();

// props
interface Props {
  disabled?: boolean;
  initialFromDate?: string | null;
  initialToDate?: string | null;
  label?: string;
  defaultPreset?: string;
  customPresetDates?: PresetDate[];
  tomorrowPreset?: boolean;
  past3MonthsPreset?: boolean;
  past6MonthsPreset?: boolean;
  withoutTodayPreset?: boolean;
  withoutYesterdayPreset?: boolean;
  emptyInitialRange?: boolean;
  withoutTime?: boolean;
  minDate?: string;
  maxDate?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  tomorrowPreset: false,
  past3MonthsPreset: false,
  past6MonthsPreset: false,
  withoutTodayPreset: false,
  withoutYesterdayPreset: false,
  emptyInitialRange: false,
  withoutTime: false,
});

interface EmitPayload {
  fromDate: string | null;
  toDate: string | null;
}

// emits
const emit = defineEmits<{
  onApply: [payload: EmitPayload];
}>();

// types
interface PresetDate {
  label: string;
  value: Date[];
  key: string;
  isVisible: boolean;
}

interface MonthYearObject {
  month: number;
  year: number;
}

// states
const openCalendar = ref(false);
const currentView = ref<string | null>(null);
const selectedDateRange = ref<string[]>(getInitialDateRange());
const selectedMonthRange = ref<MonthYearObject[]>(getCurrentMonthRange());

// computeds
const minDateObject = computed(() => {
  return props.minDate ? new Date(props.minDate) : null;
});

const maxDateObject = computed(() => {
  return props.maxDate ? new Date(props.maxDate) : null;
});

const minDateMoment = computed(() => {
  return minDateObject.value
    ? moment(minDateObject.value).startOf("day")
    : null;
});

const maxDateMoment = computed(() => {
  return maxDateObject.value ? moment(maxDateObject.value).endOf("day") : null;
});

const allPresets = computed((): PresetDate[] => {
  const today = moment();

  const basePresets: PresetDate[] = [
    {
      label: t("date_picker.today"),
      value: [
        today.clone().startOf("day").toDate(),
        today.clone().endOf("day").toDate(),
      ],
      key: "today",
      isVisible: !props.withoutTodayPreset,
    },
    {
      label: t("date_picker.yesterday"),
      value: [
        today.clone().subtract(1, "days").startOf("day").toDate(),
        today.clone().subtract(1, "days").endOf("day").toDate(),
      ],
      key: "yesterday",
      isVisible: !props.withoutYesterdayPreset,
    },
    {
      label: t("date_picker.tomorrow"),
      value: [
        today.clone().add(1, "days").startOf("day").toDate(),
        today.clone().add(1, "days").endOf("day").toDate(),
      ],
      key: "tomorrow",
      isVisible: props.tomorrowPreset === true,
    },
    {
      label: t("date_picker.past_7_days"),
      value: [
        today.clone().subtract(6, "days").startOf("day").toDate(),
        today.clone().endOf("day").toDate(),
      ],
      key: "past-7-days",
      isVisible: true,
    },
    {
      label: t("date_picker.past_30_days"),
      value: [
        today.clone().subtract(30, "days").startOf("day").toDate(),
        today.clone().endOf("day").toDate(),
      ],
      key: "past-30-days",
      isVisible: true,
    },
    {
      label: t("date_picker.this_month"),
      value: [
        today.clone().startOf("month").toDate(),
        today.clone().endOf("month").toDate(),
      ],
      key: "this-month",
      isVisible: true,
    },
    {
      label: t("date_picker.past_month"),
      value: [
        today.clone().subtract(1, "months").startOf("month").toDate(),
        today.clone().subtract(1, "months").endOf("month").toDate(),
      ],
      key: "past-month",
      isVisible: true,
    },
    {
      label: t("date_picker.past_3_month"),
      value: [
        today.clone().subtract(3, "months").startOf("month").toDate(),
        today.clone().endOf("day").toDate(),
      ],
      key: "past-3-month",
      isVisible: props.past3MonthsPreset === true,
    },
    {
      label: t("date_picker.past_6_month"),
      value: [
        today.clone().subtract(6, "months").startOf("month").toDate(),
        today.clone().endOf("day").toDate(),
      ],
      key: "past-6-monthes",
      isVisible: props.past6MonthsPreset === true,
    },
    {
      label: t("date_picker.past_year"),
      value: [
        today.clone().subtract(1, "years").startOf("month").toDate(),
        today.clone().endOf("day").toDate(),
      ],
      key: "past-year",
      isVisible: shouldShowPastYearPreset(),
    },
    {
      label: t("labels.select_month"),
      value: [],
      key: "select-month",
      isVisible: true,
    },
    {
      label: t("labels.select_date"),
      value: [],
      key: "select-date",
      isVisible: true,
    },
    {
      label: "",
      value: [
        today.clone().subtract(3, "years").startOf("year").toDate(),
        today.clone().endOf("day").toDate(),
      ],
      key: "past-3-year",
      isVisible: false,
    },
  ];

  return props.customPresetDates
    ? [...basePresets, ...props.customPresetDates]
    : basePresets;
});

const visiblePresets = computed(() => {
  return allPresets.value.filter(isPresetVisible);
});

const displayedDateRange = computed(() => {
  if (
    props.emptyInitialRange &&
    !selectedDateRange.value[0] &&
    !selectedDateRange.value[1]
  ) {
    return t("select_date_range");
  }

  const from = moment(selectedDateRange.value[0] || new Date()).format(
    "DD.MM.YYYY",
  );
  const to = moment(selectedDateRange.value[1] || new Date()).format(
    "DD.MM.YYYY",
  );

  return \`\${from} - \${to}\`;
});

// lifecycle Hooks
onMounted(() => {
  if (props.emptyInitialRange) {
    return;
  }

  if (props.defaultPreset && !props.initialFromDate && !props.initialToDate) {
    applyDefaultPreset();
  } else if (
    !props.defaultPreset &&
    !props.initialFromDate &&
    !props.initialToDate
  ) {
    currentView.value = "today";
  }

  applyDateRange(selectedDateRange.value);
});

watch(
  () => [props.initialFromDate, props.initialToDate],
  ([newFrom, newTo]) => {
    if (newFrom && newTo) {
      selectedDateRange.value = [
        moment(newFrom).format("YYYY-MM-DD"),
        moment(newTo).format("YYYY-MM-DD"),
      ];
    }
  },
);

// methods
function getInitialDateRange(): string[] {
  if (props.emptyInitialRange) {
    return ["", ""];
  }

  const from = props.initialFromDate
    ? moment(props.initialFromDate).format("YYYY-MM-DD")
    : moment().format("YYYY-MM-DD");

  const to = props.initialToDate
    ? moment(props.initialToDate).format("YYYY-MM-DD")
    : moment().format("YYYY-MM-DD");

  return [from, to];
}

function getCurrentMonthRange(): MonthYearObject[] {
  const now = new Date();
  return [
    { month: now.getMonth(), year: now.getFullYear() },
    { month: now.getMonth(), year: now.getFullYear() },
  ];
}

function shouldShowPastYearPreset(): boolean {
  return !window.location.hostname.includes(".com");
}

function isPresetVisible(preset: PresetDate): boolean {
  if (!preset.isVisible) {
    return false;
  }

  const hasDateRange =
    preset.value.length === 2 && preset.value[0] && preset.value[1];

  if (!hasDateRange) {
    return true;
  }

  const presetStart = moment(preset.value[0]).startOf("day");
  const presetEnd = moment(preset.value[1]).startOf("day");

  if (minDateMoment.value && presetEnd.isBefore(minDateMoment.value, "day")) {
    return false;
  }

  if (maxDateMoment.value && presetStart.isAfter(maxDateMoment.value, "day")) {
    return false;
  }

  return true;
}

function isDateRangeWithinBounds(
  start: moment.Moment,
  end: moment.Moment,
): boolean {
  if (minDateMoment.value && start.isBefore(minDateMoment.value, "day")) {
    return false;
  }

  if (maxDateMoment.value && end.isAfter(maxDateMoment.value, "day")) {
    return false;
  }

  return true;
}

function formatDateRange(dates: (Date | string)[]): string[] {
  return dates.map((date) => moment(date).format("YYYY-MM-DD"));
}

function createEmitPayload(
  from: Date | string,
  to: Date | string,
): EmitPayload {
  if (props.withoutTime) {
    return {
      fromDate: moment(from).format("YYYY-MM-DD"),
      toDate: moment(to).format("YYYY-MM-DD"),
    };
  }

  return {
    fromDate: moment(from).startOf("day").utc().format(),
    toDate: moment(to).endOf("day").utc().format(),
  };
}

function findMatchingPreset(
  from: moment.Moment,
  to: moment.Moment,
): PresetDate | undefined {
  return allPresets.value.find((preset) => {
    if (preset.value.length !== 2) {
      return false;
    }

    const presetFrom = moment(preset.value[0]).startOf("day");
    const presetTo = moment(preset.value[1]).startOf("day");

    return presetFrom.isSame(from, "day") && presetTo.isSame(to, "day");
  });
}

function updateMonthRangeFromDates(dates: (Date | string)[]) {
  const from = moment(dates[0]);
  const to = moment(dates[1]);

  const fromMonth = from.month();
  const fromYear = from.year();
  const toMonth = to.month();
  const toYear = to.year();

  const isSameMonth = fromMonth === toMonth;
  const isSameYear = fromYear === toYear;

  if (isSameMonth && isSameYear) {
    selectedMonthRange.value = [
      { month: fromMonth, year: fromYear },
      { month: fromMonth, year: fromYear },
    ];
  } else {
    selectedMonthRange.value = [
      { month: fromMonth, year: fromYear },
      { month: toMonth, year: toYear },
    ];
  }
}

function applyDateRange(dates: (Date | string)[]) {
  if (props.emptyInitialRange && (!dates[0] || !dates[1])) {
    selectedDateRange.value = ["", ""];
    emit("onApply", { fromDate: null, toDate: null });
    openCalendar.value = false;
    return;
  }

  selectedDateRange.value = formatDateRange(dates);

  const payload = createEmitPayload(dates[0], dates[1]);
  emit("onApply", payload);

  openCalendar.value = false;

  updateMonthRangeFromDates(dates);
  updateCurrentView(dates);
}

function updateCurrentView(dates: (Date | string)[]) {
  const from = moment(dates[0]).startOf("day");
  const to = moment(dates[1]).startOf("day");

  const matchingPreset = findMatchingPreset(from, to);
  currentView.value = matchingPreset?.key || null;
}

function handleDateSelection(dates: (Date | string)[]) {
  applyDateRange(dates);
}

function handleMonthSelection(months: MonthYearObject[]) {
  const fromDate = new Date(months[0].year, months[0].month, 1);
  const toDate = new Date(
    months[1].year,
    months[1].month + 1,
    0,
    23,
    59,
    59,
    999,
  );
  applyDateRange([fromDate, toDate]);
}

function handlePresetClick(preset: PresetDate) {
  if (preset.key === "select-date" || preset.key === "select-month") {
    currentView.value = preset.key;
  } else {
    applyDateRange(preset.value);
  }
}

function applyDefaultPreset() {
  const preset = allPresets.value.find((p) => p.key === props.defaultPreset);

  if (preset) {
    handlePresetClick(preset);
  }
}

function navigateByDays(days: number) {
  if (
    props.emptyInitialRange &&
    (!selectedDateRange.value[0] || !selectedDateRange.value[1])
  ) {
    const today = new Date();
    applyDateRange([today, today]);
    return;
  }

  const newFrom = moment(selectedDateRange.value[0] || new Date())
    .add(days, "days")
    .startOf("day");

  const newTo = moment(selectedDateRange.value[1] || new Date())
    .add(days, "days")
    .endOf("day");

  if (!isDateRangeWithinBounds(newFrom, newTo)) {
    return;
  }

  applyDateRange([newFrom.toDate(), newTo.toDate()]);
}

function navigateToNextDay() {
  navigateByDays(1);
}

function navigateToPreviousDay() {
  navigateByDays(-1);
}

function closeCalendar() {
  openCalendar.value = false;
}

function toggleCalendar() {
  openCalendar.value = !openCalendar.value;
}

function isClearable(): boolean {
  const preset = allPresets.value.find((p) => p.key === props.defaultPreset);

  const comparisonDate = preset
    ? moment(preset.value[0]).format("YYYY-MM-DD")
    : moment().format("YYYY-MM-DD");

  return comparisonDate !== selectedDateRange.value[0];
}

function reset() {
  if (props.emptyInitialRange) {
    selectedDateRange.value = ["", ""];
    currentView.value = null;
    emit("onApply", { fromDate: null, toDate: null });
    return;
  }

  const preset = allPresets.value.find((p) => p.key === props.defaultPreset);

  if (preset) {
    selectedDateRange.value = formatDateRange(preset.value);
    currentView.value = preset.key;
  } else {
    const today = moment().format("YYYY-MM-DD");
    selectedDateRange.value = [today, today];
    currentView.value = "today";
  }

  applyDateRange(selectedDateRange.value);
}

defineExpose({
  onApply: applyDateRange,
  isClearable,
  onReset: reset,
});
<\/script>

<style scoped lang="scss">
.form-field {
  user-select: none;
  height: 40px;
  position: relative;

  .calendar-container {
    user-select: none;
    position: relative;

    .label {
      position: absolute;
      left: 46px;
      top: -10px;
      user-select: none;
      background: theme("colors.neutral.0");
      font-family: "Inter", sans-serif;
      font-size: 13px;
      color: theme("colors.neutral.600");
      z-index: 12;
      line-height: 12px;
      font-weight: 400;
      padding: 0 4px;
      display: flex;
      align-items: center;
      gap: 0 4px;
    }

    .calendar-input {
      border: 1px solid #e1e4e4;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      float: right;
      width: 260px;
      min-width: 200px;
      background: theme("colors.neutral.0");
      padding: 8px 36px 8px 50px;
      position: relative;
      align-items: center;

      .center-content {
        position: relative;
        display: flex;
        align-items: center;
        font-weight: 500;
        width: 100%;
        font-size: 14px;
        line-height: 22px;
        font-family: "Inter", sans-serif;
        color: theme("colors.neutral.600");
        gap: 10px;
        justify-items: end;
      }

      .right-section,
      .left-section {
        height: 38px;
        width: 36px;
        transition:
          width 0.3s ease-in-out,
          background 0.3s ease-in-out;
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        right: 0;
        top: 0;
        z-index: 11;
      }

      .left-section {
        padding-right: 3px;
        border-right: 1px solid #d2d7d7;
        left: 0;
      }

      .right-section {
        border-left: 1px solid #d2d7d7;
      }

      .icon .dp__icon {
        width: 18px;
        height: 18px;
        color: theme("colors.neutral.600");
      }
    }

    .disabled-calendar-input {
      background: #f7fafa;
    }

    .range-calendar-content {
      position: absolute;
      top: 52px;
      right: 0;
      box-shadow: 0px 4px 18px 0px #00000014;
      z-index: 111 !important;
      width: fit-content;
      border-radius: 8px;
      background: white;
      border: 1px solid #e1e4e4;
      display: flex;

      .left-content {
        width: fit-content;
        border-right: 1px solid #d2d7d7;
      }

      .right-content {
        border-radius: 8px;
        position: relative;
        width: 170px;
        padding: 10px 5px;

        .item {
          display: block;
          font-weight: 400;
          font-size: 14px;
          font-family: "Inter", sans-serif;
          color: theme("colors.neutral.600");
          padding: 5px 12px;
          cursor: pointer;
          border-radius: 8px;
        }

        .item:hover {
          background: rgba(27, 118, 118, 0.05);
          color: #299b9b;
        }

        .item-a {
          display: block;
          font-weight: 400;
          font-size: 14px;
          font-family: "Inter", sans-serif;
          padding: 5px 12px;
          cursor: pointer;
          border-radius: 8px;
          background: rgba(27, 118, 118, 0.05);
          color: #299b9b;
        }

        .arr {
          width: 12px;
          height: 12px;
          background: white;
          border-left: 1px solid #d2d7d7;
          border-top: 1px solid #d2d7d7;
          transform: rotate(45deg);
          position: absolute;
          top: -6.6px;
          left: 50%;
        }
      }
    }
  }
}
</style>
`;export{n as default};
