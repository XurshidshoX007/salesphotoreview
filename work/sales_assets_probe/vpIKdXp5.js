const n=`<template>
  <div class="time-range-picker">
    <VueDatePicker
      v-model="timeRange"
      :time-picker="true"
      range
      teleport
      locale="ru"
      :clearable="false"
      auto-apply
      position="left"
      @update:model-value="validateTimeRange"
    />
    <div v-if="labels" class="label">
      {{ labels }}
    </div>
  </div>
</template>
<script setup lang="ts">
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
// Reactive time range
const timeRange = ref([
  { hours: 8, minutes: 0 },
  { hours: 20, minutes: 0 },
]);

// props
const props = defineProps({
  labels: String,
  range_time: {
    from_value: String,
    to_value: String,
  },
});

//emits
const emit = defineEmits(["changeTimePicker"]);

// Validate the time range
const validateTimeRange = (newValue) => {
  const [startTime, endTime] = newValue || [];

  if (startTime && endTime) {
    const { hours: startHours, minutes: startMinutes } = startTime;
    const { hours: endHours, minutes: endMinutes } = endTime;

    // Check if the start time exceeds the end time
    if (
      startHours > endHours ||
      (startHours > endHours && startMinutes > endMinutes)
    ) {
      timeRange.value = [startTime, null]; // Reset invalid end time
    }
  }

  if (endTime) {
    const { hours: endHours, minutes: endMinutes } = endTime;

    if (endHours > 23 || (endHours === 23 && endMinutes > 59)) {
      timeRange.value = [startTime, null]; // Reset invalid end time
    }
  }
  setTimePicker();
};

const setTimePicker = () => {
  const range_picker = {
    from_value: formatTime(timeRange.value[0]),
    to_value: formatTime(timeRange.value[1]),
  };
  emit("changeTimePicker", range_picker);
};

const formatTime = (timeObject: {
  hours: number;
  minutes: number;
  seconds: number;
}) => {
  const formattedTime = [
    String(timeObject.hours).padStart(2, "0"),
    String(timeObject.minutes).padStart(2, "0"),
    String(timeObject.seconds).padStart(2, "0"),
  ].join(":");
  return formattedTime;
};

const updateSelectedTime = () => {
  if (props.range_time) {
    const parseTime = (timeString: string) => {
      const [hours, minutes, seconds] = timeString
        .trim()
        .split(":")
        .map(Number);
      return { hours, minutes, seconds };
    };

    const { from_value, to_value } = props.range_time;
    timeRange.value = [parseTime(from_value), parseTime(to_value)];
  }
};

// hooks

onMounted(() => {
  updateSelectedTime();
});

watch(
  () => props.range_time,
  () => {
    updateSelectedTime();
  },
);
<\/script>
<style lang="scss">
.time-range-picker {
  position: relative;
  .label {
    position: absolute;
    left: 11px;
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
