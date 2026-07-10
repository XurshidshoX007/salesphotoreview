const e=`<template>
  <div class="relative">
    <div class="w-full bottom-5">
      <VueDatePicker
        ref="DatePicker"
        time-picker
        :value="selectedTime"
        v-model="selectedTime"
        auto-apply
        :clearable="false"
        :disabled="disabled"
        :teleport="true"
        position="left"
        @update:model-value="applyDate"
      />
    </div>
    <div v-if="label" class="label">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

// props
const props = defineProps({
  selectedTime: String,
  label: String,
  disabled: Boolean,
});

// emits
const emit = defineEmits(["onSelectTime"]);

// states
const selectedTime = ref<Record<"hours" | "minutes" | "seconds", number>>({
  hours: 0,
  minutes: 0,
  seconds: 0,
});
// hooks
watch(selectedTime.value, () => {
  emit("onSelectTime", selectedTime.value);
});

onMounted(() => {
  updateSelectedTime();
});

// watch(() => props.selectedTime, () => {
//   if(props.updateSelected) {
//     updateSelectedTime()
//   }
// });

// methods

const applyDate = (value) => {
  emit("onSelectTime", value);
};

const updateSelectedTime = () => {
  if (props.selectedTime) {
    const [hours, minutes] = props.selectedTime.trim().split(":");
    selectedTime.value.hours = hours;
    selectedTime.value.minutes = minutes;
  }
};
<\/script>

<style lang="scss" scoped>
.label {
  position: absolute;
  left: 11px;
  top: -10px;
  padding: 0 5px;
  background-image: linear-gradient(180deg, theme("colors.neutral.0"), #fafdfd);
  font-family: "Inter", sans-serif;
  font-size: 13px;
  color: #424f4f;
  font-weight: 400;
}
</style>
`;export{e as default};
