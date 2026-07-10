const e=`<template>
  <div class="date-picker-section-for-gps">
    <d-input-date-picker
      ref="DatePickerComponent"
      :value="selectedDate"
      without-time
      without-label
      style="width: 100%"
      @change="onSelectDate"
    />
  </div>
</template>

<script setup lang="ts">
import moment from "moment";

// props
const props = defineProps<{
  selectedTime: string | null;
  selectedDate?: string;
}>();

// emits
const emit = defineEmits(["setDatePicker"]);

// states
const selectedDate = ref<string | Date>(props.selectedDate || new Date());
const route = useRoute();

// methods
const onSelectDate = (newDate: string) => {
  selectedDate.value = newDate;
};

const formatTimeToISO = (
  time: string | null,
  date: string | Date,
  timeChange: boolean,
): string => {
  const momentDate = moment(date, "YYYY-MM-DD");
  const today = moment().startOf("day");
  if (!momentDate.isValid()) return "";

  let hours: number;
  let minutes: number;

  if (momentDate.isBefore(today, "day") && !timeChange) {
    [hours, minutes] = moment()
      .subtract(1, "days")
      .endOf("day")
      .format("HH:mm")
      .split(":")
      .map(Number);
  } else {
    const momentTime = time || moment(props.selectedDate).format("HH:mm");
    if (!momentTime) return momentDate.toISOString();
    [hours, minutes] = momentTime.split(":").map(Number);
  }

  return momentDate
    .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 })
    .utc()
    .toISOString();
};

// hooks

watch([selectedDate], ([date]) => {
  if (date) {
    emit("setDatePicker", formatTimeToISO(props.selectedTime, date, false));
  }
});

watch(
  () => props.selectedTime,
  (time) => {
    emit("setDatePicker", formatTimeToISO(time, selectedDate.value, true));
  },
);

onMounted(() => {
  if (route.query.last_update_date) {
    selectedDate.value = route.query.last_update_date;
  } else {
    selectedDate.value = props.selectedDate || new Date();
  }
});
<\/script>

<style lang="scss">
.date-picker-section-for-gps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0 15px;
  width: 100%;

  .d-input-datepicker-content {
    width: calc(100% - 111px);
  }
}
</style>
`;export{e as default};
