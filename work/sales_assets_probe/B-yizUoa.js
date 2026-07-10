const n=`<template>
  <div class="time-line-content">
    <div class="slider-container">
      <vue-slider
        v-model="selectedTime"
        :railStyle="{
          top: '-3px',
          position: 'relative',
          background: 'white !important',
          height: '34px !important',
          paddingLeft: '12px',
        }"
        :stepStyle="{
          display: 'none',
        }"
        :labelStyle="{
          top: '6px',
          marginTop: '0px',
          fontSize: '14px',
          fontWeight: '500',
          color: '#299b9b',
          marginLeft: '0px',
        }"
        :processStyle="{
          background: '#05a9a933 !important',
          borderRadius: '8px 0 0 8px !important',
        }"
        :dotStyle="{
          marginLeft: '0px',
        }"
        tooltip="none"
        :data="timeOptions"
        :enable-cross="false"
        :marks="hourMarks"
        :dot-size="16"
        :height="4"
        @drag-start="onDragging"
        @drag-end="updateTimeSlider"
        @change="onSliderChange"
        class="custom-slider"
      >
        <template #dot="{ value }">
          <div class="custom-dot">
            {{ value }}
          </div>
        </template>
      </vue-slider>
    </div>
  </div>
</template>

<script setup lang="ts">
import VueSlider from "vue-3-slider-component";
import moment from "moment";

// props
const props = defineProps<{
  selectedDate: string;
}>();

// emits
const emit = defineEmits(["setDatePicker"]);

// state
const route = useRoute();
const isDragging = ref(false);

const selectedTime = ref(
  route.query.last_update_date
    ? moment.utc(route.query.last_update_date).format("HH:mm")
    : moment().format("HH:mm")
);

// hooks
const timeOptions = computed(() =>
  Array.from({ length: 1440 }, (_, i) => {
    const hour = Math.floor(i / 60);
    const minute = i % 60;
    return \`\${String(hour).padStart(2, "0")}:\${String(minute).padStart(
      2,
      "0"
    )}\`;
  })
);

const hourMarks = computed(() =>
  Object.fromEntries(
    Array.from({ length: 24 }, (_, i) => {
      const hourLabel = String(i).padStart(2, "0");
      return [hourLabel + ":00", hourLabel];
    })
  )
);

watch(
  () => props.selectedDate,
  (date) => {
    selectedTime.value = moment(date).format("HH:mm");
  }
);

onMounted(() => {
  selectedTime.value = moment(props.selectedDate).format("HH:mm");
});

// methods
const onSliderChange = () => {
  if (!isDragging.value) {
    updateTimeSlider();
  }
};

const updateTimeSlider = () => {
  isDragging.value = false;
  emit("setDatePicker", selectedTime.value);
};

const onDragging = () => {
  isDragging.value = true;
};
<\/script>

<style lang="scss" scoped>
.time-line-content {
  padding: 20px 50px 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .slider-container {
    width: calc(100%);
    position: relative;
    height: 34px;
  }

  // Target the process bar directly
  :deep(.vue-slider-process) {
    left: 0 !important;
    transform: translateX(-6px) !important;
    padding-left: 6px !important;
  }
}

.custom-slider {
  width: 100%;
  padding: 5px 0 !important;
}

.custom-dot {
  width: 50px;
  height: 34px;
  background-color: theme("colors.primary.300");
  padding: 7px 6px !important;
  color: white;
  border-radius: 8px;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  position: relative;
  top: -9px;
  cursor: grab !important;
  &:active {
    cursor: grabbing !important;
  }
}

/* Make sure the slider is interactive */
.vue-slider {
  cursor: pointer !important;
}
</style>
`;export{n as default};
