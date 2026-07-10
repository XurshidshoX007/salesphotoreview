const n=`<template>
  <div class="accordion-item" :class="[itemClasses]">
    <div class="accordion-header" :class="[headerClasses]" @click="toggle">
      <div class="accordion-icon">
        <IconMinus color="#299B9B" v-if="isOpen" />
        <IconPlus v-else />
      </div>
      <div
        class="accordion-title"
        :class="{ 'accordion-title--active': isOpen }"
      >
        {{ title }}
      </div>
    </div>
    <TransitionExpand :is-open="isOpen">
      <div class="accordion-body">
        <slot />
      </div>
    </TransitionExpand>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    title: string;
    isOpen?: boolean;
    nested?: boolean;
    bordered?: boolean;
    root?: boolean;
  }>(),
  {
    isOpen: false,
    nested: false,
    bordered: false,
    root: false,
  },
);

const emit = defineEmits<{
  (e: "toggle", isOpen: boolean): void;
}>();

// Lazy rendering - only render content after opened once
const hasBeenOpened = ref(props.isOpen);

watch(
  () => props.isOpen,
  (open) => {
    if (open && !hasBeenOpened.value) {
      hasBeenOpened.value = true;
    }
  },
);

const itemClasses = computed(() => ({
  "accordion-item--nested": props.nested,
  "accordion-item--bordered": props.bordered,
}));

const headerClasses = computed(() => ({
  "accordion-header--active": props.isOpen,
  "accordion-header--root": props.root,
}));

const toggle = () => {
  emit("toggle", !props.isOpen);
};
<\/script>

<style scoped>
.accordion-item {
  background-color: #fafdfd;
}

.accordion-item--nested {
  padding-left: 16px;
}

.accordion-item--bordered {
  border-bottom: 1px solid #e1e4e4;
}

.accordion-header {
  padding: 9px 14px;
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 4px;
}

.accordion-header--root {
  padding: 14px;
}

.accordion-header--root .accordion-title {
  font-size: 16px;
}

.accordion-icon {
  width: 20px;
  flex-shrink: 0;
}

.accordion-title {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: #424f4f;
}

.accordion-title--active {
  color: #299b9b;
}

.accordion-header:hover .accordion-title {
  color: #299b9b;
}

.accordion-body {
  background-color: #fafdfd;
}
</style>
`;export{n as default};
