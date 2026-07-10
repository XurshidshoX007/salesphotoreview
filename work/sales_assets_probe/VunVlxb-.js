const n=`<template>
  <flex-col>
    <flex-row class="items-center">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="relative flex flex-1 flex-col justify-center items-center"
      >
        <div class="flex items-center justify-center">
          <div :class="[cn(variantClasses.stepper()), getActiveClass(index)]">
            <div v-if="getIcon(index)" class="relative">
              <component
                :is="getIcon(index)"
                class="text-xl"
                :class="[getIconActiveClass(index)]"
              />
              <div
                v-if="variant === 'badge' && index < currentStep"
                class="border-2 border-white flex items-center justify-center size-4 absolute -top-3/5 -right-3/5 bg-primary-600 rounded-full"
              >
                <IconCheck color="#FFFFFF" :size="13" />
              </div>
            </div>
            <div v-else-if="index < currentStep">
              <IconCheck color="#fff" />
            </div>
            <div v-else>
              {{ step }}
            </div>
          </div>
        </div>
        <div v-if="index < steps.length - 1" :class="getLineClasses(index)" />
        <div
          class="w-fit mt-2"
          :class="[
            cn(labelClass),
            index <= currentStep ? 'text-primary-600 font-medium' : '',
          ]"
        >
          {{ labels[index] }}
        </div>
      </div>
    </flex-row>

    <div
      v-for="step in steps"
      :key="step"
      v-show="currentStep + 1 === step && slots[\`content-\${step}\`]"
      class="pt-7"
    >
      <div>
        <slot :name="\`content-\${step}\`" />
      </div>
    </div>
  </flex-col>
</template>

<script setup lang="ts">
import type { HTMLAttributes, Slot } from "vue";
import { cn } from "#imports";
import { stepperVariants } from "./variants";

// Types
type PropsType = {
  totalSteps: number;
  labels?: string[];
  icons?: Component[];
  labelClass?: HTMLAttributes["class"];
  variant?: keyof typeof stepperVariants.variants.variant;
};
type AttachDialogSlots = {
  [key: string]: Slot;
};

// Props
const props = withDefaults(defineProps<PropsType>(), {
  totalSteps: 0,
});

// Slots
defineSlots<AttachDialogSlots>();
const slots = useSlots() as AttachDialogSlots;

// states
const currentStep = ref(0);
const steps: number[] = Array.from(
  { length: props.totalSteps },
  (_, i) => i + 1,
);

// hooks
const labels = computed(() => props.labels || []);

const variantClasses = computed(() =>
  stepperVariants({
    variant: props.variant,
  }),
);

// methods
const getLineClasses = (index: number) => {
  const position = !!labels.value[index] ? "top-[28%]" : "top-[50%]";
  return [
    cn(variantClasses.value.stepLine()),
    position,
    props.variant !== "badge" && index < currentStep.value
      ? cn(variantClasses.value.active())
      : "",
  ];
};

const getIcon = (index: number) => {
  return props.icons ? props.icons[index] : null;
};

const nextStep = () => {
  if (currentStep.value < props.totalSteps - 1) {
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const getActiveClass = (index: number) => {
  const isActive =
    props.variant === "badge"
      ? index === currentStep.value
      : index <= currentStep.value;

  return isActive ? cn(variantClasses.value.active()) : "";
};

const getIconActiveClass = (index: number) => {
  const isActive =
    props.variant === "badge"
      ? index === currentStep.value
      : index <= currentStep.value;

  return isActive ? "text-white" : "text-primary-600";
};

// expose methods
defineExpose({
  nextStep,
  previousStep,
});
<\/script>
`;export{n as default};
