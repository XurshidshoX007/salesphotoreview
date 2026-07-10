const e=`<template>
  <template v-if="items">
    <div>
      <div
        :class="[
          'flex gap-4 flex-wrap items-center p-2.5 relative w-fit rounded-[10px] border-transition',
          error ? 'border-error' : 'border-grey',
        ]"
      >
        <Checkbox
          v-for="item in items"
          :key="item.id"
          :checked="isChecked(item.id)"
          :title="item.name"
          :disabled="disabled"
          @change="onToggle(item.id, $event)"
        />
        <div v-if="label" :class="['label', error && 'label--error']">
          {{ label }}{{ required ? "*" : "" }}
        </div>
      </div>
      <Transition name="error-msg">
        <div v-if="error && errorMessage" class="flex items-center gap-1 mt-1">
          <IconWarning color="#FF0000" :size="16" />
          <span class="text-xs" style="color: #ff0000">{{ errorMessage }}</span>
        </div>
      </Transition>
    </div>
  </template>
  <div v-else class="flex gap-2">
    <SkeletonRows v-for="i in 2" :key="i" :rows="1" :max-row-width="140" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  items?: BasicEntity<string | number>[];
  selectedItems?: (string | number)[];
  label?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
}>();

const emit = defineEmits<{
  (e: "update:selectedItems", value: (string | number)[]): void;
}>();

const isChecked = (id: string | number) => {
  return props.selectedItems?.includes(id) ?? false;
};

const onToggle = (id: string | number, checked: boolean) => {
  const current = props.selectedItems ? [...props.selectedItems] : [];
  if (checked) {
    if (!current.includes(id)) current.push(id);
  } else {
    const idx = current.indexOf(id);
    if (idx !== -1) current.splice(idx, 1);
  }
  emit("update:selectedItems", current);
};
<\/script>

<style scoped>
.label {
  position: absolute;
  left: 11px;
  top: -12px;
  padding: 0 5px;
  background: theme("colors.neutral.0");
  font-family: "Inter", sans-serif;
  font-size: 12px;
  color: theme("colors.neutral.600");
  font-weight: 400;
}

.label--error {
  color: #ff0000;
}

.border-transition {
  border: 1.5px solid transparent;
  transition: border-color 0.25s ease;
}

.border-grey {
  border-color: theme("colors.neutral.200");
}

.border-error {
  border-color: #ff0000;
}

.error-msg-enter-active,
.error-msg-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.error-msg-enter-from,
.error-msg-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
`;export{e as default};
