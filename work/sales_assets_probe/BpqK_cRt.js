const e=`<template>
  <div
    class="flex border-b border-neutral-100 hover:bg-neutral-50"
    :class="{
      'bg-red-500/10 border-l-4 border-l-red-500': status === 'danger',
      'bg-green-500/10 border-l-4 border-l-green-500': status === 'success',
      'bg-yellow-500/10 border-l-4 border-l-yellow-500': status === 'warning',
    }"
  >
    <div class="w-[40%] p-3 border-r border-neutral-100 flex items-start">
      <span
        class="font-mono text-xs text-neutral-600 break-all leading-relaxed"
      >
        {{ entry.key }}
      </span>
    </div>
    <div class="w-[60%] py-2 px-3 flex items-start">
      <d-input
        ref="inputRef"
        :value="displayValue"
        :placeholder="placeholder"
        pattern-type="comment"
        borderless
        class="w-full"
        @change="onInput"
        @focus="adjustHeight"
        @blur="resetHeight"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FlattenedEntry } from "~/utils/localization-helpers";

// Props
const props = defineProps<{
  entry: FlattenedEntry;
  side: "left" | "right";
  status?: "danger" | "warning" | "success";
}>();

// Emits
const emit = defineEmits<{
  (e: "update", payload: { key: string; value: string }): void;
}>();

// Refs
const inputRef = ref<{ $el: HTMLElement } | null>(null);

// Computed
const displayValue = computed(() => {
  return props.side === "left" ? props.entry.ruValue : props.entry.targetValue;
});

const placeholder = computed(() => {
  if (props.entry.isMissing) return "Отсутствует перевод";
  if (props.entry.isExtra) return "Отсутствует в ru.json";
  return "";
});

// Methods
const onInput = (value: string) => {
  emit("update", { key: props.entry.key, value });
};

const adjustHeight = () => {
  const textarea = inputRef.value?.$el?.querySelector("textarea");
  if (textarea) {
    textarea.style.height = "auto";
    textarea.style.height = \`\${textarea.scrollHeight}px\`;
  }
};

const resetHeight = () => {
  const textarea = inputRef.value?.$el?.querySelector("textarea");
  if (textarea) {
    textarea.style.height = "";
  }
};
<\/script>
`;export{e as default};
