const n=`<template>
  <div
    class="flex items-center justify-center"
    :class="{
      'opacity-50 text-gray-7 cursor-not-allowed': props.disabled,
      'cursor-pointer': !props.disabled,
    }"
    @click="clickHandler"
  >
    <div
      class="arrow-button"
      :class="{ 'no-hover': props.disabled }"
      :style="arrowStyle"
    >
      <icon-left-pagination />
    </div>
  </div>
</template>

<script setup lang="ts">
// props
const props = defineProps<{
  disabled?: boolean;
  direction: "left" | "right" | "up" | "down";
}>();

// emits
const emit = defineEmits<{
  (e: "click"): void;
}>();

// state
const directionToDeg: Record<string, number> = {
  left: 0,
  up: -90,
  right: 180,
  down: 90,
};

// methods
const clickHandler = () => {
  if (!props.disabled) {
    emit("click");
  }
};

const arrowStyle = computed(() => {
  const deg = directionToDeg[props.direction || "left"];
  return {
    transform: \`rotate(\${deg}deg)\`,
  };
});
<\/script>

<style scoped>
.arrow-button {
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-button:hover {
  border: 1px solid #e1e4e4;
  border-radius: 8px;
}

.arrow-button.no-hover:hover {
  border: none;
  border-radius: 0;
}
</style>
`;export{n as default};
